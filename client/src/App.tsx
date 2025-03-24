import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Unauthorized from "@/pages/unauthorized";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import ItemDetail from "@/pages/ItemDetail";
import ItemListing from "@/pages/ItemListing";
import ItemsList from "@/pages/ItemsList";
import Profile from "@/pages/Profile";
import Messages from "@/pages/Messages";
import Notifications from "@/pages/Notifications";
import Offers from "@/pages/Offers";
import HowItWorks from "@/pages/HowItWorks";
import Map from "@/pages/Map";
import { AuthProvider } from "@/context/AuthContext";
import { AdminProvider } from "@/context/AdminContext";
import { ProtectedRoute } from "@/lib/protected-route";
import { AdminProtectedRoute } from "@/components/admin/AdminProtectedRoute";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SEO from "@/components/SEO";
import { I18nextProvider } from "react-i18next";
import i18n from "./i18n";

// Admin pages
import AdminLogin from "@/pages/admin/Login";
import AdminDashboard from "@/pages/admin/Dashboard";
import AdminUsers from "@/pages/admin/Users";
import AdminListings from "@/pages/admin/Listings";
import AdminOffers from "@/pages/admin/Offers";
import AdminStats from "@/pages/admin/Stats";

function Router() {
  const [location] = useLocation();
  
  // Check if we're on an admin page
  const isAdminRoute = location.startsWith('/admin');
  
  // Admin routes don't use the same layout as the main site
  if (isAdminRoute && location !== '/admin/login') {
    return (
      <div className="min-h-screen">
        <SEO title="Admin Panel | BarterTap" noIndex={true} />
        <Switch>
          <Route path="/admin/login" component={AdminLogin} />
          <AdminProtectedRoute path="/admin" component={AdminDashboard} />
          <AdminProtectedRoute path="/admin/dashboard" component={AdminDashboard} />
          <AdminProtectedRoute path="/admin/users" component={AdminUsers} />
          <AdminProtectedRoute path="/admin/listings" component={AdminListings} />
          <AdminProtectedRoute path="/admin/offers" component={AdminOffers} />
          <AdminProtectedRoute path="/admin/stats" component={AdminStats} />
          <Route path="/admin/*" component={NotFound} />
        </Switch>
      </div>
    );
  }
  
  // Regular site routes
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
          <Route path="/admin/login" component={AdminLogin} />
          <ProtectedRoute path="/item/new" component={ItemListing} />
          <ProtectedRoute path="/items/new" component={ItemListing} />
          <Route path="/item/:id" component={ItemDetail} />
          <Route path="/items/:id" component={ItemDetail} />
          <Route path="/items" component={ItemsList} />
          <ProtectedRoute path="/profile" component={Profile} />
          <ProtectedRoute path="/my-items" component={Profile} />
          <ProtectedRoute path="/messages" component={Messages} />
          <ProtectedRoute path="/notifications" component={Notifications} />
          <ProtectedRoute path="/offers" component={Offers} />
          <Route path="/how-it-works" component={HowItWorks} />
          <Route path="/categories" component={ItemsList} />
          <Route path="/search" component={ItemsList} />
          <Route path="/map" component={Map} />
          <Route path="/help" component={HowItWorks} />
          <Route path="/unauthorized" component={Unauthorized} />
          <Route path="/:rest*" component={NotFound} />
        </Switch>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <AdminProvider>
            <Router />
            <Toaster />
          </AdminProvider>
        </AuthProvider>
      </QueryClientProvider>
    </I18nextProvider>
  );
}

export default App;
