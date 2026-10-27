import { Request, Response } from 'express';
import crypto from 'node:crypto';
import { AttendanceRepository } from '../repositories/AttendanceRepository.js';
import { RegistrationRepository } from '../repositories/RegistrationRepository.js';
import { EventRepository } from '../repositories/EventRepository.js';
import { UserRepository } from '../repositories/UserRepository.js';
import { NotificationRepository } from '../repositories/NotificationRepository.js';
import { parseAndVerifyQRPayload } from '../utils/qr.js';

export class AttendanceController {
  // Verify QR code or Ticket Code and record attendance
  static async verifyAttendance(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user || (req.user.role !== 'staff' && req.user.role !== 'admin')) {
        res.status(403).json({ error: 'Only authorized faculty/staff or administrators can verify attendance.' });
        return;
      }

      const { qrPayload, ticketCode, eventId, notes } = req.body;

      if (!qrPayload && !ticketCode) {
        res.status(400).json({ error: 'A QR payload or ticket code is required.' });
        return;
      }

      let registrationId: string | undefined;
      let targetEventId: string | undefined = eventId;
      let verificationMethod: 'qr_scan' | 'manual_verify' = 'qr_scan';

      if (qrPayload) {
        const verifyResult = parseAndVerifyQRPayload(qrPayload);
        if (!verifyResult.valid || !verifyResult.data) {
          res.status(400).json({ error: 'Invalid QR Code' });
          return;
        }

        registrationId = verifyResult.data.regId;
        targetEventId = verifyResult.data.eventId;
        verificationMethod = 'qr_scan';
      } else if (ticketCode) {
        const reg = RegistrationRepository.findByTicketCode(ticketCode.trim().toUpperCase());
        if (!reg) {
          res.status(404).json({ error: 'Invalid QR Code' });
          return;
        }
        registrationId = reg.id;
        targetEventId = reg.event_id;
        verificationMethod = 'manual_verify';
      }

      const registration = RegistrationRepository.findById(registrationId!);
      if (!registration) {
        res.status(404).json({ error: 'You are not registered for this event.' });
        return;
      }

      // Check wrong event if specific session checkpoint was targeted
      if (eventId && registration.event_id !== eventId) {
        res.status(400).json({ error: 'This QR code is not valid for this event.' });
        return;
      }

      if (registration.status === 'cancelled') {
        res.status(400).json({ error: 'You are not registered for this event.' });
        return;
      }

      const event = EventRepository.findById(registration.event_id);
      if (!event) {
        res.status(404).json({ error: 'Associated event not found.' });
        return;
      }

      // Check if current user is authorized for this event
      if (req.user.role === 'staff' && req.user.id !== event.organizer_id) {
        res.status(403).json({ error: 'You are only authorized to verify attendance for events you organize.' });
        return;
      }

      // Prevent duplicate attendance
      const existingAttendance = AttendanceRepository.findByRegistrationId(registration.id);
      if (existingAttendance) {
        const studentProfile = UserRepository.getProfileByUserId(registration.student_id);
        res.status(409).json({
          error: 'Attendance already marked.',
          alreadyRecordedAt: existingAttendance.verified_at,
          attendee: {
            name: studentProfile?.full_name,
            studentId: studentProfile?.student_id,
            department: studentProfile?.department
          }
        });
        return;
      }

      // Record attendance
      const record = AttendanceRepository.record({
        id: crypto.randomUUID(),
        registration_id: registration.id,
        event_id: registration.event_id,
        student_id: registration.student_id,
        verified_by: req.user.id,
        verified_at: new Date().toISOString(),
        verification_method: verificationMethod,
        notes: notes || null
      });

      // Notify student
      NotificationRepository.create({
        id: crypto.randomUUID(),
        user_id: registration.student_id,
        title: 'Attendance Confirmed',
        message: `Your attendance at "${event.title}" has been successfully verified. You are now eligible to submit feedback.`,
        type: 'attendance',
        link: `/student/registrations`
      });

      const studentProfile = UserRepository.getProfileByUserId(registration.student_id);
      const studentUser = UserRepository.findById(registration.student_id);

      res.status(201).json({
        message: 'Attendance verified successfully.',
        attendance: record,
        eventTitle: event.title,
        attendee: {
          fullName: studentProfile?.full_name,
          studentId: studentProfile?.student_id,
          department: studentProfile?.department,
          email: studentUser?.email,
          ticketCode: registration.ticket_code
        }
      });
    } catch (err: any) {
      console.error('[Verify Attendance Error]', err);
      res.status(500).json({ error: 'Failed to record attendance.' });
    }
  }

  // List attendance for event (Staff / Admin)
  static async getEventAttendance(req: Request, res: Response): Promise<void> {
    try {
      const { eventId } = req.params;
      const event = EventRepository.findById(eventId);

      if (!event) {
        res.status(404).json({ error: 'Event not found.' });
        return;
      }

      if (req.user?.role !== 'admin' && req.user?.id !== event.organizer_id) {
        res.status(403).json({ error: 'Unauthorized to view attendance for this event.' });
        return;
      }

      const records = AttendanceRepository.listByEvent(eventId);
      res.json({ attendance: records });
    } catch (err: any) {
      console.error('[Get Event Attendance Error]', err);
      res.status(500).json({ error: 'Failed to retrieve attendance records.' });
    }
  }

  // List attendance for logged-in student
  static async getMyAttendance(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user || req.user.role !== 'student') {
        res.status(403).json({ error: 'Student access required.' });
        return;
      }

      const records = AttendanceRepository.listByStudent(req.user.id);
      res.json({ attendance: records });
    } catch (err: any) {
      console.error('[Get My Attendance Error]', err);
      res.status(500).json({ error: 'Failed to retrieve attendance history.' });
    }
  }

  // List all attendance records (Admin)
  static async getAllAttendance(req: Request, res: Response): Promise<void> {
    try {
      if (req.user?.role !== 'admin') {
        res.status(403).json({ error: 'Admin access required.' });
        return;
      }

      const { search, eventId } = req.query;
      const records = AttendanceRepository.listAll({
        search: search as string,
        eventId: eventId as string
      });

      res.json({ attendance: records });
    } catch (err: any) {
      console.error('[Get All Attendance Error]', err);
      res.status(500).json({ error: 'Failed to retrieve attendance records.' });
    }
  }
}
