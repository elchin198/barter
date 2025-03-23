import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Link } from "wouter";
import LocationMap, { getCityCoordinates } from "@/components/map/LocationMap";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Search, MapPin, List, Info } from "lucide-react";
import { Item } from "@shared/schema";
import SEO from "@/components/SEO";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { formatRelativeTime } from "@/lib/utils";

interface ItemWithImage extends Item {
  mainImage?: string;
}

export default function Map() {
  const { t } = useTranslation();
  const [selectedCity, setSelectedCity] = useState<string>("Bakı");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filteredItems, setFilteredItems] = useState<ItemWithImage[]>([]);
  const [mapMarkers, setMapMarkers] = useState<Array<{
    id: number;
    position: [number, number];
    title: string;
    city: string;
    imageUrl?: string;
  }>>([]);

  // Fetch items
  const { data: items = [], isLoading } = useQuery<ItemWithImage[]>({
    queryKey: ['/api/items'],
  });

  // Filter items based on search and city
  useEffect(() => {
    if (!items) return;

    const filtered = items.filter(item => {
      const matchesSearch = searchQuery 
        ? item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.description.toLowerCase().includes(searchQuery.toLowerCase())
        : true;
      
      const matchesCity = selectedCity 
        ? item.city === selectedCity
        : true;
      
      return matchesSearch && matchesCity && item.status === 'active';
    });
    
    setFilteredItems(filtered);
  }, [items, searchQuery, selectedCity]);

  // Create map markers from filtered items
  useEffect(() => {
    const markers = filteredItems.map(item => ({
      id: item.id,
      position: getCityCoordinates(item.city || "Bakı"),
      title: item.title,
      city: item.city || "Bakı", 
      imageUrl: item.mainImage
    }));
    
    setMapMarkers(markers);
  }, [filteredItems]);

  return (
    <div className="container mx-auto px-4 py-8">
      <SEO 
        title={t('seo.mapTitle', 'Xəritədə Baxın | BarterTap.az')} 
        description={t('seo.mapDescription', 'Əşyaları xəritədə görün. Sizə yaxın barter imkanlarını tapın.')}
        keywords={t('seo.mapKeywords', 'xəritə, əşyalar, barter, yerləşmə, yaxınlığımdakı əşyalar')}
      />

      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">{t('map.title', 'Xəritədə Baxın')}</h1>
        <p className="text-gray-600">{t('map.subtitle', 'Barter imkanlarını şəhər və yerləşmə üzrə tapın')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <MapPin className="w-5 h-5 mr-2" />
                {t('map.filters')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search Filter */}
              <div className="space-y-2">
                <Label htmlFor="search">{t('map.searchItems')}</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    id="search"
                    placeholder={t('map.searchPlaceholder')}
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {/* City Filter */}
              <div className="space-y-2">
                <Label htmlFor="city">{t('map.selectCity')}</Label>
                <Select
                  value={selectedCity}
                  onValueChange={setSelectedCity}
                >
                  <SelectTrigger id="city">
                    <SelectValue placeholder={t('map.allCities')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Bakı">Bakı</SelectItem>
                    <SelectItem value="Gəncə">Gəncə</SelectItem>
                    <SelectItem value="Sumqayıt">Sumqayıt</SelectItem>
                    <SelectItem value="Şəki">Şəki</SelectItem>
                    <SelectItem value="Lənkəran">Lənkəran</SelectItem>
                    <SelectItem value="Mingəçevir">Mingəçevir</SelectItem>
                    <SelectItem value="Naxçıvan">Naxçıvan</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Status display */}
              <div className="pt-2 border-t border-gray-100">
                <p className="text-sm text-gray-600">
                  {t('map.showingItems', { count: filteredItems.length })}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Map and Items List with Tabs */}
        <div className="lg:col-span-3">
          <Tabs defaultValue="map" className="w-full">
            <TabsList className="mb-4 grid w-full grid-cols-2">
              <TabsTrigger value="map" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {t('map.mapView', 'Xəritə görünüşü')}
              </TabsTrigger>
              <TabsTrigger value="list" className="flex items-center gap-2">
                <List className="h-4 w-4" />
                {t('map.listView', 'Siyahı görünüşü')}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="map" className="mt-0 p-0">
              <Card>
                <CardContent className="p-0 overflow-hidden">
                  <LocationMap 
                    markers={mapMarkers}
                    center={getCityCoordinates(selectedCity)}
                    zoom={selectedCity ? 13 : 8}
                    height="600px"
                    interactive={true}
                  />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="list" className="mt-0">
              <Card>
                <CardContent className="p-4">
                  {isLoading ? (
                    <div className="py-4 text-center">
                      <p>{t('common.loading', 'Yüklənir...')}</p>
                    </div>
                  ) : filteredItems.length === 0 ? (
                    <div className="text-center py-10">
                      <Info className="h-10 w-10 mx-auto text-gray-400 mb-2" />
                      <h3 className="font-medium text-lg mb-1">{t('map.noItemsFound', 'Əşya tapılmadı')}</h3>
                      <p className="text-gray-500">{t('map.tryAdjustingFilters', 'Axtarış parametrlərini dəyişdirməyə çalışın')}</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredItems.map(item => (
                        <Card key={item.id} className="overflow-hidden hover:shadow-md transition-shadow">
                          <Link to={`/items/${item.id}`}>
                            <div className="flex h-full">
                              <div className="w-1/3 bg-gray-100">
                                {item.mainImage ? (
                                  <img 
                                    src={item.mainImage} 
                                    alt={item.title} 
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="h-full flex items-center justify-center">
                                    <span className="text-gray-400 text-sm">{t('items.noImage', 'Şəkil yoxdur')}</span>
                                  </div>
                                )}
                              </div>
                              <div className="w-2/3 p-3">
                                <div className="flex justify-between items-start mb-1">
                                  <h3 className="font-medium line-clamp-1">{item.title}</h3>
                                  <Badge variant="outline" className="ml-2 text-xs">
                                    {item.category}
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-600 line-clamp-2 mb-2">{item.description}</p>
                                <div className="flex items-center text-xs text-gray-500 mt-auto">
                                  <MapPin className="h-3 w-3 mr-1" />
                                  <span>{item.city}</span>
                                  <span className="mx-2">•</span>
                                  <span>{formatRelativeTime(new Date(item.createdAt))}</span>
                                </div>
                              </div>
                            </div>
                          </Link>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}