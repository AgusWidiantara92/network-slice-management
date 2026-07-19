'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { networkSliceSchema, type NetworkSliceFormData } from '@/validators/network-slice.schema';
import {
  Network, Plus, Search, Edit, Trash2, Eye, Shield, Sliders, Router, Users,
  ChevronLeft, ChevronRight, ArrowUpDown, Inbox, Loader2, X, AlertTriangle, ShieldCheck
} from 'lucide-react';

interface TenantOption {
  id: string;
  name: string;
}

interface RouterOption {
  id: string;
  name: string;
  host: string;
}

interface SliceRow {
  id: string;
  name: string;
  vlanId: number | null;
  vrfName: string | null;
  subnet: string | null;
  gateway: string | null;
  bandwidthTx: string;
  bandwidthRx: string;
  firewallProfile: string | null;
  isolated: boolean;
  status: string;
  tenant: TenantOption | null;
  router: RouterOption;
  createdAt: string;
  updatedAt: string;
}

export default function SliceClient() {
  const [slices, setSlices] = useState<SliceRow[]>([]);
  const [tenants, setTenants] = useState<TenantOption[]>([]);
  const [routers, setRouters] = useState<RouterOption[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [tenantFilter, setTenantFilter] = useState('');
  const [routerFilter, setRouterFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modal states
  const [showForm, setShowForm] = useState(false);
  const [editingSlice, setEditingSlice] = useState<SliceRow | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingSlice, setDeletingSlice] = useState<SliceRow | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [detailSlice, setDetailSlice] = useState<SliceRow | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<NetworkSliceFormData>({
    resolver: zodResolver(networkSliceSchema),
    defaultValues: {
      name: '', tenantId: '', routerId: '', vlanId: 100, vrfName: 'vrf_default',
      subnet: '192.168.100.0/24', gateway: '192.168.100.1', bandwidthTx: '10M',
      bandwidthRx: '10M', firewallProfile: 'standard', isolated: true, status: 'ACTIVE'
    }
  });

  // ---- Fetch Slices, Tenants, & Routers ----
  const fetchSlices = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (search) p.set('search', search);
      if (statusFilter) p.set('status', statusFilter);
      if (tenantFilter) p.set('tenantId', tenantFilter);
      if (routerFilter) p.set('routerId', routerFilter);
      p.set('sortBy', sortBy);
      p.set('sortOrder', sortOrder);
      p.set('page', String(page));
      p.set('limit', String(limit));

      const res = await fetch(`/api/network-slice?${p.toString()}`);
      const json = await res.json();
      if (json.success) {
        setSlices(json.data);
        setTotal(json.total);
      }
    } catch { /* ignore */ } finally { setLoading(false); }
  }, [search, statusFilter, tenantFilter, routerFilter, sortBy, sortOrder, page, limit]);

  const fetchDropdowns = async () => {
    try {
      const [resTenants, resRouters] = await Promise.all([
        fetch('/api/tenant?limit=1000'),
        fetch('/api/router?limit=1000')
      ]);
      const jsonTenants = await resTenants.json();
      const jsonRouters = await resRouters.json();
      if (jsonTenants.success) setTenants(jsonTenants.data);
      if (jsonRouters.success) setRouters(jsonRouters.data);
    } catch { /* ignore */ }
  };

  useEffect(() => {
    fetchSlices();
  }, [fetchSlices]);

  useEffect(() => {
    fetchDropdowns();
  }, []);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  // ---- Actions ----
  const openCreate = () => {
    setEditingSlice(null);
    reset({
      name: '', tenantId: '', routerId: '', vlanId: 100, vrfName: 'vrf_default',
      subnet: '192.168.100.0/24', gateway: '192.168.100.1', bandwidthTx: '10M',
      bandwidthRx: '10M', firewallProfile: 'standard', isolated: true, status: 'ACTIVE'
    });
    setShowForm(true);
  };

  const openEdit = (s: SliceRow) => {
    setEditingSlice(s);
    setValue('name', s.name);
    setValue('tenantId', s.tenant?.id || '');
    setValue('routerId', s.router.id);
    setValue('vlanId', s.vlanId || 100);
    setValue('vrfName', s.vrfName || '');
    setValue('subnet', s.subnet || '');
    setValue('gateway', s.gateway || '');
    setValue('bandwidthTx', s.bandwidthTx);
    setValue('bandwidthRx', s.bandwidthRx);
    setValue('firewallProfile', s.firewallProfile || 'standard');
    setValue('isolated', s.isolated);
    setValue('status', s.status as 'ACTIVE' | 'INACTIVE' | 'ERROR');
    setShowForm(true);
  };

  const onSubmit = async (data: NetworkSliceFormData) => {
    setSubmitting(true);
    try {
      const url = editingSlice ? `/api/network-slice/${editingSlice.id}` : '/api/network-slice';
      const method = editingSlice ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const json = await res.json();
      if (json.success) {
        setToast({ type: 'success', message: editingSlice ? 'Network slice berhasil diperbarui.' : 'Network slice berhasil dibuat.' });
        setShowForm(false);
        fetchSlices();
      } else {
        setToast({ type: 'error', message: json.error || 'Operasi gagal.' });
      }
    } catch {
      setToast({ type: 'error', message: 'Terjadi kesalahan jaringan.' });
    } finally {
      setSubmitting(false);
    }
  };

  const onDelete = async () => {
    if (!deletingSlice) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/network-slice/${deletingSlice.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setToast({ type: 'success', message: 'Network slice berhasil dihapus.' });
        setShowDeleteDialog(false);
        fetchSlices();
      } else {
        setToast({ type: 'error', message: json.error || 'Gagal menghapus network slice.' });
      }
    } catch {
      setToast({ type: 'error', message: 'Terjadi kesalahan jaringan.' });
    } finally {
      setSubmitting(false);
    }
  };

  const toggleSort = (col: string) => {
    if (sortBy === col) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortOrder('asc'); }
  };

  const totalPages = Math.ceil(total / limit);
  const fmtDate = (s: string) => new Date(s).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toast && (
        <div className={`fixed top-4 right-4 z-[100] max-w-sm rounded-lg border p-4 shadow-lg text-sm font-semibold animate-fade-in ${
          toast.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
        }`}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
            <Network className="h-7 w-7 text-primary" /> Network Slice Management
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Alokasikan segmen jaringan terisolasi untuk masing-masing tenant</p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors">
          <Plus className="h-4 w-4" /> Alokasikan Slice
        </button>
      </div>

      {/* Filters Bar */}
      <Card className="border border-border/40 bg-card/60 shadow-xs">
        <CardContent className="p-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text" placeholder="Cari nama slice..." value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="h-9 w-full rounded-lg border border-border/40 bg-background pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:border-primary/50 focus:outline-hidden focus:ring-1 focus:ring-primary/20"
              />
            </div>
            <select
              value={tenantFilter} onChange={(e) => { setTenantFilter(e.target.value); setPage(1); }}
              className="h-9 rounded-lg border border-border/40 bg-background px-3 text-sm text-foreground focus:border-primary/50 focus:outline-hidden"
            >
              <option value="">Semua Tenant</option>
              {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <select
              value={routerFilter} onChange={(e) => { setRouterFilter(e.target.value); setPage(1); }}
              className="h-9 rounded-lg border border-border/40 bg-background px-3 text-sm text-foreground focus:border-primary/50 focus:outline-hidden"
            >
              <option value="">Semua Router</option>
              {routers.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
            <select
              value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="h-9 rounded-lg border border-border/40 bg-background px-3 text-sm text-foreground focus:border-primary/50 focus:outline-hidden"
            >
              <option value="">Semua Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="ERROR">Error</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Slices Table */}
      <Card className="overflow-hidden border border-border/40 bg-card/60 shadow-xs">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="ml-2 text-sm text-muted-foreground">Memuat data...</span>
            </div>
          ) : slices.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-muted-foreground">
              <Inbox className="h-10 w-10" />
              <p className="text-sm font-medium">Belum ada network slice terdaftar.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-neutral-900/40">
                  <TableRow className="border-b border-border/30 hover:bg-transparent">
                    <TableHead className="text-xs font-semibold text-muted-foreground cursor-pointer" onClick={() => toggleSort('name')}>
                      <span className="flex items-center gap-1">Nama Slice <ArrowUpDown className="h-3 w-3" /></span>
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground">Tenant</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground">Router</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground">VLAN ID</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground">VRF Name</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground">Subnet</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground">Bandwidth (Rx/Tx)</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground">Status</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground text-center">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {slices.map((s) => (
                    <TableRow key={s.id} className="border-b border-border/20 hover:bg-neutral-900/10">
                      <TableCell className="text-xs font-bold text-foreground">{s.name}</TableCell>
                      <TableCell className="text-xs text-muted-foreground font-semibold">{s.tenant?.name || 'Tanpa Tenant'}</TableCell>
                      <TableCell className="text-xs text-muted-foreground font-medium">{s.router.name}</TableCell>
                      <TableCell className="text-xs font-mono text-foreground">{s.vlanId || '-'}</TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">{s.vrfName || '-'}</TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">{s.subnet || '-'}</TableCell>
                      <TableCell className="text-xs font-mono text-foreground">{s.bandwidthRx} / {s.bandwidthTx}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold border ${
                          s.status === 'ACTIVE' 
                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                            : s.status === 'INACTIVE'
                              ? 'bg-neutral-500/10 text-neutral-400 border-neutral-500/20'
                              : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${s.status === 'ACTIVE' ? 'bg-emerald-400' : s.status === 'INACTIVE' ? 'bg-neutral-400' : 'bg-rose-400'}`} />
                          {s.status === 'ACTIVE' ? 'Active' : s.status === 'INACTIVE' ? 'Inactive' : 'Error'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => { setDetailSlice(s); setShowDetail(true); }} className="rounded-md p-1.5 text-muted-foreground hover:text-sky-400 hover:bg-sky-500/10 transition-colors" title="Detail">
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => openEdit(s)} className="rounded-md p-1.5 text-muted-foreground hover:text-amber-400 hover:bg-amber-500/10 transition-colors" title="Edit">
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => { setDeletingSlice(s); setShowDeleteDialog(true); }} className="rounded-md p-1.5 text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 transition-colors" title="Hapus">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border/20 px-4 py-3">
            <span className="text-xs text-muted-foreground">
              Menampilkan {((page - 1) * limit) + 1}-{Math.min(page * limit, total)} dari {total}
            </span>
            <div className="flex items-center gap-1">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded-md p-1.5 text-muted-foreground hover:text-foreground disabled:opacity-30">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-xs font-bold text-foreground px-2">{page} / {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="rounded-md p-1.5 text-muted-foreground hover:text-foreground disabled:opacity-30">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* ---- Form Modal (Create/Edit) ---- */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs overflow-y-auto p-4" onClick={() => setShowForm(false)}>
          <div className="w-full max-w-lg rounded-xl border border-border/40 bg-neutral-900 p-6 shadow-xl my-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-foreground">{editingSlice ? 'Edit Network Slice' : 'Alokasikan Network Slice'}</h3>
              <button onClick={() => setShowForm(false)} className="rounded-md p-1 hover:bg-neutral-800 text-muted-foreground"><X className="h-4 w-4" /></button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Name field */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Nama Slice *</label>
                <input {...register('name')} className="h-9 w-full rounded-lg border border-border/40 bg-background px-3 text-sm focus:border-primary/50 focus:outline-hidden focus:ring-1" placeholder="Contoh: Slice-Marketing" />
                {errors.name && <p className="text-[10px] text-rose-400">{errors.name.message}</p>}
              </div>

              {/* Tenant & Router grid */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Tenant *</label>
                  <select {...register('tenantId')} className="h-9 w-full rounded-lg border border-border/40 bg-background px-3 text-sm focus:outline-hidden">
                    <option value="">Pilih Tenant...</option>
                    {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                  {errors.tenantId && <p className="text-[10px] text-rose-400">{errors.tenantId.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Router *</label>
                  <select {...register('routerId')} className="h-9 w-full rounded-lg border border-border/40 bg-background px-3 text-sm focus:outline-hidden">
                    <option value="">Pilih Router...</option>
                    {routers.map(r => <option key={r.id} value={r.id}>{r.name} ({r.host})</option>)}
                  </select>
                  {errors.routerId && <p className="text-[10px] text-rose-400">{errors.routerId.message}</p>}
                </div>
              </div>

              {/* VLAN & VRF grid */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">VLAN ID *</label>
                  <input type="number" {...register('vlanId', { valueAsNumber: true })} className="h-9 w-full rounded-lg border border-border/40 bg-background px-3 text-sm focus:outline-hidden" />
                  {errors.vlanId && <p className="text-[10px] text-rose-400">{errors.vlanId.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">VRF Name *</label>
                  <input {...register('vrfName')} className="h-9 w-full rounded-lg border border-border/40 bg-background px-3 text-sm focus:outline-hidden" placeholder="vrf_name" />
                  {errors.vrfName && <p className="text-[10px] text-rose-400">{errors.vrfName.message}</p>}
                </div>
              </div>

              {/* Subnet & Gateway grid */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Subnet (CIDR) *</label>
                  <input {...register('subnet')} className="h-9 w-full rounded-lg border border-border/40 bg-background px-3 text-sm focus:outline-hidden" placeholder="192.168.10.0/24" />
                  {errors.subnet && <p className="text-[10px] text-rose-400">{errors.subnet.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Gateway *</label>
                  <input {...register('gateway')} className="h-9 w-full rounded-lg border border-border/40 bg-background px-3 text-sm focus:outline-hidden" placeholder="192.168.10.1" />
                  {errors.gateway && <p className="text-[10px] text-rose-400">{errors.gateway.message}</p>}
                </div>
              </div>

              {/* Bandwidth Tx/Rx */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Bandwidth Download (Rx) *</label>
                  <input {...register('bandwidthRx')} className="h-9 w-full rounded-lg border border-border/40 bg-background px-3 text-sm focus:outline-hidden" placeholder="10M" />
                  {errors.bandwidthRx && <p className="text-[10px] text-rose-400">{errors.bandwidthRx.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Bandwidth Upload (Tx) *</label>
                  <input {...register('bandwidthTx')} className="h-9 w-full rounded-lg border border-border/40 bg-background px-3 text-sm focus:outline-hidden" placeholder="10M" />
                  {errors.bandwidthTx && <p className="text-[10px] text-rose-400">{errors.bandwidthTx.message}</p>}
                </div>
              </div>

              {/* Firewall profile, isolated checkbox, status */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Firewall Profile *</label>
                  <select {...register('firewallProfile')} className="h-9 w-full rounded-lg border border-border/40 bg-background px-3 text-sm focus:outline-hidden">
                    <option value="standard">Standard (Default)</option>
                    <option value="strict">Strict Security</option>
                    <option value="allow-all">Allow All Traffic</option>
                  </select>
                  {errors.firewallProfile && <p className="text-[10px] text-rose-400">{errors.firewallProfile.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Status</label>
                  <select {...register('status')} className="h-9 w-full rounded-lg border border-border/40 bg-background px-3 text-sm text-foreground focus:outline-hidden">
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="ERROR">Error</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 py-1.5">
                <input type="checkbox" {...register('isolated')} id="isolated-field" className="rounded border-border/40 bg-background text-primary focus:ring-0" />
                <label htmlFor="isolated-field" className="text-xs font-semibold text-muted-foreground select-none">
                  Isolasi lalu lintas data (Blokir komunikasi antar tenant)
                </label>
              </div>

              {/* Form buttons */}
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-border/40 px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-neutral-800 transition-colors">Batal</button>
                <button type="submit" disabled={submitting} className="rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : editingSlice ? 'Simpan Perubahan' : 'Alokasikan Slice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---- Delete Dialog ---- */}
      {showDeleteDialog && deletingSlice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs" onClick={() => setShowDeleteDialog(false)}>
          <div className="w-full max-w-sm rounded-xl border border-border/40 bg-neutral-900 p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-foreground mb-2">Hapus Network Slice</h3>
            <p className="text-sm text-muted-foreground mb-5">
              Apakah Anda yakin ingin menghapus network slice <strong className="text-foreground">&quot;{deletingSlice.name}&quot;</strong>? Tindakan ini akan menghapus alokasi logis di database.
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowDeleteDialog(false)} className="rounded-lg border border-border/40 px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-neutral-800 transition-colors">Batal</button>
              <button onClick={onDelete} disabled={submitting} className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-50 transition-colors">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---- Detail Slide-Out / Modal ---- */}
      {showDetail && detailSlice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs overflow-y-auto p-4" onClick={() => setShowDetail(false)}>
          <div className="w-full max-w-lg rounded-xl border border-border/40 bg-neutral-900 p-6 shadow-xl my-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5 border-b border-border/20 pb-3">
              <div>
                <h3 className="text-lg font-bold text-foreground">Detail Network Slice</h3>
                <span className="text-xs text-muted-foreground">ID: {detailSlice.id}</span>
              </div>
              <button onClick={() => setShowDetail(false)} className="rounded-md p-1 hover:bg-neutral-800 text-muted-foreground"><X className="h-4 w-4" /></button>
            </div>

            <div className="space-y-6">
              {/* Tenant & Router Info */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-border/30 bg-neutral-900/40 p-3">
                  <div className="flex items-center gap-2 text-primary mb-1.5">
                    <Users className="h-4 w-4" />
                    <span className="text-xs font-extrabold uppercase tracking-wider">Tenant Info</span>
                  </div>
                  <p className="text-sm font-bold text-foreground">{detailSlice.tenant?.name || 'Tanpa Tenant'}</p>
                </div>
                <div className="rounded-lg border border-border/30 bg-neutral-900/40 p-3">
                  <div className="flex items-center gap-2 text-primary mb-1.5">
                    <Router className="h-4 w-4" />
                    <span className="text-xs font-extrabold uppercase tracking-wider">Router Target</span>
                  </div>
                  <p className="text-sm font-bold text-foreground">{detailSlice.router.name}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{detailSlice.router.host}</p>
                </div>
              </div>

              {/* Segment parameters */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-extrabold text-muted-foreground uppercase tracking-widest">Konfigurasi Jaringan & Slicing</h4>
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    ['VLAN ID', detailSlice.vlanId || '-'],
                    ['VRF Name', detailSlice.vrfName || '-'],
                    ['Subnet Range', detailSlice.subnet || '-'],
                    ['Gateway IP', detailSlice.gateway || '-'],
                  ].map(([label, val]) => (
                    <div key={label} className="flex justify-between border-b border-border/10 pb-1.5">
                      <span className="text-xs text-muted-foreground">{label}</span>
                      <span className="text-xs font-mono font-bold text-foreground">{val}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* QoS configuration */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-2 text-amber-500">
                  <Sliders className="h-4 w-4" />
                  <h4 className="text-xs font-extrabold uppercase tracking-wider">Parameter QoS (Queue)</h4>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="flex justify-between border-b border-border/10 pb-1.5">
                    <span className="text-xs text-muted-foreground">Limit Download (Rx)</span>
                    <span className="text-xs font-mono font-bold text-foreground">{detailSlice.bandwidthRx}</span>
                  </div>
                  <div className="flex justify-between border-b border-border/10 pb-1.5">
                    <span className="text-xs text-muted-foreground">Limit Upload (Tx)</span>
                    <span className="text-xs font-mono font-bold text-foreground">{detailSlice.bandwidthTx}</span>
                  </div>
                </div>
              </div>

              {/* Firewall Policy */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-2 text-emerald-500">
                  <Shield className="h-4 w-4" />
                  <h4 className="text-xs font-extrabold uppercase tracking-wider">Firewall & Security Profile</h4>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="flex justify-between border-b border-border/10 pb-1.5">
                    <span className="text-xs text-muted-foreground">Profil Firewall</span>
                    <span className="text-xs font-semibold text-foreground capitalize">{detailSlice.firewallProfile || 'standard'}</span>
                  </div>
                  <div className="flex justify-between border-b border-border/10 pb-1.5">
                    <span className="text-xs text-muted-foreground">Isolasi Traffic</span>
                    <span className="text-xs font-bold text-foreground flex items-center gap-1">
                      {detailSlice.isolated ? (
                        <>
                          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                          <span>Terisolasi</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                          <span>Shared</span>
                        </>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Timestamps */}
              <div className="grid gap-2 border-t border-border/20 pt-3.5 text-[10px] text-muted-foreground">
                <p>Status Administratif: <span className="font-semibold text-foreground">{detailSlice.status}</span></p>
                <p>Dibuat: {new Date(detailSlice.createdAt).toLocaleString('id-ID')}</p>
                <p>Diperbarui: {new Date(detailSlice.updatedAt).toLocaleString('id-ID')}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
