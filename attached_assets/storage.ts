import { 
  User, InsertUser,
  Item, InsertItem,
  Image, InsertImage,
  Favorite, InsertFavorite,
  Category, InsertCategory,
  Conversation, InsertConversation,
  ConversationParticipant, InsertConversationParticipant,
  Message, InsertMessage
} from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Items
  getItem(id: number): Promise<Item | undefined>;
  getItemsByUserId(userId: number): Promise<Item[]>;
  getItemsByCategory(category: string): Promise<Item[]>;
  getRecentItems(limit: number): Promise<Item[]>;
  searchItems(query: string, category?: string): Promise<Item[]>;
  createItem(item: InsertItem): Promise<Item>;
  updateItemStatus(id: number, status: 'active' | 'pending' | 'completed' | 'inactive'): Promise<Item | undefined>;
  
  // Images
  getImagesByItemId(itemId: number): Promise<Image[]>;
  createImage(image: InsertImage): Promise<Image>;
  
  // Favorites
  getFavoritesByUserId(userId: number): Promise<Favorite[]>;
  isFavorite(userId: number, itemId: number): Promise<boolean>;
  addFavorite(favorite: InsertFavorite): Promise<Favorite>;
  removeFavorite(userId: number, itemId: number): Promise<void>;
  
  // Categories
  getAllCategories(): Promise<Category[]>;
  getCategory(id: number): Promise<Category | undefined>;
  getCategoryByName(name: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  
  // Conversations
  getConversation(id: number): Promise<Conversation | undefined>;
  getConversationByParticipants(userId1: number, userId2: number, itemId: number): Promise<Conversation | undefined>;
  getConversationsByUserId(userId: number): Promise<Conversation[]>;
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  addParticipantToConversation(participant: InsertConversationParticipant): Promise<ConversationParticipant>;
  
  // Messages
  getMessagesByConversationId(conversationId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  updateMessageStatus(id: number, status: 'sent' | 'delivered' | 'read'): Promise<Message | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private items: Map<number, Item>;
  private images: Map<number, Image>;
  private favorites: Map<number, Favorite>;
  private categories: Map<number, Category>;
  private conversations: Map<number, Conversation>;
  private conversationParticipants: Map<number, ConversationParticipant>;
  private messages: Map<number, Message>;
  
  private userIdCounter: number;
  private itemIdCounter: number;
  private imageIdCounter: number;
  private favoriteIdCounter: number;
  private categoryIdCounter: number;
  private conversationIdCounter: number;
  private conversationParticipantIdCounter: number;
  private messageIdCounter: number;

  constructor() {
    this.users = new Map();
    this.items = new Map();
    this.images = new Map();
    this.favorites = new Map();
    this.categories = new Map();
    this.conversations = new Map();
    this.conversationParticipants = new Map();
    this.messages = new Map();
    
    this.userIdCounter = 1;
    this.itemIdCounter = 1;
    this.imageIdCounter = 1;
    this.favoriteIdCounter = 1;
    this.categoryIdCounter = 1;
    this.conversationIdCounter = 1;
    this.conversationParticipantIdCounter = 1;
    this.messageIdCounter = 1;
    
    // Initialize with default categories
    this.initializeCategories();
  }
  
  private initializeCategories() {
    const defaultCategories: InsertCategory[] = [
      { name: 'electronics', displayName: 'Elektronika', icon: 'fas fa-mobile-alt', color: 'blue' },
      { name: 'clothing', displayName: 'Geyim', icon: 'fas fa-tshirt', color: 'orange' },
      { name: 'furniture', displayName: 'Mebel', icon: 'fas fa-couch', color: 'green' },
      { name: 'auto', displayName: 'Avtomobil', icon: 'fas fa-car', color: 'purple' },
      { name: 'realestate', displayName: 'Əmlak', icon: 'fas fa-home', color: 'red' },
      { name: 'sports', displayName: 'İdman', icon: 'fas fa-running', color: 'teal' },
      { name: 'kids', displayName: 'Uşaq əşyaları', icon: 'fas fa-baby', color: 'pink' },
      { name: 'books', displayName: 'Kitablar', icon: 'fas fa-book', color: 'yellow' },
      { name: 'other', displayName: 'Digər', icon: 'fas fa-box', color: 'gray' }
    ];
    
    defaultCategories.forEach(category => {
      this.createCategory(category);
    });
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      user => user.username.toLowerCase() === username.toLowerCase()
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      user => user.email.toLowerCase() === email.toLowerCase()
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const createdAt = new Date();
    const user = { 
      ...insertUser, 
      id, 
      createdAt,
      phone: insertUser.phone || null,
      city: insertUser.city || null,
      avatar: insertUser.avatar || null
    };
    this.users.set(id, user);
    return user;
  }
  
  // Items
  async getItem(id: number): Promise<Item | undefined> {
    return this.items.get(id);
  }
  
  async getItemsByUserId(userId: number): Promise<Item[]> {
    return Array.from(this.items.values()).filter(item => item.userId === userId);
  }
  
  async getItemsByCategory(category: string): Promise<Item[]> {
    return Array.from(this.items.values()).filter(item => item.category === category);
  }
  
  async getRecentItems(limit: number): Promise<Item[]> {
    return Array.from(this.items.values())
      .filter(item => item.status === 'active')
      .sort((a, b) => {
        // Safely handle null createdAt values
        const aTime = a.createdAt ? a.createdAt.getTime() : 0;
        const bTime = b.createdAt ? b.createdAt.getTime() : 0;
        return bTime - aTime;
      })
      .slice(0, limit);
  }
  
  async searchItems(query: string, category?: string): Promise<Item[]> {
    const lowercaseQuery = query.toLowerCase();
    return Array.from(this.items.values())
      .filter(item => {
        const matchesQuery = item.title.toLowerCase().includes(lowercaseQuery) ||
                            item.description.toLowerCase().includes(lowercaseQuery);
        const matchesCategory = !category || item.category === category;
        return matchesQuery && matchesCategory && item.status === 'active';
      });
  }
  
  async createItem(insertItem: InsertItem): Promise<Item> {
    const id = this.itemIdCounter++;
    const createdAt = new Date();
    const item = { 
      ...insertItem, 
      id, 
      createdAt,
      subcategory: insertItem.subcategory || null,
      status: insertItem.status || 'active'
    };
    this.items.set(id, item);
    return item;
  }
  
  async updateItemStatus(id: number, status: 'active' | 'pending' | 'completed' | 'inactive'): Promise<Item | undefined> {
    const item = await this.getItem(id);
    if (!item) return undefined;
    
    const updatedItem: Item = { ...item, status };
    this.items.set(id, updatedItem);
    return updatedItem;
  }
  
  // Images
  async getImagesByItemId(itemId: number): Promise<Image[]> {
    return Array.from(this.images.values()).filter(image => image.itemId === itemId);
  }
  
  async createImage(insertImage: InsertImage): Promise<Image> {
    const id = this.imageIdCounter++;
    const image = { 
      ...insertImage, 
      id,
      isPrimary: insertImage.isPrimary !== undefined ? insertImage.isPrimary : null
    };
    this.images.set(id, image);
    return image;
  }
  
  // Favorites
  async getFavoritesByUserId(userId: number): Promise<Favorite[]> {
    return Array.from(this.favorites.values()).filter(favorite => favorite.userId === userId);
  }
  
  async isFavorite(userId: number, itemId: number): Promise<boolean> {
    return Array.from(this.favorites.values()).some(
      favorite => favorite.userId === userId && favorite.itemId === itemId
    );
  }
  
  async addFavorite(insertFavorite: InsertFavorite): Promise<Favorite> {
    const id = this.favoriteIdCounter++;
    const createdAt = new Date();
    const favorite: Favorite = { ...insertFavorite, id, createdAt };
    this.favorites.set(id, favorite);
    return favorite;
  }
  
  async removeFavorite(userId: number, itemId: number): Promise<void> {
    const favoriteToRemove = Array.from(this.favorites.values()).find(
      favorite => favorite.userId === userId && favorite.itemId === itemId
    );
    
    if (favoriteToRemove) {
      this.favorites.delete(favoriteToRemove.id);
    }
  }
  
  // Categories
  async getAllCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }
  
  async getCategory(id: number): Promise<Category | undefined> {
    return this.categories.get(id);
  }
  
  async getCategoryByName(name: string): Promise<Category | undefined> {
    return Array.from(this.categories.values()).find(
      category => category.name === name
    );
  }
  
  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const id = this.categoryIdCounter++;
    const category: Category = { ...insertCategory, id };
    this.categories.set(id, category);
    return category;
  }
  
  // Conversations
  async getConversation(id: number): Promise<Conversation | undefined> {
    return this.conversations.get(id);
  }
  
  async getConversationByParticipants(userId1: number, userId2: number, itemId: number): Promise<Conversation | undefined> {
    // Find the conversation for this item where both users are participants
    const conversation = Array.from(this.conversations.values()).find(conv => conv.itemId === itemId);
    if (!conversation) return undefined;
    
    // Check if both users are participants
    const participants = Array.from(this.conversationParticipants.values())
      .filter(p => p.conversationId === conversation.id)
      .map(p => p.userId);
    
    if (participants.includes(userId1) && participants.includes(userId2)) {
      return conversation;
    }
    
    return undefined;
  }
  
  async getConversationsByUserId(userId: number): Promise<Conversation[]> {
    // Get all conversation IDs where the user is a participant
    const participantConvIds = Array.from(this.conversationParticipants.values())
      .filter(p => p.userId === userId)
      .map(p => p.conversationId);
    
    // Get the conversations
    return Array.from(this.conversations.values())
      .filter(c => participantConvIds.includes(c.id));
  }
  
  async getConversationParticipants(conversationId: number): Promise<ConversationParticipant[]> {
    return Array.from(this.conversationParticipants.values())
      .filter(p => p.conversationId === conversationId);
  }
  
  async createConversation(insertConversation: InsertConversation): Promise<Conversation> {
    const id = this.conversationIdCounter++;
    const createdAt = new Date();
    const conversation: Conversation = { ...insertConversation, id, createdAt };
    this.conversations.set(id, conversation);
    return conversation;
  }
  
  async addParticipantToConversation(insertParticipant: InsertConversationParticipant): Promise<ConversationParticipant> {
    const id = this.conversationParticipantIdCounter++;
    const participant: ConversationParticipant = { ...insertParticipant, id };
    this.conversationParticipants.set(id, participant);
    return participant;
  }
  
  // Messages
  async getMessagesByConversationId(conversationId: number): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(message => message.conversationId === conversationId)
      .sort((a, b) => {
        // Safely handle null createdAt values
        const aTime = a.createdAt ? a.createdAt.getTime() : 0;
        const bTime = b.createdAt ? b.createdAt.getTime() : 0;
        return aTime - bTime;
      });
  }
  
  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = this.messageIdCounter++;
    const createdAt = new Date();
    const message = { 
      ...insertMessage, 
      id, 
      createdAt,
      status: insertMessage.status || 'sent'
    };
    this.messages.set(id, message);
    return message;
  }
  
  async updateMessageStatus(id: number, status: 'sent' | 'delivered' | 'read'): Promise<Message | undefined> {
    const message = this.messages.get(id);
    if (!message) return undefined;
    
    const updatedMessage: Message = { ...message, status };
    this.messages.set(id, updatedMessage);
    return updatedMessage;
  }
}

export const storage = new MemStorage();