import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, ArrowRight, ShoppingBag, BarChart3, ShieldCheck, Clock } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function HeroSection() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("");
  const [city, setCity] = useState("");
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    const params = new URLSearchParams();
    if (searchTerm) params.append("search", searchTerm);
    if (category) params.append("category", category);
    if (city) params.append("city", city);
    
    setLocation(`/items?${params.toString()}`);
  };
  
  return (
    <section className="pt-16 pb-20 md:pt-24 md:pb-32 overflow-hidden relative bg-gradient-to-br from-blue-900 via-indigo-900 to-blue-800 text-white">
      <div className="absolute inset-0 bg-[url('/barter-pattern.svg')] opacity-5 z-0"></div>
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute w-96 h-96 -top-32 -left-32 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute w-96 h-96 top-56 -right-32 bg-indigo-600 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute w-96 h-96 bottom-24 left-32 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <Badge className="mb-6 bg-blue-600/70 text-blue-50 hover:bg-blue-600/80 py-1 px-4 rounded-full border border-blue-400/20 shadow-lg backdrop-blur-sm">
              <Clock className="mr-1.5 h-3.5 w-3.5" />
              Əşya mübadiləsi 24/7
            </Badge>
            
            <h1 className="text-4xl md:text-5xl xl:text-6xl font-bold mb-6 leading-tight text-white">
              <span className="bg-gradient-to-r from-blue-200 to-blue-300 bg-clip-text text-transparent">Əşyalarınızı dəyişdirin,</span> pul xərcləmədən istədiyinizi əldə edin
            </h1>
            
            <p className="text-xl text-blue-100 mb-8 leading-relaxed max-w-2xl">
              BarterTap.az - Azərbaycanın ən böyük əşya mübadiləsi platformasında artıq istifadə etmədiyiniz əşyaları ehtiyacınız 
              olan əşyalara dəyişin. Sürətli, təhlükəsiz və tamamilə pulsuz!
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              {user ? (
                <Link href="/items/new">
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                    Əşya Əlavə Et
                  </Button>
                </Link>
              ) : (
                <Link href="/register">
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                    İndi Qoşul
                  </Button>
                </Link>
              )}
              
              <Link href="/how-it-works">
                <Button variant="outline" size="lg" className="border-white text-white hover:bg-blue-800">
                  Necə İşləyir <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-10">
              <div className="flex items-start">
                <div className="bg-blue-700/30 p-2 rounded-lg mr-3">
                  <ShoppingBag className="h-5 w-5 text-blue-200" />
                </div>
                <div>
                  <h3 className="font-medium text-white mb-1">Pulsuz mübadilə</h3>
                  <p className="text-sm text-gray-300">Sadəcə elanlar yaradın və dəyişdirin</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="bg-blue-700/30 p-2 rounded-lg mr-3">
                  <BarChart3 className="h-5 w-5 text-blue-200" />
                </div>
                <div>
                  <h3 className="font-medium text-white mb-1">Ən çox çeşid</h3>
                  <p className="text-sm text-gray-300">Yüzlərlə kateqoriya, minlərlə əşya</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="bg-blue-700/30 p-2 rounded-lg mr-3">
                  <ShieldCheck className="h-5 w-5 text-blue-200" />
                </div>
                <div>
                  <h3 className="font-medium text-white mb-1">Təhlükəsiz əməliyyat</h3>
                  <p className="text-sm text-gray-300">İstifadəçi reytinq sistemi</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="bg-blue-700/30 p-2 rounded-lg mr-3">
                  <Clock className="h-5 w-5 text-blue-200" />
                </div>
                <div>
                  <h3 className="font-medium text-white mb-1">24/7 Aktiv</h3>
                  <p className="text-sm text-gray-300">Hər zaman və hər yerdə əlçatan</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="relative">
            <div className="absolute -top-6 -left-6 w-36 h-36 bg-blue-100 rounded-full filter blur-xl opacity-70"></div>
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-indigo-100 rounded-full filter blur-xl opacity-70"></div>
            
            <div className="relative bg-white p-8 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-sm border border-blue-50">
              <div className="absolute -right-20 -top-20 w-40 h-40 bg-blue-50 rounded-full"></div>
              <div className="absolute -left-16 -bottom-16 w-36 h-36 bg-indigo-50 rounded-full"></div>
              
              <h3 className="font-bold text-2xl mb-6 relative text-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Nə axtarırsınız?</h3>
              
              <form onSubmit={handleSearch} className="space-y-5 relative">
                <div className="flex items-center border border-gray-200 rounded-xl px-4 py-3.5 shadow-sm focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all duration-200">
                  <Search className="h-5 w-5 text-blue-500 mr-2" />
                  <input 
                    type="text"
                    placeholder="Axtarış sözləri..." 
                    className="flex-1 border-0 focus:ring-0 focus:outline-none text-gray-700 text-lg"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <div className="relative">
                  <select 
                    className="w-full border border-gray-200 rounded-xl px-4 py-3.5 shadow-sm appearance-none focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 text-gray-700 pr-10 transition-all duration-200"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="">Kateqoriya seçin</option>
                    <option value="Elektronika">Elektronika</option>
                    <option value="Geyim">Geyim</option>
                    <option value="Kitablar">Kitablar</option>
                    <option value="Ev və bağ">Ev və bağ</option>
                    <option value="İdman">İdman</option>
                    <option value="Oyuncaqlar">Oyuncaqlar</option>
                    <option value="Nəqliyyat">Nəqliyyat</option>
                    <option value="Kolleksiya">Kolleksiya</option>
                  </select>
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
                      <path d="m6 9 6 6 6-6"/>
                    </svg>
                  </div>
                </div>
                
                <div className="relative">
                  <select 
                    className="w-full border border-gray-200 rounded-xl px-4 py-3.5 shadow-sm appearance-none focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 text-gray-700 pr-10 transition-all duration-200"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  >
                    <option value="">Yer seçin</option>
                    <option value="Bakı">Bakı</option>
                    <option value="Gəncə">Gəncə</option>
                    <option value="Sumqayıt">Sumqayıt</option>
                    <option value="Mingəçevir">Mingəçevir</option>
                    <option value="Digər">Digər</option>
                  </select>
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
                      <path d="m6 9 6 6 6-6"/>
                    </svg>
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3.5 text-lg rounded-xl shadow-lg border border-blue-700/10 transition-all duration-200"
                >
                  Axtar
                </Button>
              </form>
              
              <div className="mt-7 pt-6 border-t border-gray-100 relative">
                <p className="text-gray-600 text-sm mb-3">Populyar axtarışlar:</p>
                <div className="flex flex-wrap gap-2">
                  {['Velosiped', 'Telefon', 'Kitab', 'Mebel', 'Geyim'].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => {
                        setSearchTerm(tag);
                        setCategory("");
                        setCity("");
                      }}
                      className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 py-1.5 px-3.5 rounded-full cursor-pointer transition-all border border-blue-100"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}