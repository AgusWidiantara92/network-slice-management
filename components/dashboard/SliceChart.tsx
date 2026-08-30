'use client';

import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import type { SliceBandwidthPoint } from '@/services/dashboard/dashboard.service';

interface SliceChartProps {
  sliceBandwidth: SliceBandwidthPoint[];
}

export default function SliceChart({ sliceBandwidth }: SliceChartProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  if (!mounted) {
    return (
      <div className="col-span-1 lg:col-span-3 rounded-xl bg-card border border-border min-h-[380px] flex items-center justify-center">
        <span className="text-[13px] text-muted-foreground animate-pulse">Memuat grafik...</span>
      </div>
    );
  }

  return (
    <div className="col-span-1 lg:col-span-3 rounded-xl bg-card border border-border p-5 shadow-xs">
      <h3 className="text-[15px] font-bold text-foreground">Alokasi Bandwidth</h3>
      <p className="text-[11px] text-muted-foreground mt-0.5 mb-4">Upload (Tx) dan Download (Rx) per tenant (Mbps)</p>

      <div className="h-[280px] w-full">
        {sliceBandwidth.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sliceBandwidth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(150,150,150,0.15)" />
              <XAxis dataKey="name" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} unit="M" />
              <Tooltip contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '10px', fontSize: '12px', color: 'var(--card-foreground)', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }} />
              <Legend verticalAlign="top" height={36} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
              <Bar dataKey="Tx" name="Upload (Tx)" fill="#a855f7" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Rx" name="Download (Rx)" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-[13px] text-muted-foreground">
            Belum ada data network slice.
          </div>
        )}
      </div>
    </div>
  );
}
