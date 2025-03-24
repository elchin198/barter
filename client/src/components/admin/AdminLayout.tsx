import { ReactNode } from 'react';
import AdminSidebar from './AdminSidebar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Toaster } from '@/components/ui/toaster';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-muted/20">
      <AdminSidebar />
      
      <main className="md:pl-64 pt-4 md:pt-0">
        <div className="p-4 md:p-8 max-w-6xl">
          <ScrollArea className="h-[calc(100vh-32px)]">
            {children}
          </ScrollArea>
        </div>
      </main>
      
      <Toaster />
    </div>
  );
}