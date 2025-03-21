import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Camera, 
  Tag, 
  Sparkles, 
  MessageCircle,
  Check, 
  ThumbsUp, 
  PackageCheck 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";

interface Step {
  title: string;
  description: string;
  image?: string;
  tips: string[];
  icon: React.ReactNode;
}

export function OnboardingGuide() {
  const [location] = useLocation();
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  
  // Only show onboarding on relevant pages and to authenticated users
  const isRelevantPage = location.startsWith('/create-item') || location === '/profile';
  
  // Check if this is the user's first time (could be stored in localStorage or on the server)
  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');
    if (user && isRelevantPage && !hasSeenOnboarding && !dismissed) {
      // Show after a slight delay to not interrupt initial page load
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [user, isRelevantPage, dismissed]);
  
  const steps: Step[] = [
    {
      title: "Elan yaradın",
      description: "Dəyişmək istədiyiniz əşya haqqında detallı məlumat verin. Əşyanın adı, kateqoriyası və vəziyyəti çox önəmlidir.",
      icon: <PackageCheck className="h-5 w-5 text-primary" />,
      tips: [
        "Əşyanın adını tam və düzgün yazın",
        "Əşyanın vəziyyətini dəqiq təsvir edin",
        "Əşyanın özəlliklərini qeyd edin"
      ]
    },
    {
      title: "Keyfiyyətli şəkillər əlavə edin",
      description: "Əşyanın keyfiyyətli şəkillərini əlavə edin. Şəkillər müxtəlif bucaqlardan və yaxşı işıqlandırılmış olmalıdır.",
      icon: <Camera className="h-5 w-5 text-green-500" />,
      tips: [
        "Ən azı 3-4 şəkil əlavə edin",
        "Müxtəlif bucaqlardan şəkillər çəkin",
        "Yaxşı işıqlandırılmış şəkillər daha cəlbedicidir"
      ]
    },
    {
      title: "Nə ilə dəyişmək istədiyinizi yazın",
      description: "Hansı əşya ilə dəyişmək istədiyinizi dəqiq qeyd edin. Bu, uyğun təkliflər almanıza kömək edəcək.",
      icon: <Tag className="h-5 w-5 text-purple-500" />,
      tips: [
        "Konkret əşya və ya kateqoriya qeyd edin",
        "Qiymət aralığını dəqiqləşdirin",
        "Bir neçə alternativ variant yazın"
      ]
    },
    {
      title: "Mesajları cavablandırın",
      description: "Təkliflərə vaxtında cavab verin. Sürətli və peşəkar cavablar daha çox uğur qazandırır.",
      icon: <MessageCircle className="h-5 w-5 text-blue-500" />,
      tips: [
        "Mesajlara 24 saat ərzində cavab verin",
        "Qarşı tərəflə hörmətlə danışın",
        "Əlavə sualları səbirlə cavablandırın"
      ]
    },
    {
      title: "Barter prosesini tamamlayın",
      description: "Dəyişdirmə prosesini platformada tamamlamağı unutmayın. Bu, digər istifadəçilərə rəy yazmanıza imkan verəcək.",
      icon: <ThumbsUp className="h-5 w-5 text-amber-500" />,
      tips: [
        "Əşyaları təhvil verdikdən sonra platformada prosesi tamamlayın",
        "Qarşı tərəfə müsbət rəy yazın",
        "İstifadəçilərin reytinqi yüksək olduqca daha çox etibar qazanırlar"
      ]
    }
  ];
  
  const handleDismiss = () => {
    setIsVisible(false);
    setDismissed(true);
    localStorage.setItem('hasSeenOnboarding', 'true');
  };
  
  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleDismiss();
    }
  };
  
  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };
  
  if (!isVisible) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-white rounded-xl max-w-lg w-full shadow-xl relative overflow-hidden"
        >
          {/* Progress bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gray-100">
            <motion.div
              className="h-full bg-primary"
              initial={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
              animate={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          
          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 z-10 rounded-full h-8 w-8"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
          
          <div className="p-6 pt-8">
            <Badge className="mb-3 bg-primary/10 text-primary hover:bg-primary/20 border-primary/30">
              İpucu {currentStep + 1}/{steps.length}
            </Badge>
            
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100 shadow-sm mt-1">
                {steps[currentStep].icon}
              </div>
              
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {steps[currentStep].title}
                </h3>
                <p className="text-gray-600 mb-4">
                  {steps[currentStep].description}
                </p>
                
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                  <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Faydalı məsləhətlər:
                  </h4>
                  <ul className="space-y-1.5">
                    {steps[currentStep].tips.map((tip, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-green-500 mt-0.5" />
                        <span className="text-sm text-gray-600">{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="flex justify-between pt-4 border-t border-gray-100 mt-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePrev}
                disabled={currentStep === 0}
                className={currentStep === 0 ? "invisible" : ""}
              >
                <ChevronLeft className="mr-1 h-4 w-4" /> Əvvəlki
              </Button>
              
              <Button size="sm" onClick={handleNext}>
                {currentStep === steps.length - 1 ? (
                  <span>Başa düşdüm</span>
                ) : (
                  <>
                    <span>Növbəti</span>
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}