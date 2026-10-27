import { Request, Response } from 'express';
import crypto from 'node:crypto';
import { EventRepository, EventEntity } from '../repositories/EventRepository.js';
import { StaffRepository } from '../repositories/StaffRepository.js';
import { UserRepository } from '../repositories/UserRepository.js';
import { NotificationRepository } from '../repositories/NotificationRepository.js';

export class EventController {
  // List events (with role-aware filtering)
  static async listEvents(req: Request, res: Response): Promise<void> {
    try {
      const { category, search, dateFilter, status, organizerId } = req.query;
      const currentUserId = req.user?.id;
      const userRole = req.user?.role;

      let statusFilter = status as string;
      // If student or unauthenticated, always restrict to published
      if (!userRole || userRole === 'student') {
        statusFilter = 'published';
      }

      const events = EventRepository.list({
        category: category as string,
        search: search as string,
        dateFilter: (dateFilter as any) || 'all',
        status: statusFilter,
        organizerId: organizerId as string,
        currentUserId
      });

      res.json({ events });
    } catch (err: any) {
      console.error('[List Events Error]', err);
      res.status(500).json({ error: 'Failed to retrieve events.' });
    }
  }

  // Get single event
  static async getEvent(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const currentUserId = req.user?.id;
      const event = EventRepository.findById(id, currentUserId);

      if (!event) {
        res.status(404).json({ error: 'Event not found.' });
        return;
      }

      // If event is draft or cancelled, only the organizer or admin can view
      if (['draft', 'cancelled'].includes(event.status)) {
        if (!req.user || (req.user.role !== 'admin' && req.user.id !== event.organizer_id)) {
          res.status(403).json({ error: 'This event is not published.' });
          return;
        }
      }

      res.json({ event });
    } catch (err: any) {
      console.error('[Get Event Error]', err);
      res.status(500).json({ error: 'Failed to retrieve event.' });
    }
  }

  // Create event (Staff or Admin)
  static async createEvent(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user || (req.user.role !== 'staff' && req.user.role !== 'admin')) {
        res.status(403).json({ error: 'Unauthorized to create events.' });
        return;
      }

      const {
        title,
        description,
        category,
        poster_url,
        date,
        start_time,
        end_time,
        venue,
        department,
        max_participants,
        registration_start,
        registration_end,
        guidelines,
        status
      } = req.body;

      if (!title || !description || !category || !date || !start_time || !end_time || !venue) {
        res.status(400).json({ error: 'Title, description, category, date, start time, end time, and venue are required.' });
        return;
      }

      // Fetch organizer name
      let organizerName = 'Campus Administration';
      let orgDept = department || 'University General';

      if (req.user.role === 'staff') {
        const staff = StaffRepository.findByUserId(req.user.id);
        if (staff) {
          organizerName = `${staff.full_name} (${staff.designation})`;
          orgDept = staff.department;
        }
      } else if (req.user.role === 'admin') {
        organizerName = 'University Administration';
      }

      const newEvent: Omit<EventEntity, 'created_at' | 'updated_at'> = {
        id: crypto.randomUUID(),
        title: title.trim(),
        description: description.trim(),
        category: category.trim(),
        poster_url: poster_url || null,
        date,
        start_time,
        end_time,
        venue: venue.trim(),
        organizer_id: req.user.id,
        organizer_name: organizerName,
        department: orgDept,
        max_participants: parseInt(max_participants, 10) || 100,
        registration_start: registration_start || new Date().toISOString().split('T')[0],
        registration_end: registration_end || date,
        guidelines: guidelines?.trim() || null,
        status: status || 'published'
      };

      const created = EventRepository.create(newEvent);

      res.status(201).json({
        message: 'Event created successfully.',
        event: created
      });
    } catch (err: any) {
      console.error('[Create Event Error]', err);
      res.status(500).json({ error: 'Failed to create event.' });
    }
  }

  // Update event (Staff owner or Admin)
  static async updateEvent(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const event = EventRepository.findById(id);

      if (!event) {
        res.status(404).json({ error: 'Event not found.' });
        return;
      }

      // Authorization check: only organizer or admin
      if (req.user?.role !== 'admin' && req.user?.id !== event.organizer_id) {
        res.status(403).json({ error: 'Unauthorized to modify this event.' });
        return;
      }

      const updated = EventRepository.update(id, req.body);
      res.json({ message: 'Event updated successfully.', event: updated });
    } catch (err: any) {
      console.error('[Update Event Error]', err);
      res.status(500).json({ error: 'Failed to update event.' });
    }
  }

  // Delete event (Organizer or Admin)
  static async deleteEvent(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const event = EventRepository.findById(id);

      if (!event) {
        res.status(404).json({ error: 'Event not found.' });
        return;
      }

      if (req.user?.role !== 'admin' && req.user?.id !== event.organizer_id) {
        res.status(403).json({ error: 'Unauthorized to delete this event.' });
        return;
      }

      EventRepository.delete(id);
      res.json({ message: 'Event removed successfully.' });
    } catch (err: any) {
      console.error('[Delete Event Error]', err);
      res.status(500).json({ error: 'Failed to delete event.' });
    }
  }

  // Staff events list (events organized by currently logged in staff)
  static async getMyStaffEvents(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user || req.user.role !== 'staff') {
        res.status(403).json({ error: 'Staff access required.' });
        return;
      }

      const events = EventRepository.list({ organizerId: req.user.id });
      res.json({ events });
    } catch (err: any) {
      console.error('[Get My Events Error]', err);
      res.status(500).json({ error: 'Failed to retrieve staff events.' });
    }
  }
}
