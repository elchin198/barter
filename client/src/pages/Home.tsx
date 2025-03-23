import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import HeroSection from "@/components/home/HeroSection";
import FeatureSection from "@/components/home/FeatureSection";
import CategorySlider from "@/components/home/CategorySlider";
import RecentItems from "@/components/home/RecentItems";
import SEO from "@/components/SEO";
import { useTranslation } from "react-i18next";

export default function Home() {
  const { t } = useTranslation();
  const [location] = useLocation();
  // Create specific SEO for home page
  const homeTitle = t('seo.homeTitle', 'BarterTap.az - Əşya Mübadiləsi Platforması');
  const homeDescription = t(
    'seo.homeDescription', 
    'BarterTap.az - Azərbaycanda ən böyük pulsuz əşya mübadiləsi platforması. Lazımsız əşyalarınızı dəyişin, ehtiyacınız olanları əldə edin.'
  );
  
  return (
    <div>
      {/* Page-specific SEO */}
      <SEO 
        title={homeTitle}
        description={homeDescription}
        pathName={location}
      />
      {/* Hero section */}
      <HeroSection />
      
      {/* Features section */}
      <FeatureSection />
      
      {/* Categories Slider */}
      <section className="py-10 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-black">Kateqoriyalar üzrə göz atın</h2>
            <Link href="/items" className="text-blue-600 hover:underline flex items-center text-sm font-medium bg-white rounded-lg px-3 py-1 shadow-sm border border-gray-100">
              Hamısını göstər <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
        </div>
        
        <CategorySlider />
      </section>
      
      {/* Recent items section */}
      <RecentItems />
      
      {/* How it works section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-black">Barter necə işləyir?</h2>
            <p className="text-gray-700 max-w-3xl mx-auto">
              BarterTap.az ilə əşya dəyişmək sadə və asandır. Cəmi üç addımda lazım olmayan əşyalarınızı 
              istədiyiniz şeylərə dəyişə bilərsiniz.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-1/3 left-1/4 right-1/4 h-1 bg-blue-100 z-0"></div>
            
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-md hover:shadow-lg transition-shadow duration-300 z-10">
              <div className="rounded-full bg-blue-600 text-white w-12 h-12 flex items-center justify-center mb-6 mx-auto font-bold text-xl">1</div>
              <h3 className="text-xl font-bold mb-3 text-center text-black">Əşyanızı əlavə edin</h3>
              <p className="text-gray-700 text-center">
                Əşyanın şəkillərini çəkin, təsvirini yazın və platformada paylaşın. Həmçinin hansı əşyaya dəyişmək istədiyinizi qeyd edin.
              </p>
            </div>
            
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-md hover:shadow-lg transition-shadow duration-300 z-10">
              <div className="rounded-full bg-blue-600 text-white w-12 h-12 flex items-center justify-center mb-6 mx-auto font-bold text-xl">2</div>
              <h3 className="text-xl font-bold mb-3 text-center text-black">Təkliflərə baxın</h3>
              <p className="text-gray-700 text-center">
                Aldığınız təklifləri nəzərdən keçirin və ya sizi maraqlandıran əşyalar üçün özünüz təklif göndərin. Mesajlaşma vasitəsilə əlaqə qurun.
              </p>
            </div>
            
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-md hover:shadow-lg transition-shadow duration-300 z-10">
              <div className="rounded-full bg-blue-600 text-white w-12 h-12 flex items-center justify-center mb-6 mx-auto font-bold text-xl">3</div>
              <h3 className="text-xl font-bold mb-3 text-center text-black">Mübadilə edin</h3>
              <p className="text-gray-700 text-center">
                Mübadiləni tamamlamaq üçün görüş təyin edin və əşyaları dəyişin. Mübadilə başa çatdıqdan sonra əks-əlaqə bildirin.
              </p>
            </div>
          </div>
          
          <div className="text-center mt-10">
            <Link href="/how-it-works">
              <Button variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50">
                Daha ətraflı öyrənin <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
      
      {/* Testimonials */}
      <section className="py-16 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-black">Müştərilər nə deyir?</h2>
            <p className="text-gray-700 max-w-3xl mx-auto">
              İstifadəçilərimizin BarterTap.az haqqında fikirləri ilə tanış olun.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white overflow-visible relative rounded-xl shadow">
              <div className="absolute -top-5 left-1/2 transform -translate-x-1/2">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg 
                      key={star}
                      xmlns="http://www.w3.org/2000/svg" 
                      className="h-5 w-5 text-yellow-400 fill-current" 
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </div>
              <div className="p-6 pt-10">
                <p className="text-gray-700 italic mb-6">
                  "Artıq lazım olmayan əşyalarımı yeni şeylərə dəyişmək üçün mükəmməl platformadır. Platformanın istifadəsi çox rahat və intuitiv, mesajlaşma sistemi də çox əlverişlidir."
                </p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                    <span className="font-bold text-blue-600">AZ</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-black">Aysel Zamanova</h4>
                    <p className="text-sm text-gray-500">Bakı, Azərbaycan</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white overflow-visible relative rounded-xl shadow">
              <div className="absolute -top-5 left-1/2 transform -translate-x-1/2">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg 
                      key={star}
                      xmlns="http://www.w3.org/2000/svg" 
                      className="h-5 w-5 text-yellow-400 fill-current" 
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </div>
              <div className="p-6 pt-10">
                <p className="text-gray-700 italic mb-6">
                  "Köhnə velosipedimi yeni kompüter aksesuarlarına dəyişdim və pul xərcləmədən istədiyim əşyaları əldə etmək çox əla oldu. Təhlükəsizlik təminatları və dəstək xidməti də çox yaxşıdır."
                </p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                    <span className="font-bold text-blue-600">RM</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-black">Rəşad Məmmədov</h4>
                    <p className="text-sm text-gray-500">Gəncə, Azərbaycan</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white overflow-visible relative rounded-xl shadow">
              <div className="absolute -top-5 left-1/2 transform -translate-x-1/2">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg 
                      key={star}
                      xmlns="http://www.w3.org/2000/svg" 
                      className="h-5 w-5 text-yellow-400 fill-current" 
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </div>
              <div className="p-6 pt-10">
                <p className="text-gray-700 italic mb-6">
                  "BarterTap.az sayəsində uşaqlarım üçün oyuncaq və geyim tapmaq çox asan oldu. Eyni zamanda evdən istifadə etmədiyimiz əşyalardan da qurtulduq. Ətraf mühit üçün də faydalıdır!"
                </p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                    <span className="font-bold text-blue-600">SQ</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-black">Səbinə Quliyeva</h4>
                    <p className="text-sm text-gray-500">Sumqayıt, Azərbaycan</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA section */}
      <section className="py-16 bg-blue-600">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center text-white">
            <h2 className="text-4xl font-bold mb-6">İndi qoşulun və barterlərə başlayın</h2>
            <p className="text-xl mb-8">
              Minlərlə istifadəçi artıq pul xərcləmədən ehtiyac duyduqları əşyaları əldə edib. 
              Siz də dəyişim hərəkatına qoşulun!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 px-8">
                  Qeydiyyatdan keçin
                </Button>
              </Link>
              <Link href="/how-it-works">
                <Button variant="outline" size="lg" className="border-white text-white hover:bg-blue-700 px-8">
                  Daha ətraflı
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
