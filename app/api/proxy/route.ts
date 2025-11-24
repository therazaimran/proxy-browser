import { NextRequest, NextResponse } from "next/server";
import { rewriteHtml } from "@/lib/proxy/url-rewriter";
import { filterHtml, shouldBlockUrl } from "@/lib/proxy/content-filter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Headers to strip from the upstream response
const BLOCKED_HEADERS = [
    "x-frame-options",
    "content-security-policy",
    "content-security-policy-report-only",
    "x-xss-protection",
    "x-content-type-options",
    "access-control-allow-origin",
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
        const clientHeaders = request.headers;
        if (clientHeaders.has("cookie")) {
            headers.set("Cookie", clientHeaders.get("cookie")!);
        }

        // Set standard browser headers to avoid bot detection
        headers.set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36");
        headers.set("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8");
        headers.set("Accept-Language", "en-US,en;q=0.9");
        headers.set("Referer", urlObj.origin); // Set Referer to the target origin
        headers.set("Origin", urlObj.origin);
        headers.set("Cache-Control", "no-cache");
        headers.set("Pragma", "no-cache");
        headers.set("Upgrade-Insecure-Requests", "1");
        headers.set("Sec-Fetch-Dest", "document");
        headers.set("Sec-Fetch-Mode", "navigate");
        headers.set("Sec-Fetch-Site", "cross-site");
        headers.set("Sec-Fetch-User", "?1");

        // Fetch the target URL
        const response = await fetch(targetUrl, {
            headers,
            redirect: "follow",
        });

        if (!response.ok) {
            // Forward error responses too, as they might contain useful info
            console.log(`Upstream error: ${response.status} for ${targetUrl}`);
        }

        const contentType = response.headers.get("content-type") || "";
        const isHtml = contentType.includes("text/html");

        let body: BodyInit | null = null;
        if (isHtml) {
            let html = await response.text();
            if (adBlockEnabled) {
                html = filterHtml(html);
            }
            html = rewriteHtml(html, targetUrl);
            body = html;
        } else {
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
        responseHeaders.set("X-Frame-Options", "SAMEORIGIN"); // Allow framing by self
        responseHeaders.set("Content-Security-Policy", "frame-ancestors 'self'");

        // Rewrite Set-Cookie headers
        // Note: node-fetch/nextjs might merge multiple Set-Cookie headers. 
        // Handling this perfectly in Next.js Edge/Node runtime can be tricky.
        const setCookie = response.headers.get("set-cookie");
        if (setCookie) {
            // Simple rewrite: strip Domain and Secure to allow localhost
            // This is a basic implementation and might not handle all edge cases
            const rewrittenCookie = setCookie
                .replace(/Domain=[^;]+;/gi, "")
                .replace(/Secure/gi, "")
                .replace(/SameSite=[^;]+;/gi, "SameSite=Lax;");

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
