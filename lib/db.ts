import { createClient } from '@libsql/client';

export const turso = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// Database schema initialization
export async function initializeDatabase() {
  try {
    // Users table
    await turso.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        plan_status TEXT DEFAULT 'free',
        pdf_uploads INTEGER DEFAULT 0,
        question_count INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Documents table
    await turso.execute(`
      CREATE TABLE IF NOT EXISTS documents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        filename TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (user_id)
      )
    `);

    // Chat history table
    await turso.execute(`
      CREATE TABLE IF NOT EXISTS chat_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        document_id INTEGER,
        question TEXT NOT NULL,
        answer TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (user_id),
        FOREIGN KEY (document_id) REFERENCES documents (id)
      )
    `);

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

export interface User {
  id: number;
  user_id: string;
  name: string;
  plan_status: 'free' | 'paid';
  pdf_uploads: number;
  question_count: number;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: number;
  user_id: string;
  filename: string;
  content: string;
  created_at: string;
}

export interface ChatMessage {
  id: number;
  user_id: string;
  document_id: number | null;
  question: string;
  answer: string;
  created_at: string;
}