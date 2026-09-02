'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

const routeMap: Record<string, string> = {
  '': 'Dashboard',
  'tenants': 'Data Tenant',
  'routers': 'Router MikroTik',
  'network-slice': 'Network Slices',
  'scheduler': 'Scheduler Automasi',
  'ai-chat': 'AI Chat Operations',
  'configuration-template': 'Template Script',
  'llm-provider': 'LLM Settings',
  'logs': 'Log Audit',
};

export default function Breadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  return (
    <nav className="flex items-center space-x-1.5 text-xs font-semibold text-muted-foreground">
      {/* Root / Dashboard */}
      <Link
        href="/"
        className="flex items-center gap-1 hover:text-foreground transition-colors"
      >
        <Home className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Main</span>
      </Link>

      <ChevronRight className="h-3 w-3 shrink-0" />
      
      {segments.length === 0 ? (
        <span className="text-foreground">Dashboard</span>
      ) : (
        <Link
          href="/"
          className="hover:text-foreground transition-colors"
        >
          Dashboard
        </Link>
      )}

      {/* Nested segments */}
      {segments.map((segment, index) => {
        const isLast = index === segments.length - 1;
        const href = `/${segments.slice(0, index + 1).join('/')}`;
        const label = routeMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);

        return (
          <React.Fragment key={href}>
            <ChevronRight className="h-3 w-3 shrink-0" />
            {isLast ? (
              <span className="text-foreground truncate max-w-[120px] sm:max-w-none">{label}</span>
            ) : (
              <Link
                href={href}
                className="hover:text-foreground transition-colors truncate max-w-[120px] sm:max-w-none"
              >
                {label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
