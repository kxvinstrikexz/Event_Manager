import { Router } from 'express';
import { ProfileController } from '../controllers/profileController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.put('/update', requireAuth, ProfileController.updateProfile);
router.post('/change-password', requireAuth, ProfileController.changePassword);

export default router;
