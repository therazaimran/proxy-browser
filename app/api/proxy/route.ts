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

        // Use corsproxy.io to fetch the content
        const corsProxyUrl = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;

        // Fetch via corsproxy.io
        const response = await fetch(corsProxyUrl, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            },
            redirect: "follow",
        });

        if (!response.ok) {
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
        responseHeaders.set("X-Frame-Options", "SAMEORIGIN");
        responseHeaders.set("Content-Security-Policy", "frame-ancestors 'self'");

        // Handle cookies if present
        const setCookie = response.headers.get("set-cookie");
        if (setCookie) {
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
