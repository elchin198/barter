import { useAuth } from "@/hooks/use-auth";
import { Route, useLocation } from "wouter";
import UnauthorizedPage from "@/pages/unauthorized";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

interface ProtectedRouteProps {
  path: string;
  component: React.ComponentType;
  requiredRoles?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  path,
  component: Component,
  requiredRoles = [],
}) => {
  const { user, isLoading, refreshUser } = useAuth();
  const [location, navigate] = useLocation();
  const { toast } = useToast();

  // Try to refresh user data if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      const performRefresh = async () => {
        const refreshedUser = await refreshUser();
        if (!refreshedUser) {
          toast({
            title: "Sessiya başa çatıb",
            description: "Zəhmət olmasa yenidən sistemə daxil olun",
            variant: "destructive",
          });
        }
      };
      
      performRefresh();
    }
  }, [isLoading, user, refreshUser, toast]);

  // Check if user has required roles
  const hasRequiredRoles = () => {
    if (!user || requiredRoles.length === 0) return true;
    return requiredRoles.includes(user.role);
  };

  // If still loading, show loading spinner
  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Route>
    );
  }

  // If user is not authenticated, redirect to unauthorized page
  if (!user) {
    return (
      <Route path={path}>
        <UnauthorizedPage />
      </Route>
    );
  }

  // If user doesn't have required roles, show unauthorized page
  if (!hasRequiredRoles()) {
    return (
      <Route path={path}>
        <UnauthorizedPage />
      </Route>
    );
  }

  // If user is authenticated and has required roles, render the component
  return (
    <Route path={path}>
      <Component />
    </Route>
  );
};