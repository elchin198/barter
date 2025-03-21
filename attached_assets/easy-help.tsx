import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HelpCircle, X, ChevronRight, MessageCircle, PhoneCall, Mail, FileText, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface HelpItem {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  link?: string;
  action?: () => void;
}

export function EasyHelp() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  const helpItems: HelpItem[] = [
    {
      id: "howto",
      title: "Necə işləyir?",
      description: "BarterTap.az platformasında əşyaları necə dəyişdirə bilərsiniz - addım-addım təlimat",
      icon: <Home className="h-5 w-5 text-primary" />,
      link: "/how-it-works",
    },
    {
      id: "message",
      title: "Canlı dəstək",
      description: "Operatorlarımızla canlı söhbət vasitəsilə əlaqə saxlayın",
      icon: <MessageCircle className="h-5 w-5 text-green-500" />,
      action: () => window.open("https://chat.bartertap.az", "_blank"),
    },
    {
      id: "call",
      title: "Telefon dəstəyi",
      description: "Texniki dəstək xidmətimizə zəng edin: +994 50 123 45 67",
      icon: <PhoneCall className="h-5 w-5 text-blue-500" />,
      action: () => window.location.href = "tel:+994501234567",
    },
    {
      id: "email",
      title: "E-poçt dəstəyi",
      description: "Bizə sorğunuzu göndərin, 24 saat ərzində cavab verəcəyik",
      icon: <Mail className="h-5 w-5 text-purple-500" />,
      action: () => window.location.href = "mailto:support@bartertap.az",
    },
    {
      id: "faq",
      title: "Tez-tez soruşulan suallar",
      description: "Platformamız haqqında tez-tez soruşulan suallar və cavablar",
      icon: <FileText className="h-5 w-5 text-orange-500" />,
      link: "/faq",
    },
  ];

  const toggleHelp = () => {
    setIsOpen(!isOpen);
    if (isOpen) {
      setSelectedItem(null);
    }
  };

  const handleItemClick = (item: HelpItem) => {
    if (item.action) {
      item.action();
    } else if (item.link) {
      window.location.href = item.link;
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-40">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="absolute bottom-16 right-0 bg-white rounded-xl shadow-2xl border border-gray-100 w-80 overflow-hidden mb-2"
          >
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-medium text-gray-800">Necə kömək edə bilərik?</h3>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 rounded-full hover:bg-gray-100" 
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="max-h-[70vh] overflow-y-auto py-2">
              {helpItems.map((item) => (
                <motion.div
                  key={item.id}
                  className="px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
                  whileHover={{ backgroundColor: "#f5f8ff" }}
                  onClick={() => handleItemClick(item)}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">{item.icon}</div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-800">{item.title}</h4>
                      <p className="text-sm text-gray-500">{item.description}</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400 self-center" />
                  </div>
                </motion.div>
              ))}
            </div>
            <div className="p-4 border-t border-gray-100 text-center">
              <span className="text-xs text-gray-500">© 2025 BarterTap.az - Hər bir hüquq qorunur</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.button
              className="bg-primary text-white rounded-full p-3 shadow-lg hover:bg-primary/90 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleHelp}
            >
              {isOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <HelpCircle className="h-6 w-6" />
              )}
            </motion.button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>Kömək lazımdırsa, bura klikləyin</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}