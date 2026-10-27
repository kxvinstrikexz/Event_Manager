import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import { config } from '../config.js';
import { UserRepository } from '../repositories/UserRepository.js';
import { StaffRepository } from '../repositories/StaffRepository.js';
import { DepartmentRepository } from '../repositories/DepartmentRepository.js';
import { NotificationRepository } from '../repositories/NotificationRepository.js';

function signToken(userId: string, sessionVersion: number = 1): string {
  return jwt.sign({ userId, sessionVersion }, config.jwtSecret, { expiresIn: '7d' });
}

export class AuthController {
  // Student registration
  static async registerStudent(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, fullName, studentId, department, academicYear, phone } = req.body;

      if (!email || !password || !fullName) {
        res.status(400).json({ error: 'Full name, email, and password are required.' });
        return;
      }

      if (password.length < 8) {
        res.status(400).json({ error: 'Password must be at least 8 characters long.' });
        return;
      }

      const existing = UserRepository.findByEmail(email);
      if (existing) {
        res.status(409).json({ error: 'An account with this email address already exists.' });
        return;
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const userId = crypto.randomUUID();
      const profileId = crypto.randomUUID();

      const user = UserRepository.create({
        id: userId,
        role: 'student',
        email,
        username: null,
        password_hash: passwordHash,
        status: 'active',
        email_verified: 1
      });

      const profile = UserRepository.createProfile({
        id: profileId,
        user_id: userId,
        full_name: fullName.trim(),
        student_id: studentId?.trim() || null,
        department: department?.trim() || null,
        academic_year: academicYear?.trim() || null,
        phone: phone?.trim() || null,
        bio: null,
        avatar_url: null
      });

      // Welcome notification
      NotificationRepository.create({
        id: crypto.randomUUID(),
        user_id: userId,
        title: 'Welcome to CampusEvents',
        message: 'Your student account is active. You can now explore university events, register, and receive digital event passes.',
        type: 'system',
        link: '/student/events'
      });

      const token = signToken(user.id);
      res.status(201).json({
        message: 'Student account created successfully.',
        token,
        user: {
          id: user.id,
          role: user.role,
          email: user.email,
          status: user.status,
          profile
        }
      });
    } catch (err: any) {
      console.error('[Register Student Error]', err);
      res.status(500).json({ error: 'Internal server error during registration.' });
    }
  }

  // Student login
  static async loginStudent(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ error: 'Email and password are required.' });
        return;
      }

      const user = UserRepository.findByEmail(email);
      if (!user || user.role !== 'student') {
        res.status(401).json({ error: 'Invalid student credentials.' });
        return;
      }

      if (user.status === 'suspended') {
        res.status(403).json({ error: 'Your student account is suspended.' });
        return;
      }

      const match = await bcrypt.compare(password, user.password_hash);
      if (!match) {
        res.status(401).json({ error: 'Invalid student credentials.' });
        return;
      }

      UserRepository.updateLastLogin(user.id);
      const profile = UserRepository.getProfileByUserId(user.id);
      const token = signToken(user.id, user.session_version || 1);

      res.json({
        message: 'Login successful.',
        token,
        user: {
          id: user.id,
          role: user.role,
          email: user.email,
          status: user.status,
          profile
        }
      });
    } catch (err: any) {
      console.error('[Login Student Error]', err);
      res.status(500).json({ error: 'Internal server error during login.' });
    }
  }

  // Staff registration (Defaults to pending approval; NO token issued)
  static async registerStaff(req: Request, res: Response): Promise<void> {
    try {
      const { officialEmail, password, fullName, staffId, department, designation, phone, officeLocation } = req.body;

      if (!officialEmail || !password || !fullName || !staffId || !department || !designation) {
        res.status(400).json({ error: 'Official email, password, full name, staff ID, department, and designation are required.' });
        return;
      }

      if (password.length < 8) {
        res.status(400).json({ error: 'Password must be at least 8 characters long.' });
        return;
      }

      // Check #1: Blocked/retired staff identity records (prevents banned/deleted identity reuse)
      const blockedRecord = StaffRepository.isIdentityBlocked(officialEmail, staffId);
      if (blockedRecord) {
        res.status(403).json({
          error: 'This institutional email or Staff ID is restricted from registration. Please contact administration.',
          code: 'STAFF_IDENTITY_BLOCKED'
        });
        return;
      }

      // Check #2: Validate Academic Department against existing database records
      const deptRecord = DepartmentRepository.findByNameOrCodeOrId(department);
      if (!deptRecord || !deptRecord.is_active) {
        res.status(400).json({
          error: 'The selected academic department is invalid or currently inactive. Please select a valid department.',
          code: 'INVALID_DEPARTMENT'
        });
        return;
      }

      const existing = UserRepository.findByEmail(officialEmail);
      if (existing) {
        res.status(409).json({ error: 'An account with this email address already exists.' });
        return;
      }

      const existingStaffId = StaffRepository.findByStaffId(staffId);
      if (existingStaffId) {
        res.status(409).json({ error: 'A staff profile with this Staff ID already exists.' });
        return;
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const userId = crypto.randomUUID();
      const staffProfileId = crypto.randomUUID();

      const user = UserRepository.create({
        id: userId,
        role: 'staff',
        email: officialEmail,
        username: null,
        password_hash: passwordHash,
        status: 'pending', // Pending administrative approval
        account_status: 'active',
        session_version: 1,
        email_verified: 0  // Pending OTP email verification
      });

      const staffProfile = StaffRepository.create({
        id: staffProfileId,
        user_id: userId,
        full_name: fullName.trim(),
        staff_id: staffId.trim(),
        department_id: deptRecord.id,
        department: deptRecord.name,
        designation: designation.trim(),
        official_email: officialEmail.trim(),
        phone: phone?.trim() || null,
        office_location: officeLocation?.trim() || null,
        approval_status: 'pending',
        approved_by: null,
        approved_at: null,
        rejection_reason: null
      });

      // Generate 6-digit OTP
      const otp = crypto.randomInt(100000, 1000000).toString();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 mins
      UserRepository.saveVerificationOtp(crypto.randomUUID(), userId, officialEmail.trim(), crypto.randomBytes(32).toString('hex'), otp, expiresAt);

      // Notification to staff user
      NotificationRepository.create({
        id: crypto.randomUUID(),
        user_id: userId,
        title: 'Registration Submitted',
        message: 'Your faculty/staff account has been created with status PENDING. University administrators will review and approve your credentials before you can manage events.',
        type: 'approval',
        link: '/staff/dashboard'
      });

      // CRITICAL SECURITY FIX: Under NO circumstances return a token or grant session to pending staff
      res.status(201).json({
        message: 'Staff registration submitted. Please verify your institutional email with the OTP sent.',
        email: officialEmail,
        approvalStatus: 'pending',
        requiresVerification: true,
        devOtp: otp, // Provided for instant local/dev testing
        user: {
          id: user.id,
          role: user.role,
          email: user.email,
          status: 'pending',
          email_verified: false,
          staffProfile
        }
      });
    } catch (err: any) {
      console.error('[Register Staff Error]', err);
      res.status(500).json({ error: 'Internal server error during staff registration.' });
    }
  }

  // Verify OTP
  static async verifyOtp(req: Request, res: Response): Promise<void> {
    try {
      const { email, otp } = req.body;

      if (!email || !otp) {
        res.status(400).json({ error: 'Email and OTP code are required.' });
        return;
      }

      const tokenRecord = UserRepository.findValidOtp(email.trim(), otp.trim());
      if (!tokenRecord) {
        res.status(400).json({ error: 'Invalid or expired OTP code.' });
        return;
      }

      // Mark OTP as used
      UserRepository.markOtpUsed(tokenRecord.id);
      // Update email_verified to 1
      UserRepository.setEmailVerified(tokenRecord.user_id);

      const user = UserRepository.findById(tokenRecord.user_id);
      if (!user) {
        res.status(404).json({ error: 'User not found.' });
        return;
      }

      if (user.role === 'staff') {
        const staff = StaffRepository.findByUserId(user.id);
        const approvalStatus = staff?.approval_status || user.status;

        // Still pending admin approval - NEVER return a JWT token here
        res.json({
          message: 'Institutional email verified successfully. Your staff account is currently awaiting administrator approval before you can log in.',
          emailVerified: true,
          approvalStatus
        });
        return;
      }

      // If student
      res.json({
        message: 'Email verified successfully.',
        emailVerified: true
      });
    } catch (err: any) {
      console.error('[Verify OTP Error]', err);
      res.status(500).json({ error: 'Internal server error during OTP verification.' });
    }
  }

  // Resend OTP
  static async resendOtp(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;

      if (!email) {
        res.status(400).json({ error: 'Email address is required.' });
        return;
      }

      const user = UserRepository.findByEmail(email.trim());
      if (!user) {
        // Prevent user enumeration
        res.json({
          message: 'If an account exists with this email, a new verification code has been dispatched.'
        });
        return;
      }

      if (user.email_verified) {
        res.json({
          message: 'Email is already verified.',
          emailVerified: true
        });
        return;
      }

      const otp = crypto.randomInt(100000, 1000000).toString();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      UserRepository.saveVerificationOtp(crypto.randomUUID(), user.id, user.email || email.trim(), crypto.randomBytes(32).toString('hex'), otp, expiresAt);

      res.json({
        message: 'A new verification code has been dispatched to your institutional email.',
        devOtp: otp
      });
    } catch (err: any) {
      console.error('[Resend OTP Error]', err);
      res.status(500).json({ error: 'Internal server error.' });
    }
  }

  // Staff login - Strict approval and email verification enforcement
  static async loginStaff(req: Request, res: Response): Promise<void> {
    try {
      const { officialEmail, password } = req.body;

      if (!officialEmail || !password) {
        res.status(400).json({ error: 'Official email and password are required.' });
        return;
      }

      const user = UserRepository.findByEmail(officialEmail);
      if (!user || user.role !== 'staff') {
        res.status(401).json({ error: 'Invalid staff credentials.' });
        return;
      }

      const match = await bcrypt.compare(password, user.password_hash);
      if (!match) {
        res.status(401).json({ error: 'Invalid staff credentials.' });
        return;
      }

      // Check #1: Institutional email verification
      if (!user.email_verified || user.email_verified === 0) {
        res.status(403).json({
          error: 'Please verify your institutional email before logging in.',
          code: 'STAFF_EMAIL_UNVERIFIED',
          email: user.email
        });
        return;
      }

      const staffProfile = StaffRepository.findByUserId(user.id);
      const approvalStatus = staffProfile?.approval_status || 'pending';
      const accountStatus = staffProfile?.account_status || user.account_status || 'active';

      // Check #2: Administrator Approval Status
      if (approvalStatus === 'pending') {
        res.status(403).json({
          error: 'Your staff account is awaiting administrator approval.',
          code: 'STAFF_PENDING',
          approvalStatus: 'pending'
        });
        return;
      }

      if (approvalStatus === 'rejected') {
        res.status(403).json({
          error: 'Your staff registration was not approved.',
          code: 'STAFF_REJECTED',
          approvalStatus: 'rejected',
          reason: staffProfile?.rejection_reason
        });
        return;
      }

      // Check #3: Canonical Account Status
      if (accountStatus === 'suspended') {
        res.status(403).json({
          error: 'Your staff account is currently suspended. Please contact the administrator.',
          code: 'STAFF_SUSPENDED',
          accountStatus: 'suspended'
        });
        return;
      }

      if (accountStatus === 'banned') {
        res.status(403).json({
          error: 'Your staff account has been disabled by the administrator.',
          code: 'STAFF_BANNED',
          accountStatus: 'banned'
        });
        return;
      }

      if (accountStatus === 'deleted') {
        res.status(403).json({
          error: 'Your staff account has been permanently disabled.',
          code: 'STAFF_DELETED',
          accountStatus: 'deleted'
        });
        return;
      }

      // Only allow login if approved and active
      if (approvalStatus !== 'approved' || accountStatus !== 'active') {
        res.status(403).json({
          error: 'Your staff account is not authorized to sign in.',
          code: 'STAFF_UNAUTHORIZED'
        });
        return;
      }

      UserRepository.updateLastLogin(user.id);
      const token = signToken(user.id, user.session_version || 1);

      res.json({
        message: 'Login authenticated.',
        token,
        approvalStatus: 'approved',
        accountStatus: 'active',
        user: {
          id: user.id,
          role: user.role,
          email: user.email,
          status: user.status,
          account_status: 'active',
          email_verified: true,
          staffProfile
        }
      });
    } catch (err: any) {
      console.error('[Login Staff Error]', err);
      res.status(500).json({ error: 'Internal server error during staff login.' });
    }
  }

  // Admin login (Admin Username + Password, NO public registration)
  static async loginAdmin(req: Request, res: Response): Promise<void> {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        res.status(400).json({ error: 'Admin username and password are required.' });
        return;
      }

      const user = UserRepository.findByUsername(username);
      if (!user || user.role !== 'admin') {
        res.status(401).json({ error: 'Invalid administrator credentials.' });
        return;
      }

      const match = await bcrypt.compare(password, user.password_hash);
      if (!match) {
        res.status(401).json({ error: 'Invalid administrator credentials.' });
        return;
      }

      UserRepository.updateLastLogin(user.id);
      const token = signToken(user.id, user.session_version || 1);

      res.json({
        message: 'Administrator login successful.',
        token,
        user: {
          id: user.id,
          role: user.role,
          username: user.username,
          status: user.status
        }
      });
    } catch (err: any) {
      console.error('[Login Admin Error]', err);
      res.status(500).json({ error: 'Internal server error during admin login.' });
    }
  }

  // Forgot password
  static async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      const { email, role } = req.body;

      if (!email) {
        res.status(400).json({ error: 'Email address is required.' });
        return;
      }

      if (role === 'admin') {
        res.status(400).json({ error: 'Self-service password reset is disabled for administration. Contact institutional security.' });
        return;
      }

      const user = UserRepository.findByEmail(email);
      if (!user || user.role !== role) {
        // Return generic success to prevent email enumeration
        res.json({
          message: 'If an eligible account is registered with this email, password reset instructions have been generated.'
        });
        return;
      }

      const resetToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 3600000).toISOString(); // 1 hour

      UserRepository.saveResetToken(crypto.randomUUID(), user.id, resetToken, expiresAt);

      // Notification
      NotificationRepository.create({
        id: crypto.randomUUID(),
        user_id: user.id,
        title: 'Password Reset Requested',
        message: 'A password reset was requested for your account. Use your reset token to set a new password.',
        type: 'system',
        link: `/reset-password?token=${resetToken}`
      });

      res.json({
        message: 'If an eligible account is registered with this email, password reset instructions have been generated.',
        // We include resetToken in development/local response so user can reset immediately in local demo
        devResetToken: resetToken
      });
    } catch (err: any) {
      console.error('[Forgot Password Error]', err);
      res.status(500).json({ error: 'Internal server error.' });
    }
  }

  // Reset password
  static async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        res.status(400).json({ error: 'Token and new password are required.' });
        return;
      }

      if (newPassword.length < 8) {
        res.status(400).json({ error: 'Password must be at least 8 characters long.' });
        return;
      }

      const tokenRecord = UserRepository.findValidResetToken(token);
      if (!tokenRecord) {
        res.status(400).json({ error: 'Invalid or expired password reset token.' });
        return;
      }

      const newHash = await bcrypt.hash(newPassword, 10);
      UserRepository.updatePassword(tokenRecord.user_id, newHash);
      UserRepository.markResetTokenUsed(token);

      NotificationRepository.create({
        id: crypto.randomUUID(),
        user_id: tokenRecord.user_id,
        title: 'Password Changed Successfully',
        message: 'Your account password has been updated. If you did not initiate this change, contact security immediately.',
        type: 'system',
        link: null
      });

      res.json({ message: 'Password has been successfully updated. You may now log in.' });
    } catch (err: any) {
      console.error('[Reset Password Error]', err);
      res.status(500).json({ error: 'Internal server error.' });
    }
  }

  // Get current user session
  static async getMe(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Not authenticated.' });
        return;
      }

      const user = UserRepository.findById(req.user.id);
      if (!user) {
        res.status(404).json({ error: 'User not found.' });
        return;
      }

      let profileData: any = null;
      let approvalStatus: string | null = null;
      let accountStatus: string = user.account_status || 'active';

      if (user.role === 'student') {
        profileData = UserRepository.getProfileByUserId(user.id);
      } else if (user.role === 'staff') {
        const staff = StaffRepository.findByUserId(user.id);
        profileData = staff;
        approvalStatus = staff?.approval_status || 'pending';
        accountStatus = staff?.account_status || user.account_status || 'active';
      }

      res.json({
        user: {
          id: user.id,
          role: user.role,
          email: user.email,
          username: user.username,
          status: user.status,
          account_status: accountStatus,
          email_verified: Boolean(user.email_verified),
          last_login_at: user.last_login_at,
          approvalStatus,
          profile: profileData
        }
      });
    } catch (err: any) {
      console.error('[GetMe Error]', err);
      res.status(500).json({ error: 'Internal server error.' });
    }
  }
}
