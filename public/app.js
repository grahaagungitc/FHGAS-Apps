const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

const roomStatusClass = {
  Available: 'available',
  Occupied: 'occupied',
  Maintenance: 'maintenance'
};

const bookingStatusClass = {
  'Checked In': 'checked',
  Reserved: 'reserved'
};

const taskStatusClass = {
  Pending: 'pending',
  'In Progress': 'in-progress',
  Scheduled: 'scheduled'
};

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return response.json();
}

function renderRoomTable(rooms) {
  const table = `
    <table>
      <thead>
        <tr>
          <th>Room</th>
          <th>Type</th>
          <th>Floor</th>
          <th>Status</th>
          <th>Rate</th>
        </tr>
      </thead>
      <tbody>
        ${rooms.map(room => `
          <tr>
            <td>${room.roomNumber}</td>
            <td>${room.type}</td>
            <td>${room.floor}</td>
            <td><span class="status-pill ${roomStatusClass[room.status] || ''}">${room.status}</span></td>
            <td>${currency.format(room.rate)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;

  document.getElementById('roomsTable').innerHTML = table;
}

function renderBookingsTable(bookings) {
  const table = `
    <table>
      <thead>
        <tr>
          <th>Guest</th>
          <th>Room</th>
          <th>Check In</th>
          <th>Check Out</th>
          <th>Status</th>
          <th>Amount</th>
        </tr>
      </thead>
      <tbody>
        ${bookings.map(booking => `
          <tr>
            <td>${booking.guestName}</td>
            <td>${booking.roomNumber}</td>
            <td>${booking.checkIn}</td>
            <td>${booking.checkOut}</td>
            <td><span class="status-pill ${bookingStatusClass[booking.status] || ''}">${booking.status}</span></td>
            <td>${currency.format(booking.total)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;

  document.getElementById('bookingsTable').innerHTML = table;
  document.getElementById('bookingCount').textContent = `${bookings.length} records`;
}

function renderHousekeepingTable(tasks) {
  const table = `
    <table>
      <thead>
        <tr>
          <th>Room</th>
          <th>Task</th>
          <th>Assignee</th>
          <th>Priority</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${tasks.map(task => `
          <tr>
            <td>${task.roomNumber}</td>
            <td>${task.task}</td>
            <td>${task.assignee}</td>
            <td>${task.priority}</td>
            <td><span class="status-pill ${taskStatusClass[task.status] || ''}">${task.status}</span></td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;

  document.getElementById('housekeepingTable').innerHTML = table;
}

function renderDepartmentTable(departments) {
  const table = `
    <table>
      <thead>
        <tr>
          <th>Department</th>
          <th>Team</th>
          <th>Performance</th>
        </tr>
      </thead>
      <tbody>
        ${departments.map(dept => `
          <tr>
            <td>${dept.department}</td>
            <td>${dept.count}</td>
            <td>${dept.performance}%</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;

  document.getElementById('departmentTable').innerHTML = table;
}

function renderSummary(summary) {
  document.getElementById('occupiedRooms').textContent = summary.occupiedRooms;
  document.getElementById('availableRooms').textContent = summary.availableRooms;
  document.getElementById('maintenanceRooms').textContent = summary.maintenanceRooms;
  document.getElementById('checkedIn').textContent = summary.checkedIn;
  document.getElementById('pendingHousekeeping').textContent = summary.pendingHousekeeping;
  document.getElementById('totalRevenue').textContent = currency.format(summary.totalRevenue);
  document.getElementById('totalExpenses').textContent = currency.format(summary.totalExpenses);
  document.getElementById('netProfit').textContent = currency.format(summary.netProfit);

  const bars = [
    { value: Math.max(summary.totalRevenue / 5, 25), color: '#93c5fd' },
    { value: Math.max(summary.totalExpenses / 3, 25), color: '#60a5fa' },
    { value: Math.max(summary.netProfit / 4, 25), color: '#1d4ed8' }
  ];

  const chart = document.getElementById('revenueChart');
  chart.innerHTML = bars.map((bar) => `
    <div class="bar" style="height:${bar.value}px;background:${bar.color};"></div>
  `).join('');
}

async function loadDashboard() {
  try {
    const dashboard = await fetchJson('/api/dashboard');
    const rooms = await fetchJson('/api/rooms');
    const bookings = await fetchJson('/api/bookings');
    const housekeeping = await fetchJson('/api/housekeeping');

    renderSummary(dashboard.summary);
    renderDepartmentTable(dashboard.departmentSummary);
    renderRoomTable(rooms);
    renderBookingsTable(bookings);
    renderHousekeepingTable(housekeeping);
  } catch (error) {
    console.error('Failed to load dashboard data', error);
  }
}

document.getElementById('bookingForm').addEventListener('submit', async (event) => {
  event.preventDefault();

  const payload = {
    guestName: document.getElementById('guestName').value,
    roomId: Number(document.getElementById('roomId').value),
    roomNumber: document.getElementById('roomNumber').value,
    checkIn: document.getElementById('checkIn').value,
    checkOut: document.getElementById('checkOut').value,
    total: Number(document.getElementById('total').value)
  };

  const response = await fetch('/api/bookings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (response.ok) {
    event.target.reset();
    loadDashboard();
  }
});

loadDashboard();
