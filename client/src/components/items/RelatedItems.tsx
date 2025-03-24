import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ItemsAPI } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import ItemCard from "./ItemCard";
import { Package, Map } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { Item } from "@shared/schema";

interface RelatedItemsProps {
  itemId: number;
  category: string;
  city: string;
  className?: string;
  limit?: number;
}

interface ItemWithImage extends Item {
  mainImage?: string;
}

export default function RelatedItems({
  itemId,
  category,
  city,
  className,
  limit = 4
}: RelatedItemsProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<"category" | "city">("category");
  const [categoryItems, setCategoryItems] = useState<ItemWithImage[]>([]);
  const [cityItems, setCityItems] = useState<ItemWithImage[]>([]);
  const [isLoadingCategory, setIsLoadingCategory] = useState(true);
  const [isLoadingCity, setIsLoadingCity] = useState(true);

  useEffect(() => {
    const fetchCategoryItems = async () => {
      setIsLoadingCategory(true);
      try {
        const items = await ItemsAPI.getItems({
          category,
          limit: limit + 1 // +1 to account for possibly excluding the current item
        });
        // Filter out the current item
        const filteredItems = items.filter(item => item.id !== itemId).slice(0, limit);
        setCategoryItems(filteredItems);
      } catch (error) {
        console.error("Error fetching category items:", error);
        setCategoryItems([]);
      } finally {
        setIsLoadingCategory(false);
      }
    };

    const fetchCityItems = async () => {
      setIsLoadingCity(true);
      try {
        const items = await ItemsAPI.getItems({
          city,
          limit: limit + 1
        });
        // Filter out the current item
        const filteredItems = items.filter(item => item.id !== itemId).slice(0, limit);
        setCityItems(filteredItems);
      } catch (error) {
        console.error("Error fetching city items:", error);
        setCityItems([]);
      } finally {
        setIsLoadingCity(false);
      }
    };

    if (category) {
      fetchCategoryItems();
    }
    
    if (city) {
      fetchCityItems();
    }
  }, [itemId, category, city, limit]);

  // Create skeleton placeholders for loading state
  const skeletons = Array.from({ length: 4 }).map((_, index) => (
    <Card key={`skeleton-${index}`} className="border-none shadow-sm overflow-hidden">
      <CardContent className="p-0">
        <div className="flex flex-col">
          <Skeleton className="h-[180px] w-full" />
          <div className="p-3 space-y-2">
            <Skeleton className="h-5 w-4/5" />
            <Skeleton className="h-4 w-3/5" />
            <div className="flex justify-between items-center pt-2">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-8 w-[70px] rounded-full" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  ));

  return (
    <div className={cn("space-y-4", className)}>
      <h3 className="text-xl font-bold">{t("items.relatedItems")}</h3>
      
      <Tabs defaultValue="category" onValueChange={(value) => setActiveTab(value as "category" | "city")}>
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-4">
          <TabsTrigger value="category" className="flex items-center gap-1.5">
            <Package className="h-4 w-4" />
            {t("items.sameCategory")}
          </TabsTrigger>
          <TabsTrigger value="city" className="flex items-center gap-1.5">
            <Map className="h-4 w-4" />
            {t("items.sameCity")}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="category" className="mt-0">
          {isLoadingCategory ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {skeletons}
            </div>
          ) : categoryItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {categoryItems.map(item => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p>{t("items.noItems")}</p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="city" className="mt-0">
          {isLoadingCity ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {skeletons}
            </div>
          ) : cityItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {cityItems.map(item => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Map className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p>{t("items.noItems")}</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}