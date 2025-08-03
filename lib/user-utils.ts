import { turso, User } from './db';
import { v4 as uuidv4 } from 'uuid';

export async function createOrGetUser(userId?: string): Promise<User> {
  let finalUserId = userId;
  
  if (!finalUserId) {
    finalUserId = uuidv4();
  }

  try {
    // Try to get existing user
    const result = await turso.execute({
      sql: 'SELECT * FROM users WHERE user_id = ?',
      args: [finalUserId],
    });

    if (result.rows.length > 0) {
      return result.rows[0] as unknown as User;
    }

    // Create new user if doesn't exist
    await turso.execute({
      sql: `INSERT INTO users (user_id, name, plan_status, pdf_uploads, question_count) 
            VALUES (?, ?, 'free', 0, 0)`,
      args: [finalUserId, 'Anonymous User'],
    });

    const newUserResult = await turso.execute({
      sql: 'SELECT * FROM users WHERE user_id = ?',
      args: [finalUserId],
    });

    return newUserResult.rows[0] as unknown as User;
  } catch (error) {
    console.error('Error creating/getting user:', error);
    throw error;
  }
}

export async function updateUserName(userId: string, name: string): Promise<void> {
  try {
    await turso.execute({
      sql: 'UPDATE users SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?',
      args: [name, userId],
    });
  } catch (error) {
    console.error('Error updating user name:', error);
    throw error;
  }
}

export async function incrementPDFUpload(userId: string): Promise<boolean> {
  try {
    const user = await createOrGetUser(userId);
    
    if (user.pdf_uploads >= 1 && user.plan_status === 'free') {
      return false; // Limit reached
    }

    await turso.execute({
      sql: 'UPDATE users SET pdf_uploads = pdf_uploads + 1, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?',
      args: [userId],
    });

    return true;
  } catch (error) {
    console.error('Error incrementing PDF upload:', error);
    throw error;
  }
}

export async function incrementQuestionCount(userId: string): Promise<boolean> {
  try {
    const user = await createOrGetUser(userId);
    
    if (user.question_count >= 4 && user.plan_status === 'free') {
      return false; // Limit reached
    }

    await turso.execute({
      sql: 'UPDATE users SET question_count = question_count + 1, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?',
      args: [userId],
    });

    return true;
  } catch (error) {
    console.error('Error incrementing question count:', error);
    throw error;
  }
}

export async function getUserChatHistory(userId: string, documentId?: number) {
  try {
    let sql = `
      SELECT ch.*, d.filename 
      FROM chat_history ch
      LEFT JOIN documents d ON ch.document_id = d.id
      WHERE ch.user_id = ?
    `;
    const args = [userId];

    if (documentId) {
      sql += ' AND ch.document_id = ?';
      args.push(documentId.toString());
    }

    sql += ' ORDER BY ch.created_at ASC';

    const result = await turso.execute({
      sql,
      args,
    });

    return result.rows;
  } catch (error) {
    console.error('Error getting chat history:', error);
    throw error;
  }
}