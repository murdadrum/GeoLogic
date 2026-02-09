"use client";

import { useState } from "react";

export default function AttestationWidget() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const validateLocation = () => {
        setLoading(true);
        setError(null);
        setResult(null);

        if (!navigator.geolocation) {
            setError("Geolocation is not supported by your browser");
            setLoading(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const { latitude, longitude, accuracy } = position.coords;

                    const response = await fetch("http://localhost:8000/v1/attestations", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            resource_id: "demo-resource",
                            gps: {
                                lat: latitude,
                                lon: longitude,
                                accuracy_m: accuracy,
                                captured_at: new Date().toISOString(),
                            },
                            client: {
                                user_agent: navigator.userAgent,
                            },
                        }),
                    });

                    if (!response.ok) {
                        throw new Error(`Error: ${response.statusText}`);
                    }

                    const data = await response.json();
                    setResult(data);
                } catch (err: any) {
                    setError(err.message || "An error occurred");
                } finally {
                    setLoading(false);
                }
            },
            (err) => {
                setError(`Geolocation error: ${err.message}`);
                setLoading(false);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
            }
        );
    };

    return (
        <div className="p-6 max-w-md mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 space-y-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Location Validator</h2>
            <p className="text-gray-600 dark:text-gray-400">
                Verify your location to access protected resources.
            </p>

            {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-md border border-red-200 dark:border-red-800">
                    {error}
                </div>
            )}

            {result && (
                <div className={`p-4 rounded-md border ${result.decision === 'ALLOW' ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800' : 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800'}`}>
                    <p className="font-bold">Decision: {result.decision}</p>
                    <p className="text-sm mt-1">{result.explanation_user}</p>
                    <div className="mt-2 text-xs opacity-80">
                        <p>Score: {result.score}</p>
                        <p>Code: {result.reason_codes.join(", ")}</p>
                    </div>
                </div>
            )}

            <button
                onClick={validateLocation}
                disabled={loading}
                className={`w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white 
          ${loading ? 'bg-indigo-400 dark:bg-indigo-500 cursor-not-allowed' : 'bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'}
        `}
            >
                {loading ? "Validating..." : "Validate Location"}
            </button>
        </div>
    );
}
