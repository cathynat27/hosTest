// ⚠️ DEVELOPMENT ONLY - This file is excluded from production builds
// This utility helps you connect to Railway backend locally during development
// The configuration is read from .env.local and will NOT be deployed to Vercel

const DEV_ENABLED = process.env.NODE_ENV !== "production" && process.env.NEXT_PUBLIC_DEV_RAILWAY_ENABLED === "true";

export function getLocalRailwayUrl(): string | null {
    if (!DEV_ENABLED) {
        return null;
    }

    const url = process.env.NEXT_PUBLIC_LOCAL_BACKEND_URL?.trim();
    if (!url) {
        console.warn("Dev Railway config enabled but NEXT_PUBLIC_LOCAL_BACKEND_URL not set in .env.local");
        return null;
    }

    return url.replace(/\/+$/, ""); // Remove trailing slashes
}

export function isLocalDevMode(): boolean {
    return DEV_ENABLED;
}

export function getLocalHostname(): string | null {
    if (!DEV_ENABLED) {
        return null;
    }

    return process.env.NEXT_PUBLIC_LOCAL_HOSTNAME || "localhost";
}
