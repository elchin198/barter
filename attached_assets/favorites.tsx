import { useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import ItemCard from "@/components/shared/item-card";

export default function Favorites() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated && !user) {
      setLocation("/login");
    }
  }, [isAuthenticated, user, setLocation]);
  
  const { data: favorites, isLoading, error } = useQuery({
    queryKey: ["/api/favorites"],
    enabled: !!isAuthenticated,
  });
  
  if (!isAuthenticated) {
    return null; // Will redirect in useEffect
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">Seçilmişlər</h1>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          <Skeleton className="h-64 w-full rounded-lg" />
          <Skeleton className="h-64 w-full rounded-lg" />
          <Skeleton className="h-64 w-full rounded-lg" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-10">
              <h2 className="text-2xl font-bold mb-2">Xəta baş verdi</h2>
              <p className="text-neutral-medium mb-4">
                Seçilmişlər yüklənərkən xəta baş verdi.
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
      <h1 className="text-2xl font-bold mb-6">Seçilmişlər</h1>
      
      {favorites && favorites.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {favorites.map((item: any) => (
            <ItemCard 
              key={item.id} 
              item={item} 
              isFavorite={true} 
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-10">
              <h3 className="text-lg font-semibold mb-2">Seçilmişlər siyahınız boşdur</h3>
              <p className="text-neutral-medium mb-4">
                Seçilmişlərə əlavə etdiyiniz elanlar burada görünəcək.
              </p>
              <Button onClick={() => setLocation("/")}>Elanlara baxın</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
