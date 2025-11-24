"use client";

import { useBrowserState } from "@/hooks/use-browser-state";
import { Menu, Plus, Settings, Moon } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function BrowserMenu() {
    const { addTab, settings, updateSettings } = useBrowserState();
    const router = useRouter();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-foreground/60 hover:text-foreground hover:bg-[var(--browser-chrome-hover)]"
                >
                    <Menu className="w-5 h-5" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => addTab()}>
                    <Plus className="w-4 h-4 mr-2" />
                    New Tab
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    onClick={() => {
                        updateSettings({ pageDarkeningEnabled: !settings.pageDarkeningEnabled });
                    }}
                >
                    <Moon className="w-4 h-4 mr-2" />
                    {settings.pageDarkeningEnabled ? "Disable" : "Enable"} Page Darkening
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push("/settings")}>
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
