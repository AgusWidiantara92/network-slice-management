import React from 'react';
import type { DashboardStats } from '@/services/dashboard/dashboard.service';

interface StatCardItem {
  title: string;
  value: number;
  change: string;
  desc: string;
}

function buildStatsItems(stats: DashboardStats): StatCardItem[] {
  return [
    {
      title: 'Total Tenant',
      value: stats.totalTenant,
      change: stats.totalTenant > 0 ? `${stats.totalTenant} aktif` : '0',
      desc: 'Terdaftar',
    },
    {
      title: 'Total Router',
      value: stats.totalRouter,
      change: stats.totalRouter > 0 ? `${stats.totalRouter} unit` : '0',
      desc: 'Perangkat',
    },
    {
      title: 'Router Online',
      value: stats.routerOnline,
      change: stats.totalRouter > 0 ? `${Math.round((stats.routerOnline / stats.totalRouter) * 100)}%` : '0%',
      desc: 'Aktif terkoneksi',
    },
    {
      title: 'Router Offline',
      value: stats.routerOffline,
      change: stats.routerOffline > 0 ? 'Butuh perhatian' : 'Aman',
      desc: stats.routerOffline > 0 ? 'Tidak terkoneksi' : 'Semua online',
    },
    {
      title: 'Network Slice',
      value: stats.totalSlice,
      change: stats.totalSlice > 0 ? `${stats.totalSlice} segmen` : '0',
      desc: 'Aktif di sistem',
    },
    {
      title: 'Konfigurasi',
      value: stats.totalTemplate,
      change: stats.totalTemplate > 0 ? `${stats.totalTemplate} template` : '0',
      desc: 'Template & Script',
    },
  ];
}

interface StatsCardProps {
  stats: DashboardStats;
}

export default function StatsCard({ stats }: StatsCardProps) {
  const items = buildStatsItems(stats);

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {items.map((item, index) => (
        <div key={index} className="rounded-xl bg-card border border-border p-4 shadow-xs">
          <span className="text-xs font-medium text-muted-foreground block">
            {item.title}
          </span>

          <div className="mt-2">
            <span className="text-2xl font-bold tracking-tight text-foreground block">
              {item.value}
            </span>

            <div className="flex items-center gap-1.5 mt-1 text-[10px]">
              <span className="font-semibold text-foreground">
                {item.change}
              </span>
              <span className="text-muted-foreground">
                · {item.desc}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
