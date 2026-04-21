import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Auth & Public
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";

// Layouts
import DashboardLayout from "./components/layouts/DashboardLayout";

// Customer Pages
import Booking from "./pages/customer/Booking";
import CustomerMyTickets from "./pages/customer/MyTickets";
import CustomerMyCoupons from "./pages/customer/MyCoupons";
import CustomerMyPaymentMethods from "./pages/customer/MyPaymentMethods";
import TicketDetail from "./pages/customer/TicketDetail";

// Driver Pages
import DriverDashboard from "./pages/driver/DriverDashboard";
import TripDetail from "./pages/driver/TripDetail";

// Company Pages
import CompanyDashboard from "./pages/company/CompanyDashboard";
import Vehicles from "./pages/company/Vehicles";
import Schedules from "./pages/company/Schedules";

// Company Support Pages
import SupportRegister from "./pages/company-support/SupportRegister";
import SupportTickets from "./pages/company-support/SupportTickets";
import SupportCoupons from "./pages/company-support/SupportCoupons";

// Super Admin Pages
import SuperAdminDashboard from "./pages/super-admin/SuperAdminDashboard";
import BusCompanies from "./pages/super-admin/BusCompanies";

// import PrivateRoute from "./components/PrivateRoute"; // Sẽ dùng sau

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 1. Public & Customer Routes (Dùng MainLayout hoặc độc lập) */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/company-support/register" element={<SupportRegister />} />

        {/* Customer Routing */}
        <Route path="/booking/:tripId" element={<Booking />} />
        <Route path="my-tickets" element={<CustomerMyTickets />} />
        <Route path="my-coupons" element={<CustomerMyCoupons />} />
        <Route path="my-payment-methods" element={<CustomerMyPaymentMethods />} />
        <Route path="/my-tickets/:ticketId" element={<TicketDetail />} />

        {/* Company Support (Standalone - có sidebar riêng theo Stitch design) */}
        <Route path="/company-support" element={<Navigate to="/company-support/tickets" replace />} />
        <Route path="/company-support/tickets" element={<SupportTickets />} />
        <Route path="/company-support/coupons" element={<SupportCoupons />} />

        {/* 2. Admin & Driver Dashboard Routes (Dùng chung DashboardLayout) */}
        <Route element={<DashboardLayout />}>
          
          {/* Dashboard Tài xế */}
          <Route path="/driver" element={<Navigate to="/driver/dashboard" replace />} />
          <Route path="/driver/dashboard" element={<DriverDashboard />} />
          <Route path="/driver/trip/:tripId" element={<TripDetail />} />

          {/* Dashboard Nhà xe */}
          <Route path="/company" element={<Navigate to="/company/dashboard" replace />} />
          <Route path="/company/dashboard" element={<CompanyDashboard />} />
          <Route path="/company/vehicles" element={<Vehicles />} />
          <Route path="/company/schedules" element={<Schedules />} />

          {/* Dashboard Super Admin */}
          <Route path="/super-admin" element={<Navigate to="/super-admin/dashboard" replace />} />
          <Route path="/super-admin/dashboard" element={<SuperAdminDashboard />} />
          <Route path="/super-admin/companies" element={<BusCompanies />} />
          
        </Route>

        {/* Fallback 404 */}
        <Route path="*" element={
          <div className="flex h-screen flex-col items-center justify-center">
            <h1 className="text-red-500 font-bold text-6xl mb-4">404</h1>
            <p className="text-gray-600 text-xl font-medium mb-6">Không tìm thấy trang</p>
            <a href="/" className="px-6 py-2 bg-primary text-white font-bold rounded-lg hover:bg-primary/90">Về trang chủ</a>
          </div>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
