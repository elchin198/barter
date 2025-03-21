import { Link } from "wouter";
import { Grid, Home, ChevronRight, ChevronLeft, Filter, LayoutGrid, Activity, ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import CategoryCard from "@/components/shared/category-card";
import { useEffect, useRef, useState } from 'react';
import { motion } from "framer-motion";
import Swiper from 'swiper';
import 'swiper/css';
import { cn } from "@/lib/utils";

// Display modes for categories
type DisplayMode = 'slide' | 'grid' | 'featured';

// Animation variants
const sectionVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    }
  }
};

const cardContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    }
  }
};

export default function CategoriesSection() {
  const swiperRef = useRef<HTMLDivElement>(null);
  const swiperInstanceRef = useRef<Swiper | null>(null);
  const [hasNext, setHasNext] = useState(true);
  const [hasPrev, setHasPrev] = useState(false);
  const [displayMode, setDisplayMode] = useState<DisplayMode>('slide');
  
  const { data: categories, isLoading } = useQuery({
    queryKey: ["/api/categories"],
    queryFn: async () => {
      const res = await fetch("/api/categories");
      if (!res.ok) throw new Error("Kateqoriyaları yükləmək mümkün olmadı");
      return res.json();
    }
  });

  useEffect(() => {
    if (swiperRef.current && !swiperInstanceRef.current && displayMode === 'slide') {
      const swiper = new Swiper(swiperRef.current, {
        slidesPerView: 'auto',
        spaceBetween: 16,
        freeMode: true,
        resistance: true,
        resistanceRatio: 0,
        threshold: 5,
        on: {
          slideChange: () => {
            if (swiperInstanceRef.current) {
              setHasPrev(swiperInstanceRef.current.isBeginning === false);
              setHasNext(swiperInstanceRef.current.isEnd === false);
            }
          }
        }
      });
      
      swiperInstanceRef.current = swiper;
    }
    
    return () => {
      if (swiperInstanceRef.current) {
        swiperInstanceRef.current.destroy();
        swiperInstanceRef.current = null;
      }
    };
  }, [displayMode]);

  const slideNext = () => {
    if (swiperInstanceRef.current) {
      swiperInstanceRef.current.slideNext();
    }
  };

  const slidePrev = () => {
    if (swiperInstanceRef.current) {
      swiperInstanceRef.current.slidePrev();
    }
  };

  const displayCategories = categories?.slice(0, 8) || [];
  // Random values for counts to demonstrate UI
  const mockCounts = [145, 96, 78, 210, 65, 124, 82, 93]; 
  
  // Featured categories - select a few categories to highlight
  const featuredCategories = displayCategories.slice(0, 4);

  return (
    <motion.section 
      className="py-10 md:py-16"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-20%" }}
      variants={sectionVariants}
    >
      <div className="container px-4 md:px-0">
        {/* Section header with view toggle */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              Kateqoriyalar
            </h2>
            <p className="text-gray-500 max-w-lg">
              Barter etmək istədiyin məhsulları kateqoriyalar üzrə kəşf et
            </p>
          </motion.div>
          
          <motion.div 
            className="flex items-center gap-2 mt-4 md:mt-0"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "rounded-full border-gray-200 px-3", 
                displayMode === 'slide' ? "bg-primary/5 text-primary border-primary/20" : "text-gray-500"
              )}
              onClick={() => setDisplayMode('slide')}
            >
              <Filter className="h-4 w-4 mr-1.5" />
              <span className="hidden sm:inline">Sürüşdür</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "rounded-full border-gray-200 px-3", 
                displayMode === 'grid' ? "bg-primary/5 text-primary border-primary/20" : "text-gray-500"
              )}
              onClick={() => setDisplayMode('grid')}
            >
              <LayoutGrid className="h-4 w-4 mr-1.5" />
              <span className="hidden sm:inline">Şəbəkə</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "rounded-full border-gray-200 px-3", 
                displayMode === 'featured' ? "bg-primary/5 text-primary border-primary/20" : "text-gray-500"
              )}
              onClick={() => setDisplayMode('featured')}
            >
              <Activity className="h-4 w-4 mr-1.5" />
              <span className="hidden sm:inline">Populyar</span>
            </Button>
            
            {displayMode === 'slide' && (
              <div className="flex items-center gap-2 ml-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full border-gray-200 text-gray-500 hover:text-primary"
                  onClick={slidePrev}
                  disabled={!hasPrev}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full border-gray-200 text-gray-500 hover:text-primary"
                  onClick={slideNext}
                  disabled={!hasNext}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </motion.div>
        </div>
        
        {/* Categories as slider */}
        {displayMode === 'slide' && (
          <div className="relative">
            <div className="swiper categorySlide overflow-visible" ref={swiperRef}>
              <div className="swiper-wrapper">
                {/* All categories special card */}
                <div className="swiper-slide" style={{ width: 'auto' }}>
                  <Link href="/search">
                    <motion.div 
                      className="flex flex-col items-center justify-center bg-gradient-to-b from-primary/90 to-primary rounded-[20px] p-2 h-[90px] w-[75px] text-center shadow-sm hover:shadow-md cursor-pointer transition-all"
                      whileHover={{ y: -5, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' }}
                    >
                      <motion.div 
                        className="bg-white/20 backdrop-blur-sm w-12 h-12 rounded-full flex items-center justify-center mb-2"
                        whileHover={{ scale: 1.1, rotate: 5 }}
                      >
                        <Home className="h-5 w-5 text-white" />
                      </motion.div>
                      <p className="text-[11px] font-medium text-white">
                        Hamısı
                      </p>
                    </motion.div>
                  </Link>
                </div>

                {/* Category cards or skeleton loaders */}
                {isLoading ? (
                  Array(8).fill(0).map((_, index) => (
                    <div key={index} className="swiper-slide" style={{ width: 'auto' }}>
                      <div className="flex flex-col items-center">
                        <Skeleton className="h-12 w-12 rounded-full mb-2" />
                        <Skeleton className="h-3 w-14" />
                      </div>
                    </div>
                  ))
                ) : (
                  displayCategories.map((category: any, index: number) => (
                    <div key={category.name} className="swiper-slide" style={{ width: 'auto' }}>
                      <CategoryCard 
                        category={category} 
                        variant="slide" 
                        size="md"
                        index={index}
                      />
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Categories as grid */}
        {displayMode === 'grid' && (
          <motion.div 
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6"
            variants={cardContainerVariants}
          >
            {/* All categories special card */}
            <motion.div 
              whileHover={{ y: -8, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Link href="/search">
                <div className="bg-gradient-to-br from-primary/90 to-primary rounded-xl p-4 md:p-6 text-white h-full flex flex-col items-center justify-center shadow-md transition-all duration-200">
                  <motion.div 
                    className="bg-white/20 w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center backdrop-blur-sm mb-3"
                    whileHover={{ scale: 1.15, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 300, damping: 10 }}
                  >
                    <Home className="h-6 w-6 text-white" />
                  </motion.div>
                  <h3 className="font-semibold text-center">Bütün kateqoriyalar</h3>
                  <span className="text-xs text-white/80 mt-1">
                    Bütün elanlar
                  </span>
                </div>
              </Link>
            </motion.div>
            
            {/* Category cards or skeleton loaders */}
            {isLoading ? (
              Array(8).fill(0).map((_, index) => (
                <div key={index} className="flex flex-col items-center justify-center p-6 rounded-xl border border-gray-100 shadow-sm">
                  <Skeleton className="h-16 w-16 rounded-full mb-3" />
                  <Skeleton className="h-4 w-24 mb-1" />
                  <Skeleton className="h-3 w-12" />
                </div>
              ))
            ) : (
              displayCategories.map((category: any, index: number) => (
                <div key={category.name}>
                  <CategoryCard 
                    category={category} 
                    variant="grid" 
                    size="md"
                    showCount={true}
                    count={mockCounts[index]}
                    index={index}
                    isPopular={index === 1 || index === 4}
                    isNew={index === 2}
                  />
                </div>
              ))
            )}
          </motion.div>
        )}
        
        {/* Featured categories */}
        {displayMode === 'featured' && (
          <motion.div 
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6"
            variants={cardContainerVariants}
          >
            {isLoading ? (
              Array(4).fill(0).map((_, index) => (
                <div key={index} className="flex flex-col h-[200px] p-6 rounded-xl border border-gray-100 shadow-sm">
                  <Skeleton className="h-12 w-12 rounded-full mb-3" />
                  <div className="mt-auto">
                    <Skeleton className="h-5 w-24 mb-2" />
                    <Skeleton className="h-4 w-16 mb-3" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </div>
              ))
            ) : (
              // First two cards as large cards
              <>
                <div className="sm:col-span-2 row-span-2">
                  {featuredCategories.length > 0 && (
                    <CategoryCard 
                      category={featuredCategories[0]} 
                      variant="featured" 
                      size="lg"
                      showCount={true}
                      count={mockCounts[0]}
                      index={0}
                      isPopular={true}
                    />
                  )}
                </div>
                
                {/* Remaining cards in a grid */}
                {featuredCategories.slice(1).map((category: any, index: number) => (
                  <div key={category.name} className={(index === 0) ? "md:col-span-2" : ""}>
                    <CategoryCard 
                      category={category} 
                      variant="featured" 
                      size="md"
                      showCount={true}
                      count={mockCounts[index+1]}
                      index={index+1}
                      isNew={index === 1}
                    />
                  </div>
                ))}
              </>
            )}
          </motion.div>
        )}
        
        {/* View all categories button */}
        <motion.div 
          className="mt-8 flex justify-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Link href="/categories">
            <Button 
              variant="outline" 
              className="group px-6 py-2 rounded-full border-gray-200 hover:border-primary/30 hover:bg-primary/5"
            >
              Bütün kateqoriyaları göstər
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </motion.section>
  );
}