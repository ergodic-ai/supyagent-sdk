"use client";

import Image from "next/image";
import { UserButton } from "./user-button";

export function Header() {
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
      <UserButton />
    </header>
  );
}
