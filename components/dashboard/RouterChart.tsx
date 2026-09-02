'use client';

import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import type { RouterStatusPoint } from '@/services/dashboard/dashboard.service';

interface RouterChartProps {
  routerStatus: RouterStatusPoint[];
}

export default function RouterChart({ routerStatus }: RouterChartProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { queueMicrotask(() => setMounted(true)); }, []);

  if (!mounted) {
    return (
      <div className="col-span-1 rounded-xl bg-card border border-border min-h-[380px] flex items-center justify-center">
        <span className="text-[13px] text-muted-foreground animate-pulse">Memuat grafik...</span>
      </div>
    );
  }

  const total = routerStatus.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <div className="col-span-1 rounded-xl bg-card border border-border p-5 shadow-xs">
      <h3 className="text-[15px] font-bold text-foreground">Status Router</h3>
      <p className="text-[11px] text-muted-foreground mt-0.5">Kondisi koneksi perangkat</p>

      {total > 0 ? (
        <>
          <div className="relative flex items-center justify-center h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '10px', fontSize: '12px', color: 'var(--card-foreground)', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }} />
                <Pie data={routerStatus} cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={4} dataKey="value">
                  {routerStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-bold tracking-tight text-foreground">{total}</span>
              <span className="text-[10px] font-medium text-muted-foreground">Total</span>
            </div>
          </div>

          <div className="space-y-2 mt-2">
            {routerStatus.map((item, index) => {
              const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
              return (
                <div key={index} className="flex items-center justify-between rounded-lg bg-secondary/60 p-2.5 border border-border/40">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-[13px] font-medium text-foreground">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[13px]">
                    <span className="text-muted-foreground">{item.value}</span>
                    <span className="font-semibold text-foreground">{pct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div className="flex h-[280px] items-center justify-center text-[13px] text-muted-foreground">
          Belum ada router terdaftar.
        </div>
      )}
    </div>
  );
}
