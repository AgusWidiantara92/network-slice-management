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
import type { RecentActivity } from '@/services/dashboard/dashboard.service';
import { formatDate } from '@/utils/helpers';
import { CheckCircle2, XCircle, Clock, Inbox } from 'lucide-react';

interface ActivityTableProps {
  activities: RecentActivity[];
}

export default function ActivityTable({ activities }: ActivityTableProps) {
  return (
    <Card className="col-span-1 overflow-hidden border border-border/40 bg-card/60 backdrop-blur-xs lg:col-span-3 shadow-xs">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-bold tracking-tight text-foreground">
              Aktivitas Terbaru
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              Log riwayat operasi network slicing terakhir di sistem
            </CardDescription>
          </div>
          <Clock className="h-5 w-5 text-muted-foreground" />
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {activities.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-neutral-900/40">
                <TableRow className="border-b border-border/30 hover:bg-transparent">
                  <TableHead className="w-[180px] text-xs font-semibold text-muted-foreground">Waktu</TableHead>
                  <TableHead className="w-[150px] text-xs font-semibold text-muted-foreground">User</TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground">Aktivitas</TableHead>
                  <TableHead className="w-[150px] text-xs font-semibold text-muted-foreground">Router</TableHead>
                  <TableHead className="w-[100px] text-center text-xs font-semibold text-muted-foreground">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activities.map((activity) => {
                  const isSuccess = activity.status === 'SUCCESS';
                  const activityTime = new Date(activity.time);

                  return (
                    <TableRow key={activity.id} className="border-b border-border/20 hover:bg-neutral-900/10">
                      <TableCell className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                        {formatDate(activityTime)}
                      </TableCell>
                      <TableCell className="text-xs font-semibold text-foreground whitespace-nowrap">
                        {activity.user}
                      </TableCell>
                      <TableCell className="text-xs text-foreground max-w-[300px] truncate">
                        {activity.action}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {activity.router}
                      </TableCell>
                      <TableCell className="text-center whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                          isSuccess 
                            ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                            : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                        }`}>
                          {isSuccess ? (
                            <CheckCircle2 className="h-3 w-3" />
                          ) : (
                            <XCircle className="h-3 w-3" />
                          )}
                          <span>{isSuccess ? 'Success' : 'Failed'}</span>
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
            <Inbox className="h-8 w-8" />
            <span className="text-sm">Belum ada aktivitas tercatat.</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
