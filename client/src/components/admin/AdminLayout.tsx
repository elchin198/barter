import { useEffect } from 'react';
import AdminSidebar from './AdminSidebar';
import { useLocation, useRoute } from 'wouter';
import { useAdmin } from '@/context/AdminContext';
import { Loader2 } from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { isAdmin, adminLoading, checkAdminStatus } = useAdmin();
  const [, setLocation] = useLocation();
  const [isLoginRoute] = useRoute('/admin/login');

  // Check admin status on mount
  useEffect(() => {
    const verifyAdmin = async () => {
      const isAdminVerified = await checkAdminStatus();
      
      // If not on login page and not admin, redirect to login
      if (!isLoginRoute && !isAdminVerified) {
        setLocation('/admin/login');
      }
    };

    verifyAdmin();
  }, [checkAdminStatus, isLoginRoute, setLocation]);

  // If checking admin status, show loading
  if (adminLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If not admin and not on login page, don't render anything (redirect will happen from useEffect)
  if (!isAdmin && !isLoginRoute) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />
      <div className="pl-0 lg:pl-64 pt-14">
        <main className="container py-6">
          {children}
        </main>
      </div>
    </div>
  );
}