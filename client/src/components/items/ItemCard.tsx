import { useState } from "react";
import { Link } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Edit, Trash2, Clock } from "lucide-react";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatRelativeTime } from "@/lib/utils";
import { Item } from "@shared/schema";
import { useAuth } from "../../context/AuthContext";

interface ItemCardProps {
  item: Item & { mainImage?: string };
  showActions?: boolean;
  isFavorite?: boolean;
}

export default function ItemCard({ item, showActions = false, isFavorite = false }: ItemCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [favorited, setFavorited] = useState(isFavorite);
  
  // Add to favorites mutation
  const addFavoriteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('POST', '/api/favorites', { itemId: item.id });
    },
    onSuccess: () => {
      setFavorited(true);
      toast({ title: "Added to favorites" });
      queryClient.invalidateQueries({ queryKey: ['/api/favorites'] });
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
      await apiRequest('DELETE', `/api/favorites/${item.id}`);
    },
    onSuccess: () => {
      setFavorited(false);
      toast({ title: "Removed from favorites" });
      queryClient.invalidateQueries({ queryKey: ['/api/favorites'] });
    },
    onError: (error) => {
      toast({ 
        title: "Failed to remove from favorites", 
        description: error.message, 
        variant: "destructive" 
      });
    }
  });
  
  // Delete item mutation
  const deleteItemMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('DELETE', `/api/items/${item.id}`);
    },
    onSuccess: () => {
      toast({ title: "Item deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/items'] });
    },
    onError: (error) => {
      toast({ 
        title: "Failed to delete item", 
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
  
  const handleDeleteItem = () => {
    deleteItemMutation.mutate();
  };
  
  // Default image if none provided
  const imageUrl = item.mainImage || "https://placehold.co/600x400/e2e8f0/64748b?text=No+Image";
  
  // Status badge styling
  const getStatusBadge = () => {
    switch (item.status) {
      case 'active':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200 backdrop-blur-sm font-medium">
            Aktiv
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 backdrop-blur-sm font-medium">
            Gözləyir
          </Badge>
        );
      case 'completed':
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200 backdrop-blur-sm font-medium">
            Tamamlanıb
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <Card className="overflow-hidden h-full flex flex-col group hover:shadow-xl transition-all duration-300 border-gray-100 hover:border-blue-100 transform hover:-translate-y-1">
      <Link href={`/items/${item.id}`}>
        <div className="block relative pt-[70%] overflow-hidden bg-gray-100 cursor-pointer">
          <img 
            src={imageUrl} 
            alt={item.title}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          
          {/* Status badge */}
          <div className="absolute top-3 left-3">
            {getStatusBadge()}
          </div>
          
          {/* Category badge */}
          <div className="absolute bottom-3 left-3">
            <Badge variant="outline" className="bg-black/60 text-white border-transparent backdrop-blur-sm">
              {item.category}
            </Badge>
          </div>
          
          {/* Favorite button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleFavoriteToggle();
            }}
            className={`absolute top-3 right-3 ${
              favorited ? "text-red-500 bg-white shadow-sm" : "text-gray-400 bg-white/80 hover:bg-white"
            } rounded-full w-8 h-8 flex items-center justify-center hover:text-red-500 transition-all duration-300`}
          >
            <Heart className="h-[18px] w-[18px]" fill={favorited ? "currentColor" : "none"} />
          </Button>
        </div>
      </Link>
      
      <CardContent className="flex-grow p-5">
        <Link href={`/items/${item.id}`}>
          <h3 className="font-semibold text-lg line-clamp-1 mb-2 group-hover:text-blue-600 transition-colors">
            {item.title}
          </h3>
        </Link>
        
        <div className="space-y-3">
          {/* Badges row */}
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-100">
              {item.condition}
            </Badge>
            
            {item.city && (
              <Badge variant="outline" className="text-xs bg-indigo-50 text-indigo-700 border-indigo-100">
                {item.city}
              </Badge>
            )}
          </div>
          
          {/* Description preview */}
          <p className="text-sm text-gray-600 line-clamp-2 min-h-[2.5rem]">
            {item.description}
          </p>
          
          {/* Date info */}
          <div className="flex items-center text-xs text-gray-500">
            <Clock className="h-3 w-3 mr-1.5" />
            <span>Yayımlandı: {formatRelativeTime(item.createdAt)}</span>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="p-5 pt-0 flex justify-between">
        {!showActions ? (
          <Link href={`/items/${item.id}`} className="w-full">
            <Button 
              variant="default" 
              size="sm" 
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              Ətraflı bax
            </Button>
          </Link>
        ) : (
          <div className="flex gap-2 w-full">
            <Link href={`/items/${item.id}`} className="flex-1">
              <Button variant="default" size="sm" className="w-full">
                Bax
              </Button>
            </Link>
            <Link href={`/items/edit/${item.id}`}>
              <Button variant="outline" size="icon" className="border-blue-200 text-blue-600 hover:bg-blue-50">
                <Edit className="h-4 w-4" />
              </Button>
            </Link>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="icon" className="border-red-200 text-red-500 hover:bg-red-50">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Əminsiniz?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Bu əməliyyat geri qaytarıla bilməz. Bu elanınızı birdəfəlik siləcək.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Ləğv et</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteItem} className="bg-red-500 hover:bg-red-600">
                    Sil
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
