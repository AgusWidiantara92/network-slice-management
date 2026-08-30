'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Plus, Search, Edit, Trash2, Eye, RefreshCw, Cpu, HardDrive,
  ChevronLeft, ChevronRight, ArrowUpDown, Inbox, Loader2, X, Zap
} from 'lucide-react';

const routerSchema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter').max(100),
  host: z.string().regex(/^(\d{1,3}\.){3}\d{1,3}$/, 'IP Address harus valid (contoh: 192.168.1.1)'),
  port: z.number().int().min(1).max(65535),
  username: z.string().min(1, 'Username wajib diisi'),
  password: z.string().min(1, 'Password wajib diisi'),
  description: z.string().optional(),
  isSimulation: z.boolean().optional(),
});
type RouterFormData = z.infer<typeof routerSchema>;

interface RouterRow {
  id: string; name: string; host: string; port: number; username: string; password: string;
  description: string | null; status: string; isSimulation: boolean;
  cpuUsage: number | null; memoryUsage: number | null; routerosVersion: string | null;
  uptime: string | null; lastSync: string | null; architecture: string | null;
  boardName: string | null; totalMemory: string | null; freeMemory: string | null;
  _count: { slices: number };
}

export default function RouterClient() {
  const [routers, setRouters] = useState<RouterRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [editingRouter, setEditingRouter] = useState<RouterRow | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingRouter, setDeletingRouter] = useState<RouterRow | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [detailRouter, setDetailRouter] = useState<RouterRow | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<RouterFormData>({
    resolver: zodResolver(routerSchema),
    defaultValues: { port: 8728, isSimulation: false },
  });

  const showToastMsg = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchRouters = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(page), limit: String(limit), search,
        status: statusFilter, sortBy, sortOrder,
      });
      const res = await fetch(`/api/router?${params.toString()}`);
      if (!res.ok) throw new Error('Gagal mengambil data');
      const data = await res.json();
      setRouters(data.data || []);
      setTotal(data.meta?.total || 0);
    } catch {
      showToastMsg('Gagal memuat daftar router', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, statusFilter, sortBy, sortOrder]);

  useEffect(() => { fetchRouters(); }, [fetchRouters]);

  const openCreate = () => {
    setEditingRouter(null);
    reset({ name: '', host: '', port: 8728, username: '', password: '', description: '', isSimulation: false });
    setShowForm(true);
  };

  const openEdit = (r: RouterRow) => {
    setEditingRouter(r);
    setValue('name', r.name); setValue('host', r.host); setValue('port', r.port);
    setValue('username', r.username); setValue('password', r.password);
    setValue('description', r.description || ''); setValue('isSimulation', r.isSimulation);
    setShowForm(true);
  };

  const onSubmit = async (formData: RouterFormData) => {
    try {
      setSubmitting(true);
      const url = editingRouter ? `/api/router/${editingRouter.id}` : '/api/router';
      const method = editingRouter ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan');
      showToastMsg(editingRouter ? 'Router berhasil diperbarui' : 'Router berhasil ditambahkan');
      setShowForm(false);
      fetchRouters();
    } catch (err: unknown) {
      showToastMsg(err instanceof Error ? err.message : 'Terjadi kesalahan', 'error');
    } finally { setSubmitting(false); }
  };

  const onDelete = async () => {
    if (!deletingRouter) return;
    try {
      setSubmitting(true);
      const res = await fetch(`/api/router/${deletingRouter.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Gagal menghapus');
      showToastMsg('Router berhasil dihapus');
      setShowDeleteDialog(false);
      fetchRouters();
    } catch {
      showToastMsg('Gagal menghapus router', 'error');
    } finally { setSubmitting(false); }
  };

  const doAction = async (id: string, action: 'test' | 'sync') => {
    setActionLoading(`${id}-${action}`);
    try {
      const res = await fetch(`/api/router/${id}/${action}`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Gagal ${action}`);
      showToastMsg(data.message || 'Berhasil');
      fetchRouters();
    } catch (err: unknown) {
      showToastMsg(err instanceof Error ? err.message : 'Gagal', 'error');
    } finally { setActionLoading(null); }
  };

  const toggleSort = (col: string) => { if (sortBy === col) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); else { setSortBy(col); setSortOrder('asc'); } };
  const totalPages = Math.ceil(total / limit);
  const getBarColor = (v: number) => v >= 80 ? 'bg-rose-500' : v >= 50 ? 'bg-amber-500' : 'bg-emerald-500';

  return (
    <div className="space-y-5">
      {toast && (<div className={`fixed top-16 right-4 z-[100] max-w-sm rounded-xl p-3 shadow-lg text-xs font-semibold animate-fade-in ${toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>{toast.message}</div>)}

      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Router Management
          </h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">{total} perangkat MikroTik terdaftar</p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 transition-opacity shadow-xs">
          <Plus className="h-3.5 w-3.5" />
          <span>Tambah Router</span>
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cari router..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="h-9 w-full rounded-lg bg-secondary/80 border border-border pl-9 pr-3 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-all"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="h-9 rounded-lg bg-secondary/80 border border-border px-3 text-[13px] text-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-all"
        >
          <option value="">Semua Status</option>
          <option value="CONNECTED">Online</option>
          <option value="DISCONNECTED">Offline</option>
          <option value="ERROR">Error</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-xl bg-card border border-border shadow-xs overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-[13px] text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin mr-2" /> Memuat data router...
          </div>
        ) : routers.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-[13px] text-muted-foreground">
            <Inbox className="h-8 w-8 text-muted-foreground" />
            <p>Belum ada router terdaftar.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border hover:bg-transparent">
                  <TableHead className="text-[11px] font-semibold text-muted-foreground cursor-pointer py-3 pl-4" onClick={() => toggleSort('name')}>
                    <span className="flex items-center gap-1">Nama <ArrowUpDown className="h-3 w-3" /></span>
                  </TableHead>
                  <TableHead className="text-[11px] font-semibold text-muted-foreground py-3">Host</TableHead>
                  <TableHead className="text-[11px] font-semibold text-muted-foreground py-3">Status</TableHead>
                  <TableHead className="text-[11px] font-semibold text-muted-foreground w-[110px] py-3">CPU</TableHead>
                  <TableHead className="text-[11px] font-semibold text-muted-foreground w-[110px] py-3">Memory</TableHead>
                  <TableHead className="text-[11px] font-semibold text-muted-foreground py-3">Versi</TableHead>
                  <TableHead className="text-[11px] font-semibold text-muted-foreground py-3">Uptime</TableHead>
                  <TableHead className="text-[11px] font-semibold text-muted-foreground text-right py-3 pr-4">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {routers.map((r) => {
                  const isOnline = r.status === 'CONNECTED';
                  return (
                    <TableRow key={r.id} className="border-b border-border/50 hover:bg-secondary/60 transition-colors">
                      <TableCell className="text-[13px] font-semibold text-foreground py-3 pl-4">
                        <div className="flex items-center gap-2">
                          <span>{r.name}</span>
                          {r.isSimulation && <span className="text-[9px] bg-secondary text-muted-foreground px-1.5 py-0.5 rounded font-mono border border-border">SIM</span>}
                        </div>
                      </TableCell>
                      <TableCell className="text-[13px] font-mono text-muted-foreground py-3">{r.host}:{r.port}</TableCell>
                      <TableCell className="py-3">
                        <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold ${isOnline ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-muted-foreground'}`}></span>
                          {isOnline ? 'Online' : 'Offline'}
                        </span>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground">
                            <span className="flex items-center gap-1"><Cpu className="h-2.5 w-2.5" /> CPU</span>
                            <span>{r.cpuUsage ?? 0}%</span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                            <div className={`h-full rounded-full ${getBarColor(r.cpuUsage ?? 0)}`} style={{ width: `${r.cpuUsage ?? 0}%` }} />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground">
                            <span className="flex items-center gap-1"><HardDrive className="h-2.5 w-2.5" /> RAM</span>
                            <span>{r.memoryUsage ?? 0}%</span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                            <div className={`h-full rounded-full ${getBarColor(r.memoryUsage ?? 0)}`} style={{ width: `${r.memoryUsage ?? 0}%` }} />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-[13px] text-muted-foreground py-3">{r.routerosVersion || '—'}</TableCell>
                      <TableCell className="text-[13px] text-muted-foreground whitespace-nowrap py-3">{r.uptime || '—'}</TableCell>
                      <TableCell className="py-3 pr-4 text-right">
                        {(() => {
                          const isTest = actionLoading === `${r.id}-test`;
                          const isSync = actionLoading === `${r.id}-sync`;
                          return (
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => { setDetailRouter(r); setShowDetail(true); }}
                                className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                                title="Detail"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => doAction(r.id, 'test')}
                                disabled={isTest}
                                className="rounded-md p-1.5 text-muted-foreground hover:text-emerald-500 hover:bg-secondary disabled:opacity-30 transition-colors"
                                title="Test Connection"
                              >
                                {isTest ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
                              </button>
                              <button
                                onClick={() => doAction(r.id, 'sync')}
                                disabled={isSync}
                                className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary disabled:opacity-30 transition-colors"
                                title="Sync Info"
                              >
                                {isSync ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                              </button>
                              <button
                                onClick={() => openEdit(r)}
                                className="rounded-md p-1.5 text-muted-foreground hover:text-amber-500 hover:bg-secondary transition-colors"
                                title="Edit"
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => { setDeletingRouter(r); setShowDeleteDialog(true); }}
                                className="rounded-md p-1.5 text-muted-foreground hover:text-rose-500 hover:bg-secondary transition-colors"
                                title="Hapus"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          );
                        })()}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-2.5">
            <span className="text-[11px] text-muted-foreground">
              {((page - 1) * limit) + 1}–{Math.min(page * limit, total)} dari {total}
            </span>
            <div className="flex items-center gap-1">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded-md p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button>
              <span className="text-xs font-semibold text-foreground px-2">{page} / {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="rounded-md p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button>
            </div>
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs" onClick={() => setShowForm(false)}>
          <div className="w-full max-w-lg rounded-2xl bg-card p-6 shadow-xl border border-border max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-foreground">{editingRouter ? 'Edit Router' : 'Tambah Router'}</h3>
              <button onClick={() => setShowForm(false)} className="rounded-md p-1 text-muted-foreground hover:bg-secondary"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 col-span-2"><label className="text-[13px] font-semibold text-foreground">Nama Router *</label><input {...register('name')} className="h-9 w-full rounded-lg border border-border bg-secondary px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring" />{errors.name && <p className="text-[10px] text-rose-500">{errors.name.message}</p>}</div>
                <div className="space-y-1.5"><label className="text-[13px] font-semibold text-foreground">IP Address *</label><input {...register('host')} placeholder="192.168.1.1" className="h-9 w-full rounded-lg border border-border bg-secondary px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring" />{errors.host && <p className="text-[10px] text-rose-500">{errors.host.message}</p>}</div>
                <div className="space-y-1.5"><label className="text-[13px] font-semibold text-foreground">API Port *</label><input type="number" {...register('port', { valueAsNumber: true })} className="h-9 w-full rounded-lg border border-border bg-secondary px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring" />{errors.port && <p className="text-[10px] text-rose-500">{errors.port.message}</p>}</div>
                <div className="space-y-1.5"><label className="text-[13px] font-semibold text-foreground">Username *</label><input {...register('username')} className="h-9 w-full rounded-lg border border-border bg-secondary px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring" />{errors.username && <p className="text-[10px] text-rose-500">{errors.username.message}</p>}</div>
                <div className="space-y-1.5"><label className="text-[13px] font-semibold text-foreground">Password *</label><input type="password" {...register('password')} className="h-9 w-full rounded-lg border border-border bg-secondary px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring" />{errors.password && <p className="text-[10px] text-rose-500">{errors.password.message}</p>}</div>
                <div className="space-y-1.5 col-span-2"><label className="text-[13px] font-semibold text-foreground">Deskripsi</label><input {...register('description')} className="h-9 w-full rounded-lg border border-border bg-secondary px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring" /></div>
                <div className="col-span-2 flex items-center gap-2"><input type="checkbox" {...register('isSimulation')} id="sim" className="rounded" /><label htmlFor="sim" className="text-[13px] font-medium text-muted-foreground">Mode Simulasi (mock RouterOS API)</label></div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-border px-4 py-2 text-[13px] font-semibold text-muted-foreground hover:bg-secondary">Batal</button>
                <button type="submit" disabled={submitting} className="rounded-lg bg-primary px-4 py-2 text-[13px] font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50">{submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : editingRouter ? 'Simpan' : 'Buat Router'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Dialog */}
      {showDeleteDialog && deletingRouter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs" onClick={() => setShowDeleteDialog(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-xl border border-border" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-foreground mb-2">Hapus Router</h3>
            <p className="text-[13px] text-muted-foreground mb-5">Yakin hapus <strong className="text-foreground">&quot;{deletingRouter.name}&quot;</strong>?</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowDeleteDialog(false)} className="rounded-lg border border-border px-4 py-2 text-[13px] font-semibold text-muted-foreground hover:bg-secondary">Batal</button>
              <button onClick={onDelete} disabled={submitting} className="rounded-lg bg-rose-600 px-4 py-2 text-[13px] font-bold text-white hover:bg-rose-700 disabled:opacity-50">{submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Hapus'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetail && detailRouter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs" onClick={() => setShowDetail(false)}>
          <div className="w-full max-w-lg rounded-2xl bg-card p-6 shadow-xl border border-border max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-foreground">Detail Router</h3>
              <button onClick={() => setShowDetail(false)} className="rounded-md p-1 text-muted-foreground hover:bg-secondary"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-2.5">
              {[
                ['Nama', detailRouter.name], ['Host', `${detailRouter.host}:${detailRouter.port}`], ['Status', detailRouter.status],
                ['RouterOS', detailRouter.routerosVersion || '—'], ['Architecture', detailRouter.architecture || '—'], ['Board', detailRouter.boardName || '—'],
                ['CPU', `${detailRouter.cpuUsage ?? 0}%`], ['Memory', `${detailRouter.memoryUsage ?? 0}%`],
                ['Total Memory', detailRouter.totalMemory || '—'], ['Free Memory', detailRouter.freeMemory || '—'],
                ['Uptime', detailRouter.uptime || '—'], ['Last Sync', detailRouter.lastSync ? new Date(detailRouter.lastSync).toLocaleString('id-ID') : '—'],
                ['Slices', String(detailRouter._count.slices)], ['Simulasi', detailRouter.isSimulation ? 'Ya' : 'Tidak'],
              ].map(([l, v]) => (
                <div key={l} className="flex justify-between border-b border-border/40 pb-2">
                  <span className="text-[13px] text-muted-foreground">{l}</span>
                  <span className="text-[13px] font-semibold text-foreground">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
