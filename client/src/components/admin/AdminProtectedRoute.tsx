import { useEffect } from 'react';
import { Redirect, useLocation } from 'wouter';
import { useAdmin } from '@/context/AdminContext';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AdminProtectedRouteProps {
  component: React.ComponentType;
  path: string;
}

export function AdminProtectedRoute({
  component: Component,
  path
}: AdminProtectedRouteProps) {
  const { isAdmin, adminLoading, checkAdminStatus } = useAdmin();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  useEffect(() => {
    const verifyAdmin = async () => {
      const isUserAdmin = await checkAdminStatus();
      if (!isUserAdmin) {
        toast({
          title: 'Unauthorized',
          description: 'You do not have permission to access the admin area.',
          variant: 'destructive',
        });
        setLocation('/');
      }
    };

    verifyAdmin();
  }, []);

  if (adminLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg">Checking admin privileges...</span>
      </div>
    );
  }

  if (!isAdmin) {
    return <Redirect to="/" />;
  }

  return <Component />;
}