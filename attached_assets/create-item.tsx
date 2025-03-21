import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertItemSchema } from "@shared/schema";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useEffect, useState } from "react";

type CreateItemFormValues = z.infer<typeof insertItemSchema>;

export default function CreateItem() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated && !user) {
      setLocation("/login");
    }
  }, [isAuthenticated, user, setLocation]);

  // Fetch categories
  const { data: categories, isLoading: isLoadingCategories } = useQuery({
    queryKey: ["/api/categories"],
  });

  const form = useForm<CreateItemFormValues>({
    resolver: zodResolver(insertItemSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "electronics",
      subcategory: "",
      wantedExchange: "",
      status: "active",
      location: user?.city || "Bakı",
      userId: user?.id || 0,
    },
  });

  const createItemMutation = useMutation({
    mutationFn: async (data: CreateItemFormValues) => {
      const response = await apiRequest("POST", "/api/items", data);
      return await response.json();
    },
    onSuccess: async (data) => {
      // Upload images if any
      if (uploadedImages.length > 0) {
        setIsUploading(true);
        
        try {
          for (let i = 0; i < uploadedImages.length; i++) {
            const formData = new FormData();
            formData.append("image", uploadedImages[i]);
            formData.append("itemId", data.id.toString());
            formData.append("isPrimary", i === 0 ? "true" : "false");
            
            await apiRequest("POST", "/api/images", formData);
          }
          
          toast({
            title: "Elan uğurla yaradıldı",
            description: "Elanınız uğurla yaradıldı və şəkillər yükləndi.",
          });
          
          setLocation(`/item/${data.id}`);
        } catch (error) {
          toast({
            variant: "destructive",
            title: "Şəkilləri yükləmək mümkün olmadı",
            description: "Elan yaradıldı, lakin şəkilləri yükləmək mümkün olmadı. Profil səhifəsindən yenidən cəhd edin.",
          });
          
          setLocation(`/item/${data.id}`);
        } finally {
          setIsUploading(false);
        }
      } else {
        toast({
          title: "Elan uğurla yaradıldı",
          description: "Elanınız uğurla yaradıldı.",
        });
        
        setLocation(`/item/${data.id}`);
      }
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Xəta baş verdi",
        description: error.message || "Elan yaradılarkən xəta baş verdi. Yenidən cəhd edin.",
      });
    },
  });

  const onSubmit = (data: CreateItemFormValues) => {
    // Set user ID from auth context
    data.userId = user?.id || 0;
    createItemMutation.mutate(data);
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const fileArray = Array.from(event.target.files);
      setUploadedImages(fileArray);
    }
  };

  if (!isAuthenticated || !user) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="container max-w-2xl mx-auto py-10 px-4">
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Yeni elan yerləşdir</CardTitle>
          <CardDescription>
            Dəyişdirmək istədiyiniz əşya haqqında məlumat daxil edin
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Başlıq</FormLabel>
                    <FormControl>
                      <Input placeholder="Əşyanın adı və əsas xüsusiyyətləri" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Təsvir</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Əşyanın təsviri, vəziyyəti, xüsusiyyətləri" 
                        className="min-h-[120px]" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kateqoriya</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        disabled={isLoadingCategories}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Kateqoriya seçin" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Array.isArray(categories) && categories.map((category: any) => (
                            <SelectItem 
                              key={category.name} 
                              value={category.name}
                            >
                              {category.displayName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="subcategory"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Alt kateqoriya (istəyə bağlı)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Alt kateqoriya" 
                          {...field} 
                          value={field.value || ''} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="wantedExchange"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nəyə dəyişdirmək istəyirsiniz?</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Məsələn: iPhone 13, PlayStation 5, Velosiped və s." 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Yerləşdiyi yer</FormLabel>
                    <FormControl>
                      <Input placeholder="Şəhər, rayon" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div>
                <FormLabel className="block mb-2">Şəkillər (ilk şəkil əsas şəkil kimi istifadə olunacaq)</FormLabel>
                <Input 
                  type="file" 
                  multiple 
                  accept="image/*" 
                  onChange={handleImageChange}
                  className="mb-2"
                />
                {uploadedImages.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {uploadedImages.map((file, index) => (
                      <div key={index} className="relative">
                        <img 
                          src={URL.createObjectURL(file)} 
                          alt={`Preview ${index}`} 
                          className="h-20 w-20 object-cover rounded-md"
                        />
                        {index === 0 && (
                          <span className="absolute top-0 right-0 bg-primary text-white text-xs px-1 rounded-bl-md">
                            Əsas
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={createItemMutation.isPending || isUploading}
              >
                {createItemMutation.isPending || isUploading
                  ? "Elan yerləşdirilir..."
                  : "Elanı yerləşdir"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
