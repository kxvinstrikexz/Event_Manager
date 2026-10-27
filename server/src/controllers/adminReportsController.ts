import { Request, Response } from 'express';
import { dbHelper } from '../database/connection.js';

export class AdminReportsController {
  static async getReports(req: Request, res: Response): Promise<void> {
    try {
      if (req.user?.role !== 'admin') {
        res.status(403).json({ error: 'Admin privileges required.' });
        return;
      }

      // Department participation
      const deptStats = dbHelper.all<{ department: string; registrations: number; attendance: number }>(`
        SELECT
          COALESCE(p.department, 'Undeclared') AS department,
          COUNT(er.id) AS registrations,
          COUNT(att.id) AS attendance
        FROM profiles p
        LEFT JOIN event_registrations er ON p.user_id = er.student_id AND er.status != 'cancelled'
        LEFT JOIN attendance att ON er.id = att.registration_id
        GROUP BY p.department
        ORDER BY registrations DESC
      `);

      // Category breakdown
      const categoryStats = dbHelper.all<{ category: string; count: number; total_registrations: number }>(`
        SELECT
          category,
          COUNT(DISTINCT e.id) AS count,
          COUNT(er.id) AS total_registrations
        FROM events e
        LEFT JOIN event_registrations er ON e.id = er.event_id AND er.status != 'cancelled'
        GROUP BY category
        ORDER BY count DESC
      `);

      // Overall numbers
      const totalStudents = dbHelper.get<{ count: number }>("SELECT COUNT(*) as count FROM users WHERE role = 'student'")?.count || 0;
      const totalStaff = dbHelper.get<{ count: number }>("SELECT COUNT(*) as count FROM users WHERE role = 'staff'")?.count || 0;
      const approvedStaff = dbHelper.get<{ count: number }>("SELECT COUNT(*) as count FROM staff_profiles WHERE approval_status = 'approved'")?.count || 0;
      const pendingStaff = dbHelper.get<{ count: number }>("SELECT COUNT(*) as count FROM staff_profiles WHERE approval_status = 'pending'")?.count || 0;
      const totalEvents = dbHelper.get<{ count: number }>("SELECT COUNT(*) as count FROM events")?.count || 0;
      const totalRegistrations = dbHelper.get<{ count: number }>("SELECT COUNT(*) as count FROM event_registrations WHERE status != 'cancelled'")?.count || 0;
      const totalAttendance = dbHelper.get<{ count: number }>("SELECT COUNT(*) as count FROM attendance")?.count || 0;
      const totalCertificates = dbHelper.get<{ count: number }>("SELECT COUNT(*) as count FROM certificates")?.count || 0;
      const averageRating = dbHelper.get<{ avg_rating: number | null }>("SELECT AVG(rating) as avg_rating FROM feedback")?.avg_rating || null;

      // Attendance rate
      const attendanceRate = totalRegistrations > 0 ? Math.round((totalAttendance / totalRegistrations) * 100) : 0;

      // Recent 5 events summary
      const recentEvents = dbHelper.all(`
        SELECT
          e.id, e.title, e.category, e.date, e.venue, e.organizer_name,
          COUNT(DISTINCT er.id) AS reg_count,
          COUNT(DISTINCT att.id) AS att_count
        FROM events e
        LEFT JOIN event_registrations er ON e.id = er.event_id AND er.status != 'cancelled'
        LEFT JOIN attendance att ON e.id = att.event_id
        GROUP BY e.id
        ORDER BY e.date DESC
        LIMIT 6
      `);

      res.json({
        overview: {
          totalStudents,
          totalStaff,
          approvedStaff,
          pendingStaff,
          totalEvents,
          totalRegistrations,
          totalAttendance,
          totalCertificates,
          averageRating: averageRating ? Number(averageRating.toFixed(1)) : null,
          attendanceRate
        },
        departmentBreakdown: deptStats,
        categoryBreakdown: categoryStats,
        recentEvents
      });
    } catch (err: any) {
      console.error('[Admin Reports Error]', err);
      res.status(500).json({ error: 'Failed to generate administrative reports.' });
    }
  }
}
