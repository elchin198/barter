import { useEffect, useState } from 'react';
import { useLocation, Link } from 'wouter';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { 
  LayoutDashboard, 
  Users, 
  ShoppingBag, 
  MessageSquare, 
  FileText, 
  Settings,
  Menu,
  ChevronLeft
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAdmin } from '@/context/AdminContext';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  href: string;
  isActive: boolean;
  onClick?: () => void;
}

const SidebarItem = ({ icon, label, href, isActive, onClick }: SidebarItemProps) => (
  <Link href={href}>
    <a
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent",
        isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground"
      )}
      onClick={onClick}
    >
      {icon}
      <span>{label}</span>
    </a>
  </Link>
);

export default function AdminSidebar() {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useTranslation();
  const { adminLogout } = useAdmin();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const handleLogout = async () => {
    try {
      await adminLogout();
      toast({
        title: t('admin.logoutSuccess', 'Logged out successfully'),
        variant: 'default',
      });
    } catch (error) {
      toast({
        title: t('admin.logoutError', 'Error logging out'),
        variant: 'destructive',
      });
    }
  };

  const toggleSidebar = () => setIsOpen(!isOpen);

  useEffect(() => {
    if (!isMobile) {
      // Always open on desktop
      setIsOpen(true);
    }
  }, [isMobile]);

  // Close sidebar on navigation in mobile view
  const handleNavClick = () => {
    if (isMobile) {
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Mobile menu button */}
      {isMobile && (
        <Button
          variant="outline"
          size="icon"
          className="fixed top-4 left-4 z-50"
          onClick={toggleSidebar}
        >
          <Menu className="h-4 w-4" />
        </Button>
      )}

      <div className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 transform transition-transform duration-200 ease-in-out bg-background border-r border-border",
        isMobile && !isOpen ? "-translate-x-full" : "translate-x-0"
      )}>
        <div className="flex h-full flex-col">
          <div className="flex h-14 items-center border-b px-4">
            <div className="flex items-center gap-2">
              <span className="font-semibold">BarterTap Admin</span>
            </div>
            {isMobile && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={toggleSidebar}
                className="ml-auto"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}
          </div>
          <div className="flex-1 overflow-auto py-2">
            <nav className="grid items-start px-2 gap-1">
              <SidebarItem
                icon={<LayoutDashboard className="h-4 w-4" />}
                label={t('admin.dashboard', 'Dashboard')}
                href="/admin"
                isActive={location === '/admin'}
                onClick={handleNavClick}
              />
              <SidebarItem
                icon={<Users className="h-4 w-4" />}
                label={t('admin.users', 'Users')}
                href="/admin/users"
                isActive={location === '/admin/users'}
                onClick={handleNavClick}
              />
              <SidebarItem
                icon={<ShoppingBag className="h-4 w-4" />}
                label={t('admin.listings', 'Listings')}
                href="/admin/listings"
                isActive={location === '/admin/listings'}
                onClick={handleNavClick}
              />
              <SidebarItem
                icon={<MessageSquare className="h-4 w-4" />}
                label={t('admin.offers', 'Offers')}
                href="/admin/offers"
                isActive={location === '/admin/offers'}
                onClick={handleNavClick}
              />
              <SidebarItem
                icon={<FileText className="h-4 w-4" />}
                label={t('admin.reports', 'Reports')}
                href="/admin/reports"
                isActive={location === '/admin/reports'}
                onClick={handleNavClick}
              />
              <SidebarItem
                icon={<Settings className="h-4 w-4" />}
                label={t('admin.settings', 'Settings')}
                href="/admin/settings"
                isActive={location === '/admin/settings'}
                onClick={handleNavClick}
              />
            </nav>
          </div>
          <div className="p-2 border-t">
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={handleLogout}
            >
              {t('admin.logout', 'Logout')}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}