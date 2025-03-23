import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useParams, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "../context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import ItemCard from "../components/items/ItemCard";
import StarRating from "@/components/ratings/StarRating";
import UserRating from "@/components/ratings/UserRating";
import { Item, User } from "@shared/schema";

const profileSchema = z.object({
  fullName: z.string().min(2, "Ad soyad ən azı 2 simvol olmalıdır"),
  email: z.string().email("Düzgün e-poçt ünvanı daxil edin"),
  avatar: z.string().optional(),
  bio: z.string().max(500, "Bioqrafiya 500 simvoldan çox olmamalıdır").optional(),
  phone: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [, params] = useRoute('/profile/:id?');
  const viewedUserId = params?.id ? parseInt(params.id) : user?.id;
  
  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);
  
  // Get viewed user data if viewing another user's profile
  const { data: viewedUser, isLoading: viewedUserLoading } = useQuery<User>({
    queryKey: [`/api/users/${viewedUserId}`],
    enabled: !!viewedUserId && viewedUserId !== user?.id,
  });
  
  const displayUser = viewedUserId !== user?.id ? viewedUser : user;
  
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user?.fullName || "",
      email: user?.email || "",
      avatar: user?.avatar || "",
      bio: user?.bio || "",
      phone: user?.phone || "",
    },
  });
  
  // Update form values when user data changes
  useEffect(() => {
    if (user) {
      form.reset({
        fullName: user.fullName || "",
        email: user.email || "",
        avatar: user.avatar || "",
        bio: user.bio || "",
        phone: user.phone || "",
      });
    }
  }, [user, form]);
  
  // Get user's items
  const { data: items = [], isLoading: itemsLoading } = useQuery<(Item & { mainImage?: string })[]>({
    queryKey: ['/api/items', { userId: user?.id }],
    enabled: !!user,
  });
  
  // Get user's favorites
  const { data: favorites = [], isLoading: favoritesLoading } = useQuery<{ id: number, item: Item & { mainImage?: string } }[]>({
    queryKey: ['/api/favorites'],
    enabled: !!user,
  });
  
  // Update profile mutation
  const mutation = useMutation({
    mutationFn: async (data: ProfileFormValues) => {
      const res = await apiRequest('PUT', '/api/users/me', data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Profil yeniləndi",
        description: "Profiliniz uğurla yeniləndi.",
      });
      refreshUser();
    },
    onError: (error) => {
      toast({
        title: "Yeniləmə xətası",
        description: error.message || "Profili yeniləmək mümkün olmadı",
        variant: "destructive",
      });
    },
  });
  
  async function onSubmit(data: ProfileFormValues) {
    mutation.mutate(data);
  }
  
  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="mb-8">
          <TabsTrigger value="profile">Profil</TabsTrigger>
          <TabsTrigger value="items">Mənim Əşyalarım</TabsTrigger>
          <TabsTrigger value="favorites">Seçilmişlər</TabsTrigger>
        </TabsList>
        
        {/* Profile Tab */}
        <TabsContent value="profile">
          {viewedUserId !== user?.id ? (
            // Viewing another user's profile
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="md:col-span-1">
                <CardHeader>
                  <CardTitle>{displayUser?.fullName || displayUser?.username}</CardTitle>
                  <CardDescription>İstifadəçi profili</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center">
                  {viewedUserLoading ? (
                    <div className="h-32 w-32 bg-gray-200 rounded-full animate-pulse mb-4"></div>
                  ) : (
                    <>
                      <Avatar className="w-32 h-32 mb-4">
                        <AvatarImage 
                          src={displayUser?.avatar || "https://ui-avatars.com/api/?name=" + encodeURIComponent(displayUser?.fullName || displayUser?.username || '')} 
                        />
                        <AvatarFallback>{displayUser?.fullName?.[0] || displayUser?.username?.[0]}</AvatarFallback>
                      </Avatar>
                      <h3 className="text-xl font-bold">{displayUser?.fullName || displayUser?.username}</h3>
                      <p className="text-gray-500 mb-4">@{displayUser?.username}</p>
                      {displayUser?.bio && <p className="text-center text-gray-700">{displayUser.bio}</p>}
                      
                      <div className="mt-6 flex gap-4">
                        <Button asChild variant="outline">
                          <a href={`/messages/user/${displayUser?.id}`}>Mesaj göndər</a>
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
              
              <div className="md:col-span-2">
                {displayUser && <UserRating userId={displayUser.id} displayUser={displayUser} />}
              </div>
            </div>
          ) : (
            // Viewing own profile
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-1 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Sizin Profiliniz</CardTitle>
                    <CardDescription>Başqaları sizi belə görəcək</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center">
                    <Avatar className="w-32 h-32 mb-4">
                      <AvatarImage src={user.avatar || "https://ui-avatars.com/api/?name=" + encodeURIComponent(user.fullName || user.username)} />
                      <AvatarFallback>{user.fullName?.[0] || user.username?.[0]}</AvatarFallback>
                    </Avatar>
                    <h3 className="text-xl font-bold">{user.fullName || user.username}</h3>
                    <p className="text-gray-500 mb-4">@{user.username}</p>
                    {user.bio && <p className="text-center text-gray-700">{user.bio}</p>}
                  </CardContent>
                </Card>
                
                {user && <UserRating userId={user.id} displayUser={user} />}
              </div>
              
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Profili Düzənlə</CardTitle>
                  <CardDescription>Şəxsi məlumatlarınızı yeniləyin</CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <FormField
                        control={form.control}
                        name="fullName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tam Ad</FormLabel>
                            <FormControl>
                              <Input placeholder="Əhməd Məmmədov" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>E-poçt</FormLabel>
                            <FormControl>
                              <Input placeholder="ad.soyad@gmail.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="avatar"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Profil şəkli</FormLabel>
                            <div className="space-y-4">
                              <FormControl>
                                <Input placeholder="https://example.com/avatar.jpg" {...field} value={field.value || ""} />
                              </FormControl>
                              <div className="flex flex-col">
                                <div className="text-sm mb-2 font-medium">və ya şəkil yüklə:</div>
                                <div className="flex items-center gap-4">
                                  <label 
                                    htmlFor="avatar-upload" 
                                    className="flex h-9 cursor-pointer items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                  >
                                    Şəkil seç
                                  </label>
                                  <input
                                    id="avatar-upload"
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={async (e) => {
                                      const file = e.target.files?.[0];
                                      if (!file) return;
                                      
                                      // Create form data for upload
                                      const formData = new FormData();
                                      formData.append('avatar', file);
                                      
                                      try {
                                        const response = await fetch('/api/users/me/avatar', {
                                          method: 'POST',
                                          body: formData,
                                          // Don't set Content-Type, the browser will set it including the boundary
                                        });
                                        
                                        if (!response.ok) {
                                          throw new Error('Failed to upload avatar');
                                        }
                                        
                                        const data = await response.json();
                                        field.onChange(data.avatarUrl);
                                        toast({
                                          title: "Profil şəkli yükləndi",
                                          description: "Profil şəkliniz uğurla yeniləndi."
                                        });
                                        refreshUser();
                                      } catch (error) {
                                        toast({
                                          title: "Xəta",
                                          description: "Şəkil yüklənərkən xəta baş verdi.",
                                          variant: "destructive"
                                        });
                                        console.error('Error uploading avatar:', error);
                                      }
                                    }}
                                  />
                                  {field.value && <img src={field.value} alt="Avatar preview" className="h-12 w-12 rounded-full object-cover" />}
                                </div>
                              </div>
                            </div>
                            <FormDescription>
                              Profil şəkliniz üçün URL daxil edin və ya yerli kompüterinizdən bir şəkil yükləyin
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="bio"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Haqqında</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Özünüz haqqında məlumat verin" {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Telefon</FormLabel>
                            <FormControl>
                              <Input placeholder="+994 55 XXX XX XX" {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" disabled={mutation.isPending}>
                        {mutation.isPending ? "Yadda saxlanılır..." : "Dəyişiklikləri Saxla"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
        
        {/* Items Tab */}
        <TabsContent value="items">
          <h2 className="text-2xl font-bold mb-6">Mənim Əşyalarım</h2>
          {itemsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
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
              {items.map((item) => (
                <ItemCard key={item.id} item={item} showActions={true} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-lg text-gray-500 mb-4">Hələ heç bir əşya əlavə etməmisiniz.</p>
              <Button asChild>
                <a href="/item/new">İlk Əşyanızı Əlavə Edin</a>
              </Button>
            </div>
          )}
        </TabsContent>
        
        {/* Favorites Tab */}
        <TabsContent value="favorites">
          <h2 className="text-2xl font-bold mb-6">Seçilmiş Əşyalar</h2>
          {favoritesLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="overflow-hidden">
                  <div className="h-48 bg-gray-200 animate-pulse" />
                  <CardContent className="p-4">
                    <div className="h-6 bg-gray-200 rounded animate-pulse mb-2" />
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : favorites.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {favorites.map((favorite) => (
                <ItemCard key={favorite.id} item={favorite.item} isFavorite={true} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-lg text-gray-500 mb-4">Hələ heç bir əşyanı seçilmişlərə əlavə etməmisiniz.</p>
              <Button asChild variant="outline">
                <a href="/">Əşyalara Baxın</a>
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
