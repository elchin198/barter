import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import ConversationList from "../components/messaging/ConversationList";
import ChatBox from "../components/messaging/ChatBox";
import { useAuth } from "../context/AuthContext";
import { MessageSquare } from "lucide-react";

export default function Messages() {
  const { user, isLoading } = useAuth();
  const [, params] = useRoute<{ id: string }>("/messages/:id");
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");
  
  // Check for URL parameter and set selected conversation
  useEffect(() => {
    if (params?.id) {
      const conversationId = parseInt(params.id);
      setSelectedConversationId(conversationId);
      setMobileView("chat");
    }
  }, [params]);
  
  // Handle responsive layout
  useEffect(() => {
    const checkSize = () => {
      if (window.innerWidth >= 768) {
        setMobileView("list"); // Reset mobile view state on desktop
      }
    };
    
    window.addEventListener("resize", checkSize);
    checkSize(); // Check on mount
    
    return () => window.removeEventListener("resize", checkSize);
  }, []);
  
  // Handle mobile back button
  const handleMobileBack = () => {
    setMobileView("list");
    setSelectedConversationId(null);
  };
  
  // Handle selecting a conversation
  const handleSelectConversation = (id: number) => {
    setSelectedConversationId(id);
    setMobileView("chat");
  };
  
  // Show loading state while auth is checking
  if (isLoading) {
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
        <MessageSquare className="h-16 w-16 mx-auto text-gray-300 mb-4" />
        <h1 className="text-2xl font-bold mb-4">Messages</h1>
        <p className="text-gray-600 mb-6">
          Please log in to access your messages.
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
      <h1 className="text-2xl font-bold mb-6">Messages</h1>
      
      <div className="bg-white border rounded-lg shadow-sm overflow-hidden h-[calc(85vh-120px)]">
        <div className="grid md:grid-cols-3 h-full">
          {/* Conversation List - Hide on mobile when viewing chat */}
          <div 
            className={`md:col-span-1 border-r md:block ${
              mobileView === "list" ? "block" : "hidden"
            }`}
          >
            <ConversationList 
              selectedConversationId={selectedConversationId}
              onSelectConversation={handleSelectConversation}
            />
          </div>
          
          {/* Chat Window - Hide on mobile when viewing list */}
          <div 
            className={`md:col-span-2 md:block ${
              mobileView === "chat" ? "block" : "hidden"
            }`}
          >
            <ChatBox 
              conversationId={selectedConversationId}
              onBack={handleMobileBack}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
