"use client";

import { useState, useEffect } from 'react';
import { buildApiUrl } from '@/lib/api';

interface AuditLogItem {
    attestation_id: string;
    timestamp: string | null;
    decision: string;
    resource_id: string;
    reason_codes?: string[];
    gps_lat?: number;
    gps_lon?: number;
}

export default function AuditPage() {
    const [logs, setLogs] = useState<AuditLogItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        setError(null);
        try {
            const res = await fetch(buildApiUrl('/v1/admin/audit?limit=50'));
            if (res.ok) {
                const data = await res.json();
                setLogs(data);
            } else {
                setError(`Error loading logs (${res.status})`);
            }
        } catch (err) {
            setError('Network error: backend is unreachable');
            console.error("Failed to fetch logs", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-[var(--primary)]">Audit Logs</h2>
                <button
                    onClick={fetchLogs}
                    className="px-3 py-2 text-sm bg-[var(--surface)] border border-[var(--muted)] rounded-md hover:bg-[var(--accent)]/40 text-[var(--primary)]"
                >
                    Refresh
                </button>
            </div>

            <div className="bg-[var(--surface)] rounded-lg shadow overflow-hidden border border-[var(--muted)]/80">
                {error && (
                    <div className="px-6 py-3 text-sm text-[var(--destructive)] border-b border-[var(--muted)]/80">
                        {error}
                    </div>
                )}
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 ">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Timestamp
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Decision
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Resource
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Risk
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Location (GPS)
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Details
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white  divide-y divide-gray-200 dark:divide-gray-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-4 text-center text-sm text-[var(--primary)]/70">
                                        Loading logs...
                                    </td>
                                </tr>
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-4 text-center text-sm text-[var(--primary)]/70">
                                        No logs found.
                                    </td>
                                </tr>
                            ) : (
                                logs.map((log) => (
                                    <tr key={log.attestation_id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--primary)]/70">
                                            {log.timestamp ? new Date(log.timestamp).toLocaleString() : '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${log.decision === 'ALLOW' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' :
                                                    log.decision === 'DENY' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400' :
                                                        'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400'}`}>
                                                {log.decision}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--primary)]">
                                            {log.resource_id}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--primary)]/70">
                                            {log.reason_codes && log.reason_codes.length > 0 ? (
                                                <div className="flex flex-wrap gap-1">
                                                    {log.reason_codes.map((code: string) => (
                                                        <span key={code} className="bg-gray-100  text-gray-600 dark:text-gray-300 px-1.5 py-0.5 rounded text-xs border border-gray-200 dark:border-gray-600">
                                                            {code}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-gray-400 dark:text-gray-500">Low</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--primary)]/70">
                                            {log.gps_lat && log.gps_lon ? (
                                                `${log.gps_lat.toFixed(4)}, ${log.gps_lon.toFixed(4)}`
                                            ) : (
                                                '-'
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 cursor-pointer">
                                            View
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
