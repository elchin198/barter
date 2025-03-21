import { Star } from "lucide-react";

interface TestimonialCardProps {
  name: string;
  avatar: string;
  rating: number;
  content: string;
}

export default function TestimonialCard({ name, avatar, rating, content }: TestimonialCardProps) {
  // Generate stars based on rating
  const generateStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    // Add full stars
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Star key={`full-${i}`} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
      );
    }
    
    // Add half star if needed
    if (hasHalfStar) {
      stars.push(
        <Star key="half" className="h-4 w-4 text-yellow-400" strokeWidth={2} />
      );
    }
    
    // Add empty stars
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Star key={`empty-${i}`} className="h-4 w-4 text-gray-300" strokeWidth={2} />
      );
    }
    
    return stars;
  };
  
  return (
    <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
      <div className="flex items-start gap-4 mb-4">
        <div className="shrink-0">
          <img
            src={avatar}
            alt={name}
            className="w-12 h-12 rounded-full object-cover border border-gray-100"
          />
        </div>
        <div>
          <h4 className="font-semibold text-gray-900">{name}</h4>
          <div className="flex mt-1 text-yellow-400">
            {generateStars(rating)}
          </div>
        </div>
      </div>
      <p className="text-gray-600 border-t border-gray-100 pt-4 italic">"{content}"</p>
    </div>
  );
}
