import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ReviewsAPI } from "@/lib/api";
import StarRating from "./StarRating";
import { User } from "@shared/schema";
import { useTranslation } from "react-i18next";

const reviewSchema = z.object({
  rating: z.number().min(1, "Reytinq tələb olunur").max(5),
  comment: z.string().min(5, "Rəyiniz ən azı 5 simvol olmalıdır").max(500, "Rəyiniz maksimum 500 simvol ola bilər"),
});

type ReviewFormValues = z.infer<typeof reviewSchema>;

interface ReviewFormProps {
  offerId: number;
  toUser: User;
  onReviewSubmitted?: () => void;
}

export default function ReviewForm({ offerId, toUser, onReviewSubmitted }: ReviewFormProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  
  const form = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: 0,
      comment: "",
    },
  });
  
  const reviewMutation = useMutation({
    mutationFn: async (data: ReviewFormValues) => {
      return ReviewsAPI.createReview({
        offerId,
        rating: data.rating,
        comment: data.comment,
      });
    },
    onSuccess: () => {
      toast({
        title: t('reviews.success'),
        description: t('reviews.successMessage'),
      });
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['/api/offers'] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${toUser.id}/rating`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${toUser.id}/reviews`] });
      queryClient.invalidateQueries({ queryKey: [`/api/offers/${offerId}/reviews`] });
      
      form.reset();
      setIsOpen(false);
      
      if (onReviewSubmitted) {
        onReviewSubmitted();
      }
    },
    onError: (error) => {
      toast({
        title: t('reviews.error'),
        description: error.message || t('reviews.errorMessage'),
        variant: "destructive",
      });
    },
  });
  
  function onSubmit(data: ReviewFormValues) {
    reviewMutation.mutate(data);
  }
  
  return (
    <div className="my-4">
      {!isOpen ? (
        <Button onClick={() => setIsOpen(true)}>
          {t('reviews.leaveReview')}
        </Button>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{t('reviews.reviewTitle')}</CardTitle>
            <CardDescription>
              {t('reviews.reviewUserDescription', { user: toUser.fullName || toUser.username })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="rating"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('reviews.rating')}</FormLabel>
                      <FormControl>
                        <StarRating
                          initialRating={field.value}
                          onChange={(rating) => field.onChange(rating)}
                          size="lg"
                        />
                      </FormControl>
                      <FormDescription>
                        {t('reviews.ratingDescription')}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="comment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('reviews.comment')}</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder={t('reviews.commentPlaceholder')}
                          className="min-h-[100px]" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        {t('reviews.commentDescription')}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex gap-2">
                  <Button 
                    type="submit" 
                    disabled={reviewMutation.isPending}
                  >
                    {reviewMutation.isPending ? t('common.processing') : t('reviews.submitReview')}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsOpen(false)}
                    disabled={reviewMutation.isPending}
                  >
                    {t('common.cancel')}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}