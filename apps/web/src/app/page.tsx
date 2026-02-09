import AttestationWidget from "@/components/attestation-widget";
import { ModeToggle } from "@/components/mode-toggle";

export default function Home() {
    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center p-4">
            <main className="w-full max-w-lg">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-extrabold text-gray-800 dark:text-gray-100">
                        AccessGate<span className="text-indigo-600 dark:text-indigo-400">AI</span>
                    </h1>
                    <ModeToggle />
                </div>
                <AttestationWidget />
            </main>
        </div>
    );
}
