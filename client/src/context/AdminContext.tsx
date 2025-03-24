import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';

// Define the interface for the admin user
export interface AdminUser {
  id: number;
  username: string;
  role: string;
  email: string;
}

// Admin context type
interface AdminContextType {
  isAdmin: boolean;
  adminLoading: boolean;
  checkAdminStatus: () => Promise<boolean>;
  adminLogout: () => void;
}

// Create the context with default values
export const AdminContext = createContext<AdminContextType | undefined>(undefined);

// Custom hook for using the admin context
export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}

// Admin Provider component
export function AdminProvider({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [adminLoading, setAdminLoading] = useState<boolean>(true);

  // Check if the current user is an admin
  const checkAdminStatus = async (): Promise<boolean> => {
    setAdminLoading(true);
    
    // Logic to verify if the user is an admin
    // In a real app, you might want to make a server call to verify admin privileges
    if (!user) {
      setIsAdmin(false);
      setAdminLoading(false);
      return false;
    }
    
    // For now, assume any user with role 'admin' is an admin
    // In a real app, you'd check this via an API call to the server
    const adminStatus = user.role === 'admin';
    setIsAdmin(adminStatus);
    setAdminLoading(false);
    
    return adminStatus;
  };

  // Admin logout function
  const adminLogout = () => {
    logout();
    setLocation('/');
    toast({
      title: 'Admin logged out',
      description: 'You have been logged out of the admin panel.',
    });
  };

  // Check admin status on component mount or when user changes
  useEffect(() => {
    checkAdminStatus();
  }, [user]);

  return (
    <AdminContext.Provider
      value={{
        isAdmin,
        adminLoading,
        checkAdminStatus,
        adminLogout,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}