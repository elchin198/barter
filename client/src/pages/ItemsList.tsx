import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Search, Filter, SlidersHorizontal, Grid3X3, List, 
  SortDesc, MapPin, ArrowUpDown, Tag, Check
} from "lucide-react";
import { 
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from "@/components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import ItemCard from "@/components/items/ItemCard";
import { Item } from "@shared/schema";

// Item tipini genişləndirək
interface ItemWithImage extends Item {
  mainImage?: string;
}
import { useTranslation } from "react-i18next";

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

// Şəhər seçimləri
const CITIES = [
  { value: "all", label: "Bütün Şəhərlər" },
  { value: "Baku", label: "Bakı" },
  { value: "Ganja", label: "Gəncə" },
  { value: "Sumgait", label: "Sumqayıt" },
  { value: "Mingachevir", label: "Mingəçevir" },
  { value: "Shirvan", label: "Şirvan" },
  { value: "Lankaran", label: "Lənkəran" },
  { value: "Nakhchivan", label: "Naxçıvan" },
  { value: "Shaki", label: "Şəki" },
  { value: "Other", label: "Digər" }
];

// Vəziyyət seçimləri
const CONDITIONS = [
  { value: "all", label: "Bütün Vəziyyətlər" },
  { value: "New", label: "Yeni" },
  { value: "Like New", label: "Demək olar Yeni" },
  { value: "Good", label: "Yaxşı" },
  { value: "Fair", label: "Orta" },
  { value: "Poor", label: "Köhnə" }
];

// Sıralama seçimləri
const SORT_OPTIONS = [
  { value: "newest", label: "Ən Yeni" },
  { value: "oldest", label: "Ən Köhnə" },
  { value: "title_asc", label: "Ad (A-Z)" },
  { value: "title_desc", label: "Ad (Z-A)" }
];

export default function ItemsList() {
  const { t } = useTranslation();
  
  // Əsas filtr və görünüş dəyişənləri
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedCity, setSelectedCity] = useState("all");
  const [selectedCondition, setSelectedCondition] = useState("all");
  const [sortOption, setSortOption] = useState("newest");
  const [view, setView] = useState<"grid" | "list">("grid");
  
  // Filtr panelini açmaq/bağlamaq üçün state
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  
  // Aktiv filtrləri izləmək
  const activeFilters = [
    selectedCategory !== "all" && CATEGORIES.find(c => c.value === selectedCategory)?.label,
    selectedCity !== "all" && CITIES.find(c => c.value === selectedCity)?.label,
    selectedCondition !== "all" && CONDITIONS.find(c => c.value === selectedCondition)?.label,
    sortOption !== "newest" && SORT_OPTIONS.find(s => s.value === sortOption)?.label
  ].filter(Boolean);
  
  // Filtrləri sıfırlamaq
  const resetFilters = () => {
    setSelectedCategory("all");
    setSelectedCity("all");
    setSelectedCondition("all");
    setSortOption("newest");
  };
  
  // Konkret bir filtri silmək
  const removeFilter = (filter: string) => {
    const categoryLabel = CATEGORIES.find(c => c.value === selectedCategory)?.label;
    const cityLabel = CITIES.find(c => c.value === selectedCity)?.label;
    const conditionLabel = CONDITIONS.find(c => c.value === selectedCondition)?.label;
    const sortLabel = SORT_OPTIONS.find(s => s.value === sortOption)?.label;
    
    if (filter === categoryLabel) setSelectedCategory("all");
    if (filter === cityLabel) setSelectedCity("all");
    if (filter === conditionLabel) setSelectedCondition("all");
    if (filter === sortLabel) setSortOption("newest");
  };
  
  // Əşyaları yükləmək üçün sorğu
  const { data: items = [], isLoading } = useQuery<ItemWithImage[]>({
    queryKey: ['/api/items', selectedCategory, selectedCity, selectedCondition, sortOption, searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      // Filtrləri əlavə edirik
      if (selectedCategory && selectedCategory !== "all") {
        params.append('category', selectedCategory);
      }
      
      if (selectedCity && selectedCity !== "all") {
        params.append('city', selectedCity);
      }
      
      if (selectedCondition && selectedCondition !== "all") {
        params.append('condition', selectedCondition);
      }
      
      if (sortOption && sortOption !== "newest") {
        params.append('sort', sortOption);
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
              
              <div className="flex gap-2">
                <Sheet open={isFilterSheetOpen} onOpenChange={setIsFilterSheetOpen}>
                  <SheetTrigger asChild>
                    <Button type="button" variant="outline">
                      <SlidersHorizontal className="h-4 w-4 mr-2" />
                      Ətraflı Filtr
                    </Button>
                  </SheetTrigger>
                  <SheetContent className="w-full sm:max-w-md">
                    <SheetHeader>
                      <SheetTitle>Filtrləmə Seçimləri</SheetTitle>
                      <SheetDescription>
                        Əşyaları dəqiq tapmaq üçün ətraflı filtrləmə seçimlərindən istifadə edin.
                      </SheetDescription>
                    </SheetHeader>
                    
                    <div className="py-6 space-y-6">
                      <Accordion type="single" collapsible className="w-full">
                        {/* Kateqoriya Filtri */}
                        <AccordionItem value="category">
                          <AccordionTrigger>
                            <div className="flex items-center">
                              <Tag className="h-4 w-4 mr-2" />
                              Kateqoriya
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <RadioGroup value={selectedCategory} onValueChange={setSelectedCategory}>
                              {CATEGORIES.map((category) => (
                                <div key={category.value} className="flex items-center space-x-2">
                                  <RadioGroupItem value={category.value} id={`category-${category.value}`} />
                                  <Label htmlFor={`category-${category.value}`}>{category.label}</Label>
                                </div>
                              ))}
                            </RadioGroup>
                          </AccordionContent>
                        </AccordionItem>
                        
                        {/* Şəhər Filtri */}
                        <AccordionItem value="city">
                          <AccordionTrigger>
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 mr-2" />
                              Şəhər
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <RadioGroup value={selectedCity} onValueChange={setSelectedCity}>
                              {CITIES.map((city) => (
                                <div key={city.value} className="flex items-center space-x-2">
                                  <RadioGroupItem value={city.value} id={`city-${city.value}`} />
                                  <Label htmlFor={`city-${city.value}`}>{city.label}</Label>
                                </div>
                              ))}
                            </RadioGroup>
                          </AccordionContent>
                        </AccordionItem>
                        
                        {/* Vəziyyət Filtri */}
                        <AccordionItem value="condition">
                          <AccordionTrigger>
                            <div className="flex items-center">
                              <Check className="h-4 w-4 mr-2" />
                              Vəziyyət
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <RadioGroup value={selectedCondition} onValueChange={setSelectedCondition}>
                              {CONDITIONS.map((condition) => (
                                <div key={condition.value} className="flex items-center space-x-2">
                                  <RadioGroupItem value={condition.value} id={`condition-${condition.value}`} />
                                  <Label htmlFor={`condition-${condition.value}`}>{condition.label}</Label>
                                </div>
                              ))}
                            </RadioGroup>
                          </AccordionContent>
                        </AccordionItem>
                        
                        {/* Sıralama Seçimləri */}
                        <AccordionItem value="sort">
                          <AccordionTrigger>
                            <div className="flex items-center">
                              <ArrowUpDown className="h-4 w-4 mr-2" />
                              Sıralama
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <RadioGroup value={sortOption} onValueChange={setSortOption}>
                              {SORT_OPTIONS.map((option) => (
                                <div key={option.value} className="flex items-center space-x-2">
                                  <RadioGroupItem value={option.value} id={`sort-${option.value}`} />
                                  <Label htmlFor={`sort-${option.value}`}>{option.label}</Label>
                                </div>
                              ))}
                            </RadioGroup>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </div>
                    
                    <div className="flex justify-between">
                      <Button variant="outline" onClick={resetFilters}>
                        Filtrləri Sıfırla
                      </Button>
                      <Button onClick={() => setIsFilterSheetOpen(false)}>
                        Tətbiq et
                      </Button>
                    </div>
                  </SheetContent>
                </Sheet>
                
                <Button type="submit">
                  Axtar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
        
        {/* Aktiv filtrlər */}
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm text-gray-500">Aktiv filtrlər:</span>
            {activeFilters.map((filter, index) => (
              <Badge 
                key={index} 
                variant="secondary"
                className="flex items-center gap-1 cursor-pointer"
                onClick={() => removeFilter(filter as string)}
              >
                {filter}
                <button className="font-medium text-xs">&times;</button>
              </Badge>
            ))}
            <Button 
              variant="link" 
              className="text-sm px-2 h-auto" 
              onClick={resetFilters}
            >
              Hamısını sıfırla
            </Button>
          </div>
        )}
        
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
              view === "grid" ? (
                <ItemCard 
                  key={item.id} 
                  item={item} 
                  showActions={false}
                />
              ) : (
                <Card key={item.id} className="overflow-hidden">
                  <div className="flex md:flex-row flex-col">
                    <div className="md:w-1/3 w-full h-[200px] md:h-auto">
                      <div 
                        className="h-full w-full bg-gray-200 relative" 
                        style={{
                          backgroundImage: item.mainImage ? `url(${item.mainImage})` : 'none',
                          backgroundSize: 'cover',
                          backgroundPosition: 'center'
                        }}
                      >
                        {!item.mainImage && (
                          <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                            Şəkil yoxdur
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="md:w-2/3 w-full p-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-xl font-bold mb-2">
                            <Link to={`/items/${item.id}`}>
                              {item.title}
                            </Link>
                          </h3>
                          <div className="flex items-center gap-2 mb-3 flex-wrap">
                            <Badge variant="outline">{item.category}</Badge>
                            {item.city && <Badge variant="outline"><MapPin className="h-3 w-3 mr-1" />{item.city}</Badge>}
                            <Badge variant="outline">{item.condition}</Badge>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link to={`/items/${item.id}`}>
                              Ətraflı Baxın
                            </Link>
                          </Button>
                        </div>
                      </div>
                      <p className="text-gray-600 line-clamp-3 mb-4">
                        {item.description}
                      </p>
                      <div className="flex justify-between items-center">
                        <div className="text-sm text-gray-500">
                          {new Date(item.createdAt).toLocaleDateString('az-AZ')}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              )
            ))}
          </div>
        )}
      </div>
    </div>
  );
}