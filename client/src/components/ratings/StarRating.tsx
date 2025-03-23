import { useState } from 'react';
import { Star, StarHalf } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  initialRating?: number;
  readOnly?: boolean;
  size?: 'sm' | 'md' | 'lg'; 
  onChange?: (rating: number) => void;
  className?: string;
}

export default function StarRating({ 
  initialRating = 0, 
  readOnly = false, 
  size = 'md',
  onChange,
  className = ''
}: StarRatingProps) {
  const [rating, setRating] = useState(initialRating);
  const [hoverRating, setHoverRating] = useState(0);
  
  // Calculate star size based on the size prop
  const starSize = {
    sm: 16,
    md: 20,
    lg: 24
  }[size];
  
  const handleClick = (selectedRating: number) => {
    if (readOnly) return;
    
    setRating(selectedRating);
    if (onChange) {
      onChange(selectedRating);
    }
  };
  
  const handleMouseEnter = (hoveredRating: number) => {
    if (readOnly) return;
    setHoverRating(hoveredRating);
  };
  
  const handleMouseLeave = () => {
    if (readOnly) return;
    setHoverRating(0);
  };
  
  const renderStar = (position: number) => {
    const isHalfStar = !readOnly && Number.isInteger(position) && 
      hoverRating === 0 && 
      rating > position - 1 && 
      rating < position;
      
    const isActive = (hoverRating || rating) >= position;
    
    return (
      <span 
        key={position} 
        className={cn(
          "cursor-default transition-colors",
          !readOnly && "cursor-pointer",
          "inline-flex"
        )}
        onClick={() => handleClick(position)}
        onMouseEnter={() => handleMouseEnter(position)}
        onMouseLeave={handleMouseLeave}
      >
        {isHalfStar ? (
          <StarHalf className="text-yellow-500" size={starSize} />
        ) : (
          <Star 
            className={cn(
              isActive ? "text-yellow-500 fill-yellow-500" : "text-gray-300",
            )} 
            size={starSize} 
          />
        )}
      </span>
    );
  };

  return (
    <div className={cn("flex items-center", className)}>
      {[1, 2, 3, 4, 5].map(position => renderStar(position))}
    </div>
  );
}