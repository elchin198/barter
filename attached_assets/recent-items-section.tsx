import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState, useRef } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ItemCard from "@/components/shared/item-card";
import { 
  ArrowRight, 
  Clock, 
  Sparkles, 
  TrendingUp, 
  Zap, 
  Filter, 
  Plus, 
  RefreshCcw,
  ChevronRight,
  ChevronLeft
} from "lucide-react";
import { cn } from "@/lib/utils";

// Sample category filters (replace with actual data from backend in production)
const CATEGORIES = [
  { id: 'all', name: 'Hamısı', count: 100 },
  { id: 'electronics', name: 'Elektronika', count: 32 },
  { id: 'clothing', name: 'Geyim', count: 25 },
  { id: 'furniture', name: 'Mebel', count: 18 },
  { id: 'auto', name: 'Avtomobil', count: 15 },
  { id: 'realestate', name: 'Daşınmaz əmlak', count: 10 },
];

export default function RecentItemsSection() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [visibleItems, setVisibleItems] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [staggerLoad, setStaggerLoad] = useState(false);
  const filtersRef = useRef<HTMLDivElement>(null);
  const itemsPerPage = 6;
  
  // Query for items
  const { data: items, isLoading } = useQuery({
    queryKey: ["/api/items/recent"],
    queryFn: async () => {
      const res = await fetch("/api/items/recent");
      if (!res.ok) throw new Error("Son elanları yükləmək mümkün olmadı");
      return res.json();
    }
  });
  
  // Scroll filters horizontally
  const scrollFilters = (direction: 'left' | 'right') => {
    if (filtersRef.current) {
      const scrollAmount = direction === 'left' ? -200 : 200;
      filtersRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };
  
  // Filter items based on active category
  useEffect(() => {
    if (!items) return;
    
    // Reset pagination when filter changes
    setCurrentPage(1);
    
    // Filter items by category (if not 'all')
    const filtered = activeFilter === 'all' 
      ? items 
      : items.filter((item: any) => item.category === activeFilter);
    
    // Reset items without animation
    setStaggerLoad(false);
    setVisibleItems([]);
    
    // Simulate server delay
    const timer = setTimeout(() => {
      setStaggerLoad(true);
      const startIndex = 0;
      const endIndex = Math.min(itemsPerPage, filtered.length);
      setVisibleItems(filtered.slice(startIndex, endIndex));
    }, 300);
    
    return () => clearTimeout(timer);
  }, [items, activeFilter]);
  
  // Handle pagination
  const handleLoadMore = () => {
    if (!items) return;
    
    // Filter items by category
    const filtered = activeFilter === 'all' 
      ? items 
      : items.filter((item: any) => item.category === activeFilter);
    
    const startIndex = currentPage * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, filtered.length);
    
    if (startIndex < filtered.length) {
      setCurrentPage(prev => prev + 1);
      
      // Enable stagger animation
      setStaggerLoad(true);
      
      // Append new items to visible items
      setVisibleItems(prev => [...prev, ...filtered.slice(startIndex, endIndex)]);
    }
  };
  
  // Generate random featured item index for nicer display
  const featuredIndex = items && items.length > 0 ? Math.floor(Math.random() * Math.min(items.length, 3)) : 0;
  
  // Check if there are more items to load
  const hasMoreItems = items && activeFilter === 'all' 
    ? visibleItems.length < items.length
    : items && visibleItems.length < items.filter((item: any) => item.category === activeFilter).length;

  return (
    <section className="relative py-16 md:py-24">
      {/* Background design elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl opacity-70 z-0"></div>
        <div className="absolute top-1/3 -left-48 w-96 h-96 bg-purple-100 rounded-full blur-3xl opacity-60 z-0"></div>
        <div className="absolute -bottom-40 right-1/4 w-80 h-80 bg-blue-50 rounded-full blur-3xl opacity-60 z-0"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-5xl max-h-5xl">
          <div className="absolute inset-0 bg-gradient-radial from-primary/5 to-transparent opacity-30 z-0 rounded-full blur-2xl"></div>
        </div>
      </div>
      
      <div className="container px-4 md:px-6 relative z-10">
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-10 md:mb-16">
          <div className="text-left max-w-2xl mb-6 md:mb-0">
            <div className="flex items-center gap-2 text-primary mb-4">
              <div className="relative">
                <div className="absolute -inset-1 bg-primary/20 rounded-full blur-sm"></div>
                <Sparkles className="h-5 w-5 text-primary relative z-10" />
              </div>
              <span className="text-sm font-medium tracking-wide uppercase">Yeni əlavə edilənlər</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
              İstədiyiniz elanları <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-600">kəşf edin</span>
            </h2>
            <p className="text-gray-600 max-w-lg">
              Platformaya yenicə əlavə edilmiş elanları kəşf edin və maraqlı dəyişdirmə təklifləri edin
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Link href="/create-item">
              <Button variant="default" size="lg" className="group">
                <Plus className="mr-2 h-4 w-4" />
                <span>Yeni elan</span>
              </Button>
            </Link>
            
            <Link href="/search">
              <Button variant="outline" size="lg" className="group border-primary text-primary hover:bg-primary hover:text-white">
                <span>Bütün elanlar</span>
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>
        
        {/* Category filters */}
        <div className="relative mb-8">
          <div className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 rounded-full shadow-sm bg-white text-gray-500"
              onClick={() => scrollFilters('left')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 rounded-full shadow-sm bg-white text-gray-500"
              onClick={() => scrollFilters('right')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          <div 
            ref={filtersRef}
            className="flex items-center gap-2 overflow-x-auto hide-scrollbar py-2 px-6"
            style={{ scrollBehavior: 'smooth' }}
          >
            {CATEGORIES.map(category => (
              <Button
                key={category.id}
                variant={activeFilter === category.id ? "default" : "outline"}
                size="sm"
                className={cn(
                  "rounded-full whitespace-nowrap transition-all",
                  activeFilter === category.id 
                    ? "border-none shadow" 
                    : "border-gray-200 text-gray-600 hover:border-primary/50 hover:text-primary"
                )}
                onClick={() => setActiveFilter(category.id)}
              >
                {category.name}
                <Badge variant="secondary" className="ml-2 bg-white/20 hover:bg-white/20">
                  {category.count}
                </Badge>
              </Button>
            ))}
          </div>
        </div>
        
        {/* Items grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {Array(6).fill(0).map((_, index) => (
              <ItemCard key={index} item={{} as any} loading={true} />
            ))}
          </div>
        ) : visibleItems.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {visibleItems.map((item: any, index: number) => {
                // Calculate delay based on index
                const delay = staggerLoad ? `${(index % 3) * 150}ms` : '0ms';
                
                // For the featured item (only in first batch)
                const isFeatured = index === featuredIndex && currentPage === 1;
                
                return (
                  <div 
                    key={item.id} 
                    className={cn(
                      "transform transition-all",
                      staggerLoad && "animate-fadeIn",
                      index % 3 === 0 ? "lg:-translate-y-4" : "",
                      index % 3 === 2 ? "lg:translate-y-4" : ""
                    )}
                    style={{ 
                      animationDelay: delay,
                      opacity: staggerLoad ? 0 : 1
                    }}
                  >
                    {isFeatured ? (
                      <div className="relative">
                        <div className="absolute -inset-1.5 bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-2xl blur-lg opacity-70 -z-10"></div>
                        <ItemCard 
                          item={item} 
                          variant="featured"
                        />
                      </div>
                    ) : (
                      <ItemCard item={item} />
                    )}
                  </div>
                );
              })}
            </div>
            
            {/* Load more or see all */}
            <div className="mt-12 flex flex-col items-center justify-center">
              {hasMoreItems ? (
                <Button 
                  variant="outline" 
                  onClick={handleLoadMore}
                  className="group border-primary/30 text-primary hover:bg-primary/5"
                >
                  <RefreshCcw className="mr-2 h-4 w-4 group-hover:rotate-180 transition-transform duration-300" />
                  Daha çox göstər
                </Button>
              ) : (
                <>
                  <div className="flex items-center justify-center gap-2 mb-4 text-gray-500">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-sm">Daha çox elan tezliklə əlavə olunacaq</span>
                  </div>
                  <Link href="/search">
                    <Button className="bg-primary hover:bg-primary/90 text-white">
                      Bütün elanları göstər
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="relative w-16 h-16 mx-auto mb-4">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-lg opacity-70"></div>
              <div className="relative z-10 w-full h-full flex items-center justify-center">
                <Zap className="h-8 w-8 text-primary" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-3">Hazırda heç bir elan yoxdur</h3>
            <p className="text-gray-500 max-w-md mx-auto mb-6">
              Platformada hələ ki heç bir elan mövcud deyil. İlk elanı siz əlavə edə bilərsiniz!
            </p>
            <Link href="/create-item">
              <Button className="bg-primary hover:bg-primary/90 text-white">
                İlk elanı siz əlavə edin
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        )}
      </div>
      
      {/* Featured bar at bottom */}
      <div className="mt-20 border-t border-b border-gray-100 bg-gradient-to-r from-gray-50 via-white to-gray-50">
        <div className="container px-4 md:px-6 py-4">
          <div className="flex items-center justify-between overflow-x-auto hide-scrollbar">
            <div className="flex items-center gap-2 text-primary whitespace-nowrap px-4">
              <Filter className="h-4 w-4" />
              <span className="text-sm font-medium">Populyar kateqoriyalar:</span>
            </div>
            
            {['Elektronika', 'Geyim', 'Mebel', 'Avtomobil', 'Daşınmaz əmlak', 'İdman', 'Kitablar'].map((cat, index) => (
              <Link key={index} href={`/category/${cat.toLowerCase()}`}>
                <Badge 
                  variant="outline" 
                  className="whitespace-nowrap rounded-full px-3 py-1 border-gray-200 text-gray-600 hover:border-primary/30 hover:text-primary hover:bg-primary/5 cursor-pointer mx-1"
                >
                  {cat}
                </Badge>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}