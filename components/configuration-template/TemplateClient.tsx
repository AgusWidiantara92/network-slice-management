'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  FileCode, Plus, Search, Edit, Trash2, Eye, Copy, Download, Upload, Play,
  ChevronLeft, ChevronRight, ArrowUpDown, Inbox, Loader2, X, Shield, Sliders, Network
} from 'lucide-react';

// ---- Zod Validations ----
const templateSchema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter').max(100),
  description: z.string().optional(),
  content: z.string().min(1, 'Content/Script wajib diisi'),
  defaultVlanId: z.number().int().min(1, 'VLAN ID minimal 1').max(4094, 'VLAN ID maksimal 4094'),
  defaultVrfName: z.string().min(2, 'Nama VRF minimal 2 karakter').max(50),
  defaultSubnet: z.string().regex(/^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\/([0-9]|[1-2][0-9]|3[0-2])$/, 'Subnet harus CIDR valid (contoh: 192.168.10.0/24)'),
  defaultGateway: z.string().regex(/^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/, 'Gateway harus IP valid'),
  defaultBandwidth: z.string().regex(/^\d+[M|G|K]?$/, 'Format Bandwidth salah (contoh: 10M, 1G)'),
  firewallProfile: z.string().min(1, 'Firewall Profile wajib dipilih'),
  qosProfile: z.string().min(1, 'QoS Profile wajib dipilih'),
  status: z.enum(['ACTIVE', 'INACTIVE']),
});
type TemplateFormData = z.infer<typeof templateSchema>;

interface TemplateRow {
  id: string; name: string; description: string | null; content: string; variables: string | null;
  defaultVlanId: number | null; defaultVrfName: string | null; defaultSubnet: string | null;
  defaultGateway: string | null; defaultBandwidth: string | null; firewallProfile: string | null;
  qosProfile: string | null; status: string; createdAt: string; updatedAt: string;
}

interface TenantOption { id: string; name: string; }
interface RouterOption { id: string; name: string; host: string; }

export default function TemplateClient() {
  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [tenants, setTenants] = useState<TenantOption[]>([]);
  const [routers, setRouters] = useState<RouterOption[]>([]);
  
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modals state
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TemplateRow | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingTemplate, setDeletingTemplate] = useState<TemplateRow | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [detailTemplate, setDetailTemplate] = useState<TemplateRow | null>(null);
  
  // Apply Template Modal
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applyingTemplate, setApplyingTemplate] = useState<TemplateRow | null>(null);
  const [applyTenantId, setApplyTenantId] = useState('');
  const [applyRouterId, setApplyRouterId] = useState('');
  const [applySliceName, setApplySliceName] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<TemplateFormData>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: '', description: '', content: '/ip address add address=$gateway/24 interface=$vlanInterface',
      defaultVlanId: 100, defaultVrfName: 'vrf_default', defaultSubnet: '192.168.100.0/24',
      defaultGateway: '192.168.100.1', defaultBandwidth: '10M', firewallProfile: 'standard',
      qosProfile: 'standard', status: 'ACTIVE'
    }
  });

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (search) p.set('search', search);
      if (statusFilter) p.set('status', statusFilter);
      p.set('sortBy', sortBy); p.set('sortOrder', sortOrder);
      p.set('page', String(page)); p.set('limit', String(limit));

      const res = await fetch(`/api/configuration-template?${p.toString()}`);
      const json = await res.json();
      if (json.success) {
        setTemplates(json.data);
        setTotal(json.total);
      }
    } catch { /* ignore */ } finally { setLoading(false); }
  }, [search, statusFilter, sortBy, sortOrder, page, limit]);

  const fetchApplyDropdowns = async () => {
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

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);
  useEffect(() => { fetchApplyDropdowns(); }, []);
  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(null), 4000); return () => clearTimeout(t); } }, [toast]);

  // ---- Form Handlers ----
  const openCreate = () => {
    setEditingTemplate(null);
    reset({
      name: '', description: '', content: '/ip address add address=$gateway/24 interface=$vlanInterface',
      defaultVlanId: 100, defaultVrfName: 'vrf_default', defaultSubnet: '192.168.100.0/24',
      defaultGateway: '192.168.100.1', defaultBandwidth: '10M', firewallProfile: 'standard',
      qosProfile: 'standard', status: 'ACTIVE'
    });
    setShowForm(true);
  };

  const openEdit = (t: TemplateRow) => {
    setEditingTemplate(t);
    setValue('name', t.name);
    setValue('description', t.description || '');
    setValue('content', t.content);
    setValue('defaultVlanId', t.defaultVlanId || 100);
    setValue('defaultVrfName', t.defaultVrfName || '');
    setValue('defaultSubnet', t.defaultSubnet || '');
    setValue('defaultGateway', t.defaultGateway || '');
    setValue('defaultBandwidth', t.defaultBandwidth || '10M');
    setValue('firewallProfile', t.firewallProfile || 'standard');
    setValue('qosProfile', t.qosProfile || 'standard');
    setValue('status', t.status as 'ACTIVE' | 'INACTIVE');
    setShowForm(true);
  };

  const onSubmit = async (data: TemplateFormData) => {
    setSubmitting(true);
    try {
      const url = editingTemplate ? `/api/configuration-template/${editingTemplate.id}` : '/api/configuration-template';
      const method = editingTemplate ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const json = await res.json();
      if (json.success) {
        setToast({ type: 'success', message: editingTemplate ? 'Template diperbarui.' : 'Template berhasil dibuat.' });
        setShowForm(false);
        fetchTemplates();
      } else {
        setToast({ type: 'error', message: json.error });
      }
    } catch {
      setToast({ type: 'error', message: 'Kesalahan jaringan.' });
    } finally {
      setSubmitting(false);
    }
  };

  const onDelete = async () => {
    if (!deletingTemplate) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/configuration-template/${deletingTemplate.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setToast({ type: 'success', message: 'Template berhasil dihapus.' });
        setShowDeleteDialog(false);
        fetchTemplates();
      } else {
        setToast({ type: 'error', message: json.error });
      }
    } catch {
      setToast({ type: 'error', message: 'Kesalahan jaringan.' });
    } finally {
      setSubmitting(false);
    }
  };

  // ---- Cloning ----
  const handleClone = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/configuration-template/clone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      const json = await res.json();
      if (json.success) {
        setToast({ type: 'success', message: 'Template berhasil diduplikasi.' });
        fetchTemplates();
      } else {
        setToast({ type: 'error', message: json.error });
      }
    } catch {
      setToast({ type: 'error', message: 'Kesalahan jaringan.' });
    } finally {
      setLoading(false);
    }
  };

  // ---- Apply Template ----
  const handleApply = async () => {
    if (!applyingTemplate || !applyTenantId || !applyRouterId || !applySliceName) {
      setToast({ type: 'error', message: 'Semua kolom wajib diisi.' });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/configuration-template/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: applyingTemplate.id,
          tenantId: applyTenantId,
          routerId: applyRouterId,
          name: applySliceName
        })
      });
      const json = await res.json();
      if (json.success) {
        setToast({ type: 'success', message: 'Template berhasil diterapkan ke Network Slice.' });
        setShowApplyModal(false);
      } else {
        setToast({ type: 'error', message: json.error });
      }
    } catch {
      setToast({ type: 'error', message: 'Kesalahan jaringan.' });
    } finally {
      setSubmitting(false);
    }
  };

  // ---- Import/Export ----
  const handleExport = (id: string) => {
    window.open(`/api/configuration-template/export?id=${id}`);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target?.result as string;
      try {
        const res = await fetch('/api/configuration-template/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileContent: content })
        });
        const json = await res.json();
        if (json.success) {
          setToast({ type: 'success', message: 'Template berhasil diimpor.' });
          fetchTemplates();
        } else {
          setToast({ type: 'error', message: json.error });
        }
      } catch {
        setToast({ type: 'error', message: 'Gagal mengupload file.' });
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
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

      {/* Hidden file input */}
      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" />

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
            <FileCode className="h-7 w-7 text-primary" /> Template Konfigurasi
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Simpan dan gunakan kembali blueprint konfigurasi network slicing</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={handleImportClick} className="inline-flex items-center gap-2 rounded-lg border border-border/40 bg-card px-4 py-2.5 text-sm font-bold text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
            <Upload className="h-4 w-4" /> Impor Template
          </button>
          <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors">
            <Plus className="h-4 w-4" /> Tambah Template
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <Card className="border border-border/40 bg-card/60 shadow-xs">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text" placeholder="Cari nama atau deskripsi..." value={search}
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
          ) : templates.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-muted-foreground">
              <Inbox className="h-10 w-10" />
              <p className="text-sm font-medium">Belum ada template terdaftar.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-transparent">
                  <TableRow className="border-b border-border/30 hover:bg-transparent">
                    <TableHead className="text-xs font-semibold text-muted-foreground cursor-pointer" onClick={() => toggleSort('name')}>
                      <span className="flex items-center gap-1">Nama Template <ArrowUpDown className="h-3 w-3" /></span>
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground">Deskripsi</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground">Default VLAN</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground">Default VRF</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground">Default Subnet</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground">Bandwidth</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground">Status</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground text-center">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.map((t) => (
                    <TableRow key={t.id} className="border-b border-border/20 hover:bg-secondary/40">
                      <TableCell className="text-xs font-bold text-foreground">{t.name}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{t.description || '-'}</TableCell>
                      <TableCell className="text-xs font-mono text-foreground">{t.defaultVlanId || '-'}</TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">{t.defaultVrfName || '-'}</TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">{t.defaultSubnet || '-'}</TableCell>
                      <TableCell className="text-xs font-mono text-foreground">{t.defaultBandwidth || '-'}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold border ${
                          t.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-secondary text-muted-foreground border border-border'
                        }`}>
                          {t.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-0.5">
                          <button onClick={() => { setDetailTemplate(t); setShowDetail(true); }} className="rounded-md p-1.5 text-muted-foreground hover:text-sky-400 hover:bg-sky-500/10" title="Detail / Preview">
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => { setApplyingTemplate(t); setApplySliceName(`${t.name.split(' ')[0]}_Slice`); setShowApplyModal(true); }} className="rounded-md p-1.5 text-muted-foreground hover:text-emerald-400 hover:bg-emerald-500/10" title="Apply Template">
                            <Play className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => handleClone(t.id)} className="rounded-md p-1.5 text-muted-foreground hover:text-cyan-400 hover:bg-cyan-500/10" title="Clone">
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => handleExport(t.id)} className="rounded-md p-1.5 text-muted-foreground hover:text-purple-400 hover:bg-purple-500/10" title="Export JSON">
                            <Download className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => openEdit(t)} className="rounded-md p-1.5 text-muted-foreground hover:text-amber-400 hover:bg-amber-500/10" title="Edit">
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => { setDeletingTemplate(t); setShowDeleteDialog(true); }} className="rounded-md p-1.5 text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10" title="Hapus">
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
          <div className="w-full max-w-lg rounded-xl border border-border/40 bg-card p-6 shadow-xl my-8 animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-foreground">{editingTemplate ? 'Edit Template' : 'Tambah Template Konfigurasi'}</h3>
              <button onClick={() => setShowForm(false)} className="rounded-md p-1 hover:bg-secondary text-muted-foreground"><X className="h-4 w-4" /></button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5 col-span-2">
                  <label className="text-xs font-semibold text-foreground">Nama Template *</label>
                  <input {...register('name')} className="h-9 w-full rounded-lg border border-border/40 bg-background px-3 text-sm focus:outline-hidden" placeholder="Contoh: Template Standard Cisco" />
                  {errors.name && <p className="text-[10px] text-rose-400">{errors.name.message}</p>}
                </div>

                <div className="space-y-1.5 col-span-2">
                  <label className="text-xs font-semibold text-foreground">Deskripsi</label>
                  <input {...register('description')} className="h-9 w-full rounded-lg border border-border/40 bg-background px-3 text-sm focus:outline-hidden" placeholder="Deskripsi opsional" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Default VLAN ID *</label>
                  <input type="number" {...register('defaultVlanId', { valueAsNumber: true })} className="h-9 w-full rounded-lg border border-border/40 bg-background px-3 text-sm focus:outline-hidden" />
                  {errors.defaultVlanId && <p className="text-[10px] text-rose-400">{errors.defaultVlanId.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Default VRF Name *</label>
                  <input {...register('defaultVrfName')} className="h-9 w-full rounded-lg border border-border/40 bg-background px-3 text-sm focus:outline-hidden" />
                  {errors.defaultVrfName && <p className="text-[10px] text-rose-400">{errors.defaultVrfName.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Default Subnet *</label>
                  <input {...register('defaultSubnet')} className="h-9 w-full rounded-lg border border-border/40 bg-background px-3 text-sm focus:outline-hidden" placeholder="192.168.10.0/24" />
                  {errors.defaultSubnet && <p className="text-[10px] text-rose-400">{errors.defaultSubnet.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Default Gateway *</label>
                  <input {...register('defaultGateway')} className="h-9 w-full rounded-lg border border-border/40 bg-background px-3 text-sm focus:outline-hidden" placeholder="192.168.10.1" />
                  {errors.defaultGateway && <p className="text-[10px] text-rose-400">{errors.defaultGateway.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Default Bandwidth *</label>
                  <input {...register('defaultBandwidth')} className="h-9 w-full rounded-lg border border-border/40 bg-background px-3 text-sm focus:outline-hidden" placeholder="10M" />
                  {errors.defaultBandwidth && <p className="text-[10px] text-rose-400">{errors.defaultBandwidth.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Firewall Profile *</label>
                  <select {...register('firewallProfile')} className="h-9 w-full rounded-lg border border-border/40 bg-background px-3 text-sm focus:outline-hidden">
                    <option value="standard">Standard</option>
                    <option value="strict">Strict</option>
                    <option value="allow-all">Allow All</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">QoS Profile *</label>
                  <select {...register('qosProfile')} className="h-9 w-full rounded-lg border border-border/40 bg-background px-3 text-sm focus:outline-hidden">
                    <option value="standard">Standard</option>
                    <option value="high-priority">High Priority</option>
                    <option value="low-priority">Low Priority</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Status</label>
                  <select {...register('status')} className="h-9 w-full rounded-lg border border-border/40 bg-background px-3 text-sm focus:outline-hidden">
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>

                <div className="space-y-1.5 col-span-2">
                  <label className="text-xs font-semibold text-foreground">Script Template RouterOS *</label>
                  <textarea {...register('content')} rows={4} className="w-full rounded-lg border border-border/40 bg-background px-3 py-2 text-xs font-mono focus:outline-hidden focus:ring-1" placeholder="/interface vlan add name=$vlanName vlan-id=$vlanId" />
                  {errors.content && <p className="text-[10px] text-rose-400">{errors.content.message}</p>}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-border/40 px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-secondary transition-colors">Batal</button>
                <button type="submit" disabled={submitting} className="rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : editingTemplate ? 'Simpan' : 'Buat Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---- Apply Template Modal ---- */}
      {showApplyModal && applyingTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs" onClick={() => setShowApplyModal(false)}>
          <div className="w-full max-w-md rounded-xl border border-border/40 bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-foreground">Apply Template</h3>
              <button onClick={() => setShowApplyModal(false)} className="rounded-md p-1 hover:bg-secondary text-muted-foreground"><X className="h-4 w-4" /></button>
            </div>

            <div className="space-y-4">
              <div className="rounded-lg border border-border/30 bg-transparent p-3 text-xs space-y-1">
                <p>Template: <strong className="text-foreground">{applyingTemplate.name}</strong></p>
                <p className="text-muted-foreground">Default Subnet: {applyingTemplate.defaultSubnet}</p>
                <p className="text-muted-foreground">Default VLAN: {applyingTemplate.defaultVlanId}</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Nama Network Slice *</label>
                <input type="text" value={applySliceName} onChange={(e) => setApplySliceName(e.target.value)} className="h-9 w-full rounded-lg border border-border/40 bg-background px-3 text-sm focus:outline-hidden" />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Tenant *</label>
                <select value={applyTenantId} onChange={(e) => setApplyTenantId(e.target.value)} className="h-9 w-full rounded-lg border border-border/40 bg-background px-3 text-sm focus:outline-hidden">
                  <option value="">Pilih Tenant...</option>
                  {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Router *</label>
                <select value={applyRouterId} onChange={(e) => setApplyRouterId(e.target.value)} className="h-9 w-full rounded-lg border border-border/40 bg-background px-3 text-sm focus:outline-hidden">
                  <option value="">Pilih Router...</option>
                  {routers.map(r => <option key={r.id} value={r.id}>{r.name} ({r.host})</option>)}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowApplyModal(false)} className="rounded-lg border border-border/40 px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-secondary transition-colors">Batal</button>
                <button onClick={handleApply} disabled={submitting} className="rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Terapkan Template'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---- Delete Dialog ---- */}
      {showDeleteDialog && deletingTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs" onClick={() => setShowDeleteDialog(false)}>
          <div className="w-full max-w-sm rounded-xl border border-border/40 bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-foreground mb-2">Hapus Template</h3>
            <p className="text-sm text-muted-foreground mb-5">
              Apakah Anda yakin ingin menghapus template <strong className="text-foreground">&quot;{deletingTemplate.name}&quot;</strong>?
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowDeleteDialog(false)} className="rounded-lg border border-border/40 px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-secondary transition-colors">Batal</button>
              <button onClick={onDelete} disabled={submitting} className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-50 transition-colors">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---- Detail & Preview Modal ---- */}
      {showDetail && detailTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs overflow-y-auto p-4" onClick={() => setShowDetail(false)}>
          <div className="w-full max-w-lg rounded-xl border border-border/40 bg-card p-6 shadow-xl my-8 animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5 border-b border-border/20 pb-3">
              <div>
                <h3 className="text-lg font-bold text-foreground">Preview Template</h3>
                <span className="text-xs text-muted-foreground">ID: {detailTemplate.id}</span>
              </div>
              <button onClick={() => setShowDetail(false)} className="rounded-md p-1 hover:bg-secondary text-muted-foreground"><X className="h-4 w-4" /></button>
            </div>

            <div className="space-y-5">
              {/* General Information */}
              <div className="space-y-2">
                <h4 className="text-xs font-extrabold text-primary uppercase tracking-wider">General Information</h4>
                <div className="grid gap-2 border border-border/20 bg-transparent p-3 rounded-lg text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Nama Template</span>
                    <span className="font-bold text-foreground">{detailTemplate.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Deskripsi</span>
                    <span className="text-foreground truncate max-w-[250px]">{detailTemplate.description || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <span className="font-semibold text-foreground">{detailTemplate.status}</span>
                  </div>
                </div>
              </div>

              {/* Network Configuration */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-amber-500">
                  <Network className="h-4 w-4" />
                  <h4 className="text-xs font-extrabold uppercase tracking-wider">Network Configuration</h4>
                </div>
                <div className="grid gap-2 border border-border/20 bg-transparent p-3 rounded-lg text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Default VLAN ID</span>
                    <span className="font-mono text-foreground font-semibold">{detailTemplate.defaultVlanId || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Default VRF Name</span>
                    <span className="font-mono text-foreground font-semibold">{detailTemplate.defaultVrfName || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Default Subnet</span>
                    <span className="font-mono text-foreground font-semibold">{detailTemplate.defaultSubnet || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Default Gateway</span>
                    <span className="font-mono text-foreground font-semibold">{detailTemplate.defaultGateway || '-'}</span>
                  </div>
                </div>
              </div>

              {/* QoS Configuration */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-blue-500">
                  <Sliders className="h-4 w-4" />
                  <h4 className="text-xs font-extrabold uppercase tracking-wider">QoS Configuration</h4>
                </div>
                <div className="grid gap-2 border border-border/20 bg-transparent p-3 rounded-lg text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Default Bandwidth Limit</span>
                    <span className="font-mono text-foreground font-semibold">{detailTemplate.defaultBandwidth || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">QoS Profile</span>
                    <span className="text-foreground capitalize">{detailTemplate.qosProfile || 'standard'}</span>
                  </div>
                </div>
              </div>

              {/* Firewall Configuration */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-emerald-500">
                  <Shield className="h-4 w-4" />
                  <h4 className="text-xs font-extrabold uppercase tracking-wider">Firewall Configuration</h4>
                </div>
                <div className="grid gap-2 border border-border/20 bg-transparent p-3 rounded-lg text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Firewall Profile</span>
                    <span className="text-foreground capitalize">{detailTemplate.firewallProfile || 'standard'}</span>
                  </div>
                </div>
              </div>

              {/* RouterOS Script Script */}
              <div className="space-y-2">
                <h4 className="text-xs font-extrabold text-muted-foreground uppercase tracking-widest">RouterOS Script Code</h4>
                <pre className="p-3 bg-black/90 rounded-lg text-[10px] font-mono text-emerald-400 overflow-x-auto border border-border/30 max-h-[150px]">
                  {detailTemplate.content}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
