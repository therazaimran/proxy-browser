/**
 * URL Rewriter Utility
 * Rewrites URLs in HTML content to route through the proxy
 */

export function rewriteUrl(url: string, baseUrl: string): string {
    try {
        // Handle relative URLs
        const absoluteUrl = new URL(url, baseUrl).href;

        // Return proxy URL
        return `/api/proxy?url=${encodeURIComponent(absoluteUrl)}`;
    } catch (e) {
        // If URL parsing fails, return original
        return url;
    }
}

export function isExternalUrl(url: string): boolean {
    try {
        const urlObj = new URL(url);
        return urlObj.protocol === "http:" || urlObj.protocol === "https:";
    } catch {
        return false;
    }
}

export function rewriteHtml(html: string, baseUrl: string): string {
    // Rewrite common URL attributes
    let rewritten = html;

    // Rewrite href attributes
    rewritten = rewritten.replace(
        /href=["']([^"']+)["']/gi,
        (match, url) => {
            if (url.startsWith("#") || url.startsWith("javascript:") || url.startsWith("mailto:")) {
                return match;
            }
            return `href="${rewriteUrl(url, baseUrl)}"`;
        }
    );

    // Rewrite src attributes
    rewritten = rewritten.replace(
        /src=["']([^"']+)["']/gi,
        (match, url) => {
            if (url.startsWith("data:")) {
                return match;
            }
            return `src="${rewriteUrl(url, baseUrl)}"`;
        }
    );

    // Rewrite action attributes in forms
    rewritten = rewritten.replace(
        /action=["']([^"']+)["']/gi,
        (match, url) => {
            return `action="${rewriteUrl(url, baseUrl)}"`;
        }
    );

    // Add base tag to help with relative URLs
    rewritten = rewritten.replace(
        /<head>/i,
        `<head><base href="${baseUrl}">`
    );

    return rewritten;
}
