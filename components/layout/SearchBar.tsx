'use client';

import React from 'react';

export default function SearchBar() {
  return (
    <div className="relative w-full max-w-xs">
      <input
        type="text"
        placeholder="Cari..."
        className="h-8 w-full rounded-lg bg-secondary/80 px-3 text-[13px] text-foreground placeholder:text-muted-foreground border border-border focus:outline-none focus:ring-1 focus:ring-ring transition-all"
      />
    </div>
  );
}
