import { useState, useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { useAdmin } from '@/context/AdminContext';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { 
  Laptop, 
  Users, 
  Package, 
  Repeat, 
  BarChart3, 
  Settings, 
  LogOut, 
  Menu, 
  X 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

type NavItem = {
  title: string;
  href: string;
  icon: React.ReactNode;
};

export default function AdminSidebar() {
  const [, navigate] = useLocation();
  const { adminLogout } = useAdmin();
  const { user } = useAuth();
  const [location] = useLocation();
  const [isMobile, setIsMobile] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Handle resize events to detect mobile view
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint in Tailwind
    };

    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);

    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  const navItems: NavItem[] = [
    {
      title: 'Dashboard',
      href: '/admin/dashboard',
      icon: <Laptop className="h-5 w-5" />,
    },
    {
      title: 'Users',
      href: '/admin/users',
      icon: <Users className="h-5 w-5" />,
    },
    {
      title: 'Listings',
      href: '/admin/listings',
      icon: <Package className="h-5 w-5" />,
    },
    {
      title: 'Offers',
      href: '/admin/offers',
      icon: <Repeat className="h-5 w-5" />,
    },
    {
      title: 'Statistics',
      href: '/admin/stats',
      icon: <BarChart3 className="h-5 w-5" />,
    },
    {
      title: 'Settings',
      href: '/admin/settings',
      icon: <Settings className="h-5 w-5" />,
    },
  ];

  const handleLogout = () => {
    adminLogout();
    navigate('/');
  };

  const SidebarContent = () => (
    <div className="flex h-full flex-col space-y-4">
      <div className="flex items-center px-4 py-2">
        <img src="/barter-logo.png" alt="BarterTap" className="w-8 h-8 mr-2" />
        <h1 className="text-xl font-bold">Admin Panel</h1>
      </div>
      
      <Separator />
      
      <div className="flex-1 space-y-1 px-3">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setIsOpen(false)}
          >
            <a
              className={cn(
                "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                location === item.href ? "bg-accent text-accent-foreground" : "text-muted-foreground"
              )}
            >
              {item.icon}
              <span className="ml-3">{item.title}</span>
            </a>
          </Link>
        ))}
      </div>
      
      <div className="sticky bottom-0 p-4 bg-background">
        <Separator className="mb-4" />
        
        <div className="flex items-center gap-3 mb-4">
          <Avatar>
            <AvatarImage src={user?.avatar || ''} alt={user?.username || 'Admin'} />
            <AvatarFallback>{user?.username?.charAt(0).toUpperCase() || 'A'}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <p className="text-sm font-medium">{user?.fullName || user?.username}</p>
            <p className="text-xs text-muted-foreground">Administrator</p>
          </div>
        </div>
        
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );

  // For desktop, render sidebar directly
  if (!isMobile) {
    return (
      <aside className="fixed inset-y-0 left-0 z-10 hidden w-64 border-r bg-background lg:flex flex-col">
        <SidebarContent />
      </aside>
    );
  }

  // For mobile, render a button that opens a sheet with the sidebar
  return (
    <>
      <div className="fixed top-0 left-0 z-20 w-full border-b bg-background h-14 flex items-center px-4 lg:hidden">
        <div className="flex flex-1 items-center">
          <img src="/barter-logo.png" alt="BarterTap" className="w-8 h-8 mr-2" />
          <h1 className="text-lg font-semibold">Admin Panel</h1>
        </div>

        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon">
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}