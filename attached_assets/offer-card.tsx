import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, MessageSquare, ArrowRightLeft } from "lucide-react";

interface OfferCardProps {
  mode: "received" | "sent";
  offer: {
    id: number;
    title: string;
    imageUrl: string;
    location: string;
    value: string;
    userName?: string;
  };
  onMakeOffer?: () => void;
}

export default function OfferCard({ mode, offer, onMakeOffer }: OfferCardProps) {
  return (
    <Card className="overflow-hidden border border-gray-200">
      <div className="bg-[#F8FAFC] px-4 py-3 border-b border-gray-200 flex justify-between items-center">
        <div className="flex items-center gap-1">
          {mode === "received" ? (
            <>
              <ArrowRightLeft className="h-4 w-4 text-[#367BF5]" />
              <span className="font-medium text-sm">Barter təklifi</span>
            </>
          ) : (
            <>
              <ArrowRightLeft className="h-4 w-4 text-[#367BF5]" />
              <span className="font-medium text-sm">Göndərdiyiniz təklif</span>
            </>
          )}
        </div>
        
        <Badge 
          variant="outline" 
          className="text-xs bg-green-50 text-green-700 border-green-100 hover:bg-green-100"
        >
          Aktiv
        </Badge>
      </div>
      
      <CardContent className="p-4">
        <div className="flex gap-3">
          <div className="flex-shrink-0">
            <div className="w-20 h-20 bg-gray-100 rounded-md overflow-hidden">
              {offer.imageUrl ? (
                <img 
                  src={offer.imageUrl} 
                  alt={offer.title} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <span className="text-xs">Şəkil yoxdur</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm mb-1 truncate">{offer.title}</h3>
            <p className="text-xs text-gray-500 mb-1">{offer.location}</p>
            <p className="text-xs text-gray-700 mb-3">
              <span className="font-medium">İstədiyi: </span>{offer.value}
            </p>
            
            {mode === "received" && offer.userName && (
              <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
                <User className="h-3 w-3" />
                <span>{offer.userName}</span>
              </div>
            )}
            
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline"
                className="text-xs h-8 px-3 w-full"
              >
                <MessageSquare className="h-3 w-3 mr-1" />
                Yazışma
              </Button>
              
              {mode === "received" && onMakeOffer && (
                <Button 
                  size="sm"
                  className="text-xs h-8 px-3 w-full bg-[#367BF5] hover:bg-[#2563EB]"
                  onClick={onMakeOffer}
                >
                  Təklif et
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}