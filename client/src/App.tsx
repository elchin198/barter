import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import AuthPage from "@/pages/auth-page";
import CreateItem from "@/pages/create-item";
import Item from "@/pages/item";
import Profile from "@/pages/profile";
import Favorites from "@/pages/favorites";
import Category from "@/pages/category";
import Search from "@/pages/search";
import Messages from "@/pages/messages";
import FAQ from "@/pages/faq";
import HowItWorks from "@/pages/how-it-works";
import { AuthProvider } from "./hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import MobileNavigation from "./components/layout/MobileNavigation";

function Router() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/auth" component={AuthPage} />
          <ProtectedRoute path="/create-item" component={CreateItem} />
          <Route path="/item/:id" component={Item} />
          <Route path="/profile/:id" component={Profile} />
          <ProtectedRoute path="/favorites" component={Favorites} />
          <Route path="/category/:category" component={Category} />
          <Route path="/search" component={Search} />
          <ProtectedRoute path="/messages" component={Messages} />
          <ProtectedRoute path="/messages/:conversationId" component={Messages} />
          <Route path="/how-it-works" component={HowItWorks} />
          <Route path="/faq" component={FAQ} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
      <MobileNavigation />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
