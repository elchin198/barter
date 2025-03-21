import { useState, useRef, useEffect } from "react";
import { motion, useInView, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { 
  ChevronRight, 
  UserPlus, 
  Package, 
  ArrowLeftRight, 
  CheckCircle, 
  MessageSquare,
  ShoppingBag,
  LucideIcon,
  MessageCircle,
  Camera,
  Search,
  MapPin
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.3,
      delayChildren: 0.2
    }
  }
};

const stepVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.15,
      duration: 0.5,
      ease: [0.4, 0, 0.2, 1]
    }
  }),
  hover: { 
    y: -5, 
    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
    transition: { duration: 0.3 }
  }
};

const pathVariants = {
  hidden: { pathLength: 0 },
  visible: {
    pathLength: 1,
    transition: { duration: 1.5, ease: "easeInOut" }
  }
};

// Step interface
interface Step {
  number: string;
  title: string;
  description: string;
  detailedDescription: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  features: string[];
  image?: string;
  tipTitle?: string;
  tipContent?: string;
}

export default function HowItWorksSection() {
  const [selectedStep, setSelectedStep] = useState<number | null>(null);
  const [hoveredStep, setHoveredStep] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.3 });
  
  // Counter for active step users
  const count = useMotionValue(0);
  const roundedCount = useTransform(count, Math.round);
  
  // Update counter over time
  useEffect(() => {
    if (isInView) {
      const timer = setTimeout(() => {
        const animation = count.set(5267);
        return () => animation;
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [isInView, count]);

  // Enhanced steps data
  const steps: Step[] = [
    {
      number: "01",
      title: "Qeydiyyatdan keçin",
      description: "Pulsuz qeydiyyatdan keçin və əşya dəyişdirməyə hazır olun",
      detailedDescription: "Sadə qeydiyyat prosesi ilə platformamıza qoşulun. Yalnız əsas məlumatları daxil edin və dərhal istifadəyə başlayın. Qeydiyyat tamamilə pulsuzdur və heç bir gizli ödəniş yoxdur.",
      icon: UserPlus,
      color: "#367BF5",
      bgColor: "#EEF4FF",
      features: [
        "Ani qeydiyyat prosesi",
        "E-poçt və ya sosial şəbəkə ilə giriş",
        "Profil fotosu və məlumatları əlavə edin",
        "Lokasiya və üstünlüklərinizi təyin edin"
      ],
      image: "https://nextbarter.com/uploads/app/registration.webp",
      tipTitle: "İpucu",
      tipContent: "Profilinizi tam doldurduqda digər istifadəçilər sizə daha çox etibar edir və daha çox barter təklifi alırsınız."
    },
    {
      number: "02",
      title: "Əşyanı əlavə edin",
      description: "Əşyalarınızı əlavə edin və barter etmək istədiyinizi qeyd edin",
      detailedDescription: "İstifadə etmədiyiniz əşyaları sadə şəkildə platforma yüklə. Yüksək keyfiyyətli şəkillər çəkin, dəqiq təsvir yazın və hansı əşyalarla dəyişdirmək istədiyinizi göstərin.",
      icon: Package,
      color: "#10b981",
      bgColor: "#ECFDF5",
      features: [
        "Detallı kateqoriyalaşdırma",
        "Çoxlu şəkil yükləmə imkanı",
        "Avtomatik olaraq lokasiya əlavəsi",
        "Nə ilə dəyişdirmək istədiyinizi qeyd edin"
      ],
      image: "https://nextbarter.com/uploads/app/add-item.webp",
      tipTitle: "Statistika",
      tipContent: "Keyfiyyətli şəkilləri olan elanlar 5 dəfə daha çox baxış və 3 dəfə daha çox dəyişdirmə təklifi alır."
    },
    {
      number: "03",
      title: "Maraqlı əşyaları tapın",
      description: "Sizə lazım olan əşyaları tapın və dəyişdirmə təklifi göndərin",
      detailedDescription: "Platforma daxilində minlərlə əşya arasından axtarış edərək sizə lazım olanı tapın. Ətraflı filtrlər, kateqoriyalar və axtarış funksiyaları ilə axtarışınızı dəqiqləşdirin.",
      icon: Search,
      color: "#a855f7",
      bgColor: "#F5F3FF",
      features: [
        "Ətraflı axtarış sistemi",
        "Lokasiyaya görə filtrlə",
        "Kateqoriyalara görə axtarış",
        "Çoxlu filtrlər və çeşidləmə"
      ],
      image: "https://nextbarter.com/uploads/app/search-items.webp"
    },
    {
      number: "04",
      title: "Təklif göndərin",
      description: "Seçdiyiniz əşya üçün sizin əşyanızla dəyişdirmək təklifi göndərin",
      detailedDescription: "Bəyəndiyiniz əşya üçün dəyişdirmə təklifi göndərin. Öz əşyanızı seçin və əlavə təfərrüatlar yazın. Canlı söhbət vasitəsilə əşya sahibi ilə əlaqə yarada bilərsiniz.",
      icon: ArrowLeftRight,
      color: "#f97316",
      bgColor: "#FFF7ED",
      features: [
        "Bir neçə əşya ilə təklif göndərmə",
        "Real vaxt bildirişləri",
        "Canlı söhbət sistemi",
        "Təkliflərə sürətli cavab"
      ],
      image: "https://nextbarter.com/uploads/app/make-offer.webp",
      tipTitle: "Məsləhət",
      tipContent: "Təklif göndərərkən şəxsi məlumatlarınızı bölüşməyin. Platformanın təhlükəsiz mesajlaşma sistemindən istifadə edin."
    },
    {
      number: "05",
      title: "Görüş təyin edin",
      description: "Təklifiniz qəbul edildikdən sonra əşyanı dəyişdirmək üçün görüş təyin edin",
      detailedDescription: "Platformada təhlükəsiz görüş nöqtələrini seçə bilərsiniz. Görüşü planlaşdırdıqdan sonra, təsdiqlə və barter üçün hazır olun. Görüş vaxtını avtomatik təqvimində saxla.",
      icon: MapPin,
      color: "#0ea5e9",
      bgColor: "#EFF6FF",
      features: [
        "Təhlükəsiz görüş nöqtələri",
        "Planlaşdırma təqvimi",
        "Avtomatik xatırlatmalar",
        "Görüş yeri xəritəsi"
      ]
    },
    {
      number: "06",
      title: "Dəyişdirməni tamamlayın",
      description: "Görüşdə əşyaları dəyişdirərək prosesi tamamlayın və rəy bildirin",
      detailedDescription: "Əşyaları fiziki olaraq dəyişdikdən sonra platformada dəyişdirməni təsdiqləyin. Qarşı tərəf haqqında rəy yazın və xallarınızı toplayın ki, gələcəkdə daha çox etibar qazanasınız.",
      icon: CheckCircle,
      color: "#22c55e",
      bgColor: "#ECFDF5",
      features: [
        "Əşya təsdiq sistemi",
        "Rəy və reytinq vermə",
        "Xal qazanma sistemi",
        "Qazanılan təcrübə səviyyəsi"
      ],
      tipTitle: "Vacib",
      tipContent: "Əşyanı təhvil verərkən əşyanın vəziyyətini yoxlayın və yalnız dəyişdirmədən razı qaldıqdan sonra platformada təsdiqləyin."
    }
  ];

  // Select a step to display details
  const handleStepSelect = (index: number) => {
    setSelectedStep(index === selectedStep ? null : index);
  };

  return (
    <section className="py-16 md:py-24 relative overflow-hidden bg-gray-50">
      {/* Background decoration */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl opacity-50"></div>
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-50 rounded-full blur-3xl opacity-50"></div>
      
      <div className="container px-4 md:px-6 relative" ref={containerRef}>
        {/* Section header */}
        <motion.div 
          className="text-center max-w-3xl mx-auto mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <Badge className="mb-4 px-3 py-1 bg-primary/10 text-primary border-primary/30 rounded-full">
            İstifadə prosesi
          </Badge>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 relative">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600">Sadə</span> və <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 to-teal-600">sürətli</span> proses
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-primary rounded-full opacity-70"></div>
          </h2>
          <p className="text-gray-600 text-lg">
            BarterTap.az platforması ilə əşyalarınızı dəyişdirmək üçün sadə addımlar
          </p>
          
          {/* Active users counter */}
          <div className="mt-8 bg-gradient-to-r from-primary/10 to-primary/5 rounded-full py-3 px-5 inline-flex items-center gap-2 border border-primary/20">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <motion.span className="font-bold">{roundedCount}</motion.span>
            <span className="text-gray-700">istifadəçi hazırda aktivdir</span>
          </div>
        </motion.div>
        
        {/* Main steps display */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-3 mb-12"
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          {steps.map((step, index) => (
            <motion.div 
              key={step.number}
              className="relative"
              variants={stepVariants}
              custom={index}
              whileHover="hover"
              onMouseEnter={() => setHoveredStep(index)}
              onMouseLeave={() => setHoveredStep(null)}
              onClick={() => handleStepSelect(index)}
            >
              <motion.div 
                className={`bg-white rounded-xl border border-gray-100 shadow-sm transition-all p-6 flex flex-col h-full cursor-pointer ${selectedStep === index ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                style={{ background: hoveredStep === index || selectedStep === index ? step.bgColor : 'white' }}
              >
                {/* Step number badge */}
                <div className="absolute top-0 left-0 w-8 h-8 rounded-tl-xl rounded-br-xl flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: step.color }}>
                  {step.number}
                </div>
                
                {/* Icon */}
                <div className={`w-14 h-14 rounded-full border shadow-sm flex items-center justify-center mx-auto mb-4`} style={{ backgroundColor: step.bgColor, borderColor: `${step.color}30` }}>
                  <step.icon className="h-6 w-6" style={{ color: step.color }} />
                </div>
                
                {/* Content */}
                <h3 className="text-center text-base font-semibold mb-2 text-gray-900">{step.title}</h3>
                <p className="text-center text-gray-600 text-sm">{step.description}</p>
                
                {/* Connection arrow */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-8 transform -translate-y-1/2 text-gray-300 z-10">
                    <ChevronRight className="h-5 w-5" />
                  </div>
                )}
              </motion.div>
            </motion.div>
          ))}
        </motion.div>
        
        {/* Selected step details */}
        <AnimatePresence>
          {selectedStep !== null && (
            <motion.div 
              className="mt-8 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: steps[selectedStep].color }}>
                      {steps[selectedStep].number}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">{steps[selectedStep].title}</h3>
                  </div>
                  
                  <p className="text-gray-700 mb-6">
                    {steps[selectedStep].detailedDescription}
                  </p>
                  
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-900 mb-3">Özəlliklər:</h4>
                    <ul className="space-y-2">
                      {steps[selectedStep].features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <div className="mt-1 text-primary">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <motion.path
                                d="M22 11.08V12a10 10 0 1 1-5.93-9.14"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                variants={pathVariants}
                                initial="hidden"
                                animate="visible"
                              />
                              <motion.path
                                d="M22 4L12 14.01l-3-3"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                variants={pathVariants}
                                initial="hidden"
                                animate="visible"
                              />
                            </svg>
                          </div>
                          <span className="text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {steps[selectedStep].tipTitle && (
                    <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4">
                      <h4 className="font-semibold text-yellow-800 flex items-center gap-2 mb-2">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M12 8V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        {steps[selectedStep].tipTitle}
                      </h4>
                      <p className="text-sm text-yellow-700">{steps[selectedStep].tipContent}</p>
                    </div>
                  )}
                </div>
                
                {/* Image preview */}
                {steps[selectedStep].image && (
                  <div className="h-64 md:h-auto rounded-xl overflow-hidden bg-gray-100 shadow-inner">
                    <img 
                      src={steps[selectedStep].image} 
                      alt={steps[selectedStep].title} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>
              
              {/* Action buttons */}
              <div className="border-t border-gray-100 bg-gray-50 p-4 flex justify-between items-center">
                {selectedStep > 0 && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSelectedStep(selectedStep - 1)}
                    className="text-gray-600"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    <span>Əvvəlki</span>
                  </Button>
                )}
                
                {selectedStep < steps.length - 1 ? (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => setSelectedStep(selectedStep + 1)}
                    className="ml-auto"
                  >
                    <span>Növbəti</span>
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                ) : (
                  <Link href="/auth?tab=register" className="ml-auto">
                    <Button variant="default" size="sm">
                      <span>İndi qeydiyyatdan keç</span>
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </Link>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Call to Action */}
        <motion.div 
          className="mt-16 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.5 }}
        >
          <Link href="/auth?tab=register">
            <Button 
              size="lg" 
              className="rounded-full px-8 shadow-md bg-primary hover:bg-primary/90 mx-auto"
            >
              İndi barter etməyə başla
            </Button>
          </Link>
          
          <div className="mt-6 flex justify-center gap-8 text-center">
            <div>
              <div className="flex items-center justify-center gap-1">
                <ShoppingBag className="h-4 w-4 text-primary" />
                <span className="font-semibold text-gray-900">500+</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Gündəlik dəyişdirmə</p>
            </div>
            
            <div>
              <div className="flex items-center justify-center gap-1">
                <MessageCircle className="h-4 w-4 text-primary" />
                <span className="font-semibold text-gray-900">5 dəq</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Orta cavab müddəti</p>
            </div>
            
            <div>
              <div className="flex items-center justify-center gap-1">
                <Camera className="h-4 w-4 text-primary" />
                <span className="font-semibold text-gray-900">10+</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Şəkil yükləmə limiti</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}