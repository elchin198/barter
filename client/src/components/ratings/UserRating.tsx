import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserWithRating, User } from "@shared/schema";
import { ReviewsAPI } from "@/lib/api";
import StarRating from "./StarRating";
import ReviewItem from "./ReviewItem";
import { useTranslation } from "react-i18next";

interface UserRatingProps {
  userId: number;
  displayUser: User;
}

export default function UserRating({ userId, displayUser }: UserRatingProps) {
  const { t } = useTranslation();
  
  // Get user rating information
  const { data: userRating, isLoading: ratingLoading } = useQuery<UserWithRating>({
    queryKey: [`/api/users/${userId}/rating`],
    enabled: !!userId,
  });
  
  // Get reviews received by user
  const { data: receivedReviews = [], isLoading: receivedLoading } = useQuery({
    queryKey: [`/api/users/${userId}/reviews`, { asReviewer: false }],
    enabled: !!userId,
  });
  
  // Get reviews given by user
  const { data: givenReviews = [], isLoading: givenLoading } = useQuery({
    queryKey: [`/api/users/${userId}/reviews`, { asReviewer: true }],
    enabled: !!userId,
  });
  
  // Determine reputation level based on average rating
  const getReputationLevel = (rating?: number, reviewCount?: number) => {
    if (!rating || !reviewCount) return t('reviews.noRating');
    if (reviewCount < 3) return t('reviews.newUser');
    if (rating >= 4.5) return t('reviews.excellent');
    if (rating >= 4) return t('reviews.veryGood');
    if (rating >= 3.5) return t('reviews.good');
    if (rating >= 3) return t('reviews.average');
    return t('reviews.belowAverage');
  };
  
  const getReputationColor = (rating?: number, reviewCount?: number) => {
    if (!rating || !reviewCount || reviewCount < 3) return "secondary";
    if (rating >= 4.5) return "success";
    if (rating >= 4) return "primary";
    if (rating >= 3) return "default";
    return "destructive";
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('reviews.reputation')}</CardTitle>
        <CardDescription>{t('reviews.reputationDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        {ratingLoading ? (
          <div className="flex flex-col items-center justify-center py-4">
            <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-2" />
            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
          </div>
        ) : (
          <div className="flex flex-col items-center mb-6">
            <div className="flex items-center gap-2 mb-1">
              <StarRating 
                readOnly 
                initialRating={userRating?.averageRating || 0} 
                size="lg" 
              />
              <span className="text-xl font-bold ml-2">
                {userRating?.averageRating ? userRating.averageRating.toFixed(1) : "0.0"}
              </span>
            </div>
            <div className="text-sm text-gray-500 mb-3">
              {t('reviews.basedOn', { count: userRating?.reviewCount || 0 })}
            </div>
            <Badge variant={getReputationColor(userRating?.averageRating, userRating?.reviewCount) as any}>
              {getReputationLevel(userRating?.averageRating, userRating?.reviewCount)}
            </Badge>
          </div>
        )}
        
        <Tabs defaultValue="received" className="w-full">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="received">
              {t('reviews.received')}
              {receivedReviews.length > 0 && ` (${receivedReviews.length})`}
            </TabsTrigger>
            <TabsTrigger value="given">
              {t('reviews.given')}
              {givenReviews.length > 0 && ` (${givenReviews.length})`}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="received" className="mt-4">
            {receivedLoading ? (
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="flex gap-2">
                        <div className="h-8 w-8 bg-gray-200 rounded-full" />
                        <div className="flex-1">
                          <div className="h-4 w-24 bg-gray-200 rounded mb-2" />
                          <div className="h-3 w-16 bg-gray-200 rounded" />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="h-4 bg-gray-200 rounded w-full mb-2" />
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : receivedReviews.length > 0 ? (
              <div className="space-y-4">
                {receivedReviews.map((review) => (
                  <ReviewItem key={review.id} review={review} viewMode="received" />
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                {t('reviews.noReviewsReceived')}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="given" className="mt-4">
            {givenLoading ? (
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="flex gap-2">
                        <div className="h-8 w-8 bg-gray-200 rounded-full" />
                        <div className="flex-1">
                          <div className="h-4 w-24 bg-gray-200 rounded mb-2" />
                          <div className="h-3 w-16 bg-gray-200 rounded" />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="h-4 bg-gray-200 rounded w-full mb-2" />
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : givenReviews.length > 0 ? (
              <div className="space-y-4">
                {givenReviews.map((review) => (
                  <ReviewItem key={review.id} review={review} viewMode="given" />
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                {t('reviews.noReviewsGiven')}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}