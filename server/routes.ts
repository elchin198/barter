import express, { type Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage as dbStorage } from "./storage";
import { z } from "zod";
import { insertUserSchema, insertItemSchema, insertMessageSchema, insertOfferSchema, insertFavoriteSchema, insertNotificationSchema, insertPushSubscriptionSchema, insertReviewSchema } from "@shared/schema";
import { WebSocketServer } from 'ws';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Session interface
declare module 'express-session' {
  interface SessionData {
    userId: number | null;
    username: string | null;
    role: string | null;
  }
}

// Utility to check if user is authenticated
const isAuthenticated = (req: Request, res: Response): boolean => {
  console.log('Session check:', req.session.id, 'User ID:', req.session.userId);
  
  if (!req.session.userId) {
    res.status(401).json({ message: 'Unauthorized: You must be logged in' });
    return false;
  }
  return true;
};

// Configure multer for file uploads
const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Check which type of upload (avatar or item image)
    const uploadType = req.path.includes('/avatar') ? 'avatars' : 'items';
    cb(null, `public/uploads/${uploadType}`);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    
    // Prefix filename based on upload type
    const prefix = req.path.includes('/avatar') ? 'avatar-' : 'item-';
    cb(null, prefix + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: multerStorage,
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

// Middleware to verify admin role
const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  
  if (!req.session.role || req.session.role !== 'admin') {
    return res.status(403).json({ message: "Not authorized" });
  }
  
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Serve static files from public directory
  app.use('/uploads', express.static(path.join(process.cwd(), 'public/uploads')));

  // WebSocket server for real-time messages
  const wss = new WebSocketServer({ 
    server: httpServer,
    path: '/api/ws'  // Specific path for our WebSocket to avoid conflict with Vite
  });

  wss.on('connection', (ws, req) => {
    // Extract userId from URL query parameters
    const url = req.url || '';
    const urlParams = new URLSearchParams(url.split('?')[1] || '');
    const userId = parseInt(urlParams.get('userId') || '0');
    
    console.log('WebSocket connection established. User ID:', userId);
    
    if (userId > 0) {
      clients.set(userId, ws);
      
      ws.on('close', () => {
        clients.delete(userId);
        console.log('WebSocket connection closed. User ID:', userId);
      });
      
      ws.on('message', async (rawMessage) => {
        const message = rawMessage.toString();
        try {
          const data = JSON.parse(message);
          console.log('WebSocket message received:', data.type);
          
          if (data.type === 'message' && data.conversationId && data.content) {
            const newMessage = await dbStorage.createMessage({
              conversationId: data.conversationId,
              senderId: userId,
              content: data.content,
              status: 'sent'
            });
            
            // Get the full message with sender info
            const fullMessage = await dbStorage.getMessage(newMessage.id);
            if (!fullMessage) return;
            
            // Find other participants in this conversation
            const conversation = await dbStorage.getConversation(data.conversationId);
            if (!conversation) return;
            
            // Send to all other participants who are connected
            conversation.participants.forEach((participant: any) => {
              if (participant.id !== userId && clients.has(participant.id)) {
                const client = clients.get(participant.id);
                client?.send(JSON.stringify({
                  type: 'message',
                  message: fullMessage
                }));
              }
            });
            
            // Create a notification for other participants
            conversation.participants.forEach(async (participant: any) => {
              if (participant.id !== userId) {
                await dbStorage.createNotification({
                  userId: participant.id,
                  type: 'message',
                  referenceId: data.conversationId,
                  content: `New message from ${fullMessage.sender.username}`
                });
                
                // Send notification to connected user
                if (clients.has(participant.id)) {
                  const client = clients.get(participant.id);
                  const count = await dbStorage.getUnreadNotificationsCount(participant.id);
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
      const existingUser = await dbStorage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: 'Username already exists' });
      }
      
      // Check if email exists
      const existingEmail = await dbStorage.getUserByEmail(userData.email);
      if (existingEmail) {
        return res.status(400).json({ message: 'Email already exists' });
      }
      
      // Create user
      const user = await dbStorage.createUser(userData);
      
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
      
      console.log("Login attempt:", username);
      console.log("Session before login:", req.session.id);
      
      if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
      }
      
      // Find user
      const user = await dbStorage.getUserByUsername(username);
      if (!user || user.password !== password) {
        return res.status(401).json({ message: 'Invalid username or password' });
      }
      
      // Save user to session
      req.session.userId = user.id;
      req.session.username = user.username;
      req.session.role = user.role;
      
      // Force session save
      req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({ message: 'Failed to save session' });
        }
        
        console.log("Session saved, ID:", req.session.id);
        console.log("User data stored in session:", { 
          id: req.session.userId, 
          username: req.session.username,
          role: req.session.role 
        });
        
        // Return user data without password
        const { password: _, ...userWithoutPassword } = user;
        res.status(200).json(userWithoutPassword);
      });
    } catch (error) {
      console.error("Login error:", error);
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
      const user = await dbStorage.getUser(req.session.userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Store user role in session for admin checks
      req.session.role = user.role;
      
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
      
      const user = await dbStorage.getUser(userId);
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
      
      // Don't allow role changes through this endpoint
      if (userData.role) {
        delete userData.role;
      }
      
      const updatedUser = await dbStorage.updateUser(userId, userData);
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
  
  // Admin routes for user management
  app.get('/api/admin/users', isAdmin, async (req, res) => {
    try {
      // Get all users using the storage method
      const search = req.query.search as string | undefined;
      const users = await dbStorage.getAllUsers(search);
      
      // Remove passwords before sending the response
      const usersWithoutPasswords = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      
      res.status(200).json(usersWithoutPasswords);
    } catch (error) {
      console.error('Error getting users:', error);
      res.status(500).json({ message: 'Failed to get users' });
    }
  });
  
  // Admin routes for items/listings management
  app.get('/api/admin/items', isAdmin, async (req, res) => {
    try {
      const { category, status, search, userId, limit, offset } = req.query;
      
      const options: any = {};
      if (category) options.category = category as string;
      if (status) options.status = status as string;
      if (search) options.search = search as string;
      if (userId) options.userId = parseInt(userId as string);
      if (limit) options.limit = parseInt(limit as string);
      if (offset) options.offset = parseInt(offset as string);
      
      const items = await dbStorage.getItems(options);
      
      // For each item, fetch the main image and add it
      const itemsWithImages = await Promise.all(items.map(async (item) => {
        const images = await dbStorage.getImagesByItem(item.id);
        const mainImage = images.find(img => img.isMain)?.filePath || 
                          (images.length > 0 ? images[0].filePath : null);
        
        // Get the owner information
        const owner = await dbStorage.getUser(item.userId);
        
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
      
      res.json(itemsWithImages);
    } catch (error) {
      console.error('Error getting admin items:', error);
      res.status(500).json({ message: 'Error getting items' });
    }
  });

  app.get('/api/admin/items/:id', isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const item = await dbStorage.getItem(id);
      
      if (!item) {
        return res.status(404).json({ message: 'Item not found' });
      }
      
      // Get item owner
      const owner = await dbStorage.getUser(item.userId);
      if (!owner) {
        return res.status(404).json({ message: 'Item owner not found' });
      }
      
      // Get item images
      const images = await dbStorage.getImagesByItem(id);
      
      // Get offers for this item to count them
      // This would require implementing getOffersByItemId in storage
      // For now, returning 0 as a placeholder
      const offerCount = 0;
      
      // Get view count - would require implementing view tracking
      // For now, returning 0 as a placeholder
      const viewCount = 0;
      
      res.json({
        ...item,
        owner: {
          id: owner.id,
          username: owner.username,
          fullName: owner.fullName,
          avatar: owner.avatar
        },
        images,
        offerCount,
        viewCount
      });
    } catch (error) {
      console.error('Error getting admin item:', error);
      res.status(500).json({ message: 'Error getting item' });
    }
  });

  app.patch('/api/admin/items/:id/status', isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!['active', 'pending', 'suspended', 'completed'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
      }
      
      const updatedItem = await dbStorage.updateItem(id, { status });
      
      if (!updatedItem) {
        return res.status(404).json({ message: 'Item not found' });
      }
      
      res.json(updatedItem);
    } catch (error) {
      console.error('Error updating item status:', error);
      res.status(500).json({ message: 'Error updating item status' });
    }
  });

  app.delete('/api/admin/items/:id', isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Check if item exists
      const item = await dbStorage.getItem(id);
      if (!item) {
        return res.status(404).json({ message: 'Item not found' });
      }
      
      // Delete item
      const success = await dbStorage.deleteItem(id);
      
      if (!success) {
        return res.status(500).json({ message: 'Failed to delete item' });
      }
      
      res.status(200).json({ message: 'Item deleted successfully' });
    } catch (error) {
      console.error('Error deleting item:', error);
      res.status(500).json({ message: 'Error deleting item' });
    }
  });
  
  // Admin Statistics API
  app.get('/api/admin/stats', isAdmin, async (req, res) => {
    try {
      const period = req.query.period as string || 'week';
      
      // In a real implementation, you would query the database for these statistics
      // based on the period parameter
      
      // Here's a simple version returning mock data
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
          { date: '2023-03-01', users: 5, items: 12, offers: 18 },
          { date: '2023-03-02', users: 8, items: 15, offers: 22 },
          { date: '2023-03-03', users: 3, items: 9, offers: 14 },
          { date: '2023-03-04', users: 7, items: 18, offers: 25 },
          { date: '2023-03-05', users: 9, items: 21, offers: 30 },
          { date: '2023-03-06', users: 6, items: 14, offers: 20 },
          { date: '2023-03-07', users: 11, items: 26, offers: 35 }
        ]
      };
      
      res.json(mockStats);
    } catch (error) {
      console.error('Error getting admin stats:', error);
      res.status(500).json({ message: 'Error getting statistics' });
    }
  });
  
  app.get('/api/admin/users/:id', isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      const user = await dbStorage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Get user's items count
      const items = await dbStorage.getItemsByUser(userId);
      
      // Get user's reviews data
      const userRating = await dbStorage.getUserRating(userId);
      
      // Remove password before sending response
      const { password, ...userWithoutPassword } = user;
      
      res.status(200).json({
        ...userWithoutPassword,
        itemsCount: items.length,
        averageRating: userRating.averageRating,
        reviewCount: userRating.reviewCount
      });
    } catch (error) {
      res.status(500).json({ message: 'Failed to get user data' });
    }
  });
  
  app.patch('/api/admin/users/:id/role', isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { role } = req.body;
      
      if (!role || (role !== 'user' && role !== 'admin')) {
        return res.status(400).json({ message: 'Invalid role. Must be "user" or "admin"' });
      }
      
      const user = await dbStorage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Update user role
      const updatedUser = await dbStorage.updateUser(userId, { role });
      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Return user data without password
      const { password, ...userWithoutPassword } = updatedUser;
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update user role' });
    }
  });
  
  app.patch('/api/admin/users/:id/status', isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { active } = req.body;
      
      if (typeof active !== 'boolean') {
        return res.status(400).json({ message: 'Invalid status. "active" must be a boolean value' });
      }
      
      const user = await dbStorage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Update user status by setting appropriate status field
      // We'll use the "active" field to represent user status
      const updatedUser = await dbStorage.updateUser(userId, { active });
      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Return user data without password
      const { password, ...userWithoutPassword } = updatedUser;
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update user status' });
    }
  });
  
  app.delete('/api/admin/users/:id', isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      const user = await dbStorage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // In a real implementation, we would:
      // 1. Delete or anonymize all user data (items, messages, etc.)
      // 2. Delete the user account
      
      // For this demo, we'll just set the user to inactive
      const updatedUser = await dbStorage.updateUser(userId, { active: false });
      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      res.status(200).json({ message: 'User deactivated successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete user' });
    }
  });
  
  // Avatar upload route
  app.post('/api/users/me/avatar', upload.single('avatar'), async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: 'Unauthorized: You must be logged in to upload an avatar' });
    }
    
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    try {
      const userId = req.session.userId;
      const user = await dbStorage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      console.log(`Processing avatar upload for user ${userId}, file: ${req.file.filename}`);
      
      // If user already has an avatar, delete the old file to save space
      if (user.avatar && user.avatar.startsWith('/uploads/avatars/')) {
        const oldAvatarPath = path.join('public', user.avatar);
        try {
          if (fs.existsSync(oldAvatarPath)) {
            fs.unlinkSync(oldAvatarPath);
            console.log(`Deleted old avatar: ${oldAvatarPath}`);
          }
        } catch (err) {
          console.error('Failed to delete old avatar:', err);
        }
      }
      
      // Save the new avatar path to the user's record
      const avatarUrl = `/uploads/avatars/${req.file.filename}`;
      const updatedUser = await dbStorage.updateUser(userId, { avatar: avatarUrl });
      
      if (!updatedUser) {
        return res.status(500).json({ message: 'Failed to update user avatar' });
      }
      
      // Return user data without password
      const { password, ...userWithoutPassword } = updatedUser;
      res.status(200).json({ ...userWithoutPassword, avatarUrl });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      res.status(500).json({ message: 'Failed to upload avatar' });
    }
  });
  
  // Item routes
  app.get('/api/items', async (req, res) => {
    try {
      // Extract all query parameters for filtering and sorting
      const category = req.query.category as string | undefined;
      const search = req.query.search as string | undefined;
      const status = req.query.status as string | undefined;
      const city = req.query.city as string | undefined;
      const condition = req.query.condition as string | undefined;
      const sort = req.query.sort as 'newest' | 'oldest' | 'title_asc' | 'title_desc' | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : undefined;
      
      // Retrieve items with all filters applied
      const items = await dbStorage.getItems({ 
        category, 
        search, 
        status, 
        city,
        condition,
        sort,
        limit, 
        offset 
      });
      
      // Get image for each item
      const itemsWithImages = await Promise.all(items.map(async (item) => {
        const images = await dbStorage.getImagesByItem(item.id);
        const mainImage = images.find(img => img.isMain)?.filePath || images[0]?.filePath;
        return { ...item, mainImage };
      }));
      
      // Add pagination metadata to the response if limit is specified
      if (limit) {
        // Count total items matching the filters for pagination info
        const totalItems = await dbStorage.getItems({ 
          category, 
          search, 
          status, 
          city,
          condition
        });
        
        res.status(200).json({
          items: itemsWithImages,
          pagination: {
            total: totalItems.length,
            limit,
            offset: offset || 0
          }
        });
      } else {
        res.status(200).json(itemsWithImages);
      }
    } catch (error) {
      console.error('Failed to get items:', error);
      res.status(500).json({ message: 'Failed to get items' });
    }
  });
  
  app.get('/api/items/:id', async (req, res) => {
    try {
      const itemId = parseInt(req.params.id);
      
      const item = await dbStorage.getItem(itemId);
      if (!item) {
        return res.status(404).json({ message: 'Item not found' });
      }
      
      // Get images
      const images = await dbStorage.getImagesByItem(itemId);
      
      // Get owner
      const owner = await dbStorage.getUser(item.userId);
      if (!owner) {
        return res.status(404).json({ message: 'Item owner not found' });
      }
      
      // Don't send owner's password
      const { password, ...ownerWithoutPassword } = owner;
      
      // Check if favorite for current user
      let isFavorite = false;
      if (req.session.userId) {
        isFavorite = await dbStorage.isFavorite(req.session.userId, itemId);
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
      
      const item = await dbStorage.createItem(itemData);
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
      const item = await dbStorage.getItem(itemId);
      if (!item) {
        return res.status(404).json({ message: 'Item not found' });
      }
      
      if (item.userId !== userId) {
        return res.status(403).json({ message: 'You can only update your own items' });
      }
      
      // Update item
      const updatedItem = await dbStorage.updateItem(itemId, req.body);
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
      const item = await dbStorage.getItem(itemId);
      if (!item) {
        return res.status(404).json({ message: 'Item not found' });
      }
      
      if (item.userId !== userId) {
        return res.status(403).json({ message: 'You can only delete your own items' });
      }
      
      // Delete item
      await dbStorage.deleteItem(itemId);
      
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
      const item = await dbStorage.getItem(itemId);
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
      
      const image = await dbStorage.createImage({
        itemId,
        filePath,
        isMain: !!isMain
      });
      
      res.status(201).json(image);
    } catch (error) {
      res.status(500).json({ message: 'Failed to add image' });
    }
  });
  
  // Direct image upload for items
  app.post('/api/items/:id/upload', upload.single('image'), async (req, res) => {
    if (!isAuthenticated(req, res)) return;
    
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    try {
      const itemId = parseInt(req.params.id);
      const userId = req.session.userId!;
      
      // Check if item exists and belongs to user
      const item = await dbStorage.getItem(itemId);
      if (!item) {
        return res.status(404).json({ message: 'Item not found' });
      }
      
      if (item.userId !== userId) {
        return res.status(403).json({ message: 'You can only add images to your own items' });
      }
      
      // Get the file path and set as main if it's the first image
      const filePath = `/uploads/items/${req.file.filename}`;
      
      // Check if this is the first image (should be main)
      const existingImages = await dbStorage.getImagesByItem(itemId);
      const isMain = existingImages.length === 0;
      
      const image = await dbStorage.createImage({
        itemId,
        filePath,
        isMain
      });
      
      res.status(201).json(image);
    } catch (error) {
      res.status(500).json({ message: 'Failed to upload image' });
    }
  });
  
  app.put('/api/items/:itemId/images/:imageId/main', async (req, res) => {
    if (!isAuthenticated(req, res)) return;
    
    try {
      const itemId = parseInt(req.params.itemId);
      const imageId = parseInt(req.params.imageId);
      const userId = req.session.userId!;
      
      // Check if item exists and belongs to user
      const item = await dbStorage.getItem(itemId);
      if (!item) {
        return res.status(404).json({ message: 'Item not found' });
      }
      
      if (item.userId !== userId) {
        return res.status(403).json({ message: 'You can only update images for your own items' });
      }
      
      const success = await dbStorage.setMainImage(imageId, itemId);
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
      const item = await dbStorage.getItem(itemId);
      if (!item) {
        return res.status(404).json({ message: 'Item not found' });
      }
      
      if (item.userId !== userId) {
        return res.status(403).json({ message: 'You can only delete images for your own items' });
      }
      
      const success = await dbStorage.deleteImage(imageId);
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
      
      const conversations = await dbStorage.getConversationsByUser(userId);
      
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
      
      const conversation = await dbStorage.getConversation(conversationId);
      if (!conversation) {
        return res.status(404).json({ message: 'Conversation not found' });
      }
      
      // Check if user is a participant
      const isParticipant = conversation.participants.some(p => p.id === userId);
      if (!isParticipant) {
        return res.status(403).json({ message: 'You are not a participant in this conversation' });
      }
      
      // Get messages
      const messages = await dbStorage.getMessagesByConversation(conversationId);
      
      // Find the other participant
      const otherParticipant = conversation.participants.find(p => p.id !== userId) || null;
      
      // Mark messages as read
      await dbStorage.markMessagesAsRead(conversationId, userId);
      
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
      const otherUser = await dbStorage.getUser(otherUserId);
      if (!otherUser) {
        return res.status(404).json({ message: 'Other user not found' });
      }
      
      // Check if item exists if provided
      if (itemId) {
        const item = await dbStorage.getItem(itemId);
        if (!item) {
          return res.status(404).json({ message: 'Item not found' });
        }
      }
      
      // Check if conversation already exists
      const existingConversation = await dbStorage.getConversationByParticipants(userId, otherUserId, itemId);
      
      let conversationId: number;
      
      if (existingConversation) {
        conversationId = existingConversation.id;
      } else {
        // Create new conversation
        const newConversation = await dbStorage.createConversation(
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
        await dbStorage.createMessage({
          conversationId,
          senderId: userId,
          content: message,
          status: 'sent'
        });
        
        // Create notification
        await dbStorage.createNotification({
          userId: otherUserId,
          type: 'message',
          referenceId: conversationId,
          content: `New message from ${req.session.username}`
        });
        
        // Send notification via WebSocket if the user is connected
        if (clients.has(otherUserId)) {
          const client = clients.get(otherUserId);
          const count = await dbStorage.getUnreadNotificationsCount(otherUserId);
          client?.send(JSON.stringify({
            type: 'notification_count',
            count
          }));
        }
      }
      
      const conversation = await dbStorage.getConversation(conversationId);
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
      const conversation = await dbStorage.getConversation(messageData.conversationId);
      if (!conversation) {
        return res.status(404).json({ message: 'Conversation not found' });
      }
      
      const isParticipant = conversation.participants.some(p => p.id === userId);
      if (!isParticipant) {
        return res.status(403).json({ message: 'You are not a participant in this conversation' });
      }
      
      // Create message
      const message = await dbStorage.createMessage(messageData);
      
      // Get full message with sender
      const fullMessage = await dbStorage.getMessage(message.id);
      if (!fullMessage) {
        return res.status(500).json({ message: 'Failed to create message' });
      }
      
      // Find other participants
      const otherParticipants = conversation.participants.filter(p => p.id !== userId);
      
      // Create notifications for other participants
      for (const participant of otherParticipants) {
        await dbStorage.createNotification({
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
          const count = await dbStorage.getUnreadNotificationsCount(participant.id);
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
      const conversation = await dbStorage.getConversation(conversationId);
      if (!conversation) {
        return res.status(404).json({ message: 'Conversation not found' });
      }
      
      const isParticipant = conversation.participants.some(p => p.id === userId);
      if (!isParticipant) {
        return res.status(403).json({ message: 'You are not a participant in this conversation' });
      }
      
      // Mark messages as read
      const markedIds = await dbStorage.markMessagesAsRead(conversationId, userId);
      
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
      
      const offers = await dbStorage.getOffersByUser(userId, status);
      
      // Enrich the offers with item and user data
      const enrichedOffers = await Promise.all(offers.map(async (offer) => {
        const fromUser = await dbStorage.getUser(offer.fromUserId);
        const toUser = await dbStorage.getUser(offer.toUserId);
        const fromItem = await dbStorage.getItem(offer.fromItemId);
        const toItem = await dbStorage.getItem(offer.toItemId);
        
        // Get main images
        const fromItemImages = await dbStorage.getImagesByItem(offer.fromItemId);
        const toItemImages = await dbStorage.getImagesByItem(offer.toItemId);
        
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
      const toUser = await dbStorage.getUser(offerData.toUserId);
      if (!toUser) {
        return res.status(404).json({ message: 'Recipient user not found' });
      }
      
      const fromItem = await dbStorage.getItem(offerData.fromItemId);
      if (!fromItem) {
        return res.status(404).json({ message: 'Your item not found' });
      }
      
      if (fromItem.userId !== fromUserId) {
        return res.status(403).json({ message: 'You can only offer your own items' });
      }
      
      const toItem = await dbStorage.getItem(offerData.toItemId);
      if (!toItem) {
        return res.status(404).json({ message: 'Target item not found' });
      }
      
      if (toItem.userId !== offerData.toUserId) {
        return res.status(403).json({ message: 'The target item must belong to the recipient' });
      }
      
      // Create the offer
      const offer = await dbStorage.createOffer(offerData);
      
      // Create or get conversation for these users
      let conversation = await dbStorage.getConversationByParticipants(fromUserId, offerData.toUserId);
      
      if (!conversation) {
        conversation = await dbStorage.createConversation(
          { itemId: offerData.toItemId },
          [
            { userId: fromUserId, conversationId: 0 },
            { userId: offerData.toUserId, conversationId: 0 }
          ]
        );
      }
      
      // Add system message about the offer
      await dbStorage.createMessage({
        conversationId: conversation.id,
        senderId: fromUserId,
        content: `I'm offering my ${fromItem.title} for your ${toItem.title}. What do you think?`,
        status: 'sent'
      });
      
      // Create notification
      await dbStorage.createNotification({
        userId: offerData.toUserId,
        type: 'offer',
        referenceId: offer.id,
        content: `New barter offer from ${req.session.username}`
      });
      
      // Send notification via WebSocket if the user is connected
      if (clients.has(offerData.toUserId)) {
        const client = clients.get(offerData.toUserId);
        const count = await dbStorage.getUnreadNotificationsCount(offerData.toUserId);
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
      const offer = await dbStorage.getOffer(offerId);
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
      const updatedOffer = await dbStorage.updateOfferStatus(offerId, status);
      if (!updatedOffer) {
        return res.status(500).json({ message: 'Failed to update offer status' });
      }
      
      // If accepted, update the items status to 'pending'
      if (status === 'accepted') {
        await dbStorage.updateItem(offer.fromItemId, { status: 'pending' });
        await dbStorage.updateItem(offer.toItemId, { status: 'pending' });
      }
      
      // If completed, update the items status to 'completed'
      if (status === 'completed') {
        await dbStorage.updateItem(offer.fromItemId, { status: 'completed' });
        await dbStorage.updateItem(offer.toItemId, { status: 'completed' });
      }
      
      // If rejected or cancelled, ensure items are 'active'
      if (status === 'rejected' || status === 'cancelled') {
        await dbStorage.updateItem(offer.fromItemId, { status: 'active' });
        await dbStorage.updateItem(offer.toItemId, { status: 'active' });
      }
      
      // Create notification for the other party
      const otherUserId = userId === offer.fromUserId ? offer.toUserId : offer.fromUserId;
      const statusText = status === 'accepted' ? 'accepted' : 
                         status === 'rejected' ? 'rejected' :
                         status === 'cancelled' ? 'cancelled' : 'marked as completed';
      
      await dbStorage.createNotification({
        userId: otherUserId,
        type: 'offer_status',
        referenceId: offerId,
        content: `Your offer has been ${statusText}`
      });
      
      // Send notification via WebSocket if the user is connected
      if (clients.has(otherUserId)) {
        const client = clients.get(otherUserId);
        const count = await dbStorage.getUnreadNotificationsCount(otherUserId);
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
      
      const notifications = await dbStorage.getNotificationsByUser(userId, { includeRead, limit, offset });
      
      res.status(200).json(notifications);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get notifications' });
    }
  });
  
  app.get('/api/notifications/count', async (req, res) => {
    if (!isAuthenticated(req, res)) return;
    
    try {
      const userId = req.session.userId!;
      
      const count = await dbStorage.getUnreadNotificationsCount(userId);
      
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
      
      const success = await dbStorage.markNotificationAsRead(notificationId, userId);
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
      
      await dbStorage.markAllNotificationsAsRead(userId);
      
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
      
      const favorites = await dbStorage.getFavoritesByUser(userId);
      
      // Enrich with item images
      const enrichedFavorites = await Promise.all(favorites.map(async (fav) => {
        const images = await dbStorage.getImagesByItem(fav.item.id);
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
      const item = await dbStorage.getItem(favoriteData.itemId);
      if (!item) {
        return res.status(404).json({ message: 'Item not found' });
      }
      
      // Add to favorites
      const favorite = await dbStorage.addFavorite(favoriteData);
      
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
      
      const success = await dbStorage.removeFavorite(userId, itemId);
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
      
      const subscription = await dbStorage.createOrUpdatePushSubscription(subscriptionData);
      
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
      
      const success = await dbStorage.deletePushSubscription(userId);
      if (!success) {
        return res.status(404).json({ message: 'Subscription not found' });
      }
      
      res.status(200).json({ message: 'Unsubscribed from push notifications' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to unsubscribe from push notifications' });
    }
  });

  // Review routes
  // Get user rating
  app.get('/api/users/:id/rating', async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      const userRating = await dbStorage.getUserRating(userId);
      if (!userRating) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Don't send password
      const { password, ...userWithoutPassword } = userRating;
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get user rating' });
    }
  });
  
  // Get reviews for a user
  app.get('/api/users/:id/reviews', async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const asReviewer = req.query.asReviewer === 'true';
      
      const reviews = await dbStorage.getReviewsByUser(userId, asReviewer);
      res.status(200).json(reviews);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get user reviews' });
    }
  });
  
  // Get reviews for an offer
  app.get('/api/offers/:id/reviews', async (req, res) => {
    try {
      const offerId = parseInt(req.params.id);
      
      const reviews = await dbStorage.getReviewsByOffer(offerId);
      res.status(200).json(reviews);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get offer reviews' });
    }
  });
  
  // Check if user can review offer
  app.get('/api/offers/:id/can-review', async (req, res) => {
    if (!isAuthenticated(req, res)) return;
    
    try {
      const offerId = parseInt(req.params.id);
      const userId = req.session.userId!;
      
      const canReview = await dbStorage.canReviewOffer(offerId, userId);
      res.status(200).json({ canReview });
    } catch (error) {
      res.status(500).json({ message: 'Failed to check if user can review offer' });
    }
  });
  
  // Create a review
  app.post('/api/offers/:id/reviews', async (req, res) => {
    if (!isAuthenticated(req, res)) return;
    
    try {
      const offerId = parseInt(req.params.id);
      const userId = req.session.userId!;
      
      // Check if user can review this offer
      const canReview = await dbStorage.canReviewOffer(offerId, userId);
      if (!canReview) {
        return res.status(403).json({ 
          message: 'You cannot review this offer. Either it is not completed, or you have already reviewed it, or you are not part of this offer.' 
        });
      }
      
      // Get the offer to determine who is being reviewed
      const offer = await dbStorage.getOffer(offerId);
      if (!offer) {
        return res.status(404).json({ message: 'Offer not found' });
      }
      
      // Determine who is the reviewer and who is being reviewed
      const toUserId = offer.fromUserId === userId ? offer.toUserId : offer.fromUserId;
      
      // Create review data
      const reviewData = insertReviewSchema.parse({
        ...req.body,
        fromUserId: userId,
        toUserId,
        offerId
      });
      
      const review = await dbStorage.createReview(reviewData);
      
      // Create a notification for the user being reviewed
      await dbStorage.createNotification({
        userId: toUserId,
        type: 'review',
        referenceId: review.id,
        content: `You've received a new review`
      });
      
      // Send notification via WebSocket if user is connected
      if (clients.has(toUserId)) {
        const client = clients.get(toUserId);
        const count = await dbStorage.getUnreadNotificationsCount(toUserId);
        client?.send(JSON.stringify({
          type: 'notification_count',
          count
        }));
      }
      
      res.status(201).json(review);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: 'Failed to create review' });
    }
  });

  return httpServer;
}
