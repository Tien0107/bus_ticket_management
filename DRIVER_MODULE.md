# Driver Management Module - Documentation

## 📋 Overview

Hoàn thành mô-đun quản lý Driver (Tài xế) với đầy đủ tính năng:
- ✅ Driver Signup (Đăng ký tài xế)
- ✅ Driver Dashboard (Bảng điều khiển)
- ✅ Trip Management (Quản lý chuyến đi)
- ✅ Passenger Check-in (Điểm danh hành khách)
- ✅ Driver Profile (Hồ sơ cá nhân)

## 🚀 Quick Start

### 1. Driver Signup Flow
```
/driver-signup 
  │
  ├─ Personal Info (Họ tên, SĐT, Username, Email)
  ├─ License Info (Số bằng, CCCD)
  ├─ Vehicle Info (Biển số xe, Loại xe, Công ty)
  ├─ Security (Mật khẩu)
  └─ POST → /driver/sign-up → Redirect /login
```

**URL**: `http://localhost:3000/driver-signup`

### 2. Driver Login
```
/login (email + password)
  │
  └─ Role-based redirect:
     ├─ role: "driver" → /driver/dashboard
     ├─ role: "company" → /company/dashboard
     ├─ role: "super_admin" → /super-admin/dashboard
     └─ default → /
```

### 3. Driver Dashboard
**URL**: `/driver/dashboard`

**Features**:
- 📊 Stats Cards: Today trips, Total passengers, Revenue, Rating
- 🚌 Active Trip Banner: Quick access to current trip
- 📑 Tabbed Trip List: Upcoming (Sắp tới), In Progress (Đang chạy), Completed (Hoàn thành)
- 🔗 Quick Links: Click any trip to view details

**Code**:
```jsx
// Trip filtering
const upcomingTrips = trips.filter((t) => t.status === "pending" || t.status === "upcoming");
const inProgressTrips = trips.filter((t) => t.status === "in_progress");
const completedTrips = trips.filter((t) => t.status === "completed");

// Stats calculation
const stats = {
  today: upcomingTrips.length,
  totalPassengers: trips.reduce((sum, t) => sum + (t.passengerCount || 0), 0),
  totalRevenue: trips.reduce((sum, t) => sum + (t.revenue || 0), 0),
  rating: 4.8,
};
```

### 4. Trip Details Page
**URL**: `/driver/trip/:tripId`

**Sections**:
- 🚀 Trip Header: Status, Route, Revenue
- 📊 Trip Info Grid: Duration, Seats, Check-in count, Driver
- ⚙️ Actions: Start Trip, End Trip, Check-in Panel
- 👥 PassengerList Component
- 🗺️ Route Info: All stops with timeline

**API Calls**:
```javascript
const [tripRes, passengersRes, routeRes] = await Promise.all([
  getTripDetail(tripId),
  getTripPassengers(tripId),
  getTripRoute(tripId),
]);
```

### 5. Check-in Modal Component
**Features**:
- 🔍 Search passengers by name/ticket
- ☑️ Select passenger from list
- 💾 Confirm check-in (calls API)
- 📊 Shows checked-in vs pending counts

**Usage**:
```jsx
<CheckInPanel
  tripId={tripId}
  passengers={passengers}
  isOpen={showCheckInPanel}
  onClose={() => setShowCheckInPanel(false)}
  onCheckInSuccess={() => refetch()}
/>
```

### 6. Passenger List Component
**Table Columns**:
- 👤 Passenger Name & Phone
- 🎟️ Ticket Number
- 💺 Seat Number
- 📍 Pickup/Dropoff Points
- ✅ Status (Checked-in / Pending / No-show)
- 🔘 Action Button (Check-in or checkmark)

**Stats Footer**:
- Total passengers
- Checked-in count
- Pending count

### 7. Driver Profile Page
**URL**: `/driver/profile`

**Mode: View**
- Display all profile info
- Edit button

**Mode: Edit**
- Edit form for:
  - Full name, Username
  - Phone
  - ID number, License number
  - Vehicle number, Vehicle type
  - Company name
- Save & Cancel buttons

**Features**:
- ✏️ Edit mode toggle
- 💾 Save to localStorage (backend integration ready)
- 🚪 Logout button
- 👤 Avatar section with user info

## 📁 File Structure

```
src/
├── pages/
│   ├── DriverSignup.jsx           (360 lines - Multi-section form)
│   ├── driver/
│   │   ├── DriverDashboard.jsx    (250+ lines - Main dashboard)
│   │   ├── DriverProfile.jsx      (300+ lines - Profile management)
│   │   └── TripDetail.jsx         (350+ lines - Trip details)
│
├── components/
│   ├── driver/
│   │   ├── PassengerList.jsx      (Passenger table)
│   │   └── CheckInPanel.jsx       (Check-in modal)
│   └── layouts/
│       └── DashboardLayout.jsx    (Sidebar navigation)
│
├── api/
│   └── driver.js                  (7 API endpoints)
│
└── context/
    └── ToastContext.jsx           (Global notifications)
```

## 🔌 API Endpoints

All endpoints in `src/api/driver.js`:

```javascript
// 1. Driver Sign-up
POST /driver/sign-up
Payload: {
  fullName, username, email, phone, password,
  licenseNumber, vehicleNumber, vehicleType, companyName,
  contactInfo: {}
}

// 2. Get All Trips
GET /driver/trip?limit=20&offset=0&status=...
Return: { trips: [...] }

// 3. Get Trip Details
GET /driver/trip/:tripId
Return: { trip: {...} }

// 4. Get Trip Passengers
GET /driver/trip/:tripId/passenger?limit=50
Return: { passengers: [...] }

// 5. Get Trip Route
GET /driver/trip/:tripId/route
Return: { route: { stops: [...] } }

// 6. Update Trip Status
PATCH /driver/trip/:tripId
Payload: { status: "in_progress" | "completed" }

// 7. Check-in Passenger
PUT /driver/trip/:tripId/passenger/:passengerId/check-in
Payload: {} (optional timestamp/notes)
```

## 🎨 UI Components

### Stats Card
```jsx
<div className="bg-white rounded-2xl p-6 shadow-sm">
  <p className="text-on-surface-variant text-sm">Chuyến hôm nay</p>
  <p className="text-4xl font-bold text-primary">5</p>
</div>
```

### Status Badge
```jsx
const statusMap = {
  pending: { label: "Sắp tới", color: "bg-blue-100 text-blue-700" },
  in_progress: { label: "Đang chạy", color: "bg-green-100 text-green-700" },
  completed: { label: "Hoàn thành", color: "bg-gray-100 text-gray-700" },
};
```

### Trip Card
- Route info with location icons
- Departure time & seats
- Revenue display
- Click to navigate to details

## 🔄 Data Flow

```
Login (role: "driver")
  ↓
Redirect to /driver/dashboard
  ↓
Load trips from API (getDriverTrips)
  ↓
Display in tabs + stats
  ↓
Click trip → /driver/trip/:id
  ↓
Load trip + passengers + route (parallel)
  ↓
Can start/end trip
  ↓
Can check-in passengers
  ↓
Back to dashboard or view profile
```

## 🧪 Testing

### Manual Testing Checklist

- [ ] Signup as driver at `/driver-signup`
- [ ] Login with driver credentials → redirects to `/driver/dashboard`
- [ ] View dashboard stats and trip lists
- [ ] Click on a trip → TripDetail page loads
- [ ] Check-in a passenger → Modal opens, select passenger, confirm
- [ ] See passenger check-in status update
- [ ] End trip → Moves to "Hoàn thành" tab
- [ ] View profile at `/driver/profile`
- [ ] Edit profile and save
- [ ] Logout → Redirects to `/login`

### API Testing
```bash
# Test driver signup
curl -X POST http://localhost:5000/driver/sign-up \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Nguyễn Văn A",
    "email": "driver@test.com",
    "password": "123456",
    "licenseNumber": "ABC123",
    "vehicleNumber": "29A-12345",
    "contactInfo": {}
  }'

# Test get trips
curl -X GET http://localhost:5000/driver/trip \
  -H "Authorization: Bearer {token}"
```

## ⚙️ Configuration

### Toast Notifications
- Duration: 3 seconds
- Types: success, error, warning, info
- Usage: `const { addToast } = useToast();`

### Tailwind Colors
- Primary: `#6200EE` (Purple)
- Error: `#B3261E` (Red)
- Green: Success states
- Material icons from `material-symbols-outlined`

## 🚀 Deployment Checklist

- [ ] API endpoints tested with real backend
- [ ] Error handling for network failures
- [ ] Loading states on all async operations
- [ ] Toast notifications for user feedback
- [ ] Responsive design tested on mobile
- [ ] Token refresh implementation (if needed)
- [ ] Git branch merged to main

## 📝 Notes

### Known Issues & TODOs
- [ ] Real-time trip status updates (consider WebSocket)
- [ ] QR code scanner integration for check-in
- [ ] GPS tracking for live route display
- [ ] Payment/revenue calculation refinements
- [ ] Email notifications for trip assignments

### Performance
- Trip list pagination: `limit: 20`
- Lazy load passenger list vs full fetch
- Consider debouncing check-in rapid clicks

### Security
- Token stored in localStorage (consider secure cookie)
- Validate user role on protected routes
- Implement PrivateRoute component when ready

## 👨‍💻 Developer Guide

### Adding a New Driver Feature

1. **Create Page Component**
```jsx
import { useParams } from "react-router-dom";
import { useToast } from "../../context/ToastContext";

export default function NewFeature() {
  const { addToast } = useToast();
  // Your code
}
```

2. **Add API Function**
```javascript
// src/api/driver.js
export const newFeature = async (data) => {
  const response = await axiosClient.post("/driver/new-endpoint", data);
  return response;
};
```

3. **Add Route**
```jsx
// src/App.js
<Route path="/driver/feature" element={<NewFeature />} />
```

4. **Update Sidebar**
```jsx
// src/components/layouts/DashboardLayout.jsx
<Link to="/driver/feature" className={getLinkClass("/driver/feature")}>
  <span className="material-symbols-outlined">featured_play_list</span>
  {sidebarOpen && <span>Feature Name</span>}
</Link>
```

---

**Last Updated**: 2024
**Status**: ✅ Complete & Ready for Testing
**Branch**: `feature/driver-management`
