import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Search, Filter, SlidersHorizontal, Grid3X3, List } from "lucide-react";
import ItemCard from "@/components/items/ItemCard";
import { Item } from "@shared/schema";

// Kategori seçenekleri
const CATEGORIES = [
  { value: "all", label: "Bütün Kateqoriyalar" },
  { value: "Electronics", label: "Elektronika" },
  { value: "Clothing", label: "Geyim" },
  { value: "Books", label: "Kitablar" },
  { value: "Home & Garden", label: "Ev və Bağça" },
  { value: "Sports", label: "İdman" },
  { value: "Toys", label: "Oyuncaqlar" },
  { value: "Vehicles", label: "Nəqliyyat" },
  { value: "Collectibles", label: "Kolleksiya" },
  { value: "Other", label: "Digər" }
];

export default function ItemsList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [view, setView] = useState<"grid" | "list">("grid");
  
  // Əşyaları yükləmək üçün sorğu
  const { data: items = [], isLoading } = useQuery<Item[]>({
    queryKey: ['/api/items', selectedCategory, searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedCategory && selectedCategory !== "all") {
        params.append('category', selectedCategory);
      }
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      
      const res = await fetch(`/api/items?${params.toString()}`);
      if (!res.ok) throw new Error('Əşyaları yükləmək mümkün olmadı');
      return res.json();
    }
  });
  
  // Axtarış formunu göndərmək
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Axtarış sorğusunu yeniləmək üçün useState state-ini yeniləmək kifayətdir
    // React Query sorğunu avtomatik yeniləyəcək
  };
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold">Bütün Əşyalar</h1>
          <p className="text-gray-600">Burada bütün mövcud əşyaları görə bilərsiniz</p>
        </div>
        
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSearch} className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Əşya axtarın..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="w-full md:w-64">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <div className="flex items-center">
                      <Filter className="mr-2 h-4 w-4" />
                      <SelectValue placeholder="Kateqoriya" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Button type="submit">
                Axtar
              </Button>
            </form>
          </CardContent>
        </Card>
        
        <div className="flex items-center justify-between">
          <p className="text-gray-600">
            {isLoading ? 'Yüklənir...' : `${items.length} əşya tapıldı`}
          </p>
          
          <div className="flex space-x-2">
            <Button
              variant={view === "grid" ? "default" : "outline"}
              size="icon"
              onClick={() => setView("grid")}
              title="Grid görünüşü"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={view === "list" ? "default" : "outline"}
              size="icon"
              onClick={() => setView("list")}
              title="Siyahı görünüşü"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, index) => (
              <Card key={index} className="h-64 animate-pulse">
                <div className="h-full bg-gray-200 rounded-md"></div>
              </Card>
            ))}
          </div>
        ) : items.length === 0 ? (
          <Card className="p-8 text-center">
            <CardTitle className="mb-2">Əşya tapılmadı</CardTitle>
            <CardDescription>
              Seçdiyiniz axtarış meyarlarına uyğun əşya yoxdur. Axtarış parametrlərini dəyişdirməyi yoxlayın.
            </CardDescription>
          </Card>
        ) : (
          <div className={view === "grid" 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" 
            : "flex flex-col space-y-4"
          }>
            {items.map((item) => (
              <ItemCard 
                key={item.id} 
                item={item} 
                showActions={false}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}