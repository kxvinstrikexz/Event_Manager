import { Request, Response } from 'express';
import crypto from 'node:crypto';
import { CertificateRepository } from '../repositories/CertificateRepository.js';
import { AttendanceRepository } from '../repositories/AttendanceRepository.js';
import { EventRepository } from '../repositories/EventRepository.js';
import { UserRepository } from '../repositories/UserRepository.js';
import { NotificationRepository } from '../repositories/NotificationRepository.js';

export class CertificateController {
  // Issue a single certificate to an attended student
  static async issueCertificate(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user || (req.user.role !== 'staff' && req.user.role !== 'admin')) {
        res.status(403).json({ error: 'Unauthorized to issue certificates.' });
        return;
      }

      const { eventId, studentId, title } = req.body;

      if (!eventId || !studentId) {
        res.status(400).json({ error: 'Event ID and Student ID are required.' });
        return;
      }

      const event = EventRepository.findById(eventId);
      if (!event) {
        res.status(404).json({ error: 'Event not found.' });
        return;
      }

      if (req.user.role === 'staff' && req.user.id !== event.organizer_id) {
        res.status(403).json({ error: 'Unauthorized to issue certificates for this event.' });
        return;
      }

      // Check attendance
      const attendance = AttendanceRepository.findByEventAndStudent(eventId, studentId);
      if (!attendance) {
        res.status(400).json({ error: 'Cannot issue certificate. Student has no verified attendance record for this event.' });
        return;
      }

      // Check if already issued
      const existing = CertificateRepository.findByEventAndStudent(eventId, studentId);
      if (existing) {
        res.status(409).json({ error: 'Certificate already issued for this student.', certificate: existing });
        return;
      }

      const certNumber = `CE-CERT-${new Date().getFullYear()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
      const certTitle = title || `Certificate of Participation: ${event.title}`;

      const certificate = CertificateRepository.issue({
        id: crypto.randomUUID(),
        certificate_number: certNumber,
        event_id: eventId,
        student_id: studentId,
        issue_date: new Date().toISOString(),
        title: certTitle,
        verification_status: 'verified',
        issued_by: req.user.id,
        created_at: new Date().toISOString()
      });

      // Notify student
      NotificationRepository.create({
        id: crypto.randomUUID(),
        user_id: studentId,
        title: 'Certificate Awarded',
        message: `Your Certificate of Participation for "${event.title}" is ready. Serial Number: ${certNumber}`,
        type: 'certificate',
        link: `/student/certificates`
      });

      res.status(201).json({
        message: 'Certificate issued successfully.',
        certificate
      });
    } catch (err: any) {
      console.error('[Issue Certificate Error]', err);
      res.status(500).json({ error: 'Failed to issue certificate.' });
    }
  }

  // Bulk issue certificates for all verified attendees
  static async bulkIssueForEvent(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user || (req.user.role !== 'staff' && req.user.role !== 'admin')) {
        res.status(403).json({ error: 'Unauthorized.' });
        return;
      }

      const { eventId } = req.params;
      const event = EventRepository.findById(eventId);

      if (!event) {
        res.status(404).json({ error: 'Event not found.' });
        return;
      }

      if (req.user.role === 'staff' && req.user.id !== event.organizer_id) {
        res.status(403).json({ error: 'Unauthorized to issue certificates for this event.' });
        return;
      }

      const attendees = AttendanceRepository.listByEvent(eventId);
      let issuedCount = 0;

      for (const att of attendees) {
        const existing = CertificateRepository.findByEventAndStudent(eventId, att.student_id);
        if (!existing) {
          const certNumber = `CE-CERT-${new Date().getFullYear()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
          CertificateRepository.issue({
            id: crypto.randomUUID(),
            certificate_number: certNumber,
            event_id: eventId,
            student_id: att.student_id,
            issue_date: new Date().toISOString(),
            title: `Certificate of Participation: ${event.title}`,
            verification_status: 'verified',
            issued_by: req.user.id,
            created_at: new Date().toISOString()
          });

          NotificationRepository.create({
            id: crypto.randomUUID(),
            user_id: att.student_id,
            title: 'Certificate Awarded',
            message: `Your Certificate of Participation for "${event.title}" is now available. Serial: ${certNumber}`,
            type: 'certificate',
            link: `/student/certificates`
          });

          issuedCount++;
        }
      }

      res.json({
        message: `Generated ${issuedCount} certificates for attendees of "${event.title}".`,
        issuedCount
      });
    } catch (err: any) {
      console.error('[Bulk Issue Certificates Error]', err);
      res.status(500).json({ error: 'Failed to bulk issue certificates.' });
    }
  }

  // Get student's certificates
  static async getMyCertificates(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user || req.user.role !== 'student') {
        res.status(403).json({ error: 'Student access required.' });
        return;
      }

      const certificates = CertificateRepository.listByStudent(req.user.id);
      res.json({ certificates });
    } catch (err: any) {
      console.error('[Get My Certificates Error]', err);
      res.status(500).json({ error: 'Failed to retrieve certificates.' });
    }
  }

  // Public/institutional certificate verification by certificate number
  static async verifyCertificateNumber(req: Request, res: Response): Promise<void> {
    try {
      const { certNumber } = req.params;
      const certificate = CertificateRepository.findByNumber(certNumber.trim().toUpperCase());

      if (!certificate) {
        res.status(404).json({
          valid: false,
          error: 'Certificate record not found. Please verify the serial number.'
        });
        return;
      }

      res.json({
        valid: certificate.verification_status === 'verified',
        certificate
      });
    } catch (err: any) {
      console.error('[Verify Certificate Error]', err);
      res.status(500).json({ error: 'Failed to verify certificate.' });
    }
  }

  // List certificates for event
  static async getEventCertificates(req: Request, res: Response): Promise<void> {
    try {
      const { eventId } = req.params;
      const event = EventRepository.findById(eventId);

      if (!event) {
        res.status(404).json({ error: 'Event not found.' });
        return;
      }

      if (req.user?.role !== 'admin' && req.user?.id !== event.organizer_id) {
        res.status(403).json({ error: 'Unauthorized.' });
        return;
      }

      const certificates = CertificateRepository.listByEvent(eventId);
      res.json({ certificates });
    } catch (err: any) {
      console.error('[Get Event Certificates Error]', err);
      res.status(500).json({ error: 'Failed to retrieve certificates.' });
    }
  }

  // List all certificates (Admin)
  static async getAllCertificates(req: Request, res: Response): Promise<void> {
    try {
      if (req.user?.role !== 'admin') {
        res.status(403).json({ error: 'Admin access required.' });
        return;
      }

      const { search } = req.query;
      const certificates = CertificateRepository.listAll({ search: search as string });
      res.json({ certificates });
    } catch (err: any) {
      console.error('[Get All Certificates Error]', err);
      res.status(500).json({ error: 'Failed to retrieve certificates.' });
    }
  }
}
