import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Search, ArrowRight, Package, Swap, RefreshCw } from "lucide-react";

export default function BannerSection() {
  return (
    <div className="rounded-2xl overflow-hidden mb-16 relative">
      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#367BF5]/95 to-[#367BF5]/85 z-10"></div>
      
      {/* Background pattern */}
      <div className="absolute inset-0 z-0 opacity-10">
        <svg className="w-full h-full" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="dotPattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1" fill="white" />
            </pattern>
          </defs>
          <rect x="0" y="0" width="100%" height="100%" fill="url(#dotPattern)" />
        </svg>
      </div>
      
      {/* Background image */}
      <div className="relative pb-[50%] md:pb-[35%]">
        <div className="absolute inset-0 bg-cover bg-center" 
             style={{ backgroundImage: "url('https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=400&q=80')" }}>
        </div>
      </div>
      
      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-center p-8 md:p-14 z-20">
        <div className="max-w-4xl">
          <div className="inline-flex items-center px-3 py-1.5 bg-white/20 rounded-full backdrop-blur-sm mb-6">
            <span className="text-white text-sm font-medium">Orijinal Məhsullar</span>
            <span className="w-1 h-1 mx-2 bg-white rounded-full"></span>
            <span className="text-white text-sm font-medium">Təhlükəsiz Barter</span>
          </div>
          
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-6 font-sans leading-tight">
            Əşyalarınızı Dəyişdirin, <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-300 to-yellow-200">Yeni Həyat Qazandırın</span>
          </h1>
          
          <p className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl">
            İstifadə etmədiyiniz əşyalarınızı dəyişərək, həm sizə, həm də başqalarına fayda verin. Ətraf mühitin qorunmasına töhfə verməklə yanaşı, ehtiyacınız olan əşyaları əldə edin!
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 mb-10">
            <Link href="/auth">
              <Button size="lg" className="bg-white hover:bg-white/90 text-[#367BF5] hover:text-[#367BF5]/90 font-semibold px-8 py-7 rounded-xl shadow-lg flex gap-2 items-center text-base">
                Elan Yerləşdir
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            
            <Link href="/search">
              <Button variant="outline" size="lg" className="border-2 border-white/80 bg-transparent hover:bg-white/10 text-white hover:text-white font-semibold px-8 py-7 rounded-xl flex gap-2 items-center text-base">
                <Search className="w-5 h-5" />
                Əşyaları Axtar
              </Button>
            </Link>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 lg:gap-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <RefreshCw className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-white font-bold text-xl">10,000+</p>
                <p className="text-white/80 text-sm">Uğurlu dəyişdirmə</p>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <Package className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-white font-bold text-xl">25,000+</p>
                <p className="text-white/80 text-sm">Aktiv elan</p>
              </div>
            </div>
            
            <div className="hidden md:flex bg-white/10 backdrop-blur-sm rounded-xl p-4 items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <Swap className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-white font-bold text-xl">18,000+</p>
                <p className="text-white/80 text-sm">Xoşbəxt istifadəçi</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
