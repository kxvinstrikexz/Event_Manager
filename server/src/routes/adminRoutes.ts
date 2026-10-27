import { Router } from 'express';
import { StaffManagementController } from '../controllers/staffManagementController.js';
import { AdminDepartmentController } from '../controllers/adminDepartmentController.js';
import { AdminReportsController } from '../controllers/adminReportsController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

// Require admin for all admin routes
router.use(requireAuth, requireRole('admin'));

// Staff management
router.get('/staff', StaffManagementController.listStaff);
router.post('/staff/:userId/approve', StaffManagementController.approveStaff);
router.post('/staff/:userId/reject', StaffManagementController.rejectStaff);
router.post('/staff/:userId/suspend', StaffManagementController.suspendStaff);
router.post('/staff/:userId/unsuspend', StaffManagementController.unsuspendStaff);
router.post('/staff/:userId/ban', StaffManagementController.banStaff);
router.post('/staff/:userId/unban', StaffManagementController.unbanStaff);
router.post('/staff/:userId/delete', StaffManagementController.deleteStaff);

// Department-wise Staff Management & Transfers
router.get('/departments', AdminDepartmentController.listDepartments);
router.post('/departments', AdminDepartmentController.createDepartment);
router.put('/departments/:id', AdminDepartmentController.updateDepartment);
router.get('/departments/:id/staff', AdminDepartmentController.getDepartmentStaff);
router.post('/staff/:userId/transfer-department', AdminDepartmentController.transferStaffDepartment);
router.get('/staff/:userId/transfer-history', AdminDepartmentController.getStaffTransferHistory);

// Security Audit Logs
router.get('/audit-logs', StaffManagementController.getAuditLogs);

// Reports & analytics
router.get('/reports', AdminReportsController.getReports);

export default router;
