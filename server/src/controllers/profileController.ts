import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { UserRepository } from '../repositories/UserRepository.js';
import { StaffRepository } from '../repositories/StaffRepository.js';

export class ProfileController {
  static async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required.' });
        return;
      }

      if (req.user.role === 'student') {
        const { fullName, studentId, department, academicYear, phone, bio } = req.body;
        const updated = UserRepository.updateProfile(req.user.id, {
          full_name: fullName,
          student_id: studentId,
          department,
          academic_year: academicYear,
          phone,
          bio
        });
        res.json({ message: 'Profile updated successfully.', profile: updated });
      } else if (req.user.role === 'staff') {
        const { fullName, department, designation, phone, officeLocation } = req.body;
        const updated = StaffRepository.updateProfile(req.user.id, {
          full_name: fullName,
          department,
          designation,
          phone,
          office_location: officeLocation
        });
        res.json({ message: 'Staff profile updated successfully.', profile: updated });
      } else {
        res.json({ message: 'Administrator settings saved.' });
      }
    } catch (err: any) {
      console.error('[Update Profile Error]', err);
      res.status(500).json({ error: 'Failed to update profile.' });
    }
  }

  static async changePassword(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required.' });
        return;
      }

      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        res.status(400).json({ error: 'Current password and new password are required.' });
        return;
      }

      if (newPassword.length < 8) {
        res.status(400).json({ error: 'New password must be at least 8 characters long.' });
        return;
      }

      const user = UserRepository.findById(req.user.id);
      if (!user) {
        res.status(404).json({ error: 'User account not found.' });
        return;
      }

      const match = await bcrypt.compare(currentPassword, user.password_hash);
      if (!match) {
        res.status(400).json({ error: 'Incorrect current password.' });
        return;
      }

      const newHash = await bcrypt.hash(newPassword, 10);
      UserRepository.updatePassword(user.id, newHash);

      res.json({ message: 'Password updated successfully.' });
    } catch (err: any) {
      console.error('[Change Password Error]', err);
      res.status(500).json({ error: 'Failed to update password.' });
    }
  }
}
