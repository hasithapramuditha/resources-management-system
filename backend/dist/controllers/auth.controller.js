"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = exports.register = void 0;
const database_1 = __importDefault(require("../config/database"));
const utils_1 = require("../utils");
const types_1 = require("../types");
exports.register = (0, utils_1.asyncHandler)(async (req, res) => {
    const { name, email, password, role, studentId, course } = req.body;
    // Check if user already exists
    const userExists = await database_1.default.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userExists.rows.length > 0) {
        throw new utils_1.ApiError(400, 'User already exists');
    }
    const passwordHash = await (0, utils_1.hashPassword)(password);
    // Start transaction
    const client = await database_1.default.connect();
    try {
        await client.query('BEGIN');
        // Insert into users table
        const userResult = await client.query('INSERT INTO users (name, email, role, password_hash) VALUES ($1, $2, $3, $4) RETURNING *', [name, email, role, passwordHash]);
        const user = userResult.rows[0];
        // If student, insert additional info
        if (role === types_1.UserRole.STUDENT) {
            await client.query('INSERT INTO students (id, student_id, course) VALUES ($1, $2, $3)', [user.id, studentId, course]);
        }
        else if (role === types_1.UserRole.LECTURER) {
            await client.query('INSERT INTO lecturers (id) VALUES ($1)', [user.id]);
        }
        await client.query('COMMIT');
        const token = (0, utils_1.generateToken)(user);
        res.status(201).json({ token });
    }
    catch (error) {
        await client.query('ROLLBACK');
        throw error;
    }
    finally {
        client.release();
    }
});
exports.login = (0, utils_1.asyncHandler)(async (req, res) => {
    const { email, password } = req.body;
    const result = await database_1.default.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
        throw new utils_1.ApiError(401, 'Invalid credentials');
    }
    const user = result.rows[0];
    const isPasswordValid = await (0, utils_1.comparePasswords)(password, user.password_hash);
    if (!isPasswordValid) {
        throw new utils_1.ApiError(401, 'Invalid credentials');
    }
    const token = (0, utils_1.generateToken)(user);
    res.json({ token });
});
