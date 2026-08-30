'use client';

import React, { useState, useEffect, useRef } from 'react';

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
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) window.location.href = '/login';
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="px-2.5 py-1 rounded-lg text-xs font-semibold text-foreground border border-border hover:bg-secondary transition-colors"
      >
        {user.name}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-48 rounded-xl bg-card p-1.5 shadow-xl border border-border z-50">
          <div className="px-3 py-2 border-b border-border">
            <p className="text-[13px] font-semibold text-foreground truncate">{user.name}</p>
            <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
            <span className="inline-block mt-1 text-[9px] font-semibold uppercase text-muted-foreground">
              {user.role}
            </span>
          </div>

          <div className="py-1 space-y-0.5">
            <button className="flex w-full items-center rounded-lg px-3 py-1.5 text-[13px] font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
              Profil
            </button>
            <button className="flex w-full items-center rounded-lg px-3 py-1.5 text-[13px] font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
              Pengaturan
            </button>
          </div>

          <div className="border-t border-border pt-1">
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="flex w-full items-center rounded-lg px-3 py-1.5 text-[13px] font-medium text-rose-500 hover:bg-rose-500/10 transition-colors disabled:opacity-50"
            >
              {isLoggingOut ? 'Keluar...' : 'Keluar'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
