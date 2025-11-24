"use client";

import { useState, KeyboardEvent, useEffect } from "react";
import { useBrowserState } from "@/hooks/use-browser-state";
import { ArrowLeft, ArrowRight, RotateCw, Home, Lock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function AddressBar() {
    const { tabs, activeTabId, updateTab, goBack, goForward } = useBrowserState();
    const activeTab = tabs.find((tab) => tab.id === activeTabId);
    const [inputValue, setInputValue] = useState(activeTab?.url || "");

    // Update input value when active tab changes or its URL changes
    useEffect(() => {
        if (activeTab) {
            setInputValue(activeTab.url);
        }
    }, [activeTab?.url, activeTab?.id]);

    const handleNavigate = () => {
        if (!activeTabId || !inputValue.trim()) return;

        let url = inputValue.trim();

        // Check if it's a URL, if not prepend https://
        if (!url.startsWith("http")) {
            url = `https://${url}`;
        }

        updateTab(activeTabId, { url, loading: true });
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            handleNavigate();
        }
    };

    const handleRefresh = () => {
        if (!activeTabId || !activeTab?.url) return;
        updateTab(activeTabId, { loading: true });
        // Force reload by updating URL
        setTimeout(() => {
            updateTab(activeTabId, { loading: false });
        }, 100);
    };

    const canGoBack = activeTab ? activeTab.currentIndex > 0 : false;
    const canGoForward = activeTab ? activeTab.currentIndex < (activeTab.history?.length || 0) - 1 : false;

    return (
        <div className="flex items-center gap-2 px-4 py-2 bg-[var(--browser-chrome-bg)] sticky top-0 z-50 shadow-sm border-b border-border">
            <div className="flex items-center gap-1">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-foreground/60 hover:text-foreground hover:bg-[var(--browser-chrome-hover)]"
                    disabled={!canGoBack}
                    onClick={goBack}
                >
                    <ArrowLeft className="w-4 h-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-foreground/60 hover:text-foreground hover:bg-[var(--browser-chrome-hover)]"
                    disabled={!canGoForward}
                    onClick={goForward}
                >
                    <ArrowRight className="w-4 h-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-foreground/60 hover:text-foreground hover:bg-[var(--browser-chrome-hover)]"
                    onClick={handleRefresh}
                >
                    <RotateCw className="w-4 h-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-foreground/60 hover:text-foreground hover:bg-[var(--browser-chrome-hover)]"
                    onClick={() => activeTabId && updateTab(activeTabId, { url: "" })}
                >
                    <Home className="w-4 h-4" />
                </Button>
            </div>

            <div className="flex-1 flex items-center gap-2 browser-addressbar px-4 py-1.5">
                <Lock className="w-4 h-4 text-foreground/40" />
                <Input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={(e) => e.target.select()}
                    placeholder="Enter website URL"
                    className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-sm"
                />
            </div>
        </div>
    );
}
