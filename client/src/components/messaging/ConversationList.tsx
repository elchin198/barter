import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useWebSocket } from "../../hooks/useWebSocket";
import { ConversationWithParticipants } from "@shared/schema";

interface ConversationListProps {
  selectedConversationId: number | null;
  onSelectConversation: (id: number) => void;
}

export default function ConversationList({
  selectedConversationId,
  onSelectConversation
}: ConversationListProps) {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  
  // WebSocket for real-time updates
  const { messages: wsMessages } = useWebSocket();
  
  // Query conversations
  const { data: conversations = [], isLoading } = useQuery<ConversationWithParticipants[]>({
    queryKey: ['/api/conversations'],
  });
  
  // Handle WebSocket updates
  useEffect(() => {
    if (wsMessages.length > 0) {
      const lastMessage = wsMessages[wsMessages.length - 1];
      
      if (lastMessage.type === 'message') {
        // Refetch conversations to update the list with new message
        queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
        
        // If we already have the conversation open, refetch the messages
        if (selectedConversationId === lastMessage.message.conversationId) {
          queryClient.invalidateQueries({ 
            queryKey: [`/api/conversations/${selectedConversationId}`] 
          });
        }
      }
    }
  }, [wsMessages, queryClient, selectedConversationId]);
  
  // Filter conversations by search term
  const filteredConversations = conversations.filter(conv => {
    if (!searchTerm) return true;
    
    const otherUser = conv.otherParticipant;
    if (!otherUser) return false;
    
    return (
      otherUser.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (otherUser.fullName && otherUser.fullName.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });
  
  const formatDate = (date: Date) => {
    const now = new Date();
    const messageDate = new Date(date);
    
    if (now.toDateString() === messageDate.toDateString()) {
      // Today, show time
      return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      // Not today, show date
      return messageDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input 
            placeholder="Search conversations..." 
            className="pl-8" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <ScrollArea className="flex-grow">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="w-8 h-8 border-4 border-t-blue-600 border-b-orange-500 border-l-blue-300 border-r-orange-300 rounded-full animate-spin mb-2"></div>
            <p className="text-sm text-gray-500">Loading conversations...</p>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 p-4">
            <p className="text-gray-500 text-sm">No conversations found</p>
          </div>
        ) : (
          <div>
            {filteredConversations.map((conversation) => {
              const otherUser = conversation.otherParticipant;
              if (!otherUser) return null;
              
              return (
                <div 
                  key={conversation.id}
                  className={`p-3 hover:bg-gray-50 cursor-pointer border-b
                    ${selectedConversationId === conversation.id ? 'bg-gray-50' : ''}
                  `}
                  onClick={() => {
                    onSelectConversation(conversation.id);
                    setLocation(`/messages/${conversation.id}`, { replace: true });
                  }}
                >
                  <div className="flex gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage 
                        src={otherUser.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(otherUser.fullName || otherUser.username)}`} 
                        alt={otherUser.username} 
                      />
                      <AvatarFallback>{otherUser.username[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h3 className="font-semibold truncate">{otherUser.fullName || otherUser.username}</h3>
                        {conversation.lastMessage && (
                          <span className="text-xs text-gray-500">
                            {formatDate(new Date(conversation.lastMessage.createdAt))}
                          </span>
                        )}
                      </div>
                      
                      {conversation.lastMessage ? (
                        <div className="flex justify-between">
                          <p className="text-sm text-gray-600 truncate">
                            {conversation.lastMessage.sender.username}: {conversation.lastMessage.content}
                          </p>
                          {conversation.unreadCount > 0 && (
                            <Badge variant="destructive" className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center">
                              {conversation.unreadCount}
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400 italic">No messages yet</p>
                      )}
                      
                      {conversation.item && (
                        <div className="mt-1 text-xs inline-flex items-center bg-gray-100 rounded-md px-2 py-1">
                          <span>Re: {conversation.item.title}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
