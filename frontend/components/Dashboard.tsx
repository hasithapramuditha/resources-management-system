
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useApp } from '../App';
import { UserRole, InventoryItem, Printer, PrinterReservation, LendingRecord, AnyUser, Student, Lecturer, Admin, ReservationStatus, LendingStatus, TimeSlot, PrinterName, LabReservation, ReservationPurpose } from '../types';
import { TIME_SLOTS_8_TO_4_30_MIN, LAB_TIME_SLOTS_1_HOUR } from '../constants';
import Modal from './common/Modal';

type UserDashboardView = "lendingItems" | "resourceAllocation" | "lendingHistory" | "handoverHistory" | "upcomingHandovers" | "labSpaceBooking";
type AdminDashboardView = "inventory" | "printers" | "users" | "notifications" | "reports" | "addLecturer" | "addInventoryItem" | "labBookingsMgt";

const commonInputClasses = "w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary outline-none shadow-sm text-sm";
const commonButtonClasses = "px-4 py-2 rounded-md font-semibold text-sm transition-colors disabled:opacity-50";
const primaryButtonClasses = `${commonButtonClasses} bg-primary text-white hover:bg-blue-700`;
const secondaryButtonClasses = `${commonButtonClasses} bg-secondary text-white hover:bg-emerald-700`;
const dangerButtonClasses = `${commonButtonClasses} bg-red-500 text-white hover:bg-red-700`;
const warningButtonClasses = `${commonButtonClasses} bg-yellow-500 text-white hover:bg-yellow-600`;

const formatDate = (isoDateString?: string) => {
  if (!isoDateString) return 'N/A';
  return new Date(isoDateString).toLocaleDateString('en-CA'); // YYYY-MM-DD
};
const formatDateTime = (isoDateString?: string | number) => {
    if (!isoDateString) return 'N/A';
    return new Date(isoDateString).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short'});
};


const Dashboard: React.FC = () => {
  const { 
    currentUser, logout, inventory, printers, printerReservations, lendingRecords, users, labReservations,
    addInventoryItem, removeInventoryItem, borrowItem, returnItem, 
    requestPrinterReservation, updatePrinterReservationStatus, cancelPrinterReservation, getAvailablePrinterTimeSlots,
    requestLabReservation, updateLabReservationStatus, cancelLabReservation, getLabTimeSlots,
    addLecturerByAdmin, removeUser 
  } = useApp();
  
  const [activeUserView, setActiveUserView] = useState<UserDashboardView>('lendingItems');
  const [activeAdminView, setActiveAdminView] = useState<AdminDashboardView>('notifications');

  // Modal States
  const [isBorrowModalOpen, setIsBorrowModalOpen] = useState(false);
  const [selectedItemToBorrow, setSelectedItemToBorrow] = useState<InventoryItem | null>(null);
  const [borrowQuantity, setBorrowQuantity] = useState(1);
  const [expectedReturnDate, setExpectedReturnDate] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

  const [isPrinterReserveModalOpen, setIsPrinterReserveModalOpen] = useState(false);
  const [selectedPrinterToReserve, setSelectedPrinterToReserve] = useState<Printer | null>(null);
  const [printerReservationDate, setPrinterReservationDate] = useState(new Date().toISOString().split('T')[0]);
  const [printerReservationTimeSlotId, setPrinterReservationTimeSlotId] = useState<string>('');
  const [printerReservationDurationSlots, setPrinterReservationDurationSlots] = useState(1);
  const [filamentNeeded, setFilamentNeeded] = useState(10);
  const [usesOwnFilament, setUsesOwnFilament] = useState(false);
  const [availableSlotsForPrinterModal, setAvailableSlotsForPrinterModal] = useState<TimeSlot[]>([]);

  const [isAddLecturerModalOpen, setIsAddLecturerModalOpen] = useState(false);
  const [lecturerName, setLecturerName] = useState('');
  const [lecturerPassword, setLecturerPassword] = useState('');

  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [itemName, setItemName] = useState('');
  const [itemQuantity, setItemQuantity] = useState(1);

  // Printer Timetable state
  const [selectedPrinterForTimetable, setSelectedPrinterForTimetable] = useState<Printer | null>(null);
  const [printerTimetableDate, setPrinterTimetableDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Lab Reservation Modal State
  const [isLabReserveModalOpen, setIsLabReserveModalOpen] = useState(false);
  const [labReservationDate, setLabReservationDate] = useState(new Date().toISOString().split('T')[0]);
  const [labReservationTimeSlotId, setLabReservationTimeSlotId] = useState<string>('');
  const [labReservationPurpose, setLabReservationPurpose] = useState<ReservationPurpose | string>(ReservationPurpose.PROJECT_WORK);
  const [otherPurposeDetails, setOtherPurposeDetails] = useState('');
  const [availableLabSlotsForModal, setAvailableLabSlotsForModal] = useState<TimeSlot[]>([]);

  // Lab Timetable State
  const [labTimetableDate, setLabTimetableDate] = useState<string>(new Date().toISOString().split('T')[0]);


  useEffect(() => {
    if (selectedPrinterToReserve && printerReservationDate) {
        setAvailableSlotsForPrinterModal(getAvailablePrinterTimeSlots(printerReservationDate, selectedPrinterToReserve.id));
    }
  }, [selectedPrinterToReserve, printerReservationDate, getAvailablePrinterTimeSlots, printerReservations]);
  
  useEffect(() => {
    if (isLabReserveModalOpen && labReservationDate) {
        setAvailableLabSlotsForModal(getLabTimeSlots(labReservationDate));
    }
  }, [isLabReserveModalOpen, labReservationDate, getLabTimeSlots, labReservations]);


  useEffect(() => {
    if (!currentUser || (currentUser.role !== UserRole.ADMIN && activeUserView !== 'resourceAllocation' && activeUserView !== 'labSpaceBooking')) {
        setSelectedPrinterForTimetable(null);
    }
  }, [activeUserView, activeAdminView, currentUser]);


  if (!currentUser) return null; 

  const handleOpenBorrowModal = (item: InventoryItem) => {
    setSelectedItemToBorrow(item);
    setBorrowQuantity(1);
    setExpectedReturnDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    setIsBorrowModalOpen(true);
  };

  const handleBorrowSubmit = () => {
    if (!selectedItemToBorrow || !currentUser) return;
    if (borrowQuantity <= 0 || borrowQuantity > selectedItemToBorrow.available) {
        alert("Invalid quantity."); return;
    }
    if (!expectedReturnDate) {
        alert("Please select an expected return date."); return;
    }
    borrowItem(currentUser.id, currentUser.name, selectedItemToBorrow.id, borrowQuantity, new Date(expectedReturnDate).toISOString());
    setIsBorrowModalOpen(false);
  };

  const handleOpenPrinterReserveModal = (printer: Printer, date?: string, timeSlotId?: string) => {
    setSelectedPrinterToReserve(printer);
    setPrinterReservationDate(date || new Date().toISOString().split('T')[0]);
    setPrinterReservationTimeSlotId(timeSlotId || '');
    setPrinterReservationDurationSlots(1);
    setFilamentNeeded(10);
    setUsesOwnFilament(false);
    setIsPrinterReserveModalOpen(true);
  };

  const handlePrinterReserveSubmit = () => {
    if (!selectedPrinterToReserve || !currentUser || !printerReservationTimeSlotId || !printerReservationDate) {
        alert("Please fill all reservation details, including selecting a start time slot."); return;
    }
    if (filamentNeeded <=0 && !usesOwnFilament) {
        alert("Filament needed must be greater than 0 if using lab filament."); return;
    }
    if (printerReservationDurationSlots <= 0) {
        alert("Reservation duration must be at least 1 slot (30 minutes)."); return;
    }

    const currentAvailableSlots = getAvailablePrinterTimeSlots(printerReservationDate, selectedPrinterToReserve.id);
    const selectedSlotIndexInAllSlots = TIME_SLOTS_8_TO_4_30_MIN.findIndex(s => s.id === printerReservationTimeSlotId);

    if (selectedSlotIndexInAllSlots === -1) {
        alert("Invalid time slot selected."); return;
    }
    
    if (selectedSlotIndexInAllSlots + printerReservationDurationSlots > TIME_SLOTS_8_TO_4_30_MIN.length) {
        alert("Requested duration exceeds available time slots for the day."); return;
    }

    for(let i = 0; i < printerReservationDurationSlots; i++) {
        const targetSlotId = TIME_SLOTS_8_TO_4_30_MIN[selectedSlotIndexInAllSlots + i]?.id;
        if(!targetSlotId || !currentAvailableSlots.find(s => s.id === targetSlotId)){
            alert(`One or more selected time slots (e.g., ${targetSlotId}) are not available. Please refresh or select a different time/duration.`);
            return;
        }
    }

    requestPrinterReservation({
        userId: currentUser.id,
        printerId: selectedPrinterToReserve.id,
        date: printerReservationDate,
        timeSlotId: printerReservationTimeSlotId,
        requestedTimeSlots: printerReservationDurationSlots,
        filamentNeededGrams: usesOwnFilament ? 0 : filamentNeeded,
        usesOwnFilament: usesOwnFilament,
    });
    setIsPrinterReserveModalOpen(false);
    setSelectedPrinterForTimetable(null); 
    setTimeout(() => setSelectedPrinterForTimetable(selectedPrinterToReserve), 0); 
  };
  
  const handleCancelPrinterReservation = (reservationId: string) => {
    if (window.confirm("Are you sure you want to cancel this printer reservation?")) {
        cancelPrinterReservation(reservationId);
    }
  };

  const handleOpenLabReserveModal = (date?: string, timeSlotId?: string) => {
    setLabReservationDate(date || new Date().toISOString().split('T')[0]);
    setLabReservationTimeSlotId(timeSlotId || '');
    setLabReservationPurpose(ReservationPurpose.PROJECT_WORK);
    setOtherPurposeDetails('');
    setIsLabReserveModalOpen(true);
  };
  
  const handleLabReserveSubmit = () => {
    if (!currentUser || !labReservationDate || !labReservationTimeSlotId) {
        alert("Please select a date and time slot for the lab booking."); return;
    }
    if (labReservationPurpose === ReservationPurpose.OTHER && !otherPurposeDetails.trim()) {
        alert("Please specify details for 'Other' purpose."); return;
    }
    const purpose = labReservationPurpose === ReservationPurpose.OTHER ? otherPurposeDetails.trim() : labReservationPurpose;

    requestLabReservation({
        userId: currentUser.id,
        date: labReservationDate,
        timeSlotId: labReservationTimeSlotId,
        purpose: purpose,
    });
    setIsLabReserveModalOpen(false);
  };

  const handleCancelLabReservation = (reservationId: string) => {
    if (window.confirm("Are you sure you want to cancel this lab booking?")) {
        cancelLabReservation(reservationId);
    }
  };

  const handleAdminUpdateLabBookingStatus = (reservationId: string, status: ReservationStatus.APPROVED | ReservationStatus.REJECTED) => {
    let notes = "";
    if (status === ReservationStatus.REJECTED) {
        notes = prompt("Reason for rejection (optional):") || "";
    }
    updateLabReservationStatus(reservationId, status, notes);
  };


  const handleAddLecturerSubmit = () => {
    if (!lecturerName || !lecturerPassword) { alert("Please provide lecturer name and password."); return; }
    addLecturerByAdmin({ name: lecturerName, password: lecturerPassword });
    setLecturerName(''); setLecturerPassword(''); setIsAddLecturerModalOpen(false);
  };

  const handleAddItemSubmit = () => {
    if (!itemName || itemQuantity <= 0) { alert("Please provide item name and a valid quantity."); return; }
    addInventoryItem({ name: itemName, quantity: itemQuantity });
    setItemName(''); setItemQuantity(1); setIsAddItemModalOpen(false);
  };

  const handleAdminRemoveItem = (itemId: string) => {
    if (window.confirm("Are you sure you want to remove this item?")) {
        const success = removeInventoryItem(itemId);
        if (success) alert("Item removed successfully.");
    }
  };
  
  const handleExportCSV = (data: any[], filename: string) => {
    if (data.length === 0) { alert("No data to export."); return; }
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => Object.values(row).map(val => `"${String(val).replace(/"/g, '""')}"`).join(',')).join('\n');
    const csvContent = `data:text/csv;charset=utf-8,${headers}\n${rows}`;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${filename}.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const userLendingRecords = useMemo(() => lendingRecords.filter(lr => lr.userId === currentUser.id), [lendingRecords, currentUser.id]);
  const userPrinterReservations = useMemo(() => printerReservations.filter(r => r.userId === currentUser.id), [printerReservations, currentUser.id]);
  const userLabReservations = useMemo(() => labReservations.filter(r => r.userId === currentUser.id), [labReservations, currentUser.id]);


  const reservationsForPrinterTimetable = useMemo(() => {
    if (!selectedPrinterForTimetable) return [];
    return printerReservations.filter(r => 
        r.printerId === selectedPrinterForTimetable.id && 
        r.date === printerTimetableDate && 
        (r.status === ReservationStatus.APPROVED || r.status === ReservationStatus.PENDING)
    );
  }, [printerReservations, selectedPrinterForTimetable, printerTimetableDate]);

  const getPrinterSlotInfo = useCallback((slotId: string): { status: 'available' | 'reserved' | 'multi-slot-reserved'; reservation?: PrinterReservation } => {
    for (const res of reservationsForPrinterTimetable) {
        const startIndex = TIME_SLOTS_8_TO_4_30_MIN.findIndex(ts => ts.id === res.timeSlotId);
        if (startIndex !== -1) {
            const slotIndex = TIME_SLOTS_8_TO_4_30_MIN.findIndex(ts => ts.id === slotId);
            if (slotIndex >= startIndex && slotIndex < startIndex + res.requestedTimeSlots) {
                return { status: slotIndex === startIndex ? 'reserved' : 'multi-slot-reserved', reservation: res };
            }
        }
    }
    return { status: 'available' };
  }, [reservationsForPrinterTimetable]);

  const reservationsForLabTimetable = useMemo(() => {
    return labReservations.filter(r => 
        r.date === labTimetableDate && 
        (r.status === ReservationStatus.APPROVED || r.status === ReservationStatus.PENDING)
    );
  }, [labReservations, labTimetableDate]);

  const getLabSlotInfo = useCallback((slotId: string): { status: 'available' | 'reserved'; reservation?: LabReservation } => {
    const reservation = reservationsForLabTimetable.find(r => r.timeSlotId === slotId);
    if (reservation) {
        return { status: 'reserved', reservation };
    }
    return { status: 'available' };
  }, [reservationsForLabTimetable]);


  // USER/LECTURER VIEWS
  const renderLendingItemsView = () => (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-neutral-dark">Available Lab Components</h3>
      {inventory.filter(item => item.available > 0).length === 0 && <p className="text-neutral-DEFAULT">No items currently available for lending.</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {inventory.filter(item => item.available > 0).map(item => (
          <div key={item.id} className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow">
            <h4 className="text-lg font-medium text-primary">{item.name}</h4>
            <p className="text-sm text-neutral-DEFAULT">Available: {item.available} / {item.quantity}</p>
            <button onClick={() => handleOpenBorrowModal(item)} className={`${primaryButtonClasses} mt-3 w-full`}>Borrow</button>
          </div>
        ))}
      </div>
    </div>
  );

  const renderResourceAllocationView = () => ( // For 3D Printers
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-neutral-dark">3D Printer Reservations</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
          {printers.map(printer => (
            <div key={printer.id} className="bg-white p-4 rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer" onClick={() => {setSelectedPrinterForTimetable(printer); setPrinterTimetableDate(new Date().toISOString().split('T')[0]);}}>
              <h4 className="text-lg font-medium text-primary">{printer.name}</h4>
              <p className="text-sm text-neutral-DEFAULT">Status: {printer.status}</p>
              <p className="text-sm text-neutral-DEFAULT">Lab Filament: {printer.filamentAvailableGrams}g</p>
              <button onClick={(e) => { e.stopPropagation(); handleOpenPrinterReserveModal(printer); }} className={`${secondaryButtonClasses} mt-3 w-full text-xs`}>Quick Reserve</button>
            </div>
          ))}
        </div>
      </div>
      {selectedPrinterForTimetable && renderPrinterTimetableView()}
      <div>
        <h4 className="text-lg font-semibold text-neutral-dark mt-6">Your Printer Reservations</h4>
        {userPrinterReservations.filter(r => r.status !== ReservationStatus.CANCELLED && r.status !== ReservationStatus.REJECTED && r.status !== ReservationStatus.COMPLETED).length === 0 && <p className="text-neutral-DEFAULT">You have no active or pending printer reservations.</p>}
        <ul className="space-y-2 mt-2">
          {userPrinterReservations.filter(r => r.status === ReservationStatus.PENDING || r.status === ReservationStatus.APPROVED).map(res => (
              <li key={res.id} className="bg-white p-3 rounded shadow-sm text-sm flex justify-between items-center">
                  <div>
                    {res.printerName} on {formatDate(res.date)} from {TIME_SLOTS_8_TO_4_30_MIN.find(ts => ts.id === res.timeSlotId)?.startTime} ({res.requestedTimeSlots * 30} mins) - Status: <span className={`font-semibold ${res.status === ReservationStatus.APPROVED ? 'text-green-600' : 'text-orange-500'}`}>{res.status}</span>
                  </div>
                  {(res.status === ReservationStatus.PENDING || res.status === ReservationStatus.APPROVED) && 
                    <button onClick={() => handleCancelPrinterReservation(res.id)} className={`${warningButtonClasses} text-xs`}>Cancel</button>
                  }
              </li>
          ))}
        </ul>
      </div>
    </div>
  );
  
  const renderPrinterTimetableView = () => {
    if (!selectedPrinterForTimetable) return null;
    return (
        <div className="mt-6 bg-white p-4 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-semibold text-neutral-dark">Timetable for {selectedPrinterForTimetable.name}</h4>
                <input type="date" value={printerTimetableDate} onChange={e => setPrinterTimetableDate(e.target.value)} min={new Date().toISOString().split('T')[0]} className={`${commonInputClasses} w-auto`}/>
            </div>
            <div className="grid grid-cols-1 gap-px bg-gray-200 border border-gray-200 rounded overflow-hidden text-xs sm:text-sm">
                {TIME_SLOTS_8_TO_4_30_MIN.map((slot, index) => {
                    const slotInfo = getPrinterSlotInfo(slot.id);
                    let slotClass = "p-2 text-center ";
                    let slotContent = `${slot.startTime} - ${slot.endTime}`;
                    let reservationDetails = "";

                    if (slotInfo.status === 'available') slotClass += "bg-green-100 hover:bg-green-300 cursor-pointer transition-colors";
                    else if (slotInfo.status === 'reserved' || slotInfo.status === 'multi-slot-reserved') {
                        slotClass += "bg-red-200 text-red-700";
                        reservationDetails = (currentUser.role === UserRole.ADMIN && slotInfo.reservation) ? slotInfo.reservation.userName : "Reserved";
                        slotContent = slotInfo.status === 'multi-slot-reserved' ? reservationDetails : `${slot.startTime} - ${slot.endTime} (${reservationDetails})`;
                    }
                    
                    if(slotInfo.status === 'multi-slot-reserved' && TIME_SLOTS_8_TO_4_30_MIN.findIndex(ts => ts.id === slotInfo.reservation?.timeSlotId) !== index) {
                        return <div key={slot.id} className={`${slotClass} bg-red-200 text-red-700`}>{reservationDetails} (cont.)</div>;
                    }

                    return (
                        <div key={slot.id} className={slotClass}
                            onClick={() => { if (slotInfo.status === 'available') handleOpenPrinterReserveModal(selectedPrinterForTimetable, printerTimetableDate, slot.id); }}
                            role="button" tabIndex={slotInfo.status === 'available' ? 0 : -1}
                            aria-label={slotInfo.status === 'available' ? `Reserve ${selectedPrinterForTimetable.name} from ${slot.startTime} to ${slot.endTime} on ${printerTimetableDate}` : `Slot ${slot.startTime} to ${slot.endTime} is ${reservationDetails}`}>
                            {slotContent}
                        </div>
                    );
                })}
            </div>
        </div>
    );
  };

  const renderHistoryView = (title: string, records: (LendingRecord | PrinterReservation | LabReservation)[], type: 'lending' | 'printerReservation' | 'labReservation' | 'upcomingReturn') => (
    <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-xl font-semibold text-neutral-dark mb-3">{title}</h3>
        {records.length === 0 && <p className="text-neutral-DEFAULT">No records found.</p>}
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="bg-neutral-light"><tr>{/* Headers dynamically generated based on type */}
                  { (type === 'lending' || type === 'upcomingReturn') && <><th>Item</th><th>Qty</th><th>Borrow Date</th><th>{type==='upcomingReturn' ? 'Expected Return' : 'Actual Return'}</th><th>Status</th>{type === 'upcomingReturn' && <th>Actions</th>}</> }
                  { type === 'printerReservation' && <><th>Printer</th><th>Date</th><th>Time (Duration)</th><th>Filament</th><th>Own?</th><th>Status</th><th>Actions</th></> }
                  { type === 'labReservation' && <><th>Purpose</th><th>Date</th><th>Time</th><th>Status</th><th>Admin Notes</th><th>Actions</th></> }
                </tr></thead>
                <tbody>{records.map(record => <tr key={record.id} className="border-b hover:bg-blue-50">
                    { type === 'lending' && <><td>{(record as LendingRecord).itemName}</td><td>{(record as LendingRecord).quantityBorrowed}</td><td>{formatDate((record as LendingRecord).borrowDate)}</td><td>{formatDate((record as LendingRecord).actualReturnDate) || 'Not Returned'}</td><td>{(record as LendingRecord).status}</td></> }
                    { type === 'upcomingReturn' && <><td>{(record as LendingRecord).itemName}</td><td>{(record as LendingRecord).quantityBorrowed}</td><td>{formatDate((record as LendingRecord).borrowDate)}</td><td>{formatDate((record as LendingRecord).expectedReturnDate)}</td><td>{(record as LendingRecord).status}</td><td>{(record as LendingRecord).status === LendingStatus.BORROWED && <button onClick={() => returnItem(record.id)} className={`${secondaryButtonClasses} text-xs`}>Return</button>}</td></> }
                    { type === 'printerReservation' && <><td>{(record as PrinterReservation).printerName}</td><td>{formatDate((record as PrinterReservation).date)}</td><td>{TIME_SLOTS_8_TO_4_30_MIN.find(ts => ts.id ===(record as PrinterReservation).timeSlotId)?.startTime} ({(record as PrinterReservation).requestedTimeSlots * 30}m)</td><td>{(record as PrinterReservation).filamentNeededGrams}g</td><td>{(record as PrinterReservation).usesOwnFilament ? 'Yes':'No'}</td><td>{(record as PrinterReservation).status}</td><td>{(record as PrinterReservation).status === ReservationStatus.PENDING || (record as PrinterReservation).status === ReservationStatus.APPROVED ? <button onClick={() => handleCancelPrinterReservation(record.id)} className={`${warningButtonClasses} text-xs`}>Cancel</button> : null}</td></> }
                    { type === 'labReservation' && <><td>{(record as LabReservation).purpose}</td><td>{formatDate((record as LabReservation).date)}</td><td>{LAB_TIME_SLOTS_1_HOUR.find(ts => ts.id === (record as LabReservation).timeSlotId)?.startTime}</td><td>{(record as LabReservation).status}</td><td>{(record as LabReservation).adminNotes || 'N/A'}</td><td>{(record as LabReservation).status === ReservationStatus.PENDING || (record as LabReservation).status === ReservationStatus.APPROVED ? <button onClick={() => handleCancelLabReservation(record.id)} className={`${warningButtonClasses} text-xs`}>Cancel</button> : null}</td></> }
                </tr>)}</tbody>
            </table>
        </div>
    </div>
  );

  // Lab Booking View (Lecturer)
  const renderLabSpaceBookingView = () => (
    <div className="space-y-6">
        <div>
            <h3 className="text-xl font-semibold text-neutral-dark">Book Lab Space (1-Hour Slots)</h3>
            <p className="text-sm text-neutral-DEFAULT mb-2">Select a date and click an available time slot to make a booking.</p>
            {renderLabTimetableView(false)} {/* false indicates not admin view for slot details */}
        </div>
        <div>
            <h4 className="text-lg font-semibold text-neutral-dark mt-6">Your Lab Bookings</h4>
            {userLabReservations.filter(r => r.status !== ReservationStatus.CANCELLED && r.status !== ReservationStatus.REJECTED).length === 0 && <p className="text-neutral-DEFAULT">You have no active or pending lab bookings.</p>}
            {renderHistoryView("Your Lab Bookings History", userLabReservations, 'labReservation')}
        </div>
    </div>
  );

  // Lab Timetable (Reusable for Lecturer booking & Admin management)
  const renderLabTimetableView = (isAdminView: boolean) => (
    <div className="mt-2 bg-white p-4 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
            <h4 className="text-lg font-semibold text-neutral-dark">Lab Availability for:</h4>
            <input type="date" value={labTimetableDate} onChange={e => setLabTimetableDate(e.target.value)} min={new Date().toISOString().split('T')[0]} className={`${commonInputClasses} w-auto`}/>
        </div>
        <div className="grid grid-cols-1 gap-px bg-gray-200 border border-gray-200 rounded overflow-hidden text-xs sm:text-sm">
            {LAB_TIME_SLOTS_1_HOUR.map(slot => {
                const slotInfo = getLabSlotInfo(slot.id);
                let slotClass = "p-3 text-center "; // Increased padding for 1-hour slots
                let slotContent = `${slot.startTime} - ${slot.endTime}`;
                let reservationDetails = "";

                if (slotInfo.status === 'available') {
                    slotClass += "bg-green-100 hover:bg-green-300 cursor-pointer transition-colors";
                } else if (slotInfo.status === 'reserved' && slotInfo.reservation) {
                    slotClass += "bg-red-200 text-red-700";
                    if (isAdminView) {
                        reservationDetails = `${slotInfo.reservation.userName} (${slotInfo.reservation.purpose})`;
                    } else if (slotInfo.reservation.userId === currentUser.id) {
                        reservationDetails = `Your Booking (${slotInfo.reservation.purpose})`;
                    } else {
                        reservationDetails = "Reserved";
                    }
                    slotContent = `${slot.startTime} - ${slot.endTime} (${reservationDetails})`;
                }

                return (
                    <div key={slot.id} className={slotClass}
                        onClick={() => { if (slotInfo.status === 'available' && !isAdminView && currentUser.role === UserRole.LECTURER) handleOpenLabReserveModal(labTimetableDate, slot.id); }}
                        role={slotInfo.status === 'available' && !isAdminView && currentUser.role === UserRole.LECTURER ? "button" : undefined}
                        tabIndex={slotInfo.status === 'available' && !isAdminView && currentUser.role === UserRole.LECTURER ? 0 : -1}
                        aria-label={slotInfo.status === 'available' && !isAdminView ? `Book lab from ${slot.startTime} to ${slot.endTime} on ${labTimetableDate}` : `Slot ${slot.startTime} to ${slot.endTime} is ${reservationDetails}`}>
                        {slotContent}
                    </div>
                );
            })}
        </div>
        {LAB_TIME_SLOTS_1_HOUR.length === 0 && <p className="text-center text-neutral-DEFAULT py-4">No lab time slots defined.</p>}
    </div>
  );


  // ADMIN VIEWS
  const renderInventoryManagementView = () => (
    <div className="bg-white p-4 rounded-lg shadow">
      <div className="flex justify-between items-center mb-4"><h3 className="text-xl font-semibold text-neutral-dark">Inventory Management</h3><button onClick={() => setIsAddItemModalOpen(true)} className={primaryButtonClasses}>Add New Item</button></div>
      <div className="overflow-x-auto"><table className="w-full text-sm text-left"><thead className="bg-neutral-light"><tr><th className="px-4 py-2">Name</th><th className="px-4 py-2">Total</th><th className="px-4 py-2">Available</th><th className="px-4 py-2">Actions</th></tr></thead><tbody>
        {inventory.map(item => <tr key={item.id} className="border-b"><td className="px-4 py-2">{item.name}</td><td className="px-4 py-2">{item.quantity}</td><td className="px-4 py-2">{item.available}</td><td className="px-4 py-2"><button onClick={() => handleAdminRemoveItem(item.id)} className={`${dangerButtonClasses} text-xs`} disabled={item.quantity !== item.available}>Remove</button>{item.quantity !== item.available && <span className="text-xs text-gray-500 ml-2">(Borrowed)</span>}</td></tr>)}
      </tbody></table></div>
    </div>
  );

  const renderPrinterManagementView = () => ( // Admin
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="text-xl font-semibold text-neutral-dark mb-3">3D Printer Management & Requests</h3>
      <h4 className="text-lg font-medium text-neutral-dark my-2">Printer Status</h4>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {printers.map(p => <div key={p.id} className="p-3 border rounded bg-gray-50"><p className="font-semibold">{p.name}</p><p>Status: {p.status}</p><p>Filament: {p.filamentAvailableGrams}g</p><button onClick={() => { setSelectedPrinterForTimetable(p); setPrinterTimetableDate(new Date().toISOString().split('T')[0]); setActiveAdminView('printers'); }} className={`${primaryButtonClasses} text-xs mt-2 w-full`}>View Timetable</button></div>)}
      </div>
      {selectedPrinterForTimetable && activeAdminView === 'printers' && renderPrinterTimetableView()}
      <h4 className="text-lg font-medium text-neutral-dark my-2 pt-4 border-t mt-6">Printer Reservation Requests</h4>
      {printerReservations.filter(r => r.status === ReservationStatus.PENDING || r.status === ReservationStatus.APPROVED).length === 0 && <p className="text-neutral-DEFAULT">No pending or approved requests.</p>}
      <ul className="space-y-2">{printerReservations.filter(r => r.status === ReservationStatus.PENDING || r.status === ReservationStatus.APPROVED).map(res => (
          <li key={res.id} className={`p-3 border rounded-md flex flex-col sm:flex-row justify-between items-start sm:items-center ${res.status === ReservationStatus.PENDING ? 'bg-yellow-50' : 'bg-green-50'}`}>
            <div><p><span className="font-semibold">{res.userName}</span> requests <span className="font-semibold">{res.printerName}</span></p><p className="text-xs">Date: {formatDate(res.date)}, Slot: {TIME_SLOTS_8_TO_4_30_MIN.find(ts => ts.id === res.timeSlotId)?.startTime} ({res.requestedTimeSlots*30} min)</p><p className="text-xs">Filament: {res.filamentNeededGrams}g (Own: {res.usesOwnFilament ? 'Yes' : 'No'}) | Requested: {formatDateTime(res.requestTimestamp)} | Status: <strong>{res.status}</strong></p></div>
            <div className="space-x-2 mt-2 sm:mt-0">
              {res.status === ReservationStatus.PENDING && <button onClick={() => updatePrinterReservationStatus(res.id, ReservationStatus.APPROVED)} className={`${secondaryButtonClasses} text-xs`}>Approve</button>}
              {res.status === ReservationStatus.PENDING && <button onClick={() => updatePrinterReservationStatus(res.id, ReservationStatus.REJECTED)} className={`${dangerButtonClasses} text-xs`}>Reject</button>}
              {(res.status === ReservationStatus.PENDING || res.status === ReservationStatus.APPROVED) && <button onClick={() => handleCancelPrinterReservation(res.id)} className={`${warningButtonClasses} text-xs`}>Cancel</button>}
            </div>
          </li>
      ))}</ul>
    </div>
  );

  const renderUserManagementView = () => (
    <div className="bg-white p-4 rounded-lg shadow">
      <div className="flex justify-between items-center mb-4"><h3 className="text-xl font-semibold text-neutral-dark">User Management</h3><button onClick={() => setIsAddLecturerModalOpen(true)} className={primaryButtonClasses}>Add Lecturer</button></div>
      <table className="w-full text-sm text-left"><thead className="bg-neutral-light"><tr><th className="px-4 py-2">Name</th><th className="px-4 py-2">Role</th><th className="px-4 py-2">Identifier</th><th className="px-4 py-2">Actions</th></tr></thead><tbody>
        {users.map(user => <tr key={user.id} className="border-b"><td className="px-4 py-2">{user.name}</td><td className="px-4 py-2">{user.role}</td><td className="px-4 py-2">{user.role === UserRole.STUDENT ? (user as Student).studentId : (user.role === UserRole.ADMIN ? 'N/A' : user.name)}</td><td className="px-4 py-2">{user.id !== currentUser.id && user.role !== UserRole.ADMIN && <button onClick={() => { if(window.confirm(`Remove ${user.name}?`)) removeUser(user.id)}} className={`${dangerButtonClasses} text-xs`}>Remove</button>}</td></tr>)}
      </tbody></table>
    </div>
  );
  
  const renderNotificationPortalView = () => {
    const pendingPrinterRes = printerReservations.filter(r => r.status === ReservationStatus.PENDING);
    const pendingLabRes = labReservations.filter(r => r.status === ReservationStatus.PENDING);
    const upcomingReturns = lendingRecords.filter(lr => lr.status === LendingStatus.BORROWED && new Date(lr.expectedReturnDate) <= new Date(Date.now() + 3 * 24 * 60 * 60 * 1000));

    return (
        <div className="bg-white p-4 rounded-lg shadow space-y-4">
            <h3 className="text-xl font-semibold text-neutral-dark">Notification Portal</h3>
            {(pendingPrinterRes.length + pendingLabRes.length + upcomingReturns.length) === 0 && <p className="text-neutral-DEFAULT">No new notifications.</p>}
            {pendingPrinterRes.length > 0 && <div><h4 className="text-md font-semibold text-orange-600">Pending Printer Reservations ({pendingPrinterRes.length})</h4><ul className="list-disc pl-5 text-sm">{pendingPrinterRes.slice(0,3).map(r => <li key={r.id}>{r.userName} for {r.printerName}. <button className="text-primary text-xs hover:underline" onClick={()=>{setActiveAdminView('printers'); setSelectedPrinterForTimetable(printers.find(p=>p.id===r.printerId)||null); setPrinterTimetableDate(r.date);}}>View</button></li>)}{pendingPrinterRes.length > 3 && <li>And {pendingPrinterRes.length-3} more...</li>}</ul></div>}
            {pendingLabRes.length > 0 && <div><h4 className="text-md font-semibold text-blue-600">Pending Lab Bookings ({pendingLabRes.length})</h4><ul className="list-disc pl-5 text-sm">{pendingLabRes.slice(0,3).map(r => <li key={r.id}>{r.userName} for {r.purpose} on {formatDate(r.date)}. <button className="text-primary text-xs hover:underline" onClick={()=>{setActiveAdminView('labBookingsMgt'); setLabTimetableDate(r.date);}}>View</button></li>)}{pendingLabRes.length > 3 && <li>And {pendingLabRes.length-3} more...</li>}</ul></div>}
            {upcomingReturns.length > 0 && <div><h4 className="text-md font-semibold text-yellow-600">Items Due Soon ({upcomingReturns.length})</h4><ul className="list-disc pl-5 text-sm">{upcomingReturns.slice(0,3).map(lr => <li key={lr.id}>{lr.itemName} ({lr.quantityBorrowed}) by {lr.userName} (Due: {formatDate(lr.expectedReturnDate)}).</li>)}{upcomingReturns.length > 3 && <li>And {upcomingReturns.length-3} more...</li>}</ul></div>}
        </div>
    );
  };

  const renderReportingView = () => (
    <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <h3 className="text-xl font-semibold text-neutral-dark">Reporting</h3><p className="text-sm text-neutral-DEFAULT">Export data as CSV files.</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <button onClick={() => handleExportCSV(users.map(u => ({id:u.id, name:u.name, role:u.role, studentId:(u as Student).studentId || 'N/A', course:(u as Student).course || 'N/A'})), 'all_users_report')} className={secondaryButtonClasses}>Export Users</button>
            <button onClick={() => handleExportCSV(inventory, 'inventory_report')} className={secondaryButtonClasses}>Export Inventory</button>
            <button onClick={() => handleExportCSV(printerReservations, 'printer_reservations_report')} className={secondaryButtonClasses}>Export Printer Reservations</button>
            <button onClick={() => handleExportCSV(labReservations, 'lab_bookings_report')} className={secondaryButtonClasses}>Export Lab Bookings</button>
            <button onClick={() => handleExportCSV(lendingRecords, 'lending_history_report')} className={secondaryButtonClasses}>Export Lending History</button>
        </div>
    </div>
  );
  
  const renderLabBookingsManagementView = () => ( // Admin
    <div className="bg-white p-4 rounded-lg shadow space-y-6">
        <h3 className="text-xl font-semibold text-neutral-dark">Lab Booking Management</h3>
        <div>
            <h4 className="text-lg font-semibold text-neutral-dark mb-2">Lab Timetable & Bookings</h4>
            {renderLabTimetableView(true)} {/* true indicates admin view for slot details */}
        </div>
        <div>
            <h4 className="text-lg font-semibold text-neutral-dark mt-4">All Lab Bookings (Pending/Approved)</h4>
            {labReservations.filter(r => r.status === ReservationStatus.PENDING || r.status === ReservationStatus.APPROVED).length === 0 && <p className="text-neutral-DEFAULT">No pending or approved lab bookings.</p>}
            <ul className="space-y-2 mt-2">
                {labReservations.filter(r => r.status === ReservationStatus.PENDING || r.status === ReservationStatus.APPROVED).map(res => (
                    <li key={res.id} className={`p-3 border rounded-md flex flex-col sm:flex-row justify-between items-start sm:items-center ${res.status === ReservationStatus.PENDING ? 'bg-yellow-50' : 'bg-green-50'}`}>
                        <div>
                            <p><span className="font-semibold">{res.userName}</span> for <span className="italic">"{res.purpose}"</span></p>
                            <p className="text-xs">Date: {formatDate(res.date)}, Time: {LAB_TIME_SLOTS_1_HOUR.find(ts => ts.id === res.timeSlotId)?.startTime}</p>
                            <p className="text-xs">Status: <strong>{res.status}</strong> | Requested: {formatDateTime(res.requestTimestamp)}</p>
                            {res.adminNotes && <p className="text-xs italic text-gray-600">Admin Notes: {res.adminNotes}</p>}
                        </div>
                        <div className="space-x-2 mt-2 sm:mt-0">
                            {res.status === ReservationStatus.PENDING && <button onClick={() => handleAdminUpdateLabBookingStatus(res.id, ReservationStatus.APPROVED)} className={`${secondaryButtonClasses} text-xs`}>Approve</button>}
                            {res.status === ReservationStatus.PENDING && <button onClick={() => handleAdminUpdateLabBookingStatus(res.id, ReservationStatus.REJECTED)} className={`${dangerButtonClasses} text-xs`}>Reject</button>}
                            {(res.status === ReservationStatus.PENDING || res.status === ReservationStatus.APPROVED) && <button onClick={() => handleCancelLabReservation(res.id)} className={`${warningButtonClasses} text-xs`}>Cancel</button>}
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    </div>
  );


  const userNavItemsBase = [
    { label: 'Lending Items', view: 'lendingItems' as UserDashboardView },
    { label: '3D Printer Allocation', view: 'resourceAllocation' as UserDashboardView },
    { label: 'My Lending History', view: 'lendingHistory' as UserDashboardView },
    { label: 'My Return History', view: 'handoverHistory' as UserDashboardView },
    { label: 'My Upcoming Returns', view: 'upcomingHandovers' as UserDashboardView },
  ];
  
  const lecturerNavItems = [ ...userNavItemsBase, { label: 'Lab Space Booking', view: 'labSpaceBooking' as UserDashboardView } ];

  const adminNavItems = [
    { label: 'Notifications', view: 'notifications' as AdminDashboardView },
    { label: 'Inventory Mgt.', view: 'inventory' as AdminDashboardView },
    { label: 'Printer Mgt.', view: 'printers' as AdminDashboardView },
    { label: 'Lab Bookings Mgt.', view: 'labBookingsMgt' as AdminDashboardView },
    { label: 'User Management', view: 'users' as AdminDashboardView },
    { label: 'Reporting', view: 'reports' as AdminDashboardView },
  ];

  const currentView = currentUser.role === UserRole.ADMIN ? activeAdminView : activeUserView;
  const navItems = currentUser.role === UserRole.ADMIN ? adminNavItems : (currentUser.role === UserRole.LECTURER ? lecturerNavItems : userNavItemsBase);
  const setActiveView = currentUser.role === UserRole.ADMIN ? setActiveAdminView as any : setActiveUserView as any;


  return (
    <div className="flex h-[calc(100vh-120px)] animate-fadeIn">
      <aside className="w-64 bg-neutral-dark text-neutral-light p-4 space-y-2 shadow-lg flex flex-col">
        <div className="mb-6 text-center"><div className="w-16 h-16 rounded-full bg-primary mx-auto flex items-center justify-center text-2xl font-bold mb-2 ring-2 ring-blue-300">{currentUser.name.substring(0,1).toUpperCase()}</div><h2 className="text-lg font-semibold">{currentUser.name}</h2><p className="text-xs text-gray-400">{currentUser.role}</p></div>
        <nav className="flex-grow">{navItems.map(item => <button key={item.view} onClick={() => { setActiveView(item.view); if (item.view !== 'resourceAllocation' && item.view !== 'printers' && item.view !== 'labSpaceBooking' && item.view !== 'labBookingsMgt') { setSelectedPrinterForTimetable(null); }}} className={`w-full text-left px-3 py-2 rounded-md transition-colors text-sm ${currentView === item.view ? 'bg-primary' : 'hover:bg-gray-700'}`} aria-current={currentView === item.view ? 'page' : undefined}>{item.label}</button>)}</nav>
        <button onClick={logout} className="w-full text-left px-3 py-2 rounded-md bg-red-600 hover:bg-red-700 transition-colors text-sm mt-auto">Logout</button>
      </aside>

      <main className="flex-1 p-6 bg-gray-100 overflow-y-auto">
        {currentUser.role !== UserRole.ADMIN && ( <>
            {activeUserView === 'lendingItems' && renderLendingItemsView()}
            {activeUserView === 'resourceAllocation' && renderResourceAllocationView()}
            {activeUserView === 'labSpaceBooking' && currentUser.role === UserRole.LECTURER && renderLabSpaceBookingView()}
            {activeUserView === 'lendingHistory' && renderHistoryView('Your Lending History', userLendingRecords, 'lending')}
            {activeUserView === 'handoverHistory' && renderHistoryView('Your Return History', userLendingRecords.filter(lr => lr.status === LendingStatus.RETURNED), 'lending')}
            {activeUserView === 'upcomingHandovers' && renderHistoryView('Items to Return', userLendingRecords.filter(lr => lr.status === LendingStatus.BORROWED), 'upcomingReturn')}
        </>)}
        {currentUser.role === UserRole.ADMIN && ( <>
            {activeAdminView === 'notifications' && renderNotificationPortalView()}
            {activeAdminView === 'inventory' && renderInventoryManagementView()}
            {activeAdminView === 'printers' && renderPrinterManagementView()}
            {activeAdminView === 'labBookingsMgt' && renderLabBookingsManagementView()}
            {activeAdminView === 'users' && renderUserManagementView()}
            {activeAdminView === 'reports' && renderReportingView()}
        </>)}
      </main>

      <Modal isOpen={isBorrowModalOpen} onClose={() => setIsBorrowModalOpen(false)} title={`Borrow: ${selectedItemToBorrow?.name}`}><div className="space-y-4"><p className="text-sm">Available: <span className="font-semibold">{selectedItemToBorrow?.available}</span></p><div><label htmlFor="borrowQty" className="block text-sm font-medium text-neutral-dark mb-1">Quantity:</label><input type="number" id="borrowQty" value={borrowQuantity} onChange={e => setBorrowQuantity(Math.max(1, Math.min(parseInt(e.target.value) || 1, selectedItemToBorrow?.available || 1 )))} min="1" max={selectedItemToBorrow?.available} className={commonInputClasses} /></div><div><label htmlFor="returnDate" className="block text-sm font-medium text-neutral-dark mb-1">Expected Return Date:</label><input type="date" id="returnDate" value={expectedReturnDate} onChange={e => setExpectedReturnDate(e.target.value)} min={new Date().toISOString().split('T')[0]} className={commonInputClasses} /></div><button onClick={handleBorrowSubmit} className={`${primaryButtonClasses} w-full`}>Confirm Borrow</button></div></Modal>
      <Modal isOpen={isPrinterReserveModalOpen} onClose={() => setIsPrinterReserveModalOpen(false)} title={`Reserve Printer: ${selectedPrinterToReserve?.name}`} size="lg"><div className="space-y-3"><div><label htmlFor="resDate" className="block text-sm font-medium text-neutral-dark mb-1">Date:</label><input type="date" id="resDate" value={printerReservationDate} onChange={e => setPrinterReservationDate(e.target.value)} min={new Date().toISOString().split('T')[0]} className={commonInputClasses} /></div><div><label htmlFor="resTimeSlot" className="block text-sm font-medium text-neutral-dark mb-1">Start Time Slot:</label><select id="resTimeSlot" value={printerReservationTimeSlotId} onChange={e => setPrinterReservationTimeSlotId(e.target.value)} className={commonInputClasses} ><option value="">Select a time slot</option>{availableSlotsForPrinterModal.map(slot => <option key={slot.id} value={slot.id}>{slot.startTime} - {slot.endTime}</option>)}{availableSlotsForPrinterModal.length === 0 && !printerReservationTimeSlotId && <option disabled>No slots available</option>}{printerReservationTimeSlotId && !availableSlotsForPrinterModal.find(s => s.id === printerReservationTimeSlotId) && TIME_SLOTS_8_TO_4_30_MIN.find(s => s.id === printerReservationTimeSlotId) && (<option value={printerReservationTimeSlotId}>{TIME_SLOTS_8_TO_4_30_MIN.find(s => s.id === printerReservationTimeSlotId)?.startTime} - {TIME_SLOTS_8_TO_4_30_MIN.find(s => s.id === printerReservationTimeSlotId)?.endTime} (Selected)</option>)}</select></div><div><label htmlFor="resDuration" className="block text-sm font-medium text-neutral-dark mb-1">Duration (30-min slots):</label><input type="number" id="resDuration" value={printerReservationDurationSlots} onChange={e => setPrinterReservationDurationSlots(Math.max(1, parseInt(e.target.value) || 1))} min="1" className={commonInputClasses} /></div><div><label htmlFor="filamentNeeded" className="block text-sm font-medium text-neutral-dark mb-1">Filament Needed (grams):</label><input type="number" id="filamentNeeded" value={filamentNeeded} onChange={e => setFilamentNeeded(Math.max(0, parseInt(e.target.value) || 0))} min="0" className={commonInputClasses} disabled={usesOwnFilament}/></div><div className="flex items-center"><input type="checkbox" id="ownFilament" checked={usesOwnFilament} onChange={e => setUsesOwnFilament(e.target.checked)} className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary mr-2"/><label htmlFor="ownFilament" className="text-sm font-medium text-neutral-dark">I will use my own filament</label></div><button onClick={handlePrinterReserveSubmit} className={`${secondaryButtonClasses} w-full`}>Submit Request</button></div></Modal>
      <Modal isOpen={isAddLecturerModalOpen} onClose={() => setIsAddLecturerModalOpen(false)} title="Add New Lecturer"><div className="space-y-4"><div><label htmlFor="lecturerNameModal" className="block text-sm font-medium text-neutral-dark mb-1">Lecturer Name:</label><input type="text" id="lecturerNameModal" value={lecturerName} onChange={e => setLecturerName(e.target.value)} className={commonInputClasses} /></div><div><label htmlFor="lecturerPassModal" className="block text-sm font-medium text-neutral-dark mb-1">Password:</label><input type="password" id="lecturerPassModal" value={lecturerPassword} onChange={e => setLecturerPassword(e.target.value)} className={commonInputClasses} /></div><button onClick={handleAddLecturerSubmit} className={`${primaryButtonClasses} w-full`}>Add Lecturer</button></div></Modal>
      <Modal isOpen={isAddItemModalOpen} onClose={() => setIsAddItemModalOpen(false)} title="Add New Inventory Item"><div className="space-y-4"><div><label htmlFor="itemNameModal" className="block text-sm font-medium text-neutral-dark mb-1">Item Name:</label><input type="text" id="itemNameModal" value={itemName} onChange={e => setItemName(e.target.value)} className={commonInputClasses} /></div><div><label htmlFor="itemQtyModal" className="block text-sm font-medium text-neutral-dark mb-1">Quantity:</label><input type="number" id="itemQtyModal" value={itemQuantity} onChange={e => setItemQuantity(Math.max(1, parseInt(e.target.value) || 1))} min="1" className={commonInputClasses} /></div><button onClick={handleAddItemSubmit} className={`${primaryButtonClasses} w-full`}>Add Item</button></div></Modal>
      
      <Modal isOpen={isLabReserveModalOpen} onClose={() => setIsLabReserveModalOpen(false)} title="Book Lab Space" size="md">
        <div className="space-y-4">
            <div><label htmlFor="labResDate" className="block text-sm font-medium text-neutral-dark mb-1">Date:</label><input type="date" id="labResDate" value={labReservationDate} onChange={e => setLabReservationDate(e.target.value)} min={new Date().toISOString().split('T')[0]} className={commonInputClasses} /></div>
            <div><label htmlFor="labResTimeSlot" className="block text-sm font-medium text-neutral-dark mb-1">Time Slot (1 hour):</label>
                <select id="labResTimeSlot" value={labReservationTimeSlotId} onChange={e => setLabReservationTimeSlotId(e.target.value)} className={commonInputClasses} >
                    <option value="">Select a time slot</option>
                    {availableLabSlotsForModal.map(slot => <option key={slot.id} value={slot.id}>{slot.startTime} - {slot.endTime}</option>)}
                    {availableLabSlotsForModal.length === 0 && !labReservationTimeSlotId && <option disabled>No slots available for this date</option>}
                    {labReservationTimeSlotId && !availableLabSlotsForModal.find(s => s.id === labReservationTimeSlotId) && LAB_TIME_SLOTS_1_HOUR.find(s=>s.id === labReservationTimeSlotId) && (<option value={labReservationTimeSlotId}>{LAB_TIME_SLOTS_1_HOUR.find(s=>s.id === labReservationTimeSlotId)?.startTime} - {LAB_TIME_SLOTS_1_HOUR.find(s=>s.id === labReservationTimeSlotId)?.endTime} (Selected)</option>)}
                </select>
            </div>
            <div><label htmlFor="labResPurpose" className="block text-sm font-medium text-neutral-dark mb-1">Purpose:</label>
                <select id="labResPurpose" value={labReservationPurpose} onChange={e => setLabReservationPurpose(e.target.value as ReservationPurpose)} className={commonInputClasses}>
                    {Object.values(ReservationPurpose).map(p => <option key={p} value={p}>{p}</option>)}
                </select>
            </div>
            {labReservationPurpose === ReservationPurpose.OTHER && (
                <div><label htmlFor="otherPurpose" className="block text-sm font-medium text-neutral-dark mb-1">Details for 'Other':</label><input type="text" id="otherPurpose" value={otherPurposeDetails} onChange={e => setOtherPurposeDetails(e.target.value)} className={commonInputClasses} placeholder="Specify purpose" /></div>
            )}
            <button onClick={handleLabReserveSubmit} className={`${primaryButtonClasses} w-full`}>Request Booking</button>
        </div>
      </Modal>
    </div>
  );
};

export default Dashboard;
