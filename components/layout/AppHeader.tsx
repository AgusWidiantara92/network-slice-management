'use client';

import React from 'react';
import { useLayout } from './LayoutContext';
import Breadcrumb from './Breadcrumb';
import SearchBar from './SearchBar';
import NotificationMenu from './NotificationMenu';
import ThemeToggle from './ThemeToggle';
import UserMenu from './UserMenu';
import { Menu } from 'lucide-react';

interface AppHeaderProps {
  user: {
    name: string;
    email: string;
    role: string;
  };
}

export default function AppHeader({ user }: AppHeaderProps) {
  const { setIsMobileOpen } = useLayout();

  return (
    <header className="flex h-16 items-center justify-between border-b border-border/40 bg-neutral-900/60 dark:bg-neutral-950/60 backdrop-blur-md px-6 sticky top-0 z-40">
      {/* Left side: Hamburger Toggle & Breadcrumb */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setIsMobileOpen(true)}
          className="md:hidden p-1.5 rounded-lg border border-border/30 hover:bg-neutral-800 text-muted-foreground hover:text-foreground transition-colors"
          title="Buka Menu"
        >
          <Menu className="h-4.5 w-4.5" />
        </button>
        
        <Breadcrumb />
      </div>

      {/* Right side: Search, Notifications, Theme, Profile */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Global Search Bar (hidden on extra small screens) */}
        <div className="hidden sm:block">
          <SearchBar />
        </div>

        {/* Action Widgets */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <NotificationMenu />
          <ThemeToggle />
        </div>

        <div className="h-6 w-px bg-border/40" />

        {/* User Menu Profile Dropdown */}
        <UserMenu user={user} />
      </div>
    </header>
  );
}
