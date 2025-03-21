import React from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { 
  Smartphone, 
  Shirt, 
  Sofa, 
  Car, 
  Home, 
  Dumbbell, 
  Baby, 
  BookOpen, 
  Package,
  Gamepad,
  Utensils,
  Palette,
  LucideIcon,
  ChevronRight,
  Sparkles
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface CategoryCardProps {
  category: {
    name: string;
    displayName: string;
    icon: string;
    color: string;
  };
  variant?: 'slide' | 'grid' | 'featured';
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
  count?: number;
  isNew?: boolean;
  isPopular?: boolean;
  index?: number; // For staggered animations
}

// Map category names to Lucide icons
const iconMap: Record<string, LucideIcon> = {
  'electronics': Smartphone,
  'clothing': Shirt,
  'furniture': Sofa,
  'auto': Car,
  'realestate': Home,
  'sports': Dumbbell,
  'kids': Baby,
  'books': BookOpen,
  'games': Gamepad,
  'food': Utensils,
  'art': Palette,
  'other': Package
};

// Animation variants
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
      ease: [0.25, 1, 0.5, 1]
    }
  }),
  hover: { 
    y: -8,
    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
  }
};

const iconVariants = {
  hidden: { scale: 0.8, opacity: 0 },
  visible: { 
    scale: 1, 
    opacity: 1,
    transition: { 
      type: "spring",
      stiffness: 150,
      damping: 15 
    } 
  },
  hover: { scale: 1.15, rotate: 5 }
};

export default function CategoryCard({ 
  category, 
  variant = 'slide', 
  size = 'md',
  showCount = false,
  count = 0,
  isNew = false,
  isPopular = false,
  index = 0
}: CategoryCardProps) {
  // Get icon component
  const IconComponent = iconMap[category.name] || Package;
  
  // Get icon size based on card size
  const getIconSize = () => {
    switch (size) {
      case 'sm': return 'h-4 w-4';
      case 'lg': return 'h-6 w-6';
      default: return 'h-5 w-5';
    }
  };

  // Generate a lighter background color for the icon
  const getBgColor = () => {
    return `${category.color}15`; // 15% opacity
  };
  
  // Generate darker text/border color
  const getDarkerColor = () => {
    return `${category.color}`;
  };
  
  // Convert hex to rgba for overlays
  const hexToRgba = (hex: string, alpha: number): string => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };
  
  // Determine badge based on props
  const renderBadge = () => {
    if (isNew) {
      return (
        <Badge 
          className="absolute top-2 right-2 px-2 py-1 bg-green-100 text-green-800 shadow-sm text-[10px]"
        >
          Yeni
        </Badge>
      );
    }
    
    if (isPopular) {
      return (
        <Badge
          className="absolute top-2 right-2 px-2 py-1 bg-orange-100 text-orange-800 shadow-sm text-[10px] flex items-center gap-1"
        >
          <Sparkles className="h-3 w-3" />
          <span>Populyar</span>
        </Badge>
      );
    }
    
    return null;
  };

  // Slide variant (for horizontal scrolling)
  if (variant === 'slide') {
    return (
      <Link href={`/category/${category.name}`}>
        <motion.div 
          className="flex flex-col items-center justify-center bg-white rounded-[20px] p-2 h-[90px] w-[75px] text-center shadow-sm hover:shadow-md cursor-pointer transition-all border border-gray-100"
          initial="hidden"
          animate="visible"
          whileHover="hover"
          custom={index}
          variants={cardVariants}
        >
          <motion.div 
            className={cn(
              "flex items-center justify-center rounded-full mb-2 border", 
              size === 'sm' ? "w-10 h-10" : size === 'lg' ? "w-16 h-16" : "w-12 h-12"
            )}
            style={{ 
              backgroundColor: getBgColor(), 
              borderColor: `${category.color}30` 
            }}
            variants={iconVariants}
          >
            <IconComponent className={cn(getIconSize())} style={{ color: category.color }} />
          </motion.div>
          <p className="text-[11px] font-medium text-gray-700 max-w-full overflow-hidden text-ellipsis whitespace-nowrap">
            {category.displayName}
          </p>
          
          {showCount && count > 0 && (
            <span className="text-[9px] text-gray-500 mt-0.5">
              {count} elan
            </span>
          )}
        </motion.div>
      </Link>
    );
  }
  
  // Featured variant (for highlighting specific categories)
  if (variant === 'featured') {
    return (
      <Link href={`/category/${category.name}`}>
        <motion.div 
          className="relative overflow-hidden rounded-xl cursor-pointer"
          initial="hidden"
          animate="visible"
          whileHover="hover"
          custom={index}
          variants={cardVariants}
        >
          {/* Decorative gradient background based on category color */}
          <div 
            className="absolute inset-0 z-0" 
            style={{ 
              background: `linear-gradient(135deg, ${hexToRgba(category.color, 0.7)}, ${hexToRgba(category.color, 0.9)})`,
              opacity: 0.85
            }}
          />
          
          <div className="relative z-10 p-5 flex flex-col h-full min-h-[200px]">
            <motion.div 
              className="bg-white/20 backdrop-blur-sm rounded-full w-14 h-14 flex items-center justify-center mb-auto"
              variants={iconVariants}
            >
              <IconComponent className="h-7 w-7 text-white" />
            </motion.div>
            
            <div className="mt-auto">
              <h3 className="text-xl font-bold text-white mb-2">
                {category.displayName}
              </h3>
              
              {showCount && (
                <p className="text-white/90 text-sm mb-3">
                  {count} aktiv elan
                </p>
              )}
              
              <div className="flex items-center text-white text-sm font-medium">
                <span>Bütün elanlar</span>
                <ChevronRight className="h-4 w-4 ml-1" />
              </div>
            </div>
          </div>
        </motion.div>
      </Link>
    );
  }
  
  // Default grid variant
  return (
    <Link href={`/category/${category.name}`}>
      <motion.div 
        className="relative flex flex-col items-center justify-center p-5 rounded-xl border border-gray-100 bg-white shadow-sm hover:shadow transition-all cursor-pointer group overflow-hidden"
        initial="hidden"
        animate="visible"
        whileHover="hover"
        custom={index}
        variants={cardVariants}
      >
        {renderBadge()}
        
        {/* Subtle category-colored background wave */}
        <div 
          className="absolute bottom-0 left-0 right-0 h-20 z-0 opacity-10 transition-opacity duration-300 group-hover:opacity-20"
          style={{ background: `radial-gradient(ellipse at bottom, ${category.color} 0%, transparent 70%)` }}
        />
        
        <motion.div 
          className={cn(
            "relative z-10 flex items-center justify-center rounded-full mb-4 group-hover:scale-110 transition-transform",
            size === 'sm' ? "w-14 h-14" : size === 'lg' ? "w-24 h-24" : "w-20 h-20"
          )}
          style={{ 
            backgroundColor: getBgColor(),
            boxShadow: `0 10px 15px -3px ${category.color}15`,
            borderWidth: 2,
            borderColor: `${category.color}20`,
          }}
          variants={iconVariants}
        >
          <IconComponent 
            className={cn(
              getIconSize(), 
              size === 'sm' ? 'h-6 w-6' : size === 'lg' ? 'h-10 w-10' : 'h-8 w-8'
            )} 
            style={{ color: category.color }} 
          />
        </motion.div>
        
        <div className="relative z-10 text-center">
          <h3 className={cn(
            "font-semibold text-gray-800", 
            size === 'sm' ? "text-sm" : size === 'lg' ? "text-xl" : "text-lg"
          )}>
            {category.displayName}
          </h3>
          
          {showCount && (
            <div className="flex items-center justify-center gap-1 mt-2">
              <span 
                className="inline-block w-2 h-2 rounded-full animate-pulse"
                style={{ backgroundColor: category.color }}
              />
              <span className="text-sm text-gray-500">
                {count} elan
              </span>
            </div>
          )}
        </div>
      </motion.div>
    </Link>
  );
}
