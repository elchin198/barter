import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw } from "lucide-react";

const offerSchema = z.object({
  itemId: z.string(),
  message: z.string().min(1, "Mesaj daxil edin").max(500, "Mesaj çox uzundur"),
});

type OfferFormValues = z.infer<typeof offerSchema>;

interface MakeOfferModalProps {
  targetItemId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function MakeOfferModal({ targetItemId, isOpen, onClose }: MakeOfferModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(isOpen);
  
  // Set modal state when isOpen prop changes
  useEffect(() => {
    setOpen(isOpen);
  }, [isOpen]);
  
  // Handle close - notify parent
  const handleClose = () => {
    setOpen(false);
    onClose();
  };
  
  // Get user's items for offering
  const { data: userItems, isLoading: isLoadingItems } = useQuery({
    queryKey: ["/api/items/user", user?.id],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!user?.id,
  });
  
  // Form
  const form = useForm<OfferFormValues>({
    resolver: zodResolver(offerSchema),
    defaultValues: {
      itemId: "",
      message: "Mən bu əşya üçün barter təklifi etmək istəyirəm.",
    },
  });
  
  // Mutation for sending offer
  const offerMutation = useMutation({
    mutationFn: async (data: OfferFormValues) => {
      const res = await apiRequest("POST", "/api/offers", {
        itemId: targetItemId,
        offerItemId: data.itemId,
        message: data.message
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Təklif göndərildi",
        description: "Təklifiniz uğurla göndərildi",
      });
      handleClose();
      
      // Invalidate queries
      queryClient.invalidateQueries(["/api/offers/sent"]);
    },
    onError: (error) => {
      toast({
        title: "Xəta baş verdi",
        description: error.message || "Təklif göndərilə bilmədi. Yenidən cəhd edin",
        variant: "destructive",
      });
    },
  });
  
  // Submit handler
  const onSubmit = (data: OfferFormValues) => {
    offerMutation.mutate(data);
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Barter təklifi edin</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
            <FormField
              control={form.control}
              name="itemId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Təklif etdiyiniz əşya</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isLoadingItems}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Təklif üçün bir əşya seçin" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {isLoadingItems ? (
                        <div className="flex items-center justify-center p-4">
                          <RefreshCw className="h-5 w-5 text-[#367BF5] animate-spin" />
                        </div>
                      ) : Array.isArray(userItems) && userItems.length > 0 ? (
                        userItems.map((item: any) => (
                          <SelectItem key={item.id} value={item.id.toString()}>
                            {item.title}
                          </SelectItem>
                        ))
                      ) : (
                        <div className="p-2 text-sm text-gray-500">
                          Heç bir əşyanız yoxdur. Əvvəlcə bir əşya əlavə edin.
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mesaj</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Əşya sahibinə göndərmək istədiyiniz mesaj"
                      className="resize-none"
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter className="mt-6">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleClose}
              >
                İmtina et
              </Button>
              <Button 
                type="submit" 
                className="bg-[#367BF5]"
                disabled={offerMutation.isPending}
              >
                {offerMutation.isPending ? "Göndərilir..." : "Təklif göndər"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}