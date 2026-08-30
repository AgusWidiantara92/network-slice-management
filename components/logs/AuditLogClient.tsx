'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  History, Search, Eye, ChevronLeft, ChevronRight, ArrowUpDown,
  Inbox, Loader2, X, RefreshCw, Trash2, Calendar, AlertTriangle,
  UserPlus, Server, Network, ShieldCheck, Info, FileSpreadsheet, Download
} from 'lucide-react';
import { formatDate } from '@/utils/helpers';

interface AuditLogRow {
  id: string;
  userId: string | null;
  userEmail: string | null;
  action: string;
  description: string;
  status: string;
  routerId: string | null;
  createdAt: string;
  updatedAt: string;
  admin: { name: string; email: string } | null;
  router: { name: string } | null;
}

export default function AuditLogClient() {
  const [logs, setLogs] = useState<AuditLogRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  
  // Filters
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Metadata & UI states
  const [actionsList, setActionsList] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modals
  const [detailLog, setDetailLog] = useState<AuditLogRow | null>(null);
  const [showClearModal, setShowClearModal] = useState(false);
  const [clearDays, setClearDays] = useState('90');

  // Show Toast
  const triggerToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
  };

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  // Fetch actions for the dropdown filter
  const fetchActions = async () => {
    try {
      const res = await fetch('/api/audit-log/actions');
      const json = await res.json();
      if (json.success) {
        setActionsList(json.data);
      }
    } catch (err) {
      console.error('Gagal mengambil data aksi:', err);
    }
  };

  // Main Fetch Logs
  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (actionFilter) params.set('action', actionFilter);
      if (statusFilter) params.set('status', statusFilter);
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      params.set('sortBy', sortBy);
      params.set('sortOrder', sortOrder);
      params.set('page', String(page));
      params.set('limit', String(limit));

      const res = await fetch(`/api/audit-log?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setLogs(json.data);
        setTotal(json.total);
      } else {
        triggerToast('error', json.error || 'Gagal memuat log audit.');
      }
    } catch {
      triggerToast('error', 'Terjadi kesalahan jaringan saat memuat log audit.');
    } finally {
      setLoading(false);
    }
  }, [search, actionFilter, statusFilter, startDate, endDate, sortBy, sortOrder, page, limit]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    fetchActions();
  }, []);

  // Actions
  const handleResetFilters = () => {
    setSearch('');
    setActionFilter('');
    setStatusFilter('');
    setStartDate('');
    setEndDate('');
    setPage(1);
    triggerToast('success', 'Filter berhasil direset.');
  };

  const handleClearLogs = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/audit-log?days=${clearDays}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        triggerToast('success', `Berhasil menghapus ${json.deleted} log audit sebelum tanggal cut-off.`);
        setShowClearModal(false);
        fetchLogs();
        fetchActions();
      } else {
        triggerToast('error', json.error || 'Gagal membersihkan log audit.');
      }
    } catch {
      triggerToast('error', 'Terjadi kesalahan jaringan.');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleSort = (col: string) => {
    if (sortBy === col) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(col);
      setSortOrder('desc');
    }
    setPage(1);
  };

  const getActionBadgeProps = (action: string, status: string) => {
    if (status === 'FAILED') {
      return { icon: AlertTriangle, color: 'text-rose-500 bg-rose-500/10 border-rose-500/20' };
    }
    const lower = action.toLowerCase();
    if (lower.includes('tenant')) return { icon: UserPlus, color: 'text-blue-500 bg-blue-500/10 border-blue-500/20' };
    if (lower.includes('router') || lower.includes('connect')) return { icon: Server, color: 'text-purple-500 bg-purple-500/10 border-purple-500/20' };
    if (lower.includes('slice')) return { icon: Network, color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' };
    if (lower.includes('rollback')) return { icon: RefreshCw, color: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20' };
    if (lower.includes('template') || lower.includes('deploy')) return { icon: ShieldCheck, color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' };

    return { icon: Info, color: 'text-muted-foreground bg-secondary border border-border' };
  };

  // Premium Export feature (CSV)
  const handleExportCSV = () => {
    if (logs.length === 0) {
      triggerToast('error', 'Tidak ada data untuk diexport.');
      return;
    }
    const headers = ['ID', 'Waktu', 'Aksi', 'User', 'Router', 'Deskripsi', 'Status'];
    const csvRows = [headers.join(',')];

    logs.forEach(log => {
      const row = [
        `"${log.id}"`,
        `"${new Date(log.createdAt).toISOString()}"`,
        `"${log.action}"`,
        `"${log.admin?.email || log.userEmail || 'System'}"`,
        `"${log.router?.name || '-'}"`,
        `"${log.description.replace(/"/g, '""')}"`,
        `"${log.status}"`
      ];
      csvRows.push(row.join(','));
    });

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Audit_Log_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerToast('success', 'Data log audit berhasil diexport.');
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-[100] max-w-sm rounded-lg border p-4 shadow-lg text-sm font-semibold animate-fade-in ${
          toast.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
        }`}>
          {toast.message}
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
            <History className="h-7 w-7 text-primary" /> Log Audit Sistem
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Monitor dan lacak seluruh aktivitas administrator, perubahan konfigurasi, serta status provisioning.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 rounded-lg border border-border/40 bg-card hover:bg-secondary px-4 py-2.5 text-sm font-semibold text-foreground transition-colors"
          >
            <Download className="h-4 w-4 text-muted-foreground" /> Export CSV
          </button>
          <button
            onClick={() => setShowClearModal(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-rose-600 hover:bg-rose-700 px-4 py-2.5 text-sm font-bold text-white shadow-xs transition-colors"
          >
            <Trash2 className="h-4 w-4" /> Bersihkan Log
          </button>
        </div>
      </div>

      {/* Dynamic Statistics Widgets */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border border-border/40 bg-card/60 backdrop-blur-xs shadow-xs">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Entri Log</CardDescription>
            <CardTitle className="text-3xl font-extrabold text-foreground">{total}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border border-border/40 bg-card/60 backdrop-blur-xs shadow-xs">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Aktivitas Berhasil</CardDescription>
            <CardTitle className="text-3xl font-extrabold text-emerald-500">
              {logs.filter(l => l.status === 'SUCCESS').length} <span className="text-xs font-medium text-muted-foreground">di halaman ini</span>
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border border-border/40 bg-card/60 backdrop-blur-xs shadow-xs">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Aktivitas Gagal</CardDescription>
            <CardTitle className="text-3xl font-extrabold text-rose-500">
              {logs.filter(l => l.status === 'FAILED').length} <span className="text-xs font-medium text-muted-foreground">di halaman ini</span>
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filter panel */}
      <Card className="border border-border/40 bg-card/60 backdrop-blur-xs shadow-xs">
        <CardContent className="p-5">
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-5 items-end">
            {/* Search Input */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-foreground">Cari Deskripsi / User / Aksi</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Cari kata kunci..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="h-9 w-full rounded-lg border border-border/40 bg-background pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:border-primary/50 focus:outline-hidden focus:ring-1 focus:ring-primary/20"
                />
              </div>
            </div>

            {/* Action Select Filter */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Jenis Aksi</label>
              <select
                value={actionFilter}
                onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
                className="h-9 w-full rounded-lg border border-border/40 bg-background px-3 text-sm text-foreground focus:border-primary/50 focus:outline-hidden"
              >
                <option value="">Semua Aksi</option>
                {actionsList.map((act) => (
                  <option key={act} value={act}>{act}</option>
                ))}
              </select>
            </div>

            {/* Status Select Filter */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="h-9 w-full rounded-lg border border-border/40 bg-background px-3 text-sm text-foreground focus:border-primary/50 focus:outline-hidden"
              >
                <option value="">Semua Status</option>
                <option value="SUCCESS">SUCCESS</option>
                <option value="FAILED">FAILED</option>
              </select>
            </div>

            {/* Actions Panel */}
            <div className="flex gap-2">
              <button
                onClick={handleResetFilters}
                className="h-9 flex-1 rounded-lg border border-border/40 bg-card hover:bg-secondary text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
              >
                Reset Filter
              </button>
              <button
                onClick={fetchLogs}
                className="h-9 px-3 rounded-lg bg-primary/10 border border-primary/20 hover:bg-primary/25 text-primary transition-all flex items-center justify-center"
                title="Refresh Manual"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Date Picker Filter */}
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-5 mt-4 border-t border-border/20 pt-4">
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" /> Tanggal Mulai
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                className="h-9 w-full rounded-lg border border-border/40 bg-background px-3 text-sm text-foreground focus:border-primary/50 focus:outline-hidden"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" /> Tanggal Selesai
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                className="h-9 w-full rounded-lg border border-border/40 bg-background px-3 text-sm text-foreground focus:border-primary/50 focus:outline-hidden"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card className="overflow-hidden border border-border/40 bg-card/60 backdrop-blur-xs shadow-xs">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="h-7 w-7 animate-spin text-primary" />
              <span className="ml-3 text-sm text-muted-foreground font-medium">Memuat log audit...</span>
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-24 text-muted-foreground">
              <Inbox className="h-12 w-12 text-muted-foreground/50" />
              <p className="text-sm font-medium">Tidak ada entri log audit yang sesuai dengan filter.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-transparent border-b border-border/30">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-xs font-semibold text-muted-foreground cursor-pointer" onClick={() => toggleSort('createdAt')}>
                      <span className="flex items-center gap-1">Waktu <ArrowUpDown className="h-3 w-3" /></span>
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground cursor-pointer" onClick={() => toggleSort('action')}>
                      <span className="flex items-center gap-1">Aksi <ArrowUpDown className="h-3 w-3" /></span>
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground">User / Operator</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground">Router</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground">Deskripsi</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground">Status</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground text-center">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => {
                    const badge = getActionBadgeProps(log.action, log.status);
                    const Icon = badge.icon;
                    return (
                      <TableRow key={log.id} className="border-b border-border/20 hover:bg-secondary/40">
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDate(new Date(log.createdAt))}
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${badge.color}`}>
                            <Icon className="h-3 w-3" />
                            {log.action}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs font-semibold text-foreground">
                          {log.admin?.name || log.userEmail || 'System'}
                          {(log.admin?.email && log.admin.name) && (
                            <span className="block text-[9px] text-muted-foreground font-medium">{log.admin.email}</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs font-medium text-foreground">
                          {log.router?.name || '-'}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[300px] truncate" title={log.description}>
                          {log.description}
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-extrabold border ${
                            log.status === 'SUCCESS'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          }`}>
                            <span className={`h-1 w-1 rounded-full ${log.status === 'SUCCESS' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                            {log.status}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center">
                            <button
                              onClick={() => setDetailLog(log)}
                              className="rounded-md p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                              title="Lihat Detail Log"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border/20 px-6 py-4 bg-secondary/40">
            <span className="text-xs text-muted-foreground font-medium">
              Menampilkan {((page - 1) * limit) + 1} - {Math.min(page * limit, total)} dari {total} log audit
            </span>
            <div className="flex items-center gap-1.5">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="rounded-md border border-border/40 p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary disabled:opacity-30 disabled:hover:bg-transparent transition-all"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-xs font-bold text-foreground px-3">{page} / {totalPages}</span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="rounded-md border border-border/40 p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary disabled:opacity-30 disabled:hover:bg-transparent transition-all"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* Modal Detail Log */}
      {detailLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs animate-fade-in" onClick={() => setDetailLog(null)}>
          <div className="w-full max-w-lg rounded-xl border border-border/30 bg-card p-6 shadow-2xl animate-scale-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5 border-b border-border/20 pb-3">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Info className="h-5 w-5 text-primary" /> Rincian Log Audit
              </h3>
              <button onClick={() => setDetailLog(null)} className="rounded-md p-1 hover:bg-secondary text-muted-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-border/10">
                <span className="text-xs font-semibold text-muted-foreground">ID Log</span>
                <span className="text-xs font-mono text-foreground col-span-2 select-all break-all">{detailLog.id}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-border/10">
                <span className="text-xs font-semibold text-muted-foreground">Waktu Kejadian</span>
                <span className="text-xs font-bold text-foreground col-span-2">{formatDate(new Date(detailLog.createdAt))}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-border/10">
                <span className="text-xs font-semibold text-muted-foreground">Operator</span>
                <div className="col-span-2 space-y-0.5">
                  <span className="text-xs font-bold text-foreground block">{detailLog.admin?.name || 'System'}</span>
                  {detailLog.admin?.email && (
                    <span className="text-[10px] font-medium text-muted-foreground block">{detailLog.admin.email}</span>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-border/10">
                <span className="text-xs font-semibold text-muted-foreground">Target Router</span>
                <span className="text-xs font-bold text-foreground col-span-2">{detailLog.router?.name || '-'}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-border/10">
                <span className="text-xs font-semibold text-muted-foreground">Tipe Aksi</span>
                <span className="text-xs font-bold text-primary col-span-2">{detailLog.action}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-border/10">
                <span className="text-xs font-semibold text-muted-foreground">Status</span>
                <span className="col-span-2">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold border ${
                    detailLog.status === 'SUCCESS'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                  }`}>
                    {detailLog.status}
                  </span>
                </span>
              </div>
              <div className="space-y-1.5 pt-1">
                <span className="text-xs font-semibold text-muted-foreground block">Deskripsi Detail</span>
                <div className="rounded-lg bg-secondary p-4 border border-border/30 max-h-[160px] overflow-y-auto">
                  <p className="text-xs text-foreground font-medium whitespace-pre-wrap leading-relaxed">
                    {detailLog.description}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-5">
              <button
                onClick={() => setDetailLog(null)}
                className="rounded-lg border border-border/40 px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-secondary transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear Logs Dialog Modal */}
      {showClearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs animate-fade-in" onClick={() => setShowClearModal(false)}>
          <div className="w-full max-w-md rounded-xl border border-border/40 bg-card p-6 shadow-xl animate-scale-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 text-rose-500 mb-3">
              <AlertTriangle className="h-6 w-6" />
              <h3 className="text-lg font-bold text-foreground">Bersihkan Log Audit</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Pembersihan berkala akan menghapus seluruh data audit log yang sudah lama untuk menghemat kapasitas basis data.
            </p>

            <div className="space-y-4 mb-6">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Hapus log yang lebih lama dari:</label>
                <select
                  value={clearDays}
                  onChange={(e) => setClearDays(e.target.value)}
                  className="h-9 w-full rounded-lg border border-border/40 bg-background px-3 text-sm text-foreground focus:border-primary/50 focus:outline-hidden"
                >
                  <option value="30">30 Hari Terakhir</option>
                  <option value="60">60 Hari Terakhir</option>
                  <option value="90">90 Hari Terakhir (Saran)</option>
                  <option value="180">180 Hari Terakhir</option>
                  <option value="0">Hapus Seluruh Log</option>
                </select>
              </div>
              {clearDays === '0' && (
                <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-3 text-rose-400 text-xs font-medium">
                  Perhatian: Memilih opsi ini akan menghapus seluruh rekaman audit log tanpa terkecuali.
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowClearModal(false)}
                className="rounded-lg border border-border/40 px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-secondary transition-colors"
                disabled={submitting}
              >
                Batal
              </button>
              <button
                onClick={handleClearLogs}
                disabled={submitting}
                className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-50 transition-colors flex items-center gap-1.5"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Mulai Bersihkan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
