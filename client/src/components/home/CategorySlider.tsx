import React, { useRef, useEffect, useState } from 'react';
import { Link } from 'wouter';
import { Navigation } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';

interface Category {
  id?: number;
  name: string;
  icon: React.ReactNode | string;
}

// Default categories with icons
const DEFAULT_CATEGORIES: Category[] = [
  {
    name: 'Hamısı',
    icon: '/icons/category-all.svg',
  },
  {
    name: 'Elektronika',
    icon: '/icons/category-electronics.svg',
  },
  {
    name: 'Kitablar',
    icon: '/icons/category-books.svg',
  },
  {
    name: 'Geyim',
    icon: '/icons/category-clothing.svg',
  },
  {
    name: 'Maşınlar',
    icon: '/icons/category-vehicles.svg',
  },
  {
    name: 'Daşınmaz Əmlak',
    icon: '/icons/category-real-estate.svg',
  },
  {
    name: 'Bağ',
    icon: '/icons/category-garden.svg',
  },
  {
    name: 'Oyunlar',
    icon: '/icons/category-games.svg',
  },
  {
    name: 'Mebel',
    icon: '/icons/category-furniture.svg',
  },
  {
    name: 'İdman',
    icon: '/icons/category-sports.svg',
  },
  {
    name: 'Xidmətlər',
    icon: '/icons/category-services.svg',
  }
];

export default function CategorySlider() {
  const [swiperInstance, setSwiperInstance] = useState<any>(null);
  const [isBeginning, setIsBeginning] = useState(true);
  const [isEnd, setIsEnd] = useState(false);
  const prevRef = useRef<HTMLButtonElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);

  return (
    <section className="bg-white pt-4 pb-8 relative">
      <div className="container mx-auto px-4">
        <div className="relative">
          {/* Navigation buttons */}
          <div className="absolute right-2 top-0 z-10 flex gap-2 mb-4 md:mb-0">
            <Button
              ref={prevRef}
              variant="outline"
              size="icon"
              className={`rounded-full border-gray-200 ${isBeginning ? 'text-gray-300' : 'text-gray-500 hover:text-blue-600'}`}
              onClick={() => swiperInstance?.slidePrev()}
              disabled={isBeginning}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              ref={nextRef}
              variant="outline"
              size="icon"
              className={`rounded-full border-gray-200 ${isEnd ? 'text-gray-300' : 'text-gray-500 hover:text-blue-600'}`}
              onClick={() => swiperInstance?.slideNext()}
              disabled={isEnd}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Swiper */}
          <Swiper
            modules={[Navigation]}
            spaceBetween={16}
            slidesPerView="auto"
            freeMode={true}
            grabCursor={true}
            onSwiper={setSwiperInstance}
            onSlideChange={(swiper) => {
              setIsBeginning(swiper.isBeginning);
              setIsEnd(swiper.isEnd);
            }}
            className="mt-4"
          >
            {DEFAULT_CATEGORIES.map((category, index) => (
              <SwiperSlide key={index} style={{ width: 'auto' }}>
                <Link href={index === 0 ? "/items" : `/items?category=${encodeURIComponent(category.name)}`}>
                  <div className="flex flex-col items-center">
                    <div className={`w-16 h-16 rounded-full ${index === 0 ? 'bg-blue-50' : 'bg-gray-50'} flex items-center justify-center mb-2 hover:bg-blue-100 transition-colors duration-300`}>
                      {typeof category.icon === 'string' ? (
                        <img 
                          src={category.icon} 
                          alt={category.name} 
                          className="w-8 h-8"
                          onError={(e) => {
                            // If image fails to load, show fallback icon
                            const target = e.target as HTMLImageElement;
                            target.src = 'https://placehold.co/32x32/667eea/ffffff?text=' + category.name.charAt(0);
                          }}
                        />
                      ) : (
                        category.icon
                      )}
                    </div>
                    <span className="text-xs font-medium text-center line-clamp-1 max-w-[80px]">{category.name}</span>
                  </div>
                </Link>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
    </section>
  );
}