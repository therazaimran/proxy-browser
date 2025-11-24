"use client";

import { TabBar } from "./tab-bar";
import { AddressBar } from "./address-bar";
import { BrowserMenu } from "./browser-menu";
import { ContentFrame } from "./content-frame";

export function BrowserChrome() {
    return (
        <div className="flex flex-col h-screen w-screen overflow-hidden">
            <div className="browser-chrome sticky top-0 z-50 bg-[var(--browser-chrome-bg)] border-b border-border">
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <TabBar />
                    </div>
                    <div className="px-2 py-2">
                        <BrowserMenu />
                    </div>
                </div>
                <AddressBar />
            </div>
            <ContentFrame />
        </div>
    );
}
