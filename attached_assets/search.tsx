import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import ItemCard from "@/components/shared/item-card";
import SearchBar from "@/components/shared/search-bar";

export default function Search() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Get search params from URL
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  
  useEffect(() => {
    const url = new URL(window.location.href);
    const searchParam = url.searchParams.get("q");
    const categoryParam = url.searchParams.get("category");
    
    if (searchParam) {
      setSearch(searchParam);
    }
    
    if (categoryParam) {
      setCategory(categoryParam);
    }
  }, []);
  
  const { data: items, isLoading, error } = useQuery({
    queryKey: [`/api/items/search?q=${search}&category=${category}`],
    enabled: !!search,
  });
  
  const { data: categories } = useQuery({
    queryKey: ["/api/categories"],
  });
  
  const handleSearch = (newSearch: string, newCategory: string) => {
    setSearch(newSearch);
    setCategory(newCategory);
    
    // Update URL
    const url = new URL(window.location.href);
    url.searchParams.set("q", newSearch);
    
    if (newCategory) {
      url.searchParams.set("category", newCategory);
    } else {
      url.searchParams.delete("category");
    }
    
    window.history.pushState({}, "", url.toString());
  };

  if (error) {
    toast({
      variant: "destructive",
      title: "Xəta baş verdi",
      description: "Axtarış zamanı xəta baş verdi. Yenidən cəhd edin.",
    });
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <SearchBar 
          initialQuery={search} 
          initialCategory={category} 
          onSearch={handleSearch}
          categories={categories || []}
        />
      </div>
      
      {search ? (
        <>
          <h1 className="text-2xl font-bold mb-6">
            "{search}" üçün axtarış nəticələri
            {category && categories && (
              <span className="text-lg text-neutral-medium ml-2">
                {categories.find((c: any) => c.name === category)?.displayName} kateqoriyasında
              </span>
            )}
          </h1>
          
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              <Skeleton className="h-64 w-full rounded-lg" />
              <Skeleton className="h-64 w-full rounded-lg" />
              <Skeleton className="h-64 w-full rounded-lg" />
              <Skeleton className="h-64 w-full rounded-lg" />
            </div>
          ) : items && items.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {items.map((item: any) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-10">
                  <h3 className="text-lg font-semibold mb-2">Heç bir nəticə tapılmadı</h3>
                  <p className="text-neutral-medium mb-4">
                    "{search}" üçün heç bir elan tapılmadı. Lütfən, başqa açar sözlərlə cəhd edin.
                  </p>
                  <Button onClick={() => setLocation("/")}>Ana səhifəyə qayıt</Button>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-10">
              <h3 className="text-lg font-semibold mb-2">Axtarış sorğusu daxil edin</h3>
              <p className="text-neutral-medium mb-4">
                Elanları tapmaq üçün axtarış sorğusu daxil edin.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
