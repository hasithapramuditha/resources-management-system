import { Router } from 'express';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { UserRole } from '../types';
import {
  getPrinters,
  getPrinterAvailability,
  createPrinterReservation,
  updatePrinterReservation
} from '../controllers/printer.controller';

const router = Router();

router.get('/', authenticateToken, getPrinters);
router.get('/availability', authenticateToken, getPrinterAvailability);
router.post('/reserve', authenticateToken, createPrinterReservation);
router.put('/reservations/:id', authenticateToken, authorizeRoles(UserRole.ADMIN), updatePrinterReservation);

export default router;
