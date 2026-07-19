'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import type { RouterStatusPoint } from '@/services/dashboard/dashboard.service';

interface RouterChartProps {
  routerStatus: RouterStatusPoint[];
}

export default function RouterChart({ routerStatus }: RouterChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Card className="col-span-1 border border-border/40 bg-card/60 min-h-[380px] flex items-center justify-center">
        <span className="text-sm text-muted-foreground animate-pulse">Memuat grafik...</span>
      </Card>
    );
  }

  const total = routerStatus.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <Card className="col-span-1 overflow-hidden border border-border/40 bg-card/60 backdrop-blur-xs shadow-xs">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-bold tracking-tight text-foreground">
          Status Router
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground mt-0.5">
          Kondisi koneksi perangkat router MikroTik
        </CardDescription>
      </CardHeader>

      <CardContent className="pb-6">
        {total > 0 ? (
          <>
            <div className="relative flex items-center justify-center h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(10,10,10,0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px', color: '#fff' }} 
                  />
                  <Pie data={routerStatus} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={4} dataKey="value">
                    {routerStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-bold tracking-tight text-foreground">{total}</span>
                <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Total Router</span>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              {routerStatus.map((item, index) => {
                const percentage = total > 0 ? Math.round((item.value / total) * 100) : 0;
                return (
                  <div key={index} className="flex items-center justify-between rounded-lg border border-border/30 bg-neutral-900/30 p-2 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="font-medium text-foreground">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-muted-foreground">{item.value} Device</span>
                      <span className="font-semibold text-foreground">{percentage}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
            Belum ada router terdaftar.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
