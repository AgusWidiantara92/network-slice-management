import React from 'react';
import type { RecentActivity } from '@/services/dashboard/dashboard.service';
import { formatDate } from '@/utils/helpers';
import { UserPlus, Server, Network, ShieldCheck, RefreshCw, AlertTriangle, Info } from 'lucide-react';

interface NotificationPanelProps {
  activities: RecentActivity[];
}

export default function NotificationPanel({ activities }: NotificationPanelProps) {
  const getNotificationIcon = (action: string, status: 'SUCCESS' | 'FAILED') => {
    if (status === 'FAILED') return { icon: AlertTriangle, color: 'text-rose-500 bg-rose-500/10' };
    const lower = action.toLowerCase();
    if (lower.includes('tenant')) return { icon: UserPlus, color: 'text-foreground bg-secondary' };
    if (lower.includes('router') || lower.includes('connect')) return { icon: Server, color: 'text-foreground bg-secondary' };
    if (lower.includes('slice')) return { icon: Network, color: 'text-foreground bg-secondary' };
    if (lower.includes('rollback')) return { icon: RefreshCw, color: 'text-foreground bg-secondary' };
    if (lower.includes('template') || lower.includes('deploy')) return { icon: ShieldCheck, color: 'text-foreground bg-secondary' };
    return { icon: Info, color: 'text-muted-foreground bg-secondary' };
  };

  return (
    <div className="col-span-1 rounded-xl bg-card border border-border p-5 shadow-xs">
      <h3 className="text-[15px] font-bold text-foreground">Notifikasi</h3>
      <p className="text-[11px] text-muted-foreground mt-0.5 mb-4">Timeline aktivitas terbaru</p>

      <div className="max-h-[320px] overflow-y-auto custom-scrollbar pr-1">
        {activities.length > 0 ? (
          <div className="relative border-l border-border pl-4 ml-2 space-y-4">
            {activities.map((act) => {
              const details = getNotificationIcon(act.action, act.status);
              const Icon = details.icon;
              return (
                <div key={act.id} className="relative">
                  <div className={`absolute -left-[23px] top-0.5 rounded-full p-1 border border-border ${details.color}`}>
                    <Icon className="h-3 w-3" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[12px] font-semibold text-foreground">{act.action}</span>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">{formatDate(new Date(act.time))}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      {act.user} · {act.router}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center justify-center py-12 text-[13px] text-muted-foreground">
            Belum ada notifikasi.
          </div>
        )}
      </div>
    </div>
  );
}
