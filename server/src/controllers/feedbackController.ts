import { Request, Response } from 'express';
import crypto from 'node:crypto';
import { FeedbackRepository } from '../repositories/FeedbackRepository.js';
import { AttendanceRepository } from '../repositories/AttendanceRepository.js';
import { EventRepository } from '../repositories/EventRepository.js';
import { NotificationRepository } from '../repositories/NotificationRepository.js';

export class FeedbackController {
  // Submit feedback (Student, only after attendance)
  static async submitFeedback(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user || req.user.role !== 'student') {
        res.status(403).json({ error: 'Only attendees can submit event feedback.' });
        return;
      }

      const { eventId, rating, comments } = req.body;

      if (!eventId || !rating || !comments) {
        res.status(400).json({ error: 'Event ID, rating (1-5), and feedback comments are required.' });
        return;
      }

      const numRating = parseInt(rating, 10);
      if (isNaN(numRating) || numRating < 1 || numRating > 5) {
        res.status(400).json({ error: 'Rating must be an integer between 1 and 5.' });
        return;
      }

      // Verify attendance
      const attendance = AttendanceRepository.findByEventAndStudent(eventId, req.user.id);
      if (!attendance) {
        res.status(403).json({ error: 'Feedback can only be submitted after your attendance has been recorded for this event.' });
        return;
      }

      // Check if feedback already submitted
      const existing = FeedbackRepository.findByEventAndStudent(eventId, req.user.id);
      if (existing) {
        res.status(409).json({ error: 'You have already submitted feedback for this event.' });
        return;
      }

      const feedback = FeedbackRepository.create({
        id: crypto.randomUUID(),
        event_id: eventId,
        student_id: req.user.id,
        rating: numRating,
        comments: comments.trim(),
        created_at: new Date().toISOString()
      });

      const event = EventRepository.findById(eventId);
      if (event) {
        // Notify organizer
        NotificationRepository.create({
          id: crypto.randomUUID(),
          user_id: event.organizer_id,
          title: 'New Feedback Received',
          message: `A participant left a ${numRating}-star review on "${event.title}".`,
          type: 'event_update',
          link: `/staff/events/${eventId}`
        });
      }

      res.status(201).json({
        message: 'Feedback submitted successfully. Thank you for your evaluation.',
        feedback
      });
    } catch (err: any) {
      console.error('[Submit Feedback Error]', err);
      res.status(500).json({ error: 'Failed to record feedback.' });
    }
  }

  // Get feedback for an event (Staff / Admin)
  static async getEventFeedback(req: Request, res: Response): Promise<void> {
    try {
      const { eventId } = req.params;
      const event = EventRepository.findById(eventId);

      if (!event) {
        res.status(404).json({ error: 'Event not found.' });
        return;
      }

      if (req.user?.role !== 'admin' && req.user?.id !== event.organizer_id) {
        res.status(403).json({ error: 'Unauthorized to view feedback for this event.' });
        return;
      }

      const feedbackList = FeedbackRepository.listByEvent(eventId);
      res.json({ feedback: feedbackList });
    } catch (err: any) {
      console.error('[Get Event Feedback Error]', err);
      res.status(500).json({ error: 'Failed to retrieve feedback.' });
    }
  }

  // List all platform feedback (Admin)
  static async getAllFeedback(req: Request, res: Response): Promise<void> {
    try {
      if (req.user?.role !== 'admin') {
        res.status(403).json({ error: 'Admin access required.' });
        return;
      }

      const { eventId, search } = req.query;
      const feedback = FeedbackRepository.listAll({
        eventId: eventId as string,
        search: search as string
      });

      res.json({ feedback });
    } catch (err: any) {
      console.error('[Get All Feedback Error]', err);
      res.status(500).json({ error: 'Failed to retrieve feedback.' });
    }
  }
}
