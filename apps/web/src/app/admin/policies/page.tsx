"use client";

import { useState, useEffect } from 'react';

export default function PoliciesPage() {
    const [policies, setPolicies] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [jsonContent, setJsonContent] = useState('');
    const [version, setVersion] = useState('');
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    // New state for AI
    const [prompt, setPrompt] = useState('');
    const [generating, setGenerating] = useState(false);

    useEffect(() => {
        fetchPolicies();
    }, []);

    const fetchPolicies = async () => {
        try {
            const res = await fetch('http://localhost:8000/v1/admin/policies');
            if (res.ok) {
                const data = await res.json();
                setPolicies(data);
                if (data.length > 0) {
                    // Load the latest policy into the editor
                    setJsonContent(JSON.stringify(data[0].content, null, 2));
                    // Pre-fill next version suggestion
                    const parts = data[0].version.split('.');
                    if (parts.length > 1) {
                        const lastNum = parseInt(parts[parts.length - 1]);
                        if (!isNaN(lastNum)) {
                            parts[parts.length - 1] = (lastNum + 1).toString();
                            setVersion(parts.join('.'));
                        } else {
                            setVersion(new Date().toISOString().split('T')[0] + '.1');
                        }
                    } else {
                        setVersion(new Date().toISOString().split('T')[0] + '.1');
                    }
                } else {
                    // Default template
                    setJsonContent(JSON.stringify({
                        allowed_countries: ["US", "CA"],
                        vpn_handling: { mode: "STEP_UP", allow_asn_orgs: [] },
                        gps_rules: { max_accuracy_m: 5000 }
                    }, null, 2));
                    setVersion(new Date().toISOString().split('T')[0] + '.1');
                }
            }
        } catch (err) {
            console.error("Failed to fetch policies", err);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerate = async () => {
        if (!prompt) return;
        setGenerating(true);
        setMessage(null);
        try {
            const res = await fetch('http://localhost:8000/v1/ai/policies/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt }),
            });
            if (res.ok) {
                const data = await res.json();
                setJsonContent(JSON.stringify(data.policy, null, 2));
                setMessage(`Success: ${data.summary}`);
            } else {
                setMessage('Error generating policy');
            }
        } catch (err) {
            setMessage('Network error');
        } finally {
            setGenerating(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);
        try {
            // Validate JSON
            let parsedContent;
            try {
                parsedContent = JSON.parse(jsonContent);
            } catch (e) {
                setMessage('Error: Invalid JSON');
                setSaving(false);
                return;
            }

            const res = await fetch('http://localhost:8000/v1/admin/policies', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    version: version,
                    content: parsedContent,
                    active: true // Auto-activate for now
                }),
            });

            if (res.ok) {
                setMessage('Policy saved successfully!');
                fetchPolicies(); // Refresh list
            } else {
                setMessage('Error saving policy');
            }
        } catch (err) {
            setMessage('Network error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Policy Management</h2>
                <div className="text-sm text-gray-500">
                    Define access rules in JSON format.
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Editor */}
                <div className="lg:col-span-2 space-y-4">

                    {/* AI Generator Box */}
                    <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-6 rounded-lg shadow-sm border border-indigo-100">
                        <h3 className="text-sm font-semibold text-indigo-900 mb-2 flex items-center gap-2">
                            ✨ Generate Policy with AI
                        </h3>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="e.g. Allow US and Canada, block VPNs, require high accuracy."
                                className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border p-2"
                            />
                            <button
                                onClick={handleGenerate}
                                disabled={generating || !prompt}
                                className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
                            ${generating ? 'bg-indigo-300' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                            >
                                {generating ? '...' : 'Go'}
                            </button>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <div className="mb-4 flex gap-4">
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Policy Version</label>
                                <input
                                    type="text"
                                    value={version}
                                    onChange={(e) => setVersion(e.target.value)}
                                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border p-2"
                                    placeholder="2026-02-09.1"
                                />
                            </div>
                        </div>

                        <label className="block text-sm font-medium text-gray-700 mb-1">Policy JSON</label>
                        <textarea
                            value={jsonContent}
                            onChange={(e) => setJsonContent(e.target.value)}
                            rows={15}
                            className="w-full font-mono text-sm border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border p-2 bg-gray-50"
                        />

                        <div className="mt-4 flex items-center justify-between">
                            {message && (
                                <span className={`text-sm ${message.includes('Error') ? 'text-red-600' : 'text-green-600'}`}>
                                    {message}
                                </span>
                            )}
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className={`ml-auto px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
                  ${saving ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                            >
                                {saving ? 'Saving...' : 'Save & Activate Policy'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* History Sidebar */}
                <div className="lg:col-span-1">
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">History</h3>
                        {loading ? (
                            <p className="text-gray-500 text-sm">Loading...</p>
                        ) : (
                            <ul className="space-y-3">
                                {policies.map((policy) => (
                                    <li key={policy.id} className="border-b pb-2 last:border-0 last:pb-0">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">{policy.version}</p>
                                                <p className="text-xs text-gray-500">{new Date(policy.created_at).toLocaleString()}</p>
                                            </div>
                                            {policy.active && (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                                    Active
                                                </span>
                                            )}
                                        </div>
                                    </li>
                                ))}
                                {policies.length === 0 && (
                                    <p className="text-gray-500 text-sm">No policies found.</p>
                                )}
                            </ul>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
