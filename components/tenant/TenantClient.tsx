'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Users, Plus, Search, Edit, Trash2, Eye,
  ChevronLeft, ChevronRight, ArrowUpDown, Inbox, Loader2, X
} from 'lucide-react';

// ---- Zod Schema ----
const tenantSchema = z.object({
  name: z.string().min(3, 'Nama minimal 3 karakter').max(100, 'Nama maksimal 100 karakter'),
  description: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']),
});
type TenantFormData = z.infer<typeof tenantSchema>;

interface TenantRow {
  id: string;
  name: string;
  description: string | null;
  status: string;
  _count: { slices: number };
  createdAt: string;
  updatedAt: string;
}

export default function TenantClient() {
  const [tenants, setTenants] = useState<TenantRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modal State
  const [showForm, setShowForm] = useState(false);
  const [editingTenant, setEditingTenant] = useState<TenantRow | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingTenant, setDeletingTenant] = useState<TenantRow | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailTenant, setDetailTenant] = useState<TenantRow | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<TenantFormData>({
    resolver: zodResolver(tenantSchema),
    defaultValues: { name: '', description: '', status: 'ACTIVE' },
  });

  // ---- Fetch ----
  const fetchTenants = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      params.set('sortBy', sortBy);
      params.set('sortOrder', sortOrder);
      params.set('page', String(page));
      params.set('limit', String(limit));

      const res = await fetch(`/api/tenant?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setTenants(json.data);
        setTotal(json.total);
      }
    } catch { /* ignore */ } finally { setLoading(false); }
  }, [search, statusFilter, sortBy, sortOrder, page, limit]);

  useEffect(() => { fetchTenants(); }, [fetchTenants]);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  // ---- Actions ----
  const openCreate = () => { setEditingTenant(null); reset({ name: '', description: '', status: 'ACTIVE' }); setShowForm(true); };
  const openEdit = (t: TenantRow) => {
    setEditingTenant(t);
    setValue('name', t.name);
    setValue('description', t.description || '');
    setValue('status', t.status as 'ACTIVE' | 'INACTIVE');
    setShowForm(true);
  };
  const openDelete = (t: TenantRow) => { setDeletingTenant(t); setShowDeleteDialog(true); };
  const openDetail = (t: TenantRow) => { setDetailTenant(t); setShowDetailModal(true); };

  const onSubmit = async (data: TenantFormData) => {
    setSubmitting(true);
    try {
      const url = editingTenant ? `/api/tenant/${editingTenant.id}` : '/api/tenant';
      const method = editingTenant ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      const json = await res.json();
      if (json.success) {
        setToast({ type: 'success', message: editingTenant ? 'Tenant berhasil diperbarui.' : 'Tenant berhasil dibuat.' });
        setShowForm(false);
        fetchTenants();
      } else {
        setToast({ type: 'error', message: json.error || 'Operasi gagal.' });
      }
    } catch { setToast({ type: 'error', message: 'Terjadi kesalahan jaringan.' }); } finally { setSubmitting(false); }
  };

  const onDelete = async () => {
    if (!deletingTenant) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/tenant/${deletingTenant.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setToast({ type: 'success', message: 'Tenant berhasil dihapus.' });
        setShowDeleteDialog(false);
        setDeletingTenant(null);
        fetchTenants();
      } else {
        setToast({ type: 'error', message: json.error || 'Gagal menghapus tenant.' });
      }
    } catch { setToast({ type: 'error', message: 'Terjadi kesalahan jaringan.' }); } finally { setSubmitting(false); }
  };

  const toggleSort = (col: string) => {
    if (sortBy === col) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortOrder('asc'); }
  };

  const totalPages = Math.ceil(total / limit);
  const fmtDate = (s: string) => new Date(s).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className="space-y-6">
      {/* Toast */}
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
            <Users className="h-7 w-7 text-primary" /> Tenant Management
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Kelola seluruh tenant yang terdaftar di sistem</p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors">
          <Plus className="h-4 w-4" /> Tambah Tenant
        </button>
      </div>

      {/* Filters */}
      <Card className="border border-border/40 bg-card/60 shadow-xs">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text" placeholder="Cari tenant..." value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="h-9 w-full rounded-lg border border-border/40 bg-background pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:border-primary/50 focus:outline-hidden focus:ring-1 focus:ring-primary/20"
              />
            </div>
            <select
              value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="h-9 rounded-lg border border-border/40 bg-background px-3 text-sm text-foreground focus:border-primary/50 focus:outline-hidden"
            >
              <option value="">Semua Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden border border-border/40 bg-card/60 shadow-xs">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="ml-2 text-sm text-muted-foreground">Memuat data...</span>
            </div>
          ) : tenants.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-muted-foreground">
              <Inbox className="h-10 w-10" />
              <p className="text-sm font-medium">Belum ada tenant terdaftar.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-neutral-900/40">
                  <TableRow className="border-b border-border/30 hover:bg-transparent">
                    <TableHead className="text-xs font-semibold text-muted-foreground cursor-pointer" onClick={() => toggleSort('name')}>
                      <span className="flex items-center gap-1">Nama Tenant <ArrowUpDown className="h-3 w-3" /></span>
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground">Deskripsi</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground">Status</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground text-center">Slices</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground cursor-pointer" onClick={() => toggleSort('createdAt')}>
                      <span className="flex items-center gap-1">Created <ArrowUpDown className="h-3 w-3" /></span>
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground text-center">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tenants.map((t) => (
                    <TableRow key={t.id} className="border-b border-border/20 hover:bg-neutral-900/10">
                      <TableCell className="text-xs font-bold text-foreground">{t.name}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{t.description || '-'}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold border ${
                          t.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-neutral-500/10 text-neutral-400 border-neutral-500/20'
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${t.status === 'ACTIVE' ? 'bg-emerald-400' : 'bg-neutral-400'}`} />
                          {t.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                        </span>
                      </TableCell>
                      <TableCell className="text-center text-xs font-bold text-foreground">{t._count.slices}</TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{fmtDate(t.createdAt)}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => openDetail(t)} className="rounded-md p-1.5 text-muted-foreground hover:text-sky-400 hover:bg-sky-500/10 transition-colors" title="Detail">
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => openEdit(t)} className="rounded-md p-1.5 text-muted-foreground hover:text-amber-400 hover:bg-amber-500/10 transition-colors" title="Edit">
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => openDelete(t)} className="rounded-md p-1.5 text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 transition-colors" title="Hapus">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs" onClick={() => setShowForm(false)}>
          <div className="w-full max-w-md rounded-xl border border-border/40 bg-neutral-900 p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-foreground">{editingTenant ? 'Edit Tenant' : 'Tambah Tenant Baru'}</h3>
              <button onClick={() => setShowForm(false)} className="rounded-md p-1 hover:bg-neutral-800 text-muted-foreground"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Nama Tenant <span className="text-rose-400">*</span></label>
                <input {...register('name')} className="h-9 w-full rounded-lg border border-border/40 bg-background px-3 text-sm focus:border-primary/50 focus:outline-hidden focus:ring-1 focus:ring-primary/20" placeholder="Contoh: PT Maju Bersama" />
                {errors.name && <p className="text-[10px] text-rose-400">{errors.name.message}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Deskripsi</label>
                <input {...register('description')} className="h-9 w-full rounded-lg border border-border/40 bg-background px-3 text-sm focus:border-primary/50 focus:outline-hidden focus:ring-1 focus:ring-primary/20" placeholder="Opsional" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Status</label>
                <select {...register('status')} className="h-9 w-full rounded-lg border border-border/40 bg-background px-3 text-sm text-foreground focus:border-primary/50 focus:outline-hidden">
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-border/40 px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-neutral-800 transition-colors">Batal</button>
                <button type="submit" disabled={submitting} className="rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : editingTenant ? 'Simpan' : 'Buat Tenant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---- Delete Dialog ---- */}
      {showDeleteDialog && deletingTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs" onClick={() => setShowDeleteDialog(false)}>
          <div className="w-full max-w-sm rounded-xl border border-border/40 bg-neutral-900 p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-foreground mb-2">Hapus Tenant</h3>
            <p className="text-sm text-muted-foreground mb-5">
              Apakah Anda yakin ingin menghapus tenant <strong className="text-foreground">&quot;{deletingTenant.name}&quot;</strong>? Tindakan ini tidak dapat dibatalkan.
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

      {/* ---- Detail Modal ---- */}
      {showDetailModal && detailTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs" onClick={() => setShowDetailModal(false)}>
          <div className="w-full max-w-md rounded-xl border border-border/40 bg-neutral-900 p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-foreground">Detail Tenant</h3>
              <button onClick={() => setShowDetailModal(false)} className="rounded-md p-1 hover:bg-neutral-800 text-muted-foreground"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-3">
              {[
                ['Nama', detailTenant.name],
                ['Deskripsi', detailTenant.description || '-'],
                ['Status', detailTenant.status],
                ['Jumlah Slice', String(detailTenant._count.slices)],
                ['Dibuat', fmtDate(detailTenant.createdAt)],
                ['Diperbarui', fmtDate(detailTenant.updatedAt)],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between border-b border-border/10 pb-2">
                  <span className="text-xs text-muted-foreground">{label}</span>
                  <span className="text-xs font-bold text-foreground">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
