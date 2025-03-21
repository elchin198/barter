import { Link, useLocation } from "wouter";
import { Home, Search, PlusCircle, Heart, User, MessageCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

export default function MobileNavigation() {
  const [location] = useLocation();
  const { user } = useAuth();
  const isAuthenticated = !!user;

  if (!isAuthenticated && (location === "/login" || location === "/register")) {
    return null;
  }

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-2 z-40">
      <div className="flex justify-between items-center">
        <NavItem href="/" icon={Home} label="Ana səhifə" isActive={location === "/"} />
        <NavItem href="/search" icon={Search} label="Axtarış" isActive={location === "/search"} />
        <NavItem href="/create-item" icon={PlusCircle} label="Əlavə et" isActive={location === "/create-item"} isPrimary />
        <NavItem 
          href={isAuthenticated ? "/messages" : "/auth"} 
          icon={MessageCircle} 
          label="Mesajlar" 
          isActive={location.startsWith("/messages")} 
        />
        <NavItem 
          href={isAuthenticated ? `/profile/${user?.id || ""}` : "/auth"} 
          icon={User} 
          label="Profil" 
          isActive={location.startsWith("/profile")} 
        />
      </div>
    </div>
  );
}

function NavItem({ 
  href, 
  icon: Icon, 
  label, 
  isActive, 
  isPrimary
}: { 
  href: string; 
  icon: React.ElementType; 
  label: string; 
  isActive: boolean;
  isPrimary?: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center w-16">
      <Link href={href}>
        <div className={cn(
          "flex items-center justify-center w-10 h-10 rounded-full mb-1",
          isPrimary 
            ? "bg-[#3377FF] text-white" 
            : isActive 
              ? "text-[#3377FF]" 
              : "text-gray-500"
        )}>
          <Icon className="h-5 w-5" />
        </div>
        <span className={cn(
          "text-xs text-center",
          isActive ? "text-[#3377FF] font-medium" : "text-gray-500"
        )}>
          {label}
        </span>
      </Link>
    </div>
  );
}