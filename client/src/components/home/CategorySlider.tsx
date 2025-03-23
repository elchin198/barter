import React, { useRef, useEffect } from 'react';
import { Link } from 'wouter';
import Swiper from 'swiper';
import 'swiper/css';

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
  const swiperRef = useRef<HTMLDivElement>(null);
  const swiperInstanceRef = useRef<Swiper | null>(null);

  useEffect(() => {
    if (swiperRef.current && !swiperInstanceRef.current) {
      swiperInstanceRef.current = new Swiper(swiperRef.current, {
        slidesPerView: 'auto',
        spaceBetween: 16,
        freeMode: true,
        grabCursor: true,
      });
    }

    return () => {
      if (swiperInstanceRef.current) {
        swiperInstanceRef.current.destroy(true, true);
        swiperInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <section className="bg-white pt-4 pb-8">
      <div className="container mx-auto px-4">
        <div 
          className="swiper overflow-hidden" 
          ref={swiperRef}
        >
          <div className="swiper-wrapper">
            {DEFAULT_CATEGORIES.map((category, index) => (
              <div key={index} className="swiper-slide" style={{ width: 'auto' }}>
                <Link href={index === 0 ? "/items" : `/items?category=${encodeURIComponent(category.name)}`}>
                  <div className="flex flex-col items-center">
                    <div className={`w-16 h-16 rounded-full ${index === 0 ? 'bg-blue-100' : 'bg-gray-100'} flex items-center justify-center mb-2 hover:bg-blue-100 transition-colors duration-300`}>
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
                    <span className="text-xs font-medium text-center line-clamp-1">{category.name}</span>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}