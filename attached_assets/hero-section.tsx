import { Link } from "wouter";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  ArrowRight, 
  Search, 
  RefreshCw, 
  BarChart3, 
  Users, 
  ShoppingBag,
  ArrowUpCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

// Animation variants for staggered animations
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { 
      staggerChildren: 0.1,
      delayChildren: 0.2,
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { 
    y: 0, 
    opacity: 1,
    transition: { 
      type: "spring",
      stiffness: 100,
      damping: 10
    }
  }
};

// Shape component for background decoration
const BackgroundShape = ({ className }: { className?: string }) => (
  <div className={`absolute opacity-20 rounded-full ${className}`}></div>
);

// Array of rotating taglines for header
const taglines = [
  "Satma, barter et.",
  "İstifadə etmədiyin əşyaları yenilərinə dəyişdir.",
  "Daha sərfəli alış-veriş üçün barter et.",
  "Yeni əşyalar əldə etmənin əsrari yolu.",
];

export default function HeroSection() {
  const [currentTagline, setCurrentTagline] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [showBackToTop, setShowBackToTop] = useState(false);
  
  // Rotate through taglines
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTagline(prev => (prev + 1) % taglines.length);
    }, 4000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Handle back to top button visibility
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 500) {
        setShowBackToTop(true);
      } else {
        setShowBackToTop(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`;
    }
  };
  
  // Statistics data
  const stats = [
    { icon: <Users className="h-5 w-5 text-blue-500" />, value: "15,000+", label: "İstifadəçi" },
    { icon: <RefreshCw className="h-5 w-5 text-green-500" />, value: "25,000+", label: "Barter" },
    { icon: <ShoppingBag className="h-5 w-5 text-purple-500" />, value: "50,000+", label: "Elan" },
  ];
  
  return (
    <section className="relative overflow-hidden pt-10 pb-20 md:pt-16 md:pb-32 bg-gradient-to-br from-primary to-primary/90 text-white">
      {/* Decorative background elements */}
      <div className="absolute inset-0 -z-10 bg-[url('/assets/images/hero-pattern.svg')] opacity-10 bg-repeat"></div>
      <BackgroundShape className="h-[300px] w-[300px] md:h-[600px] md:w-[600px] bg-white -top-[150px] -left-[150px] md:-top-[300px] md:-left-[300px]" />
      <BackgroundShape className="h-[200px] w-[200px] md:h-[400px] md:w-[400px] bg-white bottom-[-100px] right-[-100px] md:bottom-[-200px] md:right-[-200px]" />
      
      <div className="container px-4 md:px-6 relative z-10">
        <div className="max-w-screen-xl mx-auto">
          <div className="flex flex-col md:flex-row gap-12 md:gap-16 items-center relative">
            {/* Left/text section */}
            <motion.div 
              className="w-full md:w-1/2 text-center md:text-left"
              initial="hidden"
              animate="visible"
              variants={containerVariants}
            >
              {/* Animated badge */}
              <motion.div variants={itemVariants}>
                <Badge className="mb-6 px-4 py-1.5 bg-white/20 backdrop-blur-sm border-white/30 text-white rounded-full inline-flex items-center gap-1.5">
                  <span className="inline-block w-2 h-2 rounded-full bg-white animate-pulse"></span>
                  <span className="text-xs font-medium tracking-wider uppercase">Azərbaycanda İlk</span>
                </Badge>
              </motion.div>
              
              {/* Tagline with animation */}
              <motion.div 
                className="relative h-[5rem] md:h-[7rem] mb-6 overflow-hidden"
                variants={itemVariants}
              >
                {taglines.map((tagline, index) => (
                  <h1 
                    key={index}
                    className="absolute inset-0 text-4xl md:text-5xl lg:text-6xl font-bold transition-all duration-500 ease-in-out"
                    style={{ 
                      opacity: currentTagline === index ? 1 : 0,
                      transform: `translateY(${(currentTagline - index) * 20}px)`, 
                      background: 
                        currentTagline === index 
                          ? "linear-gradient(to right, #ffffff, #f0f0f0)" 
                          : "none",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: currentTagline === index ? "transparent" : "white",
                    }}
                  >
                    {tagline}
                  </h1>
                ))}
              </motion.div>
              
              {/* Description */}
              <motion.p 
                className="text-lg md:text-xl text-white/90 mb-8 max-w-lg mx-auto md:mx-0 leading-relaxed"
                variants={itemVariants}
              >
                Çox rahat istifadə olunan barter platformasında istifadə etmədiyiniz əşyaları dəyişdirin və yeni əşyalar əldə edin.
              </motion.p>
              
              {/* Search form */}
              <motion.form 
                className="mb-8 max-w-lg mx-auto md:mx-0"
                variants={itemVariants}
                onSubmit={handleSearch}
              >
                <div className="relative">
                  <Input 
                    type="text" 
                    placeholder="Nə barter etmək istəyirsiniz?"
                    className="w-full h-12 pl-12 pr-32 rounded-full bg-white/10 border-white/20 text-white placeholder:text-white/60 backdrop-blur-sm focus:ring-2 focus:ring-white/30 focus:border-transparent"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <div className="absolute left-0 top-0 h-full flex items-center pl-4 text-white/70">
                    <Search className="h-5 w-5" />
                  </div>
                  <div className="absolute right-1.5 top-1.5">
                    <Button 
                      type="submit"
                      size="sm" 
                      className="rounded-full h-9 px-4 bg-white text-primary hover:bg-white/90"
                    >
                      Axtar
                    </Button>
                  </div>
                </div>
              </motion.form>
              
              {/* CTA buttons */}
              <motion.div 
                className="flex flex-col sm:flex-row gap-4 mb-12 justify-center md:justify-start"
                variants={itemVariants}
              >
                <Link href="/auth?tab=register">
                  <Button className="h-12 px-6 text-base rounded-full bg-white text-primary hover:bg-white/90 relative group shadow-lg shadow-black/10">
                    <span>Qeydiyyatdan keç</span>
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </Button>
                </Link>
                <Link href="/search">
                  <Button variant="outline" className="h-12 px-6 text-base rounded-full bg-transparent border-white text-white hover:bg-white/10 relative shadow-lg shadow-black/10">
                    Bütün elanlar
                  </Button>
                </Link>
              </motion.div>
              
              {/* Statistics */}
              <motion.div 
                className="grid grid-cols-3 gap-2 max-w-lg mx-auto md:mx-0"
                variants={itemVariants}
              >
                {stats.map((stat, index) => (
                  <div key={index} className="text-center px-2">
                    <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm">
                      {stat.icon}
                    </div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-sm text-white/70">{stat.label}</p>
                  </div>
                ))}
              </motion.div>
            </motion.div>
            
            {/* Right/image section */}
            <motion.div 
              className="w-full md:w-1/2 relative"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ 
                duration: 0.8, 
                delay: 0.3,
                ease: [0.25, 1, 0.5, 1]
              }}
            >
              {/* Main hero image */}
              <div className="relative z-20 rounded-2xl overflow-hidden shadow-2xl shadow-black/20 border border-white/10 transform rotate-1 hover:rotate-0 transition-transform duration-500">
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10"></div>
                <img 
                  src="https://nextbarter.com/uploads/banners/banner-1.webp" 
                  alt="BarterTap - Dəyişdirmə platforması" 
                  className="w-full h-auto"
                />
                
                {/* Interactive UI elements positioned over the image */}
                <div className="absolute bottom-8 left-8 z-20 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full border-2 border-white overflow-hidden">
                    <img 
                      src="https://randomuser.me/api/portraits/men/43.jpg" 
                      alt="Istifadəçi" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">Əli Məmmədov</p>
                    <div className="flex items-center">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <svg key={star} className="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                          </svg>
                        ))}
                      </div>
                      <span className="text-white/90 text-xs ml-1">32 rəy</span>
                    </div>
                  </div>
                </div>
                
                {/* Floating notification */}
                <div className="absolute top-8 right-8 z-20 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-md text-sm animate-float">
                  <p className="font-semibold text-gray-800">Yeni barter təklifi!</p>
                  <p className="text-gray-600 text-xs">Cəmi 2 dəqiqə əvvəl</p>
                </div>
              </div>
              
              {/* Decorative elements behind the main image */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[90%] h-[90%] rounded-full border-8 border-white/10 -z-10"></div>
              <div className="absolute -bottom-10 -right-10 w-80 h-80 rounded-full bg-blue-500/10 blur-3xl -z-10"></div>
            </motion.div>
          </div>
        </div>
      </div>
      
      {/* Wave bottom effect */}
      <div className="absolute -bottom-1 left-0 right-0 h-16 md:h-24">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" className="h-full w-full fill-white">
          <path fillOpacity="1" d="M0,192L48,197.3C96,203,192,213,288,202.7C384,192,480,160,576,160C672,160,768,192,864,197.3C960,203,1056,181,1152,165.3C1248,149,1344,139,1392,133.3L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
        </svg>
      </div>
      
      {/* Back to top button - appears when scrolling down */}
      {showBackToTop && (
        <motion.button 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 w-12 h-12 bg-primary text-white rounded-full shadow-lg flex items-center justify-center z-50 hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all duration-300"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3 }}
        >
          <ArrowUpCircle className="h-5 w-5" />
        </motion.button>
      )}
    </section>
  );
}