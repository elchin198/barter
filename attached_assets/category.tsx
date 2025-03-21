import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import ItemCard from "@/components/shared/item-card";

export default function Category() {
  const { category } = useParams();
  const [, setLocation] = useLocation();
  
  const { data: categoryInfo, isLoading: isLoadingCategory } = useQuery({
    queryKey: [`/api/categories/${category}`],
  });
  
  const { data: items, isLoading: isLoadingItems } = useQuery({
    queryKey: [`/api/items/category/${category}`],
  });
  
  const isLoading = isLoadingCategory || isLoadingItems;

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-6 w-96 mt-2" />
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          <Skeleton className="h-64 w-full rounded-lg" />
          <Skeleton className="h-64 w-full rounded-lg" />
          <Skeleton className="h-64 w-full rounded-lg" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  if (!categoryInfo) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-10">
              <h2 className="text-2xl font-bold mb-2">Kateqoriya tapılmadı</h2>
              <p className="text-neutral-medium mb-4">
                Axtardığınız kateqoriya mövcud deyil.
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
      <div className="flex items-center mb-2">
        <i className={`${categoryInfo.icon} text-${categoryInfo.color}-600 mr-2 text-2xl`}></i>
        <h1 className="text-2xl font-bold">{categoryInfo.displayName}</h1>
      </div>
      
      <p className="text-neutral-medium mb-6">
        Bu kateqoriyada olan elanlar
      </p>
      
      {items && items.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {items.map((item: any) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-10">
              <h3 className="text-lg font-semibold mb-2">Bu kateqoriyada elan yoxdur</h3>
              <p className="text-neutral-medium mb-4">
                Bu kateqoriyada hələ heç bir elan yerləşdirilməyib.
              </p>
              <Button onClick={() => setLocation("/create-item")}>
                İlk elanı siz yerləşdirin
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
