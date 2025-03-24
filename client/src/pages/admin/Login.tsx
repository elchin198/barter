import { useState } from "react";
import { useLocation } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import SEO from "@/components/SEO";
import { Loader2 } from "lucide-react";

const adminLoginSchema = z.object({
  username: z.string().min(3, {
    message: "Username must be at least 3 characters",
  }),
  password: z.string().min(6, {
    message: "Password must be at least 6 characters",
  }),
});

type AdminLoginFormValues = z.infer<typeof adminLoginSchema>;

export default function AdminLogin() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { login, user } = useAuth();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Redirect if already authenticated
  if (user && user.role === 'admin') {
    navigate('/admin');
    return null;
  }

  const form = useForm<AdminLoginFormValues>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: {
      username: "",
      password: ""
    },
  });

  async function onSubmit(data: AdminLoginFormValues) {
    try {
      setIsLoggingIn(true);
      const user = await login(data.username, data.password);
      
      if (user.role !== 'admin') {
        toast({
          variant: "destructive",
          title: "Access denied",
          description: "You don't have permission to access the admin area."
        });
        setIsLoggingIn(false);
        return;
      }
      
      navigate('/admin');
    } catch (error) {
      let errorMessage = "Failed to login. Please check your credentials.";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: errorMessage
      });
      
      setIsLoggingIn(false);
    }
  }

  return (
    <div className="flex flex-col min-h-screen items-center justify-center px-4">
      <SEO title="Admin Login | BarterTap" noIndex={true} />
      
      <div className="flex flex-col items-center justify-center space-y-2 mb-6">
        <img src="/barter-logo.png" alt="BarterTap" className="w-12 h-12 mb-2" />
        <h1 className="text-3xl font-bold">Admin Panel</h1>
        <p className="text-muted-foreground text-sm">Login to access the administration area</p>
      </div>
      
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t('admin.loginTitle', 'Admin Login')}</CardTitle>
          <CardDescription>
            {t('admin.loginDescription', 'Enter your credentials to access the admin area')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('auth.username', 'Username')}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('auth.username', 'Username')}
                        disabled={isLoggingIn}
                        {...field}
                      />
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
                    <FormLabel>{t('auth.password', 'Password')}</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder={t('auth.password', 'Password')}
                        disabled={isLoggingIn}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full"
                disabled={isLoggingIn}
              >
                {isLoggingIn && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoggingIn
                  ? t('common.processing', 'Processing...')
                  : t('auth.loginToAccount', 'Login to account')}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button variant="link" onClick={() => navigate('/')}>
            {t('common.backToWebsite', 'Back to website')}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}