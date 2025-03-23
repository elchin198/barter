import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Bell, Menu, MessageSquare, LogOut, User, Plus, Heart, Package, Loader2, HelpCircle, Search } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { Badge } from "@/components/ui/badge";
import LanguageSwitcher from "./LanguageSwitcher";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [, navigate] = useLocation();
  const { user, logout } = useAuth();
  const { t } = useTranslation();

  // Get notification count
  const { data: notificationData } = useQuery<{ count: number }>({
    queryKey: ['/api/notifications/count'],
    enabled: !!user,
    refetchInterval: 60000, // Refetch every minute
  });
  
  const notificationCount = notificationData?.count || 0;

  useEffect(() => {
    const handleScroll = () => {
      const offset = window.scrollY;
      setIsScrolled(offset > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const navbarClasses = `
    sticky top-0 z-50 w-full border-b transition-all duration-200
    ${isScrolled ? "bg-white shadow-sm" : "bg-white"}
  `;

  return (
    <header className={navbarClasses}>
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center">
              <Link href="/">
                <img 
                  src="/logo-new.png" 
                  alt="BarterTap.az" 
                  className="h-8 md:h-10 object-contain transition-transform hover:scale-105 duration-300"
                  style={{ maxWidth: "200px" }}
                />
              </Link>
            </div>
            
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/">
                <span className="text-sm font-medium hover:text-blue-600 transition-colors cursor-pointer">
                  {t('common.home', 'Ana Səhifə')}
                </span>
              </Link>
              <Link href="/items">
                <span className="text-sm font-medium hover:text-blue-600 transition-colors cursor-pointer">
                  {t('common.allItems', 'Bütün Əşyalar')}
                </span>
              </Link>
              <Link href="/categories">
                <span className="text-sm font-medium hover:text-blue-600 transition-colors cursor-pointer">
                  {t('common.categories', 'Kateqoriyalar')}
                </span>
              </Link>
              <Link href="/how-it-works">
                <span className="text-sm font-medium hover:text-blue-600 transition-colors cursor-pointer">
                  {t('common.howItWorks', 'Necə İşləyir')}
                </span>
              </Link>
              {user && (
                <Link href="/items/new">
                  <span className="text-sm font-medium hover:text-blue-600 transition-colors cursor-pointer">
                    {t('common.addItem', 'Əşya Əlavə Et')}
                  </span>
                </Link>
              )}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/search">
              <Button variant="ghost" size="icon" className="text-gray-600 hover:text-blue-600">
                <Search className="h-5 w-5" />
              </Button>
            </Link>
            
            {/* Language switcher visible always */}
            <div className="hidden md:flex">
              <LanguageSwitcher />
            </div>
            
            {user ? (
              <>
                <div className="hidden md:flex items-center gap-4">
                  <Link href="/notifications">
                    <div className="relative cursor-pointer">
                      <Bell className="h-5 w-5 text-gray-600 hover:text-blue-600 transition-colors" />
                      {notificationCount > 0 && (
                        <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                          {notificationCount > 9 ? '9+' : notificationCount}
                        </Badge>
                      )}
                    </div>
                  </Link>
                  <Link href="/messages">
                    <div className="cursor-pointer">
                      <MessageSquare className="h-5 w-5 text-gray-600 hover:text-blue-600 transition-colors" />
                    </div>
                  </Link>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                      <Avatar className="h-9 w-9">
                        <AvatarImage 
                          src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName || user.username)}`} 
                          alt={user.username} 
                        />
                        <AvatarFallback>{user.username[0].toUpperCase()}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Mənim Hesabım</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate("/profile")}>
                      <User className="mr-2 h-4 w-4" />
                      <span>Profil</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/items/new")}>
                      <Plus className="mr-2 h-4 w-4" />
                      <span>Əşya Əlavə Et</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/messages")}>
                      <MessageSquare className="mr-2 h-4 w-4" />
                      <span>Mesajlar</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/profile?tab=favorites")}>
                      <Heart className="mr-2 h-4 w-4" />
                      <span>Seçilmişlər</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/my-items")}>
                      <Package className="mr-2 h-4 w-4" />
                      <span>Mənim Əşyalarım</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate("/help")}>
                      <HelpCircle className="mr-2 h-4 w-4" />
                      <span>Kömək</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Çıxış</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="hidden md:flex items-center gap-4">
                <LanguageSwitcher />
                <Link href="/login">
                  <Button variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50">
                    {t('common.login', 'Daxil ol')}
                  </Button>
                </Link>
                <Link href="/register">
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    {t('common.register', 'Qeydiyyat')}
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile menu */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <div className="mt-4 mb-6">
                  <Link href="/">
                    <img 
                      src="/logo-new.png" 
                      alt="BarterTap.az" 
                      className="h-10 mb-4 object-contain"
                      style={{ maxWidth: "180px" }}
                    />
                  </Link>
                </div>
                <nav className="flex flex-col gap-4">
                  <Link href="/">
                    <span className="text-lg font-medium hover:text-blue-600 cursor-pointer block py-2">
                      Ana Səhifə
                    </span>
                  </Link>
                  <Link href="/items">
                    <span className="text-lg font-medium hover:text-blue-600 cursor-pointer block py-2">
                      Bütün Əşyalar
                    </span>
                  </Link>
                  <Link href="/categories">
                    <span className="text-lg font-medium hover:text-blue-600 cursor-pointer block py-2">
                      Kateqoriyalar
                    </span>
                  </Link>
                  <Link href="/how-it-works">
                    <span className="text-lg font-medium hover:text-blue-600 cursor-pointer block py-2">
                      Necə İşləyir
                    </span>
                  </Link>
                  
                  <div className="border-t my-2"></div>

                  {/* Mobile language switcher */}
                  <div className="py-2">
                    <LanguageSwitcher />
                  </div>

                  {user ? (
                    <>
                      <Link href="/profile">
                        <span className="text-lg font-medium hover:text-blue-600 flex items-center cursor-pointer py-2">
                          <User className="mr-2 h-5 w-5" />
                          Profil
                        </span>
                      </Link>
                      <Link href="/items/new">
                        <span className="text-lg font-medium hover:text-blue-600 flex items-center cursor-pointer py-2">
                          <Plus className="mr-2 h-5 w-5" />
                          Əşya Əlavə Et
                        </span>
                      </Link>
                      <Link href="/my-items">
                        <span className="text-lg font-medium hover:text-blue-600 flex items-center cursor-pointer py-2">
                          <Package className="mr-2 h-5 w-5" />
                          Mənim Əşyalarım
                        </span>
                      </Link>
                      <Link href="/messages">
                        <span className="text-lg font-medium hover:text-blue-600 flex items-center cursor-pointer py-2">
                          <MessageSquare className="mr-2 h-5 w-5" />
                          Mesajlar
                        </span>
                      </Link>
                      <Link href="/notifications">
                        <span className="text-lg font-medium hover:text-blue-600 flex items-center cursor-pointer py-2">
                          <Bell className="mr-2 h-5 w-5" />
                          Bildirişlər
                          {notificationCount > 0 && (
                            <Badge variant="destructive" className="ml-2">
                              {notificationCount}
                            </Badge>
                          )}
                        </span>
                      </Link>
                      <Link href="/profile?tab=favorites">
                        <span className="text-lg font-medium hover:text-blue-600 flex items-center cursor-pointer py-2">
                          <Heart className="mr-2 h-5 w-5" />
                          Seçilmişlər
                        </span>
                      </Link>
                      <Link href="/help">
                        <span className="text-lg font-medium hover:text-blue-600 flex items-center cursor-pointer py-2">
                          <HelpCircle className="mr-2 h-5 w-5" />
                          Kömək
                        </span>
                      </Link>
                      
                      <div className="border-t my-2"></div>
                      
                      <button 
                        className="text-lg font-medium hover:text-blue-600 flex items-center cursor-pointer bg-transparent border-0 text-left p-0 py-2"
                        onClick={handleLogout}
                      >
                        <LogOut className="mr-2 h-5 w-5" />
                        Çıxış
                      </button>
                    </>
                  ) : (
                    <>
                      <Link href="/login">
                        <Button variant="outline" className="w-full border-blue-600 text-blue-600 hover:bg-blue-50 mb-2">
                          Daxil ol
                        </Button>
                      </Link>
                      <Link href="/register">
                        <Button className="w-full bg-blue-600 hover:bg-blue-700">
                          Qeydiyyat
                        </Button>
                      </Link>
                    </>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}