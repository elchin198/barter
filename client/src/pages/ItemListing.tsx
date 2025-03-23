import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "../context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useEffect } from "react";

const CATEGORIES = [
  "Electronics",
  "Clothing",
  "Books",
  "Home & Garden",
  "Sports",
  "Toys",
  "Vehicles",
  "Collectibles",
  "Other"
];

const CONDITIONS = [
  "New",
  "Like New",
  "Good",
  "Fair",
  "Poor"
];

const itemSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100, "Title must not exceed 100 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  category: z.string().min(1, "Please select a category"),
  condition: z.string().min(1, "Please select a condition"),
  imageUrl: z.string().optional(),
  imageFile: z.any().optional(),
});

type ItemFormValues = z.infer<typeof itemSchema>;

export default function ItemListing() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please login to list items",
        variant: "destructive",
      });
      navigate("/login");
    }
  }, [user, navigate, toast]);
  
  const form = useForm<ItemFormValues>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      condition: "",
      imageUrl: "",
      imageFile: undefined,
    },
  });
  
  // Create item mutation
  const mutation = useMutation({
    mutationFn: async (data: ItemFormValues) => {
      // First create the item
      const itemRes = await apiRequest('POST', '/api/items', {
        title: data.title,
        description: data.description,
        category: data.category,
        condition: data.condition,
        status: "active"
      });
      const item = await itemRes.json();
      
      // Handle image upload if file is provided
      if (data.imageFile && data.imageFile instanceof File) {
        const formData = new FormData();
        formData.append('image', data.imageFile);
        
        // Use fetch directly as apiRequest doesn't support FormData
        const uploadRes = await fetch(`/api/items/${item.id}/upload`, {
          method: 'POST',
          body: formData,
          credentials: 'include',
        });
        
        if (!uploadRes.ok) {
          throw new Error('Failed to upload image');
        }
      } 
      // Or use image URL if provided instead
      else if (data.imageUrl) {
        await apiRequest('POST', `/api/items/${item.id}/images`, {
          filePath: data.imageUrl,
          isMain: true
        });
      }
      
      return item;
    },
    onSuccess: (data) => {
      toast({
        title: "Item created",
        description: "Your item has been successfully listed.",
      });
      navigate(`/item/${data.id}`);
    },
    onError: (error) => {
      toast({
        title: "Failed to create item",
        description: error.message || "An error occurred while creating your item",
        variant: "destructive",
      });
    },
  });
  
  async function onSubmit(data: ItemFormValues) {
    mutation.mutate(data);
  }
  
  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <div className="container max-w-2xl mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">List a New Item</CardTitle>
          <CardDescription>
            Provide details about the item you want to trade
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
                    <FormLabel>Item Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Vintage Camera" {...field} />
                    </FormControl>
                    <FormDescription>
                      A short, descriptive title for your item
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {CATEGORIES.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
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
                  name="condition"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Condition</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a condition" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {CONDITIONS.map((condition) => (
                            <SelectItem key={condition} value={condition}>
                              {condition}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe your item in detail. Include features, condition details, and what you're looking to trade for." 
                        className="min-h-[120px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 gap-6">
                <FormField
                  control={form.control}
                  name="imageFile"
                  render={({ field: { value, onChange, ...fieldProps } }) => (
                    <FormItem>
                      <FormLabel>Upload Image</FormLabel>
                      <FormControl>
                        <div className="flex flex-col gap-2">
                          <Input 
                            type="file" 
                            accept="image/*" 
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                onChange(file);
                                
                                // Clear imageUrl if imageFile is provided
                                form.setValue('imageUrl', '');
                              }
                            }}
                            {...fieldProps}
                          />
                          {value && (
                            <div className="text-sm text-muted-foreground mt-1">
                              Selected file: {value instanceof File ? value.name : ''}
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormDescription>
                        Upload an image directly from your device
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex items-center justify-center my-2">
                  <div className="px-4 py-2 bg-muted rounded-md">OR</div>
                </div>
                
                <FormField
                  control={form.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Image URL</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="https://example.com/image.jpg" 
                          {...field} 
                          value={field.value || ""} 
                          onChange={(e) => {
                            field.onChange(e);
                            
                            // Clear imageFile if imageUrl is provided
                            if (e.target.value) {
                              form.setValue('imageFile', undefined);
                            }
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        Enter a URL for your item's image
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="flex justify-end space-x-4">
                <Button variant="outline" type="button" onClick={() => navigate("/profile")}>
                  Cancel
                </Button>
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending ? "Creating..." : "Create Listing"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
