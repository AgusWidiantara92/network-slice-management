import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { RouterMonitorPoint } from '@/services/dashboard/dashboard.service';
import { Inbox } from 'lucide-react';

interface RouterMonitoringProps {
  routers: RouterMonitorPoint[];
}

export default function RouterMonitoring({ routers }: RouterMonitoringProps) {
  const getBarColor = (val: number) => {
    if (val >= 80) return 'bg-rose-500';
    if (val >= 50) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  return (
    <div className="col-span-1 lg:col-span-3 rounded-xl bg-card border border-border shadow-xs overflow-hidden">
      <div className="px-5 pt-5 pb-3">
        <h3 className="text-[15px] font-bold text-foreground">Monitoring Router</h3>
        <p className="text-[11px] text-muted-foreground mt-0.5">CPU, memori, dan status koneksi</p>
      </div>

      {routers.length > 0 ? (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border hover:bg-transparent">
                <TableHead className="text-[11px] font-medium text-muted-foreground py-2.5 pl-5">Router</TableHead>
                <TableHead className="text-[11px] font-medium text-muted-foreground py-2.5">Host</TableHead>
                <TableHead className="text-[11px] font-medium text-muted-foreground py-2.5">Status</TableHead>
                <TableHead className="text-[11px] font-medium text-muted-foreground w-[120px] py-2.5">CPU</TableHead>
                <TableHead className="text-[11px] font-medium text-muted-foreground w-[120px] py-2.5">Memory</TableHead>
                <TableHead className="text-[11px] font-medium text-muted-foreground py-2.5">Uptime</TableHead>
                <TableHead className="text-[11px] font-medium text-muted-foreground py-2.5 pr-5">Last Sync</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {routers.map((router) => {
                const isOnline = router.status === 'CONNECTED';
                return (
                  <TableRow key={router.id} className="border-b border-border/50 hover:bg-secondary/60 transition-colors">
                    <TableCell className="text-[13px] font-semibold text-foreground py-3 pl-5">{router.name}</TableCell>
                    <TableCell className="text-[13px] font-mono text-muted-foreground py-3">{router.host}</TableCell>
                    <TableCell className="py-3">
                      <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold ${isOnline ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-muted-foreground'}`} />
                        {isOnline ? 'Online' : 'Offline'}
                      </span>
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="space-y-1">
                        <span className="text-[11px] font-mono text-foreground">{router.cpu}%</span>
                        <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                          <div className={`h-full rounded-full ${getBarColor(router.cpu)}`} style={{ width: `${router.cpu}%` }} />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="space-y-1">
                        <span className="text-[11px] font-mono text-foreground">{router.memory}%</span>
                        <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                          <div className={`h-full rounded-full ${getBarColor(router.memory)}`} style={{ width: `${router.memory}%` }} />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-[13px] text-muted-foreground whitespace-nowrap py-3">{router.uptime}</TableCell>
                    <TableCell className="text-[13px] font-mono text-muted-foreground whitespace-nowrap py-3 pr-5">{router.lastSync}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-2 py-12">
          <Inbox className="h-8 w-8 text-muted-foreground" />
          <span className="text-[13px] text-muted-foreground">Belum ada router untuk dimonitor.</span>
        </div>
      )}
    </div>
  );
}
