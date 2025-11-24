"use client";

import { useBrowserState } from "@/hooks/use-browser-state";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Separator } from "@/components/ui/separator";

export default function SettingsPage() {
    const { settings, updateSettings } = useBrowserState();
    const router = useRouter();

    return (
        <div className="min-h-screen bg-background p-8">
            <div className="max-w-3xl mx-auto">
                <div className="flex items-center gap-4 mb-8">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push("/")}
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <h1 className="text-3xl font-bold">Settings</h1>
                </div>

                <div className="space-y-6">
                    <div className="bg-card rounded-lg border border-border p-6">
                        <h2 className="text-xl font-semibold mb-4">Privacy & Security</h2>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="font-medium">Ad Blocking</div>
                                    <div className="text-sm text-muted-foreground">
                                        Block ads and tracking scripts on websites
                                    </div>
                                </div>
                                <Switch
                                    checked={settings.adBlockEnabled}
                                    onCheckedChange={(checked) =>
                                        updateSettings({ adBlockEnabled: checked })
                                    }
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-card rounded-lg border border-border p-6">
                        <h2 className="text-xl font-semibold mb-4">Appearance</h2>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="font-medium">Page Darkening</div>
                                    <div className="text-sm text-muted-foreground">
                                        Apply dark mode to all websites by default
                                    </div>
                                </div>
                                <Switch
                                    checked={settings.pageDarkeningEnabled}
                                    onCheckedChange={(checked) =>
                                        updateSettings({ pageDarkeningEnabled: checked })
                                    }
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-card rounded-lg border border-border p-6">
                        <h2 className="text-xl font-semibold mb-4">About</h2>
                        <div className="space-y-2 text-sm text-muted-foreground">
                            <p>
                                <strong className="text-foreground">Proxy Browser</strong> - A web proxy browser with Chrome-like interface
                            </p>
                            <Separator className="my-4" />
                            <p>
                                This browser routes all traffic through a server-side proxy to bypass CORS restrictions
                                and provide ad blocking capabilities.
                            </p>
                            <p className="mt-4">
                                <strong className="text-foreground">Note:</strong> Due to serverless platform limitations,
                                some large pages or slow-loading sites may timeout.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
