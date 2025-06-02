
import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { UserRole, AnyUser, Student, Lecturer, Admin, InventoryItem, Printer, PrinterReservation, LendingRecord, AppContextType, TimeSlot, PrinterName, ReservationStatus, LendingStatus, LabReservation, ReservationPurpose } from './types';
import { APP_TITLE, PRINTER_NAMES_ARRAY, TIME_SLOTS_8_TO_4_30_MIN, INITIAL_FILAMENT_PER_PRINTER, LAB_TIME_SLOTS_1_HOUR } from './constants';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';

// Mock simple password hashing (DO NOT USE IN PRODUCTION)
const mockHashPassword = (password: string) => `hashed_${password}`;
const mockVerifyPassword = (password: string, hash: string) => hash === `hashed_${password}`;

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<AnyUser | null>(null);
  const [users, setUsers] = useState<AnyUser[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [printerReservations, setPrinterReservations] = useState<PrinterReservation[]>([]);
  const [lendingRecords, setLendingRecords] = useState<LendingRecord[]>([]);
  const [labReservations, setLabReservations] = useState<LabReservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load data from localStorage on initial mount
  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) setCurrentUser(JSON.parse(storedUser));

    const storedUsers = localStorage.getItem('users');
    let initialUsers: AnyUser[] = [];
    if (storedUsers) {
      initialUsers = JSON.parse(storedUsers);
    } else {
      const adminUser: Admin = { id: 'admin001', name: 'Admin User', role: UserRole.ADMIN, passwordHash: mockHashPassword('admin123') };
      initialUsers.push(adminUser);
    }
    setUsers(initialUsers);
    
    setInventory(JSON.parse(localStorage.getItem('inventory') || '[]') as InventoryItem[]);
    if (!localStorage.getItem('inventory')) {
        setInventory([
            { id: 'item001', name: 'Resistor Kit (1000 pcs)', quantity: 10, available: 10 },
            { id: 'item002', name: 'Arduino Uno R3', quantity: 5, available: 5 },
            { id: 'item003', name: 'Breadboard Pack', quantity: 20, available: 20 },
        ]);
    }


    const storedPrinters = localStorage.getItem('printers');
    if (storedPrinters) {
      setPrinters(JSON.parse(storedPrinters));
    } else {
      setPrinters(PRINTER_NAMES_ARRAY.map((name, index) => ({
        id: `printer00${index + 1}`,
        name: name,
        status: 'Available',
        filamentAvailableGrams: INITIAL_FILAMENT_PER_PRINTER,
      })));
    }

    setPrinterReservations(JSON.parse(localStorage.getItem('printerReservations') || '[]'));
    setLendingRecords(JSON.parse(localStorage.getItem('lendingRecords') || '[]'));
    setLabReservations(JSON.parse(localStorage.getItem('labReservations') || '[]'));

    setIsLoading(false);
  }, []);

  // Persist data to localStorage
  useEffect(() => { if(!isLoading) localStorage.setItem('currentUser', JSON.stringify(currentUser)); }, [currentUser, isLoading]);
  useEffect(() => { if(!isLoading) localStorage.setItem('users', JSON.stringify(users)); }, [users, isLoading]);
  useEffect(() => { if(!isLoading) localStorage.setItem('inventory', JSON.stringify(inventory)); }, [inventory, isLoading]);
  useEffect(() => { if(!isLoading) localStorage.setItem('printers', JSON.stringify(printers)); }, [printers, isLoading]);
  useEffect(() => { if(!isLoading) localStorage.setItem('printerReservations', JSON.stringify(printerReservations)); }, [printerReservations, isLoading]);
  useEffect(() => { if(!isLoading) localStorage.setItem('lendingRecords', JSON.stringify(lendingRecords)); }, [lendingRecords, isLoading]);
  useEffect(() => { if(!isLoading) localStorage.setItem('labReservations', JSON.stringify(labReservations)); }, [labReservations, isLoading]);


  const login = useCallback((identifier: string, password: string, role: UserRole): boolean => {
    const user = users.find(u => 
      u.role === role &&
      ( (role === UserRole.STUDENT && (u as Student).studentId === identifier) || (u.name === identifier) ) &&
      mockVerifyPassword(password, u.passwordHash)
    );
    if (user) {
      setCurrentUser(user);
      return true;
    }
    return false;
  }, [users]);

  const logout = useCallback(() => {
    setCurrentUser(null);
  }, []);

  const registerStudent = useCallback((studentData: Omit<Student, 'id' | 'role' | 'passwordHash'> & {password: string}): Student | null => {
    if (users.some(u => u.role === UserRole.STUDENT && (u as Student).studentId === studentData.studentId)) {
      alert('Student ID already exists.');
      return null;
    }
    const newStudent: Student = {
      id: `user_${Date.now()}`,
      ...studentData,
      role: UserRole.STUDENT,
      passwordHash: mockHashPassword(studentData.password),
    };
    setUsers(prev => [...prev, newStudent]);
    return newStudent;
  }, [users]);

  const addLecturerByAdmin = useCallback((lecturerData: Omit<Lecturer, 'id' | 'role' | 'passwordHash'> & {password: string}): Lecturer | null => {
    if (users.some(u => u.name === lecturerData.name && u.role === UserRole.LECTURER)) {
      alert('Lecturer with this name already exists.');
      return null;
    }
    const newLecturer: Lecturer = {
      id: `user_${Date.now()}`,
      ...lecturerData,
      role: UserRole.LECTURER,
      passwordHash: mockHashPassword(lecturerData.password),
    };
    setUsers(prev => [...prev, newLecturer]);
    return newLecturer;
  }, [users]);

  const removeUser = useCallback((userId: string) => {
    if (currentUser?.id === userId) {
      alert("Cannot remove the currently logged-in user.");
      return;
    }
    setUsers(prev => prev.filter(u => u.id !== userId));
    setPrinterReservations(prev => prev.filter(r => r.userId !== userId));
    setLendingRecords(prev => prev.filter(lr => lr.userId !== userId));
    setLabReservations(prev => prev.filter(lr => lr.userId !== userId));
  }, [currentUser]);

  const addInventoryItem = useCallback((itemData: Omit<InventoryItem, 'id'|'available'>): InventoryItem | null => {
    const newItem: InventoryItem = {
      id: `item_${Date.now()}`,
      ...itemData,
      available: itemData.quantity,
    };
    setInventory(prev => [...prev, newItem]);
    return newItem;
  }, []);
  
  const removeInventoryItem = useCallback((itemId: string): boolean => {
    const itemToRemove = inventory.find(item => item.id === itemId);
    if (!itemToRemove) {
        alert("Item not found.");
        return false;
    }
    if (itemToRemove.quantity !== itemToRemove.available) {
        alert("Cannot remove item. Some units are currently borrowed out.");
        return false;
    }
    setInventory(prevInventory => prevInventory.filter(item => item.id !== itemId));
    return true;
  }, [inventory]);

  const updateInventoryItemQuantity = useCallback((itemId: string, change: number) => {
    setInventory(prev => prev.map(item => 
      item.id === itemId 
        ? { ...item, quantity: item.quantity + change, available: item.available + change } 
        : item
    ));
  }, []);

  const borrowItem = useCallback((userId: string, userName: string, itemId: string, quantity: number, expectedReturnDate: string): LendingRecord | null => {
    const item = inventory.find(i => i.id === itemId);
    if (!item || item.available < quantity) {
      alert('Not enough items available or item does not exist.');
      return null;
    }
    const newRecord: LendingRecord = {
      id: `lend_${Date.now()}`,
      userId,
      userName,
      itemId,
      itemName: item.name,
      quantityBorrowed: quantity,
      borrowDate: new Date().toISOString(),
      expectedReturnDate,
      status: LendingStatus.BORROWED,
    };
    setLendingRecords(prev => [...prev, newRecord]);
    setInventory(prev => prev.map(i => i.id === itemId ? {...i, available: i.available - quantity} : i));
    return newRecord;
  }, [inventory]);

  const returnItem = useCallback((lendingRecordId: string) => {
    const record = lendingRecords.find(r => r.id === lendingRecordId);
    if (!record || record.status === LendingStatus.RETURNED) {
      alert('Record not found or item already returned.');
      return;
    }
    setLendingRecords(prev => prev.map(r => r.id === lendingRecordId ? {...r, status: LendingStatus.RETURNED, actualReturnDate: new Date().toISOString()} : r));
    setInventory(prevInventory => {
        const itemExists = prevInventory.some(i => i.id === record.itemId);
        if (itemExists) {
            return prevInventory.map(i => i.id === record.itemId ? {...i, available: i.available + record.quantityBorrowed} : i);
        }
        return prevInventory;
    });
  }, [lendingRecords, inventory]);


  const requestPrinterReservation = useCallback((reservationData: Omit<PrinterReservation, 'id' | 'status' | 'requestTimestamp' | 'userName' | 'printerName'>): PrinterReservation | null => {
    const user = users.find(u => u.id === reservationData.userId);
    const printer = printers.find(p => p.id === reservationData.printerId);
    if(!user || !printer) return null;

    const newReservation: PrinterReservation = {
      ...reservationData,
      id: `pres_${Date.now()}`,
      userName: user.name,
      printerName: printer.name,
      status: ReservationStatus.PENDING,
      requestTimestamp: Date.now(),
    };
    setPrinterReservations(prev => [...prev, newReservation]);
    return newReservation;
  }, [users, printers]);

  const updatePrinterReservationStatus = useCallback((reservationId: string, status: ReservationStatus) => {
    let reservationToUpdate: PrinterReservation | undefined;
    setPrinterReservations(prev => prev.map(r => {
        if (r.id === reservationId) {
            reservationToUpdate = {...r, status};
            return reservationToUpdate;
        }
        return r;
    }));
    
    if (status === ReservationStatus.APPROVED && reservationToUpdate) {
        const res = reservationToUpdate;
        if (!res.usesOwnFilament && res.filamentNeededGrams > 0) {
            setPrinters(prevPrinters => prevPrinters.map(p => 
                p.id === res.printerId 
                ? { ...p, filamentAvailableGrams: Math.max(0, p.filamentAvailableGrams - res.filamentNeededGrams) }
                : p
            ));
        }
    }
  }, []);

  const cancelPrinterReservation = useCallback((reservationId: string) => {
    const reservationToCancel = printerReservations.find(r => r.id === reservationId);
    if (!reservationToCancel) {
        alert("Reservation not found.");
        return;
    }

    // Check permission: user can cancel their own, admin can cancel any
    if (currentUser?.id !== reservationToCancel.userId && currentUser?.role !== UserRole.ADMIN) {
        alert("You do not have permission to cancel this reservation.");
        return;
    }

    // If it was an approved reservation using lab filament, refund it
    if (reservationToCancel.status === ReservationStatus.APPROVED && !reservationToCancel.usesOwnFilament && reservationToCancel.filamentNeededGrams > 0) {
        setPrinters(prevPrinters => prevPrinters.map(p =>
            p.id === reservationToCancel.printerId
            ? { ...p, filamentAvailableGrams: p.filamentAvailableGrams + reservationToCancel.filamentNeededGrams }
            : p
        ));
    }

    setPrinterReservations(prev => prev.map(r => 
        r.id === reservationId ? { ...r, status: ReservationStatus.CANCELLED } : r
    ));
    alert("Printer reservation cancelled successfully.");
  }, [printerReservations, currentUser, printers]);

  const getAvailablePrinterTimeSlots = useCallback((date: string, printerId: string): TimeSlot[] => {
    const existingReservationsForDayAndPrinter = printerReservations.filter(
      r => r.date === date && r.printerId === printerId && (r.status === ReservationStatus.APPROVED || r.status === ReservationStatus.PENDING)
    );
    
    let occupiedSlotIds = new Set<string>();
    existingReservationsForDayAndPrinter.forEach(res => {
        const startIndex = TIME_SLOTS_8_TO_4_30_MIN.findIndex(ts => ts.id === res.timeSlotId);
        if (startIndex !== -1) {
            for (let i = 0; i < res.requestedTimeSlots; i++) {
                if (startIndex + i < TIME_SLOTS_8_TO_4_30_MIN.length) {
                    occupiedSlotIds.add(TIME_SLOTS_8_TO_4_30_MIN[startIndex + i].id);
                }
            }
        }
    });
    return TIME_SLOTS_8_TO_4_30_MIN.filter(slot => !occupiedSlotIds.has(slot.id));
  }, [printerReservations]);

  // Lab Reservation Logic
  const requestLabReservation = useCallback((reservationData: Omit<LabReservation, 'id' | 'status' | 'requestTimestamp' | 'userName'>): LabReservation | null => {
    const user = users.find(u => u.id === reservationData.userId);
    if (!user || user.role !== UserRole.LECTURER) {
        alert("Only lecturers can book lab spaces.");
        return null;
    }
    const newLabReservation: LabReservation = {
        ...reservationData,
        id: `lres_${Date.now()}`,
        userName: user.name,
        status: ReservationStatus.PENDING,
        requestTimestamp: Date.now(),
    };
    setLabReservations(prev => [...prev, newLabReservation]);
    return newLabReservation;
  }, [users]);

  const updateLabReservationStatus = useCallback((reservationId: string, newStatus: ReservationStatus, adminNotes?: string) => {
    setLabReservations(prev => prev.map(r => 
        r.id === reservationId ? { ...r, status: newStatus, adminNotes: adminNotes || r.adminNotes } : r
    ));
  }, []);

  const cancelLabReservation = useCallback((reservationId: string) => {
    const reservationToCancel = labReservations.find(r => r.id === reservationId);
    if (!reservationToCancel) {
        alert("Lab reservation not found.");
        return;
    }
    if (currentUser?.id !== reservationToCancel.userId && currentUser?.role !== UserRole.ADMIN) {
        alert("You do not have permission to cancel this lab reservation.");
        return;
    }
    setLabReservations(prev => prev.map(r => 
        r.id === reservationId ? { ...r, status: ReservationStatus.CANCELLED } : r
    ));
    alert("Lab reservation cancelled successfully.");
  }, [labReservations, currentUser]);

  const getLabTimeSlots = useCallback((date: string): TimeSlot[] => {
    const existingReservationsForDay = labReservations.filter(
        r => r.date === date && (r.status === ReservationStatus.APPROVED || r.status === ReservationStatus.PENDING)
    );
    const occupiedSlotIds = new Set<string>(existingReservationsForDay.map(r => r.timeSlotId));
    return LAB_TIME_SLOTS_1_HOUR.filter(slot => !occupiedSlotIds.has(slot.id));
  }, [labReservations]);


  const lecturers = users.filter(u => u.role === UserRole.LECTURER) as Lecturer[];

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen text-xl">Loading EEC Lab System...</div>;
  }

  const contextValue: AppContextType = {
    currentUser,
    users,
    inventory,
    printers,
    printerReservations,
    lendingRecords,
    labReservations,
    lecturers,
    login,
    logout,
    registerStudent,
    addLecturerByAdmin,
    removeUser,
    addInventoryItem,
    removeInventoryItem,
    updateInventoryItemQuantity,
    borrowItem,
    returnItem,
    requestPrinterReservation,
    updatePrinterReservationStatus,
    cancelPrinterReservation,
    getAvailablePrinterTimeSlots,
    requestLabReservation,
    updateLabReservationStatus,
    cancelLabReservation,
    getLabTimeSlots,
  };

  return (
    <AppContext.Provider value={contextValue}>
      <HashRouter>
        <div className="min-h-screen flex flex-col">
          <header className="bg-primary text-white p-4 shadow-md">
            <h1 className="text-2xl font-bold text-center">{APP_TITLE}</h1>
          </header>
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={currentUser ? <Navigate to="/dashboard" /> : <LandingPage />} />
              <Route path="/dashboard" element={currentUser ? <Dashboard /> : <Navigate to="/" />} />
            </Routes>
          </main>
          <footer className="bg-neutral-dark text-neutral-light p-3 text-center text-sm">
            © {new Date().getFullYear()} EEC Lab. All rights reserved.
          </footer>
        </div>
      </HashRouter>
    </AppContext.Provider>
  );
};

export default App;
