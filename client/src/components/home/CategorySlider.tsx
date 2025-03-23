import React, { useRef, useEffect, useState } from 'react';
import { Link } from 'wouter';
import { Navigation } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import { 
  ChevronLeft, 
  ChevronRight,
  Layers,
  Smartphone, 
  BookOpen, 
  Shirt,
  Car, 
  Home, 
  Flower, 
  Gamepad2,
  Sofa,
  Dumbbell, 
  Briefcase 
} from 'lucide-react';
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
    icon: <Layers className="w-7 h-7 text-blue-600" />,
  },
  {
    name: 'Elektronika',
    icon: <Smartphone className="w-7 h-7 text-indigo-600" />,
  },
  {
    name: 'Kitablar',
    icon: <BookOpen className="w-7 h-7 text-amber-600" />,
  },
  {
    name: 'Geyim',
    icon: <Shirt className="w-7 h-7 text-pink-600" />,
  },
  {
    name: 'Maşınlar',
    icon: <Car className="w-7 h-7 text-red-600" />,
  },
  {
    name: 'Daşınmaz Əmlak',
    icon: <Home className="w-7 h-7 text-green-600" />,
  },
  {
    name: 'Bağ',
    icon: <Flower className="w-7 h-7 text-emerald-600" />,
  },
  {
    name: 'Oyunlar',
    icon: <Gamepad2 className="w-7 h-7 text-purple-600" />,
  },
  {
    name: 'Mebel',
    icon: <Sofa className="w-7 h-7 text-orange-600" />,
  },
  {
    name: 'İdman',
    icon: <Dumbbell className="w-7 h-7 text-blue-700" />,
  },
  {
    name: 'Xidmətlər',
    icon: <Briefcase className="w-7 h-7 text-gray-700" />,
  }
];

export default function CategorySlider() {
  const [swiperInstance, setSwiperInstance] = useState<any>(null);
  const [isBeginning, setIsBeginning] = useState(true);
  const [isEnd, setIsEnd] = useState(false);
  const prevRef = useRef<HTMLButtonElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);

  return (
    <section className="bg-white pt-6 pb-10 relative">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Populyar Kateqoriyalar</h2>
          
          {/* Navigation buttons */}
          <div className="flex gap-2">
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
                <div className="flex flex-col items-center group">
                  <div 
                    className={`w-20 h-20 rounded-xl ${
                      index === 0 
                        ? 'bg-blue-100' 
                        : index % 5 === 1 
                          ? 'bg-indigo-100' 
                          : index % 5 === 2 
                            ? 'bg-green-100' 
                            : index % 5 === 3 
                              ? 'bg-amber-100' 
                              : 'bg-rose-100'
                    } flex items-center justify-center mb-3 
                    shadow-sm group-hover:shadow-md transition-all duration-300
                    group-hover:scale-105`}
                  >
                    {typeof category.icon === 'string' ? (
                      <img 
                        src={category.icon} 
                        alt={category.name} 
                        className="w-10 h-10"
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
                  <span className="text-sm font-medium text-center line-clamp-1 max-w-[90px] group-hover:text-blue-600 transition-colors">
                    {category.name}
                  </span>
                  <span className="text-xs text-gray-500 hidden md:inline-block">
                    {index === 0 ? '200+ elan' : `${(10 - index) * 15}+ elan`}
                  </span>
                </div>
              </Link>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
}