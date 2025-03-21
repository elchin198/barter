import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search } from "lucide-react";
import { Link } from "wouter";
import ItemCard from "../components/items/ItemCard";
import { useAuth } from "../context/AuthContext";
import { Item } from "@shared/schema";

const CATEGORIES = [
  "All Categories",
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

export default function Home() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("All Categories");
  
  // Filtered search query
  const { data: items = [], isLoading } = useQuery<(Item & { mainImage?: string })[]>({
    queryKey: ['/api/items'],
  });
  
  // Filter items by search term and category
  const filteredItems = items.filter(item => {
    const matchesSearch = !searchTerm || 
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesCategory = category === "All Categories" || item.category === category;
    
    return matchesSearch && matchesCategory;
  });
  
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero section */}
      <section className="bg-gradient-to-r from-blue-600 to-orange-500 rounded-xl p-8 mb-8 text-white">
        <div className="max-w-3xl">
          <h1 className="text-4xl font-bold mb-4">Exchange Items, Build Connections</h1>
          <p className="text-lg mb-6">
            Barter Exchange lets you trade items you no longer need for things you want. 
            No money involved - just direct exchanges between users.
          </p>
          {user ? (
            <Link href="/items/new">
              <Button className="bg-white text-blue-600 hover:bg-gray-100">
                <Plus className="mr-2 h-4 w-4" /> List Your Item
              </Button>
            </Link>
          ) : (
            <Link href="/register">
              <Button className="bg-white text-blue-600 hover:bg-gray-100">
                Join Now
              </Button>
            </Link>
          )}
        </div>
      </section>
      
      {/* Search and filters */}
      <section className="mb-8">
        <Card className="bg-background">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex items-center border rounded-md px-3 py-2 flex-1">
                <Search className="h-5 w-5 text-gray-400 mr-2" />
                <Input 
                  type="text"
                  placeholder="Search items..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border-0 p-0 focus-visible:ring-0"
                />
              </div>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </section>
      
      {/* Items grid */}
      <section>
        <h2 className="text-2xl font-bold mb-6">Available Items</h2>
        
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Card key={i} className="overflow-hidden">
                <div className="h-48 bg-gray-200 animate-pulse" />
                <CardContent className="p-4">
                  <div className="h-6 bg-gray-200 rounded animate-pulse mb-2" />
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredItems.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-lg text-gray-500">No items found matching your search criteria.</p>
          </div>
        )}
      </section>
      
      {/* How it works section */}
      <section className="mt-16">
        <h2 className="text-2xl font-bold mb-8 text-center">How Bartering Works</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card>
            <CardContent className="pt-6">
              <div className="rounded-full bg-blue-100 w-12 h-12 flex items-center justify-center mb-4 mx-auto">
                <span className="text-blue-600 font-bold text-xl">1</span>
              </div>
              <h3 className="text-xl font-bold mb-2 text-center">List Your Items</h3>
              <p className="text-gray-600 text-center">
                Take photos and create listings for items you no longer need or want.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="rounded-full bg-blue-100 w-12 h-12 flex items-center justify-center mb-4 mx-auto">
                <span className="text-blue-600 font-bold text-xl">2</span>
              </div>
              <h3 className="text-xl font-bold mb-2 text-center">Find & Offer</h3>
              <p className="text-gray-600 text-center">
                Browse items from other users and make offers with your own items.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="rounded-full bg-blue-100 w-12 h-12 flex items-center justify-center mb-4 mx-auto">
                <span className="text-blue-600 font-bold text-xl">3</span>
              </div>
              <h3 className="text-xl font-bold mb-2 text-center">Exchange</h3>
              <p className="text-gray-600 text-center">
                Coordinate with the other user through our messaging system to complete the exchange.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
