import { useState, useEffect } from "react";
import { useRoute, useLocation, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Heart, MessageCircle, Share2, AlertTriangle, Star, MapPin, Clock, ExternalLink, UserCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "../context/AuthContext";
import { Item, User as UserType } from "@shared/schema";
import SEO from "@/components/SEO";
import { useTranslation } from "react-i18next";

interface ItemDetailResponse extends Item {
  images: Array<{
    id: number;
    filePath: string;
    isMain: boolean;
  }>;
  owner: UserType;
  isFavorite?: boolean;
}

export default function ItemDetail() {
  const [, params] = useRoute<{ id: string }>("/items/:id");
  const [location, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [message, setMessage] = useState("");
  const [selectedItemForOffer, setSelectedItemForOffer] = useState<number | null>(null);
  const [favorited, setFavorited] = useState(false);
  
  // Redirect if no id
  if (!params || !params.id) {
    navigate("/");
    return null;
  }
  
  const itemId = parseInt(params.id);
  
  // Fetch item details
  const { data: item, isLoading, error } = useQuery<ItemDetailResponse>({
    queryKey: [`/api/items/${itemId}`],
  });
  
  // Fetch user's items for making offers
  const { data: userItems = [] } = useQuery<(Item & { mainImage?: string })[]>({
    queryKey: ['/api/items', { userId: user?.id }],
    enabled: !!user,
  });
  
  // Set initial favorited state
  useEffect(() => {
    if (item) {
      setFavorited(!!item.isFavorite);
    }
  }, [item]);
  
  // Add to favorites mutation
  const addFavoriteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('POST', '/api/favorites', { itemId });
    },
    onSuccess: () => {
      setFavorited(true);
      toast({ title: "Added to favorites" });
      queryClient.invalidateQueries({ queryKey: ['/api/favorites'] });
      queryClient.invalidateQueries({ queryKey: [`/api/items/${itemId}`] });
    },
    onError: (error) => {
      toast({ 
        title: "Failed to add to favorites", 
        description: error.message, 
        variant: "destructive" 
      });
    }
  });
  
  // Remove from favorites mutation
  const removeFavoriteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('DELETE', `/api/favorites/${itemId}`);
    },
    onSuccess: () => {
      setFavorited(false);
      toast({ title: "Removed from favorites" });
      queryClient.invalidateQueries({ queryKey: ['/api/favorites'] });
      queryClient.invalidateQueries({ queryKey: [`/api/items/${itemId}`] });
    },
    onError: (error) => {
      toast({ 
        title: "Failed to remove from favorites", 
        description: error.message, 
        variant: "destructive" 
      });
    }
  });
  
  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('POST', '/api/conversations', {
        otherUserId: item?.userId,
        itemId,
        message
      });
    },
    onSuccess: () => {
      toast({ title: "Message sent successfully" });
      setMessage("");
      navigate("/messages");
    },
    onError: (error) => {
      toast({ 
        title: "Failed to send message", 
        description: error.message, 
        variant: "destructive" 
      });
    }
  });
  
  // Send offer mutation
  const sendOfferMutation = useMutation({
    mutationFn: async () => {
      if (!selectedItemForOffer) return;
      
      await apiRequest('POST', '/api/offers', {
        toUserId: item?.userId,
        fromItemId: selectedItemForOffer,
        toItemId: itemId
      });
    },
    onSuccess: () => {
      toast({ title: "Offer sent successfully" });
      setSelectedItemForOffer(null);
      queryClient.invalidateQueries({ queryKey: ['/api/offers'] });
    },
    onError: (error) => {
      toast({ 
        title: "Failed to send offer", 
        description: error.message, 
        variant: "destructive" 
      });
    }
  });
  
  const handleFavoriteToggle = () => {
    if (!user) {
      toast({ 
        title: "Authentication required", 
        description: "Please log in to add items to favorites",
        variant: "destructive"
      });
      return;
    }
    
    if (favorited) {
      removeFavoriteMutation.mutate();
    } else {
      addFavoriteMutation.mutate();
    }
  };
  
  const handleSendMessage = () => {
    if (!message.trim()) {
      toast({ 
        title: "Message required", 
        description: "Please enter a message",
        variant: "destructive"
      });
      return;
    }
    
    sendMessageMutation.mutate();
  };
  
  const handleSendOffer = () => {
    if (!selectedItemForOffer) {
      toast({ 
        title: "Item selection required", 
        description: "Please select an item to offer",
        variant: "destructive"
      });
      return;
    }
    
    sendOfferMutation.mutate();
  };
  
  // Handle loading and error states
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col items-center justify-center">
          <div className="w-16 h-16 border-4 border-t-blue-600 border-b-orange-500 border-l-blue-300 border-r-orange-300 rounded-full animate-spin"></div>
          <p className="mt-4 text-lg text-gray-600">Loading item details...</p>
        </div>
      </div>
    );
  }
  
  if (error || !item) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col items-center justify-center">
          <AlertTriangle className="h-16 w-16 text-red-500 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Item Not Found</h1>
          <p className="text-gray-600 mb-6">The item you're looking for doesn't exist or may have been removed.</p>
          <Button onClick={() => navigate("/")}>Go Back Home</Button>
        </div>
      </div>
    );
  }
  
  // Get images with default if none
  const images = item.images.length > 0 
    ? item.images 
    : [{ id: 0, filePath: "https://placehold.co/600x400/e2e8f0/64748b?text=No+Image", isMain: true }];
  
  // Get status badge
  const getStatusBadge = () => {
    switch (item.status) {
      case 'active':
        return <Badge className="bg-green-500">Active</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500">Pending</Badge>;
      case 'completed':
        return <Badge className="bg-blue-500">Completed</Badge>;
      default:
        return null;
    }
  };
  
  // Check if user is the owner
  const isOwner = user?.id === item.userId;
  
  // Filter out tradeable items (user's active items excluding current item)
  const tradeableItems = userItems.filter(i => i.status === 'active' && i.id !== itemId);
  
  // Define SEO meta data for item detail page
  const itemTitle = t('seo.itemTitle', `${item.title} | BarterTap.az - Əşya Mübadiləsi`);
  const itemDescription = t(
    'seo.itemDescription', 
    `${item.description.substring(0, 150)}${item.description.length > 150 ? '...' : ''} – BarterTap.az üzərindən barter edin.`
  );
  const itemKeywords = t(
    'seo.itemKeywords',
    `barter, ${item.title}, ${item.category}, əşya mübadiləsi, dəyişmək, ${item.condition}, pulsuz mübadilə`
  );

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page-specific SEO */}
      <SEO 
        title={itemTitle}
        description={itemDescription}
        keywords={itemKeywords}
        pathName={location}
        ogImage={images[0]?.filePath}
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Images */}
        <div className="space-y-4">
          <div className="aspect-w-4 aspect-h-3 bg-gray-100 rounded-lg overflow-hidden">
            <img 
              src={images[selectedImageIndex]?.filePath} 
              alt={item.title}
              className="w-full h-full object-contain"
            />
          </div>
          
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {images.map((image, index) => (
                <button
                  key={image.id}
                  className={`relative w-20 h-20 border-2 rounded overflow-hidden flex-shrink-0
                    ${selectedImageIndex === index ? 'border-blue-600' : 'border-transparent'}`}
                  onClick={() => setSelectedImageIndex(index)}
                >
                  <img 
                    src={image.filePath} 
                    alt={`${item.title} - image ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
        
        {/* Item details */}
        <div className="space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <h1 className="text-3xl font-bold">{item.title}</h1>
                {getStatusBadge()}
              </div>
              <div className="flex gap-4 text-sm text-gray-600">
                <span>Category: {item.category}</span>
                <span>Condition: {item.condition}</span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={handleFavoriteToggle}
                className={favorited ? "text-red-500" : "text-gray-400"}
              >
                <Heart className="h-6 w-6" fill={favorited ? "currentColor" : "none"} />
              </Button>
              <Button variant="ghost" size="icon">
                <Share2 className="h-6 w-6" />
              </Button>
            </div>
          </div>
          
          <div className="prose max-w-none">
            <h3 className="text-lg font-medium mb-2">Description</h3>
            <p className="whitespace-pre-line">{item.description}</p>
          </div>
          
          {/* Item metadata */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex flex-col items-center text-center p-2 border-r border-gray-200">
              <Clock className="h-5 w-5 text-blue-500 mb-1" />
              <span className="text-xs text-gray-500">Yerləşdirildi</span>
              <span className="text-sm font-medium">{new Date(item.createdAt).toLocaleDateString()}</span>
            </div>
            
            <div className="flex flex-col items-center text-center p-2 border-r border-gray-200">
              <MapPin className="h-5 w-5 text-blue-500 mb-1" />
              <span className="text-xs text-gray-500">Yerləşir</span>
              <span className="text-sm font-medium">{item.city || "N/A"}</span>
            </div>
            
            <div className="flex flex-col items-center text-center p-2">
              <Star className="h-5 w-5 text-blue-500 mb-1" />
              <span className="text-xs text-gray-500">Vəziyyət</span>
              <span className="text-sm font-medium">{item.condition}</span>
            </div>
          </div>
          
          {/* Owner information */}
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="bg-gray-50 p-3 border-b border-gray-100">
                <h3 className="text-sm font-medium flex items-center">
                  <User className="h-4 w-4 mr-2 text-gray-500" />
                  Bu elanı yerləşdirən
                </h3>
              </div>
              
              <div className="p-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12 border-2 border-gray-200">
                    <AvatarImage 
                      src={item.owner.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.owner.fullName || item.owner.username)}`} 
                      alt={item.owner.username} 
                    />
                    <AvatarFallback>{item.owner.username[0].toUpperCase()}</AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{item.owner.fullName || item.owner.username}</h3>
                        <p className="text-sm text-gray-600">@{item.owner.username}</p>
                      </div>
                      
                      <Link href={`/profile/${item.owner.username}`}>
                        <Button variant="outline" size="sm" className="text-xs flex items-center gap-1.5">
                          <ExternalLink className="h-3 w-3" />
                          Profilə bax
                        </Button>
                      </Link>
                    </div>
                    
                    <div className="mt-3 flex items-center">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <svg 
                            key={star}
                            xmlns="http://www.w3.org/2000/svg" 
                            className="h-4 w-4 text-yellow-400 fill-current" 
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <span className="text-sm ml-2 text-gray-600">(15 rəy)</span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <span className="block text-sm font-medium text-blue-600">17</span>
                    <span className="text-xs text-gray-500">Aktiv elan</span>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <span className="block text-sm font-medium text-green-600">23</span>
                    <span className="text-xs text-gray-500">Tamamlanmış barter</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {!isOwner && user && (
            <Tabs defaultValue="message" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="message">Send Message</TabsTrigger>
                <TabsTrigger value="offer">Make Offer</TabsTrigger>
              </TabsList>
              
              <TabsContent value="message" className="mt-4">
                <div className="space-y-4">
                  <Textarea
                    placeholder="Write a message to the owner..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                  />
                  <Button 
                    className="w-full"
                    onClick={handleSendMessage}
                    disabled={sendMessageMutation.isPending}
                  >
                    {sendMessageMutation.isPending ? (
                      <>Sending...</>
                    ) : (
                      <>
                        <MessageCircle className="mr-2 h-4 w-4" />
                        Send Message
                      </>
                    )}
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="offer" className="mt-4">
                <div className="space-y-4">
                  {tradeableItems.length > 0 ? (
                    <>
                      <p className="text-sm text-gray-600">
                        Select one of your items to offer in exchange for this item
                      </p>
                      <Select onValueChange={(value) => setSelectedItemForOffer(Number(value))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your item to trade" />
                        </SelectTrigger>
                        <SelectContent>
                          {tradeableItems.map((userItem) => (
                            <SelectItem key={userItem.id} value={userItem.id.toString()}>
                              {userItem.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button 
                        className="w-full"
                        onClick={handleSendOffer}
                        disabled={sendOfferMutation.isPending}
                      >
                        {sendOfferMutation.isPending ? "Sending Offer..." : "Send Offer"}
                      </Button>
                    </>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-gray-600 mb-4">You don't have any active items to trade.</p>
                      <Button asChild>
                        <a href="/items/new">List an Item</a>
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          )}
          
          {!user && (
            <Dialog>
              <DialogTrigger asChild>
                <Button className="w-full">Contact Owner</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Authentication Required</DialogTitle>
                  <DialogDescription>
                    You need to be logged in to contact the owner of this item.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => navigate("/login")}>
                    Login
                  </Button>
                  <Button onClick={() => navigate("/register")}>
                    Register
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
    </div>
  );
}
