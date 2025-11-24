/**
 * URL encoding/decoding utilities for anonymous proxy
 * Similar to Startpage's Anonymous View
 */

import { createHash } from "crypto";

/**
 * Encode a URL into an obfuscated parameter
 * Uses base64 encoding for simplicity (could use encryption for production)
 */
export function encodeProxyUrl(url: string): string {
    // Base64 encode the URL to obfuscate it
    const encoded = Buffer.from(url).toString("base64url");

    // Add a simple checksum to prevent tampering
    const checksum = createHash("md5").update(url).digest("hex").substring(0, 8);

    return `${encoded}.${checksum}`;
}

/**
 * Decode an obfuscated URL parameter back to the original URL
 */
export function decodeProxyUrl(encoded: string): string | null {
    try {
        const [urlPart, checksum] = encoded.split(".");

        if (!urlPart || !checksum) {
            return null;
        }

        // Decode the URL
        const decoded = Buffer.from(urlPart, "base64url").toString("utf-8");

        // Verify checksum
        const expectedChecksum = createHash("md5").update(decoded).digest("hex").substring(0, 8);

        if (checksum !== expectedChecksum) {
            console.warn("Checksum mismatch - possible tampering");
            return null;
        }

        return decoded;
    } catch (e) {
        console.error("Failed to decode proxy URL:", e);
        return null;
    }
}

/**
 * Create a proxy URL for a given target URL
 */
export function createProxyUrl(targetUrl: string, proxyBase: string = "/api/proxy"): string {
    const encoded = encodeProxyUrl(targetUrl);
    return `${proxyBase}?p=${encoded}`;
}
