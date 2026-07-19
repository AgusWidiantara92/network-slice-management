import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { DashboardSummaryData } from '@/services/dashboard/dashboard.service';
import { Spline, GitCommit, ShieldAlert, Sliders, CalendarClock } from 'lucide-react';

interface DashboardSummaryProps {
  summary: DashboardSummaryData;
}

export default function DashboardSummary({ summary }: DashboardSummaryProps) {
  const items = [
    {
      name: 'Total VLAN Interface',
      value: summary.totalVlan,
      icon: GitCommit,
      color: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    },
    {
      name: 'Total VRF Routing',
      value: summary.totalVrf,
      icon: Spline,
      color: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
    },
    {
      name: 'Total Firewall Rules',
      value: summary.totalFirewall,
      icon: ShieldAlert,
      color: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
    },
    {
      name: 'Total QoS Simple Queue',
      value: summary.totalQos,
      icon: Sliders,
      color: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
    },
    {
      name: 'Total Scheduler Aktif',
      value: summary.totalSchedulerActive,
      icon: CalendarClock,
      color: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20',
    },
  ];

  return (
    <Card className="col-span-1 overflow-hidden border border-border/40 bg-card/60 backdrop-blur-xs shadow-xs">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-bold tracking-tight text-foreground">
          Ringkasan Jaringan
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground mt-0.5">
          Akumulasi entri konfigurasi logis di seluruh router
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3.5 pb-6">
        {items.map((item, index) => {
          const Icon = item.icon;
          return (
            <div 
              key={index}
              className="flex items-center justify-between p-2.5 rounded-xl border border-border/20 bg-neutral-900/15"
            >
              <div className="flex items-center gap-3">
                <div className={`rounded-lg border p-1.5 ${item.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <span className="text-xs font-semibold text-muted-foreground">
                  {item.name}
                </span>
              </div>
              <span className="text-sm font-extrabold tracking-tight text-foreground">
                {item.value}
              </span>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
