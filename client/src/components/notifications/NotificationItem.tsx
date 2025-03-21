import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Bell, MessageSquare, Tag, Check, Package, Heart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { Notification } from "@shared/schema";

interface NotificationItemProps {
  notification: Notification;
}

export default function NotificationItem({ notification }: NotificationItemProps) {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  
  // Mark notification as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('POST', `/api/notifications/${notification.id}/read`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/count'] });
    }
  });
  
  const handleClick = () => {
    if (!notification.isRead) {
      markAsReadMutation.mutate();
    }
    
    // Navigate based on notification type
    if (notification.type === 'message' && notification.referenceId) {
      navigate(`/messages/${notification.referenceId}`);
    } else if (notification.type === 'offer' && notification.referenceId) {
      navigate(`/profile?tab=offers`);
    } else if (notification.type === 'offer_status' && notification.referenceId) {
      navigate(`/profile?tab=offers`);
    } else if (notification.type === 'favorite' && notification.referenceId) {
      navigate(`/items/${notification.referenceId}`);
    }
  };
  
  // Get notification icon based on type
  const getNotificationIcon = () => {
    switch (notification.type) {
      case 'message':
        return <MessageSquare className="h-5 w-5 text-blue-500" />;
      case 'offer':
        return <Package className="h-5 w-5 text-orange-500" />;
      case 'offer_status':
        return <Check className="h-5 w-5 text-green-500" />;
      case 'favorite':
        return <Heart className="h-5 w-5 text-red-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };
  
  // Format notification date
  const formatDate = (date: Date) => {
    const now = new Date();
    const notificationDate = new Date(date);
    
    // If today, show time
    if (now.toDateString() === notificationDate.toDateString()) {
      return notificationDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // If this year, show month and day
    if (now.getFullYear() === notificationDate.getFullYear()) {
      return notificationDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
    
    // If different year, show full date
    return notificationDate.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <Card className={`mb-3 transition-all ${!notification.isRead ? 'border-l-4 border-l-blue-500' : ''}`}>
      <CardContent className="p-4">
        <div className="flex gap-3">
          <div className="mt-1">{getNotificationIcon()}</div>
          
          <div className="flex-1">
            <div className="flex justify-between items-start gap-2">
              <p className="font-medium">{notification.content}</p>
              <div className="flex flex-col items-end gap-1">
                <span className="text-xs text-gray-500">
                  {formatDate(new Date(notification.createdAt))}
                </span>
                
                {!notification.isRead && (
                  <Badge variant="secondary" className="text-xs">New</Badge>
                )}
              </div>
            </div>
            
            <div className="mt-2">
              <Button variant="outline" size="sm" onClick={handleClick}>
                {notification.type === 'message' ? 'View Message' : 'View Details'}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
