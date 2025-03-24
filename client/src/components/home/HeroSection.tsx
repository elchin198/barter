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
      {/* Enhanced blob animations */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        {/* Primary blobs */}
        <div className="absolute w-[500px] h-[500px] -top-48 -left-48 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute w-[600px] h-[600px] top-56 -right-48 bg-indigo-600 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute w-[500px] h-[500px] bottom-24 left-32 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
        
        {/* Secondary smaller blobs */}
        <div className="absolute w-64 h-64 top-24 left-[20%] bg-purple-500 rounded-full mix-blend-multiply filter blur-2xl opacity-20 animate-blob animation-delay-4000"></div>
        <div className="absolute w-72 h-72 bottom-48 right-[25%] bg-cyan-500 rounded-full mix-blend-multiply filter blur-2xl opacity-10 animate-blob"></div>
        
        {/* Accent blobs */}
        <div className="absolute w-32 h-32 top-[40%] left-[30%] bg-pink-400 rounded-full mix-blend-overlay filter blur-xl opacity-10 animate-blob animation-delay-2000"></div>
        <div className="absolute w-40 h-40 bottom-[30%] right-[40%] bg-yellow-400 rounded-full mix-blend-overlay filter blur-xl opacity-10 animate-blob animation-delay-4000"></div>
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <Badge className="mb-6 bg-gradient-to-r from-blue-600/70 to-indigo-600/70 text-blue-50 hover:from-blue-600/80 hover:to-indigo-600/80 py-1.5 px-4 rounded-full border border-blue-400/20 shadow-lg backdrop-blur-sm transition-all duration-300 hover:shadow-blue-700/30">
              <Clock className="mr-1.5 h-3.5 w-3.5 animate-pulse" />
              Əşya mübadiləsi 24/7
            </Badge>
            
            <h1 className="text-4xl md:text-5xl xl:text-6xl font-bold mb-6 leading-tight">
              <div className="mb-2">
                <span className="bg-gradient-to-r from-blue-200 to-indigo-200 bg-clip-text text-transparent inline-block transform hover:scale-[1.02] transition-transform duration-500">
                  Əşyalarınızı dəyişdirin,
                </span>
              </div>
              <div className="relative">
                <span className="text-white inline-block relative z-10">
                  pul xərcləmədən <span className="text-blue-200">istədiyinizi</span> əldə edin
                </span>
                <div className="absolute -bottom-2 left-0 w-48 h-2 bg-gradient-to-r from-blue-500/30 to-indigo-500/30 blur-sm"></div>
              </div>
            </h1>
            
            <p className="text-xl text-blue-100 mb-10 leading-relaxed max-w-2xl font-light">
              <span className="font-medium">BarterTap.az</span> - Azərbaycanın ən böyük əşya mübadiləsi platformasında 
              artıq istifadə etmədiyiniz əşyaları ehtiyacınız olan əşyalara dəyişin. 
              <span className="bg-gradient-to-r from-blue-200 to-blue-300 bg-clip-text text-transparent font-medium ml-1">
                Sürətli, təhlükəsiz və tamamilə pulsuz!
              </span>
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-2">
              {user ? (
                <Link href="/items/new" className="sm:w-auto w-full">
                  <Button size="lg" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0 shadow-lg hover:shadow-blue-600/30 transition-all duration-300 font-medium px-8 w-full sm:w-auto">
                    <span className="relative z-10 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                      </svg>
                      Əşya Əlavə Et
                    </span>
                  </Button>
                </Link>
              ) : (
                <Link href="/register" className="sm:w-auto w-full">
                  <Button size="lg" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0 shadow-lg hover:shadow-blue-600/30 transition-all duration-300 font-medium px-8 w-full sm:w-auto">
                    <span className="relative z-10 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M13.8 12H3" />
                      </svg>
                      İndi Qoşul
                    </span>
                  </Button>
                </Link>
              )}
              
              <Link href="/how-it-works" className="sm:w-auto w-full">
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="border-white/30 backdrop-blur-sm text-white hover:bg-blue-800/20 transition-all duration-300 group w-full sm:w-auto px-8"
                >
                  <span className="flex items-center relative z-10">
                    Necə İşləyir 
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                  </span>
                </Button>
              </Link>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-10">
              <div className="flex items-start p-3 rounded-xl hover:bg-blue-800/30 transition-colors duration-300 group cursor-default">
                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-xl mr-4 shadow-lg group-hover:shadow-blue-500/20 transition-all duration-300">
                  <ShoppingBag className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-medium text-white mb-1 group-hover:text-blue-200 transition-colors">Pulsuz mübadilə</h3>
                  <p className="text-sm text-blue-100/80">Sadəcə elanlar yaradın və dəyişdirin</p>
                </div>
              </div>
              
              <div className="flex items-start p-3 rounded-xl hover:bg-blue-800/30 transition-colors duration-300 group cursor-default">
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-3 rounded-xl mr-4 shadow-lg group-hover:shadow-indigo-500/20 transition-all duration-300">
                  <BarChart3 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-medium text-white mb-1 group-hover:text-blue-200 transition-colors">Ən çox çeşid</h3>
                  <p className="text-sm text-blue-100/80">Yüzlərlə kateqoriya, minlərlə əşya</p>
                </div>
              </div>
              
              <div className="flex items-start p-3 rounded-xl hover:bg-blue-800/30 transition-colors duration-300 group cursor-default">
                <div className="bg-gradient-to-br from-blue-400 to-cyan-600 p-3 rounded-xl mr-4 shadow-lg group-hover:shadow-cyan-500/20 transition-all duration-300">
                  <ShieldCheck className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-medium text-white mb-1 group-hover:text-blue-200 transition-colors">Təhlükəsiz əməliyyat</h3>
                  <p className="text-sm text-blue-100/80">İstifadəçi reytinq sistemi</p>
                </div>
              </div>
              
              <div className="flex items-start p-3 rounded-xl hover:bg-blue-800/30 transition-colors duration-300 group cursor-default">
                <div className="bg-gradient-to-br from-cyan-500 to-teal-600 p-3 rounded-xl mr-4 shadow-lg group-hover:shadow-cyan-500/20 transition-all duration-300">
                  <Clock className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-medium text-white mb-1 group-hover:text-blue-200 transition-colors">24/7 Aktiv</h3>
                  <p className="text-sm text-blue-100/80">Hər zaman və hər yerdə əlçatan</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="relative">
            <div className="absolute -top-6 -left-6 w-36 h-36 bg-blue-100 rounded-full filter blur-xl opacity-70"></div>
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-indigo-100 rounded-full filter blur-xl opacity-70"></div>
            
            <div className="relative bg-white/95 p-8 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl border border-blue-100 transform hover:shadow-blue-200/30 transition-all duration-500">
              {/* Decorative elements */}
              <div className="absolute -right-20 -top-20 w-40 h-40 bg-blue-50 rounded-full"></div>
              <div className="absolute -left-16 -bottom-16 w-36 h-36 bg-indigo-50 rounded-full"></div>
              <div className="absolute right-12 top-12 w-6 h-6 bg-blue-500 rounded-full opacity-20"></div>
              <div className="absolute right-32 top-24 w-3 h-3 bg-indigo-600 rounded-full opacity-20"></div>
              <div className="absolute left-20 bottom-20 w-5 h-5 bg-blue-600 rounded-full opacity-20"></div>
              
              <h3 className="font-bold text-2xl mb-6 relative text-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Nə axtarırsınız?
              </h3>
              
              <form onSubmit={handleSearch} className="space-y-5 relative z-10">
                {/* Search term field */}
                <div className="flex items-center border border-gray-200 rounded-xl px-4 py-3.5 shadow-sm focus-within:ring-4 focus-within:ring-blue-100 focus-within:border-blue-400 transition-all duration-300 hover:border-blue-300 bg-white/80 backdrop-blur-sm">
                  <Search className="h-5 w-5 text-blue-500 mr-2.5" />
                  <input 
                    type="text"
                    placeholder="Axtarış sözləri..." 
                    className="flex-1 border-0 focus:ring-0 focus:outline-none bg-transparent text-gray-700 text-base md:text-lg placeholder-gray-400"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                {/* Category field */}
                <div className="relative group">
                  <select 
                    className="w-full border border-gray-200 rounded-xl px-4 py-3.5 shadow-sm appearance-none focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 text-gray-700 pr-10 transition-all duration-300 hover:border-blue-300 bg-white/80 backdrop-blur-sm"
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
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none text-blue-500 group-hover:text-blue-600 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m6 9 6 6 6-6"/>
                    </svg>
                  </div>
                </div>
                
                {/* City field */}
                <div className="relative group">
                  <select 
                    className="w-full border border-gray-200 rounded-xl px-4 py-3.5 shadow-sm appearance-none focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 text-gray-700 pr-10 transition-all duration-300 hover:border-blue-300 bg-white/80 backdrop-blur-sm"
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
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none text-blue-500 group-hover:text-blue-600 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m6 9 6 6 6-6"/>
                    </svg>
                  </div>
                </div>
                
                {/* Submit button */}
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3.5 text-lg rounded-xl shadow-lg border border-blue-700/10 transition-all duration-300 hover:shadow-blue-500/20"
                >
                  Axtar
                </Button>
              </form>
              
              <div className="mt-7 pt-6 border-t border-gray-100 relative">
                <p className="text-gray-600 text-sm font-medium mb-3 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5 text-blue-500">
                    <path d="m20 8-8-4-8 4 8 4 8-4Z"/>
                    <path d="m6 12 8 4 8-4"/>
                    <path d="m6 16 8 4 8-4"/>
                  </svg>
                  Populyar axtarışlar:
                </p>
                <div className="flex flex-wrap gap-2">
                  {['Velosiped', 'Telefon', 'Kitab', 'Mebel', 'Geyim'].map((tag, index) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => {
                        setSearchTerm(tag);
                        setCategory("");
                        setCity("");
                      }}
                      className={`text-xs py-1.5 px-3.5 rounded-full cursor-pointer transition-all duration-300 hover:shadow-sm font-medium ${
                        index % 5 === 0 ? 'bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-100' :
                        index % 5 === 1 ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-100' :
                        index % 5 === 2 ? 'bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-100' :
                        index % 5 === 3 ? 'bg-cyan-50 hover:bg-cyan-100 text-cyan-700 border border-cyan-100' :
                        'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-100'
                      }`}
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