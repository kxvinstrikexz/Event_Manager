import { dbHelper } from '../database/connection.js';

export interface NotificationRecord {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  link: string | null;
  is_read: number;
  created_at: string;
}

export class NotificationRepository {
  static create(notification: Omit<NotificationRecord, 'is_read' | 'created_at'>): NotificationRecord {
    dbHelper.run(
      `INSERT INTO notifications (id, user_id, title, message, type, link)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        notification.id,
        notification.user_id,
        notification.title,
        notification.message,
        notification.type,
        notification.link
      ]
    );
    return dbHelper.get<NotificationRecord>('SELECT * FROM notifications WHERE id = ?', [notification.id])!;
  }

  static listByUser(userId: string, limit: number = 20): NotificationRecord[] {
    return dbHelper.all<NotificationRecord>(
      `SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ?`,
      [userId, limit]
    );
  }

  static getUnreadCount(userId: string): number {
    const res = dbHelper.get<{ count: number }>(
      `SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0`,
      [userId]
    );
    return res?.count || 0;
  }

  static markAsRead(id: string, userId: string): void {
    dbHelper.run(
      `UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?`,
      [id, userId]
    );
  }

  static markAllAsRead(userId: string): void {
    dbHelper.run(
      `UPDATE notifications SET is_read = 1 WHERE user_id = ?`,
      [userId]
    );
  }
}
