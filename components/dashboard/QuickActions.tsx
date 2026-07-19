import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PlusCircle, Server, Network, BrainCircuit, Play, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function QuickActions() {
  const actions = [
    {
      title: 'Tambah Tenant',
      desc: 'Registrasi tenant baru',
      href: '/tenants',
      icon: PlusCircle,
      color: 'bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20',
    },
    {
      title: 'Tambah Router',
      desc: 'Daftarkan MikroTik baru',
      href: '/routers',
      icon: Server,
      color: 'bg-purple-500/10 text-purple-400 border-purple-500/20 hover:bg-purple-500/20',
    },
    {
      title: 'Buat Network Slice',
      desc: 'Alokasikan VLAN & QoS',
      href: '/slices',
      icon: Network,
      color: 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20',
    },
    {
      title: 'Buka AI Chat',
      desc: 'AI Provisioning Assistant',
      href: '/slices?ai=true',
      icon: BrainCircuit,
      color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20 hover:bg-cyan-500/20',
    },
    {
      title: 'Deploy Konfigurasi',
      desc: 'Eksekusi script template',
      href: '/templates',
      icon: Play,
      color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20',
    },
  ];

  return (
    <Card className="col-span-1 overflow-hidden border border-border/40 bg-card/60 backdrop-blur-xs shadow-xs">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-bold tracking-tight text-foreground">
          Aksi Cepat
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground mt-0.5">
          Jalan pintas untuk tugas operasional rutin
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3 pb-6">
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {actions.map((act, index) => {
            const Icon = act.icon;
            return (
              <Link 
                key={index} 
                href={act.href}
                className={`flex flex-col justify-between p-4 rounded-xl border transition-all duration-300 group ${act.color}`}
              >
                <div className="space-y-3">
                  <div className="inline-flex rounded-lg p-2 border border-current/10 bg-current/5">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold tracking-tight text-foreground group-hover:text-current transition-colors">
                      {act.title}
                    </h4>
                    <p className="text-[11px] text-muted-foreground mt-1 line-clamp-1">
                      {act.desc}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-end mt-4 text-[10px] font-semibold tracking-wider uppercase opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span className="flex items-center gap-1">
                    Buka <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
