import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login - Network Slice Management',
  description: 'Halaman login untuk Network Slice Management System',
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
