"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

function useIsClient() {
    return useSyncExternalStore(
        () => () => undefined,
        () => true,
        () => false
    );
}

export function ModeToggle() {
    const { setTheme, resolvedTheme } = useTheme();
    const isClient = useIsClient();

    if (!isClient) {
        return null;
    }

    const isDark = resolvedTheme === "dark";

    return (
        <button
            type="button"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className="p-2 rounded-md hover:bg-[var(--accent)]/70 transition-colors"
            aria-label="Toggle theme"
        >
            {isDark ? (
                <Sun className="h-[1.2rem] w-[1.2rem] text-[var(--primary)]" />
            ) : (
                <Moon className="h-[1.2rem] w-[1.2rem] text-[var(--primary)]" />
            )}
        </button>
    );
}
