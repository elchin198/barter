import { useState } from "react";
import { Link } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Edit, Trash2 } from "lucide-react";
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
        return <Badge className="bg-green-500">Active</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500">Pending</Badge>;
      case 'completed':
        return <Badge className="bg-blue-500">Completed</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card className="overflow-hidden h-full flex flex-col">
      <Link href={`/items/${item.id}`}>
        <a className="block relative pt-[70%] overflow-hidden bg-gray-100">
          <img 
            src={imageUrl} 
            alt={item.title}
            className="absolute inset-0 w-full h-full object-cover transition-transform hover:scale-105"
          />
          <div className="absolute top-2 right-2">
            {getStatusBadge()}
          </div>
        </a>
      </Link>
      
      <CardContent className="flex-grow p-4">
        <Link href={`/items/${item.id}`}>
          <a className="block">
            <h3 className="font-semibold text-lg truncate mb-1 hover:text-blue-600 transition-colors">
              {item.title}
            </h3>
          </a>
        </Link>
        <div className="flex justify-between items-center">
          <div>
            <span className="text-sm text-gray-600 block">
              {item.category}
            </span>
            <span className="text-sm text-gray-600 block">
              Condition: {item.condition}
            </span>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="p-4 pt-0 flex justify-between">
        {!showActions ? (
          <>
            <Link href={`/items/${item.id}`}>
              <Button variant="outline" size="sm">View Details</Button>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.preventDefault();
                handleFavoriteToggle();
              }}
              className={favorited ? "text-red-500" : "text-gray-400"}
            >
              <Heart className="h-5 w-5" fill={favorited ? "currentColor" : "none"} />
            </Button>
          </>
        ) : (
          <div className="flex gap-2 w-full">
            <Link href={`/items/${item.id}`}>
              <Button variant="outline" size="sm" className="flex-1">View</Button>
            </Link>
            <Link href={`/items/edit/${item.id}`}>
              <Button variant="ghost" size="icon">
                <Edit className="h-4 w-4" />
              </Button>
            </Link>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-red-500">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your item listing.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteItem} className="bg-red-500 hover:bg-red-600">
                    Delete
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
