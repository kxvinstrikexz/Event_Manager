import { dbHelper } from '../database/connection.js';

export interface EventRegistration {
  id: string;
  event_id: string;
  student_id: string;
  ticket_code: string;
  qr_payload: string;
  status: 'registered' | 'cancelled' | 'attended';
  registered_at: string;
  cancelled_at: string | null;
}

export interface RegistrationWithDetails extends EventRegistration {
  event_title: string;
  event_date: string;
  event_start_time: string;
  event_end_time: string;
  event_venue: string;
  event_category: string;
  organizer_name: string;
  student_name: string;
  student_email: string;
  student_register_number: string | null;
  student_department: string | null;
  attended_at: string | null;
  verified_by_name: string | null;
}

export class RegistrationRepository {
  static findById(id: string): EventRegistration | undefined {
    return dbHelper.get<EventRegistration>('SELECT * FROM event_registrations WHERE id = ?', [id]);
  }

  static findByTicketCode(ticketCode: string): EventRegistration | undefined {
    return dbHelper.get<EventRegistration>('SELECT * FROM event_registrations WHERE ticket_code = ?', [ticketCode]);
  }

  static findByEventAndStudent(eventId: string, studentId: string): EventRegistration | undefined {
    return dbHelper.get<EventRegistration>(
      'SELECT * FROM event_registrations WHERE event_id = ? AND student_id = ?',
      [eventId, studentId]
    );
  }

  static create(registration: Omit<EventRegistration, 'cancelled_at'>): EventRegistration {
    dbHelper.run(
      `INSERT INTO event_registrations (id, event_id, student_id, ticket_code, qr_payload, status, registered_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        registration.id,
        registration.event_id,
        registration.student_id,
        registration.ticket_code,
        registration.qr_payload,
        registration.status,
        registration.registered_at
      ]
    );
    return this.findById(registration.id)!;
  }

  static cancel(id: string): void {
    dbHelper.run(
      `UPDATE event_registrations SET status = 'cancelled', cancelled_at = datetime('now') WHERE id = ?`,
      [id]
    );
  }

  static markAttended(id: string): void {
    dbHelper.run(
      `UPDATE event_registrations SET status = 'attended' WHERE id = ?`,
      [id]
    );
  }

  static listByStudent(studentId: string): RegistrationWithDetails[] {
    const sql = `
      SELECT
        er.*,
        e.title AS event_title,
        e.date AS event_date,
        e.start_time AS event_start_time,
        e.end_time AS event_end_time,
        e.venue AS event_venue,
        e.category AS event_category,
        e.organizer_name,
        p.full_name AS student_name,
        u.email AS student_email,
        p.student_id AS student_register_number,
        p.department AS student_department,
        att.verified_at AS attended_at,
        staff_p.full_name AS verified_by_name
      FROM event_registrations er
      JOIN events e ON er.event_id = e.id
      JOIN users u ON er.student_id = u.id
      JOIN profiles p ON er.student_id = p.user_id
      LEFT JOIN attendance att ON er.id = att.registration_id
      LEFT JOIN staff_profiles staff_p ON att.verified_by = staff_p.user_id
      WHERE er.student_id = ?
      ORDER BY e.date DESC, er.registered_at DESC
    `;
    return dbHelper.all<RegistrationWithDetails>(sql, [studentId]);
  }

  static listByEvent(eventId: string): RegistrationWithDetails[] {
    const sql = `
      SELECT
        er.*,
        e.title AS event_title,
        e.date AS event_date,
        e.start_time AS event_start_time,
        e.end_time AS event_end_time,
        e.venue AS event_venue,
        e.category AS event_category,
        e.organizer_name,
        p.full_name AS student_name,
        u.email AS student_email,
        p.student_id AS student_register_number,
        p.department AS student_department,
        att.verified_at AS attended_at,
        staff_p.full_name AS verified_by_name
      FROM event_registrations er
      JOIN events e ON er.event_id = e.id
      JOIN users u ON er.student_id = u.id
      JOIN profiles p ON er.student_id = p.user_id
      LEFT JOIN attendance att ON er.id = att.registration_id
      LEFT JOIN staff_profiles staff_p ON att.verified_by = staff_p.user_id
      WHERE er.event_id = ?
      ORDER BY er.registered_at ASC
    `;
    return dbHelper.all<RegistrationWithDetails>(sql, [eventId]);
  }

  static listAll(filters: { search?: string; status?: string; eventId?: string } = {}): RegistrationWithDetails[] {
    let sql = `
      SELECT
        er.*,
        e.title AS event_title,
        e.date AS event_date,
        e.start_time AS event_start_time,
        e.end_time AS event_end_time,
        e.venue AS event_venue,
        e.category AS event_category,
        e.organizer_name,
        p.full_name AS student_name,
        u.email AS student_email,
        p.student_id AS student_register_number,
        p.department AS student_department,
        att.verified_at AS attended_at,
        staff_p.full_name AS verified_by_name
      FROM event_registrations er
      JOIN events e ON er.event_id = e.id
      JOIN users u ON er.student_id = u.id
      JOIN profiles p ON er.student_id = p.user_id
      LEFT JOIN attendance att ON er.id = att.registration_id
      LEFT JOIN staff_profiles staff_p ON att.verified_by = staff_p.user_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filters.status && filters.status !== 'all') {
      sql += ' AND er.status = ?';
      params.push(filters.status);
    }

    if (filters.eventId) {
      sql += ' AND er.event_id = ?';
      params.push(filters.eventId);
    }

    if (filters.search) {
      sql += ' AND (e.title LIKE ? OR p.full_name LIKE ? OR u.email LIKE ? OR er.ticket_code LIKE ?)';
      const term = `%${filters.search}%`;
      params.push(term, term, term, term);
    }

    sql += ' ORDER BY er.registered_at DESC';
    return dbHelper.all<RegistrationWithDetails>(sql, params);
  }
}
