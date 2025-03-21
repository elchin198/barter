import { Link, useLocation } from "wouter";
import { 
  Search, 
  X, 
  Menu, 
  Bell, 
  User, 
  ChevronDown, 
  LogOut, 
  MessageCircle, 
  Heart, 
  PlusCircle,
  Settings,
  Sparkles,
  HelpCircle,
  Home,
  Contact,
  Info,
  SunMoon,
  LifeBuoy,
  Languages
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuShortcut,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function Header() {
  const { user, logoutMutation, isLoading: isAuthLoading } = useAuth();
  const isAuthenticated = !!user;
  const [location, setLocation] = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Handle logout
  const logout = () => {
    logoutMutation.mutate();
  };
  
  // Toggle mobile menu
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
    // Close search if open
    if (isSearchExpanded) {
      setIsSearchExpanded(false);
    }
  };

  // Function to get initials from user fullname
  const getInitials = (name: string) => {
    if (!name) return "BT";
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  // Toggle search expansion for mobile
  const toggleSearch = () => {
    setIsSearchExpanded(!isSearchExpanded);
    // Focus input when expanded
    if (!isSearchExpanded) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  };
  
  // Handle search submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setLocation(`/search?q=${encodeURIComponent(searchQuery)}`);
      setIsSearchExpanded(false);
    }
  };
  
  // Hide mobile menu when scrolling
  useEffect(() => {
    const handleScroll = () => {
      // Handle menu closing on scroll
      if (isMenuOpen) {
        setIsMenuOpen(false);
      }
      
      // Change header style on scroll
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMenuOpen]);
  
  // Close menu when location changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

  // Get user initials
  const userInitials = user?.fullName ? getInitials(user.fullName) : "BT";
  
  // Check if the current route is active
  const isActiveRoute = (path: string) => location === path;

  return (
    <header 
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300 border-b bg-white/95 backdrop-blur-md supports-[backdrop-filter]:bg-white/80",
        isScrolled ? "border-b border-gray-100 shadow-sm" : "border-transparent"
      )}
    >
      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm transition-opacity duration-300"
          onClick={toggleMenu}
        ></div>
      )}
      
      {/* Mobile Menu Drawer */}
      <div 
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-4/5 max-w-sm bg-white transform transition-all duration-300 ease-in-out",
          isMenuOpen ? "translate-x-0 shadow-xl" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Menu header */}
          <div className="flex items-center justify-between p-4 border-b relative">
            <Link href="/" className="flex items-center" onClick={() => setIsMenuOpen(false)}>
              <img src="/logo.svg" alt="BarterTap" className="h-8" />
            </Link>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleMenu} 
              className="rounded-full hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Menu content with scrolling */}
          <div className="flex-1 overflow-y-auto py-4 px-4">
            {isAuthLoading ? (
              <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-100">
                <Skeleton className="w-12 h-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            ) : isAuthenticated ? (
              <div className="mb-6 pb-6 border-b border-gray-100">
                <div className="flex items-center gap-3 mb-6">
                  <Avatar className="h-12 w-12 border border-primary/10 shadow-sm">
                    <AvatarImage src={user?.avatar || ""} />
                    <AvatarFallback className="bg-primary/10 text-primary font-medium">{userInitials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-gray-900">{user?.fullName}</p>
                    <p className="text-sm text-gray-500 truncate max-w-[180px]">{user?.email}</p>
                  </div>
                </div>
                
                {/* User navigation links */}
                <nav className="grid gap-1">
                  <Link 
                    href="/profile" 
                    onClick={() => setIsMenuOpen(false)} 
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                      isActiveRoute('/profile') 
                        ? "bg-primary/10 text-primary font-medium" 
                        : "text-gray-700 hover:bg-gray-50"
                    )}
                  >
                    <User className="h-5 w-5" />
                    <span>Profilim</span>
                  </Link>
                  
                  <Link 
                    href="/messages" 
                    onClick={() => setIsMenuOpen(false)} 
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                      isActiveRoute('/messages') 
                        ? "bg-primary/10 text-primary font-medium" 
                        : "text-gray-700 hover:bg-gray-50"
                    )}
                  >
                    <MessageCircle className="h-5 w-5" />
                    <span>Mesajlar</span>
                    <Badge className="ml-auto bg-primary/90 text-[10px] px-1.5">3</Badge>
                  </Link>
                  
                  <Link 
                    href="/favorites" 
                    onClick={() => setIsMenuOpen(false)} 
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                      isActiveRoute('/favorites') 
                        ? "bg-primary/10 text-primary font-medium" 
                        : "text-gray-700 hover:bg-gray-50"
                    )}
                  >
                    <Heart className="h-5 w-5" />
                    <span>Seçilmişlər</span>
                  </Link>
                  
                  <Link 
                    href="/create-item" 
                    onClick={() => setIsMenuOpen(false)} 
                    className="flex items-center gap-3 px-3 py-2 text-primary font-medium bg-primary/5 hover:bg-primary/10 rounded-lg transition-colors mt-2"
                  >
                    <PlusCircle className="h-5 w-5" />
                    <span>Yeni Elan Əlavə Et</span>
                  </Link>
                </nav>
              </div>
            ) : (
              <div className="mb-6 pb-6 border-b border-gray-100">
                <div className="space-y-3">
                  <p className="text-gray-600 mb-3">Platformadan tam istifadə etmək üçün hesabınıza daxil olun:</p>
                  <Link href="/auth?tab=login" onClick={() => setIsMenuOpen(false)} className="w-full">
                    <Button className="w-full">Daxil ol</Button>
                  </Link>
                  <Link href="/auth?tab=register" onClick={() => setIsMenuOpen(false)} className="w-full">
                    <Button variant="outline" className="w-full">Qeydiyyat</Button>
                  </Link>
                </div>
              </div>
            )}
            
            {/* Main navigation */}
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-2 text-primary font-medium mb-3">
                  <Sparkles className="h-4 w-4" />
                  <span className="text-sm">Platformada</span>
                </div>
                
                <nav className="grid gap-1">
                  <Link 
                    href="/" 
                    onClick={() => setIsMenuOpen(false)} 
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-gray-700 hover:bg-gray-50",
                      isActiveRoute('/') && "bg-gray-50 font-medium"
                    )}
                  >
                    <Home className="h-5 w-5 text-gray-500" />
                    <span>Ana səhifə</span>
                  </Link>
                  
                  <Link 
                    href="/search" 
                    onClick={() => setIsMenuOpen(false)} 
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-gray-700 hover:bg-gray-50",
                      isActiveRoute('/search') && "bg-gray-50 font-medium"
                    )}
                  >
                    <Search className="h-5 w-5 text-gray-500" />
                    <span>Bütün Elanlar</span>
                  </Link>
                  
                  <Link 
                    href="/categories" 
                    onClick={() => setIsMenuOpen(false)} 
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-gray-700 hover:bg-gray-50",
                      isActiveRoute('/categories') && "bg-gray-50 font-medium"
                    )}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-500">
                      <path d="M10 3H3V10H10V3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M21 3H14V10H21V3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M21 14H14V21H21V14Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M10 14H3V21H10V14Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>Kateqoriyalar</span>
                  </Link>
                </nav>
              </div>
              
              <div>
                <div className="flex items-center gap-2 text-primary font-medium mb-3">
                  <Info className="h-4 w-4" />
                  <span className="text-sm">Haqqımızda</span>
                </div>
                
                <nav className="grid gap-1">
                  <Link 
                    href="/about" 
                    onClick={() => setIsMenuOpen(false)} 
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-gray-700 hover:bg-gray-50",
                      isActiveRoute('/about') && "bg-gray-50 font-medium"
                    )}
                  >
                    <Info className="h-5 w-5 text-gray-500" />
                    <span>Haqqımızda</span>
                  </Link>
                  
                  <Link 
                    href="/contact" 
                    onClick={() => setIsMenuOpen(false)} 
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-gray-700 hover:bg-gray-50",
                      isActiveRoute('/contact') && "bg-gray-50 font-medium"
                    )}
                  >
                    <Contact className="h-5 w-5 text-gray-500" />
                    <span>Əlaqə</span>
                  </Link>
                  
                  <Link 
                    href="/faq" 
                    onClick={() => setIsMenuOpen(false)} 
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-gray-700 hover:bg-gray-50",
                      isActiveRoute('/faq') && "bg-gray-50 font-medium"
                    )}
                  >
                    <HelpCircle className="h-5 w-5 text-gray-500" />
                    <span>FAQ</span>
                  </Link>
                </nav>
              </div>
              
              {/* Logout button for mobile */}
              {isAuthenticated && (
                <div className="pt-4 mt-4 border-t border-gray-100">
                  <button 
                    onClick={() => {
                      logout();
                      setIsMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-3 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <LogOut className="h-5 w-5" />
                    <span>Çıxış</span>
                  </button>
                </div>
              )}
              
              {/* Social links */}
              <div className="pt-4 mt-4 border-t border-gray-100">
                <h4 className="text-sm font-medium text-gray-500 mb-3">Bizi izləyin</h4>
                <div className="flex items-center gap-4">
                  <a 
                    href="https://www.facebook.com/bartertapaz" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="w-10 h-10 rounded-full border border-gray-100 flex items-center justify-center text-gray-500 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-colors"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M18 2H15C13.6739 2 12.4021 2.52678 11.4645 3.46447C10.5268 4.40215 10 5.67392 10 7V10H7V14H10V22H14V14H17L18 10H14V7C14 6.73478 14.1054 6.48043 14.2929 6.29289C14.4804 6.10536 14.7348 6 15 6H18V2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </a>
                  <a 
                    href="https://www.instagram.com/bartertapaz/" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="w-10 h-10 rounded-full border border-gray-100 flex items-center justify-center text-gray-500 hover:text-pink-600 hover:border-pink-200 hover:bg-pink-50 transition-colors"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M17.5 6.5H17.51M7 2H17C19.7614 2 22 4.23858 22 7V17C22 19.7614 19.7614 22 17 22H7C4.23858 22 2 19.7614 2 17V7C2 4.23858 4.23858 2 7 2ZM16 11.37C16.1234 12.2022 15.9813 13.0522 15.5938 13.799C15.2063 14.5458 14.5931 15.1514 13.8416 15.5297C13.0901 15.9079 12.2384 16.0396 11.4078 15.9059C10.5771 15.7723 9.80976 15.3801 9.21484 14.7852C8.61992 14.1902 8.22773 13.4229 8.09407 12.5922C7.9604 11.7616 8.09207 10.9099 8.47033 10.1584C8.84859 9.40685 9.45419 8.79374 10.201 8.40624C10.9478 8.01874 11.7978 7.87659 12.63 8C13.4789 8.12588 14.2649 8.52146 14.8717 9.12831C15.4785 9.73515 15.8741 10.5211 16 11.37Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </a>
                  <a 
                    href="https://twitter.com/bartertapaz" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="w-10 h-10 rounded-full border border-gray-100 flex items-center justify-center text-gray-500 hover:text-blue-400 hover:border-blue-200 hover:bg-blue-50 transition-colors"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22 4.01001C21 4.50001 20.02 4.69901 19 5.00001C17.879 3.73501 16.217 3.66501 14.62 4.26301C13.023 4.86101 11.977 6.32301 12 8.00001V9.00001C8.755 9.08301 5.865 7.60501 4 5.00001C4 5.00001 -0.182 12.433 8 16C6.128 17.247 4.261 18.088 2 18C5.308 19.803 8.913 20.423 12.034 19.517C15.614 18.477 18.556 15.794 19.685 11.775C20.0218 10.5527 20.189 9.28546 20.182 8.01301C20.18 7.77301 21.692 5.25001 22 4.00901V4.01001Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Header */}
      <div className="container mx-auto">
        <div className="flex items-center justify-between h-16 lg:h-20 px-4 md:px-0">
          {/* Left Section: Logo, Mobile menu button, and Desktop navigation */}
          <div className="flex items-center gap-2 md:gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleMenu} 
              className="md:hidden rounded-full hover:bg-gray-100 text-gray-700"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
            
            <Link href="/" className="flex items-center">
              <img 
                src="/logo.svg" 
                alt="BarterTap.az" 
                className="h-8 md:h-10 transition-transform hover:scale-105 duration-300"
              />
            </Link>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1 ml-4">
              <Link href="/">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={cn(
                    "text-gray-700 hover:text-primary",
                    location === "/" && "bg-primary/5 text-primary font-medium"
                  )}
                >
                  Ana səhifə
                </Button>
              </Link>
              <Link href="/search">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={cn(
                    "text-gray-700 hover:text-primary",
                    location.startsWith("/search") && "bg-primary/5 text-primary font-medium"
                  )}
                >
                  Elanlar
                </Button>
              </Link>
              <Link href="/categories">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={cn(
                    "text-gray-700 hover:text-primary",
                    location.startsWith("/categories") && "bg-primary/5 text-primary font-medium"
                  )}
                >
                  Kateqoriyalar
                </Button>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className={cn(
                      "text-gray-700 hover:text-primary",
                      (location === "/about" || location === "/contact" || location === "/faq") 
                        && "bg-primary/5 text-primary font-medium"
                    )}
                  >
                    Haqqımızda <ChevronDown className="h-4 w-4 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link href="/about" className="cursor-pointer">
                      <Info className="h-4 w-4 mr-2" />
                      <span>Haqqımızda</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/contact" className="cursor-pointer">
                      <Contact className="h-4 w-4 mr-2" />
                      <span>Əlaqə</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/faq" className="cursor-pointer">
                      <HelpCircle className="h-4 w-4 mr-2" />
                      <span>FAQ</span>
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </nav>
          </div>
          
          {/* Center Section: Desktop search */}
          <div className="hidden md:flex items-center justify-center relative max-w-xl flex-1 mx-4 lg:mx-8">
            <form 
              className="w-full" 
              onSubmit={handleSearch}
            >
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Barter etmək istədiyiniz məhsul..." 
                  className="w-full h-10 pl-10 pr-4 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent text-sm shadow-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <div className="absolute left-0 top-0 h-full px-3 flex items-center text-gray-500">
                  <Search className="h-4 w-4" />
                </div>
                <Button 
                  type="submit"
                  variant="ghost" 
                  size="sm" 
                  className="absolute right-0 top-0 rounded-r-full h-full px-4 text-primary font-medium text-sm hover:bg-primary/5"
                >
                  Axtar
                </Button>
              </div>
            </form>
          </div>
          
          {/* Right Section: Actions and Auth */}
          <div className="flex items-center gap-2 md:gap-3">
            {/* Mobile search toggle */}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleSearch}
              className="md:hidden rounded-full text-gray-700 hover:bg-gray-100"
              aria-label="Search"
            >
              <Search className="h-5 w-5" />
            </Button>

            {/* Auth buttons or User actions */}
            {isAuthLoading ? (
              <div className="flex items-center gap-2">
                <Skeleton className="h-9 w-9 rounded-full" />
              </div>
            ) : isAuthenticated ? (
              <div className="flex items-center gap-2 md:gap-3">
                <TooltipProvider>
                  <Link href="/create-item" className="hidden md:block">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button size="sm" className="bg-primary hover:bg-primary/90 text-white shadow-sm">
                          <PlusCircle className="h-4 w-4 mr-2" />
                          <span className="hidden sm:inline">Elan yerləşdir</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <p>Yeni elan əlavə et</p>
                      </TooltipContent>
                    </Tooltip>
                  </Link>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link href="/messages" className="hidden md:block">
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className={cn(
                            "rounded-full relative hover:bg-primary/5 hover:text-primary border-gray-200",
                            location === "/messages" && "border-primary/20 bg-primary/5 text-primary"
                          )}
                        >
                          <MessageCircle className="h-5 w-5" />
                          <span className="absolute -top-1 -right-1 bg-primary text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-medium">3</span>
                        </Button>
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p>Mesajlar</p>
                    </TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link href="/favorites" className="hidden md:block">
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className={cn(
                            "rounded-full hover:bg-primary/5 hover:text-primary border-gray-200",
                            location === "/favorites" && "border-primary/20 bg-primary/5 text-primary"
                          )}
                        >
                          <Heart className="h-5 w-5" />
                        </Button>
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p>Seçilmişlər</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      className={cn(
                        "rounded-full p-0 hover:bg-transparent overflow-hidden border",
                        isScrolled ? "border-gray-200" : "border-transparent hover:border-gray-200"
                      )}
                      size="sm"
                    >
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={user?.avatar || ""} />
                        <AvatarFallback className="bg-primary/10 text-primary font-medium">{userInitials}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-60 p-2">
                    <DropdownMenuLabel className="font-normal py-3">
                      <div className="flex flex-col space-y-1">
                        <p className="text-base font-medium leading-none">{user?.fullName}</p>
                        <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                      <DropdownMenuItem asChild>
                        <Link href="/profile" className="cursor-pointer">
                          <User className="h-4 w-4 mr-2" />
                          <span>Profilim</span>
                          <DropdownMenuShortcut>⇧P</DropdownMenuShortcut>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/messages" className="cursor-pointer">
                          <MessageCircle className="h-4 w-4 mr-2" />
                          <span>Mesajlar</span>
                          <Badge 
                            variant="destructive" 
                            className="ml-auto text-[10px] px-1 py-0 min-w-[18px] h-[18px] flex items-center justify-center"
                          >
                            3
                          </Badge>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/favorites" className="cursor-pointer">
                          <Heart className="h-4 w-4 mr-2" />
                          <span>Seçilmişlər</span>
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                      <DropdownMenuItem asChild>
                        <Link href="/settings" className="cursor-pointer">
                          <Settings className="h-4 w-4 mr-2" />
                          <span>Hesab parametrləri</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/support" className="cursor-pointer">
                          <HelpCircle className="h-4 w-4 mr-2" />
                          <span>Dəstək</span>
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="text-red-600 focus:text-red-600 cursor-pointer" 
                      onClick={logout}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      <span>Çıxış</span>
                      <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <div className="flex items-center gap-2 sm:gap-3">
                <Link href="/auth?tab=login" className="hidden sm:block">
                  <Button variant="ghost" size="sm" className="text-gray-700 hover:text-primary">
                    Daxil ol
                  </Button>
                </Link>
                <Link href="/auth?tab=register">
                  <Button 
                    size="sm" 
                    className="bg-primary hover:bg-primary/90 text-white transition-all relative shadow-sm"
                  >
                    <span className="hidden xs:inline">Qeydiyyat</span>
                    <span className="xs:hidden">Daxil ol</span>
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Expandable mobile search */}
      <div 
        className={cn(
          "md:hidden overflow-hidden transition-all duration-300 border-t border-gray-100",
          isSearchExpanded ? "max-h-16 py-3 opacity-100" : "max-h-0 py-0 opacity-0"
        )}
      >
        <div className="container px-4">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <input 
                ref={searchInputRef}
                type="text" 
                placeholder="Barter etmək istədiyiniz məhsul..." 
                className="w-full h-10 pl-10 pr-16 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent text-sm shadow-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <div className="absolute left-0 top-0 h-full px-3 flex items-center text-gray-500">
                <Search className="h-4 w-4" />
              </div>
              <Button 
                type="submit"
                variant="ghost" 
                size="sm" 
                className="absolute right-0 top-0 rounded-r-full h-full px-4 text-primary font-medium text-sm"
              >
                Axtar
              </Button>
            </div>
          </form>
        </div>
      </div>
    </header>
  );
}