import {
  users, type User, type InsertUser,
  items, type Item, type InsertItem,
  images, type Image, type InsertImage,
  conversations, type Conversation, type InsertConversation,
  conversationParticipants, type ConversationParticipant, type InsertConversationParticipant,
  messages, type Message, type InsertMessage,
  offers, type Offer, type InsertOffer,
  notifications, type Notification, type InsertNotification,
  favorites, type Favorite, type InsertFavorite,
  pushSubscriptions, type PushSubscription, type InsertPushSubscription,
  reviews, type Review, type InsertReview,
  type ConversationWithParticipants, type MessageWithSender, type UserWithRating, type ReviewWithDetails
} from "@shared/schema";

// Storage interface
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getAllUsers(search?: string): Promise<User[]>; // Added for admin panel
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<InsertUser>): Promise<User | undefined>;
  
  // Item methods
  getItem(id: number): Promise<Item | undefined>;
  getItemsByUser(userId: number): Promise<Item[]>;
  getItems(options?: { 
    category?: string, 
    search?: string, 
    status?: string, 
    city?: string,
    condition?: string,
    sort?: 'newest' | 'oldest' | 'title_asc' | 'title_desc',
    limit?: number, 
    offset?: number 
  }): Promise<Item[]>;
  createItem(item: InsertItem): Promise<Item>;
  updateItem(id: number, data: Partial<InsertItem>): Promise<Item | undefined>;
  deleteItem(id: number): Promise<boolean>;
  
  // Image methods
  getImagesByItem(itemId: number): Promise<Image[]>;
  createImage(image: InsertImage): Promise<Image>;
  setMainImage(imageId: number, itemId: number): Promise<boolean>;
  deleteImage(id: number): Promise<boolean>;
  
  // Conversation methods
  getConversation(id: number): Promise<ConversationWithParticipants | undefined>;
  getConversationByParticipants(userId1: number, userId2: number, itemId?: number): Promise<ConversationWithParticipants | undefined>;
  getConversationsByUser(userId: number): Promise<ConversationWithParticipants[]>;
  createConversation(conversation: InsertConversation, participants: InsertConversationParticipant[]): Promise<Conversation>;
  updateConversationLastMessage(id: number): Promise<boolean>;
  
  // Message methods
  getMessage(id: number): Promise<MessageWithSender | undefined>;
  getMessagesByConversation(conversationId: number): Promise<MessageWithSender[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessagesAsRead(conversationId: number, userId: number): Promise<number[]>;
  
  // Offer methods
  getOffer(id: number): Promise<Offer | undefined>;
  getOffersByUser(userId: number, status?: string): Promise<Offer[]>;
  createOffer(offer: InsertOffer): Promise<Offer>;
  updateOfferStatus(id: number, status: string): Promise<Offer | undefined>;
  
  // Notification methods
  getNotification(id: number): Promise<Notification | undefined>;
  getNotificationsByUser(userId: number, options?: { includeRead?: boolean, limit?: number, offset?: number }): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number, userId: number): Promise<boolean>;
  markAllNotificationsAsRead(userId: number): Promise<boolean>;
  getUnreadNotificationsCount(userId: number): Promise<number>;
  
  // Favorite methods
  getFavoritesByUser(userId: number): Promise<(Favorite & { item: Item })[]>;
  isFavorite(userId: number, itemId: number): Promise<boolean>;
  addFavorite(favorite: InsertFavorite): Promise<Favorite>;
  removeFavorite(userId: number, itemId: number): Promise<boolean>;
  
  // Push subscription methods
  getPushSubscription(userId: number): Promise<PushSubscription | undefined>;
  createOrUpdatePushSubscription(subscription: InsertPushSubscription): Promise<PushSubscription>;
  deletePushSubscription(userId: number): Promise<boolean>;
  
  // Review methods for reputation system
  getReviewById(id: number): Promise<ReviewWithDetails | undefined>;
  getReviewsByUser(userId: number, asReviewer?: boolean): Promise<ReviewWithDetails[]>;
  getReviewsByOffer(offerId: number): Promise<ReviewWithDetails[]>;
  createReview(review: InsertReview): Promise<Review>;
  canReviewOffer(offerId: number, userId: number): Promise<boolean>;
  getUserRating(userId: number): Promise<UserWithRating>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private items: Map<number, Item>;
  private images: Map<number, Image>;
  private conversations: Map<number, Conversation>;
  private conversationParticipants: Map<number, ConversationParticipant>;
  private messages: Map<number, Message>;
  private offers: Map<number, Offer>;
  private notifications: Map<number, Notification>;
  private favorites: Map<number, Favorite>;
  private pushSubscriptions: Map<number, PushSubscription>;
  private reviews: Map<number, Review>;
  
  private currentUserId: number;
  private currentItemId: number;
  private currentImageId: number;
  private currentConversationId: number;
  private currentConversationParticipantId: number;
  private currentMessageId: number;
  private currentOfferId: number;
  private currentNotificationId: number;
  private currentFavoriteId: number;
  private currentPushSubscriptionId: number;
  private currentReviewId: number;

  constructor() {
    this.users = new Map();
    this.items = new Map();
    this.images = new Map();
    this.conversations = new Map();
    this.conversationParticipants = new Map();
    this.messages = new Map();
    this.offers = new Map();
    this.notifications = new Map();
    this.favorites = new Map();
    this.pushSubscriptions = new Map();
    this.reviews = new Map();
    
    this.currentUserId = 1;
    this.currentItemId = 1;
    this.currentImageId = 1;
    this.currentConversationId = 1;
    this.currentConversationParticipantId = 1;
    this.currentMessageId = 1;
    this.currentOfferId = 1;
    this.currentNotificationId = 1;
    this.currentFavoriteId = 1;
    this.currentPushSubscriptionId = 1;
    this.currentReviewId = 1;
    
    // Create some demo users
    this.createUser({
      username: "demo",
      password: "password",
      email: "demo@example.com",
      fullName: "Demo User",
      avatar: "https://ui-avatars.com/api/?name=Demo+User&background=0D8ABC&color=fff",
      bio: "I love bartering!",
      phone: "123-456-7890"
    });
    
    this.createUser({
      username: "john",
      password: "password",
      email: "john@example.com",
      fullName: "John Doe",
      avatar: "https://ui-avatars.com/api/?name=John+Doe&background=F97316&color=fff",
      bio: "Trading vintage items",
      phone: "123-555-1234"
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email
    );
  }
  
  async getAllUsers(search?: string): Promise<User[]> {
    let users = Array.from(this.users.values());
    
    // Apply search filter if provided
    if (search) {
      const searchLower = search.toLowerCase();
      users = users.filter(
        user => 
          user.username.toLowerCase().includes(searchLower) ||
          (user.email && user.email.toLowerCase().includes(searchLower)) ||
          (user.fullName && user.fullName.toLowerCase().includes(searchLower))
      );
    }
    
    // Sort by creation date, newest first
    return users.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const createdAt = new Date();
    const user: User = { 
      id, 
      username: insertUser.username,
      password: insertUser.password,
      email: insertUser.email,
      fullName: insertUser.fullName || null,
      avatar: insertUser.avatar || null,
      bio: insertUser.bio || null,
      phone: insertUser.phone || null,
      role: insertUser.role || 'user',
      active: insertUser.active !== undefined ? insertUser.active : true,
      createdAt 
    };
    this.users.set(id, user);
    return user;
  }
  
  async updateUser(id: number, data: Partial<InsertUser>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...data };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  // Item methods
  async getItem(id: number): Promise<Item | undefined> {
    return this.items.get(id);
  }
  
  async getItemsByUser(userId: number): Promise<Item[]> {
    return Array.from(this.items.values()).filter(
      (item) => item.userId === userId
    );
  }
  
  async getItems(options?: { 
    category?: string, 
    search?: string, 
    status?: string, 
    city?: string,
    condition?: string,
    sort?: 'newest' | 'oldest' | 'title_asc' | 'title_desc',
    limit?: number, 
    offset?: number 
  }): Promise<Item[]> {
    let items = Array.from(this.items.values());
    
    // Apply filters
    if (options?.category) {
      items = items.filter(item => item.category === options.category);
    }
    
    if (options?.search) {
      const search = options.search.toLowerCase();
      items = items.filter(item => 
        item.title.toLowerCase().includes(search) || 
        item.description.toLowerCase().includes(search)
      );
    }
    
    if (options?.status) {
      items = items.filter(item => item.status === options.status);
    }
    
    if (options?.city) {
      items = items.filter(item => item.city === options.city);
    }
    
    if (options?.condition) {
      items = items.filter(item => item.condition === options.condition);
    }
    
    // Apply sorting
    if (options?.sort) {
      switch (options.sort) {
        case 'newest':
          items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
          break;
        case 'oldest':
          items.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
          break;
        case 'title_asc':
          items.sort((a, b) => a.title.localeCompare(b.title));
          break;
        case 'title_desc':
          items.sort((a, b) => b.title.localeCompare(a.title));
          break;
        default:
          // Default sorting: newest first
          items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      }
    } else {
      // Default sorting: newest first
      items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
    
    // Apply pagination
    if (options?.offset && options?.limit) {
      return items.slice(options.offset, options.offset + options.limit);
    } else if (options?.limit) {
      return items.slice(0, options.limit);
    }
    
    return items;
  }
  
  async createItem(insertItem: InsertItem): Promise<Item> {
    const id = this.currentItemId++;
    const createdAt = new Date();
    const updatedAt = new Date();
    const item: Item = { 
      id, 
      userId: insertItem.userId,
      title: insertItem.title,
      description: insertItem.description,
      category: insertItem.category,
      condition: insertItem.condition,
      city: insertItem.city || null,
      status: insertItem.status || "active",
      createdAt, 
      updatedAt 
    };
    this.items.set(id, item);
    return item;
  }
  
  async updateItem(id: number, data: Partial<InsertItem>): Promise<Item | undefined> {
    const item = await this.getItem(id);
    if (!item) return undefined;
    
    const updatedAt = new Date();
    const updatedItem = { ...item, ...data, updatedAt };
    this.items.set(id, updatedItem);
    return updatedItem;
  }
  
  async deleteItem(id: number): Promise<boolean> {
    return this.items.delete(id);
  }
  
  // Image methods
  async getImagesByItem(itemId: number): Promise<Image[]> {
    return Array.from(this.images.values()).filter(
      (image) => image.itemId === itemId
    );
  }
  
  async createImage(insertImage: InsertImage): Promise<Image> {
    const id = this.currentImageId++;
    const createdAt = new Date();
    const image: Image = { 
      id, 
      itemId: insertImage.itemId,
      filePath: insertImage.filePath,
      isMain: insertImage.isMain || false,
      createdAt 
    };
    
    // If this is the first image or isMain is true, make it the main image
    if (image.isMain) {
      // Reset other main images for this item
      Array.from(this.images.values())
        .filter(img => img.itemId === image.itemId && img.isMain)
        .forEach(img => {
          this.images.set(img.id, { ...img, isMain: false });
        });
    }
    
    this.images.set(id, image);
    return image;
  }
  
  async setMainImage(imageId: number, itemId: number): Promise<boolean> {
    const image = Array.from(this.images.values()).find(
      img => img.id === imageId && img.itemId === itemId
    );
    
    if (!image) return false;
    
    // Reset all main images for this item
    Array.from(this.images.values())
      .filter(img => img.itemId === itemId)
      .forEach(img => {
        this.images.set(img.id, { ...img, isMain: img.id === imageId });
      });
      
    return true;
  }
  
  async deleteImage(id: number): Promise<boolean> {
    return this.images.delete(id);
  }
  
  // Conversation methods
  async getConversation(id: number): Promise<ConversationWithParticipants | undefined> {
    const conversation = this.conversations.get(id);
    if (!conversation) return undefined;
    
    return this.enrichConversation(conversation);
  }
  
  async getConversationByParticipants(userId1: number, userId2: number, itemId?: number): Promise<ConversationWithParticipants | undefined> {
    // Get all conversations
    const allConversations = await this.getConversationsByUser(userId1);
    
    // Find conversation with both participants and matching itemId if provided
    return allConversations.find(conv => {
      const hasOtherUser = conv.participants.some(p => p.id === userId2);
      return hasOtherUser && (!itemId || conv.itemId === itemId);
    });
  }
  
  async getConversationsByUser(userId: number): Promise<ConversationWithParticipants[]> {
    // Find all conversation participants for the user
    const participantRecords = Array.from(this.conversationParticipants.values())
      .filter(cp => cp.userId === userId);
    
    // Get the associated conversations
    const conversationIds = participantRecords.map(cp => cp.conversationId);
    const conversations = Array.from(this.conversations.values())
      .filter(c => conversationIds.includes(c.id));
    
    // Enrich conversations with participants, last message, etc.
    const enrichedConversations = await Promise.all(
      conversations.map(c => this.enrichConversation(c))
    );
    
    // Sort by last message time, newest first
    return enrichedConversations.sort(
      (a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime()
    );
  }
  
  private async enrichConversation(conversation: Conversation): Promise<ConversationWithParticipants> {
    // Get participants
    const participantRecords = Array.from(this.conversationParticipants.values())
      .filter(cp => cp.conversationId === conversation.id);
    
    const participantIds = participantRecords.map(cp => cp.userId);
    const participants = participantIds.map(id => this.users.get(id)!);
    
    // Get last message
    const conversationMessages = Array.from(this.messages.values())
      .filter(m => m.conversationId === conversation.id)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    const lastMessage = conversationMessages[0];
    let lastMessageWithSender: (Message & { sender: User }) | undefined;
    
    if (lastMessage) {
      const sender = this.users.get(lastMessage.senderId)!;
      lastMessageWithSender = { ...lastMessage, sender };
    }
    
    // Get the item if it exists
    let item: (Item & { mainImage?: string }) | undefined;
    if (conversation.itemId) {
      const itemData = this.items.get(conversation.itemId);
      if (itemData) {
        // Get the main image for this item
        const mainImage = Array.from(this.images.values())
          .find(img => img.itemId === itemData.id && img.isMain);
        
        item = { ...itemData, mainImage: mainImage?.filePath };
      }
    }
    
    return {
      ...conversation,
      participants,
      otherParticipant: null, // Will be set by the client
      lastMessage: lastMessageWithSender,
      unreadCount: 0, // Will be calculated by the client
      item
    };
  }
  
  async createConversation(insertConversation: InsertConversation, participants: InsertConversationParticipant[]): Promise<Conversation> {
    const id = this.currentConversationId++;
    const createdAt = new Date();
    const lastMessageAt = new Date();
    
    const conversation: Conversation = {
      id,
      itemId: insertConversation.itemId || null,
      lastMessageAt,
      createdAt
    };
    
    this.conversations.set(id, conversation);
    
    // Add participants
    for (const participant of participants) {
      await this.addConversationParticipant({
        ...participant,
        conversationId: id
      });
    }
    
    return conversation;
  }
  
  private async addConversationParticipant(insertParticipant: InsertConversationParticipant): Promise<ConversationParticipant> {
    const id = this.currentConversationParticipantId++;
    const createdAt = new Date();
    
    const participant: ConversationParticipant = {
      id,
      ...insertParticipant,
      createdAt
    };
    
    this.conversationParticipants.set(id, participant);
    return participant;
  }
  
  async updateConversationLastMessage(id: number): Promise<boolean> {
    const conversation = await this.conversations.get(id);
    if (!conversation) return false;
    
    const updatedConversation = {
      ...conversation,
      lastMessageAt: new Date()
    };
    
    this.conversations.set(id, updatedConversation);
    return true;
  }
  
  // Message methods
  async getMessage(id: number): Promise<MessageWithSender | undefined> {
    const message = this.messages.get(id);
    if (!message) return undefined;
    
    const sender = this.users.get(message.senderId);
    if (!sender) return undefined;
    
    return { ...message, sender };
  }
  
  async getMessagesByConversation(conversationId: number): Promise<MessageWithSender[]> {
    const messages = Array.from(this.messages.values())
      .filter(m => m.conversationId === conversationId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    
    return Promise.all(messages.map(async m => {
      const sender = this.users.get(m.senderId)!;
      return { ...m, sender };
    }));
  }
  
  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = this.currentMessageId++;
    const createdAt = new Date();
    
    const message: Message = {
      id,
      conversationId: insertMessage.conversationId,
      senderId: insertMessage.senderId,
      content: insertMessage.content,
      status: insertMessage.status || 'sent',
      createdAt
    };
    
    this.messages.set(id, message);
    
    // Update the conversation's last message time
    await this.updateConversationLastMessage(insertMessage.conversationId);
    
    return message;
  }
  
  async markMessagesAsRead(conversationId: number, userId: number): Promise<number[]> {
    const messages = Array.from(this.messages.values())
      .filter(m => 
        m.conversationId === conversationId && 
        m.senderId !== userId && 
        m.status !== 'read'
      );
    
    const messageIds: number[] = [];
    
    for (const message of messages) {
      const updatedMessage = { ...message, status: 'read' };
      this.messages.set(message.id, updatedMessage);
      messageIds.push(message.id);
    }
    
    return messageIds;
  }
  
  // Offer methods
  async getOffer(id: number): Promise<Offer | undefined> {
    return this.offers.get(id);
  }
  
  async getOffersByUser(userId: number, status?: string): Promise<Offer[]> {
    let offers = Array.from(this.offers.values())
      .filter(o => o.fromUserId === userId || o.toUserId === userId);
    
    if (status) {
      offers = offers.filter(o => o.status === status);
    }
    
    return offers.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async createOffer(insertOffer: InsertOffer): Promise<Offer> {
    const id = this.currentOfferId++;
    const createdAt = new Date();
    const updatedAt = new Date();
    
    const offer: Offer = {
      id,
      conversationId: insertOffer.conversationId,
      fromUserId: insertOffer.fromUserId,
      toUserId: insertOffer.toUserId,
      fromItemId: insertOffer.fromItemId,
      toItemId: insertOffer.toItemId,
      status: insertOffer.status || 'pending',
      createdAt,
      updatedAt
    };
    
    this.offers.set(id, offer);
    return offer;
  }
  
  async updateOfferStatus(id: number, status: string): Promise<Offer | undefined> {
    const offer = await this.getOffer(id);
    if (!offer) return undefined;
    
    const updatedOffer = {
      ...offer,
      status,
      updatedAt: new Date()
    };
    
    this.offers.set(id, updatedOffer);
    return updatedOffer;
  }
  
  // Notification methods
  async getNotification(id: number): Promise<Notification | undefined> {
    return this.notifications.get(id);
  }
  
  async getNotificationsByUser(userId: number, options?: { includeRead?: boolean, limit?: number, offset?: number }): Promise<Notification[]> {
    let notifications = Array.from(this.notifications.values())
      .filter(n => n.userId === userId);
    
    if (options && !options.includeRead) {
      notifications = notifications.filter(n => !n.isRead);
    }
    
    // Sort by creation date, newest first
    notifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    if (options?.offset && options?.limit) {
      return notifications.slice(options.offset, options.offset + options.limit);
    } else if (options?.limit) {
      return notifications.slice(0, options.limit);
    }
    
    return notifications;
  }
  
  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const id = this.currentNotificationId++;
    const createdAt = new Date();
    
    const notification: Notification = {
      id,
      userId: insertNotification.userId,
      type: insertNotification.type,
      content: insertNotification.content,
      referenceId: insertNotification.referenceId || null,
      isRead: false,
      createdAt
    };
    
    this.notifications.set(id, notification);
    return notification;
  }
  
  async markNotificationAsRead(id: number, userId: number): Promise<boolean> {
    const notification = await this.getNotification(id);
    if (!notification || notification.userId !== userId) return false;
    
    const updatedNotification = {
      ...notification,
      isRead: true
    };
    
    this.notifications.set(id, updatedNotification);
    return true;
  }
  
  async markAllNotificationsAsRead(userId: number): Promise<boolean> {
    const notifications = await this.getNotificationsByUser(userId, { includeRead: false });
    
    for (const notification of notifications) {
      await this.markNotificationAsRead(notification.id, userId);
    }
    
    return true;
  }
  
  async getUnreadNotificationsCount(userId: number): Promise<number> {
    const notifications = await this.getNotificationsByUser(userId, { includeRead: false });
    return notifications.length;
  }
  
  // Favorite methods
  async getFavoritesByUser(userId: number): Promise<(Favorite & { item: Item })[]> {
    const favorites = Array.from(this.favorites.values())
      .filter(f => f.userId === userId);
    
    return favorites.map(favorite => {
      const item = this.items.get(favorite.itemId)!;
      return { ...favorite, item };
    });
  }
  
  async isFavorite(userId: number, itemId: number): Promise<boolean> {
    return Array.from(this.favorites.values())
      .some(f => f.userId === userId && f.itemId === itemId);
  }
  
  async addFavorite(insertFavorite: InsertFavorite): Promise<Favorite> {
    // Check if already exists
    const existing = Array.from(this.favorites.values())
      .find(f => f.userId === insertFavorite.userId && f.itemId === insertFavorite.itemId);
    
    if (existing) return existing;
    
    const id = this.currentFavoriteId++;
    const createdAt = new Date();
    
    const favorite: Favorite = {
      id,
      ...insertFavorite,
      createdAt
    };
    
    this.favorites.set(id, favorite);
    return favorite;
  }
  
  async removeFavorite(userId: number, itemId: number): Promise<boolean> {
    const favorite = Array.from(this.favorites.values())
      .find(f => f.userId === userId && f.itemId === itemId);
    
    if (!favorite) return false;
    
    return this.favorites.delete(favorite.id);
  }
  
  // Push subscription methods
  async getPushSubscription(userId: number): Promise<PushSubscription | undefined> {
    return Array.from(this.pushSubscriptions.values())
      .find(ps => ps.userId === userId);
  }
  
  async createOrUpdatePushSubscription(insertSubscription: InsertPushSubscription): Promise<PushSubscription> {
    // Check if already exists
    const existing = await this.getPushSubscription(insertSubscription.userId);
    
    if (existing) {
      // Update existing
      const updatedSubscription = {
        ...existing,
        subscription: insertSubscription.subscription,
        updatedAt: new Date()
      };
      
      this.pushSubscriptions.set(existing.id, updatedSubscription);
      return updatedSubscription;
    }
    
    // Create new
    const id = this.currentPushSubscriptionId++;
    const createdAt = new Date();
    const updatedAt = new Date();
    
    const subscription: PushSubscription = {
      id,
      ...insertSubscription,
      createdAt,
      updatedAt
    };
    
    this.pushSubscriptions.set(id, subscription);
    return subscription;
  }
  
  async deletePushSubscription(userId: number): Promise<boolean> {
    const subscription = await this.getPushSubscription(userId);
    if (!subscription) return false;
    
    return this.pushSubscriptions.delete(subscription.id);
  }

  // Review methods for reputation system
  async getReviewById(id: number): Promise<ReviewWithDetails | undefined> {
    const review = this.reviews.get(id);
    if (!review) return undefined;

    return this.enrichReview(review);
  }

  async getReviewsByUser(userId: number, asReviewer: boolean = false): Promise<ReviewWithDetails[]> {
    const reviews = Array.from(this.reviews.values())
      .filter(review => asReviewer ? review.fromUserId === userId : review.toUserId === userId);
    
    return Promise.all(reviews.map(review => this.enrichReview(review)));
  }

  async getReviewsByOffer(offerId: number): Promise<ReviewWithDetails[]> {
    const reviews = Array.from(this.reviews.values())
      .filter(review => review.offerId === offerId);
    
    return Promise.all(reviews.map(review => this.enrichReview(review)));
  }

  async createReview(insertReview: InsertReview): Promise<Review> {
    const id = this.currentReviewId++;
    const createdAt = new Date();
    
    const review: Review = {
      id,
      fromUserId: insertReview.fromUserId,
      toUserId: insertReview.toUserId,
      offerId: insertReview.offerId,
      rating: insertReview.rating,
      comment: insertReview.comment || null,
      createdAt
    };
    
    this.reviews.set(id, review);
    return review;
  }

  async canReviewOffer(offerId: number, userId: number): Promise<boolean> {
    // Get the offer
    const offer = await this.getOffer(offerId);
    if (!offer) return false;
    
    // Check if user is related to this offer
    if (offer.fromUserId !== userId && offer.toUserId !== userId) {
      return false;
    }
    
    // Check if offer is completed
    if (offer.status !== 'completed') {
      return false;
    }
    
    // Check if user already reviewed this offer
    const existingReviews = Array.from(this.reviews.values())
      .filter(review => 
        review.offerId === offerId && 
        review.fromUserId === userId
      );
    
    return existingReviews.length === 0;
  }

  async getUserRating(userId: number): Promise<UserWithRating> {
    const user = await this.getUser(userId);
    if (!user) throw new Error('User not found');
    
    // Get all reviews for this user
    const reviews = Array.from(this.reviews.values())
      .filter(review => review.toUserId === userId);
    
    if (reviews.length === 0) {
      return {
        ...user,
        averageRating: 0,
        reviewCount: 0
      };
    }
    
    // Calculate average rating
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;
    
    return {
      ...user,
      averageRating,
      reviewCount: reviews.length
    };
  }

  private async enrichReview(review: Review): Promise<ReviewWithDetails> {
    const fromUser = this.users.get(review.fromUserId)!;
    const toUser = this.users.get(review.toUserId)!;
    const offer = this.offers.get(review.offerId)!;
    
    return {
      ...review,
      fromUser,
      toUser,
      offer
    };
  }
}

export const storage = new MemStorage();
