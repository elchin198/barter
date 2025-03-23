import { Review, User } from "@shared/schema";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import StarRating from "./StarRating";
import { formatDistanceToNow } from "date-fns";
import { az } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import { Link } from "wouter";

interface ReviewItemProps {
  review: Review & { 
    fromUser: User;
    toUser: User;
  };
  viewMode?: 'received' | 'given';
}

export default function ReviewItem({ review, viewMode = 'received' }: ReviewItemProps) {
  const { t } = useTranslation();
  const reviewDate = new Date(review.createdAt);
  
  const displayedUser = viewMode === 'received' ? review.fromUser : review.toUser;
  
  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage 
                src={displayedUser.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayedUser.fullName || displayedUser.username)}`} 
                alt={displayedUser.fullName || displayedUser.username} 
              />
              <AvatarFallback>{displayedUser.fullName?.[0] || displayedUser.username?.[0]}</AvatarFallback>
            </Avatar>
            <div>
              <Link href={`/profile/${displayedUser.id}`} className="font-medium text-primary hover:underline">
                {displayedUser.fullName || displayedUser.username}
              </Link>
              <p className="text-sm text-gray-500">
                {formatDistanceToNow(reviewDate, { addSuffix: true, locale: az })}
              </p>
            </div>
          </div>
          <StarRating readOnly initialRating={review.rating} size="sm" />
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-gray-700">{review.comment}</p>
        <div className="mt-2 text-xs text-gray-500">
          {viewMode === 'received' ? t('reviews.receivedFrom', { user: displayedUser.fullName || displayedUser.username }) : 
            t('reviews.givenTo', { user: displayedUser.fullName || displayedUser.username })}
        </div>
      </CardContent>
    </Card>
  );
}