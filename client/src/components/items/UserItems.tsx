import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Item } from "@shared/schema";
import { Clock, Package } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";
import { useTranslation } from "react-i18next";

interface UserItemsProps {
  userId: number;
  username?: string;
  excludeItemId?: number;
  limit?: number;
  className?: string;
}

interface ItemWithImage extends Item {
  mainImage?: string;
}

export default function UserItems({ userId, username, excludeItemId, limit = 3 }: UserItemsProps) {
  const { t } = useTranslation();
  
  // Fetch user's items
  const { data: items = [], isLoading } = useQuery<ItemWithImage[]>({
    queryKey: ['/api/items', { userId }],
    enabled: !!userId,
  });
  
  // Filter out items (exclude current item and show only active ones)
  const filteredItems = items
    .filter(item => item.id !== excludeItemId && item.status === 'active')
    .slice(0, limit);
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium">{t('items.userOtherItems', 'Digər elanlar')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="overflow-hidden animate-pulse">
              <div className="aspect-video bg-gray-200" />
              <CardContent className="p-3">
                <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }
  
  if (filteredItems.length === 0) {
    return null;
  }
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium flex items-center border-b border-gray-100 pb-2">
        <Package className="h-5 w-5 mr-2 text-blue-500" />
        {t('items.userOtherItems', `${username} tərəfindən digər elanlar`)}
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map((item) => (
          <Link key={item.id} href={`/items/${item.id}`}>
            <a className="block transition-transform hover:scale-[1.02] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
              <Card className="overflow-hidden h-full">
                <div className="aspect-video bg-gray-100 relative overflow-hidden">
                  <img 
                    src={item.mainImage || "https://placehold.co/600x400/e2e8f0/64748b?text=No+Image"} 
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                  {item.status !== 'active' && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <Badge className={item.status === 'completed' ? 'bg-green-500 text-white' : 'bg-yellow-500 text-white'}>
                        {item.status === 'completed' ? t('items.statusCompleted', 'Tamamlanmış') : t('items.statusPending', 'Gözləmədə')}
                      </Badge>
                    </div>
                  )}
                </div>
                
                <CardContent className="p-3">
                  <div className="font-medium line-clamp-2 mb-1 text-sm">{item.title}</div>
                  <div className="flex items-center text-xs text-gray-500">
                    <Clock className="h-3 w-3 mr-1" />
                    {formatRelativeTime(item.createdAt)}
                  </div>
                </CardContent>
              </Card>
            </a>
          </Link>
        ))}
      </div>
    </div>
  );
}