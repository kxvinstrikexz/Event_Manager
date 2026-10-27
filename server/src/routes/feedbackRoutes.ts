import { Router } from 'express';
import { FeedbackController } from '../controllers/feedbackController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.post('/', requireAuth, requireRole('student'), FeedbackController.submitFeedback);
router.get('/event/:eventId', requireAuth, requireRole('staff', 'admin'), FeedbackController.getEventFeedback);
router.get('/all', requireAuth, requireRole('admin'), FeedbackController.getAllFeedback);

export default router;
