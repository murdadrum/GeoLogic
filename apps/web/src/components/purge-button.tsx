"use client";

import { useState } from "react";

async function purgeBrowserData(): Promise<void> {
    try {
        localStorage.clear();
    } catch {}

    try {
        sessionStorage.clear();
    } catch {}

    try {
        const cookies = document.cookie ? document.cookie.split(";") : [];
        for (const cookie of cookies) {
            const eqPos = cookie.indexOf("=");
            const name = (eqPos > -1 ? cookie.slice(0, eqPos) : cookie).trim();
            if (!name) continue;
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
        }
    } catch {}

    try {
        if ("caches" in window) {
            const keys = await caches.keys();
            await Promise.all(keys.map((key) => caches.delete(key)));
        }
    } catch {}

    try {
        if ("serviceWorker" in navigator) {
            const registrations = await navigator.serviceWorker.getRegistrations();
            await Promise.all(registrations.map((registration) => registration.unregister()));
        }
    } catch {}

    try {
        if ("indexedDB" in window && "databases" in indexedDB) {
            const databases = await indexedDB.databases();
            await Promise.all(
                databases
                    .map((db) => db.name)
                    .filter((name): name is string => Boolean(name))
                    .map((name) => new Promise<void>((resolve) => {
                        const request = indexedDB.deleteDatabase(name);
                        request.onsuccess = () => resolve();
                        request.onerror = () => resolve();
                        request.onblocked = () => resolve();
                    }))
            );
        }
    } catch {}
}

export function PurgeButton() {
    const [purging, setPurging] = useState(false);

    const handlePurge = async () => {
        if (purging) return;
        const confirmed = window.confirm("Purge cached user data and refresh the app?");
        if (!confirmed) return;

        setPurging(true);
        await purgeBrowserData();
        window.location.reload();
    };

    return (
        <button
            type="button"
            onClick={handlePurge}
            disabled={purging}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                purging
                    ? "bg-[var(--muted)] text-[var(--primary)] cursor-not-allowed"
                    : "bg-[var(--destructive)] hover:opacity-90 text-white"
            }`}
        >
            {purging ? "Purging..." : "Purge"}
        </button>
    );
}
