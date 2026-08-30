import React from 'react';

function formatDate(d: Date) {
  return d.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

interface WelcomeCardProps { userName?: string; role?: string; }

export default function WelcomeCard({ userName = 'Administrator', role = 'ADMIN' }: WelcomeCardProps) {
  const currentDateStr = formatDate(new Date());

  return (
    <div className="flex items-center justify-between py-1">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Welcome back, {userName}
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {currentDateStr} · <span className="font-semibold text-foreground">{role}</span>
        </p>
      </div>
      <div className="hidden sm:flex items-center text-xs">
        <span className="rounded-full bg-secondary px-3 py-1 text-foreground font-semibold border border-border">
          AI Enabled
        </span>
      </div>
    </div>
  );
}
