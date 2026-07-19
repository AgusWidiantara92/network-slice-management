import React from 'react';
import WelcomeCard from '@/components/dashboard/WelcomeCard';
import StatsCard from '@/components/dashboard/StatsCard';
import QuickActions from '@/components/dashboard/QuickActions';
import SystemHealth from '@/components/dashboard/SystemHealth';
import DashboardSummary from '@/components/dashboard/DashboardSummary';
import RouterMonitoring from '@/components/dashboard/RouterMonitoring';
import NotificationPanel from '@/components/dashboard/NotificationPanel';
import TenantChart from '@/components/dashboard/TenantChart';
import RouterChart from '@/components/dashboard/RouterChart';
import SliceChart from '@/components/dashboard/SliceChart';
import ActivityTable from '@/components/dashboard/ActivityTable';
import { dashboardService } from '@/services/dashboard/dashboard.service';
import { cookies } from 'next/headers';
import { verifyAccessToken } from '@/lib/jwt';
import { adminRepository } from '@/repositories/admin.repository';

export default async function DashboardPage() {
  // Resolve the logged-in user for the WelcomeCard
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;
  let userName = 'Administrator';
  let role = 'ADMIN';

  if (token) {
    const payload = await verifyAccessToken(token);
    if (payload) {
      const admin = await adminRepository.findById(payload.userId);
      if (admin) {
        userName = admin.name;
        role = admin.role;
      }
    }
  }

  // Fetch all dashboard data from database via service
  let dashboardData;
  try {
    dashboardData = await dashboardService.getDashboardData();
  } catch (error) {
    console.error('Failed to fetch dashboard data:', error);
    // Provide empty fallback data so the page still renders
    dashboardData = {
      stats: {
        totalTenant: 0,
        totalRouter: 0,
        routerOnline: 0,
        routerOffline: 0,
        totalSlice: 0,
        totalTemplate: 0,
      },
      tenantGrowth: [],
      routerStatus: [
        { name: 'Online', value: 0, color: '#10b981' },
        { name: 'Offline', value: 0, color: '#f43f5e' },
        { name: 'Error', value: 0, color: '#f59e0b' },
      ],
      sliceBandwidth: [],
      qosUsage: [],
      recentActivities: [],
      systemHealth: {
        dbStatus: 'RED' as const,
        routerApiStatus: 'RED' as const,
        llmProviderStatus: 'RED' as const,
        schedulerStatus: 'RED' as const,
      },
      summary: {
        totalVlan: 0,
        totalVrf: 0,
        totalFirewall: 0,
        totalQos: 0,
        totalSchedulerActive: 0,
      },
      routersMon: [],
    };
  }

  return (
    <div className="space-y-6">
      {/* 1. Welcome Card */}
      <WelcomeCard userName={userName} role={role} />

      {/* 2. Quick Actions Menu */}
      <QuickActions />

      {/* 3. Stats Cards (6 metrics) */}
      <StatsCard stats={dashboardData.stats} />

      {/* 4. Row 1: Charts (2/3) + System Health (1/3) */}
      <div className="grid gap-6 lg:grid-cols-3">
        <TenantChart
          tenantGrowth={dashboardData.tenantGrowth}
          qosUsage={dashboardData.qosUsage}
        />
        <SystemHealth health={dashboardData.systemHealth} />
      </div>

      {/* 5. Row 2: Bandwidth Bar Chart (2/3) + Network Summary Data (1/3) */}
      <div className="grid gap-6 lg:grid-cols-3">
        <SliceChart sliceBandwidth={dashboardData.sliceBandwidth} />
        <DashboardSummary summary={dashboardData.summary} />
      </div>

      {/* 6. Row 3: Router Monitoring table (2/3) + Router Online/Offline status distribution pie chart (1/3) */}
      <div className="grid gap-6 lg:grid-cols-3">
        <RouterMonitoring routers={dashboardData.routersMon} />
        <RouterChart routerStatus={dashboardData.routerStatus} />
      </div>

      {/* 7. Row 4: Recent Activities table (2/3) + Timeline Notification panel (1/3) */}
      <div className="grid gap-6 lg:grid-cols-3">
        <ActivityTable activities={dashboardData.recentActivities} />
        <NotificationPanel activities={dashboardData.recentActivities} />
      </div>
    </div>
  );
}
