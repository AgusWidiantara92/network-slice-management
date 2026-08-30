'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { useLayout } from './LayoutContext';
import SearchBar from './SearchBar';
import NotificationMenu from './NotificationMenu';
import ThemeToggle from './ThemeToggle';
import UserMenu from './UserMenu';

interface AppHeaderProps {
  user: {
    name: string;
    email: string;
    role: string;
  };
}

const pageTitles: Record<string, string> = {
  '/': 'Dashboard Overview',
  '/tenants': 'Tenant Management',
  '/routers': 'Router Management',
  '/network-slice': 'Network Slice Management',
  '/schedulers': 'Scheduler Automasi',
  '/configuration-template': 'Template Script',
  '/llm': 'LLM Provider Settings',
  '/logs': 'Log Audit System',
  '/settings': 'System Settings',
};

export default function AppHeader({ user }: AppHeaderProps) {
  const pathname = usePathname();
  const { setIsMobileOpen } = useLayout();

  const title = pageTitles[pathname] || 'NSM Controller';

  return (
    <header className="sticky top-0 z-40 w-full bg-background/90 backdrop-blur-md border-b border-border transition-colors duration-200">
      <div className="flex h-12 items-center justify-between px-5">
        {/* Left: Mobile Toggle & Page Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileOpen(true)}
            className="md:hidden px-2 py-1 text-xs font-semibold rounded-lg hover:bg-secondary text-muted-foreground border border-border"
          >
            Menu
          </button>
          
          <h1 className="text-xs font-bold uppercase tracking-wider text-muted-foreground hidden sm:block">
            {title}
          </h1>
        </div>

        {/* Right: Search, Notifications, Siang/Malam Theme Toggle & User Menu */}
        <div className="flex items-center gap-2">
          <div className="hidden md:block">
            <SearchBar />
          </div>
          <NotificationMenu />
          <ThemeToggle />
          <div className="h-4 w-px bg-border mx-1" />
          <UserMenu user={user} />
        </div>
      </div>
    </header>
  );
}
