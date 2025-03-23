import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

export type WebSocketMessage = {
  type: string;
  [key: string]: any;
};

export function useWebSocket() {
  const { user } = useAuth();
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<WebSocketMessage[]>([]);
  const socketRef = useRef<WebSocket | null>(null);

  // Connect to WebSocket
  useEffect(() => {
    let ws: WebSocket | null = null;

    const connect = () => {
      if (user && user.id && !socketRef.current) {
        // Use the current server and port for WebSocket connection
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host; 
        const wsUrl = `${protocol}//${host}/api/ws?userId=${user.id}`;
        
        ws = new WebSocket(wsUrl);
        socketRef.current = ws;

        ws.addEventListener('open', () => {
          setConnected(true);
          console.log('WebSocket connected');
        });

        ws.addEventListener('message', (event) => {
          try {
            const data = JSON.parse(event.data);
            setMessages(prev => [...prev, data]);
          } catch (err) {
            console.error('Error parsing WebSocket message:', err);
          }
        });

        ws.addEventListener('close', () => {
          setConnected(false);
          socketRef.current = null;
          console.log('WebSocket disconnected');
          
          // Try to reconnect after 5 seconds
          setTimeout(() => {
            connect();
          }, 5000);
        });

        ws.addEventListener('error', (error) => {
          console.error('WebSocket error:', error);
          ws?.close();
        });
      }
    };

    connect();

    // Cleanup on unmount
    return () => {
      if (ws) {
        ws.close();
        socketRef.current = null;
      }
    };
  }, [user]);

  // Send message function
  const sendMessage = (data: WebSocketMessage) => {
    if (socketRef.current && connected) {
      socketRef.current.send(JSON.stringify(data));
      return true;
    }
    return false;
  };

  // Clear messages function
  const clearMessages = () => {
    setMessages([]);
  };

  return {
    connected,
    messages,
    sendMessage,
    clearMessages
  };
}
