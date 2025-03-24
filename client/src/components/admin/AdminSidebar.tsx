import { useLocation, Link } from 'wouter';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  BarChart4, 
  FileBox, 
  Menu, 
  X 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function AdminSidebar() {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(true);
  const { t } = useTranslation();
  
  // Navigation items
  const navItems = [
    {
      title: t('admin.dashboard', 'Dashboard'),
      href: '/admin/dashboard',
      icon: LayoutDashboard,
    },
    {
      title: t('admin.users', 'Users'),
      href: '/admin/users',
      icon: Users,
    },
    {
      title: t('admin.listings', 'Listings'),
      href: '/admin/listings',
      icon: Package,
    },
    {
      title: t('admin.offers', 'Offers'),
      href: '/admin/offers',
      icon: FileBox,
    },
    {
      title: t('admin.statistics', 'Statistics'),
      href: '/admin/stats',
      icon: BarChart4,
    },
  ];

  return (
    <>
      {/* Mobile Toggle */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
        >
          {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Sidebar */}
      <div 
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-40 lg:z-auto",
          "w-64 border-r bg-background transition-all duration-300",
          "flex flex-col",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          "lg:w-64"
        )}
      >
        {/* Logo */}
        <div className="h-16 border-b flex items-center justify-center px-6">
          <Link href="/">
            <div className="flex items-center space-x-2 cursor-pointer">
              <img 
                src="/barter-logos.ico"
                alt="BarterTap Logo"
                className="h-8 w-8"
              />
              <span className="font-bold text-xl">BarterTap Admin</span>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-4 space-y-1">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <a 
                className={cn(
                  "flex items-center px-3 py-3 text-sm rounded-md",
                  "transition-colors",
                  location === item.href 
                    ? "bg-primary/10 text-primary font-medium" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="h-5 w-5 mr-3" />
                {item.title}
              </a>
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t p-4">
          <Link href="/">
            <a className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              {t('admin.backToSite', 'Back to site')}
            </a>
          </Link>
        </div>
      </div>

      {/* Overlay to close sidebar on mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/30 z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}