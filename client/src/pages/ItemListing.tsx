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
import { Badge } from "@/components/ui/badge";
import { useAuth } from "../context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useEffect, useState } from "react";
import { X, Upload, Image as ImageIcon } from "lucide-react";

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
  imageFiles: z.any().optional(),
});

type ItemFormValues = z.infer<typeof itemSchema>;

export default function ItemListing() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const MAX_IMAGES = 5; // Maximum number of images allowed
  
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
      imageFiles: [],
    },
  });
  
  // Handle image uploads
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    // Convert FileList to array and filter for images
    const newFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
    
    // Check if adding new files would exceed the limit
    if (uploadedImages.length + newFiles.length > MAX_IMAGES) {
      toast({
        title: "Too many images",
        description: `You can only upload a maximum of ${MAX_IMAGES} images.`,
        variant: "destructive"
      });
      return;
    }
    
    // Add new files to the array
    setUploadedImages(prev => [...prev, ...newFiles]);
    
    // Clear image URL if files are uploaded
    form.setValue('imageUrl', '');
    
    // Set images in the form
    form.setValue('imageFiles', [...uploadedImages, ...newFiles]);
  };
  
  // Remove image from preview
  const removeImage = (index: number) => {
    const newImages = [...uploadedImages];
    newImages.splice(index, 1);
    setUploadedImages(newImages);
    form.setValue('imageFiles', newImages);
  };
  
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
      
      // Handle multiple image uploads
      if (uploadedImages.length > 0) {
        // Upload each image and set the first one as main
        for (let i = 0; i < uploadedImages.length; i++) {
          const formData = new FormData();
          formData.append('image', uploadedImages[i]);
          
          // Use fetch directly as apiRequest doesn't support FormData
          const uploadRes = await fetch(`/api/items/${item.id}/upload`, {
            method: 'POST',
            body: formData,
            credentials: 'include',
          });
          
          if (!uploadRes.ok) {
            throw new Error(`Failed to upload image ${i+1}`);
          }
          
          // If this is the first image, set it as main
          if (i === 0) {
            const imageData = await uploadRes.json();
            await apiRequest('PUT', `/api/items/${item.id}/images/${imageData.id}/main`, {});
          }
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
    // Set uploaded images in the form data
    data.imageFiles = uploadedImages;
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
                  name="imageFiles"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Upload Images (Max {MAX_IMAGES})</FormLabel>
                      <FormControl>
                        <div className="flex flex-col gap-4">
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-primary transition-colors">
                            <label className="flex flex-col items-center justify-center cursor-pointer">
                              <Upload className="w-8 h-8 text-gray-400 mb-2" />
                              <span className="text-sm text-gray-500 mb-1">Drag & drop images here or click to browse</span>
                              <span className="text-xs text-gray-400">{`Up to ${MAX_IMAGES} images, max 5MB each`}</span>
                              <Input 
                                type="file" 
                                accept="image/*"
                                multiple
                                className="hidden"
                                onChange={handleImageUpload}
                              />
                            </label>
                          </div>
                          
                          {/* Image previews */}
                          {uploadedImages.length > 0 && (
                            <div className="mt-4">
                              <h3 className="text-sm font-medium mb-2">Selected Images:</h3>
                              <div className="grid grid-cols-3 gap-3">
                                {uploadedImages.map((file, index) => (
                                  <div 
                                    key={index} 
                                    className="relative group rounded-md overflow-hidden border border-gray-200"
                                  >
                                    <img 
                                      src={URL.createObjectURL(file)} 
                                      alt={`Upload preview ${index+1}`}
                                      className="w-full h-24 object-cover"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => removeImage(index)}
                                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                      aria-label="Remove image"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                    {index === 0 && (
                                      <Badge className="absolute bottom-1 left-1 bg-primary text-xs px-1 py-0">
                                        Main
                                      </Badge>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormDescription>
                        The first image will be used as the main image for your listing
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
                            
                            // Clear uploaded images if URL is provided
                            if (e.target.value) {
                              setUploadedImages([]);
                              form.setValue('imageFiles', []);
                            }
                          }}
                          disabled={uploadedImages.length > 0}
                        />
                      </FormControl>
                      <FormDescription>
                        Enter a URL for your item's image (only available when no images are uploaded)
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
