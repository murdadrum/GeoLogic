"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { buildApiUrl } from '@/lib/api';

type VpnMode = 'ALLOW' | 'STEP_UP' | 'DENY';

interface PolicyDraft {
    allowed_countries: string[];
    denied_countries: string[];
    vpn_handling: { mode: VpnMode; allow_asn_orgs: string[] };
    gps_rules: { max_accuracy_m: number; max_age_seconds: number };
    decision_scores: { ALLOW: number; STEP_UP: number; DENY: number };
}

interface PolicyHistoryItem {
    id: number;
    version: string;
    content: unknown;
    active: boolean;
    created_at: string;
}

const DEFAULT_POLICY: PolicyDraft = {
    allowed_countries: ["US", "CA"],
    denied_countries: [],
    vpn_handling: { mode: "STEP_UP", allow_asn_orgs: [] },
    gps_rules: { max_accuracy_m: 5000, max_age_seconds: 0 },
    decision_scores: { ALLOW: 0.9, STEP_UP: 0.5, DENY: 0.1 },
};

const normalizeCountryCodes = (value: unknown): string[] => {
    if (!Array.isArray(value)) return [];
    const result: string[] = [];
    const seen = new Set<string>();
    value.forEach((item) => {
        if (typeof item !== 'string') return;
        const code = item.trim().toUpperCase();
        if (code.length !== 2 || seen.has(code)) return;
        seen.add(code);
        result.push(code);
    });
    return result;
};

const toNumber = (value: unknown, fallback: number): number => {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : fallback;
};

const normalizePolicy = (value: unknown): PolicyDraft => {
    if (!value || typeof value !== 'object') {
        return { ...DEFAULT_POLICY };
    }

    const policy = value as Record<string, unknown>;
    const vpnHandling = typeof policy.vpn_handling === 'object' && policy.vpn_handling
        ? (policy.vpn_handling as Record<string, unknown>)
        : {};
    const gpsRules = typeof policy.gps_rules === 'object' && policy.gps_rules
        ? (policy.gps_rules as Record<string, unknown>)
        : {};
    const decisionScores = typeof policy.decision_scores === 'object' && policy.decision_scores
        ? (policy.decision_scores as Record<string, unknown>)
        : {};

    const allowed = normalizeCountryCodes(policy.allowed_countries);
    const denied = normalizeCountryCodes(policy.denied_countries);
    const deniedSet = new Set(denied);

    const modeValue = typeof vpnHandling.mode === 'string' ? vpnHandling.mode.toUpperCase() : 'STEP_UP';
    const mode: VpnMode = modeValue === 'ALLOW' || modeValue === 'DENY' || modeValue === 'STEP_UP'
        ? modeValue
        : 'STEP_UP';

    return {
        allowed_countries: allowed.filter((code) => !deniedSet.has(code)),
        denied_countries: denied,
        vpn_handling: {
            mode,
            allow_asn_orgs: Array.isArray(vpnHandling.allow_asn_orgs)
                ? vpnHandling.allow_asn_orgs.filter((item): item is string => typeof item === 'string')
                : [],
        },
        gps_rules: {
            max_accuracy_m: toNumber(gpsRules.max_accuracy_m, DEFAULT_POLICY.gps_rules.max_accuracy_m),
            max_age_seconds: toNumber(gpsRules.max_age_seconds, DEFAULT_POLICY.gps_rules.max_age_seconds),
        },
        decision_scores: {
            ALLOW: toNumber(decisionScores.ALLOW, DEFAULT_POLICY.decision_scores.ALLOW),
            STEP_UP: toNumber(decisionScores.STEP_UP, DEFAULT_POLICY.decision_scores.STEP_UP),
            DENY: toNumber(decisionScores.DENY, DEFAULT_POLICY.decision_scores.DENY),
        },
    };
};

const parseCountryInput = (value: string): string[] => {
    const seen = new Set<string>();
    return value
        .split(',')
        .map((item) => item.trim().toUpperCase())
        .filter((item) => item.length === 2)
        .filter((item) => {
            if (seen.has(item)) return false;
            seen.add(item);
            return true;
        });
};

export default function PoliciesPage() {
    const [policies, setPolicies] = useState<PolicyHistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [jsonContent, setJsonContent] = useState('');
    const [version, setVersion] = useState('');
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    const [prompt, setPrompt] = useState('');
    const [generating, setGenerating] = useState(false);

    const policyForControls = useMemo(() => {
        try {
            return normalizePolicy(JSON.parse(jsonContent));
        } catch {
            return null;
        }
    }, [jsonContent]);

    const setEditorPolicy = (policy: unknown) => {
        setJsonContent(JSON.stringify(normalizePolicy(policy), null, 2));
    };

    const updatePolicy = (updater: (current: PolicyDraft) => PolicyDraft) => {
        if (!policyForControls) {
            setMessage('Error: Fix JSON before using policy controls');
            return;
        }
        const next = updater(policyForControls);
        setJsonContent(JSON.stringify(normalizePolicy(next), null, 2));
    };

    const fetchPolicies = useCallback(async () => {
        try {
            const res = await fetch(buildApiUrl('/v1/admin/policies'));
            if (res.ok) {
                const data: PolicyHistoryItem[] = await res.json();
                setPolicies(data);
                if (data.length > 0) {
                    setEditorPolicy(data[0].content);
                    const parts = data[0].version.split('.');
                    if (parts.length > 1) {
                        const lastNum = parseInt(parts[parts.length - 1], 10);
                        if (!Number.isNaN(lastNum)) {
                            parts[parts.length - 1] = (lastNum + 1).toString();
                            setVersion(parts.join('.'));
                        } else {
                            setVersion(new Date().toISOString().split('T')[0] + '.1');
                        }
                    } else {
                        setVersion(new Date().toISOString().split('T')[0] + '.1');
                    }
                } else {
                    setEditorPolicy(DEFAULT_POLICY);
                    setVersion(new Date().toISOString().split('T')[0] + '.1');
                }
            } else {
                setMessage(`Error loading policies (${res.status})`);
            }
        } catch (error) {
            setMessage('Network error: backend is unreachable');
            console.error('Failed to fetch policies', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPolicies();
    }, [fetchPolicies]);

    const handleGenerate = async () => {
        if (!prompt) return;
        setGenerating(true);
        setMessage(null);
        try {
            const res = await fetch(buildApiUrl('/v1/ai/policies/generate'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt }),
            });
            if (res.ok) {
                const data = await res.json();
                setEditorPolicy(data.policy);
                setMessage(`Success: ${data.summary}`);
            } else {
                setMessage('Error generating policy');
            }
        } catch {
            setMessage('Network error');
        } finally {
            setGenerating(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);
        try {
            let parsedContent: PolicyDraft;
            try {
                parsedContent = normalizePolicy(JSON.parse(jsonContent));
            } catch {
                setMessage('Error: Invalid JSON');
                setSaving(false);
                return;
            }

            const res = await fetch(buildApiUrl('/v1/admin/policies'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    version,
                    content: parsedContent,
                    active: true,
                }),
            });

            if (res.ok) {
                setMessage('Policy saved successfully!');
                fetchPolicies();
            } else {
                setMessage('Error saving policy');
            }
        } catch {
            setMessage('Network error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Policy Management</h2>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                    Define access rules in JSON format.
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 p-6 rounded-lg shadow-sm border border-indigo-100 dark:border-indigo-800">
                        <h3 className="text-sm font-semibold text-indigo-900 dark:text-indigo-300 mb-2 flex items-center gap-2">
                            ✨ Generate Policy with AI
                        </h3>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="e.g. Allow US and Canada, block VPNs, require high accuracy."
                                className="flex-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-base border p-3"
                            />
                            <button
                                onClick={handleGenerate}
                                disabled={generating || !prompt}
                                className={`px-4 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white ${
                                    generating ? 'bg-indigo-300 dark:bg-indigo-600' : 'bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600'
                                }`}
                            >
                                {generating ? '...' : 'Go'}
                            </button>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                        <div className="mb-4 flex gap-4">
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Policy Version</label>
                                <input
                                    type="text"
                                    value={version}
                                    onChange={(e) => setVersion(e.target.value)}
                                    className="w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-base border p-3"
                                    placeholder="2026-02-09.1"
                                />
                            </div>
                        </div>

                        <div className="mb-6 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-4">
                            <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Decision Controls</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Allowed Countries (CSV)</label>
                                    <input
                                        type="text"
                                        disabled={!policyForControls}
                                        value={policyForControls ? policyForControls.allowed_countries.join(', ') : ''}
                                        onChange={(e) => updatePolicy((current) => ({ ...current, allowed_countries: parseCountryInput(e.target.value) }))}
                                        className="w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 rounded-md border p-2"
                                        placeholder="US, CA"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Denied Countries (CSV)</label>
                                    <input
                                        type="text"
                                        disabled={!policyForControls}
                                        value={policyForControls ? policyForControls.denied_countries.join(', ') : ''}
                                        onChange={(e) => updatePolicy((current) => ({ ...current, denied_countries: parseCountryInput(e.target.value) }))}
                                        className="w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 rounded-md border p-2"
                                        placeholder="GB, RU"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">VPN Handling</label>
                                    <select
                                        disabled={!policyForControls}
                                        value={policyForControls ? policyForControls.vpn_handling.mode : 'STEP_UP'}
                                        onChange={(e) => updatePolicy((current) => ({
                                            ...current,
                                            vpn_handling: { ...current.vpn_handling, mode: e.target.value as VpnMode },
                                        }))}
                                        className="w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 rounded-md border p-2"
                                    >
                                        <option value="ALLOW">ALLOW</option>
                                        <option value="STEP_UP">STEP_UP</option>
                                        <option value="DENY">DENY</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">GPS Max Accuracy (m)</label>
                                    <input
                                        type="number"
                                        min={0}
                                        disabled={!policyForControls}
                                        value={policyForControls ? policyForControls.gps_rules.max_accuracy_m : 0}
                                        onChange={(e) => updatePolicy((current) => ({
                                            ...current,
                                            gps_rules: { ...current.gps_rules, max_accuracy_m: Number(e.target.value) },
                                        }))}
                                        className="w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 rounded-md border p-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">GPS Max Age (seconds)</label>
                                    <input
                                        type="number"
                                        min={0}
                                        disabled={!policyForControls}
                                        value={policyForControls ? policyForControls.gps_rules.max_age_seconds : 0}
                                        onChange={(e) => updatePolicy((current) => ({
                                            ...current,
                                            gps_rules: { ...current.gps_rules, max_age_seconds: Number(e.target.value) },
                                        }))}
                                        className="w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 rounded-md border p-2"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Score: ALLOW</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min={0}
                                        max={1}
                                        disabled={!policyForControls}
                                        value={policyForControls ? policyForControls.decision_scores.ALLOW : 0.9}
                                        onChange={(e) => updatePolicy((current) => ({
                                            ...current,
                                            decision_scores: { ...current.decision_scores, ALLOW: Number(e.target.value) },
                                        }))}
                                        className="w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 rounded-md border p-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Score: STEP_UP</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min={0}
                                        max={1}
                                        disabled={!policyForControls}
                                        value={policyForControls ? policyForControls.decision_scores.STEP_UP : 0.5}
                                        onChange={(e) => updatePolicy((current) => ({
                                            ...current,
                                            decision_scores: { ...current.decision_scores, STEP_UP: Number(e.target.value) },
                                        }))}
                                        className="w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 rounded-md border p-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Score: DENY</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min={0}
                                        max={1}
                                        disabled={!policyForControls}
                                        value={policyForControls ? policyForControls.decision_scores.DENY : 0.1}
                                        onChange={(e) => updatePolicy((current) => ({
                                            ...current,
                                            decision_scores: { ...current.decision_scores, DENY: Number(e.target.value) },
                                        }))}
                                        className="w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 rounded-md border p-2"
                                    />
                                </div>
                            </div>

                            {!policyForControls && (
                                <p className="text-xs text-red-600 dark:text-red-400">Controls are disabled until JSON is valid.</p>
                            )}
                        </div>

                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Policy JSON</label>
                        <textarea
                            value={jsonContent}
                            onChange={(e) => setJsonContent(e.target.value)}
                            rows={15}
                            className="w-full font-mono text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border p-3"
                        />

                        <div className="mt-4 flex items-center justify-between">
                            {message && (
                                <span className={`text-sm ${message.includes('Error') ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                                    {message}
                                </span>
                            )}
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className={`ml-auto px-4 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white ${
                                    saving ? 'bg-indigo-400 dark:bg-indigo-600' : 'bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600'
                                }`}
                            >
                                {saving ? 'Saving...' : 'Save & Activate Policy'}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-1">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">History</h3>
                        {loading ? (
                            <p className="text-gray-500 dark:text-gray-400 text-sm">Loading...</p>
                        ) : (
                            <ul className="space-y-3">
                                {policies.map((policy) => (
                                    <li key={policy.id} className="border-b border-gray-200 dark:border-gray-700 pb-2 last:border-0 last:pb-0">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{policy.version}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(policy.created_at).toLocaleString()}</p>
                                            </div>
                                            {policy.active && (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
                                                    Active
                                                </span>
                                            )}
                                        </div>
                                    </li>
                                ))}
                                {policies.length === 0 && (
                                    <p className="text-gray-500 dark:text-gray-400 text-sm">No policies found.</p>
                                )}
                            </ul>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
