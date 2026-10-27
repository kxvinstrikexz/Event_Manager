import crypto from 'node:crypto';
import { dbHelper } from '../database/connection.js';
import { DepartmentTransferRepository } from './DepartmentTransferRepository.js';
import { AuditLogRepository } from './AuditLogRepository.js';

export interface StaffProfile {
  id: string;
  user_id: string;
  full_name: string;
  staff_id: string;
  department_id?: string | null;
  department: string;
  designation: string;
  official_email: string;
  phone: string | null;
  office_location: string | null;
  approval_status: 'pending' | 'approved' | 'rejected';
  account_status: 'active' | 'suspended' | 'banned' | 'deleted';
  approved_by: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  suspended_at: string | null;
  suspended_by: string | null;
  suspension_reason: string | null;
  banned_at: string | null;
  banned_by: string | null;
  ban_reason: string | null;
  deleted_at: string | null;
  deleted_by: string | null;
  deletion_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface StaffWithUser extends StaffProfile {
  user_status: string;
  user_account_status: 'active' | 'suspended' | 'banned' | 'deleted';
  email_verified: boolean | number;
  last_login_at: string | null;
  user_created_at: string;
  approver_name?: string | null;
  department_code?: string | null;
}

export interface BlockedStaffIdentity {
  id: string;
  staff_id: string;
  email: string;
  user_id: string;
  reason: string;
  status: 'suspended' | 'banned' | 'deleted' | 'retired';
  blocked_by: string;
  created_at: string;
}

export class StaffRepository {
  static findByUserId(userId: string): StaffProfile | undefined {
    return dbHelper.get<StaffProfile>('SELECT * FROM staff_profiles WHERE user_id = ?', [userId]);
  }

  static findById(id: string): StaffProfile | undefined {
    return dbHelper.get<StaffProfile>('SELECT * FROM staff_profiles WHERE id = ?', [id]);
  }

  static findByStaffId(staffId: string): StaffProfile | undefined {
    return dbHelper.get<StaffProfile>('SELECT * FROM staff_profiles WHERE LOWER(staff_id) = LOWER(?)', [staffId]);
  }

  static create(profile: Omit<StaffProfile, 'created_at' | 'updated_at' | 'account_status' | 'suspended_at' | 'suspended_by' | 'suspension_reason' | 'banned_at' | 'banned_by' | 'ban_reason' | 'deleted_at' | 'deleted_by' | 'deletion_reason'> & Partial<StaffProfile>): StaffProfile {
    const accountStatus = profile.account_status || 'active';
    dbHelper.run(
      `INSERT INTO staff_profiles (
        id, user_id, full_name, staff_id, department_id, department, designation, official_email,
        phone, office_location, approval_status, account_status, approved_by, approved_at, rejection_reason,
        suspended_at, suspended_by, suspension_reason, banned_at, banned_by, ban_reason,
        deleted_at, deleted_by, deletion_reason
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        profile.id,
        profile.user_id,
        profile.full_name,
        profile.staff_id,
        profile.department_id || null,
        profile.department,
        profile.designation,
        profile.official_email,
        profile.phone || null,
        profile.office_location || null,
        profile.approval_status || 'pending',
        accountStatus,
        profile.approved_by || null,
        profile.approved_at || null,
        profile.rejection_reason || null,
        profile.suspended_at || null,
        profile.suspended_by || null,
        profile.suspension_reason || null,
        profile.banned_at || null,
        profile.banned_by || null,
        profile.ban_reason || null,
        profile.deleted_at || null,
        profile.deleted_by || null,
        profile.deletion_reason || null
      ]
    );
    return this.findById(profile.id)!;
  }

  static updateProfile(userId: string, data: Partial<StaffProfile>): StaffProfile {
    const current = this.findByUserId(userId);
    if (!current) throw new Error('Staff profile not found');

    const updated = { ...current, ...data };
    dbHelper.run(
      `UPDATE staff_profiles SET
        full_name = ?, department_id = ?, department = ?, designation = ?, phone = ?, office_location = ?, updated_at = datetime('now')
       WHERE user_id = ?`,
      [
        updated.full_name,
        updated.department_id || null,
        updated.department,
        updated.designation,
        updated.phone,
        updated.office_location,
        userId
      ]
    );
    return this.findByUserId(userId)!;
  }

  // Approval status management
  static setApprovalStatus(
    userId: string,
    status: 'approved' | 'rejected',
    adminId: string,
    reason?: string
  ): void {
    const now = new Date().toISOString();
    dbHelper.run(
      `UPDATE staff_profiles SET
        approval_status = ?,
        approved_by = ?,
        approved_at = ?,
        rejection_reason = ?,
        account_status = CASE WHEN ? = 'approved' THEN 'active' ELSE account_status END,
        updated_at = datetime('now')
       WHERE user_id = ?`,
      [status, adminId, now, reason || null, status, userId]
    );

    // Synchronize users.status and users.account_status
    dbHelper.run(
      `UPDATE users SET
        status = ?,
        account_status = CASE WHEN ? = 'approved' THEN 'active' ELSE account_status END,
        session_version = session_version + 1,
        updated_at = datetime('now')
       WHERE id = ?`,
      [status, status, userId]
    );
  }

  // Canonical account status management (active, suspended, banned, deleted)
  static setAccountStatus(
    userId: string,
    accountStatus: 'active' | 'suspended' | 'banned' | 'deleted',
    adminId: string,
    reason?: string
  ): void {
    const now = new Date().toISOString();

    if (accountStatus === 'suspended') {
      dbHelper.run(
        `UPDATE staff_profiles SET
          account_status = 'suspended',
          suspended_at = ?,
          suspended_by = ?,
          suspension_reason = ?,
          updated_at = datetime('now')
         WHERE user_id = ?`,
        [now, adminId, reason || null, userId]
      );
      dbHelper.run(
        `UPDATE users SET
          account_status = 'suspended',
          session_version = session_version + 1,
          updated_at = datetime('now')
         WHERE id = ?`,
        [userId]
      );
    } else if (accountStatus === 'banned') {
      dbHelper.run(
        `UPDATE staff_profiles SET
          account_status = 'banned',
          banned_at = ?,
          banned_by = ?,
          ban_reason = ?,
          updated_at = datetime('now')
         WHERE user_id = ?`,
        [now, adminId, reason || null, userId]
      );
      dbHelper.run(
        `UPDATE users SET
          account_status = 'banned',
          session_version = session_version + 1,
          updated_at = datetime('now')
         WHERE id = ?`,
        [userId]
      );
    } else if (accountStatus === 'deleted') {
      dbHelper.run(
        `UPDATE staff_profiles SET
          account_status = 'deleted',
          deleted_at = ?,
          deleted_by = ?,
          deletion_reason = ?,
          updated_at = datetime('now')
         WHERE user_id = ?`,
        [now, adminId, reason || null, userId]
      );
      dbHelper.run(
        `UPDATE users SET
          account_status = 'deleted',
          session_version = session_version + 1,
          updated_at = datetime('now')
         WHERE id = ?`,
        [userId]
      );
    } else if (accountStatus === 'active') {
      // Reactivate / unsuspend / unban
      dbHelper.run(
        `UPDATE staff_profiles SET
          account_status = 'active',
          suspended_at = NULL,
          suspended_by = NULL,
          suspension_reason = NULL,
          banned_at = NULL,
          banned_by = NULL,
          ban_reason = NULL,
          updated_at = datetime('now')
         WHERE user_id = ?`,
        [userId]
      );
      dbHelper.run(
        `UPDATE users SET
          account_status = 'active',
          session_version = session_version + 1,
          updated_at = datetime('now')
         WHERE id = ?`,
        [userId]
      );
    }
  }

  // Blocked / retired staff identities (Staff ID & email reuse protection)
  static blockIdentity(
    staffId: string,
    email: string,
    userId: string,
    reason: string,
    status: 'suspended' | 'banned' | 'deleted' | 'retired',
    adminId: string
  ): void {
    // Check if already in blocked identities table
    const existing = dbHelper.get(
      'SELECT id FROM blocked_staff_identities WHERE LOWER(staff_id) = LOWER(?) OR LOWER(email) = LOWER(?)',
      [staffId, email]
    );

    if (existing) {
      dbHelper.run(
        `UPDATE blocked_staff_identities SET status = ?, reason = ?, blocked_by = ?, created_at = datetime('now') WHERE id = ?`,
        [status, reason, adminId, existing.id]
      );
    } else {
      dbHelper.run(
        `INSERT INTO blocked_staff_identities (id, staff_id, email, user_id, reason, status, blocked_by)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [crypto.randomUUID(), staffId, email, userId, reason, status, adminId]
      );
    }
  }

  static unblockIdentity(staffId: string, email: string): void {
    dbHelper.run(
      'DELETE FROM blocked_staff_identities WHERE LOWER(staff_id) = LOWER(?) OR LOWER(email) = LOWER(?)',
      [staffId, email]
    );
  }

  static isIdentityBlocked(email: string, staffId: string): BlockedStaffIdentity | undefined {
    return dbHelper.get<BlockedStaffIdentity>(
      `SELECT * FROM blocked_staff_identities WHERE LOWER(email) = LOWER(?) OR LOWER(staff_id) = LOWER(?) LIMIT 1`,
      [email, staffId]
    );
  }

  // Directory listing with rich oversight fields and department filtering
  static listAll(filters?: {
    status?: string;
    approvalStatus?: string;
    accountStatus?: string;
    departmentId?: string;
    department?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): StaffWithUser[] {
    let sql = `
      SELECT
        sp.*,
        u.status AS user_status,
        COALESCE(sp.account_status, u.account_status, 'active') AS user_account_status,
        u.email_verified AS email_verified,
        u.last_login_at AS last_login_at,
        u.created_at AS user_created_at,
        p.full_name AS approver_name,
        d.code AS department_code
      FROM staff_profiles sp
      JOIN users u ON sp.user_id = u.id
      LEFT JOIN profiles p ON sp.approved_by = p.user_id
      LEFT JOIN departments d ON sp.department_id = d.id OR LOWER(sp.department) = LOWER(d.name)
      WHERE 1=1
    `;
    const params: any[] = [];

    // Department filter (by ID, code, or name)
    if (filters?.departmentId && filters.departmentId !== 'all') {
      sql += ' AND (sp.department_id = ? OR d.id = ? OR LOWER(sp.department) = LOWER(?))';
      params.push(filters.departmentId, filters.departmentId, filters.departmentId);
    } else if (filters?.department && filters.department !== 'all') {
      sql += ' AND (LOWER(sp.department) = LOWER(?) OR LOWER(d.name) = LOWER(?))';
      params.push(filters.department, filters.department);
    }

    // Specific approval status filter
    if (filters?.approvalStatus && filters.approvalStatus !== 'all') {
      sql += ' AND sp.approval_status = ?';
      params.push(filters.approvalStatus);
    }

    // Specific account status filter
    if (filters?.accountStatus && filters.accountStatus !== 'all') {
      sql += ' AND sp.account_status = ?';
      params.push(filters.accountStatus);
    }

    // Legacy/combined status filter
    if (filters?.status && filters.status !== 'all') {
      if (filters.status === 'pending') {
        sql += " AND sp.approval_status = 'pending'";
      } else if (filters.status === 'approved') {
        sql += " AND sp.approval_status = 'approved' AND (sp.account_status = 'active' OR sp.account_status IS NULL)";
      } else if (filters.status === 'rejected') {
        sql += " AND sp.approval_status = 'rejected'";
      } else if (filters.status === 'suspended') {
        sql += " AND sp.account_status = 'suspended'";
      } else if (filters.status === 'banned') {
        sql += " AND sp.account_status = 'banned'";
      } else if (filters.status === 'deleted') {
        sql += " AND sp.account_status = 'deleted'";
      }
    }

    if (filters?.search) {
      sql += ' AND (sp.full_name LIKE ? OR sp.official_email LIKE ? OR sp.staff_id LIKE ? OR sp.department LIKE ? OR sp.designation LIKE ?)';
      const term = `%${filters.search}%`;
      params.push(term, term, term, term, term);
    }

    sql += ' ORDER BY sp.created_at DESC';

    if (typeof filters?.limit === 'number' && filters.limit > 0) {
      sql += ' LIMIT ?';
      params.push(filters.limit);
      if (typeof filters?.offset === 'number' && filters.offset > 0) {
        sql += ' OFFSET ?';
        params.push(filters.offset);
      }
    }

    return dbHelper.all<StaffWithUser>(sql, params);
  }

  static countAll(filters?: {
    status?: string;
    approvalStatus?: string;
    accountStatus?: string;
    departmentId?: string;
    department?: string;
    search?: string;
  }): number {
    let sql = `
      SELECT COUNT(DISTINCT sp.id) as count
      FROM staff_profiles sp
      JOIN users u ON sp.user_id = u.id
      LEFT JOIN departments d ON sp.department_id = d.id OR LOWER(sp.department) = LOWER(d.name)
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filters?.departmentId && filters.departmentId !== 'all') {
      sql += ' AND (sp.department_id = ? OR d.id = ? OR LOWER(sp.department) = LOWER(?))';
      params.push(filters.departmentId, filters.departmentId, filters.departmentId);
    } else if (filters?.department && filters.department !== 'all') {
      sql += ' AND (LOWER(sp.department) = LOWER(?) OR LOWER(d.name) = LOWER(?))';
      params.push(filters.department, filters.department);
    }

    if (filters?.approvalStatus && filters.approvalStatus !== 'all') {
      sql += ' AND sp.approval_status = ?';
      params.push(filters.approvalStatus);
    }

    if (filters?.accountStatus && filters.accountStatus !== 'all') {
      sql += ' AND sp.account_status = ?';
      params.push(filters.accountStatus);
    }

    if (filters?.status && filters.status !== 'all') {
      if (filters.status === 'pending') {
        sql += " AND sp.approval_status = 'pending'";
      } else if (filters.status === 'approved') {
        sql += " AND sp.approval_status = 'approved' AND (sp.account_status = 'active' OR sp.account_status IS NULL)";
      } else if (filters.status === 'rejected') {
        sql += " AND sp.approval_status = 'rejected'";
      } else if (filters.status === 'suspended') {
        sql += " AND sp.account_status = 'suspended'";
      } else if (filters.status === 'banned') {
        sql += " AND sp.account_status = 'banned'";
      } else if (filters.status === 'deleted') {
        sql += " AND sp.account_status = 'deleted'";
      }
    }

    if (filters?.search) {
      sql += ' AND (sp.full_name LIKE ? OR sp.official_email LIKE ? OR sp.staff_id LIKE ? OR sp.department LIKE ? OR sp.designation LIKE ?)';
      const term = `%${filters.search}%`;
      params.push(term, term, term, term, term);
    }

    const res = dbHelper.get<{ count: number }>(sql, params);
    return res?.count || 0;
  }

  // Admin Department Transfer (updates department, logs transfer history, creates audit log)
  static transferDepartment(
    userId: string,
    newDepartmentId: string,
    newDepartmentName: string,
    reason: string,
    adminId: string
  ): { staff: StaffProfile; previousDepartment: string; newDepartment: string } {
    const staff = this.findByUserId(userId);
    if (!staff) throw new Error('Staff profile not found');

    const previousDeptId = staff.department_id || null;
    const previousDeptName = staff.department;

    dbHelper.run(
      `UPDATE staff_profiles SET
        department_id = ?,
        department = ?,
        updated_at = datetime('now')
       WHERE user_id = ?`,
      [newDepartmentId, newDepartmentName, userId]
    );

    // Record immutable department transfer history
    DepartmentTransferRepository.create({
      staff_profile_id: staff.id,
      user_id: staff.user_id,
      staff_id: staff.staff_id,
      previous_department_id: previousDeptId,
      previous_department_name: previousDeptName,
      new_department_id: newDepartmentId,
      new_department_name: newDepartmentName,
      transfer_reason: reason.trim(),
      transferred_by: adminId
    });

    // Record admin audit log
    AuditLogRepository.create({
      admin_id: adminId,
      target_user_id: staff.user_id,
      target_staff_id: staff.staff_id,
      target_name: staff.full_name,
      action: 'TRANSFER_DEPARTMENT',
      previous_status: previousDeptName,
      new_status: newDepartmentName,
      reason: reason.trim(),
      metadata: {
        previous_department_id: previousDeptId,
        previous_department_name: previousDeptName,
        new_department_id: newDepartmentId,
        new_department_name: newDepartmentName
      }
    });

    const updated = this.findByUserId(userId)!;
    return {
      staff: updated,
      previousDepartment: previousDeptName,
      newDepartment: newDepartmentName
    };
  }

  static getPendingCount(): number {
    const res = dbHelper.get<{ count: number }>(
      `SELECT COUNT(*) as count FROM staff_profiles WHERE approval_status = 'pending'`
    );
    return res?.count || 0;
  }
}
