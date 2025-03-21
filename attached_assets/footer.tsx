import { Link } from "wouter";
import { Logo } from "@/components/ui/logo";
import { 
  Facebook, 
  Instagram, 
  Twitter, 
  Mail, 
  Phone, 
  MapPin, 
  ArrowUp, 
  Smartphone, 
  ShieldCheck, 
  CheckCircle2,
  Send
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const [isBackToTopVisible, setIsBackToTopVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);
  
  // Show back to top button after scrolling down
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 500) {
        setIsBackToTopVisible(true);
      } else {
        setIsBackToTopVisible(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      // Here you would actually send to backend
      setIsSubscribed(true);
      setTimeout(() => {
        setIsSubscribed(false);
        setEmail("");
      }, 3000);
    }
  };
  
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };
  
  return (
    <footer className="bg-gray-50 relative z-10">
      {/* Curved top */}
      <div className="absolute top-0 left-0 right-0 h-16 bg-white" style={{ clipPath: 'ellipse(70% 100% at 50% 0%)' }}></div>
      
      {/* Main content */}
      <div className="container mx-auto px-4 pt-24 pb-12 relative">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-16">
          {/* Logo and About - Takes 3 columns on large screens */}
          <div className="md:col-span-3">
            <div className="mb-6">
              <Logo />
            </div>
            <p className="text-gray-600 text-sm mb-6 leading-relaxed">
              BarterTap.az platforması istifadə etmədiyiniz əşyaları dəyişdirməklə yeni əşyalar əldə etməyə imkan verən barter platformasıdır.
            </p>
            <div className="flex space-x-3 mb-8">
              <a 
                href="https://www.facebook.com/bartertapaz" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-600 hover:text-primary hover:shadow-md hover:-translate-y-1 transition-all duration-200"
              >
                <Facebook size={18} />
              </a>
              <a 
                href="https://www.instagram.com/bartertapaz/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-600 hover:text-primary hover:shadow-md hover:-translate-y-1 transition-all duration-200"
              >
                <Instagram size={18} />
              </a>
              <a 
                href="https://twitter.com/bartertapaz" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-600 hover:text-primary hover:shadow-md hover:-translate-y-1 transition-all duration-200"
              >
                <Twitter size={18} />
              </a>
            </div>
            
            {/* Download App Section */}
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                <Smartphone className="h-4 w-4 mr-2 text-primary" />
                Mobil tətbiqimizi yükləyin
              </h3>
              <div className="flex space-x-2">
                <a href="#" className="block w-1/2">
                  <img src="https://nextbarter.com/assets/images/app-store.svg" alt="App Store" className="w-full h-auto hover:opacity-80 transition-opacity" />
                </a>
                <a href="#" className="block w-1/2">
                  <img src="https://nextbarter.com/assets/images/google-play.svg" alt="Google Play" className="w-full h-auto hover:opacity-80 transition-opacity" />
                </a>
              </div>
            </div>
          </div>

          {/* Left empty gap - 1 column */}
          <div className="hidden md:block md:col-span-1"></div>

          {/* Şirkət - 2 columns */}
          <div className="md:col-span-2">
            <h3 className="text-base font-semibold text-gray-900 mb-6 relative">
              <span className="relative z-10">Şirkət</span>
              <span className="absolute -bottom-2 left-0 w-8 h-1 bg-primary/20 rounded-full"></span>
            </h3>
            <ul className="space-y-4">
              <li>
                <Link href="/about" className="text-gray-600 hover:text-primary text-sm transition-colors inline-flex hover:translate-x-1 transition-transform">
                  Haqqımızda
                </Link>
              </li>
              <li>
                <Link href="/blogs" className="text-gray-600 hover:text-primary text-sm transition-colors inline-flex hover:translate-x-1 transition-transform">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-600 hover:text-primary text-sm transition-colors inline-flex hover:translate-x-1 transition-transform">
                  Əlaqə
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-gray-600 hover:text-primary text-sm transition-colors inline-flex hover:translate-x-1 transition-transform">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" className="text-gray-600 hover:text-primary text-sm transition-colors inline-flex hover:translate-x-1 transition-transform">
                  Necə işləyir
                </Link>
              </li>
            </ul>
          </div>

          {/* Hüquqi - 2 columns */}
          <div className="md:col-span-2">
            <h3 className="text-base font-semibold text-gray-900 mb-6 relative">
              <span className="relative z-10">Hüquqi</span>
              <span className="absolute -bottom-2 left-0 w-8 h-1 bg-primary/20 rounded-full"></span>
            </h3>
            <ul className="space-y-4">
              <li>
                <Link href="/privacy-policy" className="text-gray-600 hover:text-primary text-sm transition-colors inline-flex hover:translate-x-1 transition-transform">
                  Gizlilik Siyasəti
                </Link>
              </li>
              <li>
                <Link href="/terms-conditions" className="text-gray-600 hover:text-primary text-sm transition-colors inline-flex hover:translate-x-1 transition-transform">
                  İstifadə Şərtləri
                </Link>
              </li>
              <li>
                <Link href="/cookies-policy" className="text-gray-600 hover:text-primary text-sm transition-colors inline-flex hover:translate-x-1 transition-transform">
                  Çərəzlər Siyasəti
                </Link>
              </li>
              <li>
                <Link href="/security" className="text-gray-600 hover:text-primary text-sm transition-colors inline-flex hover:translate-x-1 transition-transform">
                  Təhlükəsizlik
                </Link>
              </li>
            </ul>
          </div>

          {/* Əlaqə - 4 columns */}
          <div className="md:col-span-4">
            <h3 className="text-base font-semibold text-gray-900 mb-6 relative">
              <span className="relative z-10">Əlaqə</span>
              <span className="absolute -bottom-2 left-0 w-8 h-1 bg-primary/20 rounded-full"></span>
            </h3>
            
            <ul className="space-y-5 mb-8">
              <li className="flex items-start">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div className="ml-3 mt-1">
                  <a href="mailto:info@bartertap.az" className="text-gray-600 hover:text-primary text-sm transition-colors">
                    info@bartertap.az
                  </a>
                </div>
              </li>
              <li className="flex items-start">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Phone className="h-5 w-5 text-primary" />
                </div>
                <div className="ml-3 mt-1">
                  <a href="tel:+994501234567" className="text-gray-600 hover:text-primary text-sm transition-colors">
                    +994 50 123 45 67
                  </a>
                </div>
              </li>
              <li className="flex items-start">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div className="ml-3 mt-1">
                  <span className="text-gray-600 text-sm">
                    Bakı şəhəri, Azərbaycan
                  </span>
                </div>
              </li>
            </ul>
            
            {/* Newsletter signup */}
            <div className="bg-white p-5 rounded-xl shadow-sm">
              <h4 className="text-sm font-semibold text-gray-900 mb-2">
                Yeniliklərimizə abunə olun
              </h4>
              <p className="text-xs text-gray-600 mb-3">
                Ən son xəbərləri və xüsusi təklifləri əldə etmək üçün bülletenimizə abunə olun.
              </p>
              
              <form onSubmit={handleSubscribe} className="flex flex-col gap-2">
                <div className="relative">
                  <Input 
                    type="email" 
                    placeholder="E-poçt ünvanınız"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pr-10"
                  />
                  <Button 
                    type="submit" 
                    size="icon" 
                    variant="ghost"
                    className="absolute right-0 top-0 h-full text-primary hover:text-primary/80"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                
                {isSubscribed && (
                  <p className="text-xs text-green-600 flex items-center">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Uğurla abunə oldunuz
                  </p>
                )}
              </form>
            </div>
          </div>
        </div>
        
        {/* Trust badges */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-8 border-t border-gray-200">
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="h-6 w-6 text-primary" />
            </div>
            <div className="ml-4">
              <h4 className="text-sm font-semibold text-gray-900">Təhlükəsiz Mübadilə</h4>
              <p className="text-xs text-gray-600">Etibarlı və təhlükəsiz barter əməliyyatları</p>
            </div>
          </div>
          
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="h-6 w-6 text-primary" />
            </div>
            <div className="ml-4">
              <h4 className="text-sm font-semibold text-gray-900">Yoxlanılmış İstifadəçilər</h4>
              <p className="text-xs text-gray-600">Təsdiqlənmiş və etibarlı barter təklifləri</p>
            </div>
          </div>
          
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Smartphone className="h-6 w-6 text-primary" />
            </div>
            <div className="ml-4">
              <h4 className="text-sm font-semibold text-gray-900">Mobilə Uyğun</h4>
              <p className="text-xs text-gray-600">İstənilən cihazdan rahatlıqla istifadə edin</p>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-200 mt-6 pt-8 flex flex-col md:flex-row justify-between items-center">
          <div className="text-center md:text-left text-gray-500 text-sm mb-4 md:mb-0">
            &copy; {currentYear} BarterTap.az. Bütün hüquqlar qorunur.
          </div>
          
          <div className="flex space-x-6">
            <Link href="/privacy-policy" className="text-gray-500 hover:text-primary text-xs transition-colors">
              Gizlilik Siyasəti
            </Link>
            <Link href="/terms-conditions" className="text-gray-500 hover:text-primary text-xs transition-colors">
              İstifadə Şərtləri
            </Link>
            <Link href="/cookies-policy" className="text-gray-500 hover:text-primary text-xs transition-colors">
              Çərəzlər Siyasəti
            </Link>
          </div>
        </div>
      </div>
      
      {/* Back to top button */}
      <button 
        className={`fixed bottom-6 right-6 w-12 h-12 bg-primary text-white rounded-full shadow-lg flex items-center justify-center z-50 hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all duration-300 ${isBackToTopVisible ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
        onClick={scrollToTop}
        aria-label="Back to top"
      >
        <ArrowUp className="h-5 w-5" />
      </button>
    </footer>
  );
}