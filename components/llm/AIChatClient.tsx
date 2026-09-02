'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import {
  Sparkles, Send, Bot, User, Loader2, ShieldCheck,
  Cpu, ArrowRight, Zap
} from 'lucide-react';
import { StructuredSliceCommand } from '@/services/llm.service';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  parsedCommand?: StructuredSliceCommand;
  providerName?: string;
  timestamp: string;
}

const QUICK_PROMPTS = [
  'Buatkan network slice baru untuk Tenant Akademik dengan VLAN 101, VRF akademik_vrf, dan bandwidth 50M.',
  'Isolasi tenant Dosen menggunakan VRF dengan VLAN 200 dan alokasi bandwidth 20Mbps.',
  'Ubah batas bandwidth untuk Tenant Mahasiswa menjadi 10M upload dan 10M download.',
  'Hapus konfigurasi network slice milik Tenant Tamu.',
];

export default function AIChatClient() {
  const msgCounterRef = React.useRef(0);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: 'Halo Admin! Saya adalah AI Assistant Network Slice Management. Masukkan instruksi dalam bahasa alami untuk membuat, mengubah, atau mengisolasi jaringan multi-tenant pada MikroTik RouterOS.',
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [deployingId, setDeployingId] = useState<string | null>(null);

  const handleSendPrompt = async (textToSend?: string) => {
    const inputPrompt = (textToSend || prompt).trim();
    if (!inputPrompt || loading) return;

    msgCounterRef.current += 1;
    const msgId = `user-${msgCounterRef.current}`;
    const userMsg: ChatMessage = {
      id: msgId,
      sender: 'user',
      text: inputPrompt,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setPrompt('');
    setLoading(true);

    try {
      const res = await fetch('/api/llm/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: inputPrompt }),
      });

      const json = await res.json();
      msgCounterRef.current += 1;
      const responseId = `ai-${msgCounterRef.current}`;
      if (json.success) {
        const aiMsg: ChatMessage = {
          id: responseId,
          sender: 'ai',
          text: json.data.parsedCommand.explanation || 'Instruksi berhasil diterjemahkan menjadi parameter JSON terstruktur.',
          parsedCommand: json.data.parsedCommand,
          providerName: json.data.providerName,
          timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, aiMsg]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: responseId,
            sender: 'ai',
            text: `Gagal memproses prompt: ${json.error || 'Terjadi kesalahan pada AI Engine.'}`,
            timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: 'Gagal terhubung ke server LLM.',
          timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeploySlice = async (cmd: StructuredSliceCommand, msgId: string) => {
    if (!cmd.parameters.tenantName) {
      setToast({ type: 'error', message: 'Nama tenant tidak terdeteksi dalam parameter AI.' });
      return;
    }

    setDeployingId(msgId);
    try {
      // 1. Create/Ensure Tenant exists
      const tenantRes = await fetch('/api/tenant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: cmd.parameters.tenantName,
          description: `Created via AI Chat Module (${cmd.intent})`,
          status: 'ACTIVE',
        }),
      });
      const tenantJson = await tenantRes.json();
      const tenantId = tenantJson.data?.id;

      // Fetch first active router
      const routerRes = await fetch('/api/router');
      const routerJson = await routerRes.json();
      const routerId = routerJson.data?.[0]?.id;

      if (!routerId) {
        setToast({ type: 'error', message: 'Router belum terdaftar. Silakan tambahkan Router di menu Router Management.' });
        return;
      }

      // 2. Create Network Slice
      const slicePayload = {
        name: `Slice ${cmd.parameters.tenantName}`,
        vlanId: cmd.parameters.vlanId || 100,
        vrfName: cmd.parameters.vrfName || `${cmd.parameters.tenantName.toLowerCase()}_vrf`,
        subnet: cmd.parameters.subnet || '192.168.10.0/24',
        gateway: cmd.parameters.gateway || '192.168.10.1',
        bandwidthTx: cmd.parameters.bandwidthTx || '10M',
        bandwidthRx: cmd.parameters.bandwidthRx || '10M',
        firewallProfile: cmd.parameters.firewallProfile || 'STRICT_ISOLATION',
        isolated: true,
        routerId,
        tenantId,
      };

      const sliceRes = await fetch('/api/network-slice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(slicePayload),
      });

      const sliceJson = await sliceRes.json();
      if (sliceJson.success) {
        setToast({ type: 'success', message: `Network Slice untuk "${cmd.parameters.tenantName}" berhasil dikirim ke Orchestrator & Router!` });
      } else {
        setToast({ type: 'error', message: sliceJson.error || 'Gagal menerapkan slice.' });
      }
    } catch {
      setToast({ type: 'error', message: 'Terjadi kesalahan saat mengeksekusi ke Orchestrator.' });
    } finally {
      setDeployingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-[100] max-w-sm rounded-lg border p-4 shadow-lg text-sm font-semibold animate-fade-in ${
            toast.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
          <Sparkles className="h-7 w-7 text-primary animate-pulse" /> AI Chat Module
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Konfigurasi otomatis Network Slice Management menggunakan bahasa alami (Natural Language Instruction Orchestration)
        </p>
      </div>

      {/* Quick Prompts */}
      <div className="space-y-2">
        <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
          <Zap className="h-3.5 w-3.5 text-amber-400" /> Contoh Perintah Cepat:
        </span>
        <div className="flex flex-wrap gap-2">
          {QUICK_PROMPTS.map((qp, idx) => (
            <button
              key={idx}
              onClick={() => handleSendPrompt(qp)}
              className="text-xs bg-card hover:bg-secondary border border-border/40 text-foreground px-3 py-1.5 rounded-lg transition-colors text-left"
            >
              &quot;{qp}&quot;
            </button>
          ))}
        </div>
      </div>

      {/* Main Chat Box */}
      <Card className="border border-border/40 bg-card/60 flex flex-col h-[580px] shadow-sm overflow-hidden">
        {/* Chat History Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex gap-3 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.sender === 'ai' && (
                <div className="h-8 w-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary shrink-0">
                  <Bot className="h-4 w-4" />
                </div>
              )}

              <div className={`max-w-[85%] space-y-2 ${m.sender === 'user' ? 'items-end' : 'items-start'}`}>
                {/* Text Bubble */}
                <div
                  className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-primary text-primary-foreground font-medium rounded-tr-none'
                      : 'bg-secondary/80 border border-border/40 text-foreground rounded-tl-none'
                  }`}
                >
                  <p>{m.text}</p>
                  <span className="block text-[9px] opacity-60 text-right mt-1">{m.timestamp}</span>
                </div>

                {/* Parsed JSON Command Card (If AI Response) */}
                {m.parsedCommand && (
                  <Card className="border border-primary/30 bg-background/90 p-4 rounded-xl space-y-3 shadow-md">
                    <div className="flex items-center justify-between border-b border-border/20 pb-2">
                      <div className="flex items-center gap-2">
                        <Cpu className="h-4 w-4 text-primary" />
                        <span className="text-xs font-extrabold text-foreground">Extracted Slice Parameters</span>
                      </div>
                      <span className="text-[10px] font-mono bg-primary/10 text-primary px-2 py-0.5 rounded-full border border-primary/20 font-bold">
                        {m.parsedCommand.intent}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                      <div className="bg-secondary/40 p-2 rounded-md border border-border/20">
                        <span className="text-muted-foreground block text-[10px]">Tenant</span>
                        <span className="font-bold text-foreground">{m.parsedCommand.parameters.tenantName || '-'}</span>
                      </div>
                      <div className="bg-secondary/40 p-2 rounded-md border border-border/20">
                        <span className="text-muted-foreground block text-[10px]">VLAN ID</span>
                        <span className="font-bold text-sky-400">{m.parsedCommand.parameters.vlanId || '-'}</span>
                      </div>
                      <div className="bg-secondary/40 p-2 rounded-md border border-border/20">
                        <span className="text-muted-foreground block text-[10px]">VRF Name</span>
                        <span className="font-bold text-emerald-400">{m.parsedCommand.parameters.vrfName || '-'}</span>
                      </div>
                      <div className="bg-secondary/40 p-2 rounded-md border border-border/20">
                        <span className="text-muted-foreground block text-[10px]">Bandwidth</span>
                        <span className="font-bold text-amber-400">{m.parsedCommand.parameters.bandwidthTx || '-'}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <ShieldCheck className="h-3 w-3 text-emerald-400" /> Confidence: {(m.parsedCommand.confidence * 100).toFixed(0)}% ({m.providerName})
                      </span>

                      <button
                        onClick={() => handleDeploySlice(m.parsedCommand!, m.id)}
                        disabled={deployingId === m.id}
                        className="inline-flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors shadow-sm disabled:opacity-50"
                      >
                        {deployingId === m.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <>
                            Deploy to Router <ArrowRight className="h-3.5 w-3.5" />
                          </>
                        )}
                      </button>
                    </div>
                  </Card>
                )}
              </div>

              {m.sender === 'user' && (
                <div className="h-8 w-8 rounded-full bg-secondary border border-border flex items-center justify-center text-muted-foreground shrink-0">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 items-center text-xs text-muted-foreground">
              <div className="h-8 w-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary">
                <Bot className="h-4 w-4" />
              </div>
              <div className="flex items-center gap-2 bg-secondary/60 p-3 rounded-2xl">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span>AI sedang menganalisis perintah & menerjemahkan ke JSON...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-border/30 bg-background/50">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendPrompt();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Tulis instruksi jaringan... (cth: Buat slice untuk Tenant Kampus A vlan 105 bandwidth 20M)"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="flex-1 h-10 rounded-xl border border-border/40 bg-background px-4 text-xs focus:border-primary/60 focus:outline-hidden focus:ring-1 focus:ring-primary/20"
            />
            <button
              type="submit"
              disabled={!prompt.trim() || loading}
              className="h-10 px-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs inline-flex items-center gap-2 transition-colors disabled:opacity-40"
            >
              <span>Kirim</span>
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      </Card>
    </div>
  );
}
