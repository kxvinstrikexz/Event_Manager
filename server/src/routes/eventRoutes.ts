import { Router } from 'express';
import { EventController } from '../controllers/eventController.js';
import { RegistrationController } from '../controllers/registrationController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { UserRepository } from '../repositories/UserRepository.js';

// Soft-auth middleware for optional user context (e.g. knowing if current user is registered)
function optionalAuth(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, config.jwtSecret) as { userId: string };
      const user = UserRepository.findById(decoded.userId);
      if (user) {
        req.user = {
          id: user.id,
          role: user.role,
          email: user.email,
          username: user.username,
          status: user.status
        };
      }
    } catch {
      // Ignore token verification errors for optional auth
    }
  }
  next();
}

const router = Router();

router.get('/', optionalAuth, EventController.listEvents);
router.get('/my/staff', requireAuth, requireRole('staff'), EventController.getMyStaffEvents);
router.get('/:id', optionalAuth, EventController.getEvent);

router.post('/', requireAuth, requireRole('staff', 'admin'), EventController.createEvent);
router.put('/:id', requireAuth, requireRole('staff', 'admin'), EventController.updateEvent);
router.delete('/:id', requireAuth, requireRole('staff', 'admin'), EventController.deleteEvent);

// Register endpoint nested under event
router.post('/:id/register', requireAuth, requireRole('student'), RegistrationController.registerForEvent);

export default router;
