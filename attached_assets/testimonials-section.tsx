import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Quote, Star, StarHalf, Users, BadgeCheck, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Animated rating stars component
const RatingStars = ({ rating }: { rating: number }) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 !== 0;
  
  return (
    <div className="flex items-center">
      {Array.from({ length: fullStars }).map((_, i) => (
        <motion.div 
          key={`star-${i}`}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.1, duration: 0.3 }}
        >
          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
        </motion.div>
      ))}
      {hasHalfStar && (
        <motion.div 
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: fullStars * 0.1, duration: 0.3 }}
        >
          <StarHalf className="h-4 w-4 fill-yellow-400 text-yellow-400" />
        </motion.div>
      )}
      {Array.from({ length: 5 - fullStars - (hasHalfStar ? 1 : 0) }).map((_, i) => (
        <motion.div 
          key={`empty-star-${i}`}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: (fullStars + (hasHalfStar ? 1 : 0) + i) * 0.1, duration: 0.3 }}
        >
          <Star className="h-4 w-4 text-gray-300" />
        </motion.div>
      ))}
    </div>
  );
};

// Testimonial Card Component - reimplementing with more animation features
const TestimonialCard = ({ 
  testimonial, 
  isActive, 
  index 
}: { 
  testimonial: {
    id: number;
    name: string;
    location: string;
    profession: string;
    rating: number;
    content: string;
    image: string;
    exchangedItems?: string;
    story?: string;
    verified?: boolean;
    recentActivity?: {
      type: "exchange" | "review" | "joined";
      timeAgo: string;
    };
  };
  isActive: boolean;
  index: number;
}) => {
  // Define scale variants
  const cardVariants = {
    active: {
      scale: 1,
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] }
    },
    inactive: {
      scale: 0.90,
      opacity: 0.6,
      y: 10,
      filter: "blur(2px)",
      transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] }
    }
  };
  
  return (
    <motion.div
      initial="inactive"
      animate={isActive ? "active" : "inactive"}
      variants={cardVariants}
      className={cn(
        "flex flex-col rounded-2xl overflow-hidden shadow-sm transition-all",
        isActive ? "bg-white border-transparent shadow-xl" : "bg-white/80 border-gray-100 border"
      )}
      style={{ 
        zIndex: isActive ? 10 : 5 - Math.abs(index),
        cursor: isActive ? "default" : "pointer"
      }}
    >
      {/* Card Header with user info */}
      <div className="p-6 pb-0">
        <div className="flex items-center gap-4 mb-4">
          <div className="relative h-14 w-14 rounded-full overflow-hidden border-2 border-white shadow-sm">
            <img
              src={testimonial.image}
              alt={testimonial.name}
              className="h-full w-full object-cover"
            />
            {testimonial.verified && (
              <div className="absolute -bottom-1 -right-1 bg-primary text-white rounded-full p-0.5">
                <BadgeCheck className="h-3 w-3" />
              </div>
            )}
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-1.5">
              <h3 className="font-semibold text-gray-900">{testimonial.name}</h3>
              {testimonial.verified && (
                <Badge variant="outline" className="px-1.5 py-0 text-[10px] bg-blue-50 text-blue-600 border-blue-100">
                  Təsdiqlənmiş
                </Badge>
              )}
            </div>
            <p className="text-gray-500 text-sm">{testimonial.profession}</p>
            <p className="text-gray-400 text-xs">{testimonial.location}</p>
          </div>
          
          <div className="relative">
            <Quote className="h-8 w-8 text-primary/10" />
          </div>
        </div>
        
        <div className="mb-2 flex justify-between items-center">
          <RatingStars rating={testimonial.rating} />
          
          {testimonial.recentActivity && (
            <div className="text-xs text-gray-500 flex items-center">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5 animate-pulse"></span>
              <span>
                {testimonial.recentActivity.type === "exchange" && "Dəyişdirdi:"}
                {testimonial.recentActivity.type === "review" && "Rəy yazdı:"}
                {testimonial.recentActivity.type === "joined" && "Qoşuldu:"}
              </span>
              <span className="ml-1 text-gray-400">{testimonial.recentActivity.timeAgo}</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Card body with testimonial content */}
      <div className="p-6 pt-3 flex-1 flex flex-col">
        {/* Main testimonial text */}
        <p className="text-gray-700 italic mb-4 flex-1">
          "{testimonial.content}"
        </p>
        
        {/* Optional details */}
        {isActive && testimonial.exchangedItems && (
          <div className="mt-auto">
            <div className="text-sm text-gray-900 font-medium mb-1">Dəyişdirdiyi əşya:</div>
            <p className="text-sm text-gray-600">{testimonial.exchangedItems}</p>
          </div>
        )}
        
        {isActive && testimonial.story && (
          <motion.div 
            className="mt-4 bg-gray-50 p-3 rounded-lg text-sm text-gray-600"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <div className="font-medium text-gray-700 mb-1">Müştəri hekayəsi:</div>
            {testimonial.story}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

// Rich testimonial data with added details
const testimonials = [
  {
    id: 1,
    name: "Aynur Məmmədova",
    location: "Bakı, Nəsimi",
    profession: "Müəllim",
    rating: 5,
    content: "BarterTap.az mənim üçün əla platformadır. Artıq ehtiyacım olmayan telefonumu yeni noutbuka dəyişə bildim. Prosses çox rahat və təhlükəsiz keçdi.",
    image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150&q=80",
    exchangedItems: "iPhone 12 → Asus ZenBook",
    story: "Uzun müddət idi ki, telefonu satıb noutbuk almaq istəyirdim, amma qiymətləri uyğunlaşdıra bilmirdim. BarterTap sayəsində telefonumu birbaşa noutbuka dəyişdim və heç bir əlavə xərc çəkmədim. İndi dərslərim üçün lazım olan bütün materialları rahatca hazırlaya bilirəm.",
    verified: true,
    recentActivity: {
      type: "exchange",
      timeAgo: "3 gün əvvəl"
    }
  },
  {
    id: 2,
    name: "Elçin Həsənov",
    location: "Bakı, Yasamal",
    profession: "Proqramçı",
    rating: 4,
    content: "Hobbi olaraq kitab toplamağı sevirəm. Bu platformada artıq oxuduğum kitabları dəyişərək yeni kitablar əldə edirəm. Çox faydalıdır və pul xərcləmirəm!",
    image: "https://images.unsplash.com/photo-1583864697784-a0efc8379f70?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150&q=80",
    exchangedItems: "12 kitab dəyişdirilib",
    verified: true,
    recentActivity: {
      type: "review",
      timeAgo: "1 həftə əvvəl"
    }
  },
  {
    id: 3,
    name: "Səbinə Əzizova",
    location: "Gəncə",
    profession: "Dizayner",
    rating: 4.5,
    content: "Uşaqlar tez böyüyür və geyimləri tez kiçik gəlir. BarterTap.az vasitəsilə uşaq geyimlərini dəyişmək çox əlverişli oldu. Həm də ətraf mühitə zərər vermədən.",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150&q=80",
    exchangedItems: "Uşaq geyimləri → Oyuncaqlar",
    story: "İki uşağım var və onların ehtiyacları tez dəyişir. Platformada digər valideynlərlə geyimləri və oyuncaqları dəyişərək böyük bir qənaət etdim. Eyni zamanda çoxlu yeni dostlar qazandım!",
    verified: true
  },
  {
    id: 4,
    name: "Rauf Kərimli",
    location: "Sumqayıt",
    profession: "Mühəndis",
    rating: 5,
    content: "PlayStation 5-i Apple MacBook Pro-ya dəyişdim və bu, büdcəmə qənaət etməyə kömək etdi. Dəyişdirmə prosesi çox rahat keçdi və qarşı tərəflə heç bir problem yaşamadım.",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150&q=80",
    exchangedItems: "PS5 → MacBook Pro",
    verified: true,
    recentActivity: {
      type: "exchange",
      timeAgo: "2 gün əvvəl"
    }
  },
  {
    id: 5,
    name: "Lalə Hüseynova",
    location: "Bakı, Xətai",
    profession: "Həkim",
    rating: 4,
    content: "Təbiətə qayğı göstərərək ikinci əl əşyaları dəyişdirirəm. Bu platforma artıq istifadə etmədiyim əşyaları dəyişdirməyə və yeni məhsullar əldə etməyə imkan yaradır.",
    image: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150&q=80",
    exchangedItems: "Fitnes avadanlığı → Mətbəx texnikası",
    verified: false,
    recentActivity: {
      type: "joined",
      timeAgo: "5 gün əvvəl"
    }
  },
  {
    id: 6,
    name: "Toğrul Əliyev",
    location: "Bakı, Binəqədi",
    profession: "Fotoqraf",
    rating: 5,
    content: "Köhnə Canon fotoaparatımı daha üst model Sony kamerasına dəyişdim və prosesdən çox məmnun qaldım. BarterTap sayəsində peşəkar avadanlığımı yeniləyə bildim.",
    image: "https://images.unsplash.com/photo-1639747280929-e84ef392c69a?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150&q=80",
    exchangedItems: "Canon EOS R6 → Sony A7 IV",
    story: "Fotoqraf kimi avadanlıqlarımın yüksək səviyyədə olması çox vacibdir. BarterTap platformasında öz fotoaparatımı əlavə pul ödəmədən daha müasir bir modelə dəyişə bildim. İndi müştərilərimə daha keyfiyyətli xidmət göstərə bilirəm.",
    verified: true
  }
];

export default function TestimonialsSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [autoplay, setAutoplay] = useState(true);
  const autoplayRef = useRef<NodeJS.Timeout | null>(null);
  
  // Get only the visible testimonials (3 at a time for desktop)
  const visibleTestimonials = testimonials.slice(
    activeIndex, 
    Math.min(activeIndex + 3, testimonials.length)
  );
  
  // Stats for the section
  const stats = {
    totalUsers: "15,000+",
    satisfactionRate: "98%",
    exchangeCompleted: "25,000+"
  };
  
  // Handle navigation
  const handleNext = () => {
    if (activeIndex + 3 < testimonials.length) {
      setActiveIndex(prev => prev + 1);
    } else {
      setActiveIndex(0); // Loop back to start
    }
  };
  
  const handlePrev = () => {
    if (activeIndex > 0) {
      setActiveIndex(prev => prev - 1);
    } else {
      setActiveIndex(testimonials.length - 3); // Go to last set
    }
  };
  
  // Setup autoplay
  useEffect(() => {
    if (autoplay) {
      autoplayRef.current = setInterval(() => {
        handleNext();
      }, 5000);
    }
    
    return () => {
      if (autoplayRef.current) {
        clearInterval(autoplayRef.current);
        autoplayRef.current = null;
      }
    };
  }, [autoplay, activeIndex]);
  
  // Pause autoplay when user interacts
  const pauseAutoplay = () => {
    setAutoplay(false);
    
    // Resume after 10 seconds of inactivity
    setTimeout(() => {
      setAutoplay(true);
    }, 10000);
  };

  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-white to-gray-50 overflow-hidden relative">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/3 w-96 h-96 bg-blue-50 rounded-full blur-3xl"></div>
      </div>
      
      <div className="container px-4 md:px-6 relative">
        {/* Section header with stats */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="max-w-2xl"
          >
            <Badge className="mb-4 px-3 py-1 bg-primary/10 text-primary border-primary/30 rounded-full">
              İstifadəçi təcrübəsi
            </Badge>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Uğurlu <span className="text-primary">müştəri hekayələri</span>
            </h2>
            <p className="text-gray-600 text-lg">
              İstifadəçilərimizin platforma haqqında real təcrübələri və fikirləri. Siz də BarterTap ailəsinə qoşula və öz hekayənizi paylaşa bilərsiniz.
            </p>
          </motion.div>
          
          <motion.div 
            className="flex flex-wrap gap-8 mt-8 md:mt-0"
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Users className="h-5 w-5 text-primary" />
                <span className="text-2xl md:text-3xl font-bold text-gray-900">{stats.totalUsers}</span>
              </div>
              <p className="text-sm text-gray-500">İstifadəçi</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                <span className="text-2xl md:text-3xl font-bold text-gray-900">{stats.satisfactionRate}</span>
              </div>
              <p className="text-sm text-gray-500">Məmnuniyyət</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <MessageSquare className="h-5 w-5 text-green-600" />
                <span className="text-2xl md:text-3xl font-bold text-gray-900">{stats.exchangeCompleted}</span>
              </div>
              <p className="text-sm text-gray-500">Dəyişdirmə</p>
            </div>
          </motion.div>
        </div>
        
        {/* Main testimonials carousel */}
        <div className="relative">
          {/* Navigation buttons */}
          <div className="absolute top-1/2 -left-4 md:-left-8 transform -translate-y-1/2 z-10">
            <Button
              variant="outline"
              size="icon"
              className="rounded-full h-12 w-12 bg-white shadow-md hover:bg-primary hover:text-white border-gray-100"
              onClick={() => {
                handlePrev();
                pauseAutoplay();
              }}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </div>
          
          <div className="absolute top-1/2 -right-4 md:-right-8 transform -translate-y-1/2 z-10">
            <Button
              variant="outline"
              size="icon"
              className="rounded-full h-12 w-12 bg-white shadow-md hover:bg-primary hover:text-white border-gray-100"
              onClick={() => {
                handleNext();
                pauseAutoplay();
              }}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
          
          {/* Testimonial cards */}
          <div className="overflow-hidden mx-4">
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <AnimatePresence mode="wait">
                {visibleTestimonials.map((testimonial, index) => (
                  <div 
                    key={testimonial.id}
                    onClick={() => {
                      if (index !== 1) {
                        // If clicking on a side card, make it active
                        setActiveIndex(activeIndex + index - 1);
                        pauseAutoplay();
                      }
                    }}
                  >
                    <TestimonialCard 
                      testimonial={testimonial}
                      isActive={index === 1} // Middle card is active
                      index={index}
                    />
                  </div>
                ))}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
        
        {/* Pagination indicators */}
        <div className="flex justify-center mt-10">
          {testimonials.map((_, index) => (
            <button
              key={index}
              className={cn(
                "w-2 h-2 rounded-full mx-1 transition-all",
                index >= activeIndex && index < activeIndex + 3 
                  ? "bg-primary w-4" 
                  : "bg-gray-300 hover:bg-gray-400"
              )}
              onClick={() => {
                setActiveIndex(index);
                pauseAutoplay();
              }}
              aria-label={`Go to testimonial ${index + 1}`}
            />
          ))}
        </div>
        
        {/* Call to action */}
        <motion.div 
          className="mt-16 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <p className="text-lg text-gray-600 mb-4">
            Siz də BarterTap istifadəçiləri ailəsinə qoşulun və öz barter təcrübənizi yaşayın
          </p>
          <Button 
            size="lg" 
            className="rounded-full px-8 bg-primary hover:bg-primary/90"
            onClick={() => window.location.href = "/auth?tab=register"}
          >
            İndi qoşulun
          </Button>
          
          <p className="mt-4 text-sm text-gray-500">
            Artıq 15,000+ istifadəçi BarterTap-da əşyalarını dəyişdirir
          </p>
        </motion.div>
      </div>
    </section>
  );
}
