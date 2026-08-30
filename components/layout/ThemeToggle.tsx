'use client';

import React, { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-8 w-20 rounded-lg bg-secondary animate-pulse" />;
  }

  const isDark = theme === 'dark';

  return (
    <div className="inline-flex items-center rounded-lg border border-border bg-secondary p-0.5 select-none">
      <button
        onClick={() => setTheme('light')}
        className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
          !isDark
            ? 'bg-card text-foreground shadow-xs'
            : 'text-muted-foreground hover:text-foreground'
        }`}
        title="Mode Siang"
      >
        <Sun className="h-3.5 w-3.5 text-amber-500" />
        <span>Siang</span>
      </button>

      <button
        onClick={() => setTheme('dark')}
        className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
          isDark
            ? 'bg-card text-foreground shadow-xs'
            : 'text-muted-foreground hover:text-foreground'
        }`}
        title="Mode Malam"
      >
        <Moon className="h-3.5 w-3.5 text-indigo-400" />
        <span>Malam</span>
      </button>
    </div>
  );
}
