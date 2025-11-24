/**
 * Content Filter for Ad Blocking
 * Basic ad blocking using common ad domain patterns
 */

// Common ad and tracking domains
const AD_DOMAINS = [
    "doubleclick.net",
    "googlesyndication.com",
    "googleadservices.com",
    "google-analytics.com",
    "googletagmanager.com",
    "facebook.com/tr",
    "connect.facebook.net",
    "ads.twitter.com",
    "static.ads-twitter.com",
    "analytics.twitter.com",
    "adnxs.com",
    "advertising.com",
    "adsystem.com",
    "adtechus.com",
    "criteo.com",
    "outbrain.com",
    "taboola.com",
    "scorecardresearch.com",
    "quantserve.com",
];

// Ad-related URL patterns
const AD_PATTERNS = [
    /\/ads?\//i,
    /\/advert/i,
    /\/banner/i,
    /\/tracking/i,
    /\/analytics/i,
    /\/pixel/i,
    /\/beacon/i,
];

export function shouldBlockUrl(url: string): boolean {
    try {
        const urlObj = new URL(url);

        // Check if domain is in ad domains list
        if (AD_DOMAINS.some((domain) => urlObj.hostname.includes(domain))) {
            return true;
        }

        // Check if URL matches ad patterns
        if (AD_PATTERNS.some((pattern) => pattern.test(url))) {
            return true;
        }

        return false;
    } catch {
        return false;
    }
}

export function filterHtml(html: string): string {
    let filtered = html;

    // Remove common ad-related elements
    const adSelectors = [
        'iframe[src*="doubleclick"]',
        'iframe[src*="googlesyndication"]',
        'div[class*="ad-"]',
        'div[id*="ad-"]',
        'div[class*="advertisement"]',
        'div[id*="advertisement"]',
        'ins[class*="adsbygoogle"]',
    ];

    // Remove script tags with ad-related sources
    filtered = filtered.replace(
        /<script[^>]*src=["']([^"']+)["'][^>]*>.*?<\/script>/gi,
        (match, src) => {
            if (shouldBlockUrl(src)) {
                return "<!-- Ad blocked -->";
            }
            return match;
        }
    );

    // Remove iframe tags with ad-related sources
    filtered = filtered.replace(
        /<iframe[^>]*src=["']([^"']+)["'][^>]*>.*?<\/iframe>/gi,
        (match, src) => {
            if (shouldBlockUrl(src)) {
                return "<!-- Ad blocked -->";
            }
            return match;
        }
    );

    return filtered;
}
