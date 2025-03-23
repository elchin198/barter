import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import ItemDetail from "@/pages/ItemDetail";
import ItemListing from "@/pages/ItemListing";
import ItemsList from "@/pages/ItemsList";
import Profile from "@/pages/Profile";
import Messages from "@/pages/Messages";
import Notifications from "@/pages/Notifications";
import HowItWorks from "@/pages/HowItWorks";
import { AuthProvider } from "@/context/AuthContext";
import { ProtectedRoute } from "@/lib/protected-route";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SEO from "@/components/SEO";

function Router() {
  const [location] = useLocation();
  
  return (
    <div className="min-h-screen flex flex-col">
      {/* Base SEO that will apply to all pages */}
      <SEO pathName={location} />
      
      <Navbar />
      <main className="flex-1">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/login" component={Login} />
          <Route path="/register" component={Register} />
          <ProtectedRoute path="/item/new" component={ItemListing} />
          <ProtectedRoute path="/items/new" component={ItemListing} />
          <Route path="/item/:id" component={ItemDetail} />
          <Route path="/items/:id" component={ItemDetail} />
          <Route path="/items" component={ItemsList} />
          <ProtectedRoute path="/profile" component={Profile} />
          <ProtectedRoute path="/my-items" component={Profile} />
          <ProtectedRoute path="/messages" component={Messages} />
          <ProtectedRoute path="/notifications" component={Notifications} />
          <Route path="/how-it-works" component={HowItWorks} />
          <Route path="/categories" component={ItemsList} />
          <Route path="/search" component={ItemsList} />
          <Route path="/help" component={HowItWorks} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
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
