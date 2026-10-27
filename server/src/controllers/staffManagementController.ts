import { Request, Response } from 'express';
import crypto from 'node:crypto';
import { StaffRepository } from '../repositories/StaffRepository.js';
import { UserRepository } from '../repositories/UserRepository.js';
import { NotificationRepository } from '../repositories/NotificationRepository.js';
import { AuditLogRepository } from '../repositories/AuditLogRepository.js';

export class StaffManagementController {
  // Helper to resolve staff member by userId, id, or staff_id
  private static findStaff(target: string) {
    let staff = StaffRepository.findByUserId(target);
    if (!staff) staff = StaffRepository.findById(target);
    if (!staff) staff = StaffRepository.findByStaffId(target);
    return staff;
  }

  // List staff members with oversight fields
  static async listStaff(req: Request, res: Response): Promise<void> {
    try {
      if (req.user?.role !== 'admin') {
        res.status(403).json({ error: 'Admin privileges required.' });
        return;
      }

      const { status, search } = req.query;
      const staffList = StaffRepository.listAll({
        status: status as string,
        search: search as string
      });

      const pendingCount = StaffRepository.getPendingCount();

      res.json({ staff: staffList, pendingCount });
    } catch (err: any) {
      console.error('[List Staff Error]', err);
      res.status(500).json({ error: 'Failed to retrieve staff directory.' });
    }
  }

  // Approve staff member
  static async approveStaff(req: Request, res: Response): Promise<void> {
    try {
      if (req.user?.role !== 'admin') {
        res.status(403).json({ error: 'Admin privileges required.' });
        return;
      }

      const { userId } = req.params;
      const staff = StaffManagementController.findStaff(userId);

      if (!staff) {
        res.status(404).json({ error: 'Staff account not found.' });
        return;
      }

      const previousStatus = staff.approval_status;
      StaffRepository.setApprovalStatus(staff.user_id, 'approved', req.user.id);

      // Audit log
      AuditLogRepository.create({
        admin_id: req.user.id,
        target_user_id: staff.user_id,
        target_staff_id: staff.staff_id,
        target_name: staff.full_name,
        action: 'APPROVE_STAFF',
        previous_status: previousStatus,
        new_status: 'approved',
        reason: 'Credentials reviewed and approved by institutional administration.'
      });

      // Notification to staff
      NotificationRepository.create({
        id: crypto.randomUUID(),
        user_id: staff.user_id,
        title: 'Staff Account Approved',
        message: 'Your official faculty/staff profile has been verified and approved by administration. You now have full access to create events and conduct attendance.',
        type: 'approval',
        link: '/staff/dashboard'
      });

      res.json({
        success: true,
        message: `Staff member ${staff.full_name} (${staff.staff_id}) has been approved.`,
        staff: {
          id: staff.id,
          user_id: staff.user_id,
          staff_id: staff.staff_id,
          full_name: staff.full_name,
          approval_status: 'approved',
          account_status: 'active'
        }
      });
    } catch (err: any) {
      console.error('[Approve Staff Error]', err);
      res.status(500).json({ error: 'Failed to approve staff member.' });
    }
  }

  // Reject staff member
  static async rejectStaff(req: Request, res: Response): Promise<void> {
    try {
      if (req.user?.role !== 'admin') {
        res.status(403).json({ error: 'Admin privileges required.' });
        return;
      }

      const { userId } = req.params;
      const { reason } = req.body;

      if (!reason || !reason.trim()) {
        res.status(400).json({ error: 'A justification reason is required to reject an application.' });
        return;
      }

      const staff = StaffManagementController.findStaff(userId);
      if (!staff) {
        res.status(404).json({ error: 'Staff account not found.' });
        return;
      }

      const previousStatus = staff.approval_status;
      StaffRepository.setApprovalStatus(staff.user_id, 'rejected', req.user.id, reason.trim());

      AuditLogRepository.create({
        admin_id: req.user.id,
        target_user_id: staff.user_id,
        target_staff_id: staff.staff_id,
        target_name: staff.full_name,
        action: 'REJECT_STAFF',
        previous_status: previousStatus,
        new_status: 'rejected',
        reason: reason.trim()
      });

      NotificationRepository.create({
        id: crypto.randomUUID(),
        user_id: staff.user_id,
        title: 'Staff Application Decision',
        message: `Your staff application was not approved. Reason: ${reason.trim()}`,
        type: 'approval',
        link: '/staff/login'
      });

      res.json({
        success: true,
        message: `Staff member ${staff.full_name} has been rejected.`,
        staff: {
          id: staff.id,
          user_id: staff.user_id,
          staff_id: staff.staff_id,
          full_name: staff.full_name,
          approval_status: 'rejected'
        }
      });
    } catch (err: any) {
      console.error('[Reject Staff Error]', err);
      res.status(500).json({ error: 'Failed to reject staff member.' });
    }
  }

  // Suspend staff member
  static async suspendStaff(req: Request, res: Response): Promise<void> {
    try {
      if (req.user?.role !== 'admin') {
        res.status(403).json({ error: 'Admin privileges required.' });
        return;
      }

      const { userId } = req.params;
      const { reason } = req.body;

      if (!reason || !reason.trim()) {
        res.status(400).json({ error: 'A valid reason is required for account suspension.' });
        return;
      }

      const staff = StaffManagementController.findStaff(userId);
      if (!staff) {
        res.status(404).json({ error: 'Staff account not found.' });
        return;
      }

      const previousStatus = staff.account_status || 'active';
      StaffRepository.setAccountStatus(staff.user_id, 'suspended', req.user.id, reason.trim());

      // Track blocked identity
      StaffRepository.blockIdentity(
        staff.staff_id,
        staff.official_email,
        staff.user_id,
        reason.trim(),
        'suspended',
        req.user.id
      );

      // Audit log
      AuditLogRepository.create({
        admin_id: req.user.id,
        target_user_id: staff.user_id,
        target_staff_id: staff.staff_id,
        target_name: staff.full_name,
        action: 'SUSPEND_STAFF',
        previous_status: previousStatus,
        new_status: 'suspended',
        reason: reason.trim()
      });

      NotificationRepository.create({
        id: crypto.randomUUID(),
        user_id: staff.user_id,
        title: 'Account Suspended',
        message: `Your faculty/staff credentials have been suspended by institutional administration. Reason: ${reason.trim()}`,
        type: 'system',
        link: null
      });

      res.json({
        success: true,
        message: `Staff member ${staff.full_name} (${staff.staff_id}) has been suspended.`,
        staff: {
          id: staff.id,
          user_id: staff.user_id,
          staff_id: staff.staff_id,
          full_name: staff.full_name,
          approval_status: staff.approval_status,
          account_status: 'suspended'
        }
      });
    } catch (err: any) {
      console.error('[Suspend Staff Error]', err);
      res.status(500).json({ error: 'Failed to suspend staff member.' });
    }
  }

  // Unsuspend / Reactivate staff member
  static async unsuspendStaff(req: Request, res: Response): Promise<void> {
    try {
      if (req.user?.role !== 'admin') {
        res.status(403).json({ error: 'Admin privileges required.' });
        return;
      }

      const { userId } = req.params;
      const { reason } = req.body;

      const staff = StaffManagementController.findStaff(userId);
      if (!staff) {
        res.status(404).json({ error: 'Staff account not found.' });
        return;
      }

      const previousStatus = staff.account_status || 'suspended';
      StaffRepository.setAccountStatus(staff.user_id, 'active', req.user.id);
      StaffRepository.unblockIdentity(staff.staff_id, staff.official_email);

      AuditLogRepository.create({
        admin_id: req.user.id,
        target_user_id: staff.user_id,
        target_staff_id: staff.staff_id,
        target_name: staff.full_name,
        action: 'UNSUSPEND_STAFF',
        previous_status: previousStatus,
        new_status: 'active',
        reason: reason?.trim() || 'Suspension lifted by institutional administration.'
      });

      NotificationRepository.create({
        id: crypto.randomUUID(),
        user_id: staff.user_id,
        title: 'Account Reactivated',
        message: 'Your faculty/staff credentials have been restored. You may now access the staff portal and manage university events.',
        type: 'system',
        link: '/staff/dashboard'
      });

      res.json({
        success: true,
        message: `Staff member ${staff.full_name} (${staff.staff_id}) has been reactivated.`,
        staff: {
          id: staff.id,
          user_id: staff.user_id,
          staff_id: staff.staff_id,
          full_name: staff.full_name,
          approval_status: staff.approval_status,
          account_status: 'active'
        }
      });
    } catch (err: any) {
      console.error('[Unsuspend Staff Error]', err);
      res.status(500).json({ error: 'Failed to reactivate staff member.' });
    }
  }

  // Ban staff member
  static async banStaff(req: Request, res: Response): Promise<void> {
    try {
      if (req.user?.role !== 'admin') {
        res.status(403).json({ error: 'Admin privileges required.' });
        return;
      }

      const { userId } = req.params;
      const { reason } = req.body;

      if (!reason || !reason.trim()) {
        res.status(400).json({ error: 'A valid reason is required to ban a staff account.' });
        return;
      }

      const staff = StaffManagementController.findStaff(userId);
      if (!staff) {
        res.status(404).json({ error: 'Staff account not found.' });
        return;
      }

      const previousStatus = staff.account_status || 'active';
      StaffRepository.setAccountStatus(staff.user_id, 'banned', req.user.id, reason.trim());

      StaffRepository.blockIdentity(
        staff.staff_id,
        staff.official_email,
        staff.user_id,
        reason.trim(),
        'banned',
        req.user.id
      );

      AuditLogRepository.create({
        admin_id: req.user.id,
        target_user_id: staff.user_id,
        target_staff_id: staff.staff_id,
        target_name: staff.full_name,
        action: 'BAN_STAFF',
        previous_status: previousStatus,
        new_status: 'banned',
        reason: reason.trim()
      });

      NotificationRepository.create({
        id: crypto.randomUUID(),
        user_id: staff.user_id,
        title: 'Account Disabled',
        message: `Your staff account has been permanently disabled by administration. Reason: ${reason.trim()}`,
        type: 'system',
        link: null
      });

      res.json({
        success: true,
        message: `Staff member ${staff.full_name} (${staff.staff_id}) has been banned.`,
        staff: {
          id: staff.id,
          user_id: staff.user_id,
          staff_id: staff.staff_id,
          full_name: staff.full_name,
          approval_status: staff.approval_status,
          account_status: 'banned'
        }
      });
    } catch (err: any) {
      console.error('[Ban Staff Error]', err);
      res.status(500).json({ error: 'Failed to ban staff member.' });
    }
  }

  // Unban staff member
  static async unbanStaff(req: Request, res: Response): Promise<void> {
    try {
      if (req.user?.role !== 'admin') {
        res.status(403).json({ error: 'Admin privileges required.' });
        return;
      }

      const { userId } = req.params;
      const { reason } = req.body;

      const staff = StaffManagementController.findStaff(userId);
      if (!staff) {
        res.status(404).json({ error: 'Staff account not found.' });
        return;
      }

      const previousStatus = staff.account_status || 'banned';
      StaffRepository.setAccountStatus(staff.user_id, 'active', req.user.id);
      StaffRepository.unblockIdentity(staff.staff_id, staff.official_email);

      AuditLogRepository.create({
        admin_id: req.user.id,
        target_user_id: staff.user_id,
        target_staff_id: staff.staff_id,
        target_name: staff.full_name,
        action: 'UNBAN_STAFF',
        previous_status: previousStatus,
        new_status: 'active',
        reason: reason?.trim() || 'Ban lifted by authorized administration.'
      });

      NotificationRepository.create({
        id: crypto.randomUUID(),
        user_id: staff.user_id,
        title: 'Account Access Restored',
        message: 'Your staff account access has been restored following administrative review.',
        type: 'system',
        link: '/staff/dashboard'
      });

      res.json({
        success: true,
        message: `Staff member ${staff.full_name} (${staff.staff_id}) has been unbanned.`,
        staff: {
          id: staff.id,
          user_id: staff.user_id,
          staff_id: staff.staff_id,
          full_name: staff.full_name,
          approval_status: staff.approval_status,
          account_status: 'active'
        }
      });
    } catch (err: any) {
      console.error('[Unban Staff Error]', err);
      res.status(500).json({ error: 'Failed to unban staff member.' });
    }
  }

  // Permanently Delete (Soft delete with historical integrity protection)
  static async deleteStaff(req: Request, res: Response): Promise<void> {
    try {
      if (req.user?.role !== 'admin') {
        res.status(403).json({ error: 'Admin privileges required.' });
        return;
      }

      const { userId } = req.params;
      const { confirmation, reason } = req.body;

      if (confirmation !== 'DELETE') {
        res.status(400).json({
          error: 'Explicit confirmation required. You must submit confirmation string "DELETE" to delete staff permanently.',
          code: 'CONFIRMATION_REQUIRED'
        });
        return;
      }

      if (!reason || !reason.trim()) {
        res.status(400).json({
          error: 'A mandatory justification reason is required for permanent staff account deletion.',
          code: 'REASON_REQUIRED'
        });
        return;
      }

      const staff = StaffManagementController.findStaff(userId);
      if (!staff) {
        res.status(404).json({ error: 'Staff account not found.' });
        return;
      }

      const previousStatus = staff.account_status || 'active';

      // Soft delete: marks account_status = 'deleted', preserves historical events, registrations, certificates
      StaffRepository.setAccountStatus(staff.user_id, 'deleted', req.user.id, reason.trim());

      // Permanently retire/block Staff ID and institutional email from ever being registered again
      StaffRepository.blockIdentity(
        staff.staff_id,
        staff.official_email,
        staff.user_id,
        `Permanently deleted: ${reason.trim()}`,
        'retired',
        req.user.id
      );

      // Audit log
      AuditLogRepository.create({
        admin_id: req.user.id,
        target_user_id: staff.user_id,
        target_staff_id: staff.staff_id,
        target_name: staff.full_name,
        action: 'DELETE_STAFF',
        previous_status: previousStatus,
        new_status: 'deleted',
        reason: reason.trim(),
        metadata: {
          confirmedWith: 'DELETE',
          retainedHistory: true
        }
      });

      res.json({
        success: true,
        message: `Staff account for ${staff.full_name} (${staff.staff_id}) has been permanently deleted and archived. Historical records remain intact.`,
        staff: {
          id: staff.id,
          user_id: staff.user_id,
          staff_id: staff.staff_id,
          full_name: staff.full_name,
          approval_status: staff.approval_status,
          account_status: 'deleted'
        }
      });
    } catch (err: any) {
      console.error('[Delete Staff Error]', err);
      res.status(500).json({ error: 'Failed to delete staff member.' });
    }
  }

  // Get Admin Audit Logs
  static async getAuditLogs(req: Request, res: Response): Promise<void> {
    try {
      if (req.user?.role !== 'admin') {
        res.status(403).json({ error: 'Admin privileges required.' });
        return;
      }

      const logs = AuditLogRepository.listAll(100);
      res.json({ auditLogs: logs });
    } catch (err: any) {
      console.error('[Get Audit Logs Error]', err);
      res.status(500).json({ error: 'Failed to retrieve administrative audit logs.' });
    }
  }
}
