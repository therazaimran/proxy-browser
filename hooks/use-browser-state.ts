"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Tab {
    id: string;
    url: string;
    title: string;
    loading: boolean;
    history: string[];
    currentIndex: number;
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

    // Navigation
    goBack: () => void;
    goForward: () => void;

    // Settings actions
    updateSettings: (settings: Partial<BrowserSettings>) => void;
}

export const useBrowserState = create<BrowserState>()(
    persist(
        (set, get) => ({
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
                        history: url ? [url] : [],
                        currentIndex: url ? 0 : -1,
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
                    tabs: state.tabs.map((tab) => {
                        if (tab.id !== id) return tab;

                        // Handle URL updates for history
                        if (updates.url && updates.url !== tab.url) {
                            const newHistory = tab.history.slice(0, tab.currentIndex + 1);
                            newHistory.push(updates.url);
                            return {
                                ...tab,
                                ...updates,
                                history: newHistory,
                                currentIndex: newHistory.length - 1,
                            };
                        }

                        return { ...tab, ...updates };
                    }),
                })),

            goBack: () =>
                set((state) => {
                    const tab = state.tabs.find((t) => t.id === state.activeTabId);
                    if (!tab || tab.currentIndex <= 0) return state;

                    const newIndex = tab.currentIndex - 1;
                    return {
                        tabs: state.tabs.map((t) =>
                            t.id === tab.id
                                ? { ...t, url: t.history[newIndex], currentIndex: newIndex }
                                : t
                        ),
                    };
                }),

            goForward: () =>
                set((state) => {
                    const tab = state.tabs.find((t) => t.id === state.activeTabId);
                    if (!tab || tab.currentIndex >= tab.history.length - 1) return state;

                    const newIndex = tab.currentIndex + 1;
                    return {
                        tabs: state.tabs.map((t) =>
                            t.id === tab.id
                                ? { ...t, url: t.history[newIndex], currentIndex: newIndex }
                                : t
                        ),
                    };
                }),

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
