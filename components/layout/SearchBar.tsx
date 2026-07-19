'use client';

import React from 'react';
import { Search } from 'lucide-react';

export default function SearchBar() {
  return (
    <div className="relative w-full max-w-xs md:max-w-sm">
      <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground">
        <Search className="h-4 w-4" />
      </div>
      <input
        type="text"
        placeholder="Cari sesuatu..."
        className="h-9 w-full rounded-lg border border-border/40 bg-neutral-900/10 dark:bg-neutral-950/10 pl-9 pr-12 text-sm placeholder:text-muted-foreground focus:border-primary/50 focus:outline-hidden focus:ring-1 focus:ring-primary/20 transition-all duration-200"
      />
      <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
        <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-0.5 rounded border border-border/55 bg-muted px-1.5 font-mono text-[9px] font-medium text-muted-foreground opacity-100 shadow-xs">
          <span className="text-[10px]">⌘</span>K
        </kbd>
      </div>
    </div>
  );
}
