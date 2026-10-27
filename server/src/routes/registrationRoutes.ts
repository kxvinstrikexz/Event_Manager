import { Router } from 'express';
import { RegistrationController } from '../controllers/registrationController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/my', requireAuth, requireRole('student'), RegistrationController.getMyRegistrations);
router.get('/pass/:id', requireAuth, RegistrationController.getPass);
router.post('/:id/cancel', requireAuth, RegistrationController.cancelRegistration);
router.get('/event/:eventId', requireAuth, requireRole('staff', 'admin'), RegistrationController.getEventRegistrations);
router.get('/all', requireAuth, requireRole('admin'), RegistrationController.getAllRegistrations);

export default router;
