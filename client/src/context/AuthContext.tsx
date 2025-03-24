import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { apiRequest } from "@/lib/queryClient";
import { User } from "@shared/schema";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<User>;
  register: (userData: Partial<User>) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<User | null>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = async (): Promise<User | null> => {
    console.log('AuthContext: Fetching current user data');
    
    try {
      // Enhanced request with debug options - using the new auth service endpoint
      const res = await fetch('/api/user', {
        credentials: 'include',
        cache: 'no-cache',
        mode: 'cors',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      // Debug the response headers
      console.log('AuthContext: /api/user response', {
        status: res.status,
        statusText: res.statusText,
        headers: Array.from(res.headers.entries()),
        url: res.url
      });
      
      if (!res.ok) {
        if (res.status === 401) {
          // This is expected for logged out users
          console.log('AuthContext: User not authenticated (401)');
          return null;
        }
        
        // Other errors should be logged
        const errorText = await res.text();
        console.error(`AuthContext: Error ${res.status} fetching user:`, errorText);
        return null;
      }
      
      const userData = await res.json();
      console.log('AuthContext: User data fetched successfully:', userData);
      
      // Validate user data
      if (!userData || !userData.id || !userData.username) {
        console.error('AuthContext: Invalid user data received:', userData);
        return null;
      }
      
      return userData;
    } catch (error) {
      console.error('AuthContext: Error fetching user:', error);
      return null;
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      
      try {
        const userData = await fetchUser();
        if (userData) {
          setUser(userData);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (username: string, password: string): Promise<User> => {
    console.log('AuthContext: Attempting login for user:', username);
    
    try {
      // Ensure credentials are included with the request - use new API endpoint
      const res = await apiRequest('POST', '/api/login', { username, password });
      
      // Parse response
      const userData = await res.json();
      console.log('AuthContext: Login successful, user data received:', userData);
      
      // Check if the response contains the expected user data
      if (!userData || !userData.id || !userData.username) {
        console.error('AuthContext: Invalid user data received:', userData);
        throw new Error('Invalid user data received');
      }
      
      // Store user data in state
      setUser(userData);
      
      // Immediately verify if the session was properly set by doing an auth check
      try {
        await fetchUser();
        console.log('AuthContext: Session verification successful');
      } catch (verifyError) {
        console.error('AuthContext: Session verification failed:', verifyError);
        // Continue anyway since we already have the user data
      }
      
      return userData;
    } catch (error) {
      console.error('AuthContext: Login failed:', error);
      throw error;
    }
  };

  const register = async (userData: Partial<User>): Promise<User> => {
    const res = await apiRequest('POST', '/api/register', userData);
    const newUser = await res.json();
    setUser(newUser);
    return newUser;
  };

  const logout = async (): Promise<void> => {
    await apiRequest('POST', '/api/logout', {});
    setUser(null);
  };

  const refreshUser = async (): Promise<User | null> => {
    const userData = await fetchUser();
    if (userData) {
      setUser(userData);
    }
    return userData;
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
