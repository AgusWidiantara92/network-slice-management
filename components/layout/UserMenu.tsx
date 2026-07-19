'use client';

import React, { useState, useEffect, useRef } from 'react';
import { User, Settings, LogOut, Shield } from 'lucide-react';

interface UserMenuProps {
  user: {
    name: string;
    email: string;
    role: string;
  };
}

export default function UserMenu({ user }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function handleLogout() {
    if (isLoggingOut) return;
    setIsLoggingOut(true);

    try {
      const res = await fetch('/api/auth/logout', {
        method: 'POST',
      });
      if (res.ok) {
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setIsLoggingOut(false);
    }
  }

  const initial = user.name ? user.name.charAt(0).toUpperCase() : 'A';

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Profile Toggle */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 hover:opacity-85 transition-opacity"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20 border border-primary/30 text-primary font-bold shadow-md">
          {initial}
        </div>
      </button>

      {/* Dropdown Menu */}
      {open && (
        <div className="absolute right-0 mt-2 w-56 rounded-xl border border-border/40 bg-neutral-900/90 backdrop-blur-md p-1 shadow-xl z-50">
          <div className="px-3 py-2.5 border-b border-border/20">
            <p className="text-xs font-bold text-foreground truncate">{user.name}</p>
            <p className="text-[10px] text-muted-foreground truncate mt-0.5">{user.email}</p>
            <span className="inline-flex items-center gap-1 mt-2 rounded bg-primary/10 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-primary border border-primary/25">
              <Shield className="h-2 w-2" />
              <span>{user.role}</span>
            </span>
          </div>

          <div className="py-1 space-y-0.5">
            <button className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-neutral-800/40 hover:text-foreground transition-all">
              <User className="h-3.5 w-3.5" />
              <span>Profil Saya</span>
            </button>
            <button className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-neutral-800/40 hover:text-foreground transition-all">
              <Settings className="h-3.5 w-3.5" />
              <span>Pengaturan</span>
            </button>
          </div>

          <div className="border-t border-border/20 pt-1">
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors disabled:opacity-50"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>{isLoggingOut ? 'Keluar...' : 'Keluar'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
