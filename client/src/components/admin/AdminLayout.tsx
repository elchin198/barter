import { ReactNode } from 'react';
import AdminSidebar from './AdminSidebar';
import { useAdmin } from '@/context/AdminContext';
import { Button } from '@/components/ui/button';
import { LogOut, User } from 'lucide-react';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { adminLogout } = useAdmin();
  
  return (
    <div className="flex h-screen bg-background">
      {/* Admin Sidebar */}
      <AdminSidebar />
      
      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <header className="bg-card border-b h-16 flex items-center justify-between px-6">
          <h1 className="text-xl font-semibold">Admin Panel</h1>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <User className="h-5 w-5 mr-2" />
              <span>Admin</span>
            </div>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={adminLogout}
              className="flex items-center"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Log out
            </Button>
          </div>
        </header>
        
        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}