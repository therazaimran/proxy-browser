"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Tab {
    id: string;
    url: string;
    title: string;
    loading: boolean;
}

export interface BrowserSettings {
    adBlockEnabled: boolean;
    pageDarkeningEnabled: boolean;
    defaultSearchEngine: string;
}

interface BrowserState {
    tabs: Tab[];
    activeTabId: string | null;
    settings: BrowserSettings;

    // Tab actions
    addTab: (url?: string) => void;
    closeTab: (id: string) => void;
    setActiveTab: (id: string) => void;
    updateTab: (id: string, updates: Partial<Tab>) => void;

    // Settings actions
    updateSettings: (settings: Partial<BrowserSettings>) => void;
}

export const useBrowserState = create<BrowserState>()(
    persist(
        (set) => ({
            tabs: [],
            activeTabId: null,
            settings: {
                adBlockEnabled: true,
                pageDarkeningEnabled: false,
                defaultSearchEngine: "searxng",
            },

            addTab: (url = "") =>
                set((state) => {
                    const newTab: Tab = {
                        id: `tab-${Date.now()}`,
                        url,
                        title: url || "New Tab",
                        loading: false,
                    };
                    return {
                        tabs: [...state.tabs, newTab],
                        activeTabId: newTab.id,
                    };
                }),

            closeTab: (id) =>
                set((state) => {
                    const newTabs = state.tabs.filter((tab) => tab.id !== id);
                    let newActiveTabId = state.activeTabId;

                    if (state.activeTabId === id) {
                        const closedIndex = state.tabs.findIndex((tab) => tab.id === id);
                        if (newTabs.length > 0) {
                            newActiveTabId =
                                newTabs[Math.max(0, closedIndex - 1)]?.id || newTabs[0].id;
                        } else {
                            newActiveTabId = null;
                        }
                    }

                    return {
                        tabs: newTabs,
                        activeTabId: newActiveTabId,
                    };
                }),

            setActiveTab: (id) =>
                set(() => ({
                    activeTabId: id,
                })),

            updateTab: (id, updates) =>
                set((state) => ({
                    tabs: state.tabs.map((tab) =>
                        tab.id === id ? { ...tab, ...updates } : tab
                    ),
                })),

            updateSettings: (settings) =>
                set((state) => ({
                    settings: { ...state.settings, ...settings },
                })),
        }),
        {
            name: "browser-storage",
            partialize: (state) => ({
                settings: state.settings,
            }),
        }
    )
);
