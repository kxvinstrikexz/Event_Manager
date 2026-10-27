import { Router } from 'express';
import { AuthController } from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';
import { authRateLimiter, passwordResetRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.post('/register', authRateLimiter, AuthController.registerStudent);
router.post('/login', authRateLimiter, AuthController.loginStudent);

router.post('/staff/register', authRateLimiter, AuthController.registerStaff);
router.post('/staff/login', authRateLimiter, AuthController.loginStaff);

router.post('/admin/login', authRateLimiter, AuthController.loginAdmin);

router.post('/verify-otp', authRateLimiter, AuthController.verifyOtp);
router.post('/resend-otp', authRateLimiter, AuthController.resendOtp);

router.post('/forgot-password', passwordResetRateLimiter, AuthController.forgotPassword);
router.post('/reset-password', passwordResetRateLimiter, AuthController.resetPassword);

router.get('/me', requireAuth, AuthController.getMe);

export default router;

