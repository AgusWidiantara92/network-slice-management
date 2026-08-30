import React from 'react';
import { cookies } from 'next/headers';
import { verifyAccessToken } from '@/lib/jwt';
import { adminRepository } from '@/repositories/admin.repository';
import { LayoutProvider } from '@/components/layout/LayoutContext';
import AppSidebar from '@/components/layout/AppSidebar';
import AppHeader from '@/components/layout/AppHeader';
import PageContainer from '@/components/layout/PageContainer';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Resolve user session from cookies server-side
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;
  let user = { name: 'Super Admin', email: 'admin@nsm.local', role: 'ADMIN' };

  if (token) {
    const payload = await verifyAccessToken(token);
    if (payload) {
      const admin = await adminRepository.findById(payload.userId);
      if (admin) {
        user = {
          name: admin.name,
          email: admin.email,
          role: admin.role,
        };
      }
    }
  }

  return (
    <LayoutProvider>
      <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground transition-colors duration-200">
        {/* Permanent Desktop Sidebar + Mobile Drawer */}
        <AppSidebar />

        {/* Right Main Body Area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Top Command / Header Bar */}
          <AppHeader user={user} />

          {/* Page Container Area */}
          <main className="flex-1 overflow-y-auto custom-scrollbar">
            <PageContainer>
              {children}
            </PageContainer>
          </main>
        </div>
      </div>
    </LayoutProvider>
  );
}
