import { Router } from 'express';
import { DepartmentRepository } from '../repositories/DepartmentRepository.js';

const router = Router();

// Public / Authenticated listing of active university departments
router.get('/', (req, res) => {
  try {
    const departments = DepartmentRepository.listActive();
    res.json({ departments });
  } catch (err: any) {
    console.error('[Get Active Departments Error]', err);
    res.status(500).json({ error: 'Failed to retrieve academic departments.' });
  }
});

export default router;
