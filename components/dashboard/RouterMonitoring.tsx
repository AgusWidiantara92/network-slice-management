import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { RouterMonitorPoint } from '@/services/dashboard/dashboard.service';
import { CheckCircle2, XCircle, AlertTriangle, Cpu, HardDrive } from 'lucide-react';

interface RouterMonitoringProps {
  routers: RouterMonitorPoint[];
}

export default function RouterMonitoring({ routers }: RouterMonitoringProps) {
  const getResourceColor = (val: number) => {
    if (val >= 80) return 'bg-rose-500';
    if (val >= 50) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  return (
    <Card className="col-span-1 overflow-hidden border border-border/40 bg-card/60 backdrop-blur-xs lg:col-span-3 shadow-xs">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-bold tracking-tight text-foreground">
          Monitoring RouterOS
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground mt-0.5">
          Sumber daya CPU, memori, status koneksi, dan uptime router real-time
        </CardDescription>
      </CardHeader>

      <CardContent className="p-0">
        {routers.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-neutral-900/40">
                <TableRow className="border-b border-border/30 hover:bg-transparent">
                  <TableHead className="text-xs font-semibold text-muted-foreground">Nama Router</TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground">Host / IP</TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground">Status</TableHead>
                  <TableHead className="w-[140px] text-xs font-semibold text-muted-foreground">CPU Usage</TableHead>
                  <TableHead className="w-[140px] text-xs font-semibold text-muted-foreground">Memory Usage</TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground">Uptime</TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground">Last Sync</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {routers.map((router) => {
                  const isOnline = router.status === 'CONNECTED';
                  const isError = router.status === 'ERROR';

                  return (
                    <TableRow key={router.id} className="border-b border-border/20 hover:bg-neutral-900/10">
                      <TableCell className="text-xs font-bold text-foreground">
                        {router.name}
                      </TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">
                        {router.host}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                          isOnline 
                            ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                            : isError
                              ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                              : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                        }`}>
                          {isOnline ? (
                            <CheckCircle2 className="h-3 w-3" />
                          ) : isError ? (
                            <AlertTriangle className="h-3 w-3" />
                          ) : (
                            <XCircle className="h-3 w-3" />
                          )}
                          <span>{isOnline ? 'Online' : isError ? 'Error' : 'Offline'}</span>
                        </span>
                      </TableCell>
                      
                      {/* CPU Progress Bar */}
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground">
                            <span className="flex items-center gap-1"><Cpu className="h-2.5 w-2.5 text-primary" /> CPU</span>
                            <span>{router.cpu}%</span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-neutral-800 overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${getResourceColor(router.cpu)}`}
                              style={{ width: `${router.cpu}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>

                      {/* Memory Progress Bar */}
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground">
                            <span className="flex items-center gap-1"><HardDrive className="h-2.5 w-2.5 text-blue-400" /> RAM</span>
                            <span>{router.memory}%</span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-neutral-800 overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${getResourceColor(router.memory)}`}
                              style={{ width: `${router.memory}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {router.uptime}
                      </TableCell>
                      
                      <TableCell className="text-xs font-mono text-muted-foreground whitespace-nowrap">
                        {router.lastSync}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
            Belum ada router terdaftar untuk dimonitor.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
