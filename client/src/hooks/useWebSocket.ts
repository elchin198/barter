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
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Connect to WebSocket
  useEffect(() => {
    let ws: WebSocket | null = null;

    const connect = () => {
      try {
        if (user && user.id && !socketRef.current) {
          // Use the current server and port for WebSocket connection
          const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
          const host = window.location.host; 
          const wsUrl = `${protocol}//${host}/api/ws?userId=${user.id}`;
          
          console.log('Connecting to WebSocket:', wsUrl);
          
          // Use the browser's WebSocket implementation
          ws = new WebSocket(wsUrl);
          socketRef.current = ws;

          ws.addEventListener('open', () => {
            setConnected(true);
            console.log('WebSocket connected');
          });

          ws.addEventListener('message', (event) => {
            try {
              const data = JSON.parse(event.data.toString());
              setMessages(prev => [...prev, data]);
            } catch (err) {
              console.error('Error parsing WebSocket message:', err);
            }
          });

          ws.addEventListener('close', () => {
            setConnected(false);
            socketRef.current = null;
            console.log('WebSocket disconnected');
            
            // Clear any existing reconnect timeout
            if (reconnectTimeoutRef.current) {
              clearTimeout(reconnectTimeoutRef.current);
            }
            
            // Try to reconnect after 5 seconds
            reconnectTimeoutRef.current = setTimeout(() => {
              connect();
              reconnectTimeoutRef.current = null;
            }, 5000);
          });

          ws.addEventListener('error', (error) => {
            console.error('WebSocket error:', error);
          });
        }
      } catch (error) {
        console.error('Failed to connect to WebSocket:', error);
        // Attempt to reconnect
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
          reconnectTimeoutRef.current = null;
        }, 5000);
      }
    };

    connect();

    // Cleanup on unmount
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (ws && socketRef.current) {
        ws.close();
        socketRef.current = null;
      }
    };
  }, [user]);

  // Send message function
  const sendMessage = (data: WebSocketMessage) => {
    if (socketRef.current && connected) {
      try {
        socketRef.current.send(JSON.stringify(data));
        return true;
      } catch (error) {
        console.error('Error sending message:', error);
        return false;
      }
    }
    console.warn('Cannot send message: WebSocket not connected');
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
