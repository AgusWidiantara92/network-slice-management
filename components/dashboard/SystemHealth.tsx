import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { SystemHealthData } from '@/services/dashboard/dashboard.service';
import { Database, ServerCrash, Cpu, Brain, CalendarRange } from 'lucide-react';

interface SystemHealthProps {
  health: SystemHealthData;
}

export default function SystemHealth({ health }: SystemHealthProps) {
  const getStatusDetails = (status: 'GREEN' | 'YELLOW' | 'RED') => {
    switch (status) {
      case 'GREEN':
        return {
          label: 'Aktif / Optimal',
          color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
          dot: 'bg-emerald-400',
        };
      case 'YELLOW':
        return {
          label: 'Degradasi / Warning',
          color: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
          dot: 'bg-amber-400',
        };
      case 'RED':
        return {
          label: 'Gangguan / Offline',
          color: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
          dot: 'bg-rose-400',
        };
    }
  };

  const systems = [
    {
      name: 'Database PostgreSQL',
      desc: 'Penyimpanan data utama',
      status: health.dbStatus,
      icon: Database,
    },
    {
      name: 'Router API Engine',
      desc: 'Koneksi ke MikroTik RouterOS',
      status: health.routerApiStatus,
      icon: Cpu,
    },
    {
      name: 'LLM AI Engine',
      desc: 'Gemini / OpenAI Translation',
      status: health.llmProviderStatus,
      icon: Brain,
    },
    {
      name: 'Scheduler Daemon',
      desc: 'Cron task slice automation',
      status: health.schedulerStatus,
      icon: CalendarRange,
    },
  ];

  return (
    <Card className="col-span-1 overflow-hidden border border-border/40 bg-card/60 backdrop-blur-xs shadow-xs">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-bold tracking-tight text-foreground">
          Kesehatan Sistem
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground mt-0.5">
          Status operasional infrastruktur aplikasi
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 pb-6">
        {systems.map((sys, index) => {
          const Icon = sys.icon;
          const details = getStatusDetails(sys.status);

          return (
            <div 
              key={index}
              className="flex items-center justify-between p-3 rounded-xl border border-border/20 bg-neutral-900/20"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-neutral-900/60 p-2 text-primary border border-border/30">
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-foreground">{sys.name}</h4>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{sys.desc}</p>
                </div>
              </div>

              <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[9px] font-bold border ${details.color}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${details.dot}`} />
                <span>{details.label}</span>
              </span>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
