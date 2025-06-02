export enum UserRole {
  STUDENT = 'Student',
  LECTURER = 'Lecturer',
  ADMIN = 'Admin',
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  passwordHash: string;
  createdAt: Date;
}

export interface Student extends User {
  role: UserRole.STUDENT;
  studentId: string;
  course: string;
}

export interface Lecturer extends User {
  role: UserRole.LECTURER;
}

export interface Admin extends User {
  role: UserRole.ADMIN;
}

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  available: number;
  createdAt: Date;
}

export interface LendingRecord {
  id: string;
  itemId: string;
  userId: string;
  quantity: number;
  borrowDate: Date;
  expectedReturnDate: Date;
  actualReturnDate?: Date;
  status: 'Borrowed' | 'Returned' | 'Overdue';
}

export interface Printer {
  id: string;
  name: string;
  status: 'Available' | 'In Use' | 'Maintenance';
  filamentAvailable: number;
  createdAt: Date;
}

export interface PrinterReservation {
  id: string;
  userId: string;
  printerId: string;
  date: Date;
  timeSlotId: string;
  requestedSlots: number;
  filamentNeeded: number;
  usesOwnFilament: boolean;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Completed' | 'Cancelled';
  requestTimestamp: Date;
}

export interface LabReservation {
  id: string;
  userId: string;
  date: Date;
  timeSlotId: string;
  purpose: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Completed' | 'Cancelled';
  adminNotes?: string;
  requestTimestamp: Date;
}
