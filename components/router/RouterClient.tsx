'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Server, Plus, Search, Edit, Trash2, Eye, Wifi, WifiOff, RefreshCw, Cpu, HardDrive,
  ChevronLeft, ChevronRight, ArrowUpDown, Inbox, Loader2, X, CheckCircle2, XCircle, Zap
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
  _count: { slices: number }; createdAt: string; updatedAt: string;
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
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingRouter, setEditingRouter] = useState<RouterRow | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingRouter, setDeletingRouter] = useState<RouterRow | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [detailRouter, setDetailRouter] = useState<RouterRow | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<RouterFormData>({
    resolver: zodResolver(routerSchema),
    defaultValues: { name: '', host: '', port: 8728, username: 'admin', password: '', description: '', isSimulation: true },
  });

  const fetchRouters = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (search) p.set('search', search);
      if (statusFilter) p.set('status', statusFilter);
      p.set('sortBy', sortBy); p.set('sortOrder', sortOrder);
      p.set('page', String(page)); p.set('limit', String(limit));
      const res = await fetch(`/api/router?${p.toString()}`);
      const json = await res.json();
      if (json.success) { setRouters(json.data); setTotal(json.total); }
    } catch { /* ignore */ } finally { setLoading(false); }
  }, [search, statusFilter, sortBy, sortOrder, page, limit]);

  useEffect(() => { fetchRouters(); }, [fetchRouters]);
  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(null), 4000); return () => clearTimeout(t); } }, [toast]);

  const openCreate = () => { setEditingRouter(null); reset({ name: '', host: '', port: 8728, username: 'admin', password: '', description: '', isSimulation: true }); setShowForm(true); };
  const openEdit = (r: RouterRow) => {
    setEditingRouter(r);
    setValue('name', r.name); setValue('host', r.host); setValue('port', r.port);
    setValue('username', r.username); setValue('password', r.password);
    setValue('description', r.description || ''); setValue('isSimulation', r.isSimulation);
    setShowForm(true);
  };

  const onSubmit = async (data: RouterFormData) => {
    setSubmitting(true);
    try {
      const url = editingRouter ? `/api/router/${editingRouter.id}` : '/api/router';
      const method = editingRouter ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      const json = await res.json();
      if (json.success) { setToast({ type: 'success', message: editingRouter ? 'Router diperbarui.' : 'Router berhasil dibuat.' }); setShowForm(false); fetchRouters(); }
      else setToast({ type: 'error', message: json.error });
    } catch { setToast({ type: 'error', message: 'Kesalahan jaringan.' }); } finally { setSubmitting(false); }
  };

  const onDelete = async () => {
    if (!deletingRouter) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/router/${deletingRouter.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) { setToast({ type: 'success', message: 'Router dihapus.' }); setShowDeleteDialog(false); fetchRouters(); }
      else setToast({ type: 'error', message: json.error });
    } catch { setToast({ type: 'error', message: 'Kesalahan jaringan.' }); } finally { setSubmitting(false); }
  };

  const doAction = async (id: string, action: 'test' | 'sync') => {
    setActionLoading(`${id}-${action}`);
    try {
      const res = await fetch(`/api/router/${id}/${action}`, { method: 'POST' });
      const json = await res.json();
      if (json.success) setToast({ type: 'success', message: action === 'test' ? `Koneksi ${json.status === 'CONNECTED' ? 'berhasil' : 'gagal'}.` : 'Sinkronisasi berhasil.' });
      else setToast({ type: 'error', message: json.error });
      fetchRouters();
    } catch { setToast({ type: 'error', message: 'Kesalahan jaringan.' }); } finally { setActionLoading(null); }
  };

  const toggleSort = (col: string) => { if (sortBy === col) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); else { setSortBy(col); setSortOrder('asc'); } };
  const totalPages = Math.ceil(total / limit);
  const getBarColor = (v: number) => v >= 80 ? 'bg-rose-500' : v >= 50 ? 'bg-amber-500' : 'bg-emerald-500';

  return (
    <div className="space-y-6">
      {toast && (<div className={`fixed top-4 right-4 z-[100] max-w-sm rounded-lg border p-4 shadow-lg text-sm font-semibold animate-fade-in ${toast.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-400'}`}>{toast.message}</div>)}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-3"><Server className="h-7 w-7 text-primary" /> Router Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Kelola perangkat MikroTik RouterOS</p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"><Plus className="h-4 w-4" /> Tambah Router</button>
      </div>

      <Card className="border border-border/40 bg-card/60 shadow-xs"><CardContent className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input type="text" placeholder="Cari router..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="h-9 w-full rounded-lg border border-border/40 bg-background pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:border-primary/50 focus:outline-hidden focus:ring-1 focus:ring-primary/20" /></div>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="h-9 rounded-lg border border-border/40 bg-background px-3 text-sm text-foreground focus:border-primary/50 focus:outline-hidden">
            <option value="">Semua Status</option><option value="CONNECTED">Online</option><option value="DISCONNECTED">Offline</option><option value="ERROR">Error</option>
          </select>
        </div>
      </CardContent></Card>

      <Card className="overflow-hidden border border-border/40 bg-card/60 shadow-xs"><CardContent className="p-0">
        {loading ? (<div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /><span className="ml-2 text-sm text-muted-foreground">Memuat...</span></div>
        ) : routers.length === 0 ? (<div className="flex flex-col items-center justify-center gap-3 py-20 text-muted-foreground"><Inbox className="h-10 w-10" /><p className="text-sm font-medium">Belum ada router.</p></div>
        ) : (
          <div className="overflow-x-auto"><Table><TableHeader className="bg-neutral-900/40"><TableRow className="border-b border-border/30 hover:bg-transparent">
            <TableHead className="text-xs font-semibold text-muted-foreground cursor-pointer" onClick={() => toggleSort('name')}><span className="flex items-center gap-1">Router <ArrowUpDown className="h-3 w-3" /></span></TableHead>
            <TableHead className="text-xs font-semibold text-muted-foreground">Host</TableHead>
            <TableHead className="text-xs font-semibold text-muted-foreground">Status</TableHead>
            <TableHead className="text-xs font-semibold text-muted-foreground w-[120px]">CPU</TableHead>
            <TableHead className="text-xs font-semibold text-muted-foreground w-[120px]">Memory</TableHead>
            <TableHead className="text-xs font-semibold text-muted-foreground">ROS Ver</TableHead>
            <TableHead className="text-xs font-semibold text-muted-foreground">Uptime</TableHead>
            <TableHead className="text-xs font-semibold text-muted-foreground text-center">Aksi</TableHead>
          </TableRow></TableHeader>
          <TableBody>{routers.map((r) => {
            const isOnline = r.status === 'CONNECTED';
            return (
              <TableRow key={r.id} className="border-b border-border/20 hover:bg-neutral-900/10">
                <TableCell className="text-xs font-bold text-foreground">{r.name}{r.isSimulation && <span className="ml-1.5 text-[8px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-1 py-0.5 rounded font-bold">SIM</span>}</TableCell>
                <TableCell className="text-xs font-mono text-muted-foreground">{r.host}:{r.port}</TableCell>
                <TableCell><span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold border ${isOnline ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'}`}>{isOnline ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}{isOnline ? 'Online' : 'Offline'}</span></TableCell>
                <TableCell><div className="space-y-1"><div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground"><span className="flex items-center gap-1"><Cpu className="h-2.5 w-2.5 text-primary" /></span><span>{r.cpuUsage ?? 0}%</span></div><div className="h-1.5 w-full rounded-full bg-neutral-800 overflow-hidden"><div className={`h-full rounded-full ${getBarColor(r.cpuUsage ?? 0)}`} style={{ width: `${r.cpuUsage ?? 0}%` }} /></div></div></TableCell>
                <TableCell><div className="space-y-1"><div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground"><span className="flex items-center gap-1"><HardDrive className="h-2.5 w-2.5 text-blue-400" /></span><span>{r.memoryUsage ?? 0}%</span></div><div className="h-1.5 w-full rounded-full bg-neutral-800 overflow-hidden"><div className={`h-full rounded-full ${getBarColor(r.memoryUsage ?? 0)}`} style={{ width: `${r.memoryUsage ?? 0}%` }} /></div></div></TableCell>
                <TableCell className="text-xs text-muted-foreground">{r.routerosVersion || '-'}</TableCell>
                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{r.uptime || '-'}</TableCell>
                <TableCell><div className="flex items-center justify-center gap-0.5">
                  <button onClick={() => { setDetailRouter(r); setShowDetail(true); }} className="rounded-md p-1.5 text-muted-foreground hover:text-sky-400 hover:bg-sky-500/10" title="Detail"><Eye className="h-3.5 w-3.5" /></button>
                  <button onClick={() => doAction(r.id, 'test')} disabled={actionLoading === `${r.id}-test`} className="rounded-md p-1.5 text-muted-foreground hover:text-emerald-400 hover:bg-emerald-500/10 disabled:opacity-30" title="Test Connection">{actionLoading === `${r.id}-test` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}</button>
                  <button onClick={() => doAction(r.id, 'sync')} disabled={actionLoading === `${r.id}-sync`} className="rounded-md p-1.5 text-muted-foreground hover:text-cyan-400 hover:bg-cyan-500/10 disabled:opacity-30" title="Sync Info">{actionLoading === `${r.id}-sync` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}</button>
                  <button onClick={() => openEdit(r)} className="rounded-md p-1.5 text-muted-foreground hover:text-amber-400 hover:bg-amber-500/10" title="Edit"><Edit className="h-3.5 w-3.5" /></button>
                  <button onClick={() => { setDeletingRouter(r); setShowDeleteDialog(true); }} className="rounded-md p-1.5 text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10" title="Hapus"><Trash2 className="h-3.5 w-3.5" /></button>
                </div></TableCell>
              </TableRow>);
          })}</TableBody></Table></div>
        )}
      </CardContent>
      {totalPages > 1 && (<div className="flex items-center justify-between border-t border-border/20 px-4 py-3"><span className="text-xs text-muted-foreground">{((page-1)*limit)+1}-{Math.min(page*limit,total)} dari {total}</span><div className="flex items-center gap-1"><button disabled={page<=1} onClick={() => setPage(page-1)} className="rounded-md p-1.5 text-muted-foreground hover:text-foreground disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button><span className="text-xs font-bold text-foreground px-2">{page}/{totalPages}</span><button disabled={page>=totalPages} onClick={() => setPage(page+1)} className="rounded-md p-1.5 text-muted-foreground hover:text-foreground disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button></div></div>)}
      </Card>

      {/* Form Modal */}
      {showForm && (<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs" onClick={() => setShowForm(false)}><div className="w-full max-w-lg rounded-xl border border-border/40 bg-neutral-900 p-6 shadow-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5"><h3 className="text-lg font-bold text-foreground">{editingRouter ? 'Edit Router' : 'Tambah Router'}</h3><button onClick={() => setShowForm(false)} className="rounded-md p-1 hover:bg-neutral-800 text-muted-foreground"><X className="h-4 w-4" /></button></div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5 col-span-2"><label className="text-xs font-semibold text-foreground">Nama Router *</label><input {...register('name')} className="h-9 w-full rounded-lg border border-border/40 bg-background px-3 text-sm focus:border-primary/50 focus:outline-hidden focus:ring-1 focus:ring-primary/20" />{errors.name && <p className="text-[10px] text-rose-400">{errors.name.message}</p>}</div>
            <div className="space-y-1.5"><label className="text-xs font-semibold text-foreground">IP Address *</label><input {...register('host')} placeholder="192.168.1.1" className="h-9 w-full rounded-lg border border-border/40 bg-background px-3 text-sm focus:border-primary/50 focus:outline-hidden focus:ring-1 focus:ring-primary/20" />{errors.host && <p className="text-[10px] text-rose-400">{errors.host.message}</p>}</div>
            <div className="space-y-1.5"><label className="text-xs font-semibold text-foreground">API Port *</label><input type="number" {...register('port', { valueAsNumber: true })} className="h-9 w-full rounded-lg border border-border/40 bg-background px-3 text-sm focus:border-primary/50 focus:outline-hidden focus:ring-1 focus:ring-primary/20" />{errors.port && <p className="text-[10px] text-rose-400">{errors.port.message}</p>}</div>
            <div className="space-y-1.5"><label className="text-xs font-semibold text-foreground">Username *</label><input {...register('username')} className="h-9 w-full rounded-lg border border-border/40 bg-background px-3 text-sm focus:border-primary/50 focus:outline-hidden focus:ring-1 focus:ring-primary/20" />{errors.username && <p className="text-[10px] text-rose-400">{errors.username.message}</p>}</div>
            <div className="space-y-1.5"><label className="text-xs font-semibold text-foreground">Password *</label><input type="password" {...register('password')} className="h-9 w-full rounded-lg border border-border/40 bg-background px-3 text-sm focus:border-primary/50 focus:outline-hidden focus:ring-1 focus:ring-primary/20" />{errors.password && <p className="text-[10px] text-rose-400">{errors.password.message}</p>}</div>
            <div className="space-y-1.5 col-span-2"><label className="text-xs font-semibold text-foreground">Deskripsi</label><input {...register('description')} className="h-9 w-full rounded-lg border border-border/40 bg-background px-3 text-sm focus:border-primary/50 focus:outline-hidden focus:ring-1 focus:ring-primary/20" /></div>
            <div className="col-span-2 flex items-center gap-2"><input type="checkbox" {...register('isSimulation')} id="sim" className="rounded border-border/40" /><label htmlFor="sim" className="text-xs font-semibold text-muted-foreground">Mode Simulasi (mock RouterOS API)</label></div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-border/40 px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-neutral-800">Batal</button>
            <button type="submit" disabled={submitting} className="rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50">{submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : editingRouter ? 'Simpan' : 'Buat Router'}</button>
          </div>
        </form>
      </div></div>)}

      {/* Delete Dialog */}
      {showDeleteDialog && deletingRouter && (<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs" onClick={() => setShowDeleteDialog(false)}><div className="w-full max-w-sm rounded-xl border border-border/40 bg-neutral-900 p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-foreground mb-2">Hapus Router</h3>
        <p className="text-sm text-muted-foreground mb-5">Yakin hapus <strong className="text-foreground">&quot;{deletingRouter.name}&quot;</strong>?</p>
        <div className="flex justify-end gap-2"><button onClick={() => setShowDeleteDialog(false)} className="rounded-lg border border-border/40 px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-neutral-800">Batal</button><button onClick={onDelete} disabled={submitting} className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-50">{submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Hapus'}</button></div>
      </div></div>)}

      {/* Detail Modal */}
      {showDetail && detailRouter && (<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs" onClick={() => setShowDetail(false)}><div className="w-full max-w-lg rounded-xl border border-border/40 bg-neutral-900 p-6 shadow-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5"><h3 className="text-lg font-bold text-foreground">Detail Router</h3><button onClick={() => setShowDetail(false)} className="rounded-md p-1 hover:bg-neutral-800 text-muted-foreground"><X className="h-4 w-4" /></button></div>
        <div className="space-y-3">{[
          ['Nama', detailRouter.name], ['Host', `${detailRouter.host}:${detailRouter.port}`], ['Status', detailRouter.status],
          ['RouterOS', detailRouter.routerosVersion || '-'], ['Architecture', detailRouter.architecture || '-'], ['Board', detailRouter.boardName || '-'],
          ['CPU', `${detailRouter.cpuUsage ?? 0}%`], ['Memory', `${detailRouter.memoryUsage ?? 0}%`],
          ['Total Memory', detailRouter.totalMemory || '-'], ['Free Memory', detailRouter.freeMemory || '-'],
          ['Uptime', detailRouter.uptime || '-'], ['Last Sync', detailRouter.lastSync ? new Date(detailRouter.lastSync).toLocaleString('id-ID') : '-'],
          ['Slices', String(detailRouter._count.slices)], ['Simulasi', detailRouter.isSimulation ? 'Ya' : 'Tidak'],
        ].map(([l, v]) => (<div key={l} className="flex justify-between border-b border-border/10 pb-2"><span className="text-xs text-muted-foreground">{l}</span><span className="text-xs font-bold text-foreground">{v}</span></div>))}</div>
      </div></div>)}
    </div>
  );
}
