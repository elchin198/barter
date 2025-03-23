import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Package, AlertTriangle, Check, X, ArrowRightLeft, Clock, ShieldCheck, ShieldX } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "@/lib/queryClient";
import { useTranslation } from "react-i18next";
import SEO from "@/components/SEO";
import { Offer, Item, User } from "@shared/schema";

// Extended Offer type with related data
interface OfferWithDetails extends Offer {
  fromItem: Item & { mainImage?: string };
  toItem: Item & { mainImage?: string };
  fromUser: User;
  toUser: User;
}

export default function Offers() {
  const { t } = useTranslation();
  const [location] = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("received");
  const [selectedOffer, setSelectedOffer] = useState<OfferWithDetails | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<"accept" | "reject" | null>(null);

  // Get offers
  const { data: offers = [], isLoading } = useQuery<OfferWithDetails[]>({
    queryKey: ['/api/offers'],
    enabled: !!user,
  });

  // Update offer status mutation
  const updateOfferMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return apiRequest('PUT', `/api/offers/${id}/status`, { status });
    },
    onSuccess: () => {
      toast({ 
        title: actionType === "accept" ? t('offers.accepted') : t('offers.rejected'),
        description: actionType === "accept" 
          ? t('offers.acceptedDescription') 
          : t('offers.rejectedDescription')
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/offers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/items'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      
      setConfirmDialogOpen(false);
      setSelectedOffer(null);
      setActionType(null);
    },
    onError: (error) => {
      toast({
        title: t('offers.updateFailed'),
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Handle offer action (accept/reject)
  const handleOfferAction = (offer: OfferWithDetails, action: "accept" | "reject") => {
    setSelectedOffer(offer);
    setActionType(action);
    setConfirmDialogOpen(true);
  };

  // Confirm action
  const confirmAction = () => {
    if (!selectedOffer || !actionType) return;
    
    updateOfferMutation.mutate({
      id: selectedOffer.id,
      status: actionType === "accept" ? "accepted" : "rejected"
    });
  };

  // Filter offers by sent/received
  const sentOffers = offers.filter(o => o.fromUserId === user?.id);
  const receivedOffers = offers.filter(o => o.toUserId === user?.id);

  // Show loading state
  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center">
        <div className="w-8 h-8 border-4 border-t-blue-600 border-b-orange-500 border-l-blue-300 border-r-orange-300 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Redirect if not logged in
  if (!user) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <ArrowRightLeft className="h-16 w-16 mx-auto text-gray-300 mb-4" />
        <h1 className="text-2xl font-bold mb-4">{t('offers.offersTitle')}</h1>
        <p className="text-gray-600 mb-6">
          {t('offers.loginRequired')}
        </p>
        <Button asChild>
          <Link href="/login">{t('auth.loginToAccount')}</Link>
        </Button>
      </div>
    );
  }

  // Define SEO meta data
  const offersTitle = t('seo.offersTitle', 'Təkliflər | BarterTap.az - Əşya Mübadiləsi Platforması');
  const offersDescription = t(
    'seo.offersDescription', 
    'BarterTap.az platformasında göndərdiyiniz və aldığınız barter təklifləri. Təklifləri qəbul edin, rədd edin və təkliflərinisin statusunu izləyin.'
  );
  const offersKeywords = t(
    'seo.offersKeywords',
    'əşya mübadiləsi təklifləri, barter təklifləri, mübadilə statusu, əşya dəyişmək, pulsuz mübadilə'
  );

  return (
    <div className="container mx-auto px-4 py-8">
      {/* SEO */}
      <SEO 
        title={offersTitle}
        description={offersDescription}
        keywords={offersKeywords}
        pathName={location}
      />

      <div className="flex flex-col">
        <h1 className="text-3xl font-bold mb-2">{t('offers.offersTitle')}</h1>
        <p className="text-gray-600 mb-6">{t('offers.offersDescription')}</p>

        {/* Tabs for sent/received offers */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-8">
            <TabsTrigger value="received">
              {t('offers.receivedOffers')} 
              {receivedOffers.length > 0 && (
                <Badge variant="outline" className="ml-2">{receivedOffers.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="sent">
              {t('offers.sentOffers')}
              {sentOffers.length > 0 && (
                <Badge variant="outline" className="ml-2">{sentOffers.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Received offers */}
          <TabsContent value="received">
            {isLoading ? (
              <div className="flex justify-center p-8">
                <div className="w-8 h-8 border-4 border-t-blue-600 border-b-orange-500 border-l-blue-300 border-r-orange-300 rounded-full animate-spin"></div>
              </div>
            ) : receivedOffers.length === 0 ? (
              <div className="text-center py-12">
                <ArrowRightLeft className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold mb-2">{t('offers.noReceivedOffers')}</h3>
                <p className="text-gray-500 mb-6">{t('offers.noReceivedOffersDescription')}</p>
                <Button asChild>
                  <Link href="/items">{t('offers.browseItems')}</Link>
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {receivedOffers.map((offer) => (
                  <OfferCard 
                    key={offer.id} 
                    offer={offer} 
                    viewMode="received"
                    onAccept={() => handleOfferAction(offer, "accept")}
                    onReject={() => handleOfferAction(offer, "reject")}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Sent offers */}
          <TabsContent value="sent">
            {isLoading ? (
              <div className="flex justify-center p-8">
                <div className="w-8 h-8 border-4 border-t-blue-600 border-b-orange-500 border-l-blue-300 border-r-orange-300 rounded-full animate-spin"></div>
              </div>
            ) : sentOffers.length === 0 ? (
              <div className="text-center py-12">
                <ArrowRightLeft className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold mb-2">{t('offers.noSentOffers')}</h3>
                <p className="text-gray-500 mb-6">{t('offers.noSentOffersDescription')}</p>
                <Button asChild>
                  <Link href="/items">{t('offers.findItemsToOffer')}</Link>
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sentOffers.map((offer) => (
                  <OfferCard 
                    key={offer.id} 
                    offer={offer} 
                    viewMode="sent"
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Confirmation dialog for accept/reject */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "accept" 
                ? t('offers.confirmAccept') 
                : t('offers.confirmReject')}
            </DialogTitle>
            <DialogDescription>
              {actionType === "accept" 
                ? t('offers.confirmAcceptDescription') 
                : t('offers.confirmRejectDescription')}
            </DialogDescription>
          </DialogHeader>

          {selectedOffer && (
            <div className="py-4">
              <div className="flex items-center gap-4 mb-4">
                <img 
                  src={selectedOffer.fromItem.mainImage || "https://placehold.co/100x100?text=No+Image"} 
                  alt={selectedOffer.fromItem.title}
                  className="w-16 h-16 object-cover rounded-md"
                />
                <div className="flex-1">
                  <h4 className="font-medium">{selectedOffer.fromItem.title}</h4>
                  <p className="text-sm text-gray-500">{t('offers.offeredBy')} {selectedOffer.fromUser.username}</p>
                </div>
              </div>

              <div className="flex justify-center my-2">
                <ArrowRightLeft className="text-gray-400" />
              </div>

              <div className="flex items-center gap-4">
                <img 
                  src={selectedOffer.toItem.mainImage || "https://placehold.co/100x100?text=No+Image"} 
                  alt={selectedOffer.toItem.title}
                  className="w-16 h-16 object-cover rounded-md"
                />
                <div className="flex-1">
                  <h4 className="font-medium">{selectedOffer.toItem.title}</h4>
                  <p className="text-sm text-gray-500">{t('offers.yourItem')}</p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button 
              onClick={confirmAction}
              variant={actionType === "accept" ? "default" : "destructive"}
              disabled={updateOfferMutation.isPending}
            >
              {updateOfferMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                  {t('common.processing')}
                </span>
              ) : (
                actionType === "accept" ? t('offers.accept') : t('offers.reject')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface OfferCardProps {
  offer: OfferWithDetails;
  viewMode: "sent" | "received";
  onAccept?: () => void;
  onReject?: () => void;
}

function OfferCard({ offer, viewMode, onAccept, onReject }: OfferCardProps) {
  const { t } = useTranslation();
  
  // Format date
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Get status badge
  const getStatusBadge = () => {
    switch (offer.status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300 whitespace-nowrap"><Clock className="h-3 w-3 mr-1" /> {t('offers.statusPending')}</Badge>;
      case 'accepted':
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300 whitespace-nowrap"><ShieldCheck className="h-3 w-3 mr-1" /> {t('offers.statusAccepted')}</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300 whitespace-nowrap"><ShieldX className="h-3 w-3 mr-1" /> {t('offers.statusRejected')}</Badge>;
      default:
        return null;
    }
  };

  // Determine which items to show based on view mode
  const yourItem = viewMode === "sent" ? offer.fromItem : offer.toItem;
  const theirItem = viewMode === "sent" ? offer.toItem : offer.fromItem;
  const otherUser = viewMode === "sent" ? offer.toUser : offer.fromUser;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage 
                src={otherUser.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(otherUser.username)}`} 
                alt={otherUser.username} 
              />
              <AvatarFallback>{otherUser.username[0].toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-base">{otherUser.username}</CardTitle>
              <CardDescription className="text-xs">{formatDate(new Date(offer.createdAt))}</CardDescription>
            </div>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 gap-2 mb-2">
          <div className="border rounded-md p-2">
            <div className="aspect-square overflow-hidden rounded mb-2">
              <img 
                src={yourItem.mainImage || "https://placehold.co/300x300?text=No+Image"} 
                alt={yourItem.title} 
                className="w-full h-full object-cover"
              />
            </div>
            <h4 className="font-medium text-sm truncate">{yourItem.title}</h4>
            <p className="text-xs text-gray-500">{viewMode === "sent" ? t('offers.youOffer') : t('offers.yourItem')}</p>
          </div>
          
          <div className="border rounded-md p-2">
            <div className="aspect-square overflow-hidden rounded mb-2">
              <img 
                src={theirItem.mainImage || "https://placehold.co/300x300?text=No+Image"} 
                alt={theirItem.title} 
                className="w-full h-full object-cover"
              />
            </div>
            <h4 className="font-medium text-sm truncate">{theirItem.title}</h4>
            <p className="text-xs text-gray-500">{viewMode === "sent" ? t('offers.theyOffer') : t('offers.theirOffer')}</p>
          </div>
        </div>
        
        {/* Show conversation link if available */}
        {offer.conversationId && (
          <Link href={`/messages/${offer.conversationId}`} className="text-sm text-blue-600 hover:underline flex items-center mt-2">
            <Package className="h-4 w-4 mr-1" />
            {t('offers.viewConversation')}
          </Link>
        )}
      </CardContent>
      
      {/* Action buttons for received pending offers */}
      {viewMode === "received" && offer.status === "pending" && onAccept && onReject && (
        <CardFooter className="flex gap-2 pt-0">
          <Button 
            onClick={onAccept} 
            className="flex-1"
            size="sm"
          >
            <Check className="h-4 w-4 mr-1" />
            {t('offers.accept')}
          </Button>
          <Button 
            onClick={onReject} 
            variant="outline" 
            className="flex-1"
            size="sm"
          >
            <X className="h-4 w-4 mr-1" />
            {t('offers.reject')}
          </Button>
        </CardFooter>
      )}
      
      {/* Info for accepted/rejected offers */}
      {offer.status !== "pending" && (
        <CardFooter className="pt-0">
          <Alert variant={offer.status === "accepted" ? "default" : "destructive"} className="py-2">
            <AlertTitle className="text-sm flex items-center">
              {offer.status === "accepted" ? (
                <>
                  <Check className="h-4 w-4 mr-1" />
                  {t('offers.offerAccepted')}
                </>
              ) : (
                <>
                  <X className="h-4 w-4 mr-1" />
                  {t('offers.offerRejected')}
                </>
              )}
            </AlertTitle>
            <AlertDescription className="text-xs">
              {offer.status === "accepted" 
                ? t('offers.offerAcceptedDescription')
                : t('offers.offerRejectedDescription')
              }
            </AlertDescription>
          </Alert>
        </CardFooter>
      )}
    </Card>
  );
}