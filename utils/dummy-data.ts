export interface StatItem {
  title: string;
  value: number;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  desc: string;
  color: string;
  iconName: string;
}

export interface ChartDataPoint {
  name: string;
  value: number;
  [key: string]: number | string;
}

export interface ActivityLog {
  id: string;
  time: string;
  user: string;
  action: string;
  router: string;
  status: 'SUCCESS' | 'FAILED';
}

export const statsData: StatItem[] = [
  {
    title: 'Total Tenant',
    value: 12,
    change: '+15%',
    trend: 'up',
    desc: 'Bulan ini',
    color: 'from-blue-500/20 to-blue-600/5 border-blue-500/30 text-blue-500',
    iconName: 'Users',
  },
  {
    title: 'Total Router',
    value: 8,
    change: '+12%',
    trend: 'up',
    desc: 'Bulan ini',
    color: 'from-purple-500/20 to-purple-600/5 border-purple-500/30 text-purple-500',
    iconName: 'Server',
  },
  {
    title: 'Router Online',
    value: 6,
    change: 'Stabil',
    trend: 'neutral',
    desc: 'Aktif terkoneksi',
    color: 'from-emerald-500/20 to-emerald-600/5 border-emerald-500/30 text-emerald-500',
    iconName: 'Cpu',
  },
  {
    title: 'Router Offline',
    value: 2,
    change: '-50%',
    trend: 'down',
    desc: 'Butuh perhatian',
    color: 'from-rose-500/20 to-rose-600/5 border-rose-500/30 text-rose-500',
    iconName: 'ServerOff',
  },
  {
    title: 'Total Network Slice',
    value: 24,
    change: '+30%',
    trend: 'up',
    desc: 'Dalam 30 hari',
    color: 'from-amber-500/20 to-amber-600/5 border-amber-500/30 text-amber-500',
    iconName: 'Network',
  },
  {
    title: 'Total Konfigurasi',
    value: 48,
    change: '+8%',
    trend: 'up',
    desc: 'Template & Script',
    color: 'from-cyan-500/20 to-cyan-600/5 border-cyan-500/30 text-cyan-500',
    iconName: 'FileJson',
  },
];

export const tenantGrowthData = [
  { name: 'Jan', value: 4 },
  { name: 'Feb', value: 5 },
  { name: 'Mar', value: 7 },
  { name: 'Apr', value: 8 },
  { name: 'Mei', value: 10 },
  { name: 'Jun', value: 12 },
];

export const sliceBandwidthData = [
  { name: 'Slice-Finance', Tx: 25, Rx: 45 },
  { name: 'Slice-Marketing', Tx: 40, Rx: 60 },
  { name: 'Slice-R&D', Tx: 80, Rx: 120 },
  { name: 'Slice-Guest', Tx: 15, Rx: 20 },
  { name: 'Slice-VoIP', Tx: 30, Rx: 30 },
];

export const routerStatusData = [
  { name: 'Online', value: 6, color: '#10b981' },
  { name: 'Offline', value: 2, color: '#f43f5e' },
  { name: 'Error', value: 0, color: '#f59e0b' },
];

export const qosUsageData = [
  { time: '00:00', Upload: 20, Download: 45 },
  { time: '04:00', Upload: 10, Download: 25 },
  { time: '08:00', Upload: 65, Download: 110 },
  { time: '12:00', Upload: 85, Download: 160 },
  { time: '16:00', Upload: 95, Download: 180 },
  { time: '20:00', Upload: 50, Download: 90 },
  { time: '24:00', Upload: 25, Download: 50 },
];

export const recentActivities: ActivityLog[] = [
  {
    id: 'act-1',
    time: '2026-07-19T21:20:00+08:00',
    user: 'admin@nsm.local',
    action: 'Create Network Slice "Slice-R&D"',
    router: 'MikroTik Core-01',
    status: 'SUCCESS',
  },
  {
    id: 'act-2',
    time: '2026-07-19T20:45:00+08:00',
    user: 'operator@nsm.local',
    action: 'Update Bandwidth Limit "Slice-Marketing" to 40M/60M',
    router: 'MikroTik Edge-02',
    status: 'SUCCESS',
  },
  {
    id: 'act-3',
    time: '2026-07-19T19:15:00+08:00',
    user: 'admin@nsm.local',
    action: 'Test Connection Failed - Timeout',
    router: 'MikroTik Branch-03',
    status: 'FAILED',
  },
  {
    id: 'act-4',
    time: '2026-07-19T18:30:00+08:00',
    user: 'operator@nsm.local',
    action: 'Apply Basic Slice Template',
    router: 'MikroTik Core-01',
    status: 'SUCCESS',
  },
  {
    id: 'act-5',
    time: '2026-07-19T16:10:00+08:00',
    user: 'viewer@nsm.local',
    action: 'View Router Configurations',
    router: 'MikroTik Core-01',
    status: 'SUCCESS',
  },
];
