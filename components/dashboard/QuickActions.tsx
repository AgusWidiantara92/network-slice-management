import React from 'react';
import Link from 'next/link';

export default function QuickActions() {
  const actions = [
    { title: 'Tambah Tenant', desc: 'Registrasi tenant baru', href: '/tenants' },
    { title: 'Tambah Router', desc: 'Daftarkan MikroTik baru', href: '/routers' },
    { title: 'Network Slice', desc: 'Alokasikan VLAN & QoS', href: '/slices' },
    { title: 'AI Chat', desc: 'AI Assistant', href: '/slices?ai=true' },
    { title: 'Deploy', desc: 'Eksekusi template', href: '/templates' },
  ];

  return (
    <div className="grid gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
      {actions.map((act, i) => (
        <Link
          key={i}
          href={act.href}
          className="flex flex-col justify-center rounded-xl bg-card p-3.5 border border-border shadow-xs hover:bg-secondary transition-all group"
        >
          <h4 className="text-[13px] font-semibold text-foreground truncate">
            {act.title}
          </h4>
          <p className="text-[10px] text-muted-foreground truncate mt-0.5">{act.desc}</p>
        </Link>
      ))}
    </div>
  );
}
