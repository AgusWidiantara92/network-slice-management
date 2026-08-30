import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { RecentActivity } from '@/services/dashboard/dashboard.service';
import { formatDate } from '@/utils/helpers';
import { CheckCircle2, XCircle, Inbox } from 'lucide-react';

interface ActivityTableProps {
  activities: RecentActivity[];
}

export default function ActivityTable({ activities }: ActivityTableProps) {
  return (
    <div className="col-span-1 lg:col-span-3 rounded-xl bg-card border border-border shadow-xs overflow-hidden">
      <div className="px-5 pt-5 pb-3">
        <h3 className="text-[15px] font-bold text-foreground">Aktivitas Terbaru</h3>
        <p className="text-[11px] text-muted-foreground mt-0.5">Log riwayat operasi terakhir</p>
      </div>

      {activities.length > 0 ? (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border hover:bg-transparent">
                <TableHead className="text-[11px] font-medium text-muted-foreground py-2.5 pl-5">Waktu</TableHead>
                <TableHead className="text-[11px] font-medium text-muted-foreground py-2.5">User</TableHead>
                <TableHead className="text-[11px] font-medium text-muted-foreground py-2.5">Aktivitas</TableHead>
                <TableHead className="text-[11px] font-medium text-muted-foreground py-2.5">Router</TableHead>
                <TableHead className="text-[11px] font-medium text-muted-foreground text-center py-2.5 pr-5">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activities.map((activity) => {
                const isSuccess = activity.status === 'SUCCESS';
                return (
                  <TableRow key={activity.id} className="border-b border-border/50 hover:bg-secondary/60 transition-colors">
                    <TableCell className="text-[13px] text-muted-foreground whitespace-nowrap py-3 pl-5">
                      {formatDate(new Date(activity.time))}
                    </TableCell>
                    <TableCell className="text-[13px] font-semibold text-foreground whitespace-nowrap py-3">
                      {activity.user}
                    </TableCell>
                    <TableCell className="text-[13px] text-foreground max-w-[300px] truncate py-3">
                      {activity.action}
                    </TableCell>
                    <TableCell className="text-[13px] text-muted-foreground whitespace-nowrap py-3">
                      {activity.router}
                    </TableCell>
                    <TableCell className="text-center whitespace-nowrap py-3 pr-5">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
                        isSuccess ? 'text-emerald-500' : 'text-rose-500'
                      }`}>
                        {isSuccess ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                        {isSuccess ? 'Success' : 'Failed'}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-2 py-12">
          <Inbox className="h-8 w-8 text-muted-foreground" />
          <span className="text-[13px] text-muted-foreground">Belum ada aktivitas tercatat.</span>
        </div>
      )}
    </div>
  );
}
