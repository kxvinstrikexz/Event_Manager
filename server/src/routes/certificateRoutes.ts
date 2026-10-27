import { Router } from 'express';
import { CertificateController } from '../controllers/certificateController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/my', requireAuth, requireRole('student'), CertificateController.getMyCertificates);
router.get('/verify/:certNumber', CertificateController.verifyCertificateNumber);
router.post('/issue', requireAuth, requireRole('staff', 'admin'), CertificateController.issueCertificate);
router.post('/bulk-issue/:eventId', requireAuth, requireRole('staff', 'admin'), CertificateController.bulkIssueForEvent);
router.get('/event/:eventId', requireAuth, requireRole('staff', 'admin'), CertificateController.getEventCertificates);
router.get('/all', requireAuth, requireRole('admin'), CertificateController.getAllCertificates);

export default router;
