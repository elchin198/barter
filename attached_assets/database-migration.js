// Import required modules
import { query, convertPgToMySql } from './adapters/mysql-adapter.js';

// Define your schema creation functions
async function createUsersTable() {
  const sql = convertPgToMySql(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(255) NOT NULL UNIQUE,
      email VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      fullName VARCHAR(255) NOT NULL,
      phone VARCHAR(255) NULL,
      city VARCHAR(255) NULL,
      avatar VARCHAR(255) NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
    )
  `);
  
  await query(sql);
  console.log('Users table created successfully');
}

async function createItemsTable() {
  const sql = convertPgToMySql(`
    CREATE TABLE IF NOT EXISTS items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      category ENUM('electronics', 'clothing', 'furniture', 'auto', 'realestate', 'sports', 'kids', 'books', 'other') NOT NULL,
      subcategory VARCHAR(255) NULL,
      location VARCHAR(255) NOT NULL,
      wantedExchange TEXT NOT NULL,
      status ENUM('active', 'pending', 'completed', 'inactive') DEFAULT 'active',
      userId INT NOT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  
  await query(sql);
  console.log('Items table created successfully');
}

async function createImagesTable() {
  const sql = convertPgToMySql(`
    CREATE TABLE IF NOT EXISTS images (
      id INT AUTO_INCREMENT PRIMARY KEY,
      url VARCHAR(255) NOT NULL,
      itemId INT NOT NULL,
      isPrimary BOOLEAN DEFAULT FALSE,
      FOREIGN KEY (itemId) REFERENCES items(id) ON DELETE CASCADE
    )
  `);
  
  await query(sql);
  console.log('Images table created successfully');
}

async function createFavoritesTable() {
  const sql = convertPgToMySql(`
    CREATE TABLE IF NOT EXISTS favorites (
      id INT AUTO_INCREMENT PRIMARY KEY,
      userId INT NOT NULL,
      itemId INT NOT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (itemId) REFERENCES items(id) ON DELETE CASCADE,
      UNIQUE(userId, itemId)
    )
  `);
  
  await query(sql);
  console.log('Favorites table created successfully');
}

async function createCategoriesTable() {
  const sql = convertPgToMySql(`
    CREATE TABLE IF NOT EXISTS categories (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      displayName VARCHAR(255) NOT NULL
    )
  `);
  
  await query(sql);
  console.log('Categories table created successfully');
}

async function createConversationsTable() {
  const sql = convertPgToMySql(`
    CREATE TABLE IF NOT EXISTS conversations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      itemId INT NOT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
      FOREIGN KEY (itemId) REFERENCES items(id) ON DELETE CASCADE
    )
  `);
  
  await query(sql);
  console.log('Conversations table created successfully');
}

async function createConversationParticipantsTable() {
  const sql = convertPgToMySql(`
    CREATE TABLE IF NOT EXISTS conversation_participants (
      id INT AUTO_INCREMENT PRIMARY KEY,
      conversationId INT NOT NULL,
      userId INT NOT NULL,
      FOREIGN KEY (conversationId) REFERENCES conversations(id) ON DELETE CASCADE,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(conversationId, userId)
    )
  `);
  
  await query(sql);
  console.log('Conversation participants table created successfully');
}

async function createMessagesTable() {
  const sql = convertPgToMySql(`
    CREATE TABLE IF NOT EXISTS messages (
      id INT AUTO_INCREMENT PRIMARY KEY,
      content TEXT NOT NULL,
      conversationId INT NOT NULL,
      senderId INT NOT NULL,
      status ENUM('sent', 'delivered', 'read') DEFAULT 'sent',
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
      FOREIGN KEY (conversationId) REFERENCES conversations(id) ON DELETE CASCADE,
      FOREIGN KEY (senderId) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  
  await query(sql);
  console.log('Messages table created successfully');
}

async function insertDefaultCategories() {
  const categories = [
    { name: 'electronics', displayName: 'Elektronika' },
    { name: 'clothing', displayName: 'Geyim' },
    { name: 'furniture', displayName: 'Mebel' },
    { name: 'auto', displayName: 'Avtomobil' },
    { name: 'realestate', displayName: 'Daşınmaz əmlak' },
    { name: 'sports', displayName: 'İdman' },
    { name: 'kids', displayName: 'Uşaq' },
    { name: 'books', displayName: 'Kitablar' },
    { name: 'other', displayName: 'Digər' }
  ];

  for (const category of categories) {
    const checkSql = 'SELECT COUNT(*) as count FROM categories WHERE name = ?';
    const result = await query(checkSql, [category.name]);
    
    if (result[0].count === 0) {
      const insertSql = 'INSERT INTO categories (name, displayName) VALUES (?, ?)';
      await query(insertSql, [category.name, category.displayName]);
      console.log(`Category ${category.name} added`);
    } else {
      console.log(`Category ${category.name} already exists`);
    }
  }
}

// Main migration function
async function migrate() {
  try {
    console.log('Starting database migration...');
    
    // Create tables
    await createUsersTable();
    await createItemsTable();
    await createImagesTable();
    await createFavoritesTable();
    await createCategoriesTable();
    await createConversationsTable();
    await createConversationParticipantsTable();
    await createMessagesTable();
    
    // Insert default data
    await insertDefaultCategories();
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

// Run the migration
migrate();