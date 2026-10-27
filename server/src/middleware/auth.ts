import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { UserRepository } from '../repositories/UserRepository.js';
import { StaffRepository } from '../repositories/StaffRepository.js';

export interface AuthenticatedUser {
  id: string;
  role: 'student' | 'staff' | 'admin';
  email: string | null;
  username: string | null;
  status: 'active' | 'pending' | 'approved' | 'rejected' | 'suspended';
  account_status: 'active' | 'suspended' | 'banned' | 'deleted';
  session_version: number;
  email_verified: boolean;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  // Prevent browser and proxy caching of sensitive authenticated responses
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required. No token provided.' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as { userId: string; sessionVersion?: number };
    const user = UserRepository.findById(decoded.userId);

    if (!user) {
      res.status(401).json({ error: 'User account no longer exists.' });
      return;
    }

    // Invalidate session immediately if session_version changed on backend (suspend / ban / delete)
    if (decoded.sessionVersion !== undefined && user.session_version !== undefined) {
      if (user.session_version !== decoded.sessionVersion) {
        res.status(401).json({
          error: 'Your session has been invalidated by administration. Please sign in again.',
          code: 'SESSION_INVALIDATED'
        });
        return;
      }
    }

    const accountStatus = user.account_status || 'active';

    // Account status enforcement
    if (accountStatus === 'suspended') {
      res.status(403).json({
        error: 'Your staff account is currently suspended. Please contact the administrator.',
        code: 'STAFF_SUSPENDED'
      });
      return;
    }

    if (accountStatus === 'banned') {
      res.status(403).json({
        error: 'Your staff account has been disabled by the administrator.',
        code: 'STAFF_BANNED'
      });
      return;
    }

    if (accountStatus === 'deleted') {
      res.status(403).json({
        error: 'Your staff account has been permanently disabled.',
        code: 'STAFF_DELETED'
      });
      return;
    }

    req.user = {
      id: user.id,
      role: user.role,
      email: user.email,
      username: user.username,
      status: user.status,
      account_status: accountStatus,
      session_version: user.session_version || 1,
      email_verified: Boolean(user.email_verified)
    };

    next();
  } catch (err: any) {
    res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

export function requireRole(...roles: Array<'student' | 'staff' | 'admin'>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: `Access forbidden. Requires role: ${roles.join(' or ')}` });
      return;
    }

    // Strict checks for staff role: email verification, approval status, and account status
    if (req.user.role === 'staff') {
      if (!req.user.email_verified) {
        res.status(403).json({
          error: 'Please verify your institutional email before logging in.',
          code: 'STAFF_EMAIL_UNVERIFIED',
          emailVerified: false
        });
        return;
      }

      const staffProfile = StaffRepository.findByUserId(req.user.id);
      const approvalStatus = staffProfile?.approval_status || 'pending';
      const accountStatus = staffProfile?.account_status || req.user.account_status || 'active';

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

      if (approvalStatus !== 'approved' || accountStatus !== 'active') {
        res.status(403).json({
          error: 'Your staff account is not authorized to access this resource.',
          code: 'STAFF_UNAUTHORIZED'
        });
        return;
      }
    }

    next();
  };
}
