'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useLayout } from './LayoutContext';

export default function AppSidebar() {
  const pathname = usePathname();
  const { isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen } = useLayout();

  const navItems = [
    { label: 'Dashboard', href: '/' },
    { label: 'Tenants', href: '/tenants' },
    { label: 'Routers', href: '/routers' },
    { label: 'Network Slices', href: '/network-slice' },
    { label: 'Schedulers', href: '/scheduler' },
    { label: 'AI Operations', href: '/ai-chat' },
    { label: 'Templates', href: '/configuration-template' },
    { label: 'Log Audit', href: '/logs' },
    { label: 'LLM Settings', href: '/llm-provider' },
  ];

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) window.location.href = '/login';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const renderSidebarContent = () => (
    <aside
      className={`flex flex-col h-full bg-card border-r border-border text-foreground transition-all duration-200 select-none ${
        isCollapsed ? 'w-16' : 'w-52'
      }`}
    >
      {/* Brand Header */}
      <div className="flex h-12 items-center justify-between px-4 border-b border-border">
        <Link href="/" className="flex items-center gap-2 overflow-hidden">
          <span className="text-sm font-black tracking-tight text-foreground">
            {isCollapsed ? 'NSM' : 'NSM Controller'}
          </span>
        </Link>

        {/* Collapse Toggle Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:flex text-[10px] font-bold uppercase text-muted-foreground hover:text-foreground p-1"
          title={isCollapsed ? 'Expand' : 'Collapse'}
        >
          {isCollapsed ? '>' : '<'}
        </button>

        {/* Mobile Close Button */}
        <button
          onClick={() => setIsMobileOpen(false)}
          className="md:hidden text-xs text-muted-foreground hover:text-foreground"
        >
          Tutup
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsMobileOpen(false)}
              className={`flex items-center rounded-lg px-3 py-2 text-[13px] font-semibold transition-all ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              } ${isCollapsed ? 'justify-center px-1 text-[11px]' : ''}`}
            >
              <span className="truncate">{isCollapsed ? item.label.slice(0, 3) : item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Logout Footer */}
      <div className="p-2 border-t border-border">
        <button
          onClick={handleLogout}
          className={`flex w-full items-center rounded-lg px-3 py-2 text-[13px] font-semibold text-rose-500 hover:bg-rose-500/10 transition-colors ${
            isCollapsed ? 'justify-center px-1 text-[11px]' : ''
          }`}
        >
          <span>{isCollapsed ? 'Exit' : 'Keluar'}</span>
        </button>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop Permanent Sidebar */}
      <div className="hidden md:block h-full">
        {renderSidebarContent()}
      </div>

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-[100] md:hidden"
          onClick={() => setIsMobileOpen(false)}
        >
          <div
            className="w-52 h-full shadow-2xl animate-slide-right"
            onClick={(e) => e.stopPropagation()}
          >
            {renderSidebarContent()}
          </div>
        </div>
      )}
    </>
  );
}
