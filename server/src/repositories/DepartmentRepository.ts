import crypto from 'node:crypto';
import { dbHelper } from '../database/connection.js';

export interface DepartmentEntity {
  id: string;
  code: string;
  name: string;
  description: string | null;
  is_active: number | boolean;
  created_at: string;
  updated_at: string;
}

export interface DepartmentWithStats extends DepartmentEntity {
  total_staff: number;
  active_staff: number;
  pending_staff: number;
}

export class DepartmentRepository {
  // List all departments with aggregated staff statistics
  static listAll(includeInactive = false): DepartmentWithStats[] {
    const whereClause = includeInactive ? '' : 'WHERE d.is_active = 1';
    const sql = `
      SELECT
        d.id,
        d.code,
        d.name,
        d.description,
        d.is_active,
        d.created_at,
        d.updated_at,
        COUNT(CASE WHEN sp.id IS NOT NULL AND sp.account_status != 'deleted' THEN 1 END) AS total_staff,
        COUNT(CASE WHEN sp.id IS NOT NULL AND sp.approval_status = 'approved' AND sp.account_status = 'active' THEN 1 END) AS active_staff,
        COUNT(CASE WHEN sp.id IS NOT NULL AND sp.approval_status = 'pending' AND sp.account_status != 'deleted' THEN 1 END) AS pending_staff
      FROM departments d
      LEFT JOIN staff_profiles sp ON sp.department_id = d.id OR LOWER(sp.department) = LOWER(d.name)
      ${whereClause}
      GROUP BY d.id
      ORDER BY d.name ASC
    `;
    return dbHelper.all<DepartmentWithStats>(sql);
  }

  // Active departments for public/staff registration dropdown
  static listActive(): DepartmentEntity[] {
    return dbHelper.all<DepartmentEntity>(
      'SELECT id, code, name, description, is_active, created_at, updated_at FROM departments WHERE is_active = 1 ORDER BY name ASC'
    );
  }

  static findById(id: string): DepartmentEntity | undefined {
    return dbHelper.get<DepartmentEntity>('SELECT * FROM departments WHERE id = ?', [id]);
  }

  static findByCode(code: string): DepartmentEntity | undefined {
    return dbHelper.get<DepartmentEntity>('SELECT * FROM departments WHERE LOWER(code) = LOWER(?)', [code.trim()]);
  }

  static findByName(name: string): DepartmentEntity | undefined {
    return dbHelper.get<DepartmentEntity>('SELECT * FROM departments WHERE LOWER(name) = LOWER(?)', [name.trim()]);
  }

  // Flexible identifier matching (id, code, or name)
  static findByNameOrCodeOrId(identifier: string): DepartmentEntity | undefined {
    const clean = identifier.trim();
    return dbHelper.get<DepartmentEntity>(
      `SELECT * FROM departments
       WHERE id = ? OR LOWER(code) = LOWER(?) OR LOWER(name) = LOWER(?)
       LIMIT 1`,
      [clean, clean, clean]
    );
  }

  static create(data: { code: string; name: string; description?: string }): DepartmentEntity {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    dbHelper.run(
      `INSERT INTO departments (id, code, name, description, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, 1, ?, ?)`,
      [id, data.code.trim().toUpperCase(), data.name.trim(), data.description?.trim() || null, now, now]
    );
    return this.findById(id)!;
  }

  static update(id: string, data: Partial<{ code: string; name: string; description: string; is_active: number | boolean }>): DepartmentEntity {
    const current = this.findById(id);
    if (!current) throw new Error('Department not found');

    const updated = { ...current, ...data };
    const now = new Date().toISOString();
    dbHelper.run(
      `UPDATE departments SET
        code = ?,
        name = ?,
        description = ?,
        is_active = ?,
        updated_at = ?
       WHERE id = ?`,
      [
        updated.code.trim().toUpperCase(),
        updated.name.trim(),
        updated.description?.trim() || null,
        updated.is_active ? 1 : 0,
        now,
        id
      ]
    );
    return this.findById(id)!;
  }
}
