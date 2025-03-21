import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import ItemCard from "@/components/shared/item-card";
import { Item } from "@shared/schema";

// Helper function to transform DB Item to ItemCard props
const mapItemToCardProps = (item: Item) => {
  return {
    id: item.id,
    title: item.title,
    category: item.category,
    subcategory: item.subcategory || undefined,
    wantedExchange: item.wantedExchange,
    status: item.status,
    location: item.location,
    createdAt: typeof item.createdAt === 'string' 
      ? item.createdAt 
      : item.createdAt instanceof Date 
        ? item.createdAt.toISOString() 
        : new Date().toISOString(),
    // Temporary placeholder until we fetch related images
    image: `/uploads/default-item-${item.id % 5 + 1}.jpg`
  };
};

export default function Profile() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const parsedId = id ? parseInt(id) : undefined;
  const isOwnProfile = user?.id === parsedId;
  
  const { data: items = [], isLoading: isLoadingItems } = useQuery<Item[]>({
    queryKey: [`/api/users/${id}/items`],
    enabled: !!id
  });
  
  // Fetch user profile
  const { data: profile, isLoading: isLoadingProfile } = useQuery({
    queryKey: [`/api/users/${id}`],
    enabled: !!id,
    // If the profile is the current user's, use that data
    initialData: isOwnProfile ? user : undefined
  });

  if (isLoadingProfile || isLoadingItems) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <Skeleton className="h-24 w-24 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-8 w-40" />
                <Skeleton className="h-6 w-32" />
              </div>
            </div>
            <Separator className="my-6" />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            <Skeleton className="h-64 w-full rounded-lg" />
            <Skeleton className="h-64 w-full rounded-lg" />
            <Skeleton className="h-64 w-full rounded-lg" />
            <Skeleton className="h-64 w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
            <div className="h-24 w-24 rounded-full bg-[#367BF5] flex items-center justify-center">
              <span className="text-4xl font-bold text-white">
                {profile?.fullName?.charAt(0)?.toUpperCase() || '?'}
              </span>
            </div>
            
            <div>
              <h1 className="text-2xl font-bold">{profile?.fullName || 'İstifadəçi adı'}</h1>
              <p className="text-neutral-medium">@{profile?.username || 'username'}</p>
              
              {profile?.city && (
                <p className="text-gray-500 flex items-center mt-1">
                  <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 13C13.6569 13 15 11.6569 15 10C15 8.34315 13.6569 7 12 7C10.3431 7 9 8.34315 9 10C9 11.6569 10.3431 13 12 13Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 22C16 18 20 14.4183 20 10C20 5.58172 16.4183 2 12 2C7.58172 2 4 5.58172 4 10C4 14.4183 8 18 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {profile.city}
                </p>
              )}
              
              {profile?.phone && (
                <p className="text-gray-500 flex items-center mt-1">
                  <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22 16.92V19.92C22.0011 20.1985 21.9441 20.4742 21.8325 20.7294C21.7209 20.9845 21.5573 21.2136 21.3518 21.4019C21.1463 21.5901 20.9031 21.7335 20.6391 21.8227C20.3751 21.9119 20.0958 21.9451 19.82 21.92C16.7428 21.5856 13.787 20.5341 11.19 18.85C8.77383 17.3147 6.72534 15.2662 5.19 12.85C3.49998 10.2412 2.44824 7.27103 2.12 4.18001C2.09501 3.90596 2.12788 3.62726 2.21649 3.36437C2.3051 3.10148 2.44756 2.85963 2.63476 2.65502C2.82196 2.45041 3.0498 2.28738 3.30379 2.17524C3.55777 2.0631 3.83233 2.00527 4.11 2.00001H7.11C7.59531 1.99523 8.06579 2.16708 8.43376 2.48354C8.80173 2.79999 9.04208 3.23945 9.11 3.72001C9.23681 4.68007 9.47188 5.62273 9.81 6.53001C9.9445 6.88793 9.97315 7.27692 9.89189 7.65089C9.81063 8.02485 9.62273 8.36812 9.35 8.64001L8.09 9.90001C9.51356 12.4136 11.5865 14.4865 14.1 15.91L15.36 14.65C15.6319 14.3773 15.9752 14.1894 16.3491 14.1081C16.7231 14.0269 17.1121 14.0555 17.47 14.19C18.3773 14.5281 19.32 14.7632 20.28 14.89C20.7658 14.9585 21.2094 15.2032 21.5265 15.5775C21.8437 15.9518 22.0122 16.4296 22 16.92Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {profile.phone}
                </p>
              )}
              
              {isOwnProfile && (
                <div className="mt-4">
                  <Button variant="outline" size="sm" className="mr-2">
                    Profili düzəlt
                  </Button>
                  <Button onClick={() => setLocation("/create-item")} size="sm" className="bg-[#367BF5]">
                    Yeni elan əlavə et
                  </Button>
                </div>
              )}
            </div>
          </div>
          
          <Separator className="my-6" />
        </div>
        
        <Tabs defaultValue="active" className="mb-8">
          <TabsList>
            <TabsTrigger value="active">Aktiv elanlar</TabsTrigger>
            <TabsTrigger value="completed">Tamamlanmış elanlar</TabsTrigger>
            {isOwnProfile && (
              <TabsTrigger value="inactive">Deaktiv elanlar</TabsTrigger>
            )}
          </TabsList>
          
          <TabsContent value="active" className="mt-6">
            {Array.isArray(items) && items.filter((item: Item) => item.status === 'active').length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {items
                  .filter((item: Item) => item.status === 'active')
                  .map((item: Item) => (
                    <ItemCard key={item.id} item={mapItemToCardProps(item)} />
                  ))}
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-10">
                    <h3 className="text-lg font-semibold mb-2">Aktiv elan yoxdur</h3>
                    <p className="text-neutral-medium mb-4">
                      {isOwnProfile 
                        ? "Hazırda heç bir aktiv elanınız yoxdur. Yeni elan əlavə edin!"
                        : "Bu istifadəçinin hazırda heç bir aktiv elanı yoxdur."}
                    </p>
                    {isOwnProfile && (
                      <Button onClick={() => setLocation("/create-item")} className="bg-[#367BF5]">
                        Yeni elan əlavə et
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="completed" className="mt-6">
            {Array.isArray(items) && items.filter((item: Item) => item.status === 'completed').length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {items
                  .filter((item: Item) => item.status === 'completed')
                  .map((item: Item) => (
                    <ItemCard key={item.id} item={mapItemToCardProps(item)} />
                  ))}
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-10">
                    <h3 className="text-lg font-semibold mb-2">Tamamlanmış elan yoxdur</h3>
                    <p className="text-neutral-medium">
                      {isOwnProfile 
                        ? "Hazırda heç bir tamamlanmış elanınız yoxdur."
                        : "Bu istifadəçinin hazırda heç bir tamamlanmış elanı yoxdur."}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          {isOwnProfile && (
            <TabsContent value="inactive" className="mt-6">
              {Array.isArray(items) && items.filter((item: Item) => item.status === 'inactive').length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {items
                    .filter((item: Item) => item.status === 'inactive')
                    .map((item: Item) => (
                      <ItemCard key={item.id} item={mapItemToCardProps(item)} />
                    ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-10">
                      <h3 className="text-lg font-semibold mb-2">Deaktiv elan yoxdur</h3>
                      <p className="text-neutral-medium">
                        Hazırda heç bir deaktiv elanınız yoxdur.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}
