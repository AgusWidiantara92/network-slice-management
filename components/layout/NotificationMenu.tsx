'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Bell, CheckCircle2, Server, UserPlus, BrainCircuit, RefreshCw } from 'lucide-react';

interface MockNotification {
  id: string;
  title: string;
  desc: string;
  time: string;
  type: 'router' | 'deploy' | 'rollback' | 'tenant' | 'llm';
  unread: boolean;
}

const mockNotifications: MockNotification[] = [
  {
    id: '1',
    title: 'Router Connected',
    desc: 'MikroTik Core-01 berhasil terhubung kembali.',
    time: '5 menit yang lalu',
    type: 'router',
    unread: true,
  },
  {
    id: '2',
    title: 'Deployment Success',
    desc: 'Slice-Marketing berhasil dikonfigurasi di Edge-02.',
    time: '20 menit yang lalu',
    type: 'deploy',
    unread: true,
  },
  {
    id: '3',
    title: 'Rollback Success',
    desc: 'Konfigurasi Slice-Guest berhasil di-rollback.',
    time: '1 jam yang lalu',
    type: 'rollback',
    unread: false,
  },
  {
    id: '4',
    title: 'Tenant Created',
    desc: 'Tenant baru "CV Sinar Mandiri" telah didaftarkan.',
    time: '3 jam yang lalu',
    type: 'tenant',
    unread: false,
  },
  {
    id: '5',
    title: 'LLM Connected',
    desc: 'Integrasi dengan model Gemini 1.5 Pro aktif.',
    time: '1 hari yang lalu',
    type: 'llm',
    unread: false,
  },
];

export default function NotificationMenu() {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case 'router': return { icon: Server, color: 'text-purple-500 bg-purple-500/10' };
      case 'deploy': return { icon: CheckCircle2, color: 'text-emerald-500 bg-emerald-500/10' };
      case 'rollback': return { icon: RefreshCw, color: 'text-cyan-500 bg-cyan-500/10' };
      case 'tenant': return { icon: UserPlus, color: 'text-blue-500 bg-blue-500/10' };
      case 'llm': return { icon: BrainCircuit, color: 'text-amber-500 bg-amber-500/10' };
      default: return { icon: Bell, color: 'text-neutral-500 bg-neutral-500/10' };
    }
  };

  const unreadCount = mockNotifications.filter(n => n.unread).length;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setOpen(!open)}
        className="relative rounded-lg p-2 text-muted-foreground hover:bg-neutral-800/60 hover:text-foreground transition-all duration-200"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white ring-2 ring-neutral-950">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div className="absolute right-0 mt-2 w-80 rounded-xl border border-border/40 bg-neutral-900/90 backdrop-blur-md p-1 shadow-xl z-50">
          <div className="flex items-center justify-between px-4 py-2 border-b border-border/20">
            <span className="text-xs font-bold text-foreground">Notifikasi</span>
            <span className="text-[10px] font-semibold text-muted-foreground">{unreadCount} baru</span>
          </div>

          <div className="max-h-[300px] overflow-y-auto mt-1 space-y-0.5">
            {mockNotifications.map((notif) => {
              const details = getIcon(notif.type);
              const Icon = details.icon;

              return (
                <div
                  key={notif.id}
                  className={`flex gap-3 p-3 rounded-lg hover:bg-neutral-800/40 transition-colors cursor-pointer ${
                    notif.unread ? 'bg-neutral-800/10' : ''
                  }`}
                >
                  <div className={`rounded-lg p-1.5 h-fit border border-current/5 ${details.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="space-y-0.5 overflow-hidden">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-xs font-bold text-foreground truncate ${notif.unread ? 'font-extrabold' : ''}`}>
                        {notif.title}
                      </span>
                      {notif.unread && (
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground line-clamp-2 leading-relaxed">
                      {notif.desc}
                    </p>
                    <span className="text-[9px] text-muted-foreground/75 block">
                      {notif.time}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="border-t border-border/20 p-2 text-center">
            <button className="text-[10px] font-bold tracking-wide uppercase text-primary hover:underline">
              Tandai semua terbaca
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
