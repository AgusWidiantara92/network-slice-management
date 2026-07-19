'use client';

import React, { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon, Laptop } from 'lucide-react';

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="h-9 w-9 rounded-lg border border-border/40 bg-neutral-900/10" />
    );
  }

  return (
    <div className="inline-flex rounded-lg border border-border/40 bg-neutral-900/30 p-0.5 backdrop-blur-xs">
      <button
        onClick={() => setTheme('light')}
        className={`rounded-md p-1.5 transition-all ${
          theme === 'light'
            ? 'bg-neutral-200 dark:bg-neutral-800 text-amber-500'
            : 'text-muted-foreground hover:text-foreground'
        }`}
        title="Light Mode"
      >
        <Sun className="h-4 w-4" />
      </button>
      <button
        onClick={() => setTheme('dark')}
        className={`rounded-md p-1.5 transition-all ${
          theme === 'dark'
            ? 'bg-neutral-200 dark:bg-neutral-800 text-indigo-400'
            : 'text-muted-foreground hover:text-foreground'
        }`}
        title="Dark Mode"
      >
        <Moon className="h-4 w-4" />
      </button>
      <button
        onClick={() => setTheme('system')}
        className={`rounded-md p-1.5 transition-all ${
          theme === 'system'
            ? 'bg-neutral-200 dark:bg-neutral-800 text-sky-400'
            : 'text-muted-foreground hover:text-foreground'
        }`}
        title="System Theme"
      >
        <Laptop className="h-4 w-4" />
      </button>
    </div>
  );
}
