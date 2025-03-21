import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Send, ChevronLeft, AlertTriangle, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "../../context/AuthContext";
import { useWebSocket } from "../../hooks/useWebSocket";
import { apiRequest } from "@/lib/queryClient";
import { MessageWithSender, ConversationWithParticipants } from "@shared/schema";

interface ChatBoxProps {
  conversationId: number | null;
  onBack?: () => void;
  className?: string;
}

export default function ChatBox({ conversationId, onBack, className = "" }: ChatBoxProps) {
  const [, params] = useRoute("/messages/:id");
  const activeId = conversationId || (params ? parseInt(params.id) : null);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [newMessage, setNewMessage] = useState("");
  
  // WebSocket for real-time messaging
  const { messages: wsMessages, sendMessage } = useWebSocket();
  
  // Get conversation and messages
  const { data, isLoading, error } = useQuery<{
    conversation: ConversationWithParticipants;
    messages: MessageWithSender[];
  }>({
    queryKey: [`/api/conversations/${activeId}`],
    enabled: !!activeId,
  });
  
  // Mark messages as read mutation
  const markReadMutation = useMutation({
    mutationFn: async () => {
      if (!activeId) return;
      return apiRequest('POST', '/api/messages/mark-read', { conversationId: activeId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/count'] });
    },
  });
  
  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      if (!activeId) return;
      return apiRequest('POST', '/api/messages', { 
        conversationId: activeId,
        content: message 
      });
    },
    onSuccess: (_, variables) => {
      setNewMessage("");
      
      // We could wait for the WebSocket message, but let's update optimistically
      queryClient.invalidateQueries({ queryKey: [`/api/conversations/${activeId}`] });
      
      // Also try to send via WebSocket for real-time updates
      if (activeId) {
        sendMessage({
          type: 'message',
          conversationId: activeId,
          content: variables
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Failed to send message",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [data?.messages]);
  
  // Mark messages as read when conversation opens
  useEffect(() => {
    if (activeId) {
      markReadMutation.mutate();
    }
  }, [activeId]);
  
  // Process WebSocket messages
  useEffect(() => {
    if (wsMessages.length > 0) {
      const lastMessage = wsMessages[wsMessages.length - 1];
      
      if (lastMessage.type === 'message' && 
          lastMessage.message.conversationId === activeId) {
        // Real-time message for current conversation
        queryClient.invalidateQueries({ 
          queryKey: [`/api/conversations/${activeId}`] 
        });
        
        // Mark as read immediately
        markReadMutation.mutate();
      }
    }
  }, [wsMessages, activeId, queryClient]);
  
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    sendMessageMutation.mutate(newMessage);
  };
  
  // Format date for messages
  const formatMessageTime = (date: Date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Format conversation date
  const formatConversationDate = (date: Date) => {
    const messageDate = new Date(date);
    return messageDate.toLocaleDateString();
  };
  
  // Show appropriate UI based on state
  if (isLoading) {
    return (
      <div className={`flex flex-col items-center justify-center h-full ${className}`}>
        <div className="w-8 h-8 border-4 border-t-blue-600 border-b-orange-500 border-l-blue-300 border-r-orange-300 rounded-full animate-spin mb-2"></div>
        <p className="text-sm text-gray-500">Loading conversation...</p>
      </div>
    );
  }
  
  if (error || !data) {
    return (
      <div className={`flex flex-col items-center justify-center h-full ${className}`}>
        <AlertTriangle className="h-12 w-12 text-orange-500 mb-2" />
        <h3 className="text-lg font-semibold mb-1">Conversation not found</h3>
        <p className="text-sm text-gray-500 mb-4">This conversation may have been deleted or doesn't exist.</p>
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Conversations
          </Button>
        )}
      </div>
    );
  }
  
  if (!activeId) {
    return (
      <div className={`flex flex-col items-center justify-center h-full ${className}`}>
        <MessageSquare className="h-12 w-12 text-gray-300 mb-2" />
        <h3 className="text-lg font-semibold mb-1">No Conversation Selected</h3>
        <p className="text-sm text-gray-500">Select a conversation to start messaging</p>
      </div>
    );
  }
  
  const { conversation, messages } = data;
  const otherUser = conversation.otherParticipant;
  
  if (!otherUser) {
    return (
      <div className={`flex flex-col items-center justify-center h-full ${className}`}>
        <AlertTriangle className="h-12 w-12 text-orange-500 mb-2" />
        <h3 className="text-lg font-semibold mb-1">Invalid Conversation</h3>
        <p className="text-sm text-gray-500">This conversation is missing a participant.</p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Chat header */}
      <div className="p-3 border-b flex items-center">
        {onBack && (
          <Button variant="ghost" size="icon" className="mr-2 md:hidden" onClick={onBack}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
        )}
        
        <Avatar className="h-10 w-10 mr-3">
          <AvatarImage 
            src={otherUser.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(otherUser.fullName || otherUser.username)}`} 
            alt={otherUser.username} 
          />
          <AvatarFallback>{otherUser.username[0].toUpperCase()}</AvatarFallback>
        </Avatar>
        
        <div className="flex-1">
          <h3 className="font-semibold">{otherUser.fullName || otherUser.username}</h3>
          <p className="text-xs text-gray-500">@{otherUser.username}</p>
        </div>
      </div>
      
      {/* Item reference if available */}
      {conversation.item && (
        <div className="p-2 border-b bg-gray-50 flex items-center text-sm">
          <Package className="h-4 w-4 mr-2 text-gray-500" />
          <span>Regarding: </span>
          <a href={`/items/${conversation.item.id}`} className="ml-1 text-blue-600 hover:underline">
            {conversation.item.title}
          </a>
        </div>
      )}
      
      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4">
            <p className="text-gray-500 mb-1">No messages yet</p>
            <p className="text-sm text-gray-400">Start the conversation by sending a message</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Show conversation start date */}
            <div className="flex justify-center">
              <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                Conversation started {formatConversationDate(new Date(conversation.createdAt))}
              </span>
            </div>
            
            {messages.map((message, index) => {
              const isCurrentUser = message.sender.id === user?.id;
              
              // Add day separator if needed
              let dayHeader = null;
              if (index > 0) {
                const prevDate = new Date(messages[index - 1].createdAt);
                const currentDate = new Date(message.createdAt);
                
                if (prevDate.toDateString() !== currentDate.toDateString()) {
                  dayHeader = (
                    <div className="flex justify-center my-4">
                      <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                        {currentDate.toLocaleDateString()}
                      </span>
                    </div>
                  );
                }
              }
              
              return (
                <div key={message.id}>
                  {dayHeader}
                  <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] ${isCurrentUser ? 'order-2' : 'order-1'}`}>
                      {!isCurrentUser && (
                        <div className="flex items-center mb-1 gap-1">
                          <Avatar className="h-6 w-6">
                            <AvatarImage 
                              src={message.sender.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(message.sender.fullName || message.sender.username)}`} 
                              alt={message.sender.username} 
                            />
                            <AvatarFallback>{message.sender.username[0].toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">{message.sender.username}</span>
                        </div>
                      )}
                      
                      <div 
                        className={`px-4 py-2 rounded-lg ${
                          isCurrentUser 
                            ? 'bg-blue-600 text-white rounded-tr-none' 
                            : 'bg-gray-100 text-gray-800 rounded-tl-none'
                        }`}
                      >
                        <p className="whitespace-pre-line">{message.content}</p>
                      </div>
                      
                      <div className={`text-xs text-gray-500 mt-1 ${isCurrentUser ? 'text-right' : 'text-left'}`}>
                        {formatMessageTime(new Date(message.createdAt))}
                        {isCurrentUser && (
                          <span className="ml-1">
                            {message.status === 'read' ? '• Read' : '• Sent'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>
      
      {/* Message input */}
      <Separator />
      <form onSubmit={handleSendMessage} className="p-3 flex items-center gap-2">
        <Input
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="flex-1"
        />
        <Button 
          type="submit" 
          size="icon"
          disabled={!newMessage.trim() || sendMessageMutation.isPending}
        >
          <Send className="h-5 w-5" />
        </Button>
      </form>
    </div>
  );
}

// Add MessageSquare since it was missing in the imports
function MessageSquare(props: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={props.className}
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
