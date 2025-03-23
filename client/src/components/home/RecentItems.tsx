import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Star } from "lucide-react";
import { Link } from "wouter";
import ItemCard from "../items/ItemCard";
import { Item } from "@shared/schema";

export default function RecentItems() {
  // Filtered search query
  const { data: items = [], isLoading } = useQuery<(Item & { mainImage?: string })[]>({
    queryKey: ['/api/items'],
  });
  
  return (
    <section className="py-12 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold">Son əlavə edilən əşyalar</h2>
          <Link href="/items" className="text-blue-600 hover:underline flex items-center">
            Hamısını göstər <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Card key={i} className="overflow-hidden">
                <div className="h-48 bg-gray-200 animate-pulse" />
                <CardContent className="p-4">
                  <div className="h-6 bg-gray-200 rounded animate-pulse mb-2" />
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : items.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {items.slice(0, 8).map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="bg-white border border-dashed border-gray-300 rounded-xl p-12 text-center">
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Star className="h-10 w-10 text-blue-400" />
            </div>
            <h3 className="text-xl font-bold mb-2">Hələ ki, heç bir əşya əlavə edilməyib</h3>
            <p className="text-gray-600 mb-6">
              İlk əşyanı əlavə edən siz olun və barterə başlayın!
            </p>
            <Link href="/items/new">
              <Button className="bg-blue-600 hover:bg-blue-700">
                Əşya Əlavə Et
              </Button>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}