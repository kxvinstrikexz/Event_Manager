import { dbHelper } from '../database/connection.js';

export interface CertificateRecord {
  id: string;
  certificate_number: string;
  event_id: string;
  student_id: string;
  issue_date: string;
  title: string;
  verification_status: 'verified' | 'revoked';
  issued_by: string;
  created_at: string;
}

export interface CertificateWithDetails extends CertificateRecord {
  event_title: string;
  event_date: string;
  event_venue: string;
  event_category: string;
  student_name: string;
  student_email: string;
  student_register_number: string | null;
  student_department: string | null;
  issuer_name: string;
}

export class CertificateRepository {
  static findById(id: string): CertificateRecord | undefined {
    return dbHelper.get<CertificateRecord>('SELECT * FROM certificates WHERE id = ?', [id]);
  }

  static findByNumber(certNumber: string): CertificateWithDetails | undefined {
    const sql = `
      SELECT
        c.*,
        e.title AS event_title,
        e.date AS event_date,
        e.venue AS event_venue,
        e.category AS event_category,
        p.full_name AS student_name,
        u.email AS student_email,
        p.student_id AS student_register_number,
        p.department AS student_department,
        COALESCE(sp.full_name, 'Academic Administration') AS issuer_name
      FROM certificates c
      JOIN events e ON c.event_id = e.id
      JOIN users u ON c.student_id = u.id
      JOIN profiles p ON c.student_id = p.user_id
      LEFT JOIN staff_profiles sp ON c.issued_by = sp.user_id
      WHERE c.certificate_number = ?
    `;
    return dbHelper.get<CertificateWithDetails>(sql, [certNumber]);
  }

  static findByEventAndStudent(eventId: string, studentId: string): CertificateRecord | undefined {
    return dbHelper.get<CertificateRecord>(
      'SELECT * FROM certificates WHERE event_id = ? AND student_id = ?',
      [eventId, studentId]
    );
  }

  static issue(cert: CertificateRecord): CertificateRecord {
    dbHelper.run(
      `INSERT INTO certificates (
        id, certificate_number, event_id, student_id, issue_date, title,
        verification_status, issued_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        cert.id,
        cert.certificate_number,
        cert.event_id,
        cert.student_id,
        cert.issue_date,
        cert.title,
        cert.verification_status,
        cert.issued_by,
        cert.created_at
      ]
    );
    return this.findById(cert.id)!;
  }

  static updateStatus(id: string, status: 'verified' | 'revoked'): void {
    dbHelper.run(
      `UPDATE certificates SET verification_status = ? WHERE id = ?`,
      [status, id]
    );
  }

  static listByStudent(studentId: string): CertificateWithDetails[] {
    const sql = `
      SELECT
        c.*,
        e.title AS event_title,
        e.date AS event_date,
        e.venue AS event_venue,
        e.category AS event_category,
        p.full_name AS student_name,
        u.email AS student_email,
        p.student_id AS student_register_number,
        p.department AS student_department,
        COALESCE(sp.full_name, 'Academic Administration') AS issuer_name
      FROM certificates c
      JOIN events e ON c.event_id = e.id
      JOIN users u ON c.student_id = u.id
      JOIN profiles p ON c.student_id = p.user_id
      LEFT JOIN staff_profiles sp ON c.issued_by = sp.user_id
      WHERE c.student_id = ?
      ORDER BY c.issue_date DESC
    `;
    return dbHelper.all<CertificateWithDetails>(sql, [studentId]);
  }

  static listByEvent(eventId: string): CertificateWithDetails[] {
    const sql = `
      SELECT
        c.*,
        e.title AS event_title,
        e.date AS event_date,
        e.venue AS event_venue,
        e.category AS event_category,
        p.full_name AS student_name,
        u.email AS student_email,
        p.student_id AS student_register_number,
        p.department AS student_department,
        COALESCE(sp.full_name, 'Academic Administration') AS issuer_name
      FROM certificates c
      JOIN events e ON c.event_id = e.id
      JOIN users u ON c.student_id = u.id
      JOIN profiles p ON c.student_id = p.user_id
      LEFT JOIN staff_profiles sp ON c.issued_by = sp.user_id
      WHERE c.event_id = ?
      ORDER BY c.issue_date DESC
    `;
    return dbHelper.all<CertificateWithDetails>(sql, [eventId]);
  }

  static listAll(filters: { search?: string } = {}): CertificateWithDetails[] {
    let sql = `
      SELECT
        c.*,
        e.title AS event_title,
        e.date AS event_date,
        e.venue AS event_venue,
        e.category AS event_category,
        p.full_name AS student_name,
        u.email AS student_email,
        p.student_id AS student_register_number,
        p.department AS student_department,
        COALESCE(sp.full_name, 'Academic Administration') AS issuer_name
      FROM certificates c
      JOIN events e ON c.event_id = e.id
      JOIN users u ON c.student_id = u.id
      JOIN profiles p ON c.student_id = p.user_id
      LEFT JOIN staff_profiles sp ON c.issued_by = sp.user_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filters.search) {
      sql += ' AND (c.certificate_number LIKE ? OR e.title LIKE ? OR p.full_name LIKE ?)';
      const term = `%${filters.search}%`;
      params.push(term, term, term);
    }

    sql += ' ORDER BY c.issue_date DESC';
    return dbHelper.all<CertificateWithDetails>(sql, params);
  }
}
