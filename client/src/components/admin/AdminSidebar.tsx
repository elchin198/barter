import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useTranslation } from 'react-i18next';
import { 
  Users, 
  BarChart4, 
  Home, 
  List, 
  CircleDollarSign, 
  Flag,
  MenuIcon,
  X,
  LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AdminSidebarProps {
  className?: string;
}

export default function AdminSidebar({ className }: AdminSidebarProps) {
  const { t } = useTranslation();
  const [location] = useLocation();
  const { logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const links = [
    {
      title: t('admin.dashboard', 'Dashboard'),
      icon: <Home className="w-5 h-5" />,
      href: '/admin'
    },
    {
      title: t('admin.users', 'Users'),
      icon: <Users className="w-5 h-5" />,
      href: '/admin/users'
    },
    {
      title: t('admin.listings', 'Listings'),
      icon: <List className="w-5 h-5" />,
      href: '/admin/listings'
    },
    {
      title: t('admin.offers', 'Offers'),
      icon: <CircleDollarSign className="w-5 h-5" />,
      href: '/admin/offers'
    },
    {
      title: t('admin.reports', 'Reports'),
      icon: <Flag className="w-5 h-5" />,
      href: '/admin/reports'
    },
    {
      title: t('admin.stats', 'Statistics'),
      icon: <BarChart4 className="w-5 h-5" />,
      href: '/admin/stats'
    }
  ];

  const handleLogout = async () => {
    await logout();
    window.location.href = '/';
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "fixed hidden md:flex h-screen flex-col border-r bg-background w-64 z-30",
          className
        )}
      >
        <div className="p-4 flex items-center gap-2">
          <img src="/barter-logo.png" alt="BarterTap" className="w-8 h-8" />
          <h2 className="text-xl font-bold">Admin Panel</h2>
        </div>
        
        <Separator />

        <ScrollArea className="flex-1 pt-4">
          <nav className="grid gap-1 px-2">
            {links.map((link) => (
              <Link key={link.href} href={link.href}>
                <a
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                    location === link.href ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                  )}
                >
                  {link.icon}
                  {link.title}
                </a>
              </Link>
            ))}
          </nav>
        </ScrollArea>

        <div className="mt-auto p-4">
          <Button 
            variant="ghost" 
            className="w-full justify-start text-destructive hover:text-destructive/90 hover:bg-destructive/10"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            {t('common.logout', 'Logout')}
          </Button>
        </div>
      </aside>

      {/* Mobile menu button */}
      <div className="fixed top-0 left-0 z-40 p-4 flex md:hidden">
        <Button variant="outline" size="icon" onClick={toggleMobileMenu}>
          <MenuIcon className="h-5 w-5" />
        </Button>
      </div>

      {/* Mobile sidebar overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
          onClick={toggleMobileMenu}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-background border-r transition-transform duration-300 ease-in-out md:hidden",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/barter-logo.png" alt="BarterTap" className="w-8 h-8" />
            <h2 className="text-xl font-bold">Admin Panel</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={toggleMobileMenu}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <Separator />

        <ScrollArea className="flex-1 pt-4">
          <nav className="grid gap-1 px-2">
            {links.map((link) => (
              <Link key={link.href} href={link.href}>
                <a
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                    location === link.href ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                  )}
                  onClick={toggleMobileMenu}
                >
                  {link.icon}
                  {link.title}
                </a>
              </Link>
            ))}
          </nav>
        </ScrollArea>

        <div className="mt-auto p-4">
          <Button 
            variant="ghost" 
            className="w-full justify-start text-destructive hover:text-destructive/90 hover:bg-destructive/10"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            {t('common.logout', 'Logout')}
          </Button>
        </div>
      </aside>
    </>
  );
}