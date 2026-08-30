import React from 'react';
import type { DashboardSummaryData } from '@/services/dashboard/dashboard.service';
import { GitCommit, Spline, ShieldAlert, Sliders, CalendarClock } from 'lucide-react';

interface DashboardSummaryProps {
  summary: DashboardSummaryData;
}

export default function DashboardSummary({ summary }: DashboardSummaryProps) {
  const items = [
    { name: 'VLAN Interface', value: summary.totalVlan, icon: GitCommit },
    { name: 'VRF Routing', value: summary.totalVrf, icon: Spline },
    { name: 'Firewall Rules', value: summary.totalFirewall, icon: ShieldAlert },
    { name: 'QoS Queue', value: summary.totalQos, icon: Sliders },
    { name: 'Scheduler Aktif', value: summary.totalSchedulerActive, icon: CalendarClock },
  ];

  return (
    <div className="col-span-1 rounded-xl bg-card border border-border p-5 shadow-xs">
      <h3 className="text-[15px] font-bold text-foreground">Ringkasan Jaringan</h3>
      <p className="text-[11px] text-muted-foreground mt-0.5 mb-4">Entri konfigurasi logis</p>

      <div className="space-y-2.5">
        {items.map((item, i) => {
          const Icon = item.icon;
          return (
            <div key={i} className="flex items-center justify-between rounded-lg bg-secondary/60 p-3 border border-border/40">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-background p-1.5 border border-border text-foreground">
                  <Icon className="h-4 w-4" />
                </div>
                <span className="text-[13px] font-medium text-muted-foreground">{item.name}</span>
              </div>
              <span className="text-[15px] font-bold text-foreground">{item.value}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
