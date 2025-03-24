import { apiRequest } from "./queryClient";
import { Item, User, Message, Conversation, Offer, Notification, Favorite, Review, UserWithRating } from "@shared/schema";

// Auth API
export const AuthAPI = {
  login: async (username: string, password: string): Promise<User> => {
    const res = await apiRequest('POST', '/api/auth/login', { username, password });
    return res.json();
  },
  
  register: async (userData: Partial<User>): Promise<User> => {
    const res = await apiRequest('POST', '/api/auth/register', userData);
    return res.json();
  },
  
  logout: async (): Promise<void> => {
    await apiRequest('POST', '/api/auth/logout', {});
  },
  
  getCurrentUser: async (): Promise<User> => {
    const res = await fetch('/api/auth/me', { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to get current user');
    return res.json();
  }
};

// Items API
export const ItemsAPI = {
  getItems: async (params?: { 
    category?: string, 
    search?: string, 
    status?: string, 
    city?: string,
    condition?: string,
    limit?: number, 
    offset?: number
  }): Promise<Item[]> => {
    let url = '/api/items';
    if (params) {
      const queryParams = new URLSearchParams();
      if (params.category) queryParams.append('category', params.category);
      if (params.search) queryParams.append('search', params.search);
      if (params.status) queryParams.append('status', params.status);
      if (params.city) queryParams.append('city', params.city);
      if (params.condition) queryParams.append('condition', params.condition);
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.offset) queryParams.append('offset', params.offset.toString());
      url += `?${queryParams.toString()}`;
    }
    
    const res = await fetch(url, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to get items');
    return res.json();
  },
  
  getItem: async (id: number): Promise<Item> => {
    const res = await fetch(`/api/items/${id}`, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to get item');
    return res.json();
  },
  
  createItem: async (itemData: Partial<Item>): Promise<Item> => {
    const res = await apiRequest('POST', '/api/items', itemData);
    return res.json();
  },
  
  updateItem: async (id: number, itemData: Partial<Item>): Promise<Item> => {
    const res = await apiRequest('PUT', `/api/items/${id}`, itemData);
    return res.json();
  },
  
  deleteItem: async (id: number): Promise<void> => {
    await apiRequest('DELETE', `/api/items/${id}`);
  },
  
  addImage: async (itemId: number, filePath: string, isMain: boolean = false): Promise<any> => {
    const res = await apiRequest('POST', `/api/items/${itemId}/images`, { filePath, isMain });
    return res.json();
  },
  
  setMainImage: async (itemId: number, imageId: number): Promise<void> => {
    await apiRequest('PUT', `/api/items/${itemId}/images/${imageId}/main`);
  },
  
  deleteImage: async (itemId: number, imageId: number): Promise<void> => {
    await apiRequest('DELETE', `/api/items/${itemId}/images/${imageId}`);
  }
};

// Conversations API
export const ConversationsAPI = {
  getConversations: async (): Promise<Conversation[]> => {
    const res = await fetch('/api/conversations', { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to get conversations');
    return res.json();
  },
  
  getConversation: async (id: number): Promise<{ conversation: Conversation, messages: Message[] }> => {
    const res = await fetch(`/api/conversations/${id}`, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to get conversation');
    return res.json();
  },
  
  createConversation: async (otherUserId: number, itemId?: number, message?: string): Promise<Conversation> => {
    const res = await apiRequest('POST', '/api/conversations', { otherUserId, itemId, message });
    return res.json();
  },
  
  sendMessage: async (conversationId: number, content: string): Promise<Message> => {
    const res = await apiRequest('POST', '/api/messages', { conversationId, content });
    return res.json();
  },
  
  markMessagesAsRead: async (conversationId: number): Promise<{ messageIds: number[] }> => {
    const res = await apiRequest('POST', '/api/messages/mark-read', { conversationId });
    return res.json();
  }
};

// Offers API
export const OffersAPI = {
  getOffers: async (status?: string): Promise<Offer[]> => {
    let url = '/api/offers';
    if (status) url += `?status=${status}`;
    
    const res = await fetch(url, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to get offers');
    return res.json();
  },
  
  createOffer: async (toUserId: number, fromItemId: number, toItemId: number): Promise<Offer> => {
    const res = await apiRequest('POST', '/api/offers', { toUserId, fromItemId, toItemId });
    return res.json();
  },
  
  updateOfferStatus: async (id: number, status: string): Promise<Offer> => {
    const res = await apiRequest('PUT', `/api/offers/${id}/status`, { status });
    return res.json();
  }
};

// Notifications API
export const NotificationsAPI = {
  getNotifications: async (includeRead?: boolean): Promise<Notification[]> => {
    let url = '/api/notifications';
    if (includeRead !== undefined) url += `?includeRead=${includeRead}`;
    
    const res = await fetch(url, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to get notifications');
    return res.json();
  },
  
  getNotificationCount: async (): Promise<{ count: number }> => {
    const res = await fetch('/api/notifications/count', { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to get notification count');
    return res.json();
  },
  
  markAsRead: async (id: number): Promise<void> => {
    await apiRequest('POST', `/api/notifications/${id}/read`, {});
  },
  
  markAllAsRead: async (): Promise<void> => {
    await apiRequest('POST', '/api/notifications/read-all', {});
  }
};

// Favorites API
export const FavoritesAPI = {
  getFavorites: async (): Promise<Favorite[]> => {
    const res = await fetch('/api/favorites', { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to get favorites');
    return res.json();
  },
  
  addFavorite: async (itemId: number): Promise<Favorite> => {
    const res = await apiRequest('POST', '/api/favorites', { itemId });
    return res.json();
  },
  
  removeFavorite: async (itemId: number): Promise<void> => {
    await apiRequest('DELETE', `/api/favorites/${itemId}`);
  }
};

// Admin API
export const AdminAPI = {
  // User management
  getUsers: async (search?: string): Promise<User[]> => {
    let url = '/api/admin/users';
    if (search) url += `?search=${encodeURIComponent(search)}`;
    
    const res = await fetch(url, { credentials: 'include' });
    if (!res.ok) {
      if (res.status === 401) throw new Error('Not authenticated');
      if (res.status === 403) throw new Error('Not authorized');
      throw new Error('Failed to get users');
    }
    return res.json();
  },
  
  getUser: async (id: number): Promise<User & { itemsCount: number, averageRating?: number, reviewCount?: number }> => {
    const res = await fetch(`/api/admin/users/${id}`, { credentials: 'include' });
    if (!res.ok) {
      if (res.status === 401) throw new Error('Not authenticated');
      if (res.status === 403) throw new Error('Not authorized');
      throw new Error('Failed to get user');
    }
    return res.json();
  },
  
  updateUserRole: async (id: number, role: 'user' | 'admin'): Promise<User> => {
    const res = await apiRequest('PATCH', `/api/admin/users/${id}/role`, { role });
    return res.json();
  },
  
  updateUserStatus: async (id: number, active: boolean): Promise<User> => {
    const res = await apiRequest('PATCH', `/api/admin/users/${id}/status`, { active });
    return res.json();
  },
  
  deleteUser: async (id: number): Promise<void> => {
    await apiRequest('DELETE', `/api/admin/users/${id}`);
  }
};

// Reviews API
export const ReviewsAPI = {
  getUserReviews: async (userId: number, asReviewer?: boolean): Promise<Review[]> => {
    let url = `/api/users/${userId}/reviews`;
    if (asReviewer !== undefined) url += `?asReviewer=${asReviewer}`;
    
    const res = await fetch(url, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to get user reviews');
    return res.json();
  },
  
  getOfferReviews: async (offerId: number): Promise<Review[]> => {
    const res = await fetch(`/api/offers/${offerId}/reviews`, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to get offer reviews');
    return res.json();
  },
  
  createReview: async (data: { offerId: number, rating: number, comment: string }): Promise<Review> => {
    const res = await apiRequest('POST', '/api/reviews', data);
    return res.json();
  },
  
  canReviewOffer: async (offerId: number): Promise<{ canReview: boolean }> => {
    const res = await fetch(`/api/offers/${offerId}/can-review`, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to check if offer can be reviewed');
    return res.json();
  },
  
  getUserRating: async (userId: number): Promise<UserWithRating> => {
    const res = await fetch(`/api/users/${userId}/rating`, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to get user rating');
    return res.json();
  }
};
