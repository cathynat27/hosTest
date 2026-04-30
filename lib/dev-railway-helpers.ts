// 🚀 DEVELOPMENT ONLY - Local Railway integration helper
// This file demonstrates how to use the dev Railway config in your API calls
// See lib/dev-railway-config.ts for the actual configuration

import { getLocalRailwayUrl, isLocalDevMode } from "@/lib/dev-railway-config";

/**
 * Returns the backend URL based on the environment
 * - Development: Uses local Railway URL if configured
 * - Production: Uses standard NEXT_PUBLIC_BACKEND_URL
 * 
 * @param fallbackUrl - The standard backend URL (from NEXT_PUBLIC_BACKEND_URL)
 * @returns The appropriate backend URL for the environment
 */
export function getEffectiveBackendUrl(fallbackUrl: string): string {
    if (isLocalDevMode()) {
        const localUrl = getLocalRailwayUrl();
        if (localUrl) {
            console.log("[Dev Mode] Using local Railway backend:", localUrl);
            return localUrl;
        }
    }
    return fallbackUrl;
}

/**
 * Utility to log the backend connection info for debugging
 */
export function logBackendConnectionInfo(): void {
    if (isLocalDevMode()) {
        const localUrl = getLocalRailwayUrl();
        const hostname = process.env.NEXT_PUBLIC_LOCAL_HOSTNAME || "localhost";

        console.group("🚀 Dev Railway Configuration");
        console.log("✅ Dev mode: ACTIVE");
        console.log("📍 Backend URL:", localUrl || "NOT SET - Check .env.local");
        console.log("📍 Local hostname:", hostname);
        console.log("⚠️  Remember to add this hostname to Railway CORS!");
        console.groupEnd();
    }
}
