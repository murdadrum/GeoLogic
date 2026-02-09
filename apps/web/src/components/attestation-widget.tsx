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
        <div className="p-6 max-w-md mx-auto bg-white rounded-xl shadow-md space-y-4">
            <h2 className="text-xl font-bold text-gray-900">Location Validator</h2>
            <p className="text-gray-600">
                Verify your location to access protected resources.
            </p>

            {error && (
                <div className="p-4 bg-red-50 text-red-700 rounded-md">
                    {error}
                </div>
            )}

            {result && (
                <div className={`p-4 rounded-md ${result.decision === 'ALLOW' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
                    <p className="font-bold">Decision: {result.decision}</p>
                    <p className="text-sm mt-1">{result.explanation_user}</p>
                    <div className="mt-2 text-xs text-gray-500">
                        <p>Score: {result.score}</p>
                        <p>Code: {result.reason_codes.join(", ")}</p>
                    </div>
                </div>
            )}

            <button
                onClick={validateLocation}
                disabled={loading}
                className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
          ${loading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'}
        `}
            >
                {loading ? "Validating..." : "Validate Location"}
            </button>
        </div>
    );
}
