CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Students table
CREATE TABLE students (
    id UUID PRIMARY KEY REFERENCES users(id),
    student_id VARCHAR(50) UNIQUE NOT NULL,
    course VARCHAR(255) NOT NULL
);

-- Lecturers table
CREATE TABLE lecturers (
    id UUID PRIMARY KEY REFERENCES users(id)
);

-- Inventory items
CREATE TABLE inventory_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    available INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Lending records
CREATE TABLE lending_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id UUID REFERENCES inventory_items(id),
    user_id UUID REFERENCES users(id),
    quantity INTEGER NOT NULL,
    borrow_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expected_return_date TIMESTAMP NOT NULL,
    actual_return_date TIMESTAMP,
    status VARCHAR(50) NOT NULL,
    CONSTRAINT valid_quantity CHECK (quantity > 0)
);

-- Printers
CREATE TABLE printers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Available',
    filament_available DECIMAL NOT NULL DEFAULT 1000,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Printer reservations
CREATE TABLE printer_reservations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    printer_id UUID REFERENCES printers(id),
    date DATE NOT NULL,
    time_slot_id VARCHAR(50) NOT NULL,
    requested_slots INTEGER NOT NULL,
    filament_needed DECIMAL NOT NULL,
    uses_own_filament BOOLEAN NOT NULL DEFAULT false,
    status VARCHAR(50) NOT NULL DEFAULT 'Pending',
    request_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_slots CHECK (requested_slots > 0),
    CONSTRAINT valid_filament CHECK (filament_needed > 0)
);

-- Lab reservations
CREATE TABLE lab_reservations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    date DATE NOT NULL,
    time_slot_id VARCHAR(50) NOT NULL,
    purpose VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Pending',
    admin_notes TEXT,
    request_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX idx_lending_user ON lending_records(user_id);
CREATE INDEX idx_lending_item ON lending_records(item_id);
CREATE INDEX idx_printer_reservations_date ON printer_reservations(date);
CREATE INDEX idx_lab_reservations_date ON lab_reservations(date);
