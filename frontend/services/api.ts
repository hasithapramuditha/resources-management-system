import { User, InventoryItem, PrinterReservation, LabReservation } from '../types';

const API_BASE_URL = 'http://localhost:5000/api';

// Helper function to handle API responses
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Something went wrong');
  }
  return response.json();
};

// Auth API calls
export const login = async (email: string, password: string): Promise<{ token: string }> => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return handleResponse(response);
};

export const register = async (userData: Partial<User>): Promise<{ token: string }> => {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });
  return handleResponse(response);
};

// Inventory API calls
export const getInventoryItems = async (): Promise<InventoryItem[]> => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}/inventory`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  return handleResponse(response);
};

export const borrowItem = async (itemId: string, quantity: number, expectedReturnDate: string) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}/inventory/borrow`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ itemId, quantity, expectedReturnDate }),
  });
  return handleResponse(response);
};

export const returnItem = async (lendingId: string) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}/inventory/return/${lendingId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  return handleResponse(response);
};

// Printer API calls
export const getPrinters = async () => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}/printers`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  return handleResponse(response);
};

export const getPrinterAvailability = async (printerId: string, date: string) => {
  const token = localStorage.getItem('token');
  const response = await fetch(
    `${API_BASE_URL}/printers/availability?printerId=${printerId}&date=${date}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );
  return handleResponse(response);
};

export const createPrinterReservation = async (reservationData: Partial<PrinterReservation>) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}/printers/reserve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(reservationData),
  });
  return handleResponse(response);
};

// Lab API calls
export const getLabAvailability = async (date: string) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}/lab/availability?date=${date}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  return handleResponse(response);
};

export const createLabReservation = async (reservationData: Partial<LabReservation>) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}/lab/reserve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(reservationData),
  });
  return handleResponse(response);
};
