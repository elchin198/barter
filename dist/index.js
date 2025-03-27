var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});

// server/index.ts
import express2 from "express";

// server/routes-simplified.ts
import { createServer } from "http";
import { WebSocketServer } from "ws";
import WebSocket from "ws";

// server/storage.ts
var MemStorage = class {
  users;
  items;
  images;
  conversations;
  conversationParticipants;
  messages;
  offers;
  notifications;
  favorites;
  pushSubscriptions;
  reviews;
  currentUserId;
  currentItemId;
  currentImageId;
  currentConversationId;
  currentConversationParticipantId;
  currentMessageId;
  currentOfferId;
  currentNotificationId;
  currentFavoriteId;
  currentPushSubscriptionId;
  currentReviewId;
  constructor() {
    this.users = /* @__PURE__ */ new Map();
    this.items = /* @__PURE__ */ new Map();
    this.images = /* @__PURE__ */ new Map();
    this.conversations = /* @__PURE__ */ new Map();
    this.conversationParticipants = /* @__PURE__ */ new Map();
    this.messages = /* @__PURE__ */ new Map();
    this.offers = /* @__PURE__ */ new Map();
    this.notifications = /* @__PURE__ */ new Map();
    this.favorites = /* @__PURE__ */ new Map();
    this.pushSubscriptions = /* @__PURE__ */ new Map();
    this.reviews = /* @__PURE__ */ new Map();
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
    this.createUser({
      username: "admin",
      password: "admin123",
      email: "admin@bartertap.az",
      fullName: "Admin User",
      role: "admin",
      avatar: "https://ui-avatars.com/api/?name=Admin+User&background=FF4500&color=fff",
      bio: "System administrator",
      phone: "123-789-4560"
    });
  }
  // User methods
  async getUser(id) {
    return this.users.get(id);
  }
  async getUserByUsername(username) {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }
  async getUserByEmail(email) {
    return Array.from(this.users.values()).find(
      (user) => user.email === email
    );
  }
  async getAllUsers(search) {
    let users = Array.from(this.users.values());
    if (search) {
      const searchLower = search.toLowerCase();
      users = users.filter(
        (user) => user.username.toLowerCase().includes(searchLower) || user.email && user.email.toLowerCase().includes(searchLower) || user.fullName && user.fullName.toLowerCase().includes(searchLower)
      );
    }
    return users.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  async createUser(insertUser) {
    const id = this.currentUserId++;
    const createdAt = /* @__PURE__ */ new Date();
    const user = {
      id,
      username: insertUser.username,
      password: insertUser.password,
      email: insertUser.email,
      fullName: insertUser.fullName || null,
      avatar: insertUser.avatar || null,
      bio: insertUser.bio || null,
      phone: insertUser.phone || null,
      role: insertUser.role || "user",
      active: insertUser.active !== void 0 ? insertUser.active : true,
      createdAt
    };
    this.users.set(id, user);
    return user;
  }
  async updateUser(id, data) {
    const user = await this.getUser(id);
    if (!user) return void 0;
    const updatedUser = { ...user, ...data };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  // Item methods
  async getItem(id) {
    return this.items.get(id);
  }
  async getItemsByUser(userId) {
    return Array.from(this.items.values()).filter(
      (item) => item.userId === userId
    );
  }
  async getItems(options) {
    let items = Array.from(this.items.values());
    if (options?.category) {
      items = items.filter((item) => item.category === options.category);
    }
    if (options?.search) {
      const search = options.search.toLowerCase();
      items = items.filter(
        (item) => item.title.toLowerCase().includes(search) || item.description.toLowerCase().includes(search)
      );
    }
    if (options?.status) {
      items = items.filter((item) => item.status === options.status);
    }
    if (options?.city) {
      items = items.filter((item) => item.city === options.city);
    }
    if (options?.condition) {
      items = items.filter((item) => item.condition === options.condition);
    }
    if (options?.sort) {
      switch (options.sort) {
        case "newest":
          items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
          break;
        case "oldest":
          items.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
          break;
        case "title_asc":
          items.sort((a, b) => a.title.localeCompare(b.title));
          break;
        case "title_desc":
          items.sort((a, b) => b.title.localeCompare(a.title));
          break;
        default:
          items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      }
    } else {
      items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
    if (options?.offset && options?.limit) {
      return items.slice(options.offset, options.offset + options.limit);
    } else if (options?.limit) {
      return items.slice(0, options.limit);
    }
    return items;
  }
  async createItem(insertItem) {
    const id = this.currentItemId++;
    const createdAt = /* @__PURE__ */ new Date();
    const updatedAt = /* @__PURE__ */ new Date();
    const item = {
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
  async updateItem(id, data) {
    const item = await this.getItem(id);
    if (!item) return void 0;
    const updatedAt = /* @__PURE__ */ new Date();
    const updatedItem = { ...item, ...data, updatedAt };
    this.items.set(id, updatedItem);
    return updatedItem;
  }
  async deleteItem(id) {
    return this.items.delete(id);
  }
  // Image methods
  async getImagesByItem(itemId) {
    return Array.from(this.images.values()).filter(
      (image) => image.itemId === itemId
    );
  }
  async createImage(insertImage) {
    const id = this.currentImageId++;
    const createdAt = /* @__PURE__ */ new Date();
    const image = {
      id,
      itemId: insertImage.itemId,
      filePath: insertImage.filePath,
      isMain: insertImage.isMain || false,
      createdAt
    };
    if (image.isMain) {
      Array.from(this.images.values()).filter((img) => img.itemId === image.itemId && img.isMain).forEach((img) => {
        this.images.set(img.id, { ...img, isMain: false });
      });
    }
    this.images.set(id, image);
    return image;
  }
  async setMainImage(imageId, itemId) {
    const image = Array.from(this.images.values()).find(
      (img) => img.id === imageId && img.itemId === itemId
    );
    if (!image) return false;
    Array.from(this.images.values()).filter((img) => img.itemId === itemId).forEach((img) => {
      this.images.set(img.id, { ...img, isMain: img.id === imageId });
    });
    return true;
  }
  async deleteImage(id) {
    return this.images.delete(id);
  }
  // Conversation methods
  async getConversation(id) {
    const conversation = this.conversations.get(id);
    if (!conversation) return void 0;
    return this.enrichConversation(conversation);
  }
  async getConversationByParticipants(userId1, userId2, itemId) {
    const allConversations = await this.getConversationsByUser(userId1);
    return allConversations.find((conv) => {
      const hasOtherUser = conv.participants.some((p) => p.id === userId2);
      return hasOtherUser && (!itemId || conv.itemId === itemId);
    });
  }
  async getConversationsByUser(userId) {
    const participantRecords = Array.from(this.conversationParticipants.values()).filter((cp) => cp.userId === userId);
    const conversationIds = participantRecords.map((cp) => cp.conversationId);
    const conversations = Array.from(this.conversations.values()).filter((c) => conversationIds.includes(c.id));
    const enrichedConversations = await Promise.all(
      conversations.map((c) => this.enrichConversation(c))
    );
    return enrichedConversations.sort(
      (a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime()
    );
  }
  async enrichConversation(conversation) {
    const participantRecords = Array.from(this.conversationParticipants.values()).filter((cp) => cp.conversationId === conversation.id);
    const participantIds = participantRecords.map((cp) => cp.userId);
    const participants = participantIds.map((id) => this.users.get(id));
    const conversationMessages = Array.from(this.messages.values()).filter((m) => m.conversationId === conversation.id).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    const lastMessage = conversationMessages[0];
    let lastMessageWithSender;
    if (lastMessage) {
      const sender = this.users.get(lastMessage.senderId);
      lastMessageWithSender = { ...lastMessage, sender };
    }
    let item;
    if (conversation.itemId) {
      const itemData = this.items.get(conversation.itemId);
      if (itemData) {
        const mainImage = Array.from(this.images.values()).find((img) => img.itemId === itemData.id && img.isMain);
        item = { ...itemData, mainImage: mainImage?.filePath };
      }
    }
    return {
      ...conversation,
      participants,
      otherParticipant: null,
      // Will be set by the client
      lastMessage: lastMessageWithSender,
      unreadCount: 0,
      // Will be calculated by the client
      item
    };
  }
  async createConversation(insertConversation, participants) {
    const id = this.currentConversationId++;
    const createdAt = /* @__PURE__ */ new Date();
    const lastMessageAt = /* @__PURE__ */ new Date();
    const conversation = {
      id,
      itemId: insertConversation.itemId || null,
      lastMessageAt,
      createdAt
    };
    this.conversations.set(id, conversation);
    for (const participant of participants) {
      await this.addConversationParticipant({
        ...participant,
        conversationId: id
      });
    }
    return conversation;
  }
  async addConversationParticipant(insertParticipant) {
    const id = this.currentConversationParticipantId++;
    const createdAt = /* @__PURE__ */ new Date();
    const participant = {
      id,
      ...insertParticipant,
      createdAt
    };
    this.conversationParticipants.set(id, participant);
    return participant;
  }
  async updateConversationLastMessage(id) {
    const conversation = await this.conversations.get(id);
    if (!conversation) return false;
    const updatedConversation = {
      ...conversation,
      lastMessageAt: /* @__PURE__ */ new Date()
    };
    this.conversations.set(id, updatedConversation);
    return true;
  }
  // Message methods
  async getMessage(id) {
    const message = this.messages.get(id);
    if (!message) return void 0;
    const sender = this.users.get(message.senderId);
    if (!sender) return void 0;
    return { ...message, sender };
  }
  async getMessagesByConversation(conversationId) {
    const messages = Array.from(this.messages.values()).filter((m) => m.conversationId === conversationId).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    return Promise.all(messages.map(async (m) => {
      const sender = this.users.get(m.senderId);
      return { ...m, sender };
    }));
  }
  async createMessage(insertMessage) {
    const id = this.currentMessageId++;
    const createdAt = /* @__PURE__ */ new Date();
    const message = {
      id,
      conversationId: insertMessage.conversationId,
      senderId: insertMessage.senderId,
      content: insertMessage.content,
      status: insertMessage.status || "sent",
      createdAt
    };
    this.messages.set(id, message);
    await this.updateConversationLastMessage(insertMessage.conversationId);
    return message;
  }
  async markMessagesAsRead(conversationId, userId) {
    const messages = Array.from(this.messages.values()).filter(
      (m) => m.conversationId === conversationId && m.senderId !== userId && m.status !== "read"
    );
    const messageIds = [];
    for (const message of messages) {
      const updatedMessage = { ...message, status: "read" };
      this.messages.set(message.id, updatedMessage);
      messageIds.push(message.id);
    }
    return messageIds;
  }
  // Offer methods
  async getOffer(id) {
    return this.offers.get(id);
  }
  async getOffersByUser(userId, status) {
    let offers = Array.from(this.offers.values()).filter((o) => o.fromUserId === userId || o.toUserId === userId);
    if (status) {
      offers = offers.filter((o) => o.status === status);
    }
    return offers.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  async createOffer(insertOffer) {
    const id = this.currentOfferId++;
    const createdAt = /* @__PURE__ */ new Date();
    const updatedAt = /* @__PURE__ */ new Date();
    const offer = {
      id,
      conversationId: insertOffer.conversationId,
      fromUserId: insertOffer.fromUserId,
      toUserId: insertOffer.toUserId,
      fromItemId: insertOffer.fromItemId,
      toItemId: insertOffer.toItemId,
      status: insertOffer.status || "pending",
      createdAt,
      updatedAt
    };
    this.offers.set(id, offer);
    return offer;
  }
  async updateOfferStatus(id, status) {
    const offer = await this.getOffer(id);
    if (!offer) return void 0;
    const updatedOffer = {
      ...offer,
      status,
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.offers.set(id, updatedOffer);
    return updatedOffer;
  }
  // Notification methods
  async getNotification(id) {
    return this.notifications.get(id);
  }
  async getNotificationsByUser(userId, options) {
    let notifications = Array.from(this.notifications.values()).filter((n) => n.userId === userId);
    if (options && !options.includeRead) {
      notifications = notifications.filter((n) => !n.isRead);
    }
    notifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    if (options?.offset && options?.limit) {
      return notifications.slice(options.offset, options.offset + options.limit);
    } else if (options?.limit) {
      return notifications.slice(0, options.limit);
    }
    return notifications;
  }
  async createNotification(insertNotification) {
    const id = this.currentNotificationId++;
    const createdAt = /* @__PURE__ */ new Date();
    const notification = {
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
  async markNotificationAsRead(id, userId) {
    const notification = await this.getNotification(id);
    if (!notification || notification.userId !== userId) return false;
    const updatedNotification = {
      ...notification,
      isRead: true
    };
    this.notifications.set(id, updatedNotification);
    return true;
  }
  async markAllNotificationsAsRead(userId) {
    const notifications = await this.getNotificationsByUser(userId, { includeRead: false });
    for (const notification of notifications) {
      await this.markNotificationAsRead(notification.id, userId);
    }
    return true;
  }
  async getUnreadNotificationsCount(userId) {
    const notifications = await this.getNotificationsByUser(userId, { includeRead: false });
    return notifications.length;
  }
  // Favorite methods
  async getFavoritesByUser(userId) {
    const favorites = Array.from(this.favorites.values()).filter((f) => f.userId === userId);
    return favorites.map((favorite) => {
      const item = this.items.get(favorite.itemId);
      return { ...favorite, item };
    });
  }
  async isFavorite(userId, itemId) {
    return Array.from(this.favorites.values()).some((f) => f.userId === userId && f.itemId === itemId);
  }
  async addFavorite(insertFavorite) {
    const existing = Array.from(this.favorites.values()).find((f) => f.userId === insertFavorite.userId && f.itemId === insertFavorite.itemId);
    if (existing) return existing;
    const id = this.currentFavoriteId++;
    const createdAt = /* @__PURE__ */ new Date();
    const favorite = {
      id,
      ...insertFavorite,
      createdAt
    };
    this.favorites.set(id, favorite);
    return favorite;
  }
  async removeFavorite(userId, itemId) {
    const favorite = Array.from(this.favorites.values()).find((f) => f.userId === userId && f.itemId === itemId);
    if (!favorite) return false;
    return this.favorites.delete(favorite.id);
  }
  // Push subscription methods
  async getPushSubscription(userId) {
    return Array.from(this.pushSubscriptions.values()).find((ps) => ps.userId === userId);
  }
  async createOrUpdatePushSubscription(insertSubscription) {
    const existing = await this.getPushSubscription(insertSubscription.userId);
    if (existing) {
      const updatedSubscription = {
        ...existing,
        subscription: insertSubscription.subscription,
        updatedAt: /* @__PURE__ */ new Date()
      };
      this.pushSubscriptions.set(existing.id, updatedSubscription);
      return updatedSubscription;
    }
    const id = this.currentPushSubscriptionId++;
    const createdAt = /* @__PURE__ */ new Date();
    const updatedAt = /* @__PURE__ */ new Date();
    const subscription = {
      id,
      ...insertSubscription,
      createdAt,
      updatedAt
    };
    this.pushSubscriptions.set(id, subscription);
    return subscription;
  }
  async deletePushSubscription(userId) {
    const subscription = await this.getPushSubscription(userId);
    if (!subscription) return false;
    return this.pushSubscriptions.delete(subscription.id);
  }
  // Review methods for reputation system
  async getReviewById(id) {
    const review = this.reviews.get(id);
    if (!review) return void 0;
    return this.enrichReview(review);
  }
  async getReviewsByUser(userId, asReviewer = false) {
    const reviews = Array.from(this.reviews.values()).filter((review) => asReviewer ? review.fromUserId === userId : review.toUserId === userId);
    return Promise.all(reviews.map((review) => this.enrichReview(review)));
  }
  async getReviewsByOffer(offerId) {
    const reviews = Array.from(this.reviews.values()).filter((review) => review.offerId === offerId);
    return Promise.all(reviews.map((review) => this.enrichReview(review)));
  }
  async createReview(insertReview) {
    const id = this.currentReviewId++;
    const createdAt = /* @__PURE__ */ new Date();
    const review = {
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
  async canReviewOffer(offerId, userId) {
    const offer = await this.getOffer(offerId);
    if (!offer) return false;
    if (offer.fromUserId !== userId && offer.toUserId !== userId) {
      return false;
    }
    if (offer.status !== "completed") {
      return false;
    }
    const existingReviews = Array.from(this.reviews.values()).filter(
      (review) => review.offerId === offerId && review.fromUserId === userId
    );
    return existingReviews.length === 0;
  }
  async getUserRating(userId) {
    const user = await this.getUser(userId);
    if (!user) throw new Error("User not found");
    const reviews = Array.from(this.reviews.values()).filter((review) => review.toUserId === userId);
    if (reviews.length === 0) {
      return {
        ...user,
        averageRating: 0,
        reviewCount: 0
      };
    }
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;
    return {
      ...user,
      averageRating,
      reviewCount: reviews.length
    };
  }
  async enrichReview(review) {
    const fromUser = this.users.get(review.fromUserId);
    const toUser = this.users.get(review.toUserId);
    const offer = this.offers.get(review.offerId);
    return {
      ...review,
      fromUser,
      toUser,
      offer
    };
  }
};
var storage = new MemStorage();

// server/routes-simplified.ts
import multer from "multer";
import path from "path";
import fs from "fs";

// server/auth.ts
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
var scryptAsync = promisify(scrypt);
var AuthService = class {
  /**
   * Hash a password using scrypt with salt
   * @param password Plain text password
   * @returns Hashed password with salt
   */
  async hashPassword(password) {
    const salt = randomBytes(16).toString("hex");
    const hash = await scryptAsync(password, salt, 64);
    return `${hash.toString("hex")}.${salt}`;
  }
  /**
   * Verify a password against a stored hash
   * @param password Plain text password to verify
   * @param storedHash Stored hash from the database
   * @returns True if password matches, false otherwise
   */
  async verifyPassword(password, storedHash) {
    const [hash, salt] = storedHash.split(".");
    const hashBuffer = Buffer.from(hash, "hex");
    const suppliedBuffer = await scryptAsync(password, salt, 64);
    return timingSafeEqual(hashBuffer, suppliedBuffer);
  }
  /**
   * Authenticate a user using username and password
   * @param username Username to authenticate
   * @param password Password to authenticate
   * @returns User object if authentication is successful, null otherwise
   */
  async authenticate(username, password) {
    const user = await storage.getUserByUsername(username);
    if (!user) {
      console.log(`Authentication failed: User '${username}' not found`);
      return null;
    }
    const passwordValid = await this.verifyPassword(password, user.password);
    if (!passwordValid) {
      console.log(`Authentication failed: Invalid password for user '${username}'`);
      return null;
    }
    console.log(`Authentication successful for user '${username}'`);
    return user;
  }
  /**
   * Middleware to check if a user is authenticated
   */
  isAuthenticated(req, res, next) {
    console.log("[AUTH] Checking authentication...");
    console.log("[AUTH] Session ID:", req.session.id);
    console.log("[AUTH] Session data:", {
      userId: req.session.userId,
      username: req.session.username,
      role: req.session.role
    });
    if (!req.session.userId) {
      console.log("[AUTH] No user ID in session, authentication failed");
      return res.status(401).json({ message: "Authentication required" });
    }
    console.log("[AUTH] User authenticated, continuing...");
    next();
  }
  /**
   * Middleware to check if a user is an admin
   */
  isAdmin(req, res, next) {
    if (!req.session.userId) {
      console.log("[AUTH] No user ID in session, authentication failed");
      return res.status(401).json({ message: "Authentication required" });
    }
    if (req.session.role !== "admin") {
      console.log("[AUTH] User is not admin, access denied");
      return res.status(403).json({ message: "Admin access required" });
    }
    console.log("[AUTH] Admin access granted");
    next();
  }
  /**
   * Login a user and create a session
   * @param req Express request
   * @param res Express response
   */
  async login(req, res) {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        console.log("[AUTH] Login failed: Username or password missing");
        return res.status(400).json({ message: "Username and password are required" });
      }
      const TEST_USERNAME = "testuser";
      const TEST_PASSWORD = "password123";
      let user = null;
      if (username === TEST_USERNAME) {
        user = await storage.getUserByUsername(TEST_USERNAME);
        if (!user) {
          console.log(`[AUTH] Creating test user: ${TEST_USERNAME}`);
          try {
            user = await storage.createUser({
              username: TEST_USERNAME,
              password: TEST_PASSWORD,
              // In a real app, this would be hashed
              email: `${TEST_USERNAME}@example.com`,
              fullName: "Test User",
              role: "user",
              active: true
            });
          } catch (error) {
            console.error("[AUTH] Error creating test user:", error);
            return res.status(500).json({ message: "Error creating test user" });
          }
        }
        if (password !== TEST_PASSWORD) {
          console.log("[AUTH] Invalid password for test user");
          return res.status(401).json({ message: "Invalid username or password" });
        }
      } else {
        user = await this.authenticate(username, password);
        if (!user) {
          return res.status(401).json({ message: "Invalid username or password" });
        }
      }
      req.session.userId = user.id;
      req.session.username = user.username;
      req.session.role = user.role;
      req.session.isAuthenticated = true;
      req.session.save((err) => {
        if (err) {
          console.error("[AUTH] Error saving session:", err);
          return res.status(500).json({ message: "Error creating session" });
        }
        console.log("[AUTH] Session created:", req.session.id);
        console.log("[AUTH] Session data:", {
          userId: req.session.userId,
          username: req.session.username,
          role: req.session.role
        });
        const { password: password2, ...userWithoutPassword } = user;
        res.status(200).json(userWithoutPassword);
      });
    } catch (error) {
      console.error("[AUTH] Login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
  /**
   * Logout a user and destroy the session
   * @param req Express request
   * @param res Express response
   */
  logout(req, res) {
    if (!req.session.userId) {
      return res.status(200).json({ message: "Not logged in" });
    }
    const username = req.session.username;
    req.session.destroy((err) => {
      if (err) {
        console.error("[AUTH] Error destroying session:", err);
        return res.status(500).json({ message: "Error logging out" });
      }
      console.log(`[AUTH] User '${username}' logged out`);
      res.clearCookie("bartertap");
      res.status(200).json({ message: "Logged out successfully" });
    });
  }
  /**
   * Get current user from session
   * @param req Express request
   * @param res Express response
   */
  async getCurrentUser(req, res) {
    try {
      console.log("[AUTH] Checking current user...");
      console.log("[AUTH] Session ID:", req.session.id);
      console.log("[AUTH] Session data:", {
        userId: req.session.userId,
        username: req.session.username,
        role: req.session.role,
        isAuthenticated: req.session.isAuthenticated
      });
      if (!req.session.userId) {
        console.log("[AUTH] No user ID in session");
        return res.status(401).json({ message: "Not authenticated" });
      }
      console.log("[AUTH] Getting current user:", req.session.userId);
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        console.log("[AUTH] User not found:", req.session.userId);
        return res.status(404).json({ message: "User not found" });
      }
      console.log("[AUTH] User found:", user.username);
      const { password, ...userWithoutPassword } = user;
      res.setHeader("Content-Type", "application/json");
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      console.error("[AUTH] Error getting current user:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
};
var authService = new AuthService();
var isAuthenticated = authService.isAuthenticated.bind(authService);
var isAdmin = authService.isAdmin.bind(authService);

// server/routes-simplified.ts
var storage_config = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadType = req.path.includes("avatar") ? "avatars" : "items";
    const uploadDir = path.join(process.cwd(), `public/uploads/${uploadType}`);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  }
});
var upload = multer({
  storage: storage_config,
  limits: { fileSize: 5 * 1024 * 1024 },
  // 5MB limit
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only images are allowed"));
    }
    cb(null, true);
  }
});
async function registerRoutes(app2) {
  const httpServer = createServer(app2);
  const wss = new WebSocketServer({
    server: httpServer,
    path: "/ws"
  });
  wss.on("connection", (ws) => {
    console.log("WebSocket connection established");
    ws.send(JSON.stringify({
      type: "connection",
      message: "Connected to BarterTap WebSocket server"
    }));
    ws.on("message", (message) => {
      try {
        const data = JSON.parse(message.toString());
        console.log("WebSocket message received:", data);
        if (data.type === "ping") {
          ws.send(JSON.stringify({
            type: "pong",
            timestamp: Date.now()
          }));
        }
      } catch (error) {
        console.error("WebSocket message error:", error);
      }
    });
    ws.on("close", () => {
      console.log("WebSocket connection closed");
    });
  });
  function broadcast(data) {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  }
  app2.post("/api/login", (req, res) => authService.login(req, res));
  app2.post("/api/logout", (req, res) => authService.logout(req, res));
  app2.get("/api/auth/me", (req, res) => authService.getCurrentUser(req, res));
  app2.post("/api/register", async (req, res) => {
    try {
      const { username, password, email, fullName } = req.body;
      if (!username || !password || !email) {
        return res.status(400).json({ message: "Username, password, and email are required" });
      }
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }
      const hashedPassword = await authService.hashPassword(password);
      const user = await storage.createUser({
        username,
        password: hashedPassword,
        email,
        fullName,
        role: "user",
        active: true
      });
      req.session.userId = user.id;
      req.session.username = user.username;
      req.session.role = user.role;
      req.session.isAuthenticated = true;
      req.session.save((err) => {
        if (err) {
          console.error("Error saving session:", err);
          return res.status(500).json({ message: "Error creating session" });
        }
        const { password: password2, ...userWithoutPassword } = user;
        res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Failed to register user" });
    }
  });
  app2.get("/api/users/:id", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const { password, ...userWithoutPassword } = user;
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Failed to get user data" });
    }
  });
  app2.put("/api/users/me", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId;
      const userData = req.body;
      if (userData.password) {
        delete userData.password;
      }
      if (userData.role) {
        delete userData.role;
      }
      const updatedUser = await storage.updateUser(userId, userData);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      const { password, ...userWithoutPassword } = updatedUser;
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Failed to update user" });
    }
  });
  app2.get("/api/items", async (req, res) => {
    try {
      const { category, status, search, limit, offset, city, condition, sort } = req.query;
      const options = {};
      if (category) options.category = category;
      if (status) options.status = status;
      if (search) options.search = search;
      if (city) options.city = city;
      if (condition) options.condition = condition;
      if (sort) options.sort = sort;
      if (limit) options.limit = parseInt(limit);
      if (offset) options.offset = parseInt(offset);
      const items = await storage.getItems(options);
      const itemsWithImages = await Promise.all(items.map(async (item) => {
        const images = await storage.getImagesByItem(item.id);
        const mainImage = images.find((img) => img.isMain)?.filePath || (images.length > 0 ? images[0].filePath : null);
        return {
          ...item,
          mainImage
        };
      }));
      res.json(itemsWithImages);
    } catch (error) {
      console.error("Error getting items:", error);
      res.status(500).json({ message: "Error getting items" });
    }
  });
  app2.get("/api/items/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const item = await storage.getItem(id);
      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }
      const owner = await storage.getUser(item.userId);
      if (!owner) {
        return res.status(404).json({ message: "Item owner not found" });
      }
      const images = await storage.getImagesByItem(id);
      let isFavorite = false;
      if (req.session.userId) {
        isFavorite = await storage.isFavorite(req.session.userId, id);
      }
      res.json({
        ...item,
        owner: {
          id: owner.id,
          username: owner.username,
          fullName: owner.fullName,
          avatar: owner.avatar
        },
        images,
        isFavorite
      });
    } catch (error) {
      console.error("Error getting item:", error);
      res.status(500).json({ message: "Error getting item" });
    }
  });
  app2.post("/api/items", isAuthenticated, upload.array("images", 10), async (req, res) => {
    try {
      const userId = req.session.userId;
      const itemData = req.body;
      if (!itemData.title || !itemData.description || !itemData.category || !itemData.condition) {
        return res.status(400).json({ message: "Title, description, category, and condition are required" });
      }
      const item = await storage.createItem({
        ...itemData,
        userId,
        status: "active"
      });
      const files = req.files;
      if (files && files.length > 0) {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const filePath = `/uploads/items/${file.filename}`;
          const image = await storage.createImage({
            itemId: item.id,
            filePath,
            isMain: i === 0
            // First image is main
          });
          if (i === 0) {
            await storage.setMainImage(image.id, item.id);
          }
        }
      }
      const images = await storage.getImagesByItem(item.id);
      res.status(201).json({
        ...item,
        images
      });
    } catch (error) {
      console.error("Error creating item:", error);
      res.status(500).json({ message: "Error creating item" });
    }
  });
  app2.put("/api/items/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.session.userId;
      const itemData = req.body;
      const item = await storage.getItem(id);
      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }
      if (item.userId !== userId) {
        return res.status(403).json({ message: "You can only update your own items" });
      }
      const updatedItem = await storage.updateItem(id, itemData);
      if (!updatedItem) {
        return res.status(404).json({ message: "Item not found" });
      }
      const images = await storage.getImagesByItem(id);
      res.json({
        ...updatedItem,
        images
      });
    } catch (error) {
      console.error("Error updating item:", error);
      res.status(500).json({ message: "Error updating item" });
    }
  });
  app2.delete("/api/items/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.session.userId;
      const item = await storage.getItem(id);
      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }
      if (item.userId !== userId) {
        return res.status(403).json({ message: "You can only delete your own items" });
      }
      const success = await storage.deleteItem(id);
      if (!success) {
        return res.status(500).json({ message: "Failed to delete item" });
      }
      res.status(200).json({ message: "Item deleted successfully" });
    } catch (error) {
      console.error("Error deleting item:", error);
      res.status(500).json({ message: "Error deleting item" });
    }
  });
  app2.post("/api/items/:id/images", isAuthenticated, upload.array("images", 10), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.session.userId;
      const item = await storage.getItem(id);
      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }
      if (item.userId !== userId) {
        return res.status(403).json({ message: "You can only add images to your own items" });
      }
      const files = req.files;
      if (!files || files.length === 0) {
        return res.status(400).json({ message: "No images uploaded" });
      }
      const images = [];
      for (const file of files) {
        const filePath = `/uploads/items/${file.filename}`;
        const image = await storage.createImage({
          itemId: id,
          filePath,
          isMain: false
        });
        images.push(image);
      }
      res.status(201).json(images);
    } catch (error) {
      console.error("Error adding images:", error);
      res.status(500).json({ message: "Error adding images" });
    }
  });
  app2.patch("/api/items/:itemId/images/:imageId/main", isAuthenticated, async (req, res) => {
    try {
      const itemId = parseInt(req.params.itemId);
      const imageId = parseInt(req.params.imageId);
      const userId = req.session.userId;
      const item = await storage.getItem(itemId);
      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }
      if (item.userId !== userId) {
        return res.status(403).json({ message: "You can only update images of your own items" });
      }
      const success = await storage.setMainImage(imageId, itemId);
      if (!success) {
        return res.status(500).json({ message: "Failed to set main image" });
      }
      const images = await storage.getImagesByItem(itemId);
      res.json(images);
    } catch (error) {
      console.error("Error setting main image:", error);
      res.status(500).json({ message: "Error setting main image" });
    }
  });
  app2.delete("/api/items/:itemId/images/:imageId", isAuthenticated, async (req, res) => {
    try {
      const itemId = parseInt(req.params.itemId);
      const imageId = parseInt(req.params.imageId);
      const userId = req.session.userId;
      const item = await storage.getItem(itemId);
      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }
      if (item.userId !== userId) {
        return res.status(403).json({ message: "You can only delete images of your own items" });
      }
      const success = await storage.deleteImage(imageId);
      if (!success) {
        return res.status(500).json({ message: "Failed to delete image" });
      }
      const images = await storage.getImagesByItem(itemId);
      res.json(images);
    } catch (error) {
      console.error("Error deleting image:", error);
      res.status(500).json({ message: "Error deleting image" });
    }
  });
  app2.get("/api/favorites", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId;
      const favorites = await storage.getFavoritesByUser(userId);
      res.json(favorites);
    } catch (error) {
      console.error("Error getting favorites:", error);
      res.status(500).json({ message: "Error getting favorites" });
    }
  });
  app2.post("/api/favorites/:itemId", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId;
      const itemId = parseInt(req.params.itemId);
      const item = await storage.getItem(itemId);
      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }
      const isFavorite = await storage.isFavorite(userId, itemId);
      if (isFavorite) {
        return res.status(400).json({ message: "Item already in favorites" });
      }
      const favorite = await storage.addFavorite({
        userId,
        itemId
      });
      res.status(201).json(favorite);
    } catch (error) {
      console.error("Error adding favorite:", error);
      res.status(500).json({ message: "Error adding favorite" });
    }
  });
  app2.delete("/api/favorites/:itemId", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId;
      const itemId = parseInt(req.params.itemId);
      const success = await storage.removeFavorite(userId, itemId);
      if (!success) {
        return res.status(500).json({ message: "Failed to remove favorite" });
      }
      res.status(200).json({ message: "Favorite removed successfully" });
    } catch (error) {
      console.error("Error removing favorite:", error);
      res.status(500).json({ message: "Error removing favorite" });
    }
  });
  app2.get("/api/conversations", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId;
      const conversations = await storage.getConversationsByUser(userId);
      res.json(conversations);
    } catch (error) {
      console.error("Error getting conversations:", error);
      res.status(500).json({ message: "Error getting conversations" });
    }
  });
  app2.get("/api/conversations/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.session.userId;
      const conversation = await storage.getConversation(id);
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }
      const isParticipant = conversation.participants.some((p) => p.id === userId);
      if (!isParticipant) {
        return res.status(403).json({ message: "You do not have access to this conversation" });
      }
      const messages = await storage.getMessagesByConversation(id);
      await storage.markMessagesAsRead(id, userId);
      res.json({
        conversation,
        messages
      });
    } catch (error) {
      console.error("Error getting conversation:", error);
      res.status(500).json({ message: "Error getting conversation" });
    }
  });
  app2.post("/api/conversations", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId;
      const { recipientId, itemId, message } = req.body;
      if (!recipientId || !message) {
        return res.status(400).json({ message: "Recipient ID and message are required" });
      }
      const recipientIdNum = parseInt(recipientId);
      const recipient = await storage.getUser(recipientIdNum);
      if (!recipient) {
        return res.status(404).json({ message: "Recipient not found" });
      }
      if (itemId) {
        const item = await storage.getItem(parseInt(itemId));
        if (!item) {
          return res.status(404).json({ message: "Item not found" });
        }
      }
      let conversation = await storage.getConversationByParticipants(
        userId,
        recipientIdNum,
        itemId ? parseInt(itemId) : void 0
      );
      if (!conversation) {
        const newConversation = await storage.createConversation(
          {
            itemId: itemId ? parseInt(itemId) : null,
            lastMessageAt: /* @__PURE__ */ new Date()
          },
          [
            {
              userId,
              conversationId: 0
              // Will be set by the storage implementation
            },
            {
              userId: recipientIdNum,
              conversationId: 0
              // Will be set by the storage implementation
            }
          ]
        );
        conversation = await storage.getConversation(newConversation.id);
      }
      if (!conversation) {
        return res.status(500).json({ message: "Failed to create conversation" });
      }
      const newMessage = await storage.createMessage({
        conversationId: conversation.id,
        senderId: userId,
        content: message,
        isRead: false
      });
      await storage.updateConversationLastMessage(conversation.id);
      await storage.createNotification({
        userId: recipientIdNum,
        type: "message",
        content: `Yeni mesaj: ${message.substring(0, 50)}${message.length > 50 ? "..." : ""}`,
        referenceId: newMessage.id,
        isRead: false
      });
      broadcast({
        type: "new_message",
        userId: recipientIdNum,
        conversationId: conversation.id,
        message: newMessage
      });
      const messages = await storage.getMessagesByConversation(conversation.id);
      res.status(201).json({
        conversation,
        messages
      });
    } catch (error) {
      console.error("Error creating conversation:", error);
      res.status(500).json({ message: "Error creating conversation" });
    }
  });
  app2.post("/api/conversations/:id/messages", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.session.userId;
      const { message } = req.body;
      if (!message) {
        return res.status(400).json({ message: "Message content is required" });
      }
      const conversation = await storage.getConversation(id);
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }
      const isParticipant = conversation.participants.some((p) => p.id === userId);
      if (!isParticipant) {
        return res.status(403).json({ message: "You do not have access to this conversation" });
      }
      const otherParticipant = conversation.participants.find((p) => p.id !== userId);
      if (!otherParticipant) {
        return res.status(500).json({ message: "Could not find other participant" });
      }
      const newMessage = await storage.createMessage({
        conversationId: id,
        senderId: userId,
        content: message,
        isRead: false
      });
      await storage.updateConversationLastMessage(id);
      await storage.createNotification({
        userId: otherParticipant.id,
        type: "message",
        content: `Yeni mesaj: ${message.substring(0, 50)}${message.length > 50 ? "..." : ""}`,
        referenceId: newMessage.id,
        isRead: false
      });
      broadcast({
        type: "new_message",
        userId: otherParticipant.id,
        conversationId: id,
        message: newMessage
      });
      const messageWithSender = await storage.getMessage(newMessage.id);
      res.status(201).json(messageWithSender);
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ message: "Error sending message" });
    }
  });
  app2.get("/api/offers", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId;
      const { status } = req.query;
      const offers = await storage.getOffersByUser(userId, status);
      res.json(offers);
    } catch (error) {
      console.error("Error getting offers:", error);
      res.status(500).json({ message: "Error getting offers" });
    }
  });
  app2.get("/api/offers/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.session.userId;
      const offer = await storage.getOffer(id);
      if (!offer) {
        return res.status(404).json({ message: "Offer not found" });
      }
      if (offer.fromUserId !== userId && offer.toUserId !== userId) {
        return res.status(403).json({ message: "You do not have access to this offer" });
      }
      res.json(offer);
    } catch (error) {
      console.error("Error getting offer:", error);
      res.status(500).json({ message: "Error getting offer" });
    }
  });
  app2.post("/api/offers", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId;
      const { toUserId, fromItemId, toItemId, message } = req.body;
      if (!toUserId || !fromItemId || !toItemId) {
        return res.status(400).json({ message: "Recipient ID, from item ID, and to item ID are required" });
      }
      const toUserIdNum = parseInt(toUserId);
      const fromItemIdNum = parseInt(fromItemId);
      const toItemIdNum = parseInt(toItemId);
      const recipient = await storage.getUser(toUserIdNum);
      if (!recipient) {
        return res.status(404).json({ message: "Recipient not found" });
      }
      const fromItem = await storage.getItem(fromItemIdNum);
      if (!fromItem) {
        return res.status(404).json({ message: "From item not found" });
      }
      if (fromItem.userId !== userId) {
        return res.status(403).json({ message: "You can only offer your own items" });
      }
      const toItem = await storage.getItem(toItemIdNum);
      if (!toItem) {
        return res.status(404).json({ message: "To item not found" });
      }
      if (toItem.userId !== toUserIdNum) {
        return res.status(403).json({ message: "You can only request items from their owner" });
      }
      const offer = await storage.createOffer({
        fromUserId: userId,
        toUserId: toUserIdNum,
        fromItemId: fromItemIdNum,
        toItemId: toItemIdNum,
        status: "pending",
        message: message || null
      });
      await storage.createNotification({
        userId: toUserIdNum,
        type: "offer",
        content: `Yeni barter t\u0259klifi: "${fromItem.title}" \u0259\u015Fyan\u0131z \xFC\xE7\xFCn "${toItem.title}"`,
        referenceId: offer.id,
        isRead: false
      });
      let conversation = await storage.getConversationByParticipants(userId, toUserIdNum);
      if (!conversation) {
        const newConversation = await storage.createConversation(
          {
            itemId: toItemIdNum,
            lastMessageAt: /* @__PURE__ */ new Date()
          },
          [
            {
              userId,
              conversationId: 0
              // Will be set by the storage implementation
            },
            {
              userId: toUserIdNum,
              conversationId: 0
              // Will be set by the storage implementation
            }
          ]
        );
        conversation = await storage.getConversation(newConversation.id);
      }
      if (conversation) {
        await storage.createMessage({
          conversationId: conversation.id,
          senderId: userId,
          content: `Barter t\u0259klifi yaratd\u0131m: "${fromItem.title}" \u0259\u015Fyam\u0131 "${toItem.title}" \u0259\u015Fyan\u0131z \xFC\xE7\xFCn t\u0259klif edir\u0259m.`,
          isRead: false
        });
        await storage.updateConversationLastMessage(conversation.id);
      }
      broadcast({
        type: "new_offer",
        userId: toUserIdNum,
        offer
      });
      res.status(201).json(offer);
    } catch (error) {
      console.error("Error creating offer:", error);
      res.status(500).json({ message: "Error creating offer" });
    }
  });
  app2.patch("/api/offers/:id/status", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.session.userId;
      const { status } = req.body;
      if (!status || !["accepted", "rejected", "completed", "cancelled"].includes(status)) {
        return res.status(400).json({ message: "Valid status is required" });
      }
      const offer = await storage.getOffer(id);
      if (!offer) {
        return res.status(404).json({ message: "Offer not found" });
      }
      if (status === "accepted" || status === "rejected") {
        if (offer.toUserId !== userId) {
          return res.status(403).json({ message: "Only the recipient can accept or reject offers" });
        }
      } else if (status === "completed") {
        if (offer.fromUserId !== userId && offer.toUserId !== userId) {
          return res.status(403).json({ message: "You are not involved in this offer" });
        }
        if (offer.status !== "accepted") {
          return res.status(400).json({ message: "Only accepted offers can be completed" });
        }
      } else if (status === "cancelled") {
        if (offer.fromUserId !== userId) {
          return res.status(403).json({ message: "Only the sender can cancel offers" });
        }
        if (offer.status !== "pending") {
          return res.status(400).json({ message: "Only pending offers can be cancelled" });
        }
      }
      const updatedOffer = await storage.updateOfferStatus(id, status);
      if (!updatedOffer) {
        return res.status(500).json({ message: "Failed to update offer status" });
      }
      const otherUserId = offer.fromUserId === userId ? offer.toUserId : offer.fromUserId;
      let notificationContent = "";
      if (status === "accepted") {
        notificationContent = "Barter t\u0259klifiniz q\u0259bul edildi!";
      } else if (status === "rejected") {
        notificationContent = "Barter t\u0259klifiniz r\u0259dd edildi.";
      } else if (status === "completed") {
        notificationContent = "Barter \u0259m\u0259liyyat\u0131 tamamland\u0131!";
      } else if (status === "cancelled") {
        notificationContent = "Barter t\u0259klifiniz l\u0259\u011Fv edildi.";
      }
      if (notificationContent) {
        await storage.createNotification({
          userId: otherUserId,
          type: "offer_update",
          content: notificationContent,
          referenceId: id,
          isRead: false
        });
      }
      const conversation = await storage.getConversationByParticipants(
        offer.fromUserId,
        offer.toUserId
      );
      if (conversation) {
        await storage.createMessage({
          conversationId: conversation.id,
          senderId: userId,
          content: `Barter t\u0259klifi ${status === "accepted" ? "q\u0259bul edildi" : status === "rejected" ? "r\u0259dd edildi" : status === "completed" ? "tamamland\u0131" : "l\u0259\u011Fv edildi"}.`,
          isRead: false
        });
        await storage.updateConversationLastMessage(conversation.id);
      }
      broadcast({
        type: "offer_updated",
        userId: otherUserId,
        offer: updatedOffer
      });
      res.json(updatedOffer);
    } catch (error) {
      console.error("Error updating offer status:", error);
      res.status(500).json({ message: "Error updating offer status" });
    }
  });
  app2.get("/api/users/:id/reviews", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const reviews = await storage.getReviewsByUser(userId);
      res.json(reviews);
    } catch (error) {
      console.error("Error getting reviews:", error);
      res.status(500).json({ message: "Error getting reviews" });
    }
  });
  app2.get("/api/users/:id/rating", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const rating = await storage.getUserRating(userId);
      res.json(rating);
    } catch (error) {
      console.error("Error getting user rating:", error);
      res.status(500).json({ message: "Error getting user rating" });
    }
  });
  app2.post("/api/offers/:id/reviews", isAuthenticated, async (req, res) => {
    try {
      const offerId = parseInt(req.params.id);
      const userId = req.session.userId;
      const { rating, comment } = req.body;
      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ message: "Rating is required and must be between 1 and 5" });
      }
      const offer = await storage.getOffer(offerId);
      if (!offer) {
        return res.status(404).json({ message: "Offer not found" });
      }
      if (offer.fromUserId !== userId && offer.toUserId !== userId) {
        return res.status(403).json({ message: "You are not involved in this offer" });
      }
      if (offer.status !== "completed") {
        return res.status(400).json({ message: "You can only review completed offers" });
      }
      const canReview = await storage.canReviewOffer(offerId, userId);
      if (!canReview) {
        return res.status(400).json({ message: "You have already reviewed this offer" });
      }
      const toUserId = offer.fromUserId === userId ? offer.toUserId : offer.fromUserId;
      const review = await storage.createReview({
        offerId,
        fromUserId: userId,
        toUserId,
        rating,
        comment: comment || null
      });
      await storage.createNotification({
        userId: toUserId,
        type: "review",
        content: `Yeni r\u0259y ald\u0131n\u0131z: ${rating} ulduz` + (comment ? `: "${comment}"` : ""),
        referenceId: review.id,
        isRead: false
      });
      broadcast({
        type: "new_review",
        userId: toUserId,
        review
      });
      res.status(201).json(review);
    } catch (error) {
      console.error("Error creating review:", error);
      res.status(500).json({ message: "Error creating review" });
    }
  });
  app2.get("/api/notifications", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId;
      const { includeRead, limit, offset } = req.query;
      const options = {
        includeRead: includeRead === "true",
        limit: limit ? parseInt(limit) : void 0,
        offset: offset ? parseInt(offset) : void 0
      };
      const notifications = await storage.getNotificationsByUser(userId, options);
      res.json(notifications);
    } catch (error) {
      console.error("Error getting notifications:", error);
      res.status(500).json({ message: "Error getting notifications" });
    }
  });
  app2.get("/api/notifications/count", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId;
      const count = await storage.getUnreadNotificationsCount(userId);
      res.json({ count });
    } catch (error) {
      console.error("Error getting notification count:", error);
      res.status(500).json({ message: "Error getting notification count" });
    }
  });
  app2.patch("/api/notifications/:id/read", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.session.userId;
      const success = await storage.markNotificationAsRead(id, userId);
      if (!success) {
        return res.status(500).json({ message: "Failed to mark notification as read" });
      }
      res.status(200).json({ message: "Notification marked as read" });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Error marking notification as read" });
    }
  });
  app2.patch("/api/notifications/read-all", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId;
      const success = await storage.markAllNotificationsAsRead(userId);
      if (!success) {
        return res.status(500).json({ message: "Failed to mark all notifications as read" });
      }
      res.status(200).json({ message: "All notifications marked as read" });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({ message: "Error marking all notifications as read" });
    }
  });
  app2.post("/api/users/me/avatar", isAuthenticated, upload.single("avatar"), async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      if (user.avatar && user.avatar.startsWith("/uploads/avatars/")) {
        try {
          const oldAvatarPath = path.join(process.cwd(), "public", user.avatar);
          if (fs.existsSync(oldAvatarPath)) {
            fs.unlinkSync(oldAvatarPath);
          }
        } catch (error) {
          console.error("Failed to delete old avatar:", error);
        }
      }
      const avatarUrl = `/uploads/avatars/${req.file.filename}`;
      const updatedUser = await storage.updateUser(userId, { avatar: avatarUrl });
      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to update avatar" });
      }
      const { password, ...userWithoutPassword } = updatedUser;
      res.json({
        ...userWithoutPassword,
        avatarUrl
      });
    } catch (error) {
      console.error("Error uploading avatar:", error);
      res.status(500).json({ message: "Error uploading avatar" });
    }
  });
  app2.get("/api/admin/users", isAdmin, async (req, res) => {
    try {
      const search = req.query.search;
      const users = await storage.getAllUsers(search);
      const usersWithoutPasswords = users.map((user) => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      res.json(usersWithoutPasswords);
    } catch (error) {
      console.error("Error getting admin users:", error);
      res.status(500).json({ message: "Error getting users" });
    }
  });
  app2.get("/api/admin/users/:id", isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const items = await storage.getItemsByUser(userId);
      const rating = await storage.getUserRating(userId);
      const { password, ...userWithoutPassword } = user;
      res.json({
        ...userWithoutPassword,
        itemsCount: items.length,
        rating
      });
    } catch (error) {
      console.error("Error getting admin user:", error);
      res.status(500).json({ message: "Error getting user" });
    }
  });
  app2.patch("/api/admin/users/:id/role", isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { role } = req.body;
      if (!role || !["user", "admin"].includes(role)) {
        return res.status(400).json({ message: "Valid role is required" });
      }
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const updatedUser = await storage.updateUser(userId, { role });
      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to update user role" });
      }
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Error updating user role" });
    }
  });
  app2.patch("/api/admin/users/:id/status", isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { active } = req.body;
      if (typeof active !== "boolean") {
        return res.status(400).json({ message: "Valid status is required" });
      }
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const updatedUser = await storage.updateUser(userId, { active });
      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to update user status" });
      }
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error updating user status:", error);
      res.status(500).json({ message: "Error updating user status" });
    }
  });
  app2.get("/api/admin/items", isAdmin, async (req, res) => {
    try {
      const { category, status, search, userId, limit, offset } = req.query;
      const options = {};
      if (category) options.category = category;
      if (status) options.status = status;
      if (search) options.search = search;
      if (userId) options.userId = parseInt(userId);
      if (limit) options.limit = parseInt(limit);
      if (offset) options.offset = parseInt(offset);
      const items = await storage.getItems(options);
      const itemsWithDetails = await Promise.all(items.map(async (item) => {
        const images = await storage.getImagesByItem(item.id);
        const mainImage = images.find((img) => img.isMain)?.filePath || (images.length > 0 ? images[0].filePath : null);
        const owner = await storage.getUser(item.userId);
        return {
          ...item,
          mainImage,
          owner: owner ? {
            id: owner.id,
            username: owner.username,
            fullName: owner.fullName
          } : null
        };
      }));
      res.json(itemsWithDetails);
    } catch (error) {
      console.error("Error getting admin items:", error);
      res.status(500).json({ message: "Error getting items" });
    }
  });
  app2.patch("/api/admin/items/:id/status", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      if (!status || !["active", "pending", "suspended", "completed"].includes(status)) {
        return res.status(400).json({ message: "Valid status is required" });
      }
      const updatedItem = await storage.updateItem(id, { status });
      if (!updatedItem) {
        return res.status(500).json({ message: "Failed to update item status" });
      }
      res.json(updatedItem);
    } catch (error) {
      console.error("Error updating item status:", error);
      res.status(500).json({ message: "Error updating item status" });
    }
  });
  app2.delete("/api/admin/items/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteItem(id);
      if (!success) {
        return res.status(500).json({ message: "Failed to delete item" });
      }
      res.json({ message: "Item deleted successfully" });
    } catch (error) {
      console.error("Error deleting item:", error);
      res.status(500).json({ message: "Error deleting item" });
    }
  });
  app2.get("/api/admin/stats", isAdmin, async (req, res) => {
    try {
      const period = req.query.period || "week";
      const mockStats = {
        users: {
          total: 100,
          new: 12,
          active: 78
        },
        items: {
          total: 250,
          active: 180,
          completed: 45
        },
        offers: {
          total: 320,
          accepted: 150,
          rejected: 70
        },
        activities: [
          { date: "2023-03-01", users: 5, items: 12, offers: 18 },
          { date: "2023-03-02", users: 8, items: 15, offers: 22 },
          { date: "2023-03-03", users: 3, items: 9, offers: 14 },
          { date: "2023-03-04", users: 7, items: 18, offers: 25 },
          { date: "2023-03-05", users: 9, items: 21, offers: 30 },
          { date: "2023-03-06", users: 6, items: 14, offers: 20 },
          { date: "2023-03-07", users: 11, items: 26, offers: 35 }
        ]
      };
      res.json(mockStats);
    } catch (error) {
      console.error("Error getting admin stats:", error);
      res.status(500).json({ message: "Error getting statistics" });
    }
  });
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs2 from "fs";
import path3, { dirname as dirname2 } from "path";
import { fileURLToPath as fileURLToPath2 } from "url";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path2, { dirname } from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { fileURLToPath } from "url";
var __filename = fileURLToPath(import.meta.url);
var __dirname = dirname(__filename);
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    themePlugin(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path2.resolve(__dirname, "client", "src"),
      "@shared": path2.resolve(__dirname, "shared")
    }
  },
  root: path2.resolve(__dirname, "client"),
  build: {
    outDir: path2.resolve(__dirname, "dist/public"),
    emptyOutDir: true
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var __filename2 = fileURLToPath2(import.meta.url);
var __dirname2 = dirname2(__filename2);
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path3.resolve(
        __dirname2,
        "..",
        "client",
        "index.html"
      );
      let template = await fs2.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path3.resolve(__dirname2, "public");
  if (!fs2.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path3.resolve(distPath, "index.html"));
  });
}

// server/index.ts
import path4 from "path";
import fs3 from "fs";
import dotenv2 from "dotenv";
import cors from "cors";

// server/session.ts
import session from "express-session";
import memoryStore from "memorystore";
import dotenv from "dotenv";
dotenv.config();
var generateFixedSecret = () => {
  return "3Jn32d8aHx9kQmP5sT7wYzR4vF6gC1pE2022BakterTap";
};
var SESSION_SECRET = generateFixedSecret();
var MemoryStore = memoryStore(session);
function configureSession() {
  const sessionSecret = process.env.SESSION_SECRET || SESSION_SECRET;
  console.log("Session configuration:");
  console.log("- Secret length:", sessionSecret.length);
  console.log("- Session cookie name: bartertap");
  const sessionOptions = {
    name: "bartertap",
    // Most important! Single consistent name
    secret: sessionSecret,
    resave: false,
    // Only save when session is modified
    saveUninitialized: false,
    // Don't create sessions for non-authenticated users
    rolling: true,
    // Reset expiration on each response
    unset: "destroy",
    // Remove session when req.session is nulled
    cookie: {
      secure: process.env.NODE_ENV === "production",
      // Only use secure in production
      httpOnly: true,
      // Prevent JavaScript access to cookie
      sameSite: "lax",
      // Relaxed cross-origin policy
      maxAge: 1e3 * 60 * 60 * 24 * 14,
      // 14 days
      path: "/"
      // Available on entire site
    },
    store: new MemoryStore({
      checkPeriod: 864e5,
      // Prune expired entries every 24h
      stale: false
      // Don't return expired sessions
    })
  };
  if (process.env.NODE_ENV === "production" && process.env.DATABASE_URL) {
    try {
      const pgSession = __require("connect-pg-simple")(session);
      const sessionStore = new pgSession({
        conObject: {
          connectionString: process.env.DATABASE_URL,
          ssl: process.env.NODE_ENV === "production"
        },
        tableName: "sessions",
        createTableIfMissing: true
      });
      sessionOptions.store = sessionStore;
      console.log("Using PostgreSQL session store");
    } catch (error) {
      console.error("Failed to initialize PostgreSQL session store, fallback to Memory store:", error);
    }
  } else {
    console.log("Using Memory session store");
  }
  return session(sessionOptions);
}

// server/index.ts
import { fileURLToPath as fileURLToPath3 } from "url";
import { dirname as dirname3 } from "path";
import cookieParser from "cookie-parser";
var __filename3 = fileURLToPath3(import.meta.url);
var __dirname3 = dirname3(__filename3);
dotenv2.config();
var uploadsDir = path4.join(process.cwd(), "public/uploads");
var avatarsDir = path4.join(uploadsDir, "avatars");
var itemsDir = path4.join(uploadsDir, "items");
if (!fs3.existsSync(uploadsDir)) fs3.mkdirSync(uploadsDir, { recursive: true });
if (!fs3.existsSync(avatarsDir)) fs3.mkdirSync(avatarsDir, { recursive: true });
if (!fs3.existsSync(itemsDir)) fs3.mkdirSync(itemsDir, { recursive: true });
var app = express2();
app.use(express2.json({ limit: "10mb" }));
app.use(express2.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());
var corsOptions = {
  origin: process.env.NODE_ENV === "production" ? ["https://bartertap.az", "https://www.bartertap.az"] : true,
  // Allow all origins in development
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  exposedHeaders: ["X-Session-ID"]
  // Expose custom headers for debugging
};
app.use(cors(corsOptions));
var sessionMiddleware = configureSession();
app.use(sessionMiddleware);
app.use((req, res, next) => {
  console.log("REQUEST COOKIES:", req.headers.cookie);
  if (req.headers.cookie && (req.headers.cookie.includes("bartertap.sid") || req.headers.cookie.includes("bartertap_sid") || req.headers.cookie.includes("connect.sid") || req.headers.cookie.includes("bartersession"))) {
    if (!req.headers.cookie.includes("bartertap=")) {
      res.clearCookie("bartertap.sid", { path: "/" });
      res.clearCookie("bartertap_sid", { path: "/" });
      res.clearCookie("connect.sid", { path: "/" });
      res.clearCookie("bartersession", { path: "/" });
      console.log("Cleared old session cookies");
    }
  }
  next();
});
app.use((req, res, next) => {
  const start = Date.now();
  const path5 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path5.startsWith("/api")) {
      let logLine = `${req.method} ${path5} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
var localesPath = path4.join(process.cwd(), "public/locales");
app.use("/locales", express2.static(localesPath));
app.use("/uploads", express2.static(path4.join(process.cwd(), "public/uploads")));
(async () => {
  try {
    const server = await registerRoutes(app);
    app.use((err, _req, res, _next) => {
      console.error("Application error:", err);
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      res.status(status).json({ message });
    });
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }
    const port = process.env.PORT || 5e3;
    server.listen({
      port: Number(port),
      host: "0.0.0.0",
      reusePort: true
    }, () => {
      log(`Server running on port ${port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
})();
