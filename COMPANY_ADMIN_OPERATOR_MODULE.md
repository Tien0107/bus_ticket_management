# Company Admin Operator Module - Documentation

## 📋 Overview

Hoàn thành mô-đun Company Operator (Điều hành viên) với đầy đủ tính năng quản lý vận tải:
- ✅ Operator Dashboard (Tổng quan điều hành)
- ✅ Routes Management (Quản lý tuyến đường)
- ✅ Stations Management (Quản lý trạm)
- ✅ Trip Prices Management (Quản lý bảng giá)
- ✅ Trip Schedules Management (Quản lý lịch biểu)
- ✅ Stopping Points Management (Quản lý điểm dừng)
- ✅ Trips Management (Quản lý các chuyến xe)

## 🎯 Phân biệt Role

| Loại | role | staffProfileRole | Chức năng |
|---|---|---|---|
| **Company Admin** | operator | `company_admin` | Quản lý: Xe, tài xế, nhân viên, hồ sơ công ty |
| **Company Operator** | operator | `operator` | Quản lý: Tuyến, trạm, giá vé, lịch biểu |

## 🚀 Quick Start

### 1. Operator Dashboard
**URL**: `/operator/dashboard`

**Features**:
- 📊 Stats Cards: Routes count, Stations count, Schedules count, Price Templates count
- 🚀 Quick Action Links: Routes, Schedules management
- 🔗 Navigation Cards: Routes, Stations, Prices, Schedules

**Data Fetched**:
- Total routes via `getRoutes()`
- Total stations via `getStations()`
- Total schedules via `getTripSchedules()`
- Total price templates via `getTripPrices()`

### 2. Routes Management
**URL**: `/operator/routes` (To be implemented)

**Features**:
- 🛣️ List all routes
- ➕ Add new route
- ✏️ Edit route (update from/to location, distance, duration)
- 🗑️ Delete route
- 🔍 Search routes

**Fields**:
- fromLocation (Địa điểm xuất phát) *
- toLocation (Địa điểm đến) *
- distanceKm (Khoảng cách - km) *
- durationMinutes (Thời gian - phút) *

**API Calls**:
- `getRoutes(params)` - GET /operator-dispatcher/route
- `createRoute(data)` - POST /operator-dispatcher/route
- `updateRoute(routeId, data)` - PUT /operator-dispatcher/route/{id}

### 3. Stations Management
**URL**: `/operator/stations` (To be implemented)

**Features**:
- 🏢 List all stations
- ➕ Add new station
- 📍 Filter by city
- 🔍 Search stations

**Fields**:
- address (Địa chỉ) *
- city (Thành phố) *

**API Calls**:
- `getStations(params)` - GET /operator-dispatcher/station?city=&limit=10
- `createStation(data)` - POST /operator-dispatcher/station

### 4. Trip Prices Management
**URL**: `/operator/prices` (To be implemented)

**Features**:
- 💰 List all price templates
- ➕ Add new price template
- ✏️ Edit price
- 🗑️ Delete price
- 🔗 Link routes, stations, and prices

**Fields**:
- routeId (Tuyến đường) *
- fromStationId (Trạm xuất phát) *
- toStationId (Trạm đến) *
- price (Giá vé) *
- status (Hoạt động/Tạm dừng)

**API Calls**:
- `getTripPrices(params)` - GET /operator-dispatcher/trip-price-template
- `createTripPrice(data)` - POST /operator-dispatcher/trip-price-template
- `updateTripPrice(priceId, data)` - PUT /operator-dispatcher/trip-price-template/{id}
- `deleteTripPrice(priceId)` - DELETE /operator-dispatcher/trip-price-template/{id}

### 5. Trip Schedules Management
**URL**: `/operator/schedules` (To be implemented)

**Features**:
- 📅 List all schedules
- ➕ Create new schedule
- ✏️ Edit schedule details
- 🗑️ Delete schedule
- 🛑 Manage stopping points
- 🚕 Manage individual trips

**Fields**:
- routeId (Tuyến đường) *
- departureTime (Giờ khởi hành - HH:mm) *
- startDate (Ngày bắt đầu) *
- endDate (Ngày kết thúc) *
- status (Trạng thái: active/inactive)

**API Calls**:
- `getTripSchedules(params)` - GET /operator-dispatcher/trip-schedule
- `createTripSchedule(data)` - POST /operator-dispatcher/trip-schedule
- `updateTripSchedule(scheduleId, data)` - PUT /operator-dispatcher/trip-schedule/{id}
- `deleteTripSchedule(scheduleId)` - DELETE /operator-dispatcher/trip-schedule/{id}

### 6. Stopping Points Management
**URL**: `/operator/schedules/{scheduleId}` (Within Schedules)

**Features**:
- 🛑 List all stopping points for a schedule
- ➕ Add new stopping point
- ✏️ Edit stopping point
- 📍 Configure pickup/dropoff options

**Fields**:
- stationId (Trạm dừng) *
- stopOrder (Thứ tự dừng) *
- allowPickup (Cho phép đón khách)
- allowDropoff (Cho phép hạ khách)

**API Calls**:
- `getStoppingPoints(scheduleId)` - GET /operator-dispatcher/trip-schedule/{id}/stopping-point
- `createStoppingPoint(scheduleId, data)` - POST /operator-dispatcher/trip-schedule/{id}/stopping-point
- `updateStoppingPoint(scheduleId, stoppingPointId, data)` - PUT /operator-dispatcher/trip-schedule/{id}/stopping-point/{tripStopTemplateId}

### 7. Trips Management
**URL**: `/operator/schedules/{scheduleId}/trips` (Within Schedules)

**Features**:
- 🚕 List all trips under a schedule
- ✏️ Assign vehicle and driver
- 🎫 Set departure date
- 📊 Filter by status

**Columns**:
- Trip ID
- Route (From → To)
- Vehicle + Plate Number
- Driver Name
- Departure Date
- Status (scheduled, running, completed, cancelled)

**API Calls**:
- `getTrips(scheduleId, params)` - GET /operator-dispatcher/trip-schedule/{id}/trip?status=&date=&orderBy=asc
- `updateTrip(scheduleId, tripId, data)` - PUT /operator-dispatcher/trip-schedule/{id}/trip/{tripId}

## 📁 File Structure

```
src/
├── pages/
│   └── operator/
│       ├── OperatorDashboard.jsx     (Dashboard overview)
│       ├── Routes.jsx                (Routes management - To implement)
│       ├── Stations.jsx              (Stations management - To implement)
│       ├── Prices.jsx                (Trip prices management - To implement)
│       └── Schedules.jsx             (Schedules + stops + trips - To implement)
│
├── api/
│   └── operator.js                   (14 API endpoints)
│
└── components/
    └── layouts/
        └── DashboardLayout.jsx       (Updated with operator navigation)
```

## 🔌 API Endpoints

**`src/api/operator.js` - 14 Endpoints**:

```javascript
// Routes (3)
getRoutes(params)           // GET /company-admin-operator/route
createRoute(data)           // POST /company-admin-operator/route
updateRoute(routeId, data)  // PUT /company-admin-operator/route/{id}

// Stations (2)
getStations(params)         // GET /company-admin-operator/station
createStation(data)         // POST /company-admin-operator/station

// Trip Prices (4)
getTripPrices(params)                    // GET /company-admin-operator/trip-price-template
createTripPrice(data)                    // POST /company-admin-operator/trip-price-template
updateTripPrice(priceId, data)           // PUT /company-admin-operator/trip-price-template/{id}
deleteTripPrice(priceId)                 // DELETE /company-admin-operator/trip-price-template/{id}

// Trip Schedules (4)
getTripSchedules(params)                 // GET /operator-dispatcher/trip-schedule
createTripSchedule(data)                 // POST /operator-dispatcher/trip-schedule
updateTripSchedule(scheduleId, data)     // PUT /operator-dispatcher/trip-schedule/{id}
deleteTripSchedule(scheduleId)           // DELETE /operator-dispatcher/trip-schedule/{id}

// Stopping Points (3)
getStoppingPoints(scheduleId)                                      // GET /operator-dispatcher/trip-schedule/{id}/stopping-point
createStopp(scheduleId, data)                              // POST /operator-dispatcher/trip-schedule/{id}/stopping-point
updateStoppingPoint(scheduleId, stoppingPointId, data)             // PUT /operator-dispatcher/trip-schedule/{id}/stopping-point/{tripStopTemplateId}

// Trips (2)
getTrips(scheduleId, params)                         // GET /operator-dispatcher/trip-schedule/{id}/trip
updateTrip(scheduleId, tripId, data)                 // PUT /operator-dispatcher/trip-schedule/{id}/trip/{tripId}

// Auth (1)
operatorSignUp(data)        // POST /company-admin-operator/sign-up
```

## 🔒 Authorization

- Role: `operator`
- StaffProfileRole: `dispatcher`
- Redirect after login: `/operator/dashboard`

## ✅ Completion Status

| Feature | Status |
|---|---|
| API Endpoints | ✅ Done |
| Dashboard | ✅ Done |
| Routes Management | 🚧 To implement |
| Stations Management | 🚧 To implement |
| Trip Prices Management | 🚧 To implement |
| Trip Schedules Management | 🚧 To implement |
| Sidebar Navigation | ✅ Done |
| Login/Redirect | ✅ Done |

## 🚀 Next Steps

1. Implement Routes Management page (`/operator/routes`)
2. Implement Stations Management page (`/operator/stations`)
3. Implement Trip Prices Management page (`/operator/prices`)
4. Implement Trip Schedules Management page (`/operator/schedules`) with sub-pages for:
   - Stopping Points
   - Trips
5. Test all API integrations
6. Deploy to dev branch
