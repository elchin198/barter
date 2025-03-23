import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import LocationMap, { getCityCoordinates } from "@/components/map/LocationMap";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Search, MapPin } from "lucide-react";
import { Item } from "@shared/schema";
import SEO from "@/components/SEO";

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

        {/* Map */}
        <div className="lg:col-span-3">
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
        </div>
      </div>
    </div>
  );
}