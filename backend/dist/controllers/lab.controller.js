"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLabReservations = exports.updateLabReservation = exports.createLabReservation = exports.getLabAvailability = void 0;
const database_1 = __importDefault(require("../config/database"));
const utils_1 = require("../utils");
exports.getLabAvailability = (0, utils_1.asyncHandler)(async (req, res) => {
    const { date } = req.query;
    const reservations = await database_1.default.query('SELECT time_slot_id FROM lab_reservations WHERE date = $1 AND status = $2', [date, 'Approved']);
    res.json(reservations.rows);
});
exports.createLabReservation = (0, utils_1.asyncHandler)(async (req, res) => {
    const { date, timeSlotId, purpose } = req.body;
    const userId = req.user.userId;
    const client = await database_1.default.connect();
    try {
        await client.query('BEGIN');
        // Check if time slot is available
        const conflictingReservations = await client.query('SELECT * FROM lab_reservations WHERE date = $1 AND time_slot_id = $2 AND status = $3', [date, timeSlotId, 'Approved']);
        if (conflictingReservations.rows.length > 0) {
            throw new utils_1.ApiError(400, 'Time slot not available');
        }
        // Create reservation
        const reservationResult = await client.query('INSERT INTO lab_reservations (user_id, date, time_slot_id, purpose) VALUES ($1, $2, $3, $4) RETURNING *', [userId, date, timeSlotId, purpose]);
        await client.query('COMMIT');
        res.status(201).json(reservationResult.rows[0]);
    }
    catch (error) {
        await client.query('ROLLBACK');
        throw error;
    }
    finally {
        client.release();
    }
});
exports.updateLabReservation = (0, utils_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { status, adminNotes } = req.body;
    const result = await database_1.default.query('UPDATE lab_reservations SET status = $1, admin_notes = $2 WHERE id = $3 RETURNING *', [status, adminNotes, id]);
    if (result.rows.length === 0) {
        throw new utils_1.ApiError(404, 'Reservation not found');
    }
    res.json(result.rows[0]);
});
exports.getLabReservations = (0, utils_1.asyncHandler)(async (req, res) => {
    const { startDate, endDate } = req.query;
    const result = await database_1.default.query('SELECT lr.*, u.name as user_name FROM lab_reservations lr JOIN users u ON lr.user_id = u.id WHERE date BETWEEN $1 AND $2 ORDER BY date, time_slot_id', [startDate, endDate]);
    res.json(result.rows);
});
