import AttestationWidget from "@/components/attestation-widget";
import { ModeToggle } from "@/components/mode-toggle";
import { PurgeButton } from "@/components/purge-button";

export default function Home() {
    return (
        <div className="min-h-screen bg-[var(--secondary)] flex items-center justify-center p-4">
            <main className="w-full max-w-lg">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-extrabold text-[var(--primary)]">
                        GeoLogic
                    </h1>
                    <div className="flex items-center gap-2">
                        <PurgeButton />
                        <ModeToggle />
                    </div>
                </div>
                <AttestationWidget />
            </main>
        </div>
    );
}
