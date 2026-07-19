'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import type { SliceBandwidthPoint } from '@/services/dashboard/dashboard.service';

interface SliceChartProps {
  sliceBandwidth: SliceBandwidthPoint[];
}

export default function SliceChart({ sliceBandwidth }: SliceChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Card className="col-span-1 border border-border/40 bg-card/60 lg:col-span-3 min-h-[380px] flex items-center justify-center">
        <span className="text-sm text-muted-foreground animate-pulse">Memuat grafik...</span>
      </Card>
    );
  }

  return (
    <Card className="col-span-1 overflow-hidden border border-border/40 bg-card/60 backdrop-blur-xs lg:col-span-3 shadow-xs">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-bold tracking-tight text-foreground">
          Alokasi Bandwidth Per Tenant
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground mt-0.5">
          Total limit bandwidth Upload (Tx) dan Download (Rx) per tenant (Mbps)
        </CardDescription>
      </CardHeader>

      <CardContent className="px-2 sm:px-6 pb-6">
        <div className="h-[280px] w-full">
          {sliceBandwidth.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sliceBandwidth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} unit="M" />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(10,10,10,0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px', color: '#fff' }} 
                />
                <Legend verticalAlign="top" height={36} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="Tx" name="Upload (Tx)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Rx" name="Download (Rx)" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Belum ada data network slice.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
