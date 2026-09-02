'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Brain, Plus, Key, CheckCircle2, Trash2, Edit3, Loader2, Sparkles, History, Bot
} from 'lucide-react';

interface LLMProviderItem {
  id: string;
  name: string;
  provider: 'GEMINI' | 'OPENAI' | 'OLLAMA' | 'MOCK';
  apiKey: string | null;
  modelName: string;
  apiUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface HistoryItem {
  id: string;
  prompt: string;
  rawResponse: string | null;
  parsedResponse: string | null;
  status: string;
  createdAt: string;
  provider: {
    name: string;
    provider: string;
  };
}

export default function LLMProviderClient() {
  const [activeTab, setActiveTab] = useState<'providers' | 'history'>('providers');
  const [providers, setProviders] = useState<LLMProviderItem[]>([]);
  const [histories, setHistories] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form State
  const [showModal, setShowModal] = useState(false);
  const [editingProvider, setEditingProvider] = useState<LLMProviderItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    provider: 'GEMINI' as 'GEMINI' | 'OPENAI' | 'OLLAMA' | 'MOCK',
    apiKey: '',
    modelName: 'gemini-1.5-flash',
    apiUrl: '',
    isActive: false,
  });

  const fetchProviders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/llm-provider');
      const json = await res.json();
      if (json.success) setProviders(json.data);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch('/api/llm/history');
      const json = await res.json();
      if (json.success) setHistories(json.data);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      fetchProviders();
      fetchHistory();
    });
  }, [fetchProviders, fetchHistory]);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const openCreateModal = () => {
    setEditingProvider(null);
    setFormData({
      name: '',
      provider: 'GEMINI',
      apiKey: '',
      modelName: 'gemini-1.5-flash',
      apiUrl: '',
      isActive: false,
    });
    setShowModal(true);
  };

  const openEditModal = (p: LLMProviderItem) => {
    setEditingProvider(p);
    setFormData({
      name: p.name,
      provider: p.provider,
      apiKey: p.apiKey || '',
      modelName: p.modelName,
      apiUrl: p.apiUrl || '',
      isActive: p.isActive,
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const url = editingProvider ? `/api/llm-provider/${editingProvider.id}` : '/api/llm-provider';
      const method = editingProvider ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (json.success) {
        setToast({ type: 'success', message: editingProvider ? 'Provider diperbarui.' : 'Provider ditambahkan.' });
        setShowModal(false);
        fetchProviders();
      } else {
        setToast({ type: 'error', message: json.error || 'Gagal menyimpan provider.' });
      }
    } catch {
      setToast({ type: 'error', message: 'Terjadi kesalahan jaringan.' });
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActivate = async (id: string) => {
    try {
      const res = await fetch(`/api/llm-provider/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ setActive: true }),
      });
      const json = await res.json();
      if (json.success) {
        setToast({ type: 'success', message: 'Provider LLM aktif berhasil diubah.' });
        fetchProviders();
      }
    } catch {
      setToast({ type: 'error', message: 'Gagal mengubah provider aktif.' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus LLM Provider ini?')) return;
    try {
      const res = await fetch(`/api/llm-provider/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setToast({ type: 'success', message: 'Provider berhasil dihapus.' });
        fetchProviders();
      }
    } catch {
      setToast({ type: 'error', message: 'Gagal menghapus provider.' });
    }
  };

  const fmtDate = (s: string) =>
    new Date(s).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

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

      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
            <Brain className="h-7 w-7 text-primary" /> LLM Provider Settings
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Kelola penyedia layanan Large Language Model (Gemini, OpenAI, Ollama, Mock) untuk pemrosesan perintah bahasa alami
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" /> Tambah Provider LLM
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border/40 space-x-4">
        <button
          onClick={() => setActiveTab('providers')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'providers'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Bot className="h-4 w-4" /> Daftar Provider
        </button>
        <button
          onClick={() => {
            setActiveTab('history');
            fetchHistory();
          }}
          className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'history'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <History className="h-4 w-4" /> Histori AI Prompt ({histories.length})
        </button>
      </div>

      {activeTab === 'providers' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            <div className="col-span-full flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="ml-2 text-sm text-muted-foreground">Memuat provider LLM...</span>
            </div>
          ) : providers.length === 0 ? (
            <div className="col-span-full py-16 text-center text-muted-foreground">
              Belum ada Provider LLM. Silakan tambahkan provider baru.
            </div>
          ) : (
            providers.map((p) => (
              <Card
                key={p.id}
                className={`relative overflow-hidden border transition-all ${
                  p.isActive
                    ? 'border-primary/60 bg-primary/5 shadow-md'
                    : 'border-border/40 bg-card/60 hover:border-border'
                }`}
              >
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground text-base">{p.name}</span>
                        {p.isActive && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                            <Sparkles className="h-3 w-3" /> AKTIF
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">Model: {p.modelName}</p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(p)}
                        className="p-1.5 rounded-md text-muted-foreground hover:text-amber-400 hover:bg-amber-500/10"
                        title="Edit"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="p-1.5 rounded-md text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10"
                        title="Hapus"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Provider Type:</span>
                      <span className="font-semibold text-foreground">{p.provider}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>API Key Status:</span>
                      <span className="font-semibold text-foreground flex items-center gap-1">
                        {p.apiKey ? (
                          <>
                            <Key className="h-3 w-3 text-emerald-400" /> Terpasang
                          </>
                        ) : (
                          <span className="text-muted-foreground">Tidak Ada</span>
                        )}
                      </span>
                    </div>
                    {p.apiUrl && (
                      <div className="flex justify-between text-muted-foreground">
                        <span>Base URL:</span>
                        <span className="font-semibold text-foreground truncate max-w-[150px]">{p.apiUrl}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-border/20 flex justify-between items-center">
                    {!p.isActive ? (
                      <button
                        onClick={() => toggleActivate(p.id)}
                        className="w-full text-xs font-bold text-primary hover:text-primary-foreground hover:bg-primary py-1.5 rounded-md border border-primary/40 transition-all text-center"
                      >
                        Set Sebagai Provider Aktif
                      </button>
                    ) : (
                      <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Digunakan untuk AI Chat
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      ) : (
        /* History Tab */
        <Card className="overflow-hidden border border-border/40 bg-card/60">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-border/30">
                    <TableHead className="text-xs font-semibold text-muted-foreground">Waktu</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground">Provider</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground">Prompt Administrator</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground">Hasil Parsing JSON</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {histories.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-10 text-muted-foreground text-xs">
                        Belum ada riwayat interaksi AI.
                      </TableCell>
                    </TableRow>
                  ) : (
                    histories.map((h) => (
                      <TableRow key={h.id} className="border-b border-border/20 text-xs">
                        <TableCell className="whitespace-nowrap text-muted-foreground">{fmtDate(h.createdAt)}</TableCell>
                        <TableCell className="font-semibold text-foreground">{h.provider?.name || 'Mock AI'}</TableCell>
                        <TableCell className="max-w-[250px] truncate text-foreground font-medium">{h.prompt}</TableCell>
                        <TableCell className="max-w-[300px] font-mono text-[11px] text-sky-400 truncate">
                          {h.parsedResponse || '-'}
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                            {h.status}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal Form */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs" onClick={() => setShowModal(false)}>
          <div className="w-full max-w-md rounded-xl border border-border/40 bg-card p-6 shadow-xl space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-foreground">
              {editingProvider ? 'Edit LLM Provider' : 'Tambah LLM Provider Baru'}
            </h3>

            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-foreground">Nama Provider</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Gemini Pro Primary"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="h-9 w-full rounded-lg border border-border/40 bg-background px-3 text-sm focus:border-primary/50 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">Penyedia Service</label>
                <select
                  value={formData.provider}
                  onChange={(e) => {
                    const p = e.target.value as 'GEMINI' | 'OPENAI' | 'OLLAMA' | 'MOCK';
                    let defaultModel = 'gemini-1.5-flash';
                    if (p === 'OPENAI') defaultModel = 'gpt-4o-mini';
                    if (p === 'OLLAMA') defaultModel = 'llama3';
                    if (p === 'MOCK') defaultModel = 'mock-rule-based';
                    setFormData({ ...formData, provider: p, modelName: defaultModel });
                  }}
                  className="h-9 w-full rounded-lg border border-border/40 bg-background px-3 text-sm text-foreground focus:border-primary/50 focus:outline-hidden"
                >
                  <option value="GEMINI">Google Gemini</option>
                  <option value="OPENAI">OpenAI (ChatGPT)</option>
                  <option value="OLLAMA">Ollama (Local LLM)</option>
                  <option value="MOCK">Mock AI Engine (Offline)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">Model Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. gemini-1.5-flash / gpt-4o-mini"
                  value={formData.modelName}
                  onChange={(e) => setFormData({ ...formData, modelName: e.target.value })}
                  className="h-9 w-full rounded-lg border border-border/40 bg-background px-3 text-sm focus:border-primary/50 focus:outline-hidden"
                />
              </div>

              {formData.provider !== 'MOCK' && formData.provider !== 'OLLAMA' && (
                <div>
                  <label className="text-xs font-semibold text-foreground">API Key</label>
                  <input
                    type="password"
                    placeholder="Masukkan API Key (AIzaSy... / sk-...)"
                    value={formData.apiKey}
                    onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                    className="h-9 w-full rounded-lg border border-border/40 bg-background px-3 text-sm focus:border-primary/50 focus:outline-hidden"
                  />
                </div>
              )}

              {formData.provider === 'OLLAMA' && (
                <div>
                  <label className="text-xs font-semibold text-foreground">Ollama Base URL</label>
                  <input
                    type="text"
                    placeholder="http://localhost:11434"
                    value={formData.apiUrl}
                    onChange={(e) => setFormData({ ...formData, apiUrl: e.target.value })}
                    className="h-9 w-full rounded-lg border border-border/40 bg-background px-3 text-sm focus:border-primary/50 focus:outline-hidden"
                  />
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-4 w-4 rounded border-border text-primary"
                />
                <label htmlFor="isActive" className="text-xs font-semibold text-foreground cursor-pointer">
                  Aktifkan provider ini untuk seluruh permintaan AI Chat
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-lg border border-border/40 px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-secondary"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Simpan Provider'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
