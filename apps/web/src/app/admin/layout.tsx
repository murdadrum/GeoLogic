"use client";

import Link from 'next/link';
import { ModeToggle } from '@/components/mode-toggle';
import { PurgeButton } from '@/components/purge-button';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-screen bg-[var(--secondary)]">
            <div className="w-64 bg-[var(--surface)] shadow-md border-r border-[var(--muted)]/80">
                <div className="p-6 border-b border-[var(--muted)]/80 flex justify-between items-center">
                    <div>
                        <h1 className="text-xl font-bold text-[var(--primary)]">GeoLogic</h1>
                        <p className="text-sm text-[var(--primary)]/70">Admin Console</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <PurgeButton />
                        <ModeToggle />
                    </div>
                </div>
                <nav className="mt-6 px-4 space-y-2">
                    <Link href="/admin/policies" className="block px-4 py-2 text-[var(--primary)]/85 hover:bg-[var(--accent)]/50 hover:text-[var(--primary)] rounded-md transition-colors">
                        Policies
                    </Link>
                    <Link href="/admin/audit" className="block px-4 py-2 text-[var(--primary)]/85 hover:bg-[var(--accent)]/50 hover:text-[var(--primary)] rounded-md transition-colors">
                        Audit Logs
                    </Link>
                    <Link href="/" className="block px-4 py-2 text-[var(--primary)]/80 hover:bg-[var(--muted)]/50 rounded-md transition-colors mt-8 text-sm">
                        ← Back to App
                    </Link>
                </nav>
            </div>
            <div className="flex-1 overflow-auto p-8 bg-[var(--secondary)]">
                {children}
            </div>
        </div>
    );
}
