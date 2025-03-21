import { Link, useLocation } from "wouter";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { 
  Heart, 
  MapPin, 
  Clock, 
  Tag, 
  RefreshCw, 
  Badge as BadgeIcon, 
  Eye, 
  MessageCircle,
  ArrowRight 
} from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface ItemCardProps {
  item: {
    id: number;
    title: string;
    category: string;
    subcategory?: string;
    wantedExchange: string;
    status: 'active' | 'pending' | 'completed' | 'inactive';
    location: string;
    createdAt: string;
    image?: string;
    description?: string;
    price?: number;
    user?: {
      id: number;
      username: string;
      avatar?: string;
    };
  };
  isFavorite?: boolean;
  variant?: 'default' | 'horizontal' | 'featured';
  loading?: boolean;
}

export default function ItemCard({ 
  item, 
  isFavorite = false, 
  variant = 'default',
  loading = false 
}: ItemCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [isTitleTruncated, setIsTitleTruncated] = useState(false);
  
  // Check if the title is truncated
  useEffect(() => {
    if (titleRef.current) {
      setIsTitleTruncated(
        titleRef.current.scrollWidth > titleRef.current.clientWidth
      );
    }
  }, [item.title]);

  // Format date to relative time
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMinutes = Math.floor(diffTime / (1000 * 60));
        return `${diffMinutes} dəqiqə əvvəl`;
      }
      return `${diffHours} saat əvvəl`;
    } else if (diffDays === 1) {
      return 'Dünən';
    } else if (diffDays < 7) {
      return `${diffDays} gün əvvəl`;
    } else {
      return date.toLocaleDateString('az-AZ');
    }
  };

  // Get status badge styling
  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'active':
        return {
          bg: 'bg-green-50',
          text: 'text-green-700',
          border: 'border-green-200',
          label: 'Aktiv'
        };
      case 'pending':
        return {
          bg: 'bg-yellow-50',
          text: 'text-yellow-700',
          border: 'border-yellow-200',
          label: 'Gözləmədə'
        };
      case 'completed':
        return {
          bg: 'bg-blue-50',
          text: 'text-blue-700',
          border: 'border-blue-200',
          label: 'Tamamlanıb'
        };
      default:
        return {
          bg: 'bg-gray-50',
          text: 'text-gray-700',
          border: 'border-gray-200',
          label: 'Deaktiv'
        };
    }
  };

  const statusBadge = getStatusBadge(item.status);

  const toggleFavoriteMutation = useMutation({
    mutationFn: async () => {
      if (!isAuthenticated || !user) {
        throw new Error("Seçilmişlərə əlavə etmək üçün daxil olun");
      }
      
      if (isFavorite) {
        // Remove from favorites
        const response = await apiRequest("DELETE", `/api/favorites/${item.id}`);
        return await response.json();
      } else {
        // Add to favorites
        const response = await apiRequest("POST", "/api/favorites", { itemId: item.id });
        return await response.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/items/${item.id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
      
      toast({
        title: isFavorite ? "Seçilmişlərdən silindi" : "Seçilmişlərə əlavə edildi",
        description: isFavorite 
          ? "Elan seçilmişlərdən silindi" 
          : "Elan seçilmişlərə əlavə edildi",
      });
    },
    onError: (error: any) => {
      if (error.message === "Seçilmişlərə əlavə etmək üçün daxil olun") {
        toast({
          variant: "destructive",
          title: "Daxil olmaq lazımdır",
          description: "Seçilmişlərə əlavə etmək üçün əvvəlcə hesabınıza daxil olun.",
        });
        setLocation("/login");
      } else {
        toast({
          variant: "destructive",
          title: "Xəta baş verdi",
          description: error.message || "Əməliyyat zamanı xəta baş verdi",
        });
      }
    },
  });

  // Render loading skeleton
  if (loading) {
    if (variant === 'horizontal') {
      return (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="w-full md:w-1/3 h-48 md:h-auto">
              <Skeleton className="w-full h-full rounded-lg" />
            </div>
            <div className="w-full md:w-2/3 space-y-4">
              <Skeleton className="h-7 w-3/4" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-20" />
              </div>
              <Skeleton className="h-24 w-full" />
              <div className="flex gap-3">
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-32" />
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    if (variant === 'featured') {
      return (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <Skeleton className="w-full h-64" />
          <div className="p-4 space-y-3">
            <Skeleton className="h-6 w-4/5" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-4 w-1/4" />
            </div>
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      );
    }
    
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <Skeleton className="w-full h-48" />
        <div className="p-4 space-y-3">
          <Skeleton className="h-6 w-4/5" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
          </div>
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    );
  }

  // Horizontal variant
  if (variant === 'horizontal') {
    return (
      <div
        className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="flex flex-col md:flex-row">
          <div className="relative w-full md:w-2/5 lg:w-1/3">
            <div className="relative pb-[70%] md:pb-0 md:h-full">
              <Link href={`/item/${item.id}`} className="absolute inset-0 block">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.title}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500 ease-in-out"
                  />
                ) : (
                  <div className="absolute inset-0 w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
                    <Tag className="w-10 h-10 text-gray-300" />
                  </div>
                )}
                
                <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent md:bg-gradient-to-t md:from-black/40 md:via-transparent md:to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Link>
              
              {/* Category badge */}
              <Badge className="absolute top-3 left-3 bg-primary/90 hover:bg-primary text-xs font-medium text-white border-none">
                <BadgeIcon className="w-3 h-3 mr-1" />
                {item.category}
              </Badge>
              
              {/* Status badge */}
              <Badge variant="outline" className={`absolute bottom-3 left-3 ${statusBadge.bg} ${statusBadge.text} text-xs font-medium border ${statusBadge.border}`}>
                {statusBadge.label}
              </Badge>
            </div>
          </div>
          
          <div className="p-5 flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between mb-2">
                <Link href={`/item/${item.id}`} className="block">
                  <h3 
                    ref={titleRef}
                    className="font-semibold text-xl text-gray-800 group-hover:text-primary transition-colors duration-200 truncate max-w-xs"
                    title={isTitleTruncated ? item.title : undefined}
                  >
                    {item.title}
                  </h3>
                </Link>
                
                <Button
                  variant="outline"
                  size="icon"
                  className={`ml-2 h-8 w-8 ${
                    isFavorite ? "text-red-500 border-red-200" : "text-gray-400 hover:text-red-500"
                  }`}
                  onClick={() => toggleFavoriteMutation.mutate()}
                  disabled={toggleFavoriteMutation.isPending}
                >
                  <Heart className={`h-4 w-4 ${isFavorite ? "fill-current" : ""}`} />
                </Button>
              </div>
              
              <div className="flex items-center gap-3 text-xs text-gray-500 mb-4 flex-wrap">
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  <span>{item.location}</span>
                </div>
                
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{formatDate(item.createdAt)}</span>
                </div>
                
                {item.user && (
                  <div className="flex items-center gap-1">
                    {item.user.avatar ? (
                      <img src={item.user.avatar} alt={item.user.username} className="w-4 h-4 rounded-full" />
                    ) : (
                      <div className="w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[8px] uppercase">
                        {item.user.username.charAt(0)}
                      </div>
                    )}
                    <span>{item.user.username}</span>
                  </div>
                )}
              </div>
              
              {item.description && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {item.description}
                </p>
              )}
              
              <div className="bg-primary/5 rounded-lg p-3 mb-4 border border-primary/10 group-hover:border-primary/20 transition-colors duration-200">
                <div className="flex items-center gap-2 text-gray-800">
                  <RefreshCw className="w-4 h-4 text-primary" />
                  <p className="text-sm font-medium">Dəyişdirəcəm:</p>
                </div>
                <p className="text-sm text-gray-600 pl-6 truncate">{item.wantedExchange}</p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Link href={`/item/${item.id}`} className="flex-1">
                <Button variant="default" className="w-full">
                  Ətraflı bax
                </Button>
              </Link>
              
              {item.status === 'active' && (
                <Link href={`/make-offer/${item.id}`} className="flex-1">
                  <Button variant="outline" className="w-full">
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Təklif et
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Featured variant (larger card with more details)
  if (variant === 'featured') {
    return (
      <div
        className="bg-white rounded-xl border border-gray-100 shadow hover:shadow-lg transition-all duration-300 overflow-hidden group h-full flex flex-col"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative pb-[60%]">
          <Link href={`/item/${item.id}`} className="absolute inset-0">
            {item.image ? (
              <img
                src={item.image}
                alt={item.title}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500 ease-in-out"
              />
            ) : (
              <div className="absolute inset-0 w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
                <Tag className="w-12 h-12 text-gray-300" />
              </div>
            )}
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent transition-opacity duration-300"></div>
            
            {/* Featured label with glow effect */}
            <div className="absolute top-4 right-4">
              <div className="relative">
                <div className="absolute -inset-3 bg-primary/20 blur-lg rounded-full"></div>
                <Badge className="relative bg-gradient-to-r from-primary to-primary/80 hover:from-primary hover:to-primary text-white border-none px-3 py-1.5 text-xs font-semibold shadow-lg">
                  Seçilmiş
                </Badge>
              </div>
            </div>
            
            {/* Bottom gradient for text readability */}
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/80 to-transparent"></div>
            
            {/* Title on the image */}
            <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
              <h3 className="font-semibold text-xl mb-2 text-white line-clamp-2">
                {item.title}
              </h3>
              <div className="flex items-center gap-3 text-xs text-gray-200">
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  <span>{item.location}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{formatDate(item.createdAt)}</span>
                </div>
              </div>
            </div>
          </Link>
        </div>
        
        <div className="p-4 flex-grow">
          <div className="bg-primary/5 rounded-lg p-3 mb-4 border border-primary/10 group-hover:border-primary/20 transition-colors duration-200">
            <div className="flex items-center gap-2 text-gray-800">
              <RefreshCw className="w-4 h-4 text-primary" />
              <p className="text-sm font-medium">Dəyişdirəcəm:</p>
            </div>
            <p className="text-sm text-gray-600 pl-6 truncate">{item.wantedExchange}</p>
          </div>
          
          {item.description && (
            <p className="text-sm text-gray-600 mb-4 line-clamp-2">
              {item.description}
            </p>
          )}
          
          {item.user && (
            <div className="flex items-center mb-4">
              {item.user.avatar ? (
                <img 
                  src={item.user.avatar} 
                  alt={item.user.username} 
                  className="w-8 h-8 rounded-full mr-2 border-2 border-white shadow-sm" 
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs uppercase mr-2 border-2 border-white shadow-sm">
                  {item.user.username.charAt(0)}
                </div>
              )}
              <div>
                <p className="text-xs text-gray-500">İstifadəçi</p>
                <p className="text-sm font-medium">{item.user.username}</p>
              </div>
            </div>
          )}
        </div>
        
        <div className="p-4 pt-0 mt-auto">
          <div className="flex items-center justify-between mb-3">
            <Badge variant="outline" className={`${statusBadge.bg} ${statusBadge.text} text-xs font-medium border ${statusBadge.border}`}>
              {statusBadge.label}
            </Badge>
            
            <Button
              variant="ghost"
              size="icon"
              className={`${
                isFavorite ? "text-red-500" : "text-gray-400 hover:text-red-500"
              }`}
              onClick={() => toggleFavoriteMutation.mutate()}
              disabled={toggleFavoriteMutation.isPending}
            >
              <Heart className={`h-5 w-5 ${isFavorite ? "fill-current" : ""}`} />
            </Button>
          </div>
          
          <Link href={`/item/${item.id}`}>
            <Button variant="default" className="w-full group relative overflow-hidden">
              <span className="relative z-10 flex items-center justify-center w-full transition-transform duration-300 group-hover:-translate-x-2">
                Ətraflı bax
                <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </span>
            </Button>
          </Link>
        </div>
      </div>
    );
  }
  
  // Default card variant
  return (
    <div
      className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden hover:-translate-y-1 group h-full flex flex-col"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative pb-[70%]">
        <Link href={`/item/${item.id}`} className="absolute inset-0">
          {item.image ? (
            <img
              src={item.image}
              alt={item.title}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-in-out"
            />
          ) : (
            <div className="absolute inset-0 w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
              <Tag className="w-10 h-10 text-gray-300" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </Link>
        
        {/* Category badge */}
        <Badge className="absolute top-3 left-3 bg-primary/90 hover:bg-primary text-xs font-medium text-white border-none">
          <BadgeIcon className="w-3 h-3 mr-1" />
          {item.category}
        </Badge>
        
        {/* Status badge */}
        <Badge variant="outline" className={`absolute bottom-3 left-3 ${statusBadge.bg} ${statusBadge.text} text-xs font-medium border ${statusBadge.border}`}>
          {statusBadge.label}
        </Badge>
        
        {/* Quick action buttons that appear on hover */}
        <div className={`absolute right-3 top-3 flex flex-col gap-2 transition-all duration-300 ${isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-5'}`}>
          <Button
            variant="secondary"
            size="icon"
            className={`shadow-md backdrop-blur-sm bg-white/80 hover:bg-white w-9 h-9 rounded-full ${
              isFavorite ? "text-red-500" : "text-gray-600 hover:text-red-500"
            }`}
            onClick={() => toggleFavoriteMutation.mutate()}
            disabled={toggleFavoriteMutation.isPending}
          >
            <Heart className={`h-5 w-5 ${isFavorite ? "fill-current" : ""}`} />
          </Button>
          
          <Link href={`/item/${item.id}`}>
            <Button
              variant="secondary"
              size="icon"
              className="shadow-md backdrop-blur-sm bg-white/80 hover:bg-white w-9 h-9 rounded-full text-gray-600 hover:text-primary"
            >
              <Eye className="h-5 w-5" />
            </Button>
          </Link>
          
          {item.status === 'active' && (
            <Link href={`/make-offer/${item.id}`}>
              <Button
                variant="secondary"
                size="icon"
                className="shadow-md backdrop-blur-sm bg-white/80 hover:bg-white w-9 h-9 rounded-full text-gray-600 hover:text-primary"
              >
                <MessageCircle className="h-5 w-5" />
              </Button>
            </Link>
          )}
        </div>
      </div>
      
      <div className="p-4 flex-grow flex flex-col">
        <Link href={`/item/${item.id}`} className="block flex-grow">
          <h3 
            ref={titleRef}
            className="font-semibold text-lg mb-2 line-clamp-2 text-gray-800 group-hover:text-primary transition-colors duration-200"
            title={isTitleTruncated ? item.title : undefined}
          >
            {item.title}
          </h3>
          
          <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
            <MapPin className="w-3 h-3" /> 
            <span className="truncate max-w-[100px]">{item.location}</span>
            <span className="mx-1">•</span>
            <Clock className="w-3 h-3" /> 
            <span>{formatDate(item.createdAt)}</span>
          </div>
          
          <div className="bg-primary/5 rounded-lg p-3 mb-3 border border-primary/10 group-hover:border-primary/20 transition-colors duration-200">
            <div className="flex items-center gap-2 text-gray-800">
              <RefreshCw className="w-4 h-4 text-primary" />
              <p className="text-sm font-medium">Dəyişdirəcəm:</p>
            </div>
            <p className="text-sm text-gray-600 pl-6 truncate">{item.wantedExchange}</p>
          </div>
        </Link>
        
        <div className="pt-3 border-t border-gray-100 mt-auto">
          <Link href={`/item/${item.id}`}>
            <Button 
              variant="outline" 
              className="w-full group-hover:bg-primary group-hover:text-white transition-colors duration-200"
            >
              Ətraflı bax
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
