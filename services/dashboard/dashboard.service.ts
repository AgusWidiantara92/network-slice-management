import { tenantRepository } from '@/repositories/tenant.repository';
import { routerRepository } from '@/repositories/router.repository';
import { sliceRepository } from '@/repositories/slice.repository';
import { templateRepository } from '@/repositories/template.repository';
import { auditLogRepository } from '@/repositories/audit-log.repository';
import { schedulerRepository } from '@/repositories/scheduler.repository';
import { prisma } from '@/lib/prisma';

// ---- Type Definitions ----

export interface DashboardStats {
  totalTenant: number;
  totalRouter: number;
  routerOnline: number;
  routerOffline: number;
  totalSlice: number;
  totalTemplate: number;
}

export interface TenantGrowthPoint {
  name: string;
  value: number;
}

export interface RouterStatusPoint {
  name: string;
  value: number;
  color: string;
}

export interface SliceBandwidthPoint {
  name: string;
  Tx: number;
  Rx: number;
}

export interface QosUsagePoint {
  name: string;
  Upload: number;
  Download: number;
}

export interface RecentActivity {
  id: string;
  time: string;
  user: string;
  action: string;
  router: string;
  status: 'SUCCESS' | 'FAILED';
}

export interface SystemHealthData {
  dbStatus: 'GREEN' | 'YELLOW' | 'RED';
  routerApiStatus: 'GREEN' | 'YELLOW' | 'RED';
  llmProviderStatus: 'GREEN' | 'YELLOW' | 'RED';
  schedulerStatus: 'GREEN' | 'YELLOW' | 'RED';
}

export interface DashboardSummaryData {
  totalVlan: number;
  totalVrf: number;
  totalFirewall: number;
  totalQos: number;
  totalSchedulerActive: number;
}

export interface RouterMonitorPoint {
  id: string;
  name: string;
  host: string;
  status: 'CONNECTED' | 'DISCONNECTED' | 'ERROR';
  cpu: number;
  memory: number;
  uptime: string;
  lastSync: string;
}

export interface DashboardData {
  stats: DashboardStats;
  tenantGrowth: TenantGrowthPoint[];
  routerStatus: RouterStatusPoint[];
  sliceBandwidth: SliceBandwidthPoint[];
  qosUsage: QosUsagePoint[];
  recentActivities: RecentActivity[];
  systemHealth: SystemHealthData;
  summary: DashboardSummaryData;
  routersMon: RouterMonitorPoint[];
}

// ---- Month Name Helper ----

const MONTH_NAMES: Record<string, string> = {
  '01': 'Jan', '02': 'Feb', '03': 'Mar', '04': 'Apr',
  '05': 'Mei', '06': 'Jun', '07': 'Jul', '08': 'Ags',
  '09': 'Sep', '10': 'Okt', '11': 'Nov', '12': 'Des',
};

function formatMonthLabel(yyyyMm: string): string {
  const parts = yyyyMm.split('-');
  if (parts.length === 2) {
    const monthName = MONTH_NAMES[parts[1]] || parts[1];
    return `${monthName} ${parts[0].slice(2)}`;
  }
  return yyyyMm;
}

// ---- Service ----

export class DashboardService {
  /**
   * Fetch all dashboard data in parallel using Promise.all().
   */
  async getDashboardData(): Promise<DashboardData> {
    const [
      totalTenant,
      totalRouter,
      routerOnline,
      routerOffline,
      totalSlice,
      totalTemplate,
      tenantByMonth,
      routerGroups,
      sliceByTenant,
      recentLogs,
      activeSchedulerCount,
      allRouters,
      allSlices,
      activeLlmProvider,
    ] = await Promise.all([
      tenantRepository.count(),
      routerRepository.count(),
      routerRepository.countByStatus('CONNECTED'),
      routerRepository.countByStatus('DISCONNECTED'),
      sliceRepository.count(),
      templateRepository.count(),
      tenantRepository.countByMonth(),
      routerRepository.groupByStatus(),
      sliceRepository.countByTenant(),
      auditLogRepository.findRecent(10),
      schedulerRepository.countActive(),
      routerRepository.findAll(),
      prisma.networkSlice.findMany(),
      prisma.lLMProvider.findFirst({ where: { isActive: true } }),
    ]);

    // ---- Stats ----
    const stats: DashboardStats = {
      totalTenant,
      totalRouter,
      routerOnline,
      routerOffline,
      totalSlice,
      totalTemplate,
    };

    // ---- Tenant Growth Chart (Line) ----
    const tenantGrowth: TenantGrowthPoint[] = tenantByMonth.map((row) => ({
      name: formatMonthLabel(row.month),
      value: row.count,
    }));

    if (tenantGrowth.length === 0 && totalTenant > 0) {
      const now = new Date();
      const key = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      tenantGrowth.push({ name: formatMonthLabel(key), value: totalTenant });
    }

    // ---- Router Status Chart (Pie) ----
    const statusColorMap: Record<string, string> = {
      CONNECTED: '#10b981',
      DISCONNECTED: '#f43f5e',
      ERROR: '#f59e0b',
    };
    const statusLabelMap: Record<string, string> = {
      CONNECTED: 'Online',
      DISCONNECTED: 'Offline',
      ERROR: 'Error',
    };

    const routerStatus: RouterStatusPoint[] = ['CONNECTED', 'DISCONNECTED', 'ERROR'].map((s) => {
      const found = routerGroups.find((g) => g.status === s);
      return {
        name: statusLabelMap[s] || s,
        value: found ? found._count : 0,
        color: statusColorMap[s] || '#888888',
      };
    });

    // ---- Slice Bandwidth Chart (Bar) ----
    const sliceBandwidth: SliceBandwidthPoint[] = sliceByTenant.map((row) => ({
      name: row.tenantName,
      Tx: row.totalTx,
      Rx: row.totalRx,
    }));

    // ---- QoS Usage ----
    const qosUsage: QosUsagePoint[] = sliceByTenant.map((row) => ({
      name: row.tenantName,
      Upload: row.totalTx,
      Download: row.totalRx,
    }));

    // ---- Recent Activities ----
    const recentActivities: RecentActivity[] = recentLogs.map((log) => ({
      id: log.id,
      time: log.createdAt.toISOString(),
      user: log.admin?.email || log.userEmail || 'System',
      action: log.description,
      router: log.router?.name || '-',
      status: log.status as 'SUCCESS' | 'FAILED',
    }));

    // ---- System Health Widget ----
    // DB is online since we reached here successfully
    const dbStatus = 'GREEN';
    
    // Router API Status: RED if all routers are offline, YELLOW if some simulation/error, GREEN if all online
    let routerApiStatus: 'GREEN' | 'YELLOW' | 'RED' = 'GREEN';
    if (totalRouter === 0) {
      routerApiStatus = 'YELLOW';
    } else if (routerOnline === 0) {
      routerApiStatus = 'RED';
    } else if (routerOffline > 0) {
      routerApiStatus = 'YELLOW';
    }

    // LLM Provider Status: GREEN if an active LLM provider is found, otherwise RED
    const llmProviderStatus = activeLlmProvider ? 'GREEN' : 'RED';

    // Scheduler Status: GREEN if scheduler running or active. If database is fine, let's mark it GREEN
    const schedulerStatus = activeSchedulerCount > 0 ? 'GREEN' : 'YELLOW';

    const systemHealth: SystemHealthData = {
      dbStatus,
      routerApiStatus,
      llmProviderStatus,
      schedulerStatus,
    };

    // ---- Dashboard Summary Widget ----
    const totalVlan = allSlices.filter((s) => s.vlanId !== null).length;
    const totalVrf = 0; // Simulated/Mock VRF
    const totalFirewall = allSlices.filter((s) => s.isolated).length;
    const totalQos = allSlices.length; // Each slice has a QoS queue
    const totalSchedulerActive = activeSchedulerCount;

    const summary: DashboardSummaryData = {
      totalVlan,
      totalVrf,
      totalFirewall,
      totalQos,
      totalSchedulerActive,
    };

    // ---- Router Monitoring Widget ----
    const routersMon: RouterMonitorPoint[] = allRouters.map((router) => {
      const isOnline = router.status === 'CONNECTED';
      // Simulate real-time stats for display
      const cpu = isOnline ? Math.floor(Math.random() * 25) + 3 : 0; // 3-28%
      const memory = isOnline ? Math.floor(Math.random() * 30) + 15 : 0; // 15-45%
      const uptime = isOnline ? '5d 14h 23m' : '-';
      const lastSync = isOnline ? new Date().toLocaleTimeString('id-ID') : '-';

      return {
        id: router.id,
        name: router.name,
        host: router.host,
        status: router.status as 'CONNECTED' | 'DISCONNECTED' | 'ERROR',
        cpu,
        memory,
        uptime,
        lastSync,
      };
    });

    return {
      stats,
      tenantGrowth,
      routerStatus,
      sliceBandwidth,
      qosUsage,
      recentActivities,
      systemHealth,
      summary,
      routersMon,
    };
  }
}

export const dashboardService = new DashboardService();
