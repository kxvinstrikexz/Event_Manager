import { dbHelper } from '../database/connection.js';

export interface EventEntity {
  id: string;
  title: string;
  description: string;
  category: string;
  poster_url: string | null;
  date: string;
  start_time: string;
  end_time: string;
  venue: string;
  organizer_id: string;
  organizer_name: string;
  department: string;
  max_participants: number;
  registration_start: string;
  registration_end: string;
  guidelines: string | null;
  status: 'draft' | 'published' | 'closed' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface EventWithStats extends EventEntity {
  registered_count: number;
  attendance_count: number;
  average_rating: number | null;
  is_user_registered?: boolean;
}

export class EventRepository {
  static findById(id: string, currentUserId?: string): EventWithStats | undefined {
    const event = dbHelper.get<EventEntity>('SELECT * FROM events WHERE id = ?', [id]);
    if (!event) return undefined;

    const stats = this.getEventStats(id);
    let is_user_registered = false;
    if (currentUserId) {
      const reg = dbHelper.get<{ id: string }>(
        `SELECT id FROM event_registrations WHERE event_id = ? AND student_id = ? AND status != 'cancelled'`,
        [id, currentUserId]
      );
      is_user_registered = !!reg;
    }

    return {
      ...event,
      registered_count: stats.registered_count,
      attendance_count: stats.attendance_count,
      average_rating: stats.average_rating,
      is_user_registered
    };
  }

  static getEventStats(eventId: string): { registered_count: number; attendance_count: number; average_rating: number | null } {
    const regRes = dbHelper.get<{ count: number }>(
      `SELECT COUNT(*) as count FROM event_registrations WHERE event_id = ? AND status != 'cancelled'`,
      [eventId]
    );
    const attRes = dbHelper.get<{ count: number }>(
      `SELECT COUNT(*) as count FROM attendance WHERE event_id = ?`,
      [eventId]
    );
    const fbRes = dbHelper.get<{ avg_rating: number | null }>(
      `SELECT AVG(rating) as avg_rating FROM feedback WHERE event_id = ?`,
      [eventId]
    );

    return {
      registered_count: regRes?.count || 0,
      attendance_count: attRes?.count || 0,
      average_rating: fbRes?.avg_rating ? Number(fbRes.avg_rating.toFixed(1)) : null
    };
  }

  static create(event: Omit<EventEntity, 'created_at' | 'updated_at'>): EventEntity {
    dbHelper.run(
      `INSERT INTO events (
        id, title, description, category, poster_url, date, start_time, end_time,
        venue, organizer_id, organizer_name, department, max_participants,
        registration_start, registration_end, guidelines, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        event.id,
        event.title,
        event.description,
        event.category,
        event.poster_url,
        event.date,
        event.start_time,
        event.end_time,
        event.venue,
        event.organizer_id,
        event.organizer_name,
        event.department,
        event.max_participants,
        event.registration_start,
        event.registration_end,
        event.guidelines,
        event.status
      ]
    );
    return this.findById(event.id)!;
  }

  static update(id: string, updates: Partial<EventEntity>): EventEntity {
    const current = dbHelper.get<EventEntity>('SELECT * FROM events WHERE id = ?', [id]);
    if (!current) throw new Error('Event not found');

    const updated = { ...current, ...updates };
    dbHelper.run(
      `UPDATE events SET
        title = ?, description = ?, category = ?, poster_url = ?, date = ?,
        start_time = ?, end_time = ?, venue = ?, department = ?, max_participants = ?,
        registration_start = ?, registration_end = ?, guidelines = ?, status = ?,
        updated_at = datetime('now')
       WHERE id = ?`,
      [
        updated.title,
        updated.description,
        updated.category,
        updated.poster_url,
        updated.date,
        updated.start_time,
        updated.end_time,
        updated.venue,
        updated.department,
        updated.max_participants,
        updated.registration_start,
        updated.registration_end,
        updated.guidelines,
        updated.status,
        id
      ]
    );
    return this.findById(id)!;
  }

  static delete(id: string): void {
    dbHelper.run('DELETE FROM events WHERE id = ?', [id]);
  }

  static list(filters: {
    status?: string;
    category?: string;
    organizerId?: string;
    search?: string;
    currentUserId?: string;
    dateFilter?: 'upcoming' | 'past' | 'all';
  } = {}): EventWithStats[] {
    let sql = `SELECT * FROM events WHERE 1=1`;
    const params: any[] = [];

    if (filters.status && filters.status !== 'all') {
      sql += ' AND status = ?';
      params.push(filters.status);
    }

    if (filters.category && filters.category !== 'all') {
      sql += ' AND category = ?';
      params.push(filters.category);
    }

    if (filters.organizerId) {
      sql += ' AND organizer_id = ?';
      params.push(filters.organizerId);
    }

    if (filters.search) {
      sql += ' AND (title LIKE ? OR description LIKE ? OR venue LIKE ? OR organizer_name LIKE ? OR department LIKE ?)';
      const term = `%${filters.search}%`;
      params.push(term, term, term, term, term);
    }

    if (filters.dateFilter === 'upcoming') {
      sql += ` AND date >= date('now')`;
    } else if (filters.dateFilter === 'past') {
      sql += ` AND date < date('now')`;
    }

    sql += ' ORDER BY date ASC, start_time ASC';

    const events = dbHelper.all<EventEntity>(sql, params);
    return events.map((ev) => {
      const stats = this.getEventStats(ev.id);
      let is_user_registered = false;
      if (filters.currentUserId) {
        const reg = dbHelper.get<{ id: string }>(
          `SELECT id FROM event_registrations WHERE event_id = ? AND student_id = ? AND status != 'cancelled'`,
          [ev.id, filters.currentUserId]
        );
        is_user_registered = !!reg;
      }
      return {
        ...ev,
        registered_count: stats.registered_count,
        attendance_count: stats.attendance_count,
        average_rating: stats.average_rating,
        is_user_registered
      };
    });
  }

  static getOverviewStats(): {
    totalEvents: number;
    upcomingEvents: number;
    completedEvents: number;
    totalRegistrations: number;
    totalAttendance: number;
  } {
    const totalEvents = dbHelper.get<{ c: number }>('SELECT COUNT(*) as c FROM events')?.c || 0;
    const upcomingEvents = dbHelper.get<{ c: number }>("SELECT COUNT(*) as c FROM events WHERE date >= date('now') AND status = 'published'")?.c || 0;
    const completedEvents = dbHelper.get<{ c: number }>("SELECT COUNT(*) as c FROM events WHERE date < date('now') OR status = 'completed'")?.c || 0;
    const totalRegistrations = dbHelper.get<{ c: number }>("SELECT COUNT(*) as c FROM event_registrations WHERE status != 'cancelled'")?.c || 0;
    const totalAttendance = dbHelper.get<{ c: number }>('SELECT COUNT(*) as c FROM attendance')?.c || 0;

    return { totalEvents, upcomingEvents, completedEvents, totalRegistrations, totalAttendance };
  }
}
