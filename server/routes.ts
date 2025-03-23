import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage as dbStorage } from "./storage";
import { z } from "zod";
import { insertUserSchema, insertItemSchema, insertMessageSchema, insertOfferSchema, insertFavoriteSchema, insertNotificationSchema, insertPushSubscriptionSchema } from "@shared/schema";
import { WebSocketServer } from 'ws';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Session interface
declare module 'express-session' {
  interface SessionData {
    userId: number | null;
    username: string | null;
  }
}

// Utility to check if user is authenticated
const isAuthenticated = (req: Request, res: Response): boolean => {
  if (!req.session.userId) {
    res.status(401).json({ message: 'Unauthorized: You must be logged in' });
    return false;
  }
  return true;
};

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/avatars');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, 'avatar-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// WebSocket clients 
const clients = new Map<number, WebSocket>();

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // WebSocket server for real-time messages
  const wss = new WebSocketServer({ 
    server: httpServer,
    path: '/api/ws'  // Specific path for our WebSocket to avoid conflict with Vite
  });

  wss.on('connection', (ws: WebSocket, req) => {
    const userId = parseInt(new URL(req.url || '', 'http://localhost').searchParams.get('userId') || '0');
    
    if (userId > 0) {
      clients.set(userId, ws);
      
      ws.addEventListener('close', () => {
        clients.delete(userId);
      });
      
      ws.addEventListener('message', async (event: MessageEvent) => {
        const message = event.data.toString();
        try {
          const data = JSON.parse(message);
          
          if (data.type === 'message' && data.conversationId && data.content) {
            const newMessage = await storage.createMessage({
              conversationId: data.conversationId,
              senderId: userId,
              content: data.content,
              status: 'sent'
            });
            
            // Get the full message with sender info
            const fullMessage = await storage.getMessage(newMessage.id);
            if (!fullMessage) return;
            
            // Find other participants in this conversation
            const conversation = await storage.getConversation(data.conversationId);
            if (!conversation) return;
            
            // Send to all other participants who are connected
            conversation.participants.forEach(participant => {
              if (participant.id !== userId && clients.has(participant.id)) {
                const client = clients.get(participant.id);
                client?.send(JSON.stringify({
                  type: 'message',
                  message: fullMessage
                }));
              }
            });
            
            // Create a notification for other participants
            conversation.participants.forEach(async (participant) => {
              if (participant.id !== userId) {
                await storage.createNotification({
                  userId: participant.id,
                  type: 'message',
                  referenceId: data.conversationId,
                  content: `New message from ${fullMessage.sender.username}`
                });
                
                // Send notification to connected user
                if (clients.has(participant.id)) {
                  const client = clients.get(participant.id);
                  const count = await storage.getUnreadNotificationsCount(participant.id);
                  client?.send(JSON.stringify({
                    type: 'notification_count',
                    count
                  }));
                }
              }
            });
          }
        } catch (err) {
          console.error('WebSocket message error:', err);
        }
      });
    }
  });

  // Auth routes
  app.post('/api/auth/register', async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if username exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: 'Username already exists' });
      }
      
      // Check if email exists
      const existingEmail = await storage.getUserByEmail(userData.email);
      if (existingEmail) {
        return res.status(400).json({ message: 'Email already exists' });
      }
      
      // Create user
      const user = await storage.createUser(userData);
      
      // Save user to session
      req.session.userId = user.id;
      req.session.username = user.username;
      
      // Return user data without password
      const { password, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: 'Failed to register user' });
    }
  });
  
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
      }
      
      // Find user
      const user = await storage.getUserByUsername(username);
      if (!user || user.password !== password) {
        return res.status(401).json({ message: 'Invalid username or password' });
      }
      
      // Save user to session
      req.session.userId = user.id;
      req.session.username = user.username;
      
      // Return user data without password
      const { password: _, ...userWithoutPassword } = user;
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: 'Failed to login' });
    }
  });
  
  app.post('/api/auth/logout', (req, res) => {
    req.session.destroy(err => {
      if (err) {
        return res.status(500).json({ message: 'Failed to logout' });
      }
      
      res.status(200).json({ message: 'Logged out successfully' });
    });
  });
  
  app.get('/api/auth/me', async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Return user data without password
      const { password, ...userWithoutPassword } = user;
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get user data' });
    }
  });
  
  // User routes
  app.get('/api/users/:id', async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Return user data without password
      const { password, ...userWithoutPassword } = user;
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get user data' });
    }
  });
  
  app.put('/api/users/me', async (req, res) => {
    if (!isAuthenticated(req, res)) return;
    
    try {
      const userId = req.session.userId!;
      const userData = req.body;
      
      // Don't allow password updates through this endpoint
      if (userData.password) {
        delete userData.password;
      }
      
      const updatedUser = await storage.updateUser(userId, userData);
      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Return user data without password
      const { password, ...userWithoutPassword } = updatedUser;
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update user' });
    }
  });
  
  // Avatar upload route
  app.post('/api/users/me/avatar', upload.single('avatar'), async (req, res) => {
    if (!isAuthenticated(req, res)) return;
    
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    try {
      const userId = req.session.userId!;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // If user already has an avatar, delete the old file to save space
      if (user.avatar && user.avatar.startsWith('/uploads/avatars/')) {
        const oldAvatarPath = path.join('public', user.avatar);
        try {
          if (fs.existsSync(oldAvatarPath)) {
            fs.unlinkSync(oldAvatarPath);
          }
        } catch (err) {
          console.error('Failed to delete old avatar:', err);
        }
      }
      
      // Save the new avatar path to the user's record
      const avatarUrl = `/uploads/avatars/${req.file.filename}`;
      const updatedUser = await storage.updateUser(userId, { avatar: avatarUrl });
      
      if (!updatedUser) {
        return res.status(500).json({ message: 'Failed to update user avatar' });
      }
      
      // Return user data without password
      const { password, ...userWithoutPassword } = updatedUser;
      res.status(200).json({ ...userWithoutPassword, avatarUrl });
    } catch (error) {
      res.status(500).json({ message: 'Failed to upload avatar' });
    }
  });
  
  // Item routes
  app.get('/api/items', async (req, res) => {
    try {
      const category = req.query.category as string | undefined;
      const search = req.query.search as string | undefined;
      const status = req.query.status as string | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : undefined;
      
      const items = await storage.getItems({ category, search, status, limit, offset });
      
      // Get image for each item
      const itemsWithImages = await Promise.all(items.map(async (item) => {
        const images = await storage.getImagesByItem(item.id);
        const mainImage = images.find(img => img.isMain)?.filePath || images[0]?.filePath;
        return { ...item, mainImage };
      }));
      
      res.status(200).json(itemsWithImages);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get items' });
    }
  });
  
  app.get('/api/items/:id', async (req, res) => {
    try {
      const itemId = parseInt(req.params.id);
      
      const item = await storage.getItem(itemId);
      if (!item) {
        return res.status(404).json({ message: 'Item not found' });
      }
      
      // Get images
      const images = await storage.getImagesByItem(itemId);
      
      // Get owner
      const owner = await storage.getUser(item.userId);
      if (!owner) {
        return res.status(404).json({ message: 'Item owner not found' });
      }
      
      // Don't send owner's password
      const { password, ...ownerWithoutPassword } = owner;
      
      // Check if favorite for current user
      let isFavorite = false;
      if (req.session.userId) {
        isFavorite = await storage.isFavorite(req.session.userId, itemId);
      }
      
      res.status(200).json({
        ...item,
        images,
        owner: ownerWithoutPassword,
        isFavorite
      });
    } catch (error) {
      res.status(500).json({ message: 'Failed to get item' });
    }
  });
  
  app.post('/api/items', async (req, res) => {
    if (!isAuthenticated(req, res)) return;
    
    try {
      const userId = req.session.userId!;
      const itemData = insertItemSchema.parse({
        ...req.body,
        userId
      });
      
      const item = await storage.createItem(itemData);
      res.status(201).json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: 'Failed to create item' });
    }
  });
  
  app.put('/api/items/:id', async (req, res) => {
    if (!isAuthenticated(req, res)) return;
    
    try {
      const itemId = parseInt(req.params.id);
      const userId = req.session.userId!;
      
      // Check if item exists and belongs to user
      const item = await storage.getItem(itemId);
      if (!item) {
        return res.status(404).json({ message: 'Item not found' });
      }
      
      if (item.userId !== userId) {
        return res.status(403).json({ message: 'You can only update your own items' });
      }
      
      // Update item
      const updatedItem = await storage.updateItem(itemId, req.body);
      if (!updatedItem) {
        return res.status(404).json({ message: 'Item not found' });
      }
      
      res.status(200).json(updatedItem);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update item' });
    }
  });
  
  app.delete('/api/items/:id', async (req, res) => {
    if (!isAuthenticated(req, res)) return;
    
    try {
      const itemId = parseInt(req.params.id);
      const userId = req.session.userId!;
      
      // Check if item exists and belongs to user
      const item = await storage.getItem(itemId);
      if (!item) {
        return res.status(404).json({ message: 'Item not found' });
      }
      
      if (item.userId !== userId) {
        return res.status(403).json({ message: 'You can only delete your own items' });
      }
      
      // Delete item
      await storage.deleteItem(itemId);
      
      res.status(200).json({ message: 'Item deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete item' });
    }
  });
  
  // Image routes
  app.post('/api/items/:id/images', async (req, res) => {
    if (!isAuthenticated(req, res)) return;
    
    try {
      const itemId = parseInt(req.params.id);
      const userId = req.session.userId!;
      
      // Check if item exists and belongs to user
      const item = await storage.getItem(itemId);
      if (!item) {
        return res.status(404).json({ message: 'Item not found' });
      }
      
      if (item.userId !== userId) {
        return res.status(403).json({ message: 'You can only add images to your own items' });
      }
      
      // This would be image upload logic - for now we'll just accept a file path
      const { filePath, isMain } = req.body;
      
      if (!filePath) {
        return res.status(400).json({ message: 'File path is required' });
      }
      
      const image = await storage.createImage({
        itemId,
        filePath,
        isMain: !!isMain
      });
      
      res.status(201).json(image);
    } catch (error) {
      res.status(500).json({ message: 'Failed to add image' });
    }
  });
  
  app.put('/api/items/:itemId/images/:imageId/main', async (req, res) => {
    if (!isAuthenticated(req, res)) return;
    
    try {
      const itemId = parseInt(req.params.itemId);
      const imageId = parseInt(req.params.imageId);
      const userId = req.session.userId!;
      
      // Check if item exists and belongs to user
      const item = await storage.getItem(itemId);
      if (!item) {
        return res.status(404).json({ message: 'Item not found' });
      }
      
      if (item.userId !== userId) {
        return res.status(403).json({ message: 'You can only update images for your own items' });
      }
      
      const success = await storage.setMainImage(imageId, itemId);
      if (!success) {
        return res.status(404).json({ message: 'Image not found' });
      }
      
      res.status(200).json({ message: 'Main image updated successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to update main image' });
    }
  });
  
  app.delete('/api/items/:itemId/images/:imageId', async (req, res) => {
    if (!isAuthenticated(req, res)) return;
    
    try {
      const itemId = parseInt(req.params.itemId);
      const imageId = parseInt(req.params.imageId);
      const userId = req.session.userId!;
      
      // Check if item exists and belongs to user
      const item = await storage.getItem(itemId);
      if (!item) {
        return res.status(404).json({ message: 'Item not found' });
      }
      
      if (item.userId !== userId) {
        return res.status(403).json({ message: 'You can only delete images for your own items' });
      }
      
      const success = await storage.deleteImage(imageId);
      if (!success) {
        return res.status(404).json({ message: 'Image not found' });
      }
      
      res.status(200).json({ message: 'Image deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete image' });
    }
  });
  
  // Conversation routes
  app.get('/api/conversations', async (req, res) => {
    if (!isAuthenticated(req, res)) return;
    
    try {
      const userId = req.session.userId!;
      
      const conversations = await storage.getConversationsByUser(userId);
      
      // Calculate unread counts and set other participant
      const enhancedConversations = conversations.map(conv => {
        // Find the other participant
        const otherParticipant = conv.participants.find(p => p.id !== userId) || null;
        
        // Calculate unread messages count
        let unreadCount = 0;
        if (conv.lastMessage && conv.lastMessage.senderId !== userId && conv.lastMessage.status !== 'read') {
          unreadCount = 1; // This is a simplification - should count all unread
        }
        
        return {
          ...conv,
          otherParticipant,
          unreadCount
        };
      });
      
      res.status(200).json(enhancedConversations);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get conversations' });
    }
  });
  
  app.get('/api/conversations/:id', async (req, res) => {
    if (!isAuthenticated(req, res)) return;
    
    try {
      const conversationId = parseInt(req.params.id);
      const userId = req.session.userId!;
      
      const conversation = await storage.getConversation(conversationId);
      if (!conversation) {
        return res.status(404).json({ message: 'Conversation not found' });
      }
      
      // Check if user is a participant
      const isParticipant = conversation.participants.some(p => p.id === userId);
      if (!isParticipant) {
        return res.status(403).json({ message: 'You are not a participant in this conversation' });
      }
      
      // Get messages
      const messages = await storage.getMessagesByConversation(conversationId);
      
      // Find the other participant
      const otherParticipant = conversation.participants.find(p => p.id !== userId) || null;
      
      // Mark messages as read
      await storage.markMessagesAsRead(conversationId, userId);
      
      res.status(200).json({
        conversation: {
          ...conversation,
          otherParticipant
        },
        messages
      });
    } catch (error) {
      res.status(500).json({ message: 'Failed to get conversation' });
    }
  });
  
  app.post('/api/conversations', async (req, res) => {
    if (!isAuthenticated(req, res)) return;
    
    try {
      const userId = req.session.userId!;
      const { otherUserId, itemId, message } = req.body;
      
      if (!otherUserId) {
        return res.status(400).json({ message: 'Other user ID is required' });
      }
      
      // Check if other user exists
      const otherUser = await storage.getUser(otherUserId);
      if (!otherUser) {
        return res.status(404).json({ message: 'Other user not found' });
      }
      
      // Check if item exists if provided
      if (itemId) {
        const item = await storage.getItem(itemId);
        if (!item) {
          return res.status(404).json({ message: 'Item not found' });
        }
      }
      
      // Check if conversation already exists
      const existingConversation = await storage.getConversationByParticipants(userId, otherUserId, itemId);
      
      let conversationId: number;
      
      if (existingConversation) {
        conversationId = existingConversation.id;
      } else {
        // Create new conversation
        const newConversation = await storage.createConversation(
          { itemId: itemId || null },
          [
            { userId, conversationId: 0 }, // conversationId will be set by storage
            { userId: otherUserId, conversationId: 0 }
          ]
        );
        
        conversationId = newConversation.id;
      }
      
      // Add message if provided
      if (message) {
        await storage.createMessage({
          conversationId,
          senderId: userId,
          content: message,
          status: 'sent'
        });
        
        // Create notification
        await storage.createNotification({
          userId: otherUserId,
          type: 'message',
          referenceId: conversationId,
          content: `New message from ${req.session.username}`
        });
        
        // Send notification via WebSocket if the user is connected
        if (clients.has(otherUserId)) {
          const client = clients.get(otherUserId);
          const count = await storage.getUnreadNotificationsCount(otherUserId);
          client?.send(JSON.stringify({
            type: 'notification_count',
            count
          }));
        }
      }
      
      const conversation = await storage.getConversation(conversationId);
      res.status(201).json(conversation);
    } catch (error) {
      res.status(500).json({ message: 'Failed to create conversation' });
    }
  });
  
  // Message routes
  app.post('/api/messages', async (req, res) => {
    if (!isAuthenticated(req, res)) return;
    
    try {
      const userId = req.session.userId!;
      const messageData = insertMessageSchema.parse({
        ...req.body,
        senderId: userId,
        status: 'sent'
      });
      
      // Check if conversation exists and user is a participant
      const conversation = await storage.getConversation(messageData.conversationId);
      if (!conversation) {
        return res.status(404).json({ message: 'Conversation not found' });
      }
      
      const isParticipant = conversation.participants.some(p => p.id === userId);
      if (!isParticipant) {
        return res.status(403).json({ message: 'You are not a participant in this conversation' });
      }
      
      // Create message
      const message = await storage.createMessage(messageData);
      
      // Get full message with sender
      const fullMessage = await storage.getMessage(message.id);
      if (!fullMessage) {
        return res.status(500).json({ message: 'Failed to create message' });
      }
      
      // Find other participants
      const otherParticipants = conversation.participants.filter(p => p.id !== userId);
      
      // Create notifications for other participants
      for (const participant of otherParticipants) {
        await storage.createNotification({
          userId: participant.id,
          type: 'message',
          referenceId: conversation.id,
          content: `New message from ${req.session.username}`
        });
        
        // Send notification via WebSocket if the user is connected
        if (clients.has(participant.id)) {
          const client = clients.get(participant.id);
          
          // Send the new message
          client?.send(JSON.stringify({
            type: 'message',
            message: fullMessage
          }));
          
          // Send notification count update
          const count = await storage.getUnreadNotificationsCount(participant.id);
          client?.send(JSON.stringify({
            type: 'notification_count',
            count
          }));
        }
      }
      
      res.status(201).json(fullMessage);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: 'Failed to create message' });
    }
  });
  
  app.post('/api/messages/mark-read', async (req, res) => {
    if (!isAuthenticated(req, res)) return;
    
    try {
      const userId = req.session.userId!;
      const { conversationId } = req.body;
      
      if (!conversationId) {
        return res.status(400).json({ message: 'Conversation ID is required' });
      }
      
      // Check if conversation exists and user is a participant
      const conversation = await storage.getConversation(conversationId);
      if (!conversation) {
        return res.status(404).json({ message: 'Conversation not found' });
      }
      
      const isParticipant = conversation.participants.some(p => p.id === userId);
      if (!isParticipant) {
        return res.status(403).json({ message: 'You are not a participant in this conversation' });
      }
      
      // Mark messages as read
      const markedIds = await storage.markMessagesAsRead(conversationId, userId);
      
      res.status(200).json({ messageIds: markedIds });
    } catch (error) {
      res.status(500).json({ message: 'Failed to mark messages as read' });
    }
  });
  
  // Offer routes
  app.get('/api/offers', async (req, res) => {
    if (!isAuthenticated(req, res)) return;
    
    try {
      const userId = req.session.userId!;
      const status = req.query.status as string | undefined;
      
      const offers = await storage.getOffersByUser(userId, status);
      
      // Enrich the offers with item and user data
      const enrichedOffers = await Promise.all(offers.map(async (offer) => {
        const fromUser = await storage.getUser(offer.fromUserId);
        const toUser = await storage.getUser(offer.toUserId);
        const fromItem = await storage.getItem(offer.fromItemId);
        const toItem = await storage.getItem(offer.toItemId);
        
        // Get main images
        const fromItemImages = await storage.getImagesByItem(offer.fromItemId);
        const toItemImages = await storage.getImagesByItem(offer.toItemId);
        
        const fromItemMainImage = fromItemImages.find(img => img.isMain)?.filePath || fromItemImages[0]?.filePath;
        const toItemMainImage = toItemImages.find(img => img.isMain)?.filePath || toItemImages[0]?.filePath;
        
        return {
          ...offer,
          fromUser: fromUser ? { ...fromUser, password: undefined } : undefined,
          toUser: toUser ? { ...toUser, password: undefined } : undefined,
          fromItem: fromItem ? { ...fromItem, mainImage: fromItemMainImage } : undefined,
          toItem: toItem ? { ...toItem, mainImage: toItemMainImage } : undefined
        };
      }));
      
      res.status(200).json(enrichedOffers);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get offers' });
    }
  });
  
  app.post('/api/offers', async (req, res) => {
    if (!isAuthenticated(req, res)) return;
    
    try {
      const fromUserId = req.session.userId!;
      const offerData = insertOfferSchema.parse({
        ...req.body,
        fromUserId,
        status: 'pending'
      });
      
      // Check if all entities exist
      const toUser = await storage.getUser(offerData.toUserId);
      if (!toUser) {
        return res.status(404).json({ message: 'Recipient user not found' });
      }
      
      const fromItem = await storage.getItem(offerData.fromItemId);
      if (!fromItem) {
        return res.status(404).json({ message: 'Your item not found' });
      }
      
      if (fromItem.userId !== fromUserId) {
        return res.status(403).json({ message: 'You can only offer your own items' });
      }
      
      const toItem = await storage.getItem(offerData.toItemId);
      if (!toItem) {
        return res.status(404).json({ message: 'Target item not found' });
      }
      
      if (toItem.userId !== offerData.toUserId) {
        return res.status(403).json({ message: 'The target item must belong to the recipient' });
      }
      
      // Create the offer
      const offer = await storage.createOffer(offerData);
      
      // Create or get conversation for these users
      let conversation = await storage.getConversationByParticipants(fromUserId, offerData.toUserId);
      
      if (!conversation) {
        conversation = await storage.createConversation(
          { itemId: offerData.toItemId },
          [
            { userId: fromUserId, conversationId: 0 },
            { userId: offerData.toUserId, conversationId: 0 }
          ]
        );
      }
      
      // Add system message about the offer
      await storage.createMessage({
        conversationId: conversation.id,
        senderId: fromUserId,
        content: `I'm offering my ${fromItem.title} for your ${toItem.title}. What do you think?`,
        status: 'sent'
      });
      
      // Create notification
      await storage.createNotification({
        userId: offerData.toUserId,
        type: 'offer',
        referenceId: offer.id,
        content: `New barter offer from ${req.session.username}`
      });
      
      // Send notification via WebSocket if the user is connected
      if (clients.has(offerData.toUserId)) {
        const client = clients.get(offerData.toUserId);
        const count = await storage.getUnreadNotificationsCount(offerData.toUserId);
        client?.send(JSON.stringify({
          type: 'notification_count',
          count
        }));
      }
      
      res.status(201).json(offer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: 'Failed to create offer' });
    }
  });
  
  app.put('/api/offers/:id/status', async (req, res) => {
    if (!isAuthenticated(req, res)) return;
    
    try {
      const offerId = parseInt(req.params.id);
      const userId = req.session.userId!;
      const { status } = req.body;
      
      if (!status || !['accepted', 'rejected', 'cancelled', 'completed'].includes(status)) {
        return res.status(400).json({ message: 'Valid status is required' });
      }
      
      // Check if offer exists
      const offer = await storage.getOffer(offerId);
      if (!offer) {
        return res.status(404).json({ message: 'Offer not found' });
      }
      
      // Only recipient can accept/reject, only sender can cancel
      if ((status === 'accepted' || status === 'rejected') && offer.toUserId !== userId) {
        return res.status(403).json({ message: 'Only the offer recipient can accept or reject' });
      }
      
      if (status === 'cancelled' && offer.fromUserId !== userId) {
        return res.status(403).json({ message: 'Only the offer sender can cancel' });
      }
      
      if (status === 'completed' && (offer.toUserId !== userId && offer.fromUserId !== userId)) {
        return res.status(403).json({ message: 'Only participants can mark the offer as completed' });
      }
      
      // Update offer status
      const updatedOffer = await storage.updateOfferStatus(offerId, status);
      if (!updatedOffer) {
        return res.status(500).json({ message: 'Failed to update offer status' });
      }
      
      // If accepted, update the items status to 'pending'
      if (status === 'accepted') {
        await storage.updateItem(offer.fromItemId, { status: 'pending' });
        await storage.updateItem(offer.toItemId, { status: 'pending' });
      }
      
      // If completed, update the items status to 'completed'
      if (status === 'completed') {
        await storage.updateItem(offer.fromItemId, { status: 'completed' });
        await storage.updateItem(offer.toItemId, { status: 'completed' });
      }
      
      // If rejected or cancelled, ensure items are 'active'
      if (status === 'rejected' || status === 'cancelled') {
        await storage.updateItem(offer.fromItemId, { status: 'active' });
        await storage.updateItem(offer.toItemId, { status: 'active' });
      }
      
      // Create notification for the other party
      const otherUserId = userId === offer.fromUserId ? offer.toUserId : offer.fromUserId;
      const statusText = status === 'accepted' ? 'accepted' : 
                         status === 'rejected' ? 'rejected' :
                         status === 'cancelled' ? 'cancelled' : 'marked as completed';
      
      await storage.createNotification({
        userId: otherUserId,
        type: 'offer_status',
        referenceId: offerId,
        content: `Your offer has been ${statusText}`
      });
      
      // Send notification via WebSocket if the user is connected
      if (clients.has(otherUserId)) {
        const client = clients.get(otherUserId);
        const count = await storage.getUnreadNotificationsCount(otherUserId);
        client?.send(JSON.stringify({
          type: 'notification_count',
          count
        }));
      }
      
      res.status(200).json(updatedOffer);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update offer status' });
    }
  });
  
  // Notification routes
  app.get('/api/notifications', async (req, res) => {
    if (!isAuthenticated(req, res)) return;
    
    try {
      const userId = req.session.userId!;
      const includeRead = req.query.includeRead === 'true';
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : undefined;
      
      const notifications = await storage.getNotificationsByUser(userId, { includeRead, limit, offset });
      
      res.status(200).json(notifications);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get notifications' });
    }
  });
  
  app.get('/api/notifications/count', async (req, res) => {
    if (!isAuthenticated(req, res)) return;
    
    try {
      const userId = req.session.userId!;
      
      const count = await storage.getUnreadNotificationsCount(userId);
      
      res.status(200).json({ count });
    } catch (error) {
      res.status(500).json({ message: 'Failed to get notification count' });
    }
  });
  
  app.post('/api/notifications/:id/read', async (req, res) => {
    if (!isAuthenticated(req, res)) return;
    
    try {
      const userId = req.session.userId!;
      const notificationId = parseInt(req.params.id);
      
      const success = await storage.markNotificationAsRead(notificationId, userId);
      if (!success) {
        return res.status(404).json({ message: 'Notification not found' });
      }
      
      res.status(200).json({ message: 'Notification marked as read' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to mark notification as read' });
    }
  });
  
  app.post('/api/notifications/read-all', async (req, res) => {
    if (!isAuthenticated(req, res)) return;
    
    try {
      const userId = req.session.userId!;
      
      await storage.markAllNotificationsAsRead(userId);
      
      res.status(200).json({ message: 'All notifications marked as read' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to mark notifications as read' });
    }
  });
  
  // Favorite routes
  app.get('/api/favorites', async (req, res) => {
    if (!isAuthenticated(req, res)) return;
    
    try {
      const userId = req.session.userId!;
      
      const favorites = await storage.getFavoritesByUser(userId);
      
      // Enrich with item images
      const enrichedFavorites = await Promise.all(favorites.map(async (fav) => {
        const images = await storage.getImagesByItem(fav.item.id);
        const mainImage = images.find(img => img.isMain)?.filePath || images[0]?.filePath;
        
        return {
          ...fav,
          item: {
            ...fav.item,
            mainImage
          }
        };
      }));
      
      res.status(200).json(enrichedFavorites);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get favorites' });
    }
  });
  
  app.post('/api/favorites', async (req, res) => {
    if (!isAuthenticated(req, res)) return;
    
    try {
      const userId = req.session.userId!;
      const favoriteData = insertFavoriteSchema.parse({
        ...req.body,
        userId
      });
      
      // Check if item exists
      const item = await storage.getItem(favoriteData.itemId);
      if (!item) {
        return res.status(404).json({ message: 'Item not found' });
      }
      
      // Add to favorites
      const favorite = await storage.addFavorite(favoriteData);
      
      res.status(201).json(favorite);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: 'Failed to add to favorites' });
    }
  });
  
  app.delete('/api/favorites/:itemId', async (req, res) => {
    if (!isAuthenticated(req, res)) return;
    
    try {
      const userId = req.session.userId!;
      const itemId = parseInt(req.params.itemId);
      
      const success = await storage.removeFavorite(userId, itemId);
      if (!success) {
        return res.status(404).json({ message: 'Favorite not found' });
      }
      
      res.status(200).json({ message: 'Removed from favorites' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to remove from favorites' });
    }
  });
  
  // Push subscription routes
  app.post('/api/push-subscriptions', async (req, res) => {
    if (!isAuthenticated(req, res)) return;
    
    try {
      const userId = req.session.userId!;
      const subscriptionData = insertPushSubscriptionSchema.parse({
        ...req.body,
        userId
      });
      
      const subscription = await storage.createOrUpdatePushSubscription(subscriptionData);
      
      res.status(201).json(subscription);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: 'Failed to subscribe to push notifications' });
    }
  });
  
  app.delete('/api/push-subscriptions', async (req, res) => {
    if (!isAuthenticated(req, res)) return;
    
    try {
      const userId = req.session.userId!;
      
      const success = await storage.deletePushSubscription(userId);
      if (!success) {
        return res.status(404).json({ message: 'Subscription not found' });
      }
      
      res.status(200).json({ message: 'Unsubscribed from push notifications' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to unsubscribe from push notifications' });
    }
  });

  return httpServer;
}
