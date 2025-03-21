import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  User,
  Calendar,
  RefreshCw,
  Plus,
  Heart,
  Share,
  MessageSquare,
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { getQueryFn } from "@/lib/queryClient";
import OfferCard from "@/components/items/offer-card";
import { formatDistance } from "date-fns";
import { azLocale } from "@/lib/utils";

// Image gallery component
function ImageGallery({ images }: { images: {id: number, url: string}[] }) {
  const [mainImage, setMainImage] = useState(images[0]?.url || "");

  return (
    <div className="flex flex-col gap-4">
      <div className="aspect-[4/3] rounded-lg overflow-hidden bg-gray-100">
        <img
          src={mainImage || "/placeholder-image.jpg"}
          alt="Əşya şəkli"
          className="w-full h-full object-contain"
        />
      </div>
      <div className="grid grid-cols-6 gap-2">
        {images.map((image) => (
          <div
            key={image.id}
            className={`aspect-square rounded-md overflow-hidden cursor-pointer border-2 ${
              mainImage === image.url
                ? "border-[#367BF5]"
                : "border-transparent"
            }`}
            onClick={() => setMainImage(image.url)}
          >
            <img
              src={image.url}
              alt="Kiçik şəkil"
              className="w-full h-full object-cover"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// Status badge component
function StatusBadge({ status }: { status: string }) {
  const statusConfig = {
    active: {
      label: "Aktiv",
      color: "bg-green-100 text-green-800",
    },
    pending: {
      label: "Gözləmədə",
      color: "bg-yellow-100 text-yellow-800",
    },
    completed: {
      label: "Tamamlanıb",
      color: "bg-blue-100 text-blue-800",
    },
    inactive: {
      label: "Deaktiv",
      color: "bg-gray-100 text-gray-800",
    },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;

  return (
    <Badge className={`${config.color} rounded-md font-normal`}>
      {config.label}
    </Badge>
  );
}

export default function ItemDetails() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated, user } = useAuth();
  const [activeTab, setActiveTab] = useState("details");
  const [showOfferModal, setShowOfferModal] = useState(false);
  
  // Fetch item details
  const { data: item, isLoading } = useQuery({
    queryKey: [`/api/items/${id}`],
    queryFn: getQueryFn({
      on401: "throw",
    }),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 flex justify-center items-center min-h-[60vh]">
        <div className="flex flex-col items-center">
          <RefreshCw className="w-10 h-10 text-[#367BF5] animate-spin" />
          <p className="mt-4 text-gray-500">Məlumatlar yüklənir...</p>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="container mx-auto p-4 flex justify-center items-center min-h-[60vh]">
        <div className="flex flex-col items-center">
          <p className="text-lg font-medium">Əşya tapılmadı</p>
          <p className="mt-2 text-gray-500">
            Axtardığınız əşya artıq mövcud deyil və ya silinmiş ola bilər
          </p>
        </div>
      </div>
    );
  }

  const isOwner = user?.id === item.owner.id;
  const formattedDate = item.createdAt 
    ? formatDistance(new Date(item.createdAt), new Date(), { 
        addSuffix: true,
        locale: azLocale
      }) 
    : '';

  return (
    <div className="container mx-auto p-4 pb-16">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Left column - Gallery and Offers */}
        <div className="w-full md:w-7/12">
          <ImageGallery images={item.images || []} />

          {/* Only show offers section if user is not the owner */}
          {!isOwner && item.status === "active" && (
            <div className="mt-8">
              <h2 className="text-xl font-bold mb-4">Təklif et və ya alış et</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Sample offer card (left side) - based on your image */}
                <OfferCard 
                  mode="received"
                  offer={{
                    id: 1,
                    title: "New Nike SB dunk low x supreme in LA for sale",
                    imageUrl: "/placeholder-image.jpg", // Replace with actual item image
                    location: "California",
                    value: "$350",
                    userName: "Danny"
                  }}
                />
                
                {/* Make an offer card (right side) */}
                <OfferCard 
                  mode="sent"
                  offer={{
                    id: 2,
                    title: "Təklif et",
                    imageUrl: "", // Placeholder, will show plus icon instead
                    location: "Your location",
                    value: "Your offer",
                  }}
                  onMakeOffer={() => setShowOfferModal(true)}
                />
              </div>
            </div>
          )}

          {/* Tabs for details/specifications */}
          <div className="mt-8">
            <Tabs 
              defaultValue="details" 
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="details">Ətraflı məlumat</TabsTrigger>
                <TabsTrigger value="specifications">Xüsusiyyətlər</TabsTrigger>
              </TabsList>
              <TabsContent value="details" className="p-4 border rounded-lg mt-4">
                <div className="prose max-w-none">
                  <p>{item.description}</p>
                </div>
              </TabsContent>
              <TabsContent value="specifications" className="p-4 border rounded-lg mt-4">
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <span className="font-medium w-36">Kateqoriya:</span>
                    <span className="text-gray-700">{item.category}</span>
                  </li>
                  {item.subcategory && (
                    <li className="flex items-start">
                      <span className="font-medium w-36">Alt kateqoriya:</span>
                      <span className="text-gray-700">{item.subcategory}</span>
                    </li>
                  )}
                  <li className="flex items-start">
                    <span className="font-medium w-36">İstədiyiniz nə:</span>
                    <span className="text-gray-700">{item.wantedExchange}</span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-medium w-36">Status:</span>
                    <StatusBadge status={item.status} />
                  </li>
                </ul>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Right column - Item info */}
        <div className="w-full md:w-5/12">
          <div className="bg-white rounded-xl border p-6 sticky top-4">
            <div className="flex items-center justify-between">
              <StatusBadge status={item.status} />
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="rounded-full" 
                  aria-label="Share"
                >
                  <Share className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="rounded-full" 
                  aria-label="Favorite"
                >
                  <Heart className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <h1 className="text-2xl font-bold mt-4">{item.title}</h1>

            <div className="flex items-center mt-4 text-gray-500">
              <MapPin className="h-4 w-4 mr-1" />
              <span>{item.location}</span>
            </div>

            <div className="flex items-center mt-2 text-gray-500">
              <Calendar className="h-4 w-4 mr-1" />
              <span>{formattedDate}</span>
            </div>

            <Separator className="my-6" />

            <div className="flex items-start">
              <Avatar className="h-10 w-10 mr-3">
                <AvatarImage
                  src={item.owner.avatar || ""}
                  alt={item.owner.username}
                />
                <AvatarFallback className="bg-[#367BF5]/10 text-[#367BF5]">
                  {item.owner.fullName?.charAt(0) || item.owner.username.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{item.owner.fullName || item.owner.username}</p>
                <p className="text-sm text-gray-500">{item.owner.city || ""}</p>
              </div>
            </div>

            <Separator className="my-6" />

            <div className="mb-6">
              <h2 className="font-semibold mb-2">Nə istəyir?</h2>
              <p className="text-gray-700 bg-[#F9FAFB] p-3 rounded-lg">
                {item.wantedExchange}
              </p>
            </div>

            {!isOwner && item.status === "active" ? (
              <div className="grid grid-cols-2 gap-3">
                <Button className="bg-[#367BF5]">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Mesaj göndər
                </Button>
                <Button 
                  className="bg-[#8B5CF6]"
                  onClick={() => setShowOfferModal(true)}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Təklif et
                </Button>
              </div>
            ) : isOwner ? (
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline">
                  <User className="h-4 w-4 mr-2" />
                  Düzəliş et
                </Button>
                <Button 
                  variant="outline"
                  className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                >
                  Deaktiv et
                </Button>
              </div>
            ) : (
              <Button 
                variant="outline" 
                className="w-full" 
                disabled
              >
                Bu əşya aktiv deyil
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Offer Modal would be placed here */}
      {showOfferModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">Təklif et</h2>
              {/* Modal content would go here */}
              <div className="mt-4 flex justify-end">
                <Button 
                  variant="outline" 
                  className="mr-2"
                  onClick={() => setShowOfferModal(false)}
                >
                  İmtina et
                </Button>
                <Button className="bg-[#367BF5]">
                  Təklifimi göndər
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}