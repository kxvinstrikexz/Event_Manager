import { Request, Response } from 'express';
import { NotificationRepository } from '../repositories/NotificationRepository.js';

export class NotificationController {
  static async getNotifications(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required.' });
        return;
      }

      const notifications = NotificationRepository.listByUser(req.user.id);
      const unreadCount = NotificationRepository.getUnreadCount(req.user.id);

      res.json({ notifications, unreadCount });
    } catch (err: any) {
      console.error('[Get Notifications Error]', err);
      res.status(500).json({ error: 'Failed to retrieve notifications.' });
    }
  }

  static async markAsRead(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required.' });
        return;
      }

      const { id } = req.params;
      NotificationRepository.markAsRead(id, req.user.id);
      res.json({ message: 'Marked as read.' });
    } catch (err: any) {
      console.error('[Mark Read Error]', err);
      res.status(500).json({ error: 'Failed to update notification.' });
    }
  }

  static async markAllAsRead(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required.' });
        return;
      }

      NotificationRepository.markAllAsRead(req.user.id);
      res.json({ message: 'All notifications marked as read.' });
    } catch (err: any) {
      console.error('[Mark All Read Error]', err);
      res.status(500).json({ error: 'Failed to update notifications.' });
    }
  }
}
