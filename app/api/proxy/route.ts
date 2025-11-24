import { NextRequest, NextResponse } from "next/server";
import { rewriteHtml, rewriteCss } from "@/lib/proxy/url-rewriter";
import { decodeProxyUrl } from "@/lib/proxy/url-encoder";
import { filterHtml, shouldBlockUrl } from "@/lib/proxy/content-filter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Headers to strip from the upstream response (for anonymity)
const BLOCKED_HEADERS = [
    "x-frame-options",
    "content-security-policy",
    "content-security-policy-report-only",
    "x-xss-protection",
    "strict-transport-security",
    "access-control-allow-origin",
    "x-powered-by",
    "server",
    "content-encoding", // Remove this - fetch decompresses, but we don't want to tell browser it's compressed
];

// Headers to forward from client to upstream
const FORWARD_HEADERS = [
    "accept",
    "accept-language",
    // Removed "accept-encoding" - let fetch handle compression automatically
];

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);

        // Support both encoded (p) and plain (url) parameters for backward compatibility
        const encodedUrl = searchParams.get("p");
        const plainUrl = searchParams.get("url");

        let targetUrl: string | null = null;

        if (encodedUrl) {
            // Decode the obfuscated URL (Startpage-style)
            targetUrl = decodeProxyUrl(encodedUrl);
        } else if (plainUrl) {
            // Fallback to plain URL
            targetUrl = plainUrl;
        }

        if (!targetUrl) {
            return NextResponse.json(
                { error: "Invalid or missing URL parameter" },
                { status: 400 }
            );
        }

        // Validate URL
        let urlObj: URL;
        try {
            urlObj = new URL(targetUrl);
            if (urlObj.protocol !== "http:" && urlObj.protocol !== "https:") {
                return NextResponse.json(
                    { error: "Only HTTP and HTTPS protocols are supported" },
                    { status: 400 }
                );
            }
        } catch {
            return NextResponse.json(
                { error: "Invalid URL" },
                { status: 400 }
            );
        }

        // Check if URL should be blocked (ad blocking)
        const adBlockEnabled = searchParams.get("adBlock") !== "false";
        if (adBlockEnabled && shouldBlockUrl(targetUrl)) {
            return new NextResponse("Blocked by ad blocker", {
                status: 403,
                headers: { "Content-Type": "text/plain" },
            });
        }

        // Prepare headers for the upstream request
        // IMPORTANT: We don't forward user's IP or identifying headers (anonymity)
        const headers = new Headers();

        // Only forward safe headers
        FORWARD_HEADERS.forEach(headerName => {
            const value = request.headers.get(headerName);
            if (value) {
                headers.set(headerName, value);
            }
        });

        // DO NOT forward cookies from client to maintain anonymity
        // Each proxied site gets its own isolated session

        // Set generic browser headers (not user-specific)
        headers.set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36");
        headers.set("Referer", urlObj.origin);
        headers.set("Sec-Fetch-Dest", "document");
        headers.set("Sec-Fetch-Mode", "navigate");
        headers.set("Sec-Fetch-Site", "none");
        headers.set("Upgrade-Insecure-Requests", "1");

        // Fetch the target URL (proxy server fetches, not user)
        const response = await fetch(targetUrl, {
            headers,
            redirect: "follow",
        });

        if (!response.ok && response.status !== 304) {
            console.log(`Upstream error: ${response.status} for ${targetUrl}`);
        }

        const contentType = response.headers.get("content-type") || "";
        const isHtml = contentType.includes("text/html");
        const isCss = contentType.includes("text/css");
        const isJavaScript = contentType.includes("javascript") || contentType.includes("ecmascript");

        let body: BodyInit | null = null;

        if (isHtml) {
            let html = await response.text();

            // Apply ad blocking filter
            if (adBlockEnabled) {
                html = filterHtml(html);
            }

            // Rewrite ALL URLs to route through proxy (complete isolation)
            html = rewriteHtml(html, targetUrl);
            body = html;
        } else if (isCss) {
            let css = await response.text();
            // Rewrite URLs in CSS
            css = rewriteCss(css, targetUrl);
            body = css;
        } else if (isJavaScript) {
            // Pass through JavaScript (could add URL rewriting here too)
            body = await response.text();
        } else {
            // Binary content (images, fonts, etc.)
            body = await response.arrayBuffer();
        }

        // Prepare response headers
        const responseHeaders = new Headers();

        // Copy safe headers from upstream, excluding identifying ones
        response.headers.forEach((value, key) => {
            if (!BLOCKED_HEADERS.includes(key.toLowerCase())) {
                responseHeaders.set(key, value);
            }
        });

        // Set permissive security headers
        responseHeaders.set("Access-Control-Allow-Origin", "*");
        responseHeaders.set("X-Frame-Options", "SAMEORIGIN");
        responseHeaders.set("Content-Security-Policy", "frame-ancestors 'self'");

        // Remove any identifying headers
        responseHeaders.delete("X-Powered-By");
        responseHeaders.delete("Server");

        // DO NOT forward Set-Cookie to maintain session isolation
        // Each visit is completely anonymous and stateless

        return new NextResponse(body, {
            status: response.status,
            headers: responseHeaders,
        });

    } catch (error) {
        console.error("Proxy error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Internal server error" },
            { status: 500 }
        );
    }
}

// Handle POST requests for form submissions
export async function POST(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);

        const encodedUrl = searchParams.get("p");
        const plainUrl = searchParams.get("url");

        let targetUrl: string | null = null;

        if (encodedUrl) {
            targetUrl = decodeProxyUrl(encodedUrl);
        } else if (plainUrl) {
            targetUrl = plainUrl;
        }

        if (!targetUrl) {
            return NextResponse.json(
                { error: "Invalid or missing URL parameter" },
                { status: 400 }
            );
        }

        // Get the request body
        const body = await request.arrayBuffer();

        // Prepare headers (anonymous)
        const headers = new Headers();

        const contentType = request.headers.get("content-type");
        if (contentType) {
            headers.set("Content-Type", contentType);
        }

        headers.set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36");

        // Make the POST request
        const response = await fetch(targetUrl, {
            method: "POST",
            headers,
            body,
            redirect: "follow",
        });

        const responseBody = await response.arrayBuffer();
        const responseHeaders = new Headers();

        response.headers.forEach((value, key) => {
            if (!BLOCKED_HEADERS.includes(key.toLowerCase())) {
                responseHeaders.set(key, value);
            }
        });

        responseHeaders.set("Access-Control-Allow-Origin", "*");

        return new NextResponse(responseBody, {
            status: response.status,
            headers: responseHeaders,
        });

    } catch (error) {
        console.error("Proxy POST error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Internal server error" },
            { status: 500 }
        );
    }
}

