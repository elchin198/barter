import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "../context/AuthContext";
import NotificationItem from "../components/notifications/NotificationItem";
import { Bell, Check } from "lucide-react";
import { Notification } from "@shared/schema";

export default function Notifications() {
  const { user, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<"all" | "unread">("all");
  const queryClient = useQueryClient();
  
  // Get notifications
  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ['/api/notifications', { includeRead: activeTab === "all" }],
    enabled: !!user,
  });
  
  // Mark all notifications as read mutation
  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('POST', '/api/notifications/read-all', {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/count'] });
    }
  });
  
  // Filter notifications based on active tab
  const filteredNotifications = activeTab === "unread" 
    ? notifications.filter(n => !n.isRead)
    : notifications;
  
  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value as "all" | "unread");
  };
  
  // Mark all as read handler
  const handleMarkAllRead = () => {
    markAllReadMutation.mutate();
  };
  
  // Show loading state while auth is checking
  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center">
        <div className="w-8 h-8 border-4 border-t-blue-600 border-b-orange-500 border-l-blue-300 border-r-orange-300 rounded-full animate-spin"></div>
      </div>
    );
  }
  
  // Redirect if not logged in
  if (!user) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <Bell className="h-16 w-16 mx-auto text-gray-300 mb-4" />
        <h1 className="text-2xl font-bold mb-4">Notifications</h1>
        <p className="text-gray-600 mb-6">
          Please log in to access your notifications.
        </p>
        <a 
          href="/login" 
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Log In
        </a>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Notifications</h1>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleMarkAllRead}
          disabled={markAllReadMutation.isPending || filteredNotifications.every(n => n.isRead)}
        >
          <Check className="mr-2 h-4 w-4" />
          Mark All as Read
        </Button>
      </div>
      
      <Tabs defaultValue="all" onValueChange={handleTabChange}>
        <TabsList className="mb-6">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unread">Unread</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="space-y-4">
          <NotificationsContent 
            notifications={notifications} 
            isLoading={isLoading}
            emptyMessage="You don't have any notifications yet."
          />
        </TabsContent>
        
        <TabsContent value="unread" className="space-y-4">
          <NotificationsContent 
            notifications={filteredNotifications} 
            isLoading={isLoading}
            emptyMessage="You don't have any unread notifications."
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface NotificationsContentProps {
  notifications: Notification[];
  isLoading: boolean;
  emptyMessage: string;
}

function NotificationsContent({ notifications, isLoading, emptyMessage }: NotificationsContentProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-t-blue-600 border-b-orange-500 border-l-blue-300 border-r-orange-300 rounded-full animate-spin"></div>
      </div>
    );
  }
  
  if (notifications.length === 0) {
    return (
      <div className="text-center py-12">
        <Bell className="h-12 w-12 mx-auto text-gray-300 mb-4" />
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    );
  }
  
  return (
    <ScrollArea className="h-[calc(100vh-240px)]">
      <div className="space-y-2">
        {notifications.map((notification) => (
          <NotificationItem key={notification.id} notification={notification} />
        ))}
      </div>
    </ScrollArea>
  );
}
