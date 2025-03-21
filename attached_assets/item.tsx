import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, MessageSquare, RefreshCw } from "lucide-react";
import OfferCard from "@/components/items/offer-card";
import MakeOfferModal from "./make-offer-modal";

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "active":
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Aktiv</Badge>;
    case "pending":
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Gözləmədə</Badge>;
    case "completed":
      return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">Tamamlanıb</Badge>;
    case "inactive":
      return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200">Deaktiv</Badge>;
    default:
      return null;
  }
}

export default function Item() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const [makeOfferOpen, setMakeOfferOpen] = useState(false);
  
  const { data: item, isLoading, error } = useQuery({
    queryKey: [`/api/items/${id}`],
  });
  
  // Get current offer if exists
  const { 
    data: activeOffer, 
    isLoading: isLoadingOffer 
  } = useQuery({
    queryKey: ["/api/offers/active", id],
    enabled: !!id && !!user?.id && !isLoading,
  });
  
  const toggleFavoriteMutation = useMutation({
    mutationFn: async () => {
      if (!isAuthenticated || !user) {
        throw new Error("Seçilmişlərə əlavə etmək üçün daxil olun");
      }
      
      if (item.isFavorite) {
        // Remove from favorites
        const response = await apiRequest("DELETE", `/api/favorites/${id}`);
        return await response.json();
      } else {
        // Add to favorites
        const response = await apiRequest("POST", "/api/favorites", { itemId: parseInt(id!) });
        return await response.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/items/${id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
      
      toast({
        title: item?.isFavorite ? "Seçilmişlərdən silindi" : "Seçilmişlərə əlavə edildi",
        description: item?.isFavorite 
          ? "Elan seçilmişlərdən silindi" 
          : "Elan seçilmişlərə əlavə edildi",
      });
    },
    onError: (error: any) => {
      if (error.message === "Seçilmişlərə əlavə etmək üçün daxil olun") {
        toast({
          variant: "destructive",
          title: "Daxil olmaq lazımdır",
          description: "Seçilmişlərə əlavə etmək üçün əvvəlcə hesabınıza daxil olun.",
        });
        setLocation("/login");
      } else {
        toast({
          variant: "destructive",
          title: "Xəta baş verdi",
          description: error.message || "Əməliyyat zamanı xəta baş verdi",
        });
      }
    },
  });
  
  const isOwner = user?.id === item?.user?.id;

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <Skeleton className="w-full h-96 rounded-lg" />
              <div className="flex mt-2 gap-2">
                <Skeleton className="w-20 h-20 rounded-md" />
                <Skeleton className="w-20 h-20 rounded-md" />
                <Skeleton className="w-20 h-20 rounded-md" />
              </div>
            </div>
            <div className="space-y-4">
              <Skeleton className="w-3/4 h-10 rounded-md" />
              <Skeleton className="w-1/2 h-6 rounded-md" />
              <Skeleton className="w-1/4 h-6 rounded-md" />
              <Separator />
              <Skeleton className="w-full h-32 rounded-md" />
              <Separator />
              <Skeleton className="w-1/2 h-6 rounded-md" />
              <Skeleton className="w-3/4 h-6 rounded-md" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-10">
              <h2 className="text-2xl font-bold mb-2">Xəta baş verdi</h2>
              <p className="text-neutral-medium mb-4">
                Elan tapılmadı və ya yüklənərkən xəta baş verdi.
              </p>
              <Button onClick={() => setLocation("/")}>Ana səhifəyə qayıt</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Make Offer Modal */}
      <MakeOfferModal 
        targetItemId={id!}
        isOpen={makeOfferOpen}
        onClose={() => setMakeOfferOpen(false)}
      />
      
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Item Images */}
          <div>
            <Tabs defaultValue="0" className="w-full">
              <TabsContent value="0" className="mt-0 p-0">
                <div className="relative pb-[100%] bg-gray-100 rounded-lg overflow-hidden mb-2">
                  {item.images && item.images.length > 0 ? (
                    <img 
                      src={item.images[0].url} 
                      alt={item.title} 
                      className="absolute inset-0 w-full h-full object-contain"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                      <span>Şəkil mövcud deyil</span>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              {item.images && item.images.slice(1).map((image: any, index: number) => (
                <TabsContent key={image.id} value={(index + 1).toString()} className="mt-0 p-0">
                  <div className="relative pb-[100%] bg-gray-100 rounded-lg overflow-hidden mb-2">
                    <img 
                      src={image.url} 
                      alt={`${item.title} - ${index + 1}`} 
                      className="absolute inset-0 w-full h-full object-contain"
                    />
                  </div>
                </TabsContent>
              ))}
              
              {item.images && item.images.length > 0 && (
                <div className="flex gap-2 mt-2 overflow-x-auto pb-2">
                  <TabsList>
                    {item.images.map((image: any, index: number) => (
                      <TabsTrigger key={image.id} value={index.toString()} className="p-0">
                        <img 
                          src={image.url} 
                          alt={`${item.title} thumbnail ${index}`} 
                          className="w-16 h-16 object-cover rounded-md"
                        />
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>
              )}
            </Tabs>
          </div>
          
          {/* Item Details */}
          <div>
            <div className="flex justify-between items-start">
              <h1 className="text-2xl font-bold mb-2">{item.title}</h1>
              <StatusBadge status={item.status} />
            </div>
            
            <p className="text-neutral-medium text-sm mb-4">
              {item.category} {item.subcategory ? `> ${item.subcategory}` : ''}
            </p>
            
            <div className="flex items-center gap-2 mb-4">
              <Button 
                variant="outline" 
                size="sm" 
                className={item.isFavorite ? "text-red-500" : ""}
                onClick={() => toggleFavoriteMutation.mutate()}
                disabled={toggleFavoriteMutation.isPending}
              >
                <Heart className={`mr-1 h-4 w-4 ${item.isFavorite ? "fill-current" : ""}`} />
                {item.isFavorite ? "Seçilmişlərdədir" : "Seçilmişlərə əlavə et"}
              </Button>
            </div>
            
            <Separator className="my-4" />
            
            <div className="mb-4">
              <h2 className="font-bold mb-2">Təsvir</h2>
              <p className="text-neutral-medium whitespace-pre-line">{item.description}</p>
            </div>
            
            <Separator className="my-4" />
            
            <div className="mb-4">
              <h2 className="font-bold mb-2">Dəyişdirmək istəyir</h2>
              <p className="text-neutral-medium">{item.wantedExchange}</p>
            </div>
            
            <div className="flex items-start gap-4 mb-4">
              <div>
                <h2 className="font-bold mb-1">Yerləşmə</h2>
                <p className="text-neutral-medium">
                  <i className="fas fa-map-marker-alt mr-1"></i> {item.location}
                </p>
              </div>
              
              <div>
                <h2 className="font-bold mb-1">Tarix</h2>
                <p className="text-neutral-medium">
                  <i className="far fa-clock mr-1"></i> {new Date(item.createdAt).toLocaleDateString('az-AZ')}
                </p>
              </div>
            </div>
            
            <Separator className="my-4" />
            
            {/* User Information */}
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                {item.user.avatar ? (
                  <img 
                    src={item.user.avatar} 
                    alt={item.user.username} 
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-xl font-bold text-gray-500">
                    {item.user.fullName.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              
              <div>
                <h3 className="font-bold">{item.user.fullName}</h3>
                <Button 
                  variant="link" 
                  className="p-0 h-auto text-primary"
                  onClick={() => setLocation(`/profile/${item.user.id}`)}
                >
                  Bütün elanlar
                </Button>
              </div>
            </div>
            
            {/* Actions for item owner */}
            {isOwner && (
              <div className="mt-6">
                <Separator className="my-4" />
                <h3 className="font-bold mb-2">Elan idarəetməsi</h3>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">Redaktə et</Button>
                  {item.status === 'active' ? (
                    <Button variant="outline" size="sm" className="text-red-500">Deaktiv et</Button>
                  ) : (
                    <Button variant="outline" size="sm" className="text-green-500">Aktiv et</Button>
                  )}
                  <Button variant="outline" size="sm" className="text-blue-500">Tamamlandı</Button>
                </div>
              </div>
            )}
            
            {/* Offer section - only for non-owners and when the item is active */}
            {!isOwner && item.status === 'active' && (
              <div className="mt-6">
                <Separator className="my-4" />
                
                {/* Current offer if exists */}
                {activeOffer ? (
                  <div className="space-y-4">
                    <h3 className="font-bold">Mövcud təklifiniz</h3>
                    <OfferCard 
                      mode="sent"
                      offer={{
                        id: activeOffer.id,
                        title: activeOffer.offerItem.title,
                        imageUrl: activeOffer.offerItem.imageUrl || '',
                        location: activeOffer.offerItem.location,
                        value: activeOffer.offerItem.wantedExchange,
                      }}
                    />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <h3 className="font-bold">Barter təklifi edin</h3>
                    <p className="text-neutral-medium text-sm">
                      Bu əşya üçün öz əşyanızla barter təklifi edə bilərsiniz.
                    </p>
                    
                    {isAuthenticated ? (
                      <Button 
                        onClick={() => setMakeOfferOpen(true)}
                        className="bg-[#367BF5] hover:bg-[#2563EB]"
                      >
                        <ArrowRightLeft className="mr-2 h-4 w-4" />
                        Təklif et
                      </Button>
                    ) : (
                      <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
                        <p className="text-sm text-gray-600 mb-2">
                          Təklif etmək üçün əvvəlcə hesabınıza daxil olmalısınız
                        </p>
                        <Button 
                          onClick={() => setLocation("/auth")}
                          className="bg-[#367BF5] hover:bg-[#2563EB]"
                        >
                          Daxil ol
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
