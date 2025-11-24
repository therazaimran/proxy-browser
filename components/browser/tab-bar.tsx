"use client";

import { useBrowserState } from "@/hooks/use-browser-state";
import { X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export function TabBar() {
    const { tabs, activeTabId, addTab, closeTab, setActiveTab } = useBrowserState();

    return (
        <div className="flex items-end gap-1 px-2 pt-2 bg-[var(--browser-chrome-bg)]">
            {tabs.map((tab) => (
                <div
                    key={tab.id}
                    className={cn(
                        "browser-tab group flex items-center gap-2 px-4 py-2 min-w-[180px] max-w-[240px] cursor-pointer relative",
                        activeTabId === tab.id && "active"
                    )}
                    onClick={() => setActiveTab(tab.id)}
                >
                    <div className="flex-1 truncate text-sm text-foreground/90">
                        {tab.title}
                    </div>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            closeTab(tab.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 hover:bg-foreground/10 rounded p-0.5 transition-opacity"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            ))}

            <button
                onClick={() => addTab()}
                className="p-2 hover:bg-[var(--browser-chrome-hover)] rounded-t transition-colors"
                title="New tab"
            >
                <Plus className="w-5 h-5" />
            </button>
        </div>
    );
}
