import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Avatar } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Send, MoreVertical, Phone, Image, Paperclip } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Message {
  id: number;
  content: string;
  senderId: number;
  createdAt: string;
  status: 'sent' | 'delivered' | 'read';
}

interface Conversation {
  id: number;
  itemId: number;
  createdAt: string;
  item: {
    id: number;
    title: string;
    image?: string;
  };
  participants: {
    id: number;
    username: string;
    fullName: string;
    avatar?: string;
  }[];
  lastMessage?: {
    content: string;
    createdAt: string;
  };
}

export default function Messages() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { conversationId } = useParams();
  const [message, setMessage] = useState("");
  const [activeConversation, setActiveConversation] = useState<number | null>(
    conversationId ? parseInt(conversationId) : null
  );

  // Fetch conversations
  const { data: conversations, isLoading: isLoadingConversations } = useQuery({
    queryKey: ["/api/conversations"],
    queryFn: async () => {
      const res = await fetch("/api/conversations");
      if (!res.ok) throw new Error("Söhbətləri yükləmək mümkün olmadı");
      return res.json() as Promise<Conversation[]>;
    },
    enabled: !!user,
  });

  // Fetch messages for active conversation
  const { data: messages, isLoading: isLoadingMessages } = useQuery({
    queryKey: ["/api/conversations", activeConversation, "messages"],
    queryFn: async () => {
      const res = await fetch(`/api/conversations/${activeConversation}/messages`);
      if (!res.ok) throw new Error("Mesajları yükləmək mümkün olmadı");
      return res.json() as Promise<Message[]>;
    },
    enabled: !!activeConversation && !!user,
  });

  // Mark messages as read when conversation changes
  useEffect(() => {
    if (activeConversation && user) {
      apiRequest("POST", `/api/conversations/${activeConversation}/read`).catch((err) => {
        console.error("Failed to mark messages as read:", err);
      });
    }
  }, [activeConversation, user]);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!activeConversation) throw new Error("Aktiv söhbət yoxdur");
      const response = await apiRequest("POST", `/api/conversations/${activeConversation}/messages`, {
        content,
      });
      return await response.json();
    },
    onSuccess: () => {
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["/api/conversations", activeConversation, "messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Mesaj göndərilmədi",
        description: error.message || "Bir xəta baş verdi",
      });
    },
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !sendMessageMutation.isPending) {
      sendMessageMutation.mutate(message);
    }
  };

  const getOtherParticipant = (conversation: Conversation) => {
    return conversation.participants.find((p) => p.id !== user?.id);
  };

  // Format time
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' });
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === now.toDateString()) {
      return 'Bu gün';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Dünən';
    } else {
      return date.toLocaleDateString('az-AZ', { day: 'numeric', month: 'short' });
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Mesajları görmək üçün daxil olun</h2>
          <p className="text-gray-500 mb-6">Mesajlarınızı görmək üçün hesabınıza daxil olmalısınız</p>
          <Link href="/auth">
            <Button className="bg-primary hover:bg-primary/90">Daxil olun</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto py-6 px-4">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Mesajlar</h1>
      
      <div className="bg-white shadow-sm border border-gray-100 rounded-xl overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-3 h-[70vh]">
          {/* Conversations list */}
          <div className="border-r border-gray-100 h-full">
            <Tabs defaultValue="all" className="w-full">
              <div className="border-b border-gray-100 p-3">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="all">Bütün mesajlar</TabsTrigger>
                  <TabsTrigger value="unread">Oxunmamış</TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value="all" className="m-0">
                <ScrollArea className="h-[calc(70vh-53px)]">
                  {isLoadingConversations ? (
                    <div className="flex items-center justify-center h-40">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : conversations && conversations.length > 0 ? (
                    <div className="divide-y divide-gray-100">
                      {conversations.map((conversation) => {
                        const otherParticipant = getOtherParticipant(conversation);
                        return (
                          <div
                            key={conversation.id}
                            className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                              activeConversation === conversation.id ? "bg-gray-50" : ""
                            }`}
                            onClick={() => setActiveConversation(conversation.id)}
                          >
                            <div className="flex items-start gap-3">
                              <Avatar className="h-10 w-10 flex-shrink-0">
                                <img
                                  src={otherParticipant?.avatar || "https://ui-avatars.com/api/?name=" + otherParticipant?.fullName}
                                  alt={otherParticipant?.fullName}
                                />
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start">
                                  <h3 className="font-medium text-gray-900 truncate">
                                    {otherParticipant?.fullName}
                                  </h3>
                                  {conversation.lastMessage && (
                                    <span className="text-xs text-gray-500">
                                      {formatDate(conversation.lastMessage.createdAt)}
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-500 truncate">
                                  {conversation.item.title}
                                </p>
                                {conversation.lastMessage && (
                                  <p className="text-sm text-gray-600 truncate mt-1">
                                    {conversation.lastMessage.content}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-40 p-4">
                      <p className="text-gray-500 mb-4 text-center">Hələ heç bir söhbətiniz yoxdur</p>
                      <Link href="/search">
                        <Button variant="outline" className="border-primary text-primary hover:bg-primary/5">
                          Elanları kəşf edin
                        </Button>
                      </Link>
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
              
              <TabsContent value="unread" className="m-0">
                <ScrollArea className="h-[calc(70vh-53px)]">
                  {isLoadingConversations ? (
                    <div className="flex items-center justify-center h-40">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : conversations && conversations.filter(c => c.lastMessage?.status !== 'read').length > 0 ? (
                    <div className="divide-y divide-gray-100">
                      {conversations
                        .filter(c => c.lastMessage?.status !== 'read')
                        .map((conversation) => {
                          const otherParticipant = getOtherParticipant(conversation);
                          return (
                            <div
                              key={conversation.id}
                              className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                                activeConversation === conversation.id ? "bg-gray-50" : ""
                              }`}
                              onClick={() => setActiveConversation(conversation.id)}
                            >
                              <div className="flex items-start gap-3">
                                <Avatar className="h-10 w-10 flex-shrink-0">
                                  <img
                                    src={otherParticipant?.avatar || "https://ui-avatars.com/api/?name=" + otherParticipant?.fullName}
                                    alt={otherParticipant?.fullName}
                                  />
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <div className="flex justify-between items-start">
                                    <h3 className="font-medium text-gray-900 truncate">
                                      {otherParticipant?.fullName}
                                    </h3>
                                    <Badge variant="default" className="text-xs bg-primary">Yeni</Badge>
                                  </div>
                                  <p className="text-sm text-gray-500 truncate">
                                    {conversation.item.title}
                                  </p>
                                  {conversation.lastMessage && (
                                    <p className="text-sm font-medium text-gray-700 truncate mt-1">
                                      {conversation.lastMessage.content}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-40">
                      <p className="text-gray-500">Oxunmamış mesaj yoxdur</p>
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </div>
          
          {/* Message conversation */}
          <div className="col-span-2 h-full flex flex-col">
            {activeConversation && conversations ? (
              <>
                {/* Conversation header */}
                {(() => {
                  const conversation = conversations.find(c => c.id === activeConversation);
                  if (!conversation) return null;
                  const otherParticipant = getOtherParticipant(conversation);
                  
                  return (
                    <div className="border-b border-gray-100 p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <img
                            src={otherParticipant?.avatar || "https://ui-avatars.com/api/?name=" + otherParticipant?.fullName}
                            alt={otherParticipant?.fullName}
                          />
                        </Avatar>
                        <div>
                          <h3 className="font-medium text-gray-900">{otherParticipant?.fullName}</h3>
                          <p className="text-xs text-gray-500">
                            {conversation.item.title}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-700">
                          <Phone className="h-5 w-5" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-700">
                              <MoreVertical className="h-5 w-5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Söhbət əməliyyatları</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>Profili göstər</DropdownMenuItem>
                            <DropdownMenuItem>Elanı göstər</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">Söhbəti sil</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  );
                })()}
                
                {/* Messages */}
                <ScrollArea className="flex-1 p-4 flex flex-col">
                  {isLoadingMessages ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : messages && messages.length > 0 ? (
                    <div className="flex flex-col gap-3">
                      {messages.map((msg) => {
                        const isCurrentUser = msg.senderId === user?.id;
                        return (
                          <div
                            key={msg.id}
                            className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-[75%] p-3 rounded-lg ${
                                isCurrentUser
                                  ? "bg-primary text-white rounded-tr-none"
                                  : "bg-gray-100 text-gray-800 rounded-tl-none"
                              }`}
                            >
                              <p className="text-sm">{msg.content}</p>
                              <div
                                className={`text-xs mt-1 flex justify-end ${
                                  isCurrentUser ? "text-white/70" : "text-gray-500"
                                }`}
                              >
                                {formatTime(msg.createdAt)}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-gray-500">Söhbətə başlamaq üçün bir mesaj göndərin</p>
                    </div>
                  )}
                </ScrollArea>
                
                {/* Message input */}
                <div className="border-t border-gray-100 p-4">
                  <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <Image className="h-5 w-5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <Paperclip className="h-5 w-5" />
                    </Button>
                    <Input
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Mesajınızı yazın..."
                      className="flex-1"
                    />
                    <Button
                      type="submit"
                      disabled={!message.trim() || sendMessageMutation.isPending}
                      className="bg-primary hover:bg-primary/90"
                    >
                      {sendMessageMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full p-4">
                <div className="rounded-full bg-gray-100 p-6 mb-4">
                  <Send className="h-10 w-10 text-gray-400" />
                </div>
                <h2 className="text-xl font-semibold text-gray-800 mb-2">Mesajlarınız</h2>
                <p className="text-gray-500 text-center max-w-md mb-6">
                  Əşyaları dəyişdirmək istədiyiniz istifadəçilərlə əlaqə saxlayın
                </p>
                <p className="text-gray-400 text-sm">
                  Söhbət etmək üçün sol tərəfdən bir söhbət seçin
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}