
export enum UserRole {
  STUDENT = 'Student',
  LECTURER = 'Lecturer',
  ADMIN = 'Admin',
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  passwordHash: string; // In a real app, never store plain passwords
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

export type AnyUser = Student | Lecturer | Admin;

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  available: number;
}

export enum PrinterName {
  PRINTER_1 = 'Alpha Mark I',
  PRINTER_2 = 'Beta Mark II',
  PRINTER_3 = 'Gamma Mark III',
}

export interface Printer {
  id: string;
  name: PrinterName;
  status: 'Available' | 'In Use' | 'Maintenance';
  filamentAvailableGrams: number; // Lab filament
}

export interface TimeSlot {
  id: string; // e.g., "08:00-08:30" or "08:00-09:00" for lab
  startTime: string; // e.g., "08:00"
  endTime: string; // e.g., "08:30" or "09:00"
}

export enum ReservationStatus {
  PENDING = 'Pending',
  APPROVED = 'Approved',
  REJECTED = 'Rejected',
  COMPLETED = 'Completed', // Could be used for post-usage tracking
  CANCELLED = 'Cancelled',
}

export interface PrinterReservation {
  id: string;
  userId: string;
  userName: string; // For display
  printerId: string;
  printerName: PrinterName;
  date: string; // YYYY-MM-DD
  timeSlotId: string; 
  requestedTimeSlots: number; // number of 30-min slots
  filamentNeededGrams: number;
  usesOwnFilament: boolean;
  status: ReservationStatus;
  requestTimestamp: number;
}

export enum ReservationPurpose {
    MEETING = "Meeting",
    PROJECT_WORK = "Project Work",
    STUDY_SESSION = "Study Session",
    LAB_SESSION = "Lab Session",
    OTHER = "Other"
}

export interface LabReservation {
    id: string;
    userId: string; // Lecturer ID
    userName: string; // Lecturer Name
    date: string; // YYYY-MM-DD
    timeSlotId: string; // Refers to a 1-hour TimeSlot id
    purpose: ReservationPurpose | string; // Allow 'Other' as string
    status: ReservationStatus;
    requestTimestamp: number;
    adminNotes?: string; // Optional notes from admin on approval/rejection
}

export enum LendingStatus {
  BORROWED = 'Borrowed',
  RETURNED = 'Returned',
}

export interface LendingRecord {
  id: string;
  userId: string;
  userName: string;
  itemId: string;
  itemName: string;
  quantityBorrowed: number;
  borrowDate: string; // ISO Date string
  expectedReturnDate: string; // ISO Date string
  actualReturnDate?: string; // ISO Date string
  status: LendingStatus;
}

// Context types
export interface AppContextType {
  currentUser: AnyUser | null;
  users: AnyUser[];
  inventory: InventoryItem[];
  printers: Printer[];
  printerReservations: PrinterReservation[]; // Renamed for clarity
  lendingRecords: LendingRecord[];
  labReservations: LabReservation[];
  lecturers: Lecturer[];
  login: (identifier: string, password: string, role: UserRole) => boolean;
  logout: () => void;
  registerStudent: (studentData: Omit<Student, 'id' | 'role' | 'passwordHash'> & {password: string}) => Student | null;
  addLecturerByAdmin: (lecturerData: Omit<Lecturer, 'id' | 'role' | 'passwordHash'> & {password: string}) => Lecturer | null;
  removeUser: (userId: string) => void;
  addInventoryItem: (itemData: Omit<InventoryItem, 'id' | 'available'>) => InventoryItem | null;
  removeInventoryItem: (itemId: string) => boolean; // Returns true if successful
  updateInventoryItemQuantity: (itemId: string, change: number) => void; 
  borrowItem: (userId: string, userName: string, itemId: string, quantity: number, expectedReturnDate: string) => LendingRecord | null;
  returnItem: (lendingRecordId: string) => void;
  requestPrinterReservation: (reservationData: Omit<PrinterReservation, 'id' | 'status' | 'requestTimestamp' | 'userName' | 'printerName'>) => PrinterReservation | null;
  updatePrinterReservationStatus: (reservationId: string, status: ReservationStatus) => void; // Renamed for clarity
  cancelPrinterReservation: (reservationId: string) => void;
  getAvailablePrinterTimeSlots: (date: string, printerId: string) => TimeSlot[]; // Renamed for clarity
  
  requestLabReservation: (reservationData: Omit<LabReservation, 'id' | 'status' | 'requestTimestamp' | 'userName' >) => LabReservation | null;
  updateLabReservationStatus: (reservationId: string, newStatus: ReservationStatus, adminNotes?: string) => void;
  cancelLabReservation: (reservationId: string) => void;
  getLabTimeSlots: (date: string) => TimeSlot[]; // Gets available 1-hour slots for general lab booking
}
