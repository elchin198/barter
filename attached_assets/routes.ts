import express, { type Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { loginSchema, insertUserSchema, insertItemSchema, insertImageSchema, insertFavoriteSchema } from "@shared/schema";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import multer from "multer";
import path from "path";
import fs from "fs";
import { setupAuth, isAuthenticated } from "./auth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Configure authentication
  setupAuth(app);

  // Configure file uploads
  const uploadsDir = path.join(process.cwd(), "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const storage_upload = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    },
  });

  const upload = multer({ storage: storage_upload });

  // All auth routes are now handled by setupAuth from "./auth.ts"

  // Categories routes
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getAllCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/categories/:name", async (req, res) => {
    try {
      const category = await storage.getCategoryByName(req.params.name);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.json(category);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Items routes
  app.get("/api/items/recent", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 8;
      const items = await storage.getRecentItems(limit);
      
      // Get first image for each item
      const itemsWithImages = await Promise.all(
        items.map(async (item) => {
          const images = await storage.getImagesByItemId(item.id);
          const firstImage = images.length > 0 ? images[0] : null;
          
          return {
            ...item,
            image: firstImage ? firstImage.url : null,
          };
        })
      );
      
      res.json(itemsWithImages);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/items/search", async (req, res) => {
    try {
      const query = req.query.q as string || "";
      const category = req.query.category as string;
      
      if (!query) {
        return res.status(400).json({ message: "Search query is required" });
      }
      
      const items = await storage.searchItems(query, category);
      
      // Get first image for each item
      const itemsWithImages = await Promise.all(
        items.map(async (item) => {
          const images = await storage.getImagesByItemId(item.id);
          const firstImage = images.length > 0 ? images[0] : null;
          
          return {
            ...item,
            image: firstImage ? firstImage.url : null,
          };
        })
      );
      
      res.json(itemsWithImages);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/items/category/:category", async (req, res) => {
    try {
      const items = await storage.getItemsByCategory(req.params.category);
      
      // Get first image for each item
      const itemsWithImages = await Promise.all(
        items.map(async (item) => {
          const images = await storage.getImagesByItemId(item.id);
          const firstImage = images.length > 0 ? images[0] : null;
          
          return {
            ...item,
            image: firstImage ? firstImage.url : null,
          };
        })
      );
      
      res.json(itemsWithImages);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/items/:id", async (req, res) => {
    try {
      const itemId = parseInt(req.params.id);
      const item = await storage.getItem(itemId);
      
      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }
      
      // Get user data
      const user = await storage.getUser(item.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Get images
      const images = await storage.getImagesByItemId(itemId);
      
      // Check if item is favorited by current user
      let isFavorite = false;
      if (req.user) {
        isFavorite = await storage.isFavorite((req.user as any).id, itemId);
      }
      
      // Remove password from user data
      const { password, ...userWithoutPassword } = user;
      
      res.json({
        ...item,
        user: userWithoutPassword,
        images,
        isFavorite
      });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/items", isAuthenticated, async (req, res) => {
    try {
      const itemData = insertItemSchema.parse(req.body);
      
      // Set the user ID from the authenticated user
      itemData.userId = (req.user as any).id;
      
      const item = await storage.createItem(itemData);
      res.status(201).json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ message: validationError.message });
      } else {
        res.status(500).json({ message: "Server error" });
      }
    }
  });

  app.patch("/api/items/:id/status", isAuthenticated, async (req, res) => {
    try {
      const itemId = parseInt(req.params.id);
      const status = req.body.status as 'active' | 'pending' | 'completed' | 'inactive';
      
      // Get the item
      const item = await storage.getItem(itemId);
      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }
      
      // Verify the current user owns the item
      if (item.userId !== (req.user as any).id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      // Update the status
      const updatedItem = await storage.updateItemStatus(itemId, status);
      if (!updatedItem) {
        return res.status(404).json({ message: "Item not found" });
      }
      
      res.json(updatedItem);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Images routes
  app.post("/api/images", isAuthenticated, upload.single("image"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Şəkil yüklənmədi" });
      }
      
      const itemId = parseInt(req.body.itemId);
      const isPrimary = req.body.isPrimary === "true";
      
      // Get the item
      const item = await storage.getItem(itemId);
      if (!item) {
        return res.status(404).json({ message: "İlan tapılmadı" });
      }
      
      // Verify the current user owns the item
      if (item.userId !== (req.user as any).id) {
        // Delete the uploaded file
        fs.unlinkSync(req.file.path);
        return res.status(403).json({ message: "İcazə yoxdur" });
      }
      
      // Check the number of existing images for this item
      const existingImages = await storage.getImagesByItemId(itemId);
      if (existingImages.length >= 6) {
        // Delete the uploaded file
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ message: "Maksimum 6 şəkil yükləyə bilərsiniz" });
      }
      
      // Set as primary if it's the first image
      const isFirstImage = existingImages.length === 0;
      
      // Create the image
      const imageUrl = `/uploads/${path.basename(req.file.path)}`;
      const image = await storage.createImage({
        itemId,
        url: imageUrl,
        isPrimary: isPrimary || isFirstImage
      });
      
      res.status(201).json(image);
    } catch (error) {
      res.status(500).json({ message: "Server xətası" });
    }
  });

  // Favorites routes
  app.get("/api/favorites", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const favorites = await storage.getFavoritesByUserId(userId);
      
      // Get items for each favorite
      const itemsWithDetails = await Promise.all(
        favorites.map(async (favorite) => {
          const item = await storage.getItem(favorite.itemId);
          if (!item) return null;
          
          const images = await storage.getImagesByItemId(favorite.itemId);
          const firstImage = images.length > 0 ? images[0] : null;
          
          return {
            ...item,
            favoriteId: favorite.id,
            image: firstImage ? firstImage.url : null,
          };
        })
      );
      
      // Filter out null values (items that no longer exist)
      const validItems = itemsWithDetails.filter(item => item !== null);
      
      res.json(validItems);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/favorites", isAuthenticated, async (req, res) => {
    try {
      const favoriteData = insertFavoriteSchema.parse({
        ...req.body,
        userId: (req.user as any).id
      });
      
      // Check if item exists
      const item = await storage.getItem(favoriteData.itemId);
      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }
      
      // Check if already favorited
      const isAlreadyFavorite = await storage.isFavorite(favoriteData.userId, favoriteData.itemId);
      if (isAlreadyFavorite) {
        return res.status(400).json({ message: "Item already in favorites" });
      }
      
      const favorite = await storage.addFavorite(favoriteData);
      res.status(201).json(favorite);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ message: validationError.message });
      } else {
        res.status(500).json({ message: "Server error" });
      }
    }
  });

  app.delete("/api/favorites/:itemId", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const itemId = parseInt(req.params.itemId);
      
      await storage.removeFavorite(userId, itemId);
      res.json({ message: "Favorite removed successfully" });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // User profile routes
  app.get("/api/users/:id/items", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Verify user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const items = await storage.getItemsByUserId(userId);
      
      // Get first image for each item
      const itemsWithImages = await Promise.all(
        items.map(async (item) => {
          const images = await storage.getImagesByItemId(item.id);
          const firstImage = images.length > 0 ? images[0] : null;
          
          return {
            ...item,
            image: firstImage ? firstImage.url : null,
          };
        })
      );
      
      res.json(itemsWithImages);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Conversations and Messages
  // Get all conversations for a user
  app.get("/api/conversations", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const conversations = await storage.getConversationsByUserId(userId);
      
      // Enrich conversations with additional data
      const enrichedConversations = await Promise.all(
        conversations.map(async (conversation) => {
          // Get the item details
          const item = await storage.getItem(conversation.itemId);
          if (!item) return null;
          
          // Get participants
          const participantIds = Array.from(
            new Set((await Promise.all(
              (await storage.getConversationParticipants(conversation.id))
                .map(async (p) => {
                  const user = await storage.getUser(p.userId);
                  if (!user) return null;
                  return {
                    id: user.id,
                    username: user.username,
                    fullName: user.fullName,
                    avatar: user.avatar
                  };
                })
            )).filter(Boolean))
          );
          
          // Get latest message
          const messages = await storage.getMessagesByConversationId(conversation.id);
          const latestMessage = messages.length > 0 
            ? messages[messages.length - 1] 
            : null;
          
          return {
            ...conversation,
            item: {
              id: item.id,
              title: item.title,
              image: (await storage.getImagesByItemId(item.id))[0]?.url
            },
            participants: participantIds,
            latestMessage: latestMessage ? {
              id: latestMessage.id,
              content: latestMessage.content,
              senderId: latestMessage.senderId,
              status: latestMessage.status,
              createdAt: latestMessage.createdAt
            } : null,
            unreadCount: messages.filter(
              m => m.senderId !== userId && m.status !== 'read'
            ).length
          };
        })
      );
      
      // Filter out null values
      const validConversations = enrichedConversations.filter(Boolean);
      
      res.json(validConversations);
    } catch (error) {
      res.status(500).json({ message: "Server xətası" });
    }
  });
  
  // Get or create a conversation between two users for an item
  app.post("/api/conversations", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const { itemId, receiverId } = req.body;
      
      if (!itemId || !receiverId) {
        return res.status(400).json({ message: "İlan ID və alıcı ID tələb olunur" });
      }
      
      // Check if item exists
      const item = await storage.getItem(parseInt(itemId));
      if (!item) {
        return res.status(404).json({ message: "İlan tapılmadı" });
      }
      
      // Check if receiver exists
      const receiver = await storage.getUser(parseInt(receiverId));
      if (!receiver) {
        return res.status(404).json({ message: "İstifadəçi tapılmadı" });
      }
      
      // Don't allow conversations with yourself
      if (userId === parseInt(receiverId)) {
        return res.status(400).json({ message: "Özünüzlə söhbət edə bilməzsiniz" });
      }
      
      // Check if a conversation already exists
      let conversation = await storage.getConversationByParticipants(
        userId, 
        parseInt(receiverId), 
        parseInt(itemId)
      );
      
      if (!conversation) {
        // Create a new conversation
        conversation = await storage.createConversation({
          itemId: parseInt(itemId)
        });
        
        // Add participants
        await storage.addParticipantToConversation({
          conversationId: conversation.id,
          userId: userId
        });
        
        await storage.addParticipantToConversation({
          conversationId: conversation.id,
          userId: parseInt(receiverId)
        });
      }
      
      res.status(201).json(conversation);
    } catch (error) {
      res.status(500).json({ message: "Server xətası" });
    }
  });
  
  // Get messages for a conversation
  app.get("/api/conversations/:id/messages", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const conversationId = parseInt(req.params.id);
      
      // Check if conversation exists
      const conversation = await storage.getConversation(conversationId);
      if (!conversation) {
        return res.status(404).json({ message: "Söhbət tapılmadı" });
      }
      
      // Check if user is a participant
      const isParticipant = (await storage.getConversationParticipants(conversationId))
        .some(p => p.userId === userId);
      
      if (!isParticipant) {
        return res.status(403).json({ message: "Bu söhbətə baxmağa icazəniz yoxdur" });
      }
      
      // Get messages
      const messages = await storage.getMessagesByConversationId(conversationId);
      
      // Mark messages as read
      await Promise.all(
        messages
          .filter(m => m.senderId !== userId && m.status !== 'read')
          .map(m => storage.updateMessageStatus(m.id, 'read'))
      );
      
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Server xətası" });
    }
  });
  
  // Send a message in a conversation
  app.post("/api/conversations/:id/messages", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const conversationId = parseInt(req.params.id);
      const { content } = req.body;
      
      if (!content || content.trim() === '') {
        return res.status(400).json({ message: "Mesaj məzmunu tələb olunur" });
      }
      
      // Check if conversation exists
      const conversation = await storage.getConversation(conversationId);
      if (!conversation) {
        return res.status(404).json({ message: "Söhbət tapılmadı" });
      }
      
      // Check if user is a participant
      const isParticipant = (await storage.getConversationParticipants(conversationId))
        .some(p => p.userId === userId);
      
      if (!isParticipant) {
        return res.status(403).json({ message: "Bu söhbətə mesaj göndərməyə icazəniz yoxdur" });
      }
      
      // Create message
      const message = await storage.createMessage({
        conversationId,
        senderId: userId,
        content,
        status: 'sent'
      });
      
      res.status(201).json(message);
    } catch (error) {
      res.status(500).json({ message: "Server xətası" });
    }
  });

  // Serve uploaded files
  app.use("/uploads", express.static(uploadsDir));

  const httpServer = createServer(app);
  return httpServer;
}
