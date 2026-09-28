const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'hotelData.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function ensureDataFile() {
  if (!fs.existsSync(path.dirname(DATA_FILE))) {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  }

  if (!fs.existsSync(DATA_FILE)) {
    const seedData = {
      rooms: [
        { id: 101, roomNumber: '101', type: 'Deluxe', floor: 1, status: 'Occupied', rate: 180, cleaningStatus: 'Clean' },
        { id: 102, roomNumber: '102', type: 'Standard', floor: 1, status: 'Available', rate: 120, cleaningStatus: 'Ready' },
        { id: 201, roomNumber: '201', type: 'Deluxe', floor: 2, status: 'Occupied', rate: 210, cleaningStatus: 'Dirty' },
        { id: 202, roomNumber: '202', type: 'Suite', floor: 2, status: 'Available', rate: 260, cleaningStatus: 'Ready' },
        { id: 301, roomNumber: '301', type: 'Executive', floor: 3, status: 'Occupied', rate: 300, cleaningStatus: 'Clean' },
        { id: 302, roomNumber: '302', type: 'Standard', floor: 3, status: 'Maintenance', rate: 110, cleaningStatus: 'Inspection' }
      ],
      bookings: [
        { id: 1, guestName: 'Michael Smith', roomId: 101, roomNumber: '101', checkIn: '2026-09-24', checkOut: '2026-09-28', status: 'Checked In', total: 720, balance: 180 },
        { id: 2, guestName: 'Aisha Johnson', roomId: 201, roomNumber: '201', checkIn: '2026-09-26', checkOut: '2026-09-30', status: 'Checked In', total: 840, balance: 210 },
        { id: 3, guestName: 'Daniel Lee', roomId: 102, roomNumber: '102', checkIn: '2026-09-29', checkOut: '2026-10-03', status: 'Reserved', total: 480, balance: 0 }
      ],
      guests: [
        { id: 1, name: 'Michael Smith', nationality: 'USA', phone: '+1 212-555-0147', status: 'VIP', preference: 'Late checkout' },
        { id: 2, name: 'Aisha Johnson', nationality: 'UK', phone: '+44 20 7946 0958', status: 'Regular', preference: 'High floor' },
        { id: 3, name: 'Daniel Lee', nationality: 'Singapore', phone: '+65 8123 4567', status: 'Corporate', preference: 'Airport transfer' }
      ],
      housekeeping: [
        { id: 1, roomNumber: '201', task: 'Deep clean', assignee: 'Maria', priority: 'High', status: 'In Progress' },
        { id: 2, roomNumber: '102', task: 'Linen change', assignee: 'Tariq', priority: 'Medium', status: 'Pending' },
        { id: 3, roomNumber: '302', task: 'Inspect maintenance defect', assignee: 'John', priority: 'Critical', status: 'Scheduled' }
      ],
      staff: [
        { id: 1, name: 'Sarah Gray', department: 'Front Office', role: 'Supervisor', shift: 'Morning' },
        { id: 2, name: 'David Chen', department: 'Housekeeping', role: 'Supervisor', shift: 'Evening' },
        { id: 3, name: 'Nora Ahmed', department: 'Food & Beverage', role: 'Manager', shift: 'Morning' },
        { id: 4, name: 'Emil Torres', department: 'Maintenance', role: 'Technician', shift: 'Night' }
      ],
      expenses: [
        { id: 1, category: 'Utilities', amount: 4800, month: 'September' },
        { id: 2, category: 'Cleaning Supplies', amount: 2100, month: 'September' },
        { id: 3, category: 'Staff Payroll', amount: 18500, month: 'September' }
      ],
      invoices: [
        { id: 1, guestName: 'Michael Smith', amount: 720, paid: 540, due: 180 },
        { id: 2, guestName: 'Aisha Johnson', amount: 840, paid: 630, due: 210 }
      ]
    };

    fs.writeFileSync(DATA_FILE, JSON.stringify(seedData, null, 2));
  }
}

function readData() {
  ensureDataFile();
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

function writeData(data) {
  ensureDataFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function buildDashboard(data) {
  const occupiedRooms = data.rooms.filter((room) => room.status === 'Occupied').length;
  const availableRooms = data.rooms.filter((room) => room.status === 'Available').length;
  const maintenanceRooms = data.rooms.filter((room) => room.status === 'Maintenance').length;
  const checkedIn = data.bookings.filter((booking) => booking.status === 'Checked In').length;
  const pendingHousekeeping = data.housekeeping.filter((task) => task.status !== 'Completed').length;
  const totalRevenue = data.bookings.reduce((sum, booking) => sum + booking.total, 0);
  const totalExpenses = data.expenses.reduce((sum, expense) => sum + expense.amount, 0);

  return {
    summary: {
      occupiedRooms,
      availableRooms,
      maintenanceRooms,
      checkedIn,
      pendingHousekeeping,
      totalRevenue,
      totalExpenses,
      netProfit: totalRevenue - totalExpenses
    },
    departmentSummary: [
      { department: 'Front Office', count: 7, performance: 94 },
      { department: 'Housekeeping', count: 12, performance: 91 },
      { department: 'Food & Beverage', count: 9, performance: 88 },
      { department: 'Maintenance', count: 4, performance: 86 },
      { department: 'Finance', count: 5, performance: 96 }
    ]
  };
}

app.get('/api/dashboard', (req, res) => {
  const data = readData();
  res.json(buildDashboard(data));
});

app.get('/api/rooms', (req, res) => {
  const data = readData();
  res.json(data.rooms);
});

app.get('/api/bookings', (req, res) => {
  const data = readData();
  res.json(data.bookings);
});

app.get('/api/guests', (req, res) => {
  const data = readData();
  res.json(data.guests);
});

app.get('/api/housekeeping', (req, res) => {
  const data = readData();
  res.json(data.housekeeping);
});

app.get('/api/staff', (req, res) => {
  const data = readData();
  res.json(data.staff);
});

app.get('/api/expenses', (req, res) => {
  const data = readData();
  res.json(data.expenses);
});

app.post('/api/bookings', (req, res) => {
  const data = readData();
  const { guestName, roomId, roomNumber, checkIn, checkOut, total } = req.body;

  const booking = {
    id: Date.now(),
    guestName,
    roomId,
    roomNumber,
    checkIn,
    checkOut,
    status: 'Reserved',
    total: Number(total || 0),
    balance: Number(total || 0)
  };

  data.bookings.unshift(booking);
  writeData(data);
  res.status(201).json({ success: true, booking });
});

app.patch('/api/rooms/:id', (req, res) => {
  const data = readData();
  const roomId = Number(req.params.id);
  const room = data.rooms.find((item) => item.id === roomId);

  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }

  Object.assign(room, req.body);
  writeData(data);
  res.json({ success: true, room });
});

app.patch('/api/housekeeping/:id', (req, res) => {
  const data = readData();
  const taskId = Number(req.params.id);
  const task = data.housekeeping.find((item) => item.id === taskId);

  if (!task) {
    return res.status(404).json({ error: 'Housekeeping task not found' });
  }

  Object.assign(task, req.body);
  writeData(data);
  res.json({ success: true, task });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Hotel management system running on http://localhost:${PORT}`);
});
