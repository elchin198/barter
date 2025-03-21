import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema } from "@shared/schema";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";

// Extend schema to include password confirmation
const registerSchema = insertUserSchema.extend({
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Şifrələr uyğun gəlmir",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function Register() {
  const { register, login, isLoading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      fullName: "",
      phone: null,
      city: null,
      avatar: null,
    },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    try {
      // Remove confirmPassword before sending to API
      const { confirmPassword, ...userData } = data;
      
      // Register the user and get the user data
      const userRegistered = await register(userData);
      
      // If registration is successful, login with same credentials
      try {
        await login({
          username: userData.username,
          password: userData.password
        });
        
        toast({
          title: "Hesabınız yaradıldı",
          description: "Barter.az-a xoş gəlmisiniz!",
        });
        
        // Redirect to home page instead of login page
        setLocation("/");
      } catch (loginError: any) {
        // If login fails after registration, still show success but redirect to login
        toast({
          title: "Hesabınız yaradıldı",
          description: "Zəhmət olmasa daxil olun",
        });
        setLocation("/login");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Xəta baş verdi",
        description: error.message || "Qeydiyyat zamanı xəta baş verdi. Yenidən cəhd edin.",
      });
    }
  };

  return (
    <div className="container max-w-md mx-auto py-10 px-4">
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Qeydiyyat</CardTitle>
          <CardDescription>
            Barter.az-da hesab yaradın
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ad və Soyad</FormLabel>
                    <FormControl>
                      <Input placeholder="Ad Soyad" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>İstifadəçi adı</FormLabel>
                    <FormControl>
                      <Input placeholder="istifadəçi_adı" {...field} />
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
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="email@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Şifrə</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Şifrənin təkrarı</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
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
                    <FormLabel>Telefon (istəyə bağlı)</FormLabel>
                    <FormControl>
                      <Input placeholder="+994 XX XXX XX XX" value={field.value || ""} onChange={field.onChange} onBlur={field.onBlur} ref={field.ref} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Şəhər (istəyə bağlı)</FormLabel>
                    <FormControl>
                      <Input placeholder="Bakı" value={field.value || ""} onChange={field.onChange} onBlur={field.onBlur} ref={field.ref} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Qeydiyyatdan keçirilir..." : "Qeydiyyatdan keç"}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <div className="text-sm text-center">
            Artıq hesabınız var?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Daxil olun
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
