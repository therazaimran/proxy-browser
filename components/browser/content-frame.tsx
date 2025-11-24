"use client";

import { useEffect, useRef } from "react";
import { useBrowserState } from "@/hooks/use-browser-state";

export function ContentFrame() {
    const { tabs, activeTabId, updateTab, settings } = useBrowserState();
    const activeTab = tabs.find((tab) => tab.id === activeTabId);
    const iframeRef = useRef<HTMLIFrameElement>(null);

    useEffect(() => {
        if (!activeTab?.url || !activeTabId) return;

        const iframe = iframeRef.current;
        if (!iframe) return;

        const handleLoad = () => {
            updateTab(activeTabId, { loading: false });

            // Try to get page title
            try {
                const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
                if (iframeDoc?.title) {
                    updateTab(activeTabId, { title: iframeDoc.title });
                }
            } catch (e) {
                // Cross-origin restriction - can't access title
                console.log("Cannot access iframe content due to CORS");
            }

            // Apply page darkening if enabled
            if (settings.pageDarkeningEnabled) {
                try {
                    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
                    if (iframeDoc) {
                        const style = iframeDoc.createElement("style");
                        style.textContent = `
              html {
                filter: invert(0.9) hue-rotate(180deg) !important;
              }
              img, video, [style*="background-image"] {
                filter: invert(1) hue-rotate(180deg) !important;
              }
            `;
                        iframeDoc.head.appendChild(style);
                    }
                } catch (e) {
                    console.log("Cannot apply page darkening due to CORS");
                }
            }
        };

        iframe.addEventListener("load", handleLoad);
        return () => iframe.removeEventListener("load", handleLoad);
    }, [activeTab?.url, activeTabId, updateTab, settings.pageDarkeningEnabled]);

    if (!activeTab) {
        return null;
    }

    const proxyUrl = activeTab.url
        ? `/api/proxy?url=${encodeURIComponent(activeTab.url)}`
        : "";

    return (
        <div className="flex-1 relative bg-background">
            {activeTab.loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            )}
            {proxyUrl ? (
                <iframe
                    ref={iframeRef}
                    src={proxyUrl}
                    className="w-full h-full border-0"
                    sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
                    title={activeTab.title}
                />
            ) : (
                <div className="w-full h-full" />
            )}
        </div>
    );
}
