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
    try {
      const res = await fetch('/api/auth/me', {
        credentials: 'include'
      });
      
      if (!res.ok) {
        if (res.status !== 401) {
          console.error('Error fetching user:', await res.text());
        }
        return null;
      }
      
      const userData = await res.json();
      return userData;
    } catch (error) {
      console.error('Error fetching user:', error);
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
    const res = await apiRequest('POST', '/api/auth/login', { username, password });
    const userData = await res.json();
    setUser(userData);
    return userData;
  };

  const register = async (userData: Partial<User>): Promise<User> => {
    const res = await apiRequest('POST', '/api/auth/register', userData);
    const newUser = await res.json();
    setUser(newUser);
    return newUser;
  };

  const logout = async (): Promise<void> => {
    await apiRequest('POST', '/api/auth/logout', {});
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
