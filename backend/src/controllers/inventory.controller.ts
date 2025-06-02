import { Request, Response, NextFunction } from 'express';
import pool from '../config/database';
import { ApiError, asyncHandler } from '../utils';
import { AsyncController } from '../types/express';

export const getInventoryItems: AsyncController = asyncHandler(async (req, res) => {
  const result = await pool.query('SELECT * FROM inventory_items ORDER BY created_at DESC');
  res.json(result.rows);
});

export const addInventoryItem: AsyncController = async (req, res) => {
  const { name, quantity } = req.body;

  const result = await pool.query(
    'INSERT INTO inventory_items (name, quantity, available) VALUES ($1, $2, $3) RETURNING *',
    [name, quantity, quantity]
  );

  res.status(201).json(result.rows[0]);
};

export const updateInventoryItem = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, quantity } = req.body;

  const result = await pool.query(
    'UPDATE inventory_items SET name = $1, quantity = $2, available = LEAST($2, available) WHERE id = $3 RETURNING *',
    [name, quantity, id]
  );

  if (result.rows.length === 0) {
    throw new ApiError(404, 'Item not found');
  }

  res.json(result.rows[0]);
});

export const deleteInventoryItem = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await pool.query(
    'DELETE FROM inventory_items WHERE id = $1 RETURNING *',
    [id]
  );

  if (result.rows.length === 0) {
    throw new ApiError(404, 'Item not found');
  }

  res.json({ message: 'Item deleted successfully' });
});

export const borrowItem = asyncHandler(async (req: Request, res: Response) => {
  const { itemId, quantity, expectedReturnDate } = req.body;
  const userId = req.user!.userId;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check if item exists and has enough quantity
    const itemResult = await client.query(
      'SELECT * FROM inventory_items WHERE id = $1',
      [itemId]
    );

    if (itemResult.rows.length === 0) {
      throw new ApiError(404, 'Item not found');
    }

    const item = itemResult.rows[0];
    if (item.available < quantity) {
      throw new ApiError(400, 'Not enough items available');
    }

    // Update available quantity
    await client.query(
      'UPDATE inventory_items SET available = available - $1 WHERE id = $2',
      [quantity, itemId]
    );

    // Create lending record
    const lendingResult = await client.query(
      'INSERT INTO lending_records (item_id, user_id, quantity, expected_return_date, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [itemId, userId, quantity, expectedReturnDate, 'Borrowed']
    );

    await client.query('COMMIT');
    res.status(201).json(lendingResult.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
});

export const returnItem = asyncHandler(async (req: Request, res: Response) => {
  const { lendingId } = req.params;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Get lending record
    const lendingResult = await client.query(
      'SELECT * FROM lending_records WHERE id = $1',
      [lendingId]
    );

    if (lendingResult.rows.length === 0) {
      throw new ApiError(404, 'Lending record not found');
    }

    const lending = lendingResult.rows[0];
    if (lending.status === 'Returned') {
      throw new ApiError(400, 'Item already returned');
    }

    // Update lending record
    await client.query(
      'UPDATE lending_records SET status = $1, actual_return_date = CURRENT_TIMESTAMP WHERE id = $2',
      ['Returned', lendingId]
    );

    // Update available quantity
    await client.query(
      'UPDATE inventory_items SET available = available + $1 WHERE id = $2',
      [lending.quantity, lending.item_id]
    );

    await client.query('COMMIT');
    res.json({ message: 'Item returned successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
});
