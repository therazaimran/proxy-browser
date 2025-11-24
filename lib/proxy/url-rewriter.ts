import * as cheerio from "cheerio";

/**
 * Comprehensive URL rewriter for reverse proxy
 * Rewrites all URLs in HTML to route through our proxy
 */

export function rewriteUrl(url: string, baseUrl: string, proxyBase: string = "/api/proxy"): string {
    if (!url || url.startsWith("data:") || url.startsWith("javascript:") || url.startsWith("mailto:") || url.startsWith("#")) {
        return url;
    }

    try {
        // Handle protocol-relative URLs
        if (url.startsWith("//")) {
            const base = new URL(baseUrl);
            url = `${base.protocol}${url}`;
        }

        // Resolve relative URLs
        const absoluteUrl = new URL(url, baseUrl).href;

        // Return proxied URL
        return `${proxyBase}?url=${encodeURIComponent(absoluteUrl)}`;
    } catch (e) {
        // If URL parsing fails, return original
        return url;
    }
}

export function rewriteHtml(html: string, baseUrl: string): string {
    const $ = cheerio.load(html);
    const base = new URL(baseUrl);

    // Inject base tag for better relative URL resolution
    if ($("base").length === 0) {
        $("head").prepend(`<base href="${baseUrl}">`);
    }

    // Rewrite all href attributes
    $("[href]").each((_, elem) => {
        const href = $(elem).attr("href");
        if (href) {
            $(elem).attr("href", rewriteUrl(href, baseUrl));
        }
    });

    // Rewrite all src attributes
    $("[src]").each((_, elem) => {
        const src = $(elem).attr("src");
        if (src) {
            $(elem).attr("src", rewriteUrl(src, baseUrl));
        }
    });

    // Rewrite srcset attributes (for responsive images)
    $("[srcset]").each((_, elem) => {
        const srcset = $(elem).attr("srcset");
        if (srcset) {
            const rewritten = srcset
                .split(",")
                .map((src) => {
                    const parts = src.trim().split(/\s+/);
                    if (parts[0]) {
                        parts[0] = rewriteUrl(parts[0], baseUrl);
                    }
                    return parts.join(" ");
                })
                .join(", ");
            $(elem).attr("srcset", rewritten);
        }
    });

    // Rewrite action attributes in forms
    $("form[action]").each((_, elem) => {
        const action = $(elem).attr("action");
        if (action) {
            $(elem).attr("action", rewriteUrl(action, baseUrl));
        }
    });

    // Rewrite CSS url() in style attributes
    $("[style]").each((_, elem) => {
        const style = $(elem).attr("style");
        if (style) {
            const rewritten = style.replace(/url\(['"]?([^'")\s]+)['"]?\)/gi, (match, url) => {
                return `url('${rewriteUrl(url, baseUrl)}')`;
            });
            $(elem).attr("style", rewritten);
        }
    });

    // Rewrite inline CSS in <style> tags
    $("style").each((_, elem) => {
        let css = $(elem).html() || "";
        css = css.replace(/url\(['"]?([^'")\s]+)['"]?\)/gi, (match, url) => {
            return `url('${rewriteUrl(url, baseUrl)}')`;
        });
        $(elem).html(css);
    });

    // Inject JavaScript to intercept dynamic URL construction
    const interceptScript = `
    <script>
      (function() {
        const PROXY_BASE = '/api/proxy';
        const ORIGINAL_ORIGIN = '${base.origin}';
        
        // Intercept fetch
        const originalFetch = window.fetch;
        window.fetch = function(url, options) {
          if (typeof url === 'string' && !url.startsWith('data:') && !url.startsWith('blob:')) {
            try {
              const absoluteUrl = new URL(url, ORIGINAL_ORIGIN).href;
              url = PROXY_BASE + '?url=' + encodeURIComponent(absoluteUrl);
            } catch(e) {}
          }
          return originalFetch.call(this, url, options);
        };
        
        // Intercept XMLHttpRequest
        const originalOpen = XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.open = function(method, url, ...args) {
          if (typeof url === 'string' && !url.startsWith('data:') && !url.startsWith('blob:')) {
            try {
              const absoluteUrl = new URL(url, ORIGINAL_ORIGIN).href;
              url = PROXY_BASE + '?url=' + encodeURIComponent(absoluteUrl);
            } catch(e) {}
          }
          return originalOpen.call(this, method, url, ...args);
        };
        
        // Intercept window.open
        const originalWindowOpen = window.open;
        window.open = function(url, ...args) {
          if (typeof url === 'string' && url) {
            try {
              const absoluteUrl = new URL(url, ORIGINAL_ORIGIN).href;
              url = PROXY_BASE + '?url=' + encodeURIComponent(absoluteUrl);
            } catch(e) {}
          }
          return originalWindowOpen.call(this, url, ...args);
        };
        
        // Override location setters
        const originalLocationSetter = Object.getOwnPropertyDescriptor(window.Location.prototype, 'href').set;
        Object.defineProperty(window.Location.prototype, 'href', {
          set: function(url) {
            try {
              const absoluteUrl = new URL(url, ORIGINAL_ORIGIN).href;
              url = PROXY_BASE + '?url=' + encodeURIComponent(absoluteUrl);
            } catch(e) {}
            return originalLocationSetter.call(this, url);
          }
        });
      })();
    </script>
  `;

    // Inject the script at the beginning of <head>
    $("head").prepend(interceptScript);

    return $.html();
}

export function rewriteCss(css: string, baseUrl: string): string {
    return css.replace(/url\(['"]?([^'")\s]+)['"]?\)/gi, (match, url) => {
        return `url('${rewriteUrl(url, baseUrl)}')`;
    });
}
