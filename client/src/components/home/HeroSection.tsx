import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Search, ArrowRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function HeroSection() {
  const { user } = useAuth();
  
  return (
    <section className="py-16 md:py-24 overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-600 opacity-10 z-0"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              <span className="text-blue-600">Əşyalarınızı dəyişdirin,</span> pul xərcləmədən istədiyinizi əldə edin
            </h1>
            
            <p className="text-xl text-gray-600 mb-8">
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
                <Button variant="outline" size="lg" className="border-blue-600 text-blue-600 hover:bg-blue-50">
                  Daha Ətraflı <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
            
            <div className="mt-10 flex items-center">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div 
                    key={i}
                    className="w-10 h-10 rounded-full border-2 border-white bg-blue-100 flex items-center justify-center overflow-hidden"
                  >
                    <span className="font-bold text-blue-600 text-xs">İst.{i}</span>
                  </div>
                ))}
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-700">1000+ istifadəçi artıq platformaya qoşulub</p>
                <div className="flex mt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg 
                      key={star}
                      xmlns="http://www.w3.org/2000/svg" 
                      className="h-4 w-4 text-yellow-400 fill-current" 
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          <div className="relative">
            <div className="absolute -top-6 -left-6 w-36 h-36 bg-blue-100 rounded-full filter blur-xl opacity-70"></div>
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-indigo-100 rounded-full filter blur-xl opacity-70"></div>
            
            <div className="relative bg-white p-6 rounded-2xl shadow-xl overflow-hidden">
              <div className="absolute -right-20 -top-20 w-40 h-40 bg-blue-50 rounded-full"></div>
              <div className="absolute -left-16 -bottom-16 w-36 h-36 bg-indigo-50 rounded-full"></div>
              
              <h3 className="font-bold text-xl mb-6 relative">Nə axtarırsınız?</h3>
              
              <div className="space-y-4 relative">
                <div className="flex items-center border rounded-md px-3 py-2 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100">
                  <Search className="h-5 w-5 text-gray-400 mr-2" />
                  <input 
                    type="text"
                    placeholder="Axtarış sözləri..." 
                    className="flex-1 border-0 focus:ring-0 focus:outline-none text-gray-700"
                  />
                </div>
                
                <select className="w-full border border-gray-300 rounded-md px-3 py-2 appearance-none focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 text-gray-700">
                  <option value="">Kateqoriya seçin</option>
                  <option value="electronics">Elektronika</option>
                  <option value="clothing">Geyim</option>
                  <option value="books">Kitablar</option>
                  <option value="home">Ev və bağ</option>
                  <option value="sports">İdman</option>
                  <option value="toys">Oyuncaqlar</option>
                  <option value="vehicles">Nəqliyyat</option>
                  <option value="collectibles">Kolleksiya</option>
                </select>
                
                <select className="w-full border border-gray-300 rounded-md px-3 py-2 appearance-none focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 text-gray-700">
                  <option value="">Yer seçin</option>
                  <option value="baku">Bakı</option>
                  <option value="ganja">Gəncə</option>
                  <option value="sumgait">Sumqayıt</option>
                  <option value="mingachevir">Mingəçevir</option>
                  <option value="other">Digər</option>
                </select>
                
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  Axtar
                </Button>
              </div>
              
              <div className="mt-6 pt-6 border-t border-gray-100 relative">
                <p className="text-gray-500 text-sm mb-3">Populyar axtarışlar:</p>
                <div className="flex flex-wrap gap-2">
                  {['Velosiped', 'Telefon', 'Kitab', 'Mebel', 'Geyim'].map((tag) => (
                    <span 
                      key={tag}
                      className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-800 py-1 px-2 rounded-full cursor-pointer transition"
                    >
                      {tag}
                    </span>
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