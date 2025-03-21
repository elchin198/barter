import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, ArrowRight, Plus, CirclePlus, MapPin, Clock, Tag, RefreshCw, Heart, MessageCircle } from "lucide-react";
import { useState } from "react";
import HeroSection from "@/components/home/hero-section";
import CategoriesSection from "@/components/home/categories-section";
import RecentItemsSection from "@/components/home/recent-items-section";
import HowItWorksSection from "@/components/home/how-it-works-section";
import BenefitsSection from "@/components/home/benefits-section";
import CTASection from "@/components/home/cta-section";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <section>
        <HeroSection />
      </section>

      <section>
        <CategoriesSection />
      </section>

      <section className="py-12 container">
        <RecentItemsSection />
      </section>

      <section className="py-12 bg-gray-50">
        <div className="container">
          <HowItWorksSection />
        </div>
      </section>

      <section className="py-12">
        <div className="container">
          <BenefitsSection />
        </div>
      </section>

      <section className="py-12 bg-[#367BF5]">
        <div className="container">
          <CTASection />
        </div>
      </section>
    </div>
  );
}

// Category Card component
function CategoryCard({ name, icon, color }: { name: string; icon: string; color: string }) {
  return (
    <Link href={`/category/${name.toLowerCase()}`} className="block transition-transform hover:scale-105">
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md p-6 text-center">
        <div className={`w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-full`} style={{ backgroundColor: `${color}15` }}>
          {icon === 'laptop' && (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" style={{ color }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          )}
          {icon === 'shirt' && (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" style={{ color }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 2L2 6v14a2 2 0 002 2h16a2 2 0 002-2V6l-4-4M14 2v4a2 2 0 01-2 2h0a2 2 0 01-2-2V2M9 22V2M15 22V2" />
            </svg>
          )}
          {icon === 'armchair' && (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" style={{ color }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 10V7a2 2 0 00-2-2H6a2 2 0 00-2 2v3m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 10H4" />
            </svg>
          )}
          {icon === 'car' && (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" style={{ color }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          )}
          {icon === 'home' && (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" style={{ color }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          )}
          {icon === 'dumbbell' && (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" style={{ color }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 0h-4m4 0l-5-5m-7 7h.01" />
            </svg>
          )}
        </div>
        <h3 className="font-medium text-gray-800">{name}</h3>
      </div>
    </Link>
  );
}

// Item Card component
function ItemCard({ title, category, location, date, exchange, image }: { title: string; category: string; location: string; date: string; exchange: string; image: string }) {
  const [isFavorite, setIsFavorite] = useState(false);
  
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden hover:-translate-y-1">
      <div className="relative pb-[70%]">
        <Link href={`/item/1`} className="absolute inset-0">
          <img
            src={image}
            alt={title}
            className="absolute inset-0 w-full h-full object-cover"
          />
        </Link>
        
        {/* Category badge */}
        <div className="absolute top-3 left-3 px-3 py-1 bg-black/60 text-white text-xs font-medium rounded-full">
          {category}
        </div>
        
        {/* Status badge */}
        <div className="absolute bottom-3 left-3 px-3 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full border border-green-200">
          Aktiv
        </div>
        
        <button
          className={`absolute top-3 right-3 hover:text-red-500 bg-white/90 shadow-sm hover:bg-white rounded-full w-9 h-9 flex items-center justify-center transition-all duration-300 ${
            isFavorite ? "text-red-500 bg-white" : "text-gray-600"
          }`}
          onClick={() => setIsFavorite(!isFavorite)}
        >
          <Heart className={`h-5 w-5 ${isFavorite ? "fill-current" : ""}`} />
        </button>
      </div>
      
      <div className="p-4">
        <Link href={`/item/1`} className="block">
          <h3 className="font-semibold text-lg mb-2 truncate text-gray-800">{title}</h3>
          
          <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
            <MapPin className="w-3 h-3" /> 
            <span>{location}</span>
            <span className="mx-1">•</span>
            <Clock className="w-3 h-3" /> 
            <span>{date}</span>
          </div>
          
          <div className="bg-[#367BF5]/5 rounded-lg p-3 mb-3 border border-[#367BF5]/10">
            <div className="flex items-center gap-2 text-gray-800">
              <RefreshCw className="w-4 h-4 text-[#367BF5]" />
              <p className="text-sm font-medium">Dəyişdirəcəm:</p>
            </div>
            <p className="text-sm text-gray-600 pl-6 truncate">{exchange}</p>
          </div>
        </Link>
        
        <div className="pt-3 border-t border-gray-100">
          <Link href={`/item/1`}>
            <Button variant="ghost" className="w-full text-[#367BF5] hover:text-[#367BF5] hover:bg-[#367BF5]/5">
              Ətraflı bax
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
