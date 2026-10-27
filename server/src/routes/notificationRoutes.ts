import { Router } from 'express';
import { NotificationController } from '../controllers/notificationController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, NotificationController.getNotifications);
router.post('/:id/read', requireAuth, NotificationController.markAsRead);
router.post('/read-all', requireAuth, NotificationController.markAllAsRead);

export default router;
