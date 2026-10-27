import { Request, Response } from 'express';
import { DepartmentRepository } from '../repositories/DepartmentRepository.js';
import { StaffRepository } from '../repositories/StaffRepository.js';
import { DepartmentTransferRepository } from '../repositories/DepartmentTransferRepository.js';
import { AuditLogRepository } from '../repositories/AuditLogRepository.js';

export class AdminDepartmentController {
  // List all departments with staff statistics
  static async listDepartments(req: Request, res: Response): Promise<void> {
    try {
      if (req.user?.role !== 'admin') {
        res.status(403).json({ error: 'Administrative privileges required.' });
        return;
      }

      const departments = DepartmentRepository.listAll(true);
      res.json({ departments });
    } catch (err: any) {
      console.error('[List Departments Error]', err);
      res.status(500).json({ error: 'Failed to retrieve academic departments.' });
    }
  }

  // Create a new academic department
  static async createDepartment(req: Request, res: Response): Promise<void> {
    try {
      if (req.user?.role !== 'admin') {
        res.status(403).json({ error: 'Administrative privileges required.' });
        return;
      }

      const { code, name, description } = req.body;
      if (!code || !name) {
        res.status(400).json({ error: 'Department code and department name are required.' });
        return;
      }

      const existingCode = DepartmentRepository.findByCode(code);
      if (existingCode) {
        res.status(409).json({ error: `A department with code "${code}" already exists.` });
        return;
      }

      const existingName = DepartmentRepository.findByName(name);
      if (existingName) {
        res.status(409).json({ error: `A department named "${name}" already exists.` });
        return;
      }

      const department = DepartmentRepository.create({
        code: code.trim(),
        name: name.trim(),
        description: description?.trim()
      });

      AuditLogRepository.create({
        admin_id: req.user.id,
        target_user_id: department.id,
        target_staff_id: department.code,
        target_name: department.name,
        action: 'CREATE_DEPARTMENT',
        previous_status: null,
        new_status: 'active',
        reason: 'Department created in university directory.',
        metadata: { department }
      });

      res.status(201).json({
        message: `Department "${department.name}" (${department.code}) created successfully.`,
        department
      });
    } catch (err: any) {
      console.error('[Create Department Error]', err);
      res.status(500).json({ error: 'Failed to create academic department.' });
    }
  }

  // Update existing academic department
  static async updateDepartment(req: Request, res: Response): Promise<void> {
    try {
      if (req.user?.role !== 'admin') {
        res.status(403).json({ error: 'Administrative privileges required.' });
        return;
      }

      const { id } = req.params;
      const { code, name, description, is_active } = req.body;

      const current = DepartmentRepository.findById(id);
      if (!current) {
        res.status(404).json({ error: 'Department not found.' });
        return;
      }

      if (code && code.trim().toLowerCase() !== current.code.toLowerCase()) {
        const existing = DepartmentRepository.findByCode(code);
        if (existing && existing.id !== id) {
          res.status(409).json({ error: `Department code "${code}" is already in use.` });
          return;
        }
      }

      if (name && name.trim().toLowerCase() !== current.name.toLowerCase()) {
        const existing = DepartmentRepository.findByName(name);
        if (existing && existing.id !== id) {
          res.status(409).json({ error: `Department name "${name}" is already in use.` });
          return;
        }
      }

      const updated = DepartmentRepository.update(id, {
        code,
        name,
        description,
        is_active: typeof is_active === 'boolean' ? (is_active ? 1 : 0) : is_active
      });

      AuditLogRepository.create({
        admin_id: req.user.id,
        target_user_id: updated.id,
        target_staff_id: updated.code,
        target_name: updated.name,
        action: 'UPDATE_DEPARTMENT',
        previous_status: current.name,
        new_status: updated.name,
        reason: 'Department details updated by administrator.',
        metadata: { previous: current, updated }
      });

      res.json({
        message: `Department "${updated.name}" updated successfully.`,
        department: updated
      });
    } catch (err: any) {
      console.error('[Update Department Error]', err);
      res.status(500).json({ error: 'Failed to update academic department.' });
    }
  }

  // Get department-wise staff listing with filters and pagination
  static async getDepartmentStaff(req: Request, res: Response): Promise<void> {
    try {
      if (req.user?.role !== 'admin') {
        res.status(403).json({ error: 'Administrative privileges required.' });
        return;
      }

      const { id } = req.params;
      const { search, approval_status, account_status, status, page = '1', limit = '20' } = req.query;

      const department = DepartmentRepository.findById(id);
      if (!department) {
        res.status(404).json({ error: 'Department not found.' });
        return;
      }

      const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
      const limitNum = Math.max(1, Math.min(100, parseInt(limit as string, 10) || 20));
      const offset = (pageNum - 1) * limitNum;

      const filters = {
        departmentId: department.id,
        search: (search as string)?.trim() || undefined,
        approvalStatus: (approval_status as string) || undefined,
        accountStatus: (account_status as string) || undefined,
        status: (status as string) || undefined,
        limit: limitNum,
        offset
      };

      const staff = StaffRepository.listAll(filters);
      const total = StaffRepository.countAll({
        departmentId: department.id,
        search: filters.search,
        approvalStatus: filters.approvalStatus,
        accountStatus: filters.accountStatus,
        status: filters.status
      });

      res.json({
        department,
        staff,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum) || 1
        }
      });
    } catch (err: any) {
      console.error('[Get Department Staff Error]', err);
      res.status(500).json({ error: 'Failed to retrieve department staff list.' });
    }
  }

  // Admin Department Transfer
  static async transferStaffDepartment(req: Request, res: Response): Promise<void> {
    try {
      if (req.user?.role !== 'admin') {
        res.status(403).json({ error: 'Administrative privileges required.' });
        return;
      }

      const { userId } = req.params;
      const { destinationDepartmentId, reason } = req.body;

      if (!destinationDepartmentId) {
        res.status(400).json({ error: 'Destination department must be specified.' });
        return;
      }

      if (!reason || reason.trim().length === 0) {
        res.status(400).json({ error: 'A transfer reason is required.' });
        return;
      }

      const staff = StaffRepository.findByUserId(userId);
      if (!staff) {
        res.status(404).json({ error: 'Staff account not found.' });
        return;
      }

      const destDept = DepartmentRepository.findByNameOrCodeOrId(destinationDepartmentId);
      if (!destDept) {
        res.status(400).json({ error: 'Destination department does not exist in the university directory.' });
        return;
      }

      if (!destDept.is_active) {
        res.status(400).json({ error: 'Destination department is currently inactive.' });
        return;
      }

      if (staff.department_id === destDept.id || staff.department.toLowerCase() === destDept.name.toLowerCase()) {
        res.status(400).json({ error: `Staff member is already assigned to ${destDept.name}.` });
        return;
      }

      const result = StaffRepository.transferDepartment(
        userId,
        destDept.id,
        destDept.name,
        reason.trim(),
        req.user.id
      );

      res.json({
        success: true,
        message: `Staff member ${result.staff.full_name} (${result.staff.staff_id}) successfully transferred from ${result.previousDepartment} to ${result.newDepartment}.`,
        staff: result.staff,
        previousDepartment: result.previousDepartment,
        newDepartment: result.newDepartment
      });
    } catch (err: any) {
      console.error('[Transfer Department Error]', err);
      res.status(500).json({ error: err.message || 'Failed to transfer staff member to destination department.' });
    }
  }

  // Get Department Transfer History for a specific staff member
  static async getStaffTransferHistory(req: Request, res: Response): Promise<void> {
    try {
      if (req.user?.role !== 'admin') {
        res.status(403).json({ error: 'Administrative privileges required.' });
        return;
      }

      const { userId } = req.params;
      const staff = StaffRepository.findByUserId(userId);
      if (!staff) {
        res.status(404).json({ error: 'Staff account not found.' });
        return;
      }

      const history = DepartmentTransferRepository.listByUserId(userId);
      res.json({
        staff: {
          id: staff.id,
          user_id: staff.user_id,
          full_name: staff.full_name,
          staff_id: staff.staff_id,
          department: staff.department,
          department_id: staff.department_id
        },
        transferHistory: history
      });
    } catch (err: any) {
      console.error('[Get Transfer History Error]', err);
      res.status(500).json({ error: 'Failed to retrieve department transfer history.' });
    }
  }
}
