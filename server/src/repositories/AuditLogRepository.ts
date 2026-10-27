import crypto from 'node:crypto';
import { dbHelper } from '../database/connection.js';

export interface AdminAuditLog {
  id: string;
  admin_id: string;
  admin_username?: string;
  target_user_id: string;
  target_staff_id: string | null;
  target_name: string | null;
  action: 'APPROVE_STAFF' | 'REJECT_STAFF' | 'SUSPEND_STAFF' | 'UNSUSPEND_STAFF' | 'BAN_STAFF' | 'UNBAN_STAFF' | 'DELETE_STAFF';
  previous_status: string | null;
  new_status: string | null;
  reason: string;
  metadata: string | null;
  created_at: string;
}

export class AuditLogRepository {
  static create(data: {
    admin_id: string;
    target_user_id: string;
    target_staff_id?: string | null;
    target_name?: string | null;
    action: AdminAuditLog['action'];
    previous_status?: string | null;
    new_status?: string | null;
    reason: string;
    metadata?: any;
  }): AdminAuditLog {
    const id = crypto.randomUUID();
    const metadataStr = data.metadata ? JSON.stringify(data.metadata) : null;

    dbHelper.run(
      `INSERT INTO admin_audit_logs (
        id, admin_id, target_user_id, target_staff_id, target_name, action,
        previous_status, new_status, reason, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.admin_id,
        data.target_user_id,
        data.target_staff_id || null,
        data.target_name || null,
        data.action,
        data.previous_status || null,
        data.new_status || null,
        data.reason,
        metadataStr
      ]
    );

    return dbHelper.get<AdminAuditLog>('SELECT * FROM admin_audit_logs WHERE id = ?', [id])!;
  }

  static listAll(limit: number = 100): AdminAuditLog[] {
    return dbHelper.all<AdminAuditLog>(
      `SELECT a.*, u.username as admin_username
       FROM admin_audit_logs a
       LEFT JOIN users u ON a.admin_id = u.id
       ORDER BY a.created_at DESC
       LIMIT ?`,
      [limit]
    );
  }

  static listForTarget(targetUserId: string): AdminAuditLog[] {
    return dbHelper.all<AdminAuditLog>(
      `SELECT a.*, u.username as admin_username
       FROM admin_audit_logs a
       LEFT JOIN users u ON a.admin_id = u.id
       WHERE a.target_user_id = ?
       ORDER BY a.created_at DESC`,
      [targetUserId]
    );
  }
}
