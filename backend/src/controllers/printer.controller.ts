import { Request, Response } from 'express';
import pool from '../config/database';
import { asyncHandler, ApiError } from '../utils';

export const getPrinters = asyncHandler(async (req: Request, res: Response) => {
  const result = await pool.query('SELECT * FROM printers ORDER BY created_at DESC');
  res.json(result.rows);
});

export const getPrinterAvailability = asyncHandler(async (req: Request, res: Response) => {
  const { date, printerId } = req.query;

  const reservations = await pool.query(
    'SELECT time_slot_id, requested_slots FROM printer_reservations WHERE printer_id = $1 AND date = $2 AND status = $3',
    [printerId, date, 'Approved']
  );

  // Return the reservations so frontend can calculate available slots
  res.json(reservations.rows);
});

export const createPrinterReservation = asyncHandler(async (req: Request, res: Response) => {
  const {
    printerId,
    date,
    timeSlotId,
    requestedSlots,
    filamentNeeded,
    usesOwnFilament
  } = req.body;
  const userId = req.user!.userId;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check if printer exists and has enough filament
    const printerResult = await pool.query(
      'SELECT * FROM printers WHERE id = $1',
      [printerId]
    );

    if (printerResult.rows.length === 0) {
      throw new ApiError(404, 'Printer not found');
    }

    const printer = printerResult.rows[0];
    if (!usesOwnFilament && printer.filament_available < filamentNeeded) {
      throw new ApiError(400, 'Not enough filament available');
    }

    // Check if time slot is available
    const conflictingReservations = await client.query(
      'SELECT * FROM printer_reservations WHERE printer_id = $1 AND date = $2 AND time_slot_id = $3 AND status = $4',
      [printerId, date, timeSlotId, 'Approved']
    );

    if (conflictingReservations.rows.length > 0) {
      throw new ApiError(400, 'Time slot not available');
    }

    // Create reservation
    const reservationResult = await client.query(
      'INSERT INTO printer_reservations (user_id, printer_id, date, time_slot_id, requested_slots, filament_needed, uses_own_filament) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [userId, printerId, date, timeSlotId, requestedSlots, filamentNeeded, usesOwnFilament]
    );

    // If not using own filament, update printer filament
    if (!usesOwnFilament) {
      await client.query(
        'UPDATE printers SET filament_available = filament_available - $1 WHERE id = $2',
        [filamentNeeded, printerId]
      );
    }

    await client.query('COMMIT');
    res.status(201).json(reservationResult.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
});

export const updatePrinterReservation = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  const result = await pool.query(
    'UPDATE printer_reservations SET status = $1 WHERE id = $2 RETURNING *',
    [status, id]
  );

  if (result.rows.length === 0) {
    throw new ApiError(404, 'Reservation not found');
  }

  res.json(result.rows[0]);
});
