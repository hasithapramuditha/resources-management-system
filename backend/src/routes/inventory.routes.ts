import { Router } from 'express';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { UserRole } from '../types';
import { asyncHandler } from '../utils';
import {
  getInventoryItems,
  addInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  borrowItem,
  returnItem
} from '../controllers/inventory.controller';

const router = Router();

router.get('/', authenticateToken, asyncHandler(getInventoryItems));
router.post('/', authenticateToken, authorizeRoles(UserRole.ADMIN), asyncHandler(addInventoryItem));
router.put('/:id', authenticateToken, authorizeRoles(UserRole.ADMIN), asyncHandler(updateInventoryItem));
router.delete('/:id', authenticateToken, authorizeRoles(UserRole.ADMIN), asyncHandler(deleteInventoryItem));
router.post('/borrow', authenticateToken, asyncHandler(borrowItem));
router.post('/return/:lendingId', authenticateToken, asyncHandler(returnItem));

export default router;
