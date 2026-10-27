import { dbHelper } from '../database/connection.js';

export interface User {
  id: string;
  role: 'student' | 'staff' | 'admin';
  email: string | null;
  username: string | null;
  password_hash: string;
  status: 'active' | 'pending' | 'approved' | 'rejected' | 'suspended';
  account_status?: 'active' | 'suspended' | 'banned' | 'deleted';
  session_version?: number;
  last_login_at?: string | null;
  email_verified: boolean | number;
  created_at: string;
  updated_at: string;
}

export interface StudentProfile {
  id: string;
  user_id: string;
  full_name: string;
  student_id: string | null;
  department: string | null;
  academic_year: string | null;
  phone: string | null;
  bio: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface VerificationToken {
  id: string;
  user_id: string;
  email: string;
  token: string;
  otp: string;
  expires_at: string;
  used: number;
  created_at: string;
}

export class UserRepository {
  static findById(id: string): User | undefined {
    return dbHelper.get<User>('SELECT * FROM users WHERE id = ?', [id]);
  }

  static findByEmail(email: string): User | undefined {
    return dbHelper.get<User>('SELECT * FROM users WHERE LOWER(email) = LOWER(?)', [email]);
  }

  static findByUsername(username: string): User | undefined {
    return dbHelper.get<User>('SELECT * FROM users WHERE LOWER(username) = LOWER(?)', [username]);
  }

  static create(user: Omit<User, 'created_at' | 'updated_at'>): User {
    const emailVerified = user.email_verified ? 1 : 0;
    const accountStatus = user.account_status || 'active';
    const sessionVersion = user.session_version || 1;
    dbHelper.run(
      `INSERT INTO users (id, role, email, username, password_hash, status, account_status, session_version, email_verified)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [user.id, user.role, user.email, user.username, user.password_hash, user.status, accountStatus, sessionVersion, emailVerified]
    );
    return this.findById(user.id)!;
  }

  static updatePassword(userId: string, newHash: string): void {
    dbHelper.run(
      `UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?`,
      [newHash, userId]
    );
  }

  static updateStatus(userId: string, status: User['status']): void {
    dbHelper.run(
      `UPDATE users SET status = ?, updated_at = datetime('now') WHERE id = ?`,
      [status, userId]
    );
  }

  static updateAccountStatus(userId: string, accountStatus: 'active' | 'suspended' | 'banned' | 'deleted'): void {
    dbHelper.run(
      `UPDATE users SET account_status = ?, updated_at = datetime('now') WHERE id = ?`,
      [accountStatus, userId]
    );
  }

  static incrementSessionVersion(userId: string): number {
    dbHelper.run(
      `UPDATE users SET session_version = session_version + 1, updated_at = datetime('now') WHERE id = ?`,
      [userId]
    );
    const updated = this.findById(userId);
    return updated?.session_version || 1;
  }

  static updateLastLogin(userId: string): void {
    dbHelper.run(
      `UPDATE users SET last_login_at = datetime('now'), updated_at = datetime('now') WHERE id = ?`,
      [userId]
    );
  }

  static setEmailVerified(userId: string): void {
    dbHelper.run(
      `UPDATE users SET email_verified = 1, updated_at = datetime('now') WHERE id = ?`,
      [userId]
    );
  }

  // Profile operations
  static getProfileByUserId(userId: string): StudentProfile | undefined {
    return dbHelper.get<StudentProfile>('SELECT * FROM profiles WHERE user_id = ?', [userId]);
  }

  static createProfile(profile: Omit<StudentProfile, 'created_at' | 'updated_at'>): StudentProfile {
    dbHelper.run(
      `INSERT INTO profiles (id, user_id, full_name, student_id, department, academic_year, phone, bio, avatar_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        profile.id,
        profile.user_id,
        profile.full_name,
        profile.student_id,
        profile.department,
        profile.academic_year,
        profile.phone,
        profile.bio,
        profile.avatar_url
      ]
    );
    return this.getProfileByUserId(profile.user_id)!;
  }

  static updateProfile(userId: string, data: Partial<StudentProfile>): StudentProfile {
    const current = this.getProfileByUserId(userId);
    if (!current) throw new Error('Profile not found');

    const updated = { ...current, ...data };
    dbHelper.run(
      `UPDATE profiles SET full_name = ?, student_id = ?, department = ?, academic_year = ?, phone = ?, bio = ?, avatar_url = ?, updated_at = datetime('now')
       WHERE user_id = ?`,
      [
        updated.full_name,
        updated.student_id,
        updated.department,
        updated.academic_year,
        updated.phone,
        updated.bio,
        updated.avatar_url,
        userId
      ]
    );
    return this.getProfileByUserId(userId)!;
  }

  // Password reset tokens
  static saveResetToken(id: string, userId: string, token: string, expiresAt: string): void {
    dbHelper.run(
      `INSERT INTO password_reset_tokens (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)`,
      [id, userId, token, expiresAt]
    );
  }

  static findValidResetToken(token: string): { id: string; user_id: string; expires_at: string; used: number } | undefined {
    return dbHelper.get(
      `SELECT * FROM password_reset_tokens WHERE token = ? AND used = 0 AND datetime(expires_at) > datetime('now')`,
      [token]
    );
  }

  static markResetTokenUsed(token: string): void {
    dbHelper.run('UPDATE password_reset_tokens SET used = 1 WHERE token = ?', [token]);
  }

  // Email verification tokens & OTP codes
  static saveVerificationOtp(id: string, userId: string, email: string, token: string, otp: string, expiresAt: string): void {
    dbHelper.run(
      `INSERT INTO verification_tokens (id, user_id, email, token, otp, expires_at) VALUES (?, ?, ?, ?, ?, ?)`,
      [id, userId, email, token, otp, expiresAt]
    );
  }

  static findValidOtp(email: string, otp: string): VerificationToken | undefined {
    return dbHelper.get<VerificationToken>(
      `SELECT * FROM verification_tokens WHERE LOWER(email) = LOWER(?) AND otp = ? AND used = 0 AND datetime(expires_at) > datetime('now') ORDER BY created_at DESC LIMIT 1`,
      [email, otp]
    );
  }

  static findValidVerificationToken(token: string): VerificationToken | undefined {
    return dbHelper.get<VerificationToken>(
      `SELECT * FROM verification_tokens WHERE token = ? AND used = 0 AND datetime(expires_at) > datetime('now') LIMIT 1`,
      [token]
    );
  }

  static markOtpUsed(id: string): void {
    dbHelper.run('UPDATE verification_tokens SET used = 1 WHERE id = ?', [id]);
  }
}
