import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, Calendar, Terminal } from 'lucide-react';
import { formatDate } from '@/utils/helpers';

interface WelcomeCardProps {
  userName?: string;
  role?: string;
}

export default function WelcomeCard({ userName = 'Administrator', role = 'ADMIN' }: WelcomeCardProps) {
  const currentDateStr = formatDate(new Date());

  return (
    <Card className="relative overflow-hidden border border-border/40 bg-linear-to-r from-neutral-900 via-neutral-950 to-neutral-900 shadow-xl">
      {/* Decorative ambient light gradients */}
      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />

      <CardContent className="relative p-6 sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Sparkles className="h-3 w-3 animate-pulse" />
              <span>Sistem Operasional</span>
            </div>
            
            <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              Selamat Datang Kembali, <span className="bg-linear-to-r from-primary to-blue-400 bg-clip-text text-transparent">{userName}</span>
            </h1>
            
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Aplikasi manajemen network slicing berbasis kecerdasan buatan untuk MikroTik RouterOS. Anda login sebagai <span className="font-semibold text-foreground">{role}</span>. Pantau dan konfigurasi segmentasi bandwidth secara dinamis dari dasbor ini.
            </p>
          </div>

          <div className="flex flex-col gap-3 rounded-xl border border-border/50 bg-neutral-900/60 p-4 backdrop-blur-xs min-w-[200px]">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="h-4 w-4 text-primary" />
              <span>{currentDateStr}</span>
            </div>
            <div className="h-px bg-border/50" />
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Terminal className="h-4 w-4 text-blue-400" />
              <span>LLM Engine: <strong className="text-foreground font-semibold">Gemini</strong></span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
