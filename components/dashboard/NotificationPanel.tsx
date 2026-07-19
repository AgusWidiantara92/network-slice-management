import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { RecentActivity } from '@/services/dashboard/dashboard.service';
import { formatDate } from '@/utils/helpers';
import { UserPlus, Server, Network, ShieldCheck, RefreshCw, AlertTriangle, Info } from 'lucide-react';

interface NotificationPanelProps {
  activities: RecentActivity[];
}

export default function NotificationPanel({ activities }: NotificationPanelProps) {
  const getNotificationIcon = (action: string, status: 'SUCCESS' | 'FAILED') => {
    if (status === 'FAILED') return { icon: AlertTriangle, color: 'text-rose-500 bg-rose-500/10 border-rose-500/20' };

    const lower = action.toLowerCase();
    if (lower.includes('tenant')) return { icon: UserPlus, color: 'text-blue-500 bg-blue-500/10 border-blue-500/20' };
    if (lower.includes('router') || lower.includes('connect')) return { icon: Server, color: 'text-purple-500 bg-purple-500/10 border-purple-500/20' };
    if (lower.includes('slice')) return { icon: Network, color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' };
    if (lower.includes('rollback')) return { icon: RefreshCw, color: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20' };
    if (lower.includes('template') || lower.includes('deploy')) return { icon: ShieldCheck, color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' };

    return { icon: Info, color: 'text-neutral-500 bg-neutral-500/10 border-neutral-500/20' };
  };

  return (
    <Card className="col-span-1 overflow-hidden border border-border/40 bg-card/60 backdrop-blur-xs shadow-xs">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-bold tracking-tight text-foreground">
          Notifikasi & Log Audit
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground mt-0.5">
          Linimasa aktivitas sistem dan status provisioning terbaru
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 pb-6 max-h-[360px] overflow-y-auto pr-1">
        {activities.length > 0 ? (
          <div className="relative border-l border-border/30 pl-4 ml-3 space-y-4">
            {activities.map((act) => {
              const details = getNotificationIcon(act.action, act.status);
              const Icon = details.icon;
              const timestamp = new Date(act.time);

              return (
                <div key={act.id} className="relative group">
                  {/* Timeline bullet icon */}
                  <div className={`absolute -left-[27px] top-0.5 rounded-full border p-1 ${details.color}`}>
                    <Icon className="h-3 w-3" />
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold text-foreground">
                        {act.action}
                      </span>
                      <span className="text-[9px] text-muted-foreground whitespace-nowrap">
                        {formatDate(timestamp)}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      User: <strong className="text-foreground/75 font-medium">{act.user}</strong> • Router: <strong className="text-foreground/75 font-medium">{act.router}</strong>
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center justify-center py-12 text-xs text-muted-foreground">
            Belum ada notifikasi aktivitas terdaftar.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
