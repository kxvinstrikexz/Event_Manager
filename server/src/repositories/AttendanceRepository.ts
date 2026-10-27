import { dbHelper } from '../database/connection.js';

export interface AttendanceRecord {
  id: string;
  registration_id: string;
  event_id: string;
  student_id: string;
  verified_by: string;
  verified_at: string;
  verification_method: 'qr_scan' | 'manual_verify';
  notes: string | null;
}

export interface AttendanceWithDetails extends AttendanceRecord {
  event_title: string;
  event_date: string;
  event_venue: string;
  student_name: string;
  student_email: string;
  student_register_number: string | null;
  student_department: string | null;
  ticket_code: string;
  verifier_name: string;
}

export class AttendanceRepository {
  static findById(id: string): AttendanceRecord | undefined {
    return dbHelper.get<AttendanceRecord>('SELECT * FROM attendance WHERE id = ?', [id]);
  }

  static findByRegistrationId(registrationId: string): AttendanceRecord | undefined {
    return dbHelper.get<AttendanceRecord>('SELECT * FROM attendance WHERE registration_id = ?', [registrationId]);
  }

  static findByEventAndStudent(eventId: string, studentId: string): AttendanceRecord | undefined {
    return dbHelper.get<AttendanceRecord>(
      'SELECT * FROM attendance WHERE event_id = ? AND student_id = ?',
      [eventId, studentId]
    );
  }

  static record(record: AttendanceRecord): AttendanceRecord {
    dbHelper.run(
      `INSERT INTO attendance (id, registration_id, event_id, student_id, verified_by, verified_at, verification_method, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        record.id,
        record.registration_id,
        record.event_id,
        record.student_id,
        record.verified_by,
        record.verified_at,
        record.verification_method,
        record.notes
      ]
    );

    // Also update registration status to 'attended'
    dbHelper.run(
      `UPDATE event_registrations SET status = 'attended' WHERE id = ?`,
      [record.registration_id]
    );

    return this.findById(record.id)!;
  }

  static listByEvent(eventId: string): AttendanceWithDetails[] {
    const sql = `
      SELECT
        att.*,
        e.title AS event_title,
        e.date AS event_date,
        e.venue AS event_venue,
        p.full_name AS student_name,
        u.email AS student_email,
        p.student_id AS student_register_number,
        p.department AS student_department,
        er.ticket_code,
        sp.full_name AS verifier_name
      FROM attendance att
      JOIN events e ON att.event_id = e.id
      JOIN users u ON att.student_id = u.id
      JOIN profiles p ON att.student_id = p.user_id
      JOIN event_registrations er ON att.registration_id = er.id
      LEFT JOIN staff_profiles sp ON att.verified_by = sp.user_id
      WHERE att.event_id = ?
      ORDER BY att.verified_at DESC
    `;
    return dbHelper.all<AttendanceWithDetails>(sql, [eventId]);
  }

  static listByStudent(studentId: string): AttendanceWithDetails[] {
    const sql = `
      SELECT
        att.*,
        e.title AS event_title,
        e.date AS event_date,
        e.venue AS event_venue,
        p.full_name AS student_name,
        u.email AS student_email,
        p.student_id AS student_register_number,
        p.department AS student_department,
        er.ticket_code,
        sp.full_name AS verifier_name
      FROM attendance att
      JOIN events e ON att.event_id = e.id
      JOIN users u ON att.student_id = u.id
      JOIN profiles p ON att.student_id = p.user_id
      JOIN event_registrations er ON att.registration_id = er.id
      LEFT JOIN staff_profiles sp ON att.verified_by = sp.user_id
      WHERE att.student_id = ?
      ORDER BY att.verified_at DESC
    `;
    return dbHelper.all<AttendanceWithDetails>(sql, [studentId]);
  }

  static listAll(filters: { search?: string; eventId?: string } = {}): AttendanceWithDetails[] {
    let sql = `
      SELECT
        att.*,
        e.title AS event_title,
        e.date AS event_date,
        e.venue AS event_venue,
        p.full_name AS student_name,
        u.email AS student_email,
        p.student_id AS student_register_number,
        p.department AS student_department,
        er.ticket_code,
        COALESCE(sp.full_name, 'Administrator') AS verifier_name
      FROM attendance att
      JOIN events e ON att.event_id = e.id
      JOIN users u ON att.student_id = u.id
      JOIN profiles p ON att.student_id = p.user_id
      JOIN event_registrations er ON att.registration_id = er.id
      LEFT JOIN staff_profiles sp ON att.verified_by = sp.user_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filters.eventId) {
      sql += ' AND att.event_id = ?';
      params.push(filters.eventId);
    }

    if (filters.search) {
      sql += ' AND (e.title LIKE ? OR p.full_name LIKE ? OR er.ticket_code LIKE ?)';
      const term = `%${filters.search}%`;
      params.push(term, term, term);
    }

    sql += ' ORDER BY att.verified_at DESC';
    return dbHelper.all<AttendanceWithDetails>(sql, params);
  }
}
