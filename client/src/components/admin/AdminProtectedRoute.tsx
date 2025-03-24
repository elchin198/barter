import { Redirect, Route } from 'wouter';
import { Loader2 } from 'lucide-react';
import { useAdmin } from '@/context/AdminContext';

export function AdminProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: () => React.JSX.Element;
}) {
  const { isAdmin, adminLoading } = useAdmin();

  if (adminLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-border" />
        </div>
      </Route>
    );
  }

  if (!isAdmin) {
    return (
      <Route path={path}>
        <Redirect to="/unauthorized" />
      </Route>
    );
  }

  return <Route path={path} component={Component} />;
}