import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, ArrowRight, Star } from "lucide-react";
import { Link } from "wouter";
import ItemCard from "../components/items/ItemCard";
import { useAuth } from "../context/AuthContext";
import { Item } from "@shared/schema";

const CATEGORIES = [
  "Bütün kateqoriyalar",
  "Elektronika",
  "Geyim",
  "Kitablar",
  "Ev və bağ",
  "İdman",
  "Oyuncaqlar",
  "Nəqliyyat",
  "Kolleksiya",
  "Digər"
];

export default function Home() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("Bütün kateqoriyalar");
  
  // Filtered search query
  const { data: items = [], isLoading } = useQuery<(Item & { mainImage?: string })[]>({
    queryKey: ['/api/items'],
  });
  
  // Filter items by search term and category
  const filteredItems = items.filter(item => {
    const matchesSearch = !searchTerm || 
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesCategory = category === "Bütün kateqoriyalar" || item.category === category;
    
    return matchesSearch && matchesCategory;
  });
  
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero section */}
      <section className="bg-gradient-to-r from-blue-600 to-orange-500 rounded-xl p-8 mb-8 text-white">
        <div className="max-w-3xl">
          <h1 className="text-4xl font-bold mb-4">Əşyalarınızı dəyişin, əlaqələr qurun</h1>
          <p className="text-lg mb-6">
            BarterTap.az platforması sizə lazım olmayan əşyaları istədiyiniz şeylərə dəyişmək imkanı verir. 
            Pulsuz barter - istifadəçilər arasında birbaşa mübadilə.
          </p>
          {user ? (
            <Link href="/items/new">
              <Button className="bg-white text-blue-600 hover:bg-gray-100">
                <Plus className="mr-2 h-4 w-4" /> Əşyanızı əlavə edin
              </Button>
            </Link>
          ) : (
            <Link href="/register">
              <Button className="bg-white text-blue-600 hover:bg-gray-100">
                İndi qoşulun
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
                  placeholder="Əşyaları axtar..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border-0 p-0 focus-visible:ring-0"
                />
              </div>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Kateqoriya" />
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
      
      {/* Featured Categories */}
      <section className="mb-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Populyar kateqoriyalar</h2>
          <Link href="/categories" className="text-blue-600 hover:underline flex items-center">
            Hamısını göstər <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {CATEGORIES.slice(1, 7).map((category) => (
            <Link key={category} href={`/items?category=${category}`}>
              <div className="bg-blue-50 rounded-xl p-4 text-center hover:bg-blue-100 transition-colors cursor-pointer h-full flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-3">
                  <Star className="h-6 w-6 text-blue-600" />
                </div>
                <span className="font-medium text-gray-800">{category}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
      
      {/* Items grid */}
      <section>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Mövcud əşyalar</h2>
          <Link href="/items" className="text-blue-600 hover:underline flex items-center">
            Hamısını göstər <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
        
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
            {filteredItems.slice(0, 8).map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-lg text-gray-500">Axtarış kriteriyalarınıza uyğun əşya tapılmadı.</p>
          </div>
        )}
      </section>
      
      {/* How it works section */}
      <section className="mt-16 bg-gradient-to-r from-blue-50 to-orange-50 rounded-xl p-8">
        <h2 className="text-3xl font-bold mb-8 text-center">Barter necə işləyir</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="border-0 shadow-lg">
            <CardContent className="pt-6">
              <div className="rounded-full bg-blue-100 w-12 h-12 flex items-center justify-center mb-4 mx-auto">
                <span className="text-blue-600 font-bold text-xl">1</span>
              </div>
              <h3 className="text-xl font-bold mb-2 text-center">Əşyalarınızı siyahıya əlavə edin</h3>
              <p className="text-gray-600 text-center">
                Artıq istifadə etmədiyiniz əşyaların şəkillərini çəkin və elanlarını yerləşdirin.
              </p>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg">
            <CardContent className="pt-6">
              <div className="rounded-full bg-blue-100 w-12 h-12 flex items-center justify-center mb-4 mx-auto">
                <span className="text-blue-600 font-bold text-xl">2</span>
              </div>
              <h3 className="text-xl font-bold mb-2 text-center">Tapın və təklif edin</h3>
              <p className="text-gray-600 text-center">
                Digər istifadəçilərin əşyalarına baxın və öz əşyalarınızla təklif irəli sürün.
              </p>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg">
            <CardContent className="pt-6">
              <div className="rounded-full bg-blue-100 w-12 h-12 flex items-center justify-center mb-4 mx-auto">
                <span className="text-blue-600 font-bold text-xl">3</span>
              </div>
              <h3 className="text-xl font-bold mb-2 text-center">Mübadilə edin</h3>
              <p className="text-gray-600 text-center">
                Mesajlaşma sistemimiz vasitəsilə digər istifadəçi ilə əlaqə quraraq mübadiləni tamamlayın.
              </p>
            </CardContent>
          </Card>
        </div>
        
        <div className="text-center mt-8">
          <Link href="/how-it-works">
            <Button variant="outline" className="mt-4">
              Daha ətraflı öyrənin
            </Button>
          </Link>
        </div>
      </section>
      
      {/* Testimonials */}
      <section className="mt-16">
        <h2 className="text-3xl font-bold mb-8 text-center">İstifadəçilər nə deyir</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                  <span className="font-bold text-blue-600">AZ</span>
                </div>
                <div>
                  <h4 className="font-bold">Aysel Zamanova</h4>
                  <div className="flex text-yellow-400">
                    <Star className="h-4 w-4 fill-current" />
                    <Star className="h-4 w-4 fill-current" />
                    <Star className="h-4 w-4 fill-current" />
                    <Star className="h-4 w-4 fill-current" />
                    <Star className="h-4 w-4 fill-current" />
                  </div>
                </div>
              </div>
              <p className="text-gray-600">
                "İstifadəsi çox rahatdır. Artıq ehtiyacım olmayan kitabları yeni şeylərə dəyişə bildim. Həqiqətən də faydalı platformadır."
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                  <span className="font-bold text-blue-600">RM</span>
                </div>
                <div>
                  <h4 className="font-bold">Rəşad Məmmədov</h4>
                  <div className="flex text-yellow-400">
                    <Star className="h-4 w-4 fill-current" />
                    <Star className="h-4 w-4 fill-current" />
                    <Star className="h-4 w-4 fill-current" />
                    <Star className="h-4 w-4 fill-current" />
                    <Star className="h-4 w-4 fill-current" />
                  </div>
                </div>
              </div>
              <p className="text-gray-600">
                "Köhnə velosipedimi yeni kompüter aksesuarlarına dəyişdim. Pul xərcləmədən gərəkli əşyalar əldə etmək əla oldu."
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                  <span className="font-bold text-blue-600">SQ</span>
                </div>
                <div>
                  <h4 className="font-bold">Səbinə Quliyeva</h4>
                  <div className="flex text-yellow-400">
                    <Star className="h-4 w-4 fill-current" />
                    <Star className="h-4 w-4 fill-current" />
                    <Star className="h-4 w-4 fill-current" />
                    <Star className="h-4 w-4 fill-current" />
                    <Star className="h-4 w-4 fill-current" />
                  </div>
                </div>
              </div>
              <p className="text-gray-600">
                "BarterTap.az sayəsində uşaqlarım üçün oyuncaq və geyim tapmaq çox asan oldu. Eyni zamanda evdən istifadə etmədiyimiz əşyalardan da qurtulduq."
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
      
      {/* CTA section */}
      <section className="mt-16 bg-blue-600 text-white rounded-xl p-8 text-center">
        <h2 className="text-3xl font-bold mb-4">İndi qoşulun və barterlərə başlayın</h2>
        <p className="text-lg mb-6 max-w-2xl mx-auto">
          Minlərlə istifadəçi artıq pul xərcləmədən ehtiyac duyduqları əşyaları əldə edib. 
          Siz də dəyişim hərəkatına qoşulun!
        </p>
        <Link href="/register">
          <Button className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-3 text-lg">
            Qeydiyyatdan keçin
          </Button>
        </Link>
      </section>
    </div>
  );
}
