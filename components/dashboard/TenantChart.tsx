'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  AreaChart, 
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import type { TenantGrowthPoint, QosUsagePoint } from '@/services/dashboard/dashboard.service';
import { Users, Activity } from 'lucide-react';

interface TenantChartProps {
  tenantGrowth: TenantGrowthPoint[];
  qosUsage: QosUsagePoint[];
}

export default function TenantChart({ tenantGrowth, qosUsage }: TenantChartProps) {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'tenant' | 'qos'>('tenant');

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Card className="col-span-1 border border-border/40 bg-card/60 lg:col-span-2 min-h-[380px] flex items-center justify-center">
        <span className="text-sm text-muted-foreground animate-pulse">Memuat grafik...</span>
      </Card>
    );
  }

  const hasTenantData = tenantGrowth.length > 0;
  const hasQosData = qosUsage.length > 0;

  return (
    <Card className="col-span-1 overflow-hidden border border-border/40 bg-card/60 backdrop-blur-xs lg:col-span-2 shadow-xs">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="text-lg font-bold tracking-tight text-foreground">
            {activeTab === 'tenant' ? 'Pertumbuhan Tenant' : 'Penggunaan QoS Bandwidth'}
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground mt-0.5">
            {activeTab === 'tenant' 
              ? 'Statistik pendaftaran tenant baru per bulan' 
              : 'Total bandwidth Upload & Download per tenant (Mbps)'}
          </CardDescription>
        </div>

        <div className="inline-flex rounded-lg border border-border bg-neutral-900/60 p-0.5 backdrop-blur-xs">
          <button
            onClick={() => setActiveTab('tenant')}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
              activeTab === 'tenant'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>Tenant</span>
          </button>
          <button
            onClick={() => setActiveTab('qos')}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
              activeTab === 'qos'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Activity className="h-3.5 w-3.5" />
            <span>QoS</span>
          </button>
        </div>
      </CardHeader>

      <CardContent className="px-2 sm:px-6 pb-6">
        <div className="h-[280px] w-full">
          {activeTab === 'tenant' ? (
            hasTenantData ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={tenantGrowth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(10,10,10,0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px', color: '#fff' }} 
                  />
                  <Line type="monotone" dataKey="value" name="Jumlah Tenant" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Belum ada data tenant.</div>
            )
          ) : (
            hasQosData ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={qosUsage} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorUpload" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ec4899" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#ec4899" stopOpacity={0.0}/>
                    </linearGradient>
                    <linearGradient id="colorDownload" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} unit="M" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(10,10,10,0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px', color: '#fff' }} 
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
                  <Area type="monotone" dataKey="Upload" stroke="#ec4899" strokeWidth={2} fillOpacity={1} fill="url(#colorUpload)" />
                  <Area type="monotone" dataKey="Download" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorDownload)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Belum ada data QoS.</div>
            )
          )}
        </div>
      </CardContent>
    </Card>
  );
}
