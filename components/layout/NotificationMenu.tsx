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
  { id: '1', title: 'Router Connected', desc: 'MikroTik Core-01 berhasil terhubung kembali.', time: '5 menit lalu', type: 'router', unread: true },
  { id: '2', title: 'Deployment Success', desc: 'Slice-Marketing berhasil dikonfigurasi di Edge-02.', time: '20 menit lalu', type: 'deploy', unread: true },
  { id: '3', title: 'Rollback Success', desc: 'Konfigurasi Slice-Guest berhasil di-rollback.', time: '1 jam lalu', type: 'rollback', unread: false },
  { id: '4', title: 'Tenant Created', desc: 'Tenant baru "CV Sinar Mandiri" telah didaftarkan.', time: '3 jam lalu', type: 'tenant', unread: false },
  { id: '5', title: 'LLM Connected', desc: 'Integrasi dengan model Gemini 1.5 Pro aktif.', time: '1 hari lalu', type: 'llm', unread: false },
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
      case 'router': return Server;
      case 'deploy': return CheckCircle2;
      case 'rollback': return RefreshCw;
      case 'tenant': return UserPlus;
      case 'llm': return BrainCircuit;
      default: return Bell;
    }
  };

  const unreadCount = mockNotifications.filter(n => n.unread).length;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell Button */}
      <button
        onClick={() => setOpen(!open)}
        className="relative rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors border border-border"
        title="Notifikasi"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {open && (
        <div className="absolute right-0 mt-2 w-80 rounded-xl bg-card p-1.5 shadow-xl border border-border z-50">
          <div className="flex items-center justify-between px-3 py-2 border-b border-border">
            <span className="text-[13px] font-semibold text-foreground">Notifikasi</span>
            <span className="text-[11px] text-muted-foreground">{unreadCount} baru</span>
          </div>

          <div className="max-h-[300px] overflow-y-auto mt-1 space-y-0.5">
            {mockNotifications.map((notif) => {
              const Icon = getIcon(notif.type);
              return (
                <div
                  key={notif.id}
                  className={`flex gap-3 p-2.5 rounded-lg hover:bg-secondary transition-colors cursor-pointer ${
                    notif.unread ? 'bg-secondary/60' : ''
                  }`}
                >
                  <div className="rounded-lg p-1.5 h-fit bg-secondary border border-border text-foreground">
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="space-y-0.5 overflow-hidden flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-[13px] text-foreground truncate ${notif.unread ? 'font-semibold' : 'font-medium'}`}>
                        {notif.title}
                      </span>
                      {notif.unread && (
                        <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                      {notif.desc}
                    </p>
                    <span className="text-[10px] text-muted-foreground/70 block mt-0.5">
                      {notif.time}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="border-t border-border p-2 text-center">
            <button className="text-[11px] font-medium text-foreground hover:underline">
              Tandai semua terbaca
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
