import { NextRequest, NextResponse } from "next/server";
import { rewriteHtml, rewriteCss } from "@/lib/proxy/url-rewriter";
import { filterHtml, shouldBlockUrl } from "@/lib/proxy/content-filter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Headers to strip from the upstream response
const BLOCKED_HEADERS = [
    "x-frame-options",
    "content-security-policy",
    "content-security-policy-report-only",
    "x-xss-protection",
    "strict-transport-security",
    "access-control-allow-origin",
];

// Headers to forward from client to upstream
const FORWARD_HEADERS = [
    "accept",
    "accept-language",
    "accept-encoding",
    "cache-control",
    "pragma",
];

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const targetUrl = searchParams.get("url");

        if (!targetUrl) {
            return NextResponse.json(
                { error: "URL parameter is required" },
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
        const headers = new Headers();

        // Forward relevant headers from the client
        FORWARD_HEADERS.forEach(headerName => {
            const value = request.headers.get(headerName);
            if (value) {
                headers.set(headerName, value);
            }
        });

        // Forward cookies
        const clientCookies = request.headers.get("cookie");
        if (clientCookies) {
            headers.set("Cookie", clientCookies);
        }

        // Set standard browser headers to avoid bot detection
        headers.set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36");
        headers.set("Referer", urlObj.origin);
        headers.set("Origin", urlObj.origin);
        headers.set("Sec-Fetch-Dest", "document");
        headers.set("Sec-Fetch-Mode", "navigate");
        headers.set("Sec-Fetch-Site", "cross-site");
        headers.set("Sec-Fetch-User", "?1");
        headers.set("Upgrade-Insecure-Requests", "1");

        // Fetch the target URL
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

            // Rewrite URLs to route through proxy
            html = rewriteHtml(html, targetUrl);
            body = html;
        } else if (isCss) {
            let css = await response.text();
            // Rewrite URLs in CSS
            css = rewriteCss(css, targetUrl);
            body = css;
        } else if (isJavaScript) {
            // For JavaScript, we pass it through but could add URL rewriting here too
            body = await response.text();
        } else {
            // Binary content (images, fonts, etc.)
            body = await response.arrayBuffer();
        }

        // Prepare response headers
        const responseHeaders = new Headers();

        // Copy headers from upstream, excluding blocked ones
        response.headers.forEach((value, key) => {
            if (!BLOCKED_HEADERS.includes(key.toLowerCase())) {
                responseHeaders.set(key, value);
            }
        });

        // Explicitly set permissive security headers
        responseHeaders.set("Access-Control-Allow-Origin", "*");
        responseHeaders.set("X-Frame-Options", "SAMEORIGIN");
        responseHeaders.set("Content-Security-Policy", "frame-ancestors 'self'");

        // Handle cookies - rewrite domain to work with our proxy
        const setCookieHeaders = response.headers.get("set-cookie");
        if (setCookieHeaders) {
            // Simple cookie rewriting - remove Domain and Secure attributes
            const rewrittenCookie = setCookieHeaders
                .replace(/Domain=[^;]+;?/gi, "")
                .replace(/Secure;?/gi, "")
                .replace(/SameSite=None;?/gi, "SameSite=Lax;");

            responseHeaders.set("Set-Cookie", rewrittenCookie);
        }

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
        const targetUrl = searchParams.get("url");

        if (!targetUrl) {
            return NextResponse.json(
                { error: "URL parameter is required" },
                { status: 400 }
            );
        }

        // Get the request body
        const body = await request.arrayBuffer();

        // Prepare headers
        const headers = new Headers();

        // Forward content-type and other relevant headers
        const contentType = request.headers.get("content-type");
        if (contentType) {
            headers.set("Content-Type", contentType);
        }

        // Forward cookies
        const clientCookies = request.headers.get("cookie");
        if (clientCookies) {
            headers.set("Cookie", clientCookies);
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
