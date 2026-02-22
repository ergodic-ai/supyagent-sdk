"use client";

import Image from "next/image";
import { Sun, Moon } from "lucide-react";
import { UserButton } from "./user-button";
import { useTheme } from "./theme-provider";

export function Header() {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-card px-4">
      <div className="flex items-center gap-2.5">
        <Image
          src="/logo.png"
          alt="Supyagent"
          width={22}
          height={22}
          className="opacity-90"
        />
        <span className="text-sm font-medium text-foreground">Supyagent</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={toggleTheme}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
        <UserButton />
      </div>
    </header>
  );
}
