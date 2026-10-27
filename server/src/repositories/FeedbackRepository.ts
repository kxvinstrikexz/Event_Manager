import { dbHelper } from '../database/connection.js';

export interface FeedbackRecord {
  id: string;
  event_id: string;
  student_id: string;
  rating: number;
  comments: string;
  created_at: string;
}

export interface FeedbackWithDetails extends FeedbackRecord {
  event_title: string;
  student_name: string;
  student_department: string | null;
}

export class FeedbackRepository {
  static findById(id: string): FeedbackRecord | undefined {
    return dbHelper.get<FeedbackRecord>('SELECT * FROM feedback WHERE id = ?', [id]);
  }

  static findByEventAndStudent(eventId: string, studentId: string): FeedbackRecord | undefined {
    return dbHelper.get<FeedbackRecord>(
      'SELECT * FROM feedback WHERE event_id = ? AND student_id = ?',
      [eventId, studentId]
    );
  }

  static create(feedback: FeedbackRecord): FeedbackRecord {
    dbHelper.run(
      `INSERT INTO feedback (id, event_id, student_id, rating, comments, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        feedback.id,
        feedback.event_id,
        feedback.student_id,
        feedback.rating,
        feedback.comments,
        feedback.created_at
      ]
    );
    return this.findById(feedback.id)!;
  }

  static listByEvent(eventId: string): FeedbackWithDetails[] {
    const sql = `
      SELECT
        f.*,
        e.title AS event_title,
        p.full_name AS student_name,
        p.department AS student_department
      FROM feedback f
      JOIN events e ON f.event_id = e.id
      JOIN profiles p ON f.student_id = p.user_id
      WHERE f.event_id = ?
      ORDER BY f.created_at DESC
    `;
    return dbHelper.all<FeedbackWithDetails>(sql, [eventId]);
  }

  static listAll(filters: { eventId?: string; search?: string } = {}): FeedbackWithDetails[] {
    let sql = `
      SELECT
        f.*,
        e.title AS event_title,
        p.full_name AS student_name,
        p.department AS student_department
      FROM feedback f
      JOIN events e ON f.event_id = e.id
      JOIN profiles p ON f.student_id = p.user_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filters.eventId) {
      sql += ' AND f.event_id = ?';
      params.push(filters.eventId);
    }

    if (filters.search) {
      sql += ' AND (e.title LIKE ? OR f.comments LIKE ? OR p.full_name LIKE ?)';
      const term = `%${filters.search}%`;
      params.push(term, term, term);
    }

    sql += ' ORDER BY f.created_at DESC';
    return dbHelper.all<FeedbackWithDetails>(sql, params);
  }
}
