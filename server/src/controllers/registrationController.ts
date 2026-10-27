import { Request, Response } from 'express';
import crypto from 'node:crypto';
import { RegistrationRepository } from '../repositories/RegistrationRepository.js';
import { EventRepository } from '../repositories/EventRepository.js';
import { NotificationRepository } from '../repositories/NotificationRepository.js';
import { generateSecureQRPayload, generateQRCodeDataUrl } from '../utils/qr.js';

export class RegistrationController {
  // Register for an event (Student)
  static async registerForEvent(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user || req.user.role !== 'student') {
        res.status(403).json({ error: 'Only registered students may register for events.' });
        return;
      }

      const { id: eventId } = req.params;
      const studentId = req.user.id;

      const event = EventRepository.findById(eventId);
      if (!event) {
        res.status(404).json({ error: 'Event not found.' });
        return;
      }

      if (event.status !== 'published') {
        res.status(400).json({ error: `Registration is not open for this event (Status: ${event.status}).` });
        return;
      }

      // Check registration dates
      const todayStr = new Date().toISOString().split('T')[0];
      if (todayStr < event.registration_start) {
        res.status(400).json({ error: `Registration opens on ${event.registration_start}.` });
        return;
      }
      if (todayStr > event.registration_end) {
        res.status(400).json({ error: `Registration closed on ${event.registration_end}.` });
        return;
      }

      // Check capacity
      if (event.registered_count >= event.max_participants) {
        res.status(400).json({ error: 'Event capacity reached. No seats available.' });
        return;
      }

      // Check duplicate registration
      const existing = RegistrationRepository.findByEventAndStudent(eventId, studentId);
      if (existing) {
        if (existing.status !== 'cancelled') {
          res.status(409).json({ error: 'You are already registered for this event.', ticketCode: existing.ticket_code });
          return;
        }
        // If previously cancelled, can re-register with new code
      }

      const regId = crypto.randomUUID();
      const codeSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
      const ticketCode = `EVT-2026-${codeSuffix}`;
      const qrPayload = generateSecureQRPayload(regId, eventId, studentId, ticketCode);

      const registration = RegistrationRepository.create({
        id: regId,
        event_id: eventId,
        student_id: studentId,
        ticket_code: ticketCode,
        qr_payload: qrPayload,
        status: 'registered',
        registered_at: new Date().toISOString()
      });

      // Create notification
      NotificationRepository.create({
        id: crypto.randomUUID(),
        user_id: studentId,
        title: 'Registration Confirmed',
        message: `You are registered for "${event.title}". Your pass (${ticketCode}) is ready.`,
        type: 'registration',
        link: `/student/registrations`
      });

      // Generate QR Code data URL for instant display
      const qrDataUrl = await generateQRCodeDataUrl(qrPayload);

      res.status(201).json({
        message: 'Successfully registered for event.',
        registration,
        qrDataUrl
      });
    } catch (err: any) {
      console.error('[Event Registration Error]', err);
      res.status(500).json({ error: 'Failed to process registration.' });
    }
  }

  // Get student's registrations
  static async getMyRegistrations(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user || req.user.role !== 'student') {
        res.status(403).json({ error: 'Student access required.' });
        return;
      }

      const registrations = RegistrationRepository.listByStudent(req.user.id);
      res.json({ registrations });
    } catch (err: any) {
      console.error('[Get My Registrations Error]', err);
      res.status(500).json({ error: 'Failed to retrieve registrations.' });
    }
  }

  // Get ticket pass details including generated QR image
  static async getPass(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const registration = RegistrationRepository.findById(id);

      if (!registration) {
        res.status(404).json({ error: 'Registration not found.' });
        return;
      }

      // Authorization check: owner, organizer, or admin
      const isOwner = req.user?.id === registration.student_id;
      const isAdmin = req.user?.role === 'admin';
      const event = EventRepository.findById(registration.event_id);
      const isOrganizer = req.user?.id === event?.organizer_id;

      if (!isOwner && !isAdmin && !isOrganizer) {
        res.status(403).json({ error: 'Unauthorized to view this pass.' });
        return;
      }

      const qrDataUrl = await generateQRCodeDataUrl(registration.qr_payload);

      res.json({
        registration,
        event,
        qrDataUrl
      });
    } catch (err: any) {
      console.error('[Get Pass Error]', err);
      res.status(500).json({ error: 'Failed to retrieve pass.' });
    }
  }

  // Cancel registration
  static async cancelRegistration(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const registration = RegistrationRepository.findById(id);

      if (!registration) {
        res.status(404).json({ error: 'Registration not found.' });
        return;
      }

      if (req.user?.role !== 'admin' && req.user?.id !== registration.student_id) {
        res.status(403).json({ error: 'Unauthorized to cancel this registration.' });
        return;
      }

      if (registration.status === 'attended') {
        res.status(400).json({ error: 'Cannot cancel registration after attendance has been recorded.' });
        return;
      }

      RegistrationRepository.cancel(id);
      res.json({ message: 'Registration cancelled.' });
    } catch (err: any) {
      console.error('[Cancel Registration Error]', err);
      res.status(500).json({ error: 'Failed to cancel registration.' });
    }
  }

  // List registrations for an event (Staff / Admin)
  static async getEventRegistrations(req: Request, res: Response): Promise<void> {
    try {
      const { eventId } = req.params;
      const event = EventRepository.findById(eventId);

      if (!event) {
        res.status(404).json({ error: 'Event not found.' });
        return;
      }

      if (req.user?.role !== 'admin' && req.user?.id !== event.organizer_id) {
        res.status(403).json({ error: 'Unauthorized to view registrations for this event.' });
        return;
      }

      const registrations = RegistrationRepository.listByEvent(eventId);
      res.json({ registrations });
    } catch (err: any) {
      console.error('[Get Event Registrations Error]', err);
      res.status(500).json({ error: 'Failed to retrieve event registrations.' });
    }
  }

  // List all registrations (Admin)
  static async getAllRegistrations(req: Request, res: Response): Promise<void> {
    try {
      if (req.user?.role !== 'admin') {
        res.status(403).json({ error: 'Admin access required.' });
        return;
      }

      const { search, status, eventId } = req.query;
      const registrations = RegistrationRepository.listAll({
        search: search as string,
        status: status as string,
        eventId: eventId as string
      });

      res.json({ registrations });
    } catch (err: any) {
      console.error('[Get All Registrations Error]', err);
      res.status(500).json({ error: 'Failed to retrieve registrations.' });
    }
  }
}
