import { Router } from 'express';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { UserRole } from '../types';
import {
  getLabAvailability,
  createLabReservation,
  updateLabReservation,
  getLabReservations
} from '../controllers/lab.controller';

const router = Router();

router.get('/availability', authenticateToken, getLabAvailability);
router.get('/reservations', authenticateToken, getLabReservations);
router.post('/reserve', authenticateToken, authorizeRoles(UserRole.LECTURER), createLabReservation);
router.put('/reservations/:id', authenticateToken, authorizeRoles(UserRole.ADMIN), updateLabReservation);

export default router;
