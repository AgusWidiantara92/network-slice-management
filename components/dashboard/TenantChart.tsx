'use client';

import React, { useState, useEffect } from 'react';
import { 
  ResponsiveContainer, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend 
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

  useEffect(() => { setMounted(true); }, []);

  if (!mounted) {
    return (
      <div className="col-span-1 lg:col-span-2 rounded-xl bg-card border border-border min-h-[380px] flex items-center justify-center">
        <span className="text-[13px] text-muted-foreground animate-pulse">Memuat grafik...</span>
      </div>
    );
  }

  const hasTenantData = tenantGrowth.length > 0;
  const hasQosData = qosUsage.length > 0;

  return (
    <div className="col-span-1 lg:col-span-2 rounded-xl bg-card border border-border p-5 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-[15px] font-bold text-foreground">
            {activeTab === 'tenant' ? 'Pertumbuhan Tenant' : 'QoS Bandwidth'}
          </h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {activeTab === 'tenant' ? 'Pendaftaran tenant per bulan' : 'Upload & Download per tenant (Mbps)'}
          </p>
        </div>

        <div className="inline-flex rounded-lg bg-secondary p-0.5 border border-border">
          <button
            onClick={() => setActiveTab('tenant')}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[11px] font-semibold transition-all ${
              activeTab === 'tenant' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Users className="h-3 w-3" /> Tenant
          </button>
          <button
            onClick={() => setActiveTab('qos')}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[11px] font-semibold transition-all ${
              activeTab === 'qos' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Activity className="h-3 w-3" /> QoS
          </button>
        </div>
      </div>

      <div className="h-[280px] w-full">
        {activeTab === 'tenant' ? (
          hasTenantData ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={tenantGrowth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(150,150,150,0.15)" />
                <XAxis dataKey="name" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '10px', fontSize: '12px', color: 'var(--card-foreground)', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }} />
                <Line type="monotone" dataKey="value" name="Jumlah Tenant" stroke="var(--primary)" strokeWidth={2.5} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-[13px] text-muted-foreground">Belum ada data tenant.</div>
          )
        ) : (
          hasQosData ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={qosUsage} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorUpload" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0.0}/>
                  </linearGradient>
                  <linearGradient id="colorDownload" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(150,150,150,0.15)" />
                <XAxis dataKey="name" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} unit="M" />
                <Tooltip contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '10px', fontSize: '12px', color: 'var(--card-foreground)', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }} />
                <Legend verticalAlign="top" height={36} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
                <Area type="monotone" dataKey="Upload" stroke="#a855f7" strokeWidth={2} fillOpacity={1} fill="url(#colorUpload)" />
                <Area type="monotone" dataKey="Download" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorDownload)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-[13px] text-muted-foreground">Belum ada data QoS.</div>
          )
        )}
      </div>
    </div>
  );
}
