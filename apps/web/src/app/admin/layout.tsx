"use client";

import Link from 'next/link';
import { ModeToggle } from '@/components/mode-toggle';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
            <div className="w-64 bg-white dark:bg-gray-800 shadow-md border-r border-gray-200 dark:border-gray-700">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <div>
                        <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">AccessGate AI</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Admin Console</p>
                    </div>
                    <ModeToggle />
                </div>
                <nav className="mt-6 px-4 space-y-2">
                    <Link href="/admin/policies" className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-md transition-colors">
                        Policies
                    </Link>
                    <Link href="/admin/audit" className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-md transition-colors">
                        Audit Logs
                    </Link>
                    <Link href="/" className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors mt-8 text-sm">
                        ← Back to App
                    </Link>
                </nav>
            </div>
            <div className="flex-1 overflow-auto p-8 bg-gray-50 dark:bg-gray-900">
                {children}
            </div>
        </div>
    );
}
