import { NextRequest, NextResponse } from "next/server";
import { rewriteHtml } from "@/lib/proxy/url-rewriter";
import { filterHtml, shouldBlockUrl } from "@/lib/proxy/content-filter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
        let url: URL;
        try {
            url = new URL(targetUrl);
            if (url.protocol !== "http:" && url.protocol !== "https:") {
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
                headers: {
                    "Content-Type": "text/plain",
                },
            });
        }

        // Fetch the target URL
        const response = await fetch(targetUrl, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.5",
                "Accept-Encoding": "gzip, deflate, br",
                "DNT": "1",
                "Connection": "keep-alive",
                "Upgrade-Insecure-Requests": "1",
            },
            redirect: "follow",
        });

        if (!response.ok) {
            return NextResponse.json(
                { error: `Failed to fetch: ${response.statusText}` },
                { status: response.status }
            );
        }

        const contentType = response.headers.get("content-type") || "";

        // Handle HTML content
        if (contentType.includes("text/html")) {
            let html = await response.text();

            // Apply ad blocking filter
            if (adBlockEnabled) {
                html = filterHtml(html);
            }

            // Rewrite URLs to route through proxy
            html = rewriteHtml(html, targetUrl);

            return new NextResponse(html, {
                status: 200,
                headers: {
                    "Content-Type": "text/html; charset=utf-8",
                    "Access-Control-Allow-Origin": "*",
                    "X-Frame-Options": "SAMEORIGIN",
                    "Content-Security-Policy": "frame-ancestors 'self'",
                },
            });
        }

        // Handle other content types (CSS, JS, images, etc.)
        const buffer = await response.arrayBuffer();

        return new NextResponse(buffer, {
            status: 200,
            headers: {
                "Content-Type": contentType,
                "Access-Control-Allow-Origin": "*",
                "Cache-Control": "public, max-age=3600",
            },
        });
    } catch (error) {
        console.error("Proxy error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Internal server error" },
            { status: 500 }
        );
    }
}
