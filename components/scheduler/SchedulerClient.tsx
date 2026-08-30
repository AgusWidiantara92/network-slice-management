'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { schedulerSchema, type SchedulerFormData } from '@/validators/scheduler.schema';
import {
  Calendar, Plus, Search, Edit, Trash2, Eye, Play, Power, PowerOff,
  ChevronLeft, ChevronRight, ArrowUpDown, Inbox, Loader2, X, Clock, HelpCircle
} from 'lucide-react';
import { formatDate } from '@/utils/helpers';

interface SchedulerRow {
  id: string;
  name: string;
  description: string | null;
  expression: string | null;
  action: string;
  payload: string | null;
  status: string;
  tenantId: string | null;
  routerId: string | null;
  sliceId: string | null;
  repeatType: string;
  executionTime: string | null;
  lastRun: string | null;
  nextRun: string | null;
  createdAt: string;
  updatedAt: string;
  tenant: { name: string } | null;
  router: { name: string } | null;
  slice: { name: string } | null;
}

interface TenantOption {
  id: string;
  name: string;
}

interface RouterOption {
  id: string;
  name: string;
}

interface SliceOption {
  id: string;
  name: string;
  tenantId: string | null;
}

interface AuditLogRow {
  id: string;
  createdAt: string;
  action: string;
  description: string;
  status: string;
}

export default function SchedulerClient() {
  const [schedulers, setSchedulers] = useState<SchedulerRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  
  // Filters
  const [search, setSearch] = useState('');
  const [tenantFilter, setTenantFilter] = useState('');
  const [routerFilter, setRouterFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [repeatFilter, setRepeatFilter] = useState('');
  
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Options
  const [tenants, setTenants] = useState<TenantOption[]>([]);
  const [routers, setRouters] = useState<RouterOption[]>([]);
  const [slices, setSlices] = useState<SliceOption[]>([]);

  // Modals
  const [showForm, setShowForm] = useState(false);
  const [editingScheduler, setEditingScheduler] = useState<SchedulerRow | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingScheduler, setDeletingScheduler] = useState<SchedulerRow | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailScheduler, setDetailScheduler] = useState<SchedulerRow | null>(null);
  
  // Running stats and loading states
  const [submitting, setSubmitting] = useState(false);
  const [runningManualId, setRunningManualId] = useState<string | null>(null);
  const [executionHistory, setExecutionHistory] = useState<AuditLogRow[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<SchedulerFormData>({
    resolver: zodResolver(schedulerSchema),
    defaultValues: {
      name: '',
      description: '',
      tenantId: '',
      routerId: '',
      sliceId: '',
      action: 'DEPLOY_CONFIG',
      repeatType: 'ONE_TIME',
      executionTime: '',
      expression: '',
      status: 'SCHEDULED',
    },
  });

  const selectedTenantId = watch('tenantId');
  const selectedRepeatType = watch('repeatType');

  // Trigger Toast
  const triggerToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
  };

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  // Fetch Options
  const fetchOptions = async () => {
    try {
      const [tenantsRes, routersRes, slicesRes] = await Promise.all([
        fetch('/api/tenant?limit=100'),
        fetch('/api/router?limit=100'),
        fetch('/api/network-slice?limit=200'),
      ]);
      const tenantsJson = await tenantsRes.json();
      const routersJson = await routersRes.json();
      const slicesJson = await slicesRes.json();

      if (tenantsJson.success) setTenants(tenantsJson.data);
      if (routersJson.success) setRouters(routersJson.data);
      if (slicesJson.success) setSlices(slicesJson.data);
    } catch (err) {
      console.error('Gagal mengambil opsi data:', err);
    }
  };

  // Fetch Schedulers List
  const fetchSchedulers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (tenantFilter) params.set('tenantId', tenantFilter);
      if (routerFilter) params.set('routerId', routerFilter);
      if (statusFilter) params.set('status', statusFilter);
      if (repeatFilter) params.set('repeatType', repeatFilter);
      params.set('sortBy', sortBy);
      params.set('sortOrder', sortOrder);
      params.set('page', String(page));
      params.set('limit', String(limit));

      const res = await fetch(`/api/scheduler?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setSchedulers(json.data);
        setTotal(json.total);
      }
    } catch {
      triggerToast('error', 'Gagal memuat list scheduler.');
    } finally {
      setLoading(false);
    }
  }, [search, tenantFilter, routerFilter, statusFilter, repeatFilter, sortBy, sortOrder, page, limit]);

  useEffect(() => {
    fetchSchedulers();
  }, [fetchSchedulers]);

  useEffect(() => {
    fetchOptions();
  }, []);

  // Fetch execution history from audit logs
  const fetchExecutionHistory = async (scheduleName: string) => {
    setLoadingHistory(true);
    try {
      // Search audit logs matching scheduler name
      const res = await fetch(`/api/audit-log?limit=20&search=${encodeURIComponent(`jadwal "${scheduleName}"`)}`);
      const json = await res.json();
      if (json.success) {
        setExecutionHistory(json.data);
      }
    } catch (err) {
      console.error('Gagal mengambil history eksekusi:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Modal Open Handlers
  const openCreate = () => {
    setEditingScheduler(null);
    reset({
      name: '',
      description: '',
      tenantId: '',
      routerId: '',
      sliceId: '',
      action: 'DEPLOY_CONFIG',
      repeatType: 'ONE_TIME',
      executionTime: '',
      expression: '',
      status: 'SCHEDULED',
    });
    setShowForm(true);
  };

  const openEdit = (s: SchedulerRow) => {
    setEditingScheduler(s);
    setValue('name', s.name);
    setValue('description', s.description || '');
    setValue('tenantId', s.tenantId || '');
    setValue('routerId', s.routerId || '');
    setValue('sliceId', s.sliceId || '');
    setValue('action', s.action as any);
    setValue('repeatType', s.repeatType as any);
    setValue('executionTime', s.executionTime ? new Date(s.executionTime).toISOString().slice(0, 16) : '');
    setValue('expression', s.expression || '');
    setValue('status', s.status as any);
    setShowForm(true);
  };

  const openDelete = (s: SchedulerRow) => {
    setDeletingScheduler(s);
    setShowDeleteDialog(true);
  };

  const openDetail = (s: SchedulerRow) => {
    setDetailScheduler(s);
    setExecutionHistory([]);
    setShowDetailModal(true);
    fetchExecutionHistory(s.name);
  };

  // Form Submit Handler
  const onSubmit = async (data: SchedulerFormData) => {
    setSubmitting(true);
    try {
      const url = editingScheduler ? `/api/scheduler/${editingScheduler.id}` : '/api/scheduler';
      const method = editingScheduler ? 'PUT' : 'POST';
      const payload = {
        ...data,
        executionTime: data.executionTime ? new Date(data.executionTime).toISOString() : null,
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (json.success) {
        triggerToast('success', editingScheduler ? 'Jadwal berhasil diperbarui.' : 'Jadwal berhasil dibuat.');
        setShowForm(false);
        fetchSchedulers();
      } else {
        triggerToast('error', json.error || 'Terjadi kesalahan.');
      }
    } catch {
      triggerToast('error', 'Terjadi kesalahan jaringan.');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Handler
  const onDelete = async () => {
    if (!deletingScheduler) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/scheduler/${deletingScheduler.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        triggerToast('success', 'Jadwal berhasil dihapus.');
        setShowDeleteDialog(false);
        setDeletingScheduler(null);
        fetchSchedulers();
      } else {
        triggerToast('error', json.error || 'Gagal menghapus jadwal.');
      }
    } catch {
      triggerToast('error', 'Terjadi kesalahan jaringan.');
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle Enable / Disable Status
  const handleToggleStatus = async (s: SchedulerRow) => {
    const isEnabling = s.status !== 'SCHEDULED';
    const endpoint = isEnabling ? 'enable' : 'disable';
    try {
      const res = await fetch(`/api/scheduler/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: s.id }),
      });
      const json = await res.json();
      if (json.success) {
        triggerToast('success', isEnabling ? `Scheduler "${s.name}" berhasil diaktifkan.` : `Scheduler "${s.name}" berhasil dinonaktifkan.`);
        fetchSchedulers();
        if (detailScheduler && detailScheduler.id === s.id) {
          setDetailScheduler(json.data);
        }
      } else {
        triggerToast('error', json.error || 'Gagal mengubah status scheduler.');
      }
    } catch {
      triggerToast('error', 'Terjadi kesalahan jaringan.');
    }
  };

  // Manual Trigger: Run Now
  const handleRunNow = async (s: SchedulerRow) => {
    setRunningManualId(s.id);
    try {
      const res = await fetch('/api/scheduler/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: s.id }),
      });
      const json = await res.json();
      if (json.success) {
        triggerToast('success', `Eksekusi manual untuk "${s.name}" telah dimulai.`);
        fetchSchedulers();
        
        // Refresh details & history if currently viewed in detail modal
        if (detailScheduler && detailScheduler.id === s.id) {
          const freshRes = await fetch(`/api/scheduler/${s.id}`);
          const freshJson = await freshRes.json();
          if (freshJson.success) {
            setDetailScheduler(freshJson.data);
          }
          fetchExecutionHistory(s.name);
        }
      } else {
        triggerToast('error', json.error || 'Gagal mengeksekusi scheduler.');
      }
    } catch {
      triggerToast('error', 'Terjadi kesalahan jaringan.');
    } finally {
      setRunningManualId(null);
    }
  };

  const toggleSort = (col: string) => {
    if (sortBy === col) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(col);
      setSortOrder('desc');
    }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { bg: string, text: string, label: string }> = {
      DRAFT: { bg: 'bg-secondary border border-border', text: 'text-muted-foreground', label: 'Draft' },
      SCHEDULED: { bg: 'bg-blue-500/10 border-blue-500/20', text: 'text-blue-400', label: 'Scheduled' },
      RUNNING: { bg: 'bg-yellow-500/10 border-yellow-500/20', text: 'text-yellow-400', label: 'Running' },
      COMPLETED: { bg: 'bg-emerald-500/10 border-emerald-500/20', text: 'text-emerald-400', label: 'Completed' },
      FAILED: { bg: 'bg-rose-500/10 border-rose-500/20', text: 'text-rose-400', label: 'Failed' },
      CANCELLED: { bg: 'bg-amber-500/10 border-amber-500/20', text: 'text-amber-400', label: 'Cancelled' },
    };

    const s = map[status] || { bg: 'bg-secondary border border-border', text: 'text-muted-foreground', label: status };
    
    return (
      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${s.bg} ${s.text}`}>
        {status === 'RUNNING' && <Loader2 className="h-2.5 w-2.5 animate-spin mr-0.5" />}
        <span className={`h-1 w-1 rounded-full ${
          status === 'COMPLETED' ? 'bg-emerald-400' :
          status === 'FAILED' ? 'bg-rose-400' :
          status === 'RUNNING' ? 'bg-yellow-400' :
          status === 'SCHEDULED' ? 'bg-blue-400' :
          status === 'CANCELLED' ? 'bg-amber-400' : 'bg-neutral-400'
        }`} />
        {s.label}
      </span>
    );
  };

  const getActionLabel = (act: string) => {
    const map: Record<string, string> = {
      DEPLOY_CONFIG: 'Deploy Configuration',
      UPDATE_CONFIG: 'Update Configuration',
      DELETE_CONFIG: 'Delete Configuration',
      ROLLBACK_CONFIG: 'Rollback Configuration',
    };
    return map[act] || act;
  };

  const getRepeatLabel = (rep: string) => {
    const map: Record<string, string> = {
      ONE_TIME: 'One Time',
      DAILY: 'Daily',
      WEEKLY: 'Weekly',
      MONTHLY: 'Monthly',
      CUSTOM: 'Custom Cron',
    };
    return map[rep] || rep;
  };

  // Filter slice options based on selected tenant in form
  const filteredSlices = slices.filter(s => s.tenantId === selectedTenantId);
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
            <Calendar className="h-7 w-7 text-primary" /> Scheduler Automasi
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Jadwalkan eksekusi berkala atau satu kali untuk orkestrasi konfigurasi router MikroTik.
          </p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-xs hover:bg-primary/90 transition-colors">
          <Plus className="h-4 w-4" /> Tambah Jadwal
        </button>
      </div>

      {/* Filters */}
      <Card className="border border-border/40 bg-card/60 backdrop-blur-xs shadow-xs">
        <CardContent className="p-4">
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-5">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text" placeholder="Cari nama jadwal..." value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="h-9 w-full rounded-lg border border-border/40 bg-background pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:border-primary/50 focus:outline-hidden"
              />
            </div>

            {/* Tenant Filter */}
            <select
              value={tenantFilter} onChange={(e) => { setTenantFilter(e.target.value); setPage(1); }}
              className="h-9 rounded-lg border border-border/40 bg-background px-3 text-sm text-foreground focus:border-primary/50 focus:outline-hidden"
            >
              <option value="">Semua Tenant</option>
              {tenants.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>

            {/* Router Filter */}
            <select
              value={routerFilter} onChange={(e) => { setRouterFilter(e.target.value); setPage(1); }}
              className="h-9 rounded-lg border border-border/40 bg-background px-3 text-sm text-foreground focus:border-primary/50 focus:outline-hidden"
            >
              <option value="">Semua Router</option>
              {routers.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="h-9 rounded-lg border border-border/40 bg-background px-3 text-sm text-foreground focus:border-primary/50 focus:outline-hidden"
            >
              <option value="">Semua Status</option>
              <option value="DRAFT">Draft</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="RUNNING">Running</option>
              <option value="COMPLETED">Completed</option>
              <option value="FAILED">Failed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>

            {/* Repeat Type Filter */}
            <select
              value={repeatFilter} onChange={(e) => { setRepeatFilter(e.target.value); setPage(1); }}
              className="h-9 rounded-lg border border-border/40 bg-background px-3 text-sm text-foreground focus:border-primary/50 focus:outline-hidden"
            >
              <option value="">Semua Pengulangan</option>
              <option value="ONE_TIME">One Time</option>
              <option value="DAILY">Daily</option>
              <option value="WEEKLY">Weekly</option>
              <option value="MONTHLY">Monthly</option>
              <option value="CUSTOM">Custom Cron</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Schedulers Table */}
      <Card className="overflow-hidden border border-border/40 bg-card/60 backdrop-blur-xs shadow-xs">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="ml-2 text-sm text-muted-foreground">Memuat data schedules...</span>
            </div>
          ) : schedulers.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-muted-foreground">
              <Inbox className="h-10 w-10 text-muted-foreground/60" />
              <p className="text-sm font-medium">Belum ada jadwal terdaftar.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-transparent">
                  <TableRow className="border-b border-border/30 hover:bg-transparent">
                    <TableHead className="text-xs font-semibold text-muted-foreground cursor-pointer" onClick={() => toggleSort('name')}>
                      <span className="flex items-center gap-1">Nama Jadwal <ArrowUpDown className="h-3 w-3" /></span>
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground">Tenant</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground">Network Slice</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground">Router</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground">Jenis Aksi</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground">Repeat</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground">Status</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground">Next Run</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground text-center">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schedulers.map((s) => (
                    <TableRow key={s.id} className="border-b border-border/20 hover:bg-secondary/40">
                      <TableCell className="text-xs font-bold text-foreground max-w-[150px] truncate" title={s.name}>{s.name}</TableCell>
                      <TableCell className="text-xs font-semibold text-foreground">{s.tenant?.name || '-'}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{s.slice?.name || '-'}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{s.router?.name || '-'}</TableCell>
                      <TableCell className="text-xs font-medium text-foreground whitespace-nowrap">{getActionLabel(s.action)}</TableCell>
                      <TableCell className="text-xs font-medium text-foreground whitespace-nowrap">{getRepeatLabel(s.repeatType)}</TableCell>
                      <TableCell>{getStatusBadge(s.status)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {s.nextRun ? formatDate(new Date(s.nextRun)) : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          {/* Run Manual */}
                          <button
                            onClick={() => handleRunNow(s)}
                            disabled={runningManualId !== null || s.status === 'RUNNING'}
                            className="rounded-md p-1.5 text-muted-foreground hover:text-emerald-400 hover:bg-emerald-500/10 disabled:opacity-30 transition-colors"
                            title="Jalankan Sekarang"
                          >
                            {runningManualId === s.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Play className="h-3.5 w-3.5" />
                            )}
                          </button>
                          
                          {/* Toggle Status */}
                          <button
                            onClick={() => handleToggleStatus(s)}
                            className={`rounded-md p-1.5 transition-colors ${
                              s.status === 'SCHEDULED'
                                ? 'text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10'
                                : 'text-muted-foreground hover:text-sky-400 hover:bg-sky-500/10'
                            }`}
                            title={s.status === 'SCHEDULED' ? 'Nonaktifkan' : 'Aktifkan'}
                          >
                            {s.status === 'SCHEDULED' ? (
                              <PowerOff className="h-3.5 w-3.5" />
                            ) : (
                              <Power className="h-3.5 w-3.5" />
                            )}
                          </button>

                          {/* Details */}
                          <button onClick={() => openDetail(s)} className="rounded-md p-1.5 text-muted-foreground hover:text-sky-400 hover:bg-sky-500/10 transition-colors" title="Rincian Detail">
                            <Eye className="h-3.5 w-3.5" />
                          </button>

                          {/* Edit */}
                          <button onClick={() => openEdit(s)} className="rounded-md p-1.5 text-muted-foreground hover:text-amber-400 hover:bg-amber-500/10 transition-colors" title="Edit">
                            <Edit className="h-3.5 w-3.5" />
                          </button>

                          {/* Delete */}
                          <button onClick={() => openDelete(s)} className="rounded-md p-1.5 text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 transition-colors" title="Hapus">
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
              Menampilkan {((page - 1) * limit) + 1}-{Math.min(page * limit, total)} dari {total} jadwal
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
          <div className="w-full max-w-lg rounded-xl border border-border/40 bg-card p-6 shadow-xl my-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-foreground">{editingScheduler ? 'Edit Jadwal Scheduler' : 'Tambah Jadwal Baru'}</h3>
              <button onClick={() => setShowForm(false)} className="rounded-md p-1 hover:bg-secondary text-muted-foreground"><X className="h-4 w-4" /></button>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Nama Jadwal <span className="text-rose-400">*</span></label>
                <input {...register('name')} className="h-9 w-full rounded-lg border border-border/40 bg-background px-3 text-sm focus:border-primary/50 focus:outline-hidden" placeholder="Contoh: Backup Slice Mingguan" />
                {errors.name && <p className="text-[10px] text-rose-400">{errors.name.message}</p>}
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Deskripsi</label>
                <textarea {...register('description')} rows={2} className="w-full rounded-lg border border-border/40 bg-background p-3 text-sm focus:border-primary/50 focus:outline-hidden resize-none" placeholder="Masukkan deskripsi opsional..." />
              </div>

              {/* Tenant */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Tenant <span className="text-rose-400">*</span></label>
                <select {...register('tenantId')} className="h-9 w-full rounded-lg border border-border/40 bg-background px-3 text-sm text-foreground focus:border-primary/50 focus:outline-hidden">
                  <option value="">Pilih Tenant...</option>
                  {tenants.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
                {errors.tenantId && <p className="text-[10px] text-rose-400">{errors.tenantId.message}</p>}
              </div>

              {/* Router & Network Slice Group */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Router <span className="text-rose-400">*</span></label>
                  <select {...register('routerId')} className="h-9 w-full rounded-lg border border-border/40 bg-background px-3 text-sm text-foreground focus:border-primary/50 focus:outline-hidden">
                    <option value="">Pilih Router...</option>
                    {routers.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                  {errors.routerId && <p className="text-[10px] text-rose-400">{errors.routerId.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Network Slice <span className="text-rose-400">*</span></label>
                  <select {...register('sliceId')} disabled={!selectedTenantId} className="h-9 w-full rounded-lg border border-border/40 bg-background px-3 text-sm text-foreground focus:border-primary/50 focus:outline-hidden disabled:opacity-40">
                    <option value="">Pilih Slice...</option>
                    {filteredSlices.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                  {errors.sliceId && <p className="text-[10px] text-rose-400">{errors.sliceId.message}</p>}
                  {!selectedTenantId && <p className="text-[9px] text-muted-foreground">Pilih tenant terlebih dahulu untuk melihat network slices.</p>}
                </div>
              </div>

              {/* Action Type */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Aksi Eksekusi <span className="text-rose-400">*</span></label>
                <select {...register('action')} className="h-9 w-full rounded-lg border border-border/40 bg-background px-3 text-sm text-foreground focus:border-primary/50 focus:outline-hidden">
                  <option value="DEPLOY_CONFIG">Deploy Configuration</option>
                  <option value="UPDATE_CONFIG">Update Configuration</option>
                  <option value="DELETE_CONFIG">Delete Configuration</option>
                  <option value="ROLLBACK_CONFIG">Rollback Configuration</option>
                </select>
                {errors.action && <p className="text-[10px] text-rose-400">{errors.action.message}</p>}
              </div>

              {/* Repeat Type & Execution Date/Time / Cron expression */}
              <div className="grid grid-cols-2 gap-4 border-t border-border/20 pt-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Repeat Type <span className="text-rose-400">*</span></label>
                  <select {...register('repeatType')} className="h-9 w-full rounded-lg border border-border/40 bg-background px-3 text-sm text-foreground focus:border-primary/50 focus:outline-hidden">
                    <option value="ONE_TIME">One Time (Sekali Eksekusi)</option>
                    <option value="DAILY">Daily (Harian)</option>
                    <option value="WEEKLY">Weekly (Mingguan)</option>
                    <option value="MONTHLY">Monthly (Bulanan)</option>
                    <option value="CUSTOM">Custom Cron Expression</option>
                  </select>
                  {errors.repeatType && <p className="text-[10px] text-rose-400">{errors.repeatType.message}</p>}
                </div>

                <div className="space-y-1.5">
                  {selectedRepeatType === 'CUSTOM' ? (
                    <>
                      <label className="text-xs font-semibold text-foreground">Cron Expression <span className="text-rose-400">*</span></label>
                      <input {...register('expression')} className="h-9 w-full rounded-lg border border-border/40 bg-background px-3 text-sm focus:border-primary/50 focus:outline-hidden" placeholder="Contoh: */5 * * * *" />
                      {errors.expression && <p className="text-[10px] text-rose-400">{errors.expression.message}</p>}
                    </>
                  ) : (
                    <>
                      <label className="text-xs font-semibold text-foreground">
                        Waktu Eksekusi <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="datetime-local"
                        {...register('executionTime')}
                        className="h-9 w-full rounded-lg border border-border/40 bg-background px-3 text-sm text-foreground focus:border-primary/50 focus:outline-hidden"
                      />
                      {errors.executionTime && <p className="text-[10px] text-rose-400">{errors.executionTime.message}</p>}
                    </>
                  )}
                </div>
              </div>

              {/* Status (Optional, defaults to Scheduled) */}
              {!editingScheduler && (
                <div className="space-y-1.5 pt-2">
                  <label className="text-xs font-semibold text-foreground">Status Awal</label>
                  <select {...register('status')} className="h-9 w-full rounded-lg border border-border/40 bg-background px-3 text-sm text-foreground focus:border-primary/50 focus:outline-hidden">
                    <option value="SCHEDULED">Scheduled (Aktif Langsung)</option>
                    <option value="DRAFT">Draft (Disimpan Saja)</option>
                  </select>
                </div>
              )}

              {/* Buttons */}
              <div className="flex justify-end gap-2 pt-4 border-t border-border/20">
                <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-border/40 px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-secondary transition-colors">Batal</button>
                <button type="submit" disabled={submitting} className="rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center gap-1.5">
                  {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {editingScheduler ? 'Simpan Perubahan' : 'Buat Jadwal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---- Delete Dialog ---- */}
      {showDeleteDialog && deletingScheduler && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs" onClick={() => setShowDeleteDialog(false)}>
          <div className="w-full max-w-sm rounded-xl border border-border/40 bg-card p-6 shadow-xl animate-scale-up" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-foreground mb-2 flex items-center gap-2 text-rose-400"><Trash2 className="h-5 w-5" /> Hapus Jadwal</h3>
            <p className="text-sm text-muted-foreground mb-5">
              Apakah Anda yakin ingin menghapus jadwal scheduler <strong className="text-foreground">&quot;{deletingScheduler.name}&quot;</strong>? Tindakan ini akan menghapus schedule dari database.
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowDeleteDialog(false)} className="rounded-lg border border-border/40 px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-secondary transition-colors" disabled={submitting}>Batal</button>
              <button onClick={onDelete} disabled={submitting} className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-50 transition-colors">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---- Detail Drawer / Modal ---- */}
      {showDetailModal && detailScheduler && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs overflow-y-auto p-4" onClick={() => setShowDetailModal(false)}>
          <div className="w-full max-w-xl rounded-xl border border-border/30 bg-card p-6 shadow-2xl my-8 animate-scale-up" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between mb-5 border-b border-border/20 pb-3">
              <div>
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" /> Rincian Detail Scheduler
                </h3>
                <span className="text-[10px] text-muted-foreground">ID: {detailScheduler.id}</span>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="rounded-md p-1 hover:bg-secondary text-muted-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Content Body */}
            <div className="grid gap-4 md:grid-cols-2">
              {/* Left Column: Properties */}
              <div className="space-y-3.5 border-r border-border/10 pr-4">
                <div>
                  <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Nama Jadwal</h4>
                  <p className="text-sm font-bold text-foreground leading-tight mt-0.5">{detailScheduler.name}</p>
                </div>

                <div>
                  <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Deskripsi</h4>
                  <p className="text-xs text-foreground leading-relaxed mt-0.5">{detailScheduler.description || '-'}</p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Target Tenant</h4>
                    <p className="text-xs font-semibold text-foreground mt-0.5">{detailScheduler.tenant?.name || '-'}</p>
                  </div>
                  <div>
                    <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Target Slice</h4>
                    <p className="text-xs font-semibold text-foreground mt-0.5">{detailScheduler.slice?.name || '-'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Target Router</h4>
                    <p className="text-xs font-semibold text-foreground mt-0.5">{detailScheduler.router?.name || '-'}</p>
                  </div>
                  <div>
                    <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Aksi Eksekusi</h4>
                    <p className="text-xs font-semibold text-primary mt-0.5">{getActionLabel(detailScheduler.action)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Tipe Pengulangan</h4>
                    <p className="text-xs font-semibold text-foreground mt-0.5">{getRepeatLabel(detailScheduler.repeatType)}</p>
                  </div>
                  <div>
                    <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Status Jadwal</h4>
                    <div className="mt-0.5">{getStatusBadge(detailScheduler.status)}</div>
                  </div>
                </div>

                {detailScheduler.repeatType === 'CUSTOM' && (
                  <div>
                    <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Cron Expression</h4>
                    <code className="text-[10px] font-mono bg-secondary px-2 py-0.5 rounded border border-border/20 text-foreground block mt-0.5 w-fit">
                      {detailScheduler.expression}
                    </code>
                  </div>
                )}
              </div>

              {/* Right Column: Running history and executions */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-secondary p-2.5 rounded-lg border border-border/20">
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-semibold">
                      <Clock className="h-3 w-3 text-muted-foreground" /> TERAKHIR DIJALANKAN
                    </span>
                    <span className="text-[11px] font-bold text-foreground block mt-1">
                      {detailScheduler.lastRun ? formatDate(new Date(detailScheduler.lastRun)) : 'Belum pernah'}
                    </span>
                  </div>

                  <div className="bg-secondary p-2.5 rounded-lg border border-border/20">
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-semibold">
                      <Clock className="h-3 w-3 text-primary" /> JADWAL BERIKUTNYA
                    </span>
                    <span className="text-[11px] font-bold text-primary block mt-1">
                      {detailScheduler.nextRun ? formatDate(new Date(detailScheduler.nextRun)) : 'Tidak aktif'}
                    </span>
                  </div>
                </div>

                {/* Execution History */}
                <div>
                  <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Riwayat Eksekusi</h4>
                  <div className="rounded-lg border border-border/30 bg-secondary p-2 max-h-[160px] overflow-y-auto space-y-2 custom-scrollbar">
                    {loadingHistory ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-4 w-4 animate-spin text-primary mr-2" />
                        <span className="text-[11px] text-muted-foreground">Memuat riwayat...</span>
                      </div>
                    ) : executionHistory.length === 0 ? (
                      <div className="text-center py-8 text-[11px] text-muted-foreground">
                        Belum ada riwayat aktivitas untuk scheduler ini.
                      </div>
                    ) : (
                      <div className="space-y-2 pl-2 border-l border-border/30">
                        {executionHistory.map((hist) => (
                          <div key={hist.id} className="text-[10px] space-y-0.5 relative">
                            {/* status dot */}
                            <span className={`absolute -left-[13px] top-1.5 h-1.5 w-1.5 rounded-full ${
                              hist.status === 'SUCCESS' ? 'bg-emerald-400' : 'bg-rose-400'
                            }`} />
                            <div className="flex justify-between font-bold text-foreground">
                              <span>{hist.status === 'SUCCESS' ? 'Eksekusi Berhasil' : 'Eksekusi Gagal'}</span>
                              <span className="text-muted-foreground font-normal">{new Date(hist.createdAt).toLocaleDateString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <p className="text-muted-foreground max-w-[200px] truncate" title={hist.description}>
                              {hist.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Operations */}
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => handleRunNow(detailScheduler)}
                    disabled={runningManualId !== null || detailScheduler.status === 'RUNNING'}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-3 py-2 text-xs font-bold text-white shadow-xs transition-colors"
                  >
                    {runningManualId === detailScheduler.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Play className="h-3.5 w-3.5" />
                    )}
                    Run Now
                  </button>
                  <button
                    onClick={() => handleToggleStatus(detailScheduler)}
                    className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-bold transition-all ${
                      detailScheduler.status === 'SCHEDULED'
                        ? 'border-rose-500/20 bg-rose-500/10 text-rose-400 hover:bg-rose-500/25'
                        : 'border-sky-500/20 bg-sky-500/10 text-sky-400 hover:bg-sky-500/25'
                    }`}
                  >
                    {detailScheduler.status === 'SCHEDULED' ? (
                      <>
                        <PowerOff className="h-3.5 w-3.5" />
                        Deactivate
                      </>
                    ) : (
                      <>
                        <Power className="h-3.5 w-3.5" />
                        Activate
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Footer buttons */}
            <div className="flex justify-end gap-2 pt-4 border-t border-border/20 mt-5">
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  openEdit(detailScheduler);
                }}
                className="rounded-lg border border-border/40 px-4 py-2 text-xs font-bold text-amber-400 hover:bg-amber-500/10 transition-colors"
              >
                Edit Jadwal
              </button>
              <button
                onClick={() => setShowDetailModal(false)}
                className="rounded-lg bg-secondary px-4 py-2 text-xs font-semibold text-foreground hover:bg-stone-200 transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
