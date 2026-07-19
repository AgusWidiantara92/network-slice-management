import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Users, 
  Server, 
  Cpu, 
  ServerOff, 
  Network, 
  FileJson,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react';
import type { DashboardStats } from '@/services/dashboard/dashboard.service';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Users,
  Server,
  Cpu,
  ServerOff,
  Network,
  FileJson,
};

interface StatCardItem {
  title: string;
  value: number;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  desc: string;
  color: string;
  iconName: string;
}

function buildStatsItems(stats: DashboardStats): StatCardItem[] {
  return [
    {
      title: 'Total Tenant',
      value: stats.totalTenant,
      change: stats.totalTenant > 0 ? `${stats.totalTenant} aktif` : '0',
      trend: stats.totalTenant > 0 ? 'up' : 'neutral',
      desc: 'Terdaftar',
      color: 'from-blue-500/20 to-blue-600/5 border-blue-500/30 text-blue-500',
      iconName: 'Users',
    },
    {
      title: 'Total Router',
      value: stats.totalRouter,
      change: stats.totalRouter > 0 ? `${stats.totalRouter} unit` : '0',
      trend: stats.totalRouter > 0 ? 'up' : 'neutral',
      desc: 'Perangkat',
      color: 'from-purple-500/20 to-purple-600/5 border-purple-500/30 text-purple-500',
      iconName: 'Server',
    },
    {
      title: 'Router Online',
      value: stats.routerOnline,
      change: stats.totalRouter > 0
        ? `${Math.round((stats.routerOnline / stats.totalRouter) * 100)}%`
        : '0%',
      trend: stats.routerOnline > 0 ? 'up' : 'neutral',
      desc: 'Aktif terkoneksi',
      color: 'from-emerald-500/20 to-emerald-600/5 border-emerald-500/30 text-emerald-500',
      iconName: 'Cpu',
    },
    {
      title: 'Router Offline',
      value: stats.routerOffline,
      change: stats.routerOffline > 0 ? 'Butuh perhatian' : 'Aman',
      trend: stats.routerOffline > 0 ? 'down' : 'neutral',
      desc: stats.routerOffline > 0 ? 'Tidak terkoneksi' : 'Semua online',
      color: 'from-rose-500/20 to-rose-600/5 border-rose-500/30 text-rose-500',
      iconName: 'ServerOff',
    },
    {
      title: 'Total Network Slice',
      value: stats.totalSlice,
      change: stats.totalSlice > 0 ? `${stats.totalSlice} segmen` : '0',
      trend: stats.totalSlice > 0 ? 'up' : 'neutral',
      desc: 'Aktif di sistem',
      color: 'from-amber-500/20 to-amber-600/5 border-amber-500/30 text-amber-500',
      iconName: 'Network',
    },
    {
      title: 'Total Konfigurasi',
      value: stats.totalTemplate,
      change: stats.totalTemplate > 0 ? `${stats.totalTemplate} template` : '0',
      trend: stats.totalTemplate > 0 ? 'up' : 'neutral',
      desc: 'Template & Script',
      color: 'from-cyan-500/20 to-cyan-600/5 border-cyan-500/30 text-cyan-500',
      iconName: 'FileJson',
    },
  ];
}

interface StatsCardProps {
  stats: DashboardStats;
}

export default function StatsCard({ stats }: StatsCardProps) {
  const items = buildStatsItems(stats);

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {items.map((item, index) => {
        const Icon = iconMap[item.iconName] || Server;
        const isUp = item.trend === 'up';
        const isDown = item.trend === 'down';

        return (
          <Card key={index} className="overflow-hidden border border-border/40 bg-card/60 backdrop-blur-xs transition-all duration-300 hover:border-primary/20 hover:shadow-md">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  {item.title}
                </span>
                <div className={`rounded-lg border p-1.5 ${item.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>

              <div className="mt-3 space-y-1">
                <span className="text-2xl font-bold tracking-tight text-foreground">
                  {item.value}
                </span>

                <div className="flex items-center gap-1.5">
                  <span className={`inline-flex items-center gap-0.5 rounded-sm px-1.5 py-0.5 text-[10px] font-semibold ${
                    isUp 
                      ? 'bg-emerald-500/15 text-emerald-500' 
                      : isDown 
                        ? 'bg-rose-500/15 text-rose-500' 
                        : 'bg-neutral-500/15 text-neutral-500'
                  }`}>
                    {isUp && <ArrowUpRight className="h-2.5 w-2.5" />}
                    {isDown && <ArrowDownRight className="h-2.5 w-2.5" />}
                    {!isUp && !isDown && <Minus className="h-2.5 w-2.5" />}
                    <span>{item.change}</span>
                  </span>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                    {item.desc}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
