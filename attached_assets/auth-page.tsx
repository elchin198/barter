import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AtSign, CircleHelp, Lock, Mail, Phone, User } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { insertUserSchema } from "@shared/schema";
import { Redirect } from "wouter";

// Extend the insertUserSchema for the registration form
const registerSchema = insertUserSchema
  .extend({
    confirmPassword: z.string().min(6, "Şifrə ən azı 6 simvol olmalıdır"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Şifrələr uyğun gəlmir",
    path: ["confirmPassword"],
  });

// Login schema for the login form
const loginSchema = z.object({
  username: z.string().min(1, "İstifadəçi adı tələb olunur"),
  password: z.string().min(1, "Şifrə tələb olunur"),
});

type RegisterValues = z.infer<typeof registerSchema>;
type LoginValues = z.infer<typeof loginSchema>;

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const { toast } = useToast();
  const { user, loginMutation, registerMutation } = useAuth();
  
  // Register form
  const registerForm = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
      email: "",
      fullName: "",
      phone: "",
      city: "",
    },
  });
  
  // Login form
  const loginForm = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });
  
  // Handle login submission
  const onLoginSubmit = async (data: LoginValues) => {
    try {
      await loginMutation.mutateAsync(data);
    } catch (error) {
      console.error(error);
    }
  };
  
  // Handle register submission
  const onRegisterSubmit = async (data: RegisterValues) => {
    try {
      // Remove confirmPassword as it's not in the schema
      const { confirmPassword, ...userData } = data;
      await registerMutation.mutateAsync(userData);
    } catch (error) {
      console.error(error);
    }
  };
  
  // If user is already logged in, redirect to home page
  if (user) {
    return <Redirect to="/" />;
  }
  
  return (
    <div className="min-h-screen bg-[#f8fafc] py-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row gap-8 max-w-6xl mx-auto">
          {/* Left column - Auth forms */}
          <div className="w-full lg:w-1/2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
              <Tabs 
                defaultValue="login" 
                value={activeTab} 
                onValueChange={(value) => setActiveTab(value as "login" | "register")}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger 
                    value="login"
                    className="text-base font-medium py-3"
                  >
                    Daxil ol
                  </TabsTrigger>
                  <TabsTrigger 
                    value="register"
                    className="text-base font-medium py-3"
                  >
                    Qeydiyyat
                  </TabsTrigger>
                </TabsList>
                
                {/* Login Tab */}
                <TabsContent value="login">
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                      <FormField
                        control={loginForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>İstifadəçi adı</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input 
                                  placeholder="istifadəçiadı" 
                                  {...field}
                                  className="pl-10" 
                                />
                                <User className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Şifrə</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input 
                                  type="password" 
                                  placeholder="********" 
                                  {...field}
                                  className="pl-10" 
                                />
                                <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button 
                        type="submit" 
                        className="w-full bg-[#367BF5]"
                        disabled={loginMutation.isPending}
                      >
                        {loginMutation.isPending ? "Daxil olunur..." : "Daxil ol"}
                      </Button>
                      
                      <div className="text-center text-sm text-gray-500 mt-4">
                        <span>Hesabınız yoxdur? </span>
                        <Button 
                          variant="link" 
                          className="p-0 text-[#367BF5]"
                          onClick={() => setActiveTab("register")}
                        >
                          Qeydiyyatdan keçin
                        </Button>
                      </div>
                    </form>
                  </Form>
                </TabsContent>
                
                {/* Register Tab */}
                <TabsContent value="register">
                  <Form {...registerForm}>
                    <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                      <FormField
                        control={registerForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>İstifadəçi adı*</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input 
                                  placeholder="istifadəçiadı" 
                                  {...field}
                                  className="pl-10" 
                                />
                                <User className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={registerForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Şifrə*</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input 
                                    type="password" 
                                    placeholder="********" 
                                    {...field}
                                    className="pl-10" 
                                  />
                                  <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={registerForm.control}
                          name="confirmPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Şifrəni təsdiqlə*</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input 
                                    type="password" 
                                    placeholder="********" 
                                    {...field}
                                    className="pl-10" 
                                  />
                                  <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={registerForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email*</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input 
                                  type="email" 
                                  placeholder="adınız@email.com" 
                                  {...field}
                                  className="pl-10" 
                                />
                                <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={registerForm.control}
                        name="fullName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Ad Soyad*</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input 
                                  placeholder="Ad Soyad" 
                                  {...field}
                                  className="pl-10" 
                                />
                                <User className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={registerForm.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Telefon</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input 
                                    placeholder="+994 XX XXX XX XX" 
                                    {...field}
                                    className="pl-10" 
                                  />
                                  <Phone className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={registerForm.control}
                          name="city"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Şəhər</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input 
                                    placeholder="Bakı" 
                                    {...field}
                                    className="pl-10" 
                                  />
                                  <AtSign className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <Button 
                        type="submit" 
                        className="w-full bg-[#367BF5] mt-2"
                        disabled={registerMutation.isPending}
                      >
                        {registerMutation.isPending ? "Qeydiyyatdan keçirilir..." : "Qeydiyyatdan keç"}
                      </Button>
                      
                      <div className="text-center text-sm text-gray-500 mt-4">
                        <span>Artıq hesabınız var? </span>
                        <Button 
                          variant="link" 
                          className="p-0 text-[#367BF5]"
                          onClick={() => setActiveTab("login")}
                        >
                          Daxil olun
                        </Button>
                      </div>
                    </form>
                  </Form>
                </TabsContent>
              </Tabs>
            </div>
          </div>
          
          {/* Right column - Info */}
          <div className="w-full lg:w-1/2">
            <div className="h-full bg-gradient-to-br from-[#367BF5] to-[#2563eb] text-white rounded-xl p-8 flex flex-col">
              <div className="mb-8">
                <h1 className="text-3xl font-bold mb-4">Barter platformasına xoş gəlmisiniz</h1>
                <p className="text-white/80 text-lg">
                  Dünyanın ən böyük şeylər barter resursundan istifadə edərək əşyalarınızı digər istifadəçilərin əşyaları ilə dəyişin.
                </p>
              </div>
              
              <div className="flex-grow">
                <h3 className="text-xl font-semibold mb-4">Platformanın üstünlükləri</h3>
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center mr-3 mt-0.5">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium">Asan istifadə</h4>
                      <p className="text-white/70 text-sm mt-1">
                        Sadə və intuitiv interfeys ilə barter təklifləri yaratmaq və qəbul etmək asan olub.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center mr-3 mt-0.5">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium">Minlərlə kategoriya</h4>
                      <p className="text-white/70 text-sm mt-1">
                        Elektronikadan tutmuş məişət əşyalarına qədər - nə axtarsanız, bizim platformada tapa bilərsiniz.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center mr-3 mt-0.5">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                        <circle cx="9" cy="7" r="4"></circle>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium">Güvenli cəmiyyət</h4>
                      <p className="text-white/70 text-sm mt-1">
                        Reytinq və şərh sistemi sayəsində etibarlı istifadəçilərlə barter edin.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
