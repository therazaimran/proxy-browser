"use client";

import { useEffect } from "react";
import { useBrowserState } from "@/hooks/use-browser-state";
import { BrowserChrome } from "@/components/browser/browser-chrome";
import { Globe } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export default function HomePage() {
  const { tabs, addTab, activeTabId, updateTab } = useBrowserState();
  const [urlInput, setUrlInput] = useState("");

  useEffect(() => {
    // Initialize with a new tab if no tabs exist
    if (tabs.length === 0) {
      addTab();
    }
  }, [tabs.length, addTab]);

  const activeTab = tabs.find((tab) => tab.id === activeTabId);
  const showNewTabPage = !activeTab?.url;

  const handleNavigate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim() || !activeTabId) return;

    let url = urlInput.trim();

    // Check if it's a URL, if not prepend https://
    if (!url.startsWith("http")) {
      url = `https://${url}`;
    }

    updateTab(activeTabId, { url, loading: true });
    setUrlInput("");
  };

  return (
    <div className="relative h-screen">
      <BrowserChrome />

      {showNewTabPage && (
        <div className="absolute inset-0 flex items-center justify-center bg-background pointer-events-none">
          <div className="w-full max-w-2xl px-4 pointer-events-auto">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                Proxy Browser
              </h1>
              <p className="text-muted-foreground">
                Enter a URL to browse securely
              </p>
            </div>

            <form onSubmit={handleNavigate} className="relative">
              <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="Enter website URL (e.g., example.com)"
                className="pl-12 pr-4 py-6 text-lg rounded-full border-2 focus-visible:ring-2 focus-visible:ring-primary"
              />
            </form>

            <div className="mt-8 grid grid-cols-3 gap-4">
              {[
                { name: "Wikipedia", url: "https://www.wikipedia.org" },
                { name: "GitHub", url: "https://github.com" },
                { name: "Reddit", url: "https://www.reddit.com" },
                { name: "Hacker News", url: "https://news.ycombinator.com" },
                { name: "Stack Overflow", url: "https://stackoverflow.com" },
                { name: "MDN Web Docs", url: "https://developer.mozilla.org" },
              ].map((site) => (
                <button
                  key={site.name}
                  onClick={() => activeTabId && updateTab(activeTabId, { url: site.url, loading: true })}
                  className="p-4 rounded-lg border border-border hover:border-primary hover:bg-accent transition-colors"
                >
                  <div className="text-sm font-medium">{site.name}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
