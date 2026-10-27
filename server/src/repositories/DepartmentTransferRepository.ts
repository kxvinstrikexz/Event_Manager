import crypto from 'node:crypto';
import { dbHelper } from '../database/connection.js';

export interface StaffDepartmentTransfer {
  id: string;
  staff_profile_id: string;
  user_id: string;
  staff_id: string;
  previous_department_id: string | null;
  previous_department_name: string;
  new_department_id: string;
  new_department_name: string;
  transfer_reason: string;
  transferred_by: string;
  transferred_by_name?: string;
  transferred_at: string;
}

export class DepartmentTransferRepository {
  static create(data: Omit<StaffDepartmentTransfer, 'id' | 'transferred_at'>): StaffDepartmentTransfer {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    dbHelper.run(
      `INSERT INTO staff_department_transfers (
        id, staff_profile_id, user_id, staff_id,
        previous_department_id, previous_department_name,
        new_department_id, new_department_name,
        transfer_reason, transferred_by, transferred_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.staff_profile_id,
        data.user_id,
        data.staff_id,
        data.previous_department_id || null,
        data.previous_department_name,
        data.new_department_id,
        data.new_department_name,
        data.transfer_reason.trim(),
        data.transferred_by,
        now
      ]
    );

    return this.findById(id)!;
  }

  static findById(id: string): StaffDepartmentTransfer | undefined {
    return dbHelper.get<StaffDepartmentTransfer>(
      `SELECT
        t.*,
        COALESCE(p.full_name, u.username, 'Administrator') AS transferred_by_name
       FROM staff_department_transfers t
       LEFT JOIN users u ON t.transferred_by = u.id
       LEFT JOIN profiles p ON t.transferred_by = p.user_id
       WHERE t.id = ?`,
      [id]
    );
  }

  static listByStaffProfileId(staffProfileId: string): StaffDepartmentTransfer[] {
    return dbHelper.all<StaffDepartmentTransfer>(
      `SELECT
        t.*,
        COALESCE(p.full_name, u.username, 'Administrator') AS transferred_by_name
       FROM staff_department_transfers t
       LEFT JOIN users u ON t.transferred_by = u.id
       LEFT JOIN profiles p ON t.transferred_by = p.user_id
       WHERE t.staff_profile_id = ?
       ORDER BY t.transferred_at DESC`,
      [staffProfileId]
    );
  }

  static listByUserId(userId: string): StaffDepartmentTransfer[] {
    return dbHelper.all<StaffDepartmentTransfer>(
      `SELECT
        t.*,
        COALESCE(p.full_name, u.username, 'Administrator') AS transferred_by_name
       FROM staff_department_transfers t
       LEFT JOIN users u ON t.transferred_by = u.id
       LEFT JOIN profiles p ON t.transferred_by = p.user_id
       WHERE t.user_id = ?
       ORDER BY t.transferred_at DESC`,
      [userId]
    );
  }

  static listAll(limit = 100): StaffDepartmentTransfer[] {
    return dbHelper.all<StaffDepartmentTransfer>(
      `SELECT
        t.*,
        COALESCE(p.full_name, u.username, 'Administrator') AS transferred_by_name
       FROM staff_department_transfers t
       LEFT JOIN users u ON t.transferred_by = u.id
       LEFT JOIN profiles p ON t.transferred_by = p.user_id
       ORDER BY t.transferred_at DESC
       LIMIT ?`,
      [limit]
    );
  }
}
