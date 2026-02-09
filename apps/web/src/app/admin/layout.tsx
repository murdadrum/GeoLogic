import Link from 'next/link';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-screen bg-gray-100">
            <div className="w-64 bg-white shadow-md">
                <div className="p-6 border-b">
                    <h1 className="text-xl font-bold text-gray-800">AccessGate AI</h1>
                    <p className="text-sm text-gray-500">Admin Console</p>
                </div>
                <nav className="mt-6 px-4 space-y-2">
                    <Link href="/admin/policies" className="block px-4 py-2 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-md transition-colors">
                        Policies
                    </Link>
                    <Link href="/admin/audit" className="block px-4 py-2 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-md transition-colors">
                        Audit Logs
                    </Link>
                    <Link href="/" className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-md transition-colors mt-8 text-sm">
                        ← Back to App
                    </Link>
                </nav>
            </div>
            <div className="flex-1 overflow-auto p-8">
                {children}
            </div>
        </div>
    );
}
