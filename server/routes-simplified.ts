import { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from 'http';
import { WebSocketServer } from 'ws';
import WebSocket from 'ws';
import { storage } from "./storage";
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authService, isAuthenticated, isAdmin } from './auth';

// Configure multer for file uploads
const storage_config = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadType = req.path.includes('avatar') ? 'avatars' : 'items';
    const uploadDir = path.join(process.cwd(), `public/uploads/${uploadType}`);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage: storage_config,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    // Only allow images
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only images are allowed'));
    }
    cb(null, true);
  }
});

// Register routes and WebSocket server
export async function registerRoutes(app: Express): Promise<Server> {
  // Create HTTP server
  const httpServer = createServer(app);

  // Create WebSocket server for real-time communication
  const wss = new WebSocketServer({ 
    server: httpServer,
    path: '/ws'
  });

  // WebSocket connection handler
  wss.on('connection', (ws) => {
    console.log('WebSocket connection established');
    
    // Send welcome message
    ws.send(JSON.stringify({
      type: 'connection',
      message: 'Connected to BarterTap WebSocket server'
    }));
    
    // Handle incoming messages
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        console.log('WebSocket message received:', data);
        
        // Handle different message types
        // This will be expanded based on app requirements
        if (data.type === 'ping') {
          ws.send(JSON.stringify({
            type: 'pong',
            timestamp: Date.now()
          }));
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });
    
    // Handle disconnections
    ws.on('close', () => {
      console.log('WebSocket connection closed');
    });
  });

  // Broadcast to all connected clients
  function broadcast(data: any) {
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  }

  // Authentication routes
  app.post('/api/login', (req, res) => authService.login(req, res));
  app.post('/api/logout', (req, res) => authService.logout(req, res));
  app.get('/api/auth/me', (req, res) => authService.getCurrentUser(req, res));
  
  // Register route
  app.post('/api/register', async (req, res) => {
    try {
      const { username, password, email, fullName } = req.body;
      
      // Validate required fields
      if (!username || !password || !email) {
        return res.status(400).json({ message: 'Username, password, and email are required' });
      }
      
      // Check if username or email already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: 'Username already exists' });
      }
      
      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ message: 'Email already exists' });
      }
      
      // Hash password
      const hashedPassword = await authService.hashPassword(password);
      
      // Create user
      const user = await storage.createUser({
        username,
        password: hashedPassword,
        email,
        fullName,
        role: 'user',
        active: true
      });
      
      // Create session
      req.session.userId = user.id;
      req.session.username = user.username;
      req.session.role = user.role;
      req.session.isAuthenticated = true;
      
      // Save session
      req.session.save((err) => {
        if (err) {
          console.error('Error saving session:', err);
          return res.status(500).json({ message: 'Error creating session' });
        }
        
        // Return user data without password
        const { password, ...userWithoutPassword } = user;
        res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ message: 'Failed to register user' });
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
  
  app.put('/api/users/me', isAuthenticated, async (req, res) => {
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

  // Items routes
  app.get('/api/items', async (req, res) => {
    try {
      const { category, status, search, limit, offset, city, condition, sort } = req.query;
      
      const options: any = {};
      if (category) options.category = category as string;
      if (status) options.status = status as string;
      if (search) options.search = search as string;
      if (city) options.city = city as string;
      if (condition) options.condition = condition as string;
      if (sort) options.sort = sort as any;
      if (limit) options.limit = parseInt(limit as string);
      if (offset) options.offset = parseInt(offset as string);
      
      const items = await storage.getItems(options);
      
      // For each item, fetch the main image and add it
      const itemsWithImages = await Promise.all(items.map(async (item) => {
        const images = await storage.getImagesByItem(item.id);
        const mainImage = images.find(img => img.isMain)?.filePath || 
                          (images.length > 0 ? images[0].filePath : null);
        
        return {
          ...item,
          mainImage
        };
      }));
      
      res.json(itemsWithImages);
    } catch (error) {
      console.error('Error getting items:', error);
      res.status(500).json({ message: 'Error getting items' });
    }
  });
  
  app.get('/api/items/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const item = await storage.getItem(id);
      
      if (!item) {
        return res.status(404).json({ message: 'Item not found' });
      }
      
      // Get item owner
      const owner = await storage.getUser(item.userId);
      if (!owner) {
        return res.status(404).json({ message: 'Item owner not found' });
      }
      
      // Get item images
      const images = await storage.getImagesByItem(id);
      
      // Check if the item is in the user's favorites
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
      console.error('Error getting item:', error);
      res.status(500).json({ message: 'Error getting item' });
    }
  });
  
  app.post('/api/items', isAuthenticated, upload.array('images', 10), async (req, res) => {
    try {
      const userId = req.session.userId!;
      const itemData = req.body;
      
      // Validate required fields
      if (!itemData.title || !itemData.description || !itemData.category || !itemData.condition) {
        return res.status(400).json({ message: 'Title, description, category, and condition are required' });
      }
      
      // Create item
      const item = await storage.createItem({
        ...itemData,
        userId,
        status: 'active'
      });
      
      // Process uploaded images
      const files = req.files as Express.Multer.File[];
      if (files && files.length > 0) {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const filePath = `/uploads/items/${file.filename}`;
          
          // Create image
          const image = await storage.createImage({
            itemId: item.id,
            filePath,
            isMain: i === 0 // First image is main
          });
          
          // Set main image
          if (i === 0) {
            await storage.setMainImage(image.id, item.id);
          }
        }
      }
      
      // Fetch the item with images
      const images = await storage.getImagesByItem(item.id);
      
      // Return the item with images
      res.status(201).json({
        ...item,
        images
      });
    } catch (error) {
      console.error('Error creating item:', error);
      res.status(500).json({ message: 'Error creating item' });
    }
  });
  
  app.put('/api/items/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.session.userId!;
      const itemData = req.body;
      
      // Check if item exists
      const item = await storage.getItem(id);
      if (!item) {
        return res.status(404).json({ message: 'Item not found' });
      }
      
      // Check if user owns the item
      if (item.userId !== userId) {
        return res.status(403).json({ message: 'You can only update your own items' });
      }
      
      // Update item
      const updatedItem = await storage.updateItem(id, itemData);
      if (!updatedItem) {
        return res.status(404).json({ message: 'Item not found' });
      }
      
      // Get item images
      const images = await storage.getImagesByItem(id);
      
      // Return the updated item with images
      res.json({
        ...updatedItem,
        images
      });
    } catch (error) {
      console.error('Error updating item:', error);
      res.status(500).json({ message: 'Error updating item' });
    }
  });
  
  app.delete('/api/items/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.session.userId!;
      
      // Check if item exists
      const item = await storage.getItem(id);
      if (!item) {
        return res.status(404).json({ message: 'Item not found' });
      }
      
      // Check if user owns the item
      if (item.userId !== userId) {
        return res.status(403).json({ message: 'You can only delete your own items' });
      }
      
      // Delete item
      const success = await storage.deleteItem(id);
      
      if (!success) {
        return res.status(500).json({ message: 'Failed to delete item' });
      }
      
      res.status(200).json({ message: 'Item deleted successfully' });
    } catch (error) {
      console.error('Error deleting item:', error);
      res.status(500).json({ message: 'Error deleting item' });
    }
  });
  
  // Item images
  app.post('/api/items/:id/images', isAuthenticated, upload.array('images', 10), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.session.userId!;
      
      // Check if item exists
      const item = await storage.getItem(id);
      if (!item) {
        return res.status(404).json({ message: 'Item not found' });
      }
      
      // Check if user owns the item
      if (item.userId !== userId) {
        return res.status(403).json({ message: 'You can only add images to your own items' });
      }
      
      // Process uploaded images
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({ message: 'No images uploaded' });
      }
      
      const images = [];
      
      for (const file of files) {
        const filePath = `/uploads/items/${file.filename}`;
        
        // Create image
        const image = await storage.createImage({
          itemId: id,
          filePath,
          isMain: false
        });
        
        images.push(image);
      }
      
      // Return the images
      res.status(201).json(images);
    } catch (error) {
      console.error('Error adding images:', error);
      res.status(500).json({ message: 'Error adding images' });
    }
  });
  
  app.patch('/api/items/:itemId/images/:imageId/main', isAuthenticated, async (req, res) => {
    try {
      const itemId = parseInt(req.params.itemId);
      const imageId = parseInt(req.params.imageId);
      const userId = req.session.userId!;
      
      // Check if item exists
      const item = await storage.getItem(itemId);
      if (!item) {
        return res.status(404).json({ message: 'Item not found' });
      }
      
      // Check if user owns the item
      if (item.userId !== userId) {
        return res.status(403).json({ message: 'You can only update images of your own items' });
      }
      
      // Set main image
      const success = await storage.setMainImage(imageId, itemId);
      
      if (!success) {
        return res.status(500).json({ message: 'Failed to set main image' });
      }
      
      // Get updated images
      const images = await storage.getImagesByItem(itemId);
      
      res.json(images);
    } catch (error) {
      console.error('Error setting main image:', error);
      res.status(500).json({ message: 'Error setting main image' });
    }
  });
  
  app.delete('/api/items/:itemId/images/:imageId', isAuthenticated, async (req, res) => {
    try {
      const itemId = parseInt(req.params.itemId);
      const imageId = parseInt(req.params.imageId);
      const userId = req.session.userId!;
      
      // Check if item exists
      const item = await storage.getItem(itemId);
      if (!item) {
        return res.status(404).json({ message: 'Item not found' });
      }
      
      // Check if user owns the item
      if (item.userId !== userId) {
        return res.status(403).json({ message: 'You can only delete images of your own items' });
      }
      
      // Delete image
      const success = await storage.deleteImage(imageId);
      
      if (!success) {
        return res.status(500).json({ message: 'Failed to delete image' });
      }
      
      // Get updated images
      const images = await storage.getImagesByItem(itemId);
      
      res.json(images);
    } catch (error) {
      console.error('Error deleting image:', error);
      res.status(500).json({ message: 'Error deleting image' });
    }
  });
  
  // Favorites
  app.get('/api/favorites', isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId!;
      
      const favorites = await storage.getFavoritesByUser(userId);
      
      res.json(favorites);
    } catch (error) {
      console.error('Error getting favorites:', error);
      res.status(500).json({ message: 'Error getting favorites' });
    }
  });
  
  app.post('/api/favorites/:itemId', isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const itemId = parseInt(req.params.itemId);
      
      // Check if item exists
      const item = await storage.getItem(itemId);
      if (!item) {
        return res.status(404).json({ message: 'Item not found' });
      }
      
      // Check if already favorited
      const isFavorite = await storage.isFavorite(userId, itemId);
      if (isFavorite) {
        return res.status(400).json({ message: 'Item already in favorites' });
      }
      
      // Add to favorites
      const favorite = await storage.addFavorite({
        userId,
        itemId
      });
      
      res.status(201).json(favorite);
    } catch (error) {
      console.error('Error adding favorite:', error);
      res.status(500).json({ message: 'Error adding favorite' });
    }
  });
  
  app.delete('/api/favorites/:itemId', isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const itemId = parseInt(req.params.itemId);
      
      // Remove from favorites
      const success = await storage.removeFavorite(userId, itemId);
      
      if (!success) {
        return res.status(500).json({ message: 'Failed to remove favorite' });
      }
      
      res.status(200).json({ message: 'Favorite removed successfully' });
    } catch (error) {
      console.error('Error removing favorite:', error);
      res.status(500).json({ message: 'Error removing favorite' });
    }
  });
  
  // Conversations
  app.get('/api/conversations', isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId!;
      
      const conversations = await storage.getConversationsByUser(userId);
      
      res.json(conversations);
    } catch (error) {
      console.error('Error getting conversations:', error);
      res.status(500).json({ message: 'Error getting conversations' });
    }
  });
  
  app.get('/api/conversations/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.session.userId!;
      
      const conversation = await storage.getConversation(id);
      
      if (!conversation) {
        return res.status(404).json({ message: 'Conversation not found' });
      }
      
      // Check if user is participant
      const isParticipant = conversation.participants.some(p => p.id === userId);
      if (!isParticipant) {
        return res.status(403).json({ message: 'You do not have access to this conversation' });
      }
      
      // Get messages
      const messages = await storage.getMessagesByConversation(id);
      
      // Mark messages as read
      await storage.markMessagesAsRead(id, userId);
      
      res.json({
        conversation,
        messages
      });
    } catch (error) {
      console.error('Error getting conversation:', error);
      res.status(500).json({ message: 'Error getting conversation' });
    }
  });
  
  app.post('/api/conversations', isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { recipientId, itemId, message } = req.body;
      
      if (!recipientId || !message) {
        return res.status(400).json({ message: 'Recipient ID and message are required' });
      }
      
      const recipientIdNum = parseInt(recipientId);
      
      // Check if recipient exists
      const recipient = await storage.getUser(recipientIdNum);
      if (!recipient) {
        return res.status(404).json({ message: 'Recipient not found' });
      }
      
      // Check if item exists if provided
      if (itemId) {
        const item = await storage.getItem(parseInt(itemId));
        if (!item) {
          return res.status(404).json({ message: 'Item not found' });
        }
      }
      
      // Check if conversation already exists
      let conversation = await storage.getConversationByParticipants(
        userId, 
        recipientIdNum,
        itemId ? parseInt(itemId) : undefined
      );
      
      // Create new conversation if not exists
      if (!conversation) {
        const newConversation = await storage.createConversation(
          {
            itemId: itemId ? parseInt(itemId) : null,
            lastMessageAt: new Date()
          },
          [
            {
              userId,
              conversationId: 0 // Will be set by the storage implementation
            },
            {
              userId: recipientIdNum,
              conversationId: 0 // Will be set by the storage implementation
            }
          ]
        );
        
        conversation = await storage.getConversation(newConversation.id);
      }
      
      if (!conversation) {
        return res.status(500).json({ message: 'Failed to create conversation' });
      }
      
      // Create message
      const newMessage = await storage.createMessage({
        conversationId: conversation.id,
        senderId: userId,
        content: message,
        isRead: false
      });
      
      // Update conversation's last message time
      await storage.updateConversationLastMessage(conversation.id);
      
      // Create notification for recipient
      await storage.createNotification({
        userId: recipientIdNum,
        type: 'message',
        content: `Yeni mesaj: ${message.substring(0, 50)}${message.length > 50 ? '...' : ''}`,
        referenceId: newMessage.id,
        isRead: false
      });
      
      // Broadcast message to recipient if online
      broadcast({
        type: 'new_message',
        userId: recipientIdNum,
        conversationId: conversation.id,
        message: newMessage
      });
      
      // Return the conversation with messages
      const messages = await storage.getMessagesByConversation(conversation.id);
      
      res.status(201).json({
        conversation,
        messages
      });
    } catch (error) {
      console.error('Error creating conversation:', error);
      res.status(500).json({ message: 'Error creating conversation' });
    }
  });
  
  app.post('/api/conversations/:id/messages', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.session.userId!;
      const { message } = req.body;
      
      if (!message) {
        return res.status(400).json({ message: 'Message content is required' });
      }
      
      // Check if conversation exists
      const conversation = await storage.getConversation(id);
      if (!conversation) {
        return res.status(404).json({ message: 'Conversation not found' });
      }
      
      // Check if user is participant
      const isParticipant = conversation.participants.some(p => p.id === userId);
      if (!isParticipant) {
        return res.status(403).json({ message: 'You do not have access to this conversation' });
      }
      
      // Find the other participant for notification
      const otherParticipant = conversation.participants.find(p => p.id !== userId);
      if (!otherParticipant) {
        return res.status(500).json({ message: 'Could not find other participant' });
      }
      
      // Create message
      const newMessage = await storage.createMessage({
        conversationId: id,
        senderId: userId,
        content: message,
        isRead: false
      });
      
      // Update conversation's last message time
      await storage.updateConversationLastMessage(id);
      
      // Create notification for other participant
      await storage.createNotification({
        userId: otherParticipant.id,
        type: 'message',
        content: `Yeni mesaj: ${message.substring(0, 50)}${message.length > 50 ? '...' : ''}`,
        referenceId: newMessage.id,
        isRead: false
      });
      
      // Broadcast message to other participant if online
      broadcast({
        type: 'new_message',
        userId: otherParticipant.id,
        conversationId: id,
        message: newMessage
      });
      
      // Return the message with sender
      const messageWithSender = await storage.getMessage(newMessage.id);
      
      res.status(201).json(messageWithSender);
    } catch (error) {
      console.error('Error sending message:', error);
      res.status(500).json({ message: 'Error sending message' });
    }
  });
  
  // Offers
  app.get('/api/offers', isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { status } = req.query;
      
      const offers = await storage.getOffersByUser(userId, status as string);
      
      res.json(offers);
    } catch (error) {
      console.error('Error getting offers:', error);
      res.status(500).json({ message: 'Error getting offers' });
    }
  });
  
  app.get('/api/offers/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.session.userId!;
      
      const offer = await storage.getOffer(id);
      
      if (!offer) {
        return res.status(404).json({ message: 'Offer not found' });
      }
      
      // Check if user is involved in the offer
      if (offer.fromUserId !== userId && offer.toUserId !== userId) {
        return res.status(403).json({ message: 'You do not have access to this offer' });
      }
      
      res.json(offer);
    } catch (error) {
      console.error('Error getting offer:', error);
      res.status(500).json({ message: 'Error getting offer' });
    }
  });
  
  app.post('/api/offers', isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { toUserId, fromItemId, toItemId, message } = req.body;
      
      if (!toUserId || !fromItemId || !toItemId) {
        return res.status(400).json({ message: 'Recipient ID, from item ID, and to item ID are required' });
      }
      
      const toUserIdNum = parseInt(toUserId);
      const fromItemIdNum = parseInt(fromItemId);
      const toItemIdNum = parseInt(toItemId);
      
      // Check if recipient exists
      const recipient = await storage.getUser(toUserIdNum);
      if (!recipient) {
        return res.status(404).json({ message: 'Recipient not found' });
      }
      
      // Check if from item exists and belongs to current user
      const fromItem = await storage.getItem(fromItemIdNum);
      if (!fromItem) {
        return res.status(404).json({ message: 'From item not found' });
      }
      if (fromItem.userId !== userId) {
        return res.status(403).json({ message: 'You can only offer your own items' });
      }
      
      // Check if to item exists and belongs to recipient
      const toItem = await storage.getItem(toItemIdNum);
      if (!toItem) {
        return res.status(404).json({ message: 'To item not found' });
      }
      if (toItem.userId !== toUserIdNum) {
        return res.status(403).json({ message: 'You can only request items from their owner' });
      }
      
      // Create offer
      const offer = await storage.createOffer({
        fromUserId: userId,
        toUserId: toUserIdNum,
        fromItemId: fromItemIdNum,
        toItemId: toItemIdNum,
        status: 'pending',
        message: message || null
      });
      
      // Create notification for recipient
      await storage.createNotification({
        userId: toUserIdNum,
        type: 'offer',
        content: `Yeni barter təklifi: "${fromItem.title}" əşyanız üçün "${toItem.title}"`,
        referenceId: offer.id,
        isRead: false
      });
      
      // Create or get conversation
      let conversation = await storage.getConversationByParticipants(userId, toUserIdNum);
      
      if (!conversation) {
        const newConversation = await storage.createConversation(
          {
            itemId: toItemIdNum,
            lastMessageAt: new Date()
          },
          [
            {
              userId,
              conversationId: 0 // Will be set by the storage implementation
            },
            {
              userId: toUserIdNum,
              conversationId: 0 // Will be set by the storage implementation
            }
          ]
        );
        
        conversation = await storage.getConversation(newConversation.id);
      }
      
      if (conversation) {
        // Create system message about the offer
        await storage.createMessage({
          conversationId: conversation.id,
          senderId: userId,
          content: `Barter təklifi yaratdım: "${fromItem.title}" əşyamı "${toItem.title}" əşyanız üçün təklif edirəm.`,
          isRead: false
        });
        
        // Update conversation's last message time
        await storage.updateConversationLastMessage(conversation.id);
      }
      
      // Broadcast offer to recipient if online
      broadcast({
        type: 'new_offer',
        userId: toUserIdNum,
        offer
      });
      
      res.status(201).json(offer);
    } catch (error) {
      console.error('Error creating offer:', error);
      res.status(500).json({ message: 'Error creating offer' });
    }
  });
  
  app.patch('/api/offers/:id/status', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.session.userId!;
      const { status } = req.body;
      
      if (!status || !['accepted', 'rejected', 'completed', 'cancelled'].includes(status)) {
        return res.status(400).json({ message: 'Valid status is required' });
      }
      
      // Get the offer
      const offer = await storage.getOffer(id);
      
      if (!offer) {
        return res.status(404).json({ message: 'Offer not found' });
      }
      
      // Check permissions based on action
      if (status === 'accepted' || status === 'rejected') {
        // Only the recipient can accept or reject
        if (offer.toUserId !== userId) {
          return res.status(403).json({ message: 'Only the recipient can accept or reject offers' });
        }
      } else if (status === 'completed') {
        // Both users can mark as completed
        if (offer.fromUserId !== userId && offer.toUserId !== userId) {
          return res.status(403).json({ message: 'You are not involved in this offer' });
        }
        
        // Can only complete accepted offers
        if (offer.status !== 'accepted') {
          return res.status(400).json({ message: 'Only accepted offers can be completed' });
        }
      } else if (status === 'cancelled') {
        // Only the sender can cancel (and only if pending)
        if (offer.fromUserId !== userId) {
          return res.status(403).json({ message: 'Only the sender can cancel offers' });
        }
        
        if (offer.status !== 'pending') {
          return res.status(400).json({ message: 'Only pending offers can be cancelled' });
        }
      }
      
      // Update offer status
      const updatedOffer = await storage.updateOfferStatus(id, status);
      
      if (!updatedOffer) {
        return res.status(500).json({ message: 'Failed to update offer status' });
      }
      
      // Find the other user to notify
      const otherUserId = offer.fromUserId === userId ? offer.toUserId : offer.fromUserId;
      
      // Create notification message based on action
      let notificationContent = '';
      
      if (status === 'accepted') {
        notificationContent = 'Barter təklifiniz qəbul edildi!';
      } else if (status === 'rejected') {
        notificationContent = 'Barter təklifiniz rədd edildi.';
      } else if (status === 'completed') {
        notificationContent = 'Barter əməliyyatı tamamlandı!';
      } else if (status === 'cancelled') {
        notificationContent = 'Barter təklifiniz ləğv edildi.';
      }
      
      // Create notification for the other user
      if (notificationContent) {
        await storage.createNotification({
          userId: otherUserId,
          type: 'offer_update',
          content: notificationContent,
          referenceId: id,
          isRead: false
        });
      }
      
      // Find conversation between users
      const conversation = await storage.getConversationByParticipants(
        offer.fromUserId,
        offer.toUserId
      );
      
      if (conversation) {
        // Create system message about the status change
        await storage.createMessage({
          conversationId: conversation.id,
          senderId: userId,
          content: `Barter təklifi ${status === 'accepted' ? 'qəbul edildi' : 
                                     status === 'rejected' ? 'rədd edildi' : 
                                     status === 'completed' ? 'tamamlandı' : 
                                     'ləğv edildi'}.`,
          isRead: false
        });
        
        // Update conversation's last message time
        await storage.updateConversationLastMessage(conversation.id);
      }
      
      // Broadcast status change to other user if online
      broadcast({
        type: 'offer_updated',
        userId: otherUserId,
        offer: updatedOffer
      });
      
      res.json(updatedOffer);
    } catch (error) {
      console.error('Error updating offer status:', error);
      res.status(500).json({ message: 'Error updating offer status' });
    }
  });
  
  // Reviews
  app.get('/api/users/:id/reviews', async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Check if user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Get reviews for the user
      const reviews = await storage.getReviewsByUser(userId);
      
      res.json(reviews);
    } catch (error) {
      console.error('Error getting reviews:', error);
      res.status(500).json({ message: 'Error getting reviews' });
    }
  });
  
  app.get('/api/users/:id/rating', async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Check if user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Get user rating
      const rating = await storage.getUserRating(userId);
      
      res.json(rating);
    } catch (error) {
      console.error('Error getting user rating:', error);
      res.status(500).json({ message: 'Error getting user rating' });
    }
  });
  
  app.post('/api/offers/:id/reviews', isAuthenticated, async (req, res) => {
    try {
      const offerId = parseInt(req.params.id);
      const userId = req.session.userId!;
      const { rating, comment } = req.body;
      
      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ message: 'Rating is required and must be between 1 and 5' });
      }
      
      // Check if offer exists
      const offer = await storage.getOffer(offerId);
      if (!offer) {
        return res.status(404).json({ message: 'Offer not found' });
      }
      
      // Check if user is involved in the offer
      if (offer.fromUserId !== userId && offer.toUserId !== userId) {
        return res.status(403).json({ message: 'You are not involved in this offer' });
      }
      
      // Check if offer is completed
      if (offer.status !== 'completed') {
        return res.status(400).json({ message: 'You can only review completed offers' });
      }
      
      // Check if user has already reviewed this offer
      const canReview = await storage.canReviewOffer(offerId, userId);
      if (!canReview) {
        return res.status(400).json({ message: 'You have already reviewed this offer' });
      }
      
      // Determine who is being reviewed
      const toUserId = offer.fromUserId === userId ? offer.toUserId : offer.fromUserId;
      
      // Create review
      const review = await storage.createReview({
        offerId,
        fromUserId: userId,
        toUserId,
        rating,
        comment: comment || null
      });
      
      // Create notification for reviewed user
      await storage.createNotification({
        userId: toUserId,
        type: 'review',
        content: `Yeni rəy aldınız: ${rating} ulduz` + (comment ? `: "${comment}"` : ''),
        referenceId: review.id,
        isRead: false
      });
      
      // Broadcast review to reviewed user if online
      broadcast({
        type: 'new_review',
        userId: toUserId,
        review
      });
      
      res.status(201).json(review);
    } catch (error) {
      console.error('Error creating review:', error);
      res.status(500).json({ message: 'Error creating review' });
    }
  });
  
  // Notifications
  app.get('/api/notifications', isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { includeRead, limit, offset } = req.query;
      
      const options = {
        includeRead: includeRead === 'true',
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined
      };
      
      const notifications = await storage.getNotificationsByUser(userId, options);
      
      res.json(notifications);
    } catch (error) {
      console.error('Error getting notifications:', error);
      res.status(500).json({ message: 'Error getting notifications' });
    }
  });
  
  app.get('/api/notifications/count', isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId!;
      
      const count = await storage.getUnreadNotificationsCount(userId);
      
      res.json({ count });
    } catch (error) {
      console.error('Error getting notification count:', error);
      res.status(500).json({ message: 'Error getting notification count' });
    }
  });
  
  app.patch('/api/notifications/:id/read', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.session.userId!;
      
      const success = await storage.markNotificationAsRead(id, userId);
      
      if (!success) {
        return res.status(500).json({ message: 'Failed to mark notification as read' });
      }
      
      res.status(200).json({ message: 'Notification marked as read' });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({ message: 'Error marking notification as read' });
    }
  });
  
  app.patch('/api/notifications/read-all', isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId!;
      
      const success = await storage.markAllNotificationsAsRead(userId);
      
      if (!success) {
        return res.status(500).json({ message: 'Failed to mark all notifications as read' });
      }
      
      res.status(200).json({ message: 'All notifications marked as read' });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      res.status(500).json({ message: 'Error marking all notifications as read' });
    }
  });
  
  // User avatar
  app.post('/api/users/me/avatar', isAuthenticated, upload.single('avatar'), async (req, res) => {
    try {
      const userId = req.session.userId!;
      
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }
      
      // Get current user
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Delete old avatar file if exists
      if (user.avatar && user.avatar.startsWith('/uploads/avatars/')) {
        try {
          const oldAvatarPath = path.join(process.cwd(), 'public', user.avatar);
          if (fs.existsSync(oldAvatarPath)) {
            fs.unlinkSync(oldAvatarPath);
          }
        } catch (error) {
          console.error('Failed to delete old avatar:', error);
        }
      }
      
      // Update user with new avatar
      const avatarUrl = `/uploads/avatars/${req.file.filename}`;
      const updatedUser = await storage.updateUser(userId, { avatar: avatarUrl });
      
      if (!updatedUser) {
        return res.status(500).json({ message: 'Failed to update avatar' });
      }
      
      // Return user data without password
      const { password, ...userWithoutPassword } = updatedUser;
      res.json({
        ...userWithoutPassword,
        avatarUrl
      });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      res.status(500).json({ message: 'Error uploading avatar' });
    }
  });
  
  // Admin routes for user management
  app.get('/api/admin/users', isAdmin, async (req, res) => {
    try {
      const search = req.query.search as string | undefined;
      const users = await storage.getAllUsers(search);
      
      // Remove passwords before sending
      const usersWithoutPasswords = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      
      res.json(usersWithoutPasswords);
    } catch (error) {
      console.error('Error getting admin users:', error);
      res.status(500).json({ message: 'Error getting users' });
    }
  });
  
  app.get('/api/admin/users/:id', isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Get user's items
      const items = await storage.getItemsByUser(userId);
      
      // Get user's rating
      const rating = await storage.getUserRating(userId);
      
      // Return user data without password
      const { password, ...userWithoutPassword } = user;
      res.json({
        ...userWithoutPassword,
        itemsCount: items.length,
        rating
      });
    } catch (error) {
      console.error('Error getting admin user:', error);
      res.status(500).json({ message: 'Error getting user' });
    }
  });
  
  app.patch('/api/admin/users/:id/role', isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { role } = req.body;
      
      if (!role || !['user', 'admin'].includes(role)) {
        return res.status(400).json({ message: 'Valid role is required' });
      }
      
      // Check if user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Update user role
      const updatedUser = await storage.updateUser(userId, { role });
      
      if (!updatedUser) {
        return res.status(500).json({ message: 'Failed to update user role' });
      }
      
      // Return user data without password
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error('Error updating user role:', error);
      res.status(500).json({ message: 'Error updating user role' });
    }
  });
  
  app.patch('/api/admin/users/:id/status', isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { active } = req.body;
      
      if (typeof active !== 'boolean') {
        return res.status(400).json({ message: 'Valid status is required' });
      }
      
      // Check if user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Update user status
      const updatedUser = await storage.updateUser(userId, { active });
      
      if (!updatedUser) {
        return res.status(500).json({ message: 'Failed to update user status' });
      }
      
      // Return user data without password
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error('Error updating user status:', error);
      res.status(500).json({ message: 'Error updating user status' });
    }
  });
  
  // Admin routes for items
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
      
      const items = await storage.getItems(options);
      
      // For each item, fetch the main image and owner info
      const itemsWithDetails = await Promise.all(items.map(async (item) => {
        const images = await storage.getImagesByItem(item.id);
        const mainImage = images.find(img => img.isMain)?.filePath || 
                          (images.length > 0 ? images[0].filePath : null);
        
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
      console.error('Error getting admin items:', error);
      res.status(500).json({ message: 'Error getting items' });
    }
  });
  
  app.patch('/api/admin/items/:id/status', isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!status || !['active', 'pending', 'suspended', 'completed'].includes(status)) {
        return res.status(400).json({ message: 'Valid status is required' });
      }
      
      // Update item status
      const updatedItem = await storage.updateItem(id, { status });
      
      if (!updatedItem) {
        return res.status(500).json({ message: 'Failed to update item status' });
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
      
      // Delete item
      const success = await storage.deleteItem(id);
      
      if (!success) {
        return res.status(500).json({ message: 'Failed to delete item' });
      }
      
      res.json({ message: 'Item deleted successfully' });
    } catch (error) {
      console.error('Error deleting item:', error);
      res.status(500).json({ message: 'Error deleting item' });
    }
  });
  
  // Admin statistics
  app.get('/api/admin/stats', isAdmin, async (req, res) => {
    try {
      const period = req.query.period as string || 'week';
      
      // In a full implementation, this would fetch real statistics from the database
      
      // This is a placeholder implementation
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

  return httpServer;
}