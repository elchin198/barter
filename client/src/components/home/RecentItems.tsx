import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Star, Clock, Sparkles } from "lucide-react";
import { Link } from "wouter";
import ItemCard from "../items/ItemCard";
import { Item } from "@shared/schema";
import { Badge } from "@/components/ui/badge";

export default function RecentItems() {
  // Filtered search query
  const { data: items = [], isLoading } = useQuery<(Item & { mainImage?: string })[]>({
    queryKey: ['/api/items'],
  });
  
  return (
    <section className="py-12 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div className="mb-4 md:mb-0">
            <div className="flex items-center">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Son əlavə edilən əşyalar</h2>
              <Badge className="ml-3 bg-blue-100 text-blue-800 hover:bg-blue-200 font-medium">
                <Clock className="mr-1 h-3 w-3" />
                Yeni
              </Badge>
            </div>
            <p className="text-gray-600 mt-1 max-w-2xl">
              BarterTap-da ən son əlavə edilmiş mübadiləyə hazır əşyalar
            </p>
          </div>
          
          <Link href="/items" className="text-blue-600 hover:underline flex items-center font-medium bg-white rounded-lg px-4 py-2 shadow-sm border border-gray-100 transition-all hover:shadow">
            Hamısını göstər <ArrowRight className="ml-1.5 h-4 w-4" />
          </Link>
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Card key={i} className="overflow-hidden h-full">
                <div className="relative pt-[70%] bg-gray-200 animate-pulse" />
                <CardContent className="p-4">
                  <div className="h-6 bg-gray-200 rounded animate-pulse mb-3" />
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4 mb-2" />
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : items.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {items.slice(0, 8).map((item, index) => (
                <div key={item.id} className="relative">
                  {index < 2 && (
                    <div className="absolute -top-2 -right-2 z-10">
                      <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-1 font-medium">
                        <Sparkles className="mr-1 h-3 w-3" />
                        Populyar
                      </Badge>
                    </div>
                  )}
                  <ItemCard item={item} />
                </div>
              ))}
            </div>
            
            <div className="text-center mt-10">
              <Link href="/items">
                <Button variant="outline" className="rounded-full px-6 border-gray-300 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200">
                  Daha çox elan göstər <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </>
        ) : (
          <div className="bg-white border border-dashed border-gray-300 rounded-xl p-12 text-center">
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Star className="h-10 w-10 text-blue-400" />
            </div>
            <h3 className="text-xl font-bold mb-2">Hələ ki, heç bir əşya əlavə edilməyib</h3>
            <p className="text-gray-600 mb-6">
              İlk əşyanı əlavə edən siz olun və barterə başlayın!
            </p>
            <Link href="/item/new">
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