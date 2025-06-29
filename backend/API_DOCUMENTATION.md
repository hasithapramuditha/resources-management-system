# EEC Lab Resources Management System - API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication
All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## Authentication Endpoints

### Login
**POST** `/auth/login`

Authenticate a user and receive a JWT token.

**Request Body:**
```json
{
  "identifier": "Admin User",
  "password": "admin123",
  "role": "Admin"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "Admin User",
    "role": "Admin"
  }
}
```

### Student Registration
**POST** `/auth/register/student`

Register a new student account.

**Request Body:**
```json
{
  "name": "John Doe",
  "studentId": "STU006",
  "course": "Computer Science",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Student registered successfully",
  "user": {
    "id": 6,
    "name": "John Doe",
    "role": "Student",
    "student_id": "STU006",
    "course": "Computer Science"
  }
}
```

### Add Lecturer (Admin Only)
**POST** `/auth/register/lecturer`

Add a new lecturer account (requires admin privileges).

**Request Body:**
```json
{
  "name": "Dr. Jane Smith",
  "password": "password123"
}
```

### Get Profile
**GET** `/auth/profile`

Get current user's profile information.

**Response:**
```json
{
  "user": {
    "id": 1,
    "name": "Admin User",
    "role": "Admin"
  }
}
```

### Change Password
**PUT** `/auth/change-password`

Change user's password.

**Request Body:**
```json
{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword123"
}
```

---

## User Management (Admin Only)

### Get All Users
**GET** `/users`

**Response:**
```json
{
  "users": [
    {
      "id": 1,
      "name": "Admin User",
      "role": "Admin",
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### Get Users by Role
**GET** `/users/role/:role`

**Response:**
```json
{
  "users": [
    {
      "id": 2,
      "name": "Dr. John Smith",
      "role": "Lecturer",
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### Get Lecturers
**GET** `/users/lecturers`

**Response:**
```json
{
  "lecturers": [
    {
      "id": 2,
      "name": "Dr. John Smith",
      "role": "Lecturer"
    }
  ]
}
```

### Remove User
**DELETE** `/users/:userId`

### Update User
**PUT** `/users/:userId`

**Request Body:**
```json
{
  "name": "Updated Name",
  "course": "Updated Course"
}
```

### User Statistics
**GET** `/users/stats/overview`

**Response:**
```json
{
  "stats": {
    "totalUsers": 10,
    "students": 5,
    "lecturers": 3,
    "admins": 1,
    "newUsers30Days": 2
  }
}
```

---

## Inventory Management

### Get All Inventory
**GET** `/inventory`

**Response:**
```json
{
  "inventory": [
    {
      "id": 1,
      "name": "Resistor Kit (1000 pcs)",
      "quantity": 10,
      "available": 10,
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### Get Inventory Item
**GET** `/inventory/:itemId`

### Add Inventory Item (Admin Only)
**POST** `/inventory`

**Request Body:**
```json
{
  "name": "New Item",
  "quantity": 20
}
```

### Update Inventory Item (Admin Only)
**PUT** `/inventory/:itemId`

**Request Body:**
```json
{
  "name": "Updated Item Name",
  "quantity": 25
}
```

### Remove Inventory Item (Admin Only)
**DELETE** `/inventory/:itemId`

### Search Inventory
**GET** `/inventory/search/:query`

### Inventory Statistics (Admin Only)
**GET** `/inventory/stats/overview`

**Response:**
```json
{
  "stats": {
    "totalItems": 10,
    "totalQuantity": 150,
    "totalAvailable": 120,
    "totalBorrowed": 30,
    "outOfStockItems": 2
  }
}
```

---

## Printer Management

### Get All Printers
**GET** `/printers`

**Response:**
```json
{
  "printers": [
    {
      "id": 1,
      "name": "Alpha Mark I",
      "status": "Available",
      "filament_available_grams": 1000,
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### Get Printer
**GET** `/printers/:printerId`

### Update Printer Status (Admin Only)
**PUT** `/printers/:printerId/status`

**Request Body:**
```json
{
  "status": "Maintenance"
}
```

### Update Printer Filament (Admin Only)
**PUT** `/printers/:printerId/filament`

**Request Body:**
```json
{
  "filamentGrams": 1500
}
```

### Get Available Time Slots
**GET** `/printers/:printerId/available-slots/:date`

**Response:**
```json
{
  "printer": {
    "id": 1,
    "name": "Alpha Mark I",
    "status": "Available"
  },
  "availableSlots": [
    {
      "id": "08:00-08:30",
      "startTime": "08:00",
      "endTime": "08:30"
    }
  ]
}
```

### Printer Statistics (Admin Only)
**GET** `/printers/stats/overview`

**Response:**
```json
{
  "stats": {
    "totalPrinters": 3,
    "availablePrinters": 2,
    "inUsePrinters": 1,
    "maintenancePrinters": 0,
    "totalFilamentGrams": 3000
  }
}
```

### Printer Usage History (Admin Only)
**GET** `/printers/:printerId/usage-history`

---

## Printer Reservations

### Get Printer Reservations
**GET** `/reservations/printers`

**Query Parameters:**
- `status` - Filter by status (Pending, Approved, Rejected, Completed, Cancelled)
- `userId` - Filter by user ID

**Response:**
```json
{
  "reservations": [
    {
      "id": 1,
      "user_id": 2,
      "user_name": "Dr. John Smith",
      "printer_id": 1,
      "printer_name": "Alpha Mark I",
      "date": "2024-01-15",
      "time_slot_id": "08:00-08:30",
      "requested_time_slots": 2,
      "filament_needed_grams": 50,
      "uses_own_filament": false,
      "status": "Pending",
      "request_timestamp": 1705123456789,
      "user_role": "Lecturer"
    }
  ]
}
```

### Create Printer Reservation
**POST** `/reservations/printers`

**Request Body:**
```json
{
  "printerId": 1,
  "date": "2024-01-15",
  "timeSlotId": "08:00-08:30",
  "requestedTimeSlots": 2,
  "filamentNeededGrams": 50,
  "usesOwnFilament": false
}
```

### Update Reservation Status (Admin Only)
**PUT** `/reservations/printers/:reservationId/status`

**Request Body:**
```json
{
  "status": "Approved"
}
```

### Cancel Reservation
**PUT** `/reservations/printers/:reservationId/cancel`

---

## Lab Reservations

### Get Lab Reservations
**GET** `/reservations/labs`

**Query Parameters:**
- `status` - Filter by status
- `userId` - Filter by user ID

**Response:**
```json
{
  "reservations": [
    {
      "id": 1,
      "user_id": 2,
      "user_name": "Dr. John Smith",
      "date": "2024-01-15",
      "time_slot_id": "08:00-09:00",
      "purpose": "Lab Session",
      "status": "Pending",
      "request_timestamp": 1705123456789,
      "admin_notes": null,
      "user_role": "Lecturer"
    }
  ]
}
```

### Create Lab Reservation (Lecturers Only)
**POST** `/reservations/labs`

**Request Body:**
```json
{
  "date": "2024-01-15",
  "timeSlotId": "08:00-09:00",
  "purpose": "Lab Session"
}
```

### Update Lab Reservation Status (Admin Only)
**PUT** `/reservations/labs/:reservationId/status`

**Request Body:**
```json
{
  "status": "Approved",
  "adminNotes": "Approved for lab session"
}
```

### Cancel Lab Reservation
**PUT** `/reservations/labs/:reservationId/cancel`

### Get Available Lab Time Slots
**GET** `/reservations/labs/available-slots/:date`

**Response:**
```json
{
  "date": "2024-01-15",
  "availableSlots": [
    {
      "id": "08:00-09:00",
      "startTime": "08:00",
      "endTime": "09:00"
    }
  ]
}
```

---

## Lending Management

### Get Lending Records
**GET** `/lending`

**Query Parameters:**
- `status` - Filter by status (Borrowed, Returned)
- `userId` - Filter by user ID

**Response:**
```json
{
  "lendingRecords": [
    {
      "id": 1,
      "user_id": 3,
      "user_name": "Alice Johnson",
      "item_id": 1,
      "item_name": "Resistor Kit (1000 pcs)",
      "quantity_borrowed": 2,
      "borrow_date": "2024-01-01T10:00:00.000Z",
      "expected_return_date": "2024-01-08",
      "actual_return_date": null,
      "status": "Borrowed",
      "user_role": "Student"
    }
  ]
}
```

### Get Lending Record
**GET** `/lending/:recordId`

### Borrow Item
**POST** `/lending/borrow`

**Request Body:**
```json
{
  "itemId": 1,
  "quantity": 2,
  "expectedReturnDate": "2024-01-08"
}
```

### Return Item
**PUT** `/lending/:recordId/return`

### Get Overdue Items
**GET** `/lending/overdue/items`

**Response:**
```json
{
  "overdueItems": [
    {
      "id": 1,
      "user_id": 3,
      "user_name": "Alice Johnson",
      "item_id": 1,
      "item_name": "Resistor Kit (1000 pcs)",
      "quantity_borrowed": 2,
      "borrow_date": "2024-01-01T10:00:00.000Z",
      "expected_return_date": "2024-01-08",
      "status": "Borrowed",
      "user_role": "Student",
      "days_overdue": 3
    }
  ]
}
```

### Lending Statistics (Admin Only)
**GET** `/lending/stats/overview`

**Response:**
```json
{
  "stats": {
    "totalRecords": 25,
    "currentlyBorrowed": 15,
    "returned": 10,
    "overdue": 3,
    "totalBorrowedQuantity": 45
  }
}
```

### User Borrowing History
**GET** `/lending/user/:userId/history`

---

## Error Responses

### Validation Error (400)
```json
{
  "error": "Validation Error",
  "details": [
    {
      "msg": "Item name is required",
      "param": "name",
      "location": "body"
    }
  ]
}
```

### Authentication Error (401)
```json
{
  "error": "Access denied",
  "message": "No token provided"
}
```

### Authorization Error (403)
```json
{
  "error": "Access denied",
  "message": "Role Student is not authorized for this action"
}
```

### Not Found Error (404)
```json
{
  "error": "Item not found"
}
```

### Internal Server Error (500)
```json
{
  "error": "Internal Server Error",
  "message": "Something went wrong"
}
```

---

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (Validation Error)
- `401` - Unauthorized (Authentication Required)
- `403` - Forbidden (Authorization Required)
- `404` - Not Found
- `500` - Internal Server Error

---

## Rate Limiting

The API implements rate limiting:
- 100 requests per 15 minutes per IP address
- Exceeds limit returns 429 Too Many Requests

---

## CORS

The API supports CORS for cross-origin requests:
- Default origin: `http://localhost:3000`
- Configurable via `CORS_ORIGIN` environment variable 