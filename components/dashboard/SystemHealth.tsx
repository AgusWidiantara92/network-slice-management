import React from 'react';
import type { SystemHealthData } from '@/services/dashboard/dashboard.service';

interface SystemHealthProps {
  health: SystemHealthData;
}

export default function SystemHealth({ health }: SystemHealthProps) {
  const getStatusDetails = (status: 'GREEN' | 'YELLOW' | 'RED') => {
    switch (status) {
      case 'GREEN': return { label: 'Optimal', text: 'text-emerald-500' };
      case 'YELLOW': return { label: 'Warning', text: 'text-amber-500' };
      case 'RED': return { label: 'Offline', text: 'text-rose-500' };
    }
  };

  const systems = [
    { name: 'Database', desc: 'PostgreSQL', status: health.dbStatus },
    { name: 'Router API', desc: 'MikroTik Engine', status: health.routerApiStatus },
    { name: 'AI Engine', desc: 'LLM Provider', status: health.llmProviderStatus },
    { name: 'Scheduler', desc: 'Cron Daemon', status: health.schedulerStatus },
  ];

  return (
    <div className="col-span-1 rounded-xl bg-card border border-border p-5 shadow-xs">
      <h3 className="text-[15px] font-bold text-foreground">Kesehatan Sistem</h3>
      <p className="text-[11px] text-muted-foreground mt-0.5 mb-4">Status infrastruktur</p>

      <div className="space-y-3">
        {systems.map((sys, i) => {
          const details = getStatusDetails(sys.status);
          return (
            <div key={i} className="flex items-center justify-between rounded-lg bg-secondary/60 p-3 border border-border/40">
              <div>
                <h4 className="text-[13px] font-semibold text-foreground">{sys.name}</h4>
                <p className="text-[10px] text-muted-foreground">{sys.desc}</p>
              </div>
              <span className={`text-[11px] font-semibold ${details.text}`}>
                {details.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
