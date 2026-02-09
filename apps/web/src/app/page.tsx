import AttestationWidget from "@/components/attestation-widget";

export default function Home() {
    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <main className="w-full max-w-lg">
                <h1 className="text-3xl font-extrabold text-center text-gray-800 mb-8">
                    AccessGate<span className="text-indigo-600">AI</span>
                </h1>
                <AttestationWidget />
            </main>
        </div>
    );
}
