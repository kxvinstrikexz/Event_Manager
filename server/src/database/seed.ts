import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { initializeDatabase, dbHelper } from './connection.js';
import { generateSecureQRPayload } from '../utils/qr.js';

export async function seedDatabase() {
  console.log('[Seed] Initializing database schema...');
  initializeDatabase();

  // Check if admin user already exists
  const existingAdmin = dbHelper.get("SELECT id FROM users WHERE username = 'admin'");
  if (existingAdmin) {
    console.log('[Seed] Database already seeded. Skipping initial seeding.');
    return;
  }

  console.log('[Seed] Populating initial institutional data...');

  // 1. Create Admin Account
  const adminId = crypto.randomUUID();
  const adminPasswordHash = await bcrypt.hash('CampusAdmin2026!', 10);
  dbHelper.run(
    `INSERT INTO users (id, role, email, username, password_hash, status, email_verified)
     VALUES (?, 'admin', 'admin@campusevents.edu', 'admin', ?, 'active', 1)`,
    [adminId, adminPasswordHash]
  );

  // Admin profile
  dbHelper.run(
    `INSERT INTO profiles (id, user_id, full_name, student_id, department, academic_year, phone, bio, avatar_url)
     VALUES (?, ?, 'Office of the Academic Registrar', NULL, 'Central Administration', NULL, '+1 (555) 019-2831', 'Institutional event supervision.', NULL)`,
    [crypto.randomUUID(), adminId]
  );

  // 2. Create Approved Faculty Member (Dr. Arthur Vance)
  const staff1Id = crypto.randomUUID();
  const staffPasswordHash = await bcrypt.hash('FacultySecure2026!', 10);
  dbHelper.run(
    `INSERT INTO users (id, role, email, username, password_hash, status, email_verified)
     VALUES (?, 'staff', 'arthur.vance@campusevents.edu', NULL, ?, 'approved', 1)`,
    [staff1Id, staffPasswordHash]
  );

  dbHelper.run(
    `INSERT INTO staff_profiles (
      id, user_id, full_name, staff_id, department, designation, official_email,
      phone, office_location, approval_status, approved_by, approved_at, rejection_reason
    ) VALUES (?, ?, 'Dr. Arthur Vance', 'FAC-CS-1082', 'Computer Science & Engineering', 'Professor & Program Chair',
      'arthur.vance@campusevents.edu', '+1 (555) 018-9241', 'Engineering Hall 304', 'approved', ?, datetime('now'), NULL)`,
    [crypto.randomUUID(), staff1Id, adminId]
  );

  // 3. Create Pending Faculty Member (Prof. Elena Rostova - to test approval)
  const staff2Id = crypto.randomUUID();
  dbHelper.run(
    `INSERT INTO users (id, role, email, username, password_hash, status, email_verified)
     VALUES (?, 'staff', 'elena.rostova@campusevents.edu', NULL, ?, 'pending', 1)`,
    [staff2Id, staffPasswordHash]
  );

  dbHelper.run(
    `INSERT INTO staff_profiles (
      id, user_id, full_name, staff_id, department, designation, official_email,
      phone, office_location, approval_status, approved_by, approved_at, rejection_reason
    ) VALUES (?, ?, 'Prof. Elena Rostova', 'FAC-ARCH-2094', 'Architecture & Urban Design', 'Associate Professor',
      'elena.rostova@campusevents.edu', '+1 (555) 018-7723', 'Design Studio B-12', 'pending', NULL, NULL, NULL)`,
    [crypto.randomUUID(), staff2Id]
  );

  // 4. Create Student Account (Maya Chen)
  const student1Id = crypto.randomUUID();
  const studentPasswordHash = await bcrypt.hash('StudentPass2026!', 10);
  dbHelper.run(
    `INSERT INTO users (id, role, email, username, password_hash, status, email_verified)
     VALUES (?, 'student', 'maya.chen@student.campusevents.edu', NULL, ?, 'active', 1)`,
    [student1Id, studentPasswordHash]
  );

  dbHelper.run(
    `INSERT INTO profiles (
      id, user_id, full_name, student_id, department, academic_year, phone, bio, avatar_url
    ) VALUES (?, ?, 'Maya Chen', 'CS2023-0482', 'Computer Science & Engineering', '3rd Year Undergraduate',
      '+1 (555) 014-9921', 'Specializing in Human-Computer Interaction and Distributed Systems.', NULL)`,
    [crypto.randomUUID(), student1Id]
  );

  // 5. Seed Events
  const event1Id = crypto.randomUUID();
  dbHelper.run(
    `INSERT INTO events (
      id, title, description, category, poster_url, date, start_time, end_time,
      venue, organizer_id, organizer_name, department, max_participants,
      registration_start, registration_end, guidelines, status
    ) VALUES (
      ?,
      'Annual University Research Symposium & Poster Gala',
      'The premier institutional showcase presenting undergraduate and graduate breakthroughs across computational sciences, biomedical engineering, and sustainable energy. Keynotes will be delivered by visiting IEEE fellows and national laboratory scientists.',
      'Academic & Research',
      'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80',
      '2026-10-24',
      '09:00',
      '17:00',
      'University Great Hall & Quadrangle',
      ?,
      'Dr. Arthur Vance (Professor & Program Chair)',
      'Computer Science & Engineering',
      250,
      '2026-10-01',
      '2026-10-23',
      'Formal academic attire recommended. All student poster presenters must check in at the reception concourse 30 minutes before opening session. Digital event pass required for entry.',
      'published'
    )`,
    [event1Id, staff1Id]
  );

  const event2Id = crypto.randomUUID();
  dbHelper.run(
    `INSERT INTO events (
      id, title, description, category, poster_url, date, start_time, end_time,
      venue, organizer_id, organizer_name, department, max_participants,
      registration_start, registration_end, guidelines, status
    ) VALUES (
      ?,
      'Autonomous Robotics & Embedded AI Hackathon',
      'A 36-hour intensive collegiate hackathon challenging multidisciplinary student teams to prototype autonomous navigation algorithms, computer vision pipelines, and ROS-driven physical robotics testbeds.',
      'Technology & Innovation',
      'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1200&q=80',
      '2026-11-12',
      '10:00',
      '20:00',
      'Advanced Robotics Innovation Center, Lab 4',
      ?,
      'Dr. Arthur Vance (Professor & Program Chair)',
      'Computer Science & Engineering',
      120,
      '2026-10-01',
      '2026-11-10',
      'Bring university student ID card and your personal development hardware. Hardware kits (Raspberry Pi 5, LiDAR modules, sensors) will be provided on-site.',
      'published'
    )`,
    [event2Id, staff1Id]
  );

  const event3Id = crypto.randomUUID();
  dbHelper.run(
    `INSERT INTO events (
      id, title, description, category, poster_url, date, start_time, end_time,
      venue, organizer_id, organizer_name, department, max_participants,
      registration_start, registration_end, guidelines, status
    ) VALUES (
      ?,
      'Distinguished Alumni Leadership & Career Forum',
      'Connect with university alumni holding executive, scientific, and design leadership positions at global research institutes and tech pioneers. Includes curated roundtables, resume critiques, and networking dinner.',
      'Career & Placement',
      'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80',
      '2026-11-28',
      '14:00',
      '18:30',
      'University Alumni Auditorium',
      ?,
      'University Administration',
      'Central Administration',
      300,
      '2026-10-01',
      '2026-11-26',
      'Business professional attire mandatory. Have updated CVs ready in print or digital format.',
      'published'
    )`,
    [event3Id, adminId]
  );

  const pastEventId = crypto.randomUUID();
  dbHelper.run(
    `INSERT INTO events (
      id, title, description, category, poster_url, date, start_time, end_time,
      venue, organizer_id, organizer_name, department, max_participants,
      registration_start, registration_end, guidelines, status
    ) VALUES (
      ?,
      'Fall Orientation & University Convocation',
      'The formal welcoming convocation for incoming scholars, featuring academic dean addresses, campus guild introductions, and research ethics orientation.',
      'Academic & Research',
      'https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=1200&q=80',
      '2026-09-15',
      '10:00',
      '13:00',
      'Main University Auditorium',
      ?,
      'Dr. Arthur Vance (Professor & Program Chair)',
      'Computer Science & Engineering',
      500,
      '2026-08-01',
      '2026-09-14',
      'Completed institutional orientation.',
      'completed'
    )`,
    [pastEventId, staff1Id]
  );

  // 6. Seed Registration for Maya Chen on Event 1 (Upcoming)
  const reg1Id = crypto.randomUUID();
  const ticket1 = 'EVT-2026-B871A2';
  const qr1Payload = generateSecureQRPayload(reg1Id, event1Id, student1Id, ticket1);
  dbHelper.run(
    `INSERT INTO event_registrations (id, event_id, student_id, ticket_code, qr_payload, status, registered_at)
     VALUES (?, ?, ?, ?, ?, 'registered', datetime('now'))`,
    [reg1Id, event1Id, student1Id, ticket1, qr1Payload]
  );

  // 7. Seed Past Registration, Attendance, Feedback & Certificate for Maya Chen on Past Event
  const regPastId = crypto.randomUUID();
  const ticketPast = 'EVT-2026-C992F1';
  const qrPastPayload = generateSecureQRPayload(regPastId, pastEventId, student1Id, ticketPast);
  dbHelper.run(
    `INSERT INTO event_registrations (id, event_id, student_id, ticket_code, qr_payload, status, registered_at)
     VALUES (?, ?, ?, ?, ?, 'attended', '2026-09-02 11:20:00')`,
    [regPastId, pastEventId, student1Id, ticketPast, qrPastPayload]
  );

  // Attendance
  dbHelper.run(
    `INSERT INTO attendance (id, registration_id, event_id, student_id, verified_by, verified_at, verification_method, notes)
     VALUES (?, ?, ?, ?, ?, '2026-09-15 09:42:15', 'qr_scan', 'Verified at Auditorium South Checkpoint')`,
    [crypto.randomUUID(), regPastId, pastEventId, student1Id, staff1Id]
  );

  // Feedback
  dbHelper.run(
    `INSERT INTO feedback (id, event_id, student_id, rating, comments, created_at)
     VALUES (?, ?, ?, 5, 'Exceptional orientation session. The guidance on undergraduate research opportunities and department expectations was very clarifying.', '2026-09-16 14:10:00')`,
    [crypto.randomUUID(), pastEventId, student1Id]
  );

  // Certificate
  const certNumber = 'CE-CERT-2026-89104';
  dbHelper.run(
    `INSERT INTO certificates (id, certificate_number, event_id, student_id, issue_date, title, verification_status, issued_by, created_at)
     VALUES (?, ?, ?, ?, '2026-09-16 18:00:00', 'Certificate of Completion: Fall Convocation & Academic Ethics', 'verified', ?, '2026-09-16 18:00:00')`,
    [crypto.randomUUID(), certNumber, pastEventId, student1Id, staff1Id]
  );

  // Notifications
  dbHelper.run(
    `INSERT INTO notifications (id, user_id, title, message, type, link, is_read, created_at)
     VALUES (?, ?, 'Registration Confirmed', 'You are registered for "Annual University Research Symposium & Poster Gala". Your digital pass is available in your portal.', 'registration', '/student/registrations', 0, datetime('now'))`,
    [crypto.randomUUID(), student1Id]
  );

  dbHelper.run(
    `INSERT INTO notifications (id, user_id, title, message, type, link, is_read, created_at)
     VALUES (?, ?, 'Certificate Available', 'Your official Certificate of Completion for "Fall Orientation & University Convocation" is ready for download.', 'certificate', '/student/certificates', 1, '2026-09-16 18:05:00')`,
    [crypto.randomUUID(), student1Id]
  );

  dbHelper.run(
    `INSERT INTO notifications (id, user_id, title, message, type, link, is_read, created_at)
     VALUES (?, ?, 'Pending Faculty Application', 'Prof. Elena Rostova from Architecture & Urban Design has registered and is awaiting administrator verification.', 'approval', '/admin/staff', 0, datetime('now'))`,
    [crypto.randomUUID(), adminId]
  );

  console.log('[Seed] Database populated successfully with authentic university records.');
  console.log('--- DEFAULT CREDENTIALS ---');
  console.log('Administrator:   Username: admin                          | Password: CampusAdmin2026!');
  console.log('Approved Staff:  Email: arthur.vance@campusevents.edu     | Password: FacultySecure2026!');
  console.log('Pending Staff:   Email: elena.rostova@campusevents.edu    | Password: FacultySecure2026!');
  console.log('Student Account: Email: maya.chen@student.campusevents.edu | Password: StudentPass2026!');
  console.log('---------------------------');
}

// If run directly via node/tsx
if (process.argv[1]?.endsWith('seed.ts') || process.argv[1]?.endsWith('seed.js')) {
  seedDatabase().catch((err) => {
    console.error('[Seed Error]', err);
    process.exit(1);
  });
}
