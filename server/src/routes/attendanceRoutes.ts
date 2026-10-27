import { Router } from 'express';
import { AttendanceController } from '../controllers/attendanceController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.post('/verify', requireAuth, requireRole('staff', 'admin'), AttendanceController.verifyAttendance);
router.get('/my', requireAuth, requireRole('student'), AttendanceController.getMyAttendance);
router.get('/event/:eventId', requireAuth, requireRole('staff', 'admin'), AttendanceController.getEventAttendance);
router.get('/all', requireAuth, requireRole('admin'), AttendanceController.getAllAttendance);

export default router;
