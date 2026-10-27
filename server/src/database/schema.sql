-- CampusEvents SQLite Schema
-- Designed for easy migration to PostgreSQL / Supabase

PRAGMA foreign_keys = ON;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  role TEXT NOT NULL CHECK(role IN ('student', 'staff', 'admin')),
  email TEXT UNIQUE,
  username TEXT UNIQUE,
  password_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'pending', 'approved', 'rejected', 'suspended')),
  account_status TEXT NOT NULL DEFAULT 'active' CHECK(account_status IN ('active', 'suspended', 'banned', 'deleted')),
  session_version INTEGER NOT NULL DEFAULT 1,
  last_login_at TEXT,
  email_verified INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Student profiles
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  student_id TEXT,
  department TEXT,
  academic_year TEXT,
  phone TEXT,
  bio TEXT,
  avatar_url TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Academic Departments table (Configurable by Admin)
CREATE TABLE IF NOT EXISTS departments (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Staff profiles
CREATE TABLE IF NOT EXISTS staff_profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  staff_id TEXT NOT NULL,
  department_id TEXT REFERENCES departments(id),
  department TEXT NOT NULL,
  designation TEXT NOT NULL,
  official_email TEXT NOT NULL,
  phone TEXT,
  office_location TEXT,
  approval_status TEXT NOT NULL DEFAULT 'pending' CHECK(approval_status IN ('pending', 'approved', 'rejected')),
  account_status TEXT NOT NULL DEFAULT 'active' CHECK(account_status IN ('active', 'suspended', 'banned', 'deleted')),
  approved_by TEXT REFERENCES users(id),
  approved_at TEXT,
  rejection_reason TEXT,
  suspended_at TEXT,
  suspended_by TEXT REFERENCES users(id),
  suspension_reason TEXT,
  banned_at TEXT,
  banned_by TEXT REFERENCES users(id),
  ban_reason TEXT,
  deleted_at TEXT,
  deleted_by TEXT REFERENCES users(id),
  deletion_reason TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Staff Department Transfer History (Audit trail of department movements)
CREATE TABLE IF NOT EXISTS staff_department_transfers (
  id TEXT PRIMARY KEY,
  staff_profile_id TEXT NOT NULL REFERENCES staff_profiles(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  staff_id TEXT NOT NULL,
  previous_department_id TEXT REFERENCES departments(id),
  previous_department_name TEXT NOT NULL,
  new_department_id TEXT NOT NULL REFERENCES departments(id),
  new_department_name TEXT NOT NULL,
  transfer_reason TEXT NOT NULL,
  transferred_by TEXT NOT NULL REFERENCES users(id),
  transferred_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Blocked / retired staff identities (prevents reuse of staff_id and institutional email)
CREATE TABLE IF NOT EXISTS blocked_staff_identities (
  id TEXT PRIMARY KEY,
  staff_id TEXT NOT NULL,
  email TEXT NOT NULL,
  user_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('suspended', 'banned', 'deleted', 'retired')),
  blocked_by TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Admin Security Audit Logs
CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id TEXT PRIMARY KEY,
  admin_id TEXT NOT NULL REFERENCES users(id),
  target_user_id TEXT NOT NULL,
  target_staff_id TEXT,
  target_name TEXT,
  action TEXT NOT NULL,
  previous_status TEXT,
  new_status TEXT,
  reason TEXT NOT NULL,
  metadata TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Events table
CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  poster_url TEXT,
  date TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  venue TEXT NOT NULL,
  organizer_id TEXT NOT NULL REFERENCES users(id),
  organizer_name TEXT NOT NULL,
  department TEXT NOT NULL,
  max_participants INTEGER NOT NULL DEFAULT 100,
  registration_start TEXT NOT NULL,
  registration_end TEXT NOT NULL,
  guidelines TEXT,
  status TEXT NOT NULL DEFAULT 'published' CHECK(status IN ('draft', 'published', 'closed', 'completed', 'cancelled')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Event registrations
CREATE TABLE IF NOT EXISTS event_registrations (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ticket_code TEXT UNIQUE NOT NULL,
  qr_payload TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'registered' CHECK(status IN ('registered', 'cancelled', 'attended')),
  registered_at TEXT NOT NULL DEFAULT (datetime('now')),
  cancelled_at TEXT,
  UNIQUE(event_id, student_id)
);

-- Attendance tracking
CREATE TABLE IF NOT EXISTS attendance (
  id TEXT PRIMARY KEY,
  registration_id TEXT UNIQUE NOT NULL REFERENCES event_registrations(id) ON DELETE CASCADE,
  event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  verified_by TEXT NOT NULL REFERENCES users(id),
  verified_at TEXT NOT NULL DEFAULT (datetime('now')),
  verification_method TEXT NOT NULL DEFAULT 'qr_scan' CHECK(verification_method IN ('qr_scan', 'manual_verify')),
  notes TEXT
);

-- Feedback
CREATE TABLE IF NOT EXISTS feedback (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
  comments TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(event_id, student_id)
);

-- Certificates
CREATE TABLE IF NOT EXISTS certificates (
  id TEXT PRIMARY KEY,
  certificate_number TEXT UNIQUE NOT NULL,
  event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  issue_date TEXT NOT NULL DEFAULT (datetime('now')),
  title TEXT NOT NULL,
  verification_status TEXT NOT NULL DEFAULT 'verified' CHECK(verification_status IN ('verified', 'revoked')),
  issued_by TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(event_id, student_id)
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  link TEXT,
  is_read INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Password reset tokens
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TEXT NOT NULL,
  used INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Email verification tokens & OTP codes
CREATE TABLE IF NOT EXISTS verification_tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  otp TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  used INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_organizer ON events(organizer_id);
CREATE INDEX IF NOT EXISTS idx_registrations_event ON event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_registrations_student ON event_registrations(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_event ON attendance(event_id);
CREATE INDEX IF NOT EXISTS idx_feedback_event ON feedback(event_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
