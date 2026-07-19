'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useLayout } from './LayoutContext';
import {
  LayoutDashboard,
  Users,
  Server,
  Network,
  Calendar,
  FileCode,
  Brain,
  MessageSquareCode,
  History,
  Settings,
  ChevronDown,
  ChevronRight,
  LogOut,
  X,
  Menu,
} from 'lucide-react';

interface SubMenuItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface MenuItem {
  name: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  subItems?: SubMenuItem[];
}

export default function AppSidebar() {
  const pathname = usePathname();
  const { isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen } = useLayout();
  
  // Accordion state: keep track of open menu sections
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    management: true,
    ai: true,
    system: false,
  });

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const menuStructure: { section: string; label: string; items: MenuItem[] }[] = [
    {
      section: 'main',
      label: 'Main Portal',
      items: [
        { name: 'Dashboard', href: '/', icon: LayoutDashboard },
      ],
    },
    {
      section: 'management',
      label: 'Management',
      items: [
        {
          name: 'Core Management',
          icon: Network,
          subItems: [
            { name: 'Tenant Management', href: '/tenants', icon: Users },
            { name: 'Router Management', href: '/routers', icon: Server },
            { name: 'Slice Management', href: '/network-slice', icon: Network },
            { name: 'Scheduler Automasi', href: '/schedulers', icon: Calendar },
          ],
        },
      ],
    },
    {
      section: 'ai',
      label: 'Generative AI',
      items: [
        {
          name: 'AI Operations',
          icon: Brain,
          subItems: [
            { name: 'AI Chat', href: '/network-slice?ai=true', icon: MessageSquareCode },
            { name: 'Template Script', href: '/configuration-template', icon: FileCode },
            { name: 'LLM Provider', href: '/llm', icon: Brain },
          ],
        },
      ],
    },
    {
      section: 'system',
      label: 'System Settings',
      items: [
        {
          name: 'Administration',
          icon: Settings,
          subItems: [
            { name: 'Log Audit', href: '/logs', icon: History },
            { name: 'System Settings', href: '/settings', icon: Settings },
          ],
        },
      ],
    },
  ];

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) {
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-neutral-900 dark:bg-neutral-950 border-r border-border/40 text-foreground justify-between select-none">
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-5">
        {/* Sidebar Brand Header */}
        <div className="flex items-center justify-between px-2 py-3 border-b border-border/20">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold shadow-md">
              NS
            </div>
            {!isCollapsed && (
              <div className="overflow-hidden">
                <h2 className="text-xs font-extrabold tracking-tight whitespace-nowrap">
                  NSM ENTERPRISE
                </h2>
                <span className="text-[9px] text-muted-foreground font-medium block leading-none mt-0.5">
                  RouterOS Controller
                </span>
              </div>
            )}
          </div>
          
          {/* Collapse Button (Only Desktop) */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden md:flex h-6 w-6 items-center justify-center rounded-md border border-border/30 hover:bg-neutral-800 text-muted-foreground hover:text-foreground"
          >
            <ChevronRight className={`h-3 w-3 transition-transform ${isCollapsed ? '' : 'rotate-180'}`} />
          </button>

          {/* Close Button (Only Mobile Drawer) */}
          <button
            onClick={() => setIsMobileOpen(false)}
            className="md:hidden p-1 rounded-lg hover:bg-neutral-800 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Sidebar Items */}
        <div className="space-y-4">
          {menuStructure.map((sec) => (
            <div key={sec.section} className="space-y-1">
              {/* Section Header Label */}
              {!isCollapsed && (
                <span className="px-3 text-[9px] font-extrabold tracking-widest text-muted-foreground/60 uppercase block py-1.5">
                  {sec.label}
                </span>
              )}

              <div className="space-y-0.5">
                {sec.items.map((item, idx) => {
                  const Icon = item.icon;

                  // Simple route link (No sub-items)
                  if (!item.subItems) {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={idx}
                        href={item.href || '/'}
                        onClick={() => setIsMobileOpen(false)}
                        className={`flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-semibold transition-all duration-200 ${
                          isActive
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'text-muted-foreground hover:bg-neutral-800/40 hover:text-foreground'
                        }`}
                      >
                        <Icon className={`h-4 w-4 ${isActive ? '' : 'text-primary'}`} />
                        {!isCollapsed && <span>{item.name}</span>}
                      </Link>
                    );
                  }

                  // Collapsible Sub-menu Accordion
                  const isSectionOpen = openSections[sec.section] || false;
                  const hasActiveChild = item.subItems.some((sub) => pathname === sub.href);

                  return (
                    <div key={idx} className="space-y-0.5">
                      {/* Accordion Trigger */}
                      <button
                        onClick={() => toggleSection(sec.section)}
                        className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
                          hasActiveChild 
                            ? 'text-foreground font-bold' 
                            : 'text-muted-foreground hover:bg-neutral-800/40 hover:text-foreground'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={`h-4 w-4 ${hasActiveChild ? 'text-primary font-bold' : 'text-primary/70'}`} />
                          {!isCollapsed && <span>{item.name}</span>}
                        </div>
                        {!isCollapsed && (
                          isSectionOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />
                        )}
                      </button>

                      {/* Accordion Sub-items list */}
                      {!isCollapsed && isSectionOpen && (
                        <div className="pl-6 border-l border-border/20 ml-5 mt-0.5 space-y-0.5">
                          {item.subItems.map((sub, sIdx) => {
                            const SubIcon = sub.icon;
                            const isSubActive = pathname === sub.href;

                            return (
                              <Link
                                key={sIdx}
                                href={sub.href}
                                onClick={() => setIsMobileOpen(false)}
                                className={`flex items-center gap-2.5 rounded-md px-3 py-1.5 text-[11px] font-semibold transition-all duration-200 ${
                                  isSubActive
                                    ? 'bg-primary/10 text-primary border border-primary/20'
                                    : 'text-muted-foreground hover:text-foreground'
                                }`}
                              >
                                <SubIcon className="h-3.5 w-3.5" />
                                <span>{sub.name}</span>
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Logout Area at bottom */}
      <div className="p-3 border-t border-border/20 bg-neutral-900/40 dark:bg-neutral-950/20">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs font-bold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          {!isCollapsed && <span>Keluar Sistem</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Drawer Overlay for Mobile */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        >
          <div 
            className="w-64 h-full animate-slide-right"
            onClick={(e) => e.stopPropagation()}
          >
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside 
        className={`hidden md:flex flex-col h-full shrink-0 transition-all duration-300 ${
          isCollapsed ? 'w-[72px]' : 'w-64'
        }`}
      >
        <SidebarContent />
      </aside>
    </>
  );
}
