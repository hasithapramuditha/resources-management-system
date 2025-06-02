import { Request, Response } from 'express';
import pool from '../config/database';
import { hashPassword, comparePasswords, generateToken, asyncHandler, ApiError } from '../utils';
import { UserRole } from '../types';

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password, role, studentId, course } = req.body;

  // Check if user already exists
  const userExists = await pool.query(
    'SELECT * FROM users WHERE email = $1',
    [email]
  );

  if (userExists.rows.length > 0) {
    throw new ApiError(400, 'User already exists');
  }

  const passwordHash = await hashPassword(password);

  // Start transaction
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Insert into users table
    const userResult = await client.query(
      'INSERT INTO users (name, email, role, password_hash) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, email, role, passwordHash]
    );

    const user = userResult.rows[0];

    // If student, insert additional info
    if (role === UserRole.STUDENT) {
      await client.query(
        'INSERT INTO students (id, student_id, course) VALUES ($1, $2, $3)',
        [user.id, studentId, course]
      );
    } else if (role === UserRole.LECTURER) {
      await client.query(
        'INSERT INTO lecturers (id) VALUES ($1)',
        [user.id]
      );
    }

    await client.query('COMMIT');

    const token = generateToken(user);
    res.status(201).json({ token });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const result = await pool.query(
    'SELECT * FROM users WHERE email = $1',
    [email]
  );

  if (result.rows.length === 0) {
    throw new ApiError(401, 'Invalid credentials');
  }

  const user = result.rows[0];
  const isPasswordValid = await comparePasswords(password, user.password_hash);

  if (!isPasswordValid) {
    throw new ApiError(401, 'Invalid credentials');
  }

  const token = generateToken(user);
  res.json({ token });
});
