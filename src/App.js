import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { Toaster } from "react-hot-toast";
import { ToastProvider } from "./context/ToastContext";
import Toast from "./components/Toast";
import { CallProvider } from "./components/call/CallContext";
import Home from "./pages/Home";

// Auth & Public
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import StripeConnectCallback from "./pages/stripe/StripeConnectCallback";
import PaymentResult from "./pages/customer/PaymentResult";

// Layouts
import DashboardLayout from "./components/layouts/DashboardLayout";
import MainLayout from "./components/layouts/MainLayout";
import PrivateRoute from "./components/PrivateRoute";

// Customer Pages
import Booking from "./pages/customer/Booking";
import CustomerMyTickets from "./pages/customer/MyTickets";
import CustomerMyCoupons from "./pages/customer/MyCoupons";
import CustomerMyPaymentMethods from "./pages/customer/MyPaymentMethods";
import TicketDetail from "./pages/customer/TicketDetail";
import Profile from "./pages/customer/Profile";
import RoutesPage from "./pages/customer/Routes";
import Contact from "./pages/Contact";
import Companies from "./pages/customer/Companies";
import Promotions from "./pages/customer/Promotions";

// Driver Pages
import DriverDashboard from "./pages/driver/DriverDashboard";
import DriverProfile from "./pages/driver/DriverProfile";
import TripDetail from "./pages/driver/TripDetail";

// Company Pages
import CompanyDashboard from "./pages/company/CompanyDashboard";
import Vehicles from "./pages/company/Vehicles";
import Drivers from "./pages/company/Drivers";
import Staff from "./pages/company/Staff";
import CompanyProfile from "./pages/company/CompanyProfile";
import CompanyPayments from "./pages/company/Payments";

// Operator Pages
import OperatorDashboard from "./pages/operator/OperatorDashboard";
import OperatorRoutes from "./pages/operator/Routes";
import Stations from "./pages/operator/Stations";
import Prices from "./pages/operator/Prices";
import OperatorSchedules from "./pages/operator/Schedules";
import StoppingPoints from "./pages/operator/StoppingPoints";
import Trips from "./pages/operator/Trips";

// Company Support Pages
import SupportTickets from "./pages/company-support/SupportTickets";
import SupportCoupons from "./pages/company-support/SupportCoupons";

// Super Admin Pages
import SuperAdminDashboard from "./pages/super-admin/SuperAdminDashboard";
import BusCompanies from "./pages/super-admin/BusCompanies";

function App() {
  return (    
    <ToastProvider>
      <Toast />
      <Toaster
        position="top-right"
        reverseOrder={false}
        gutter={10}
        toastOptions={{
          duration: 3600,
          style: {
            border: "1px solid rgba(226, 232, 240, 0.95)",
            borderRadius: "10px",
            boxShadow: "0 18px 48px rgba(15, 23, 42, 0.14)",
            color: "#0f172a",
            fontSize: "14px",
            fontWeight: 700,
            padding: "12px 14px",
          },
          success: {
            duration: 3200,
            iconTheme: {
              primary: "#059669",
              secondary: "#ecfdf5",
            },
          },
          error: {
            duration: 5500,
            iconTheme: {
              primary: "#dc2626",
              secondary: "#fef2f2",
            },
          },
        }}
      />

      <CallProvider>
        <BrowserRouter>
          <Routes>
          {/* Public (No Navbar/Footer) */}
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/register" element={<Register />} />
          <Route path="/company-signup" element={<Navigate to="/register?type=company" replace />} />
          <Route path="/stripe/connect/callback" element={<StripeConnectCallback />} />
          <Route
            path="/payment-result"
            element={
              <PrivateRoute>
                <PaymentResult />
              </PrivateRoute>
            }
          />
          
          {/* Ticket Detail (Standalone Boarding Pass) */}
          <Route
            path="/profile/tickets/:ticketId"
            element={
              <PrivateRoute>
                <TicketDetail />
              </PrivateRoute>
            }
          />
          <Route
            path="/my-tickets/:ticketId"
            element={
              <PrivateRoute>
                <TicketDetail />
              </PrivateRoute>
            }
          />

          {/* Main Layout (Home & Customer Pages) */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/routes" element={<RoutesPage />} />
            <Route path="/companies" element={<Companies />} />
            <Route path="/promotions" element={<Promotions />} />
            <Route path="/contact" element={<Contact />} />
            
            {/* Customer */}
            <Route path="/booking/:tripId" element={<Booking />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/profile/tickets" element={<CustomerMyTickets />} />
            <Route path="/profile/coupons" element={<CustomerMyCoupons />} />
            <Route path="/profile/payment-methods" element={<CustomerMyPaymentMethods />} />
            <Route path="/my-tickets" element={<Navigate to="/profile/tickets" replace />} />
            <Route path="/my-coupons" element={<Navigate to="/profile/coupons" replace />} />
            <Route path="/my-payment-methods" element={<Navigate to="/profile/payment-methods" replace />} />
          </Route>

          {/* Company Support */}
          <Route
            path="/company-support"
            element={
              <PrivateRoute>
                <Navigate to="/company-support/tickets" replace />
              </PrivateRoute>
            }
          />
          <Route
            path="/company-support/tickets"
            element={
              <PrivateRoute>
                <SupportTickets />
              </PrivateRoute>
            }
          />
          <Route
            path="/company-support/coupons"
            element={
              <PrivateRoute>
                <SupportCoupons />
              </PrivateRoute>
            }
          />

          {/* Dashboard Layout */}
          <Route element={<DashboardLayout />}>

            {/* Driver */}
            <Route path="/driver" element={<Navigate to="/driver/dashboard" replace />} />
            <Route path="/driver/dashboard" element={<DriverDashboard />} />
            <Route path="/driver/trip/:tripId" element={<TripDetail />} />
            <Route path="/driver/profile" element={<DriverProfile />} />

            {/* Company */}
            <Route path="/company" element={<Navigate to="/company/dashboard" replace />} />
            <Route path="/company/dashboard" element={<CompanyDashboard />} />
            <Route path="/company/vehicles" element={<Vehicles />} />
            <Route path="/company/drivers" element={<Drivers />} />
            <Route path="/company/staff" element={<Staff />} />
            <Route path="/company/payments" element={<CompanyPayments />} />
            <Route path="/company/profile" element={<CompanyProfile />} />

            {/* Operator */}
            <Route path="/operator" element={<Navigate to="/operator/dashboard" replace />} />
            <Route path="/operator/dashboard" element={<OperatorDashboard />} />
            <Route path="/operator/routes" element={<OperatorRoutes />} />
            <Route path="/operator/stations" element={<Stations />} />
            <Route path="/operator/prices" element={<Prices />} />
            <Route path="/operator/schedules" element={<OperatorSchedules />} />
            <Route path="/operator/schedules/:scheduleId/stopping-points" element={<StoppingPoints />} />
            <Route path="/operator/schedules/:scheduleId/trips" element={<Trips />} />

            {/* Super Admin */}
            <Route path="/super-admin" element={<Navigate to="/super-admin/dashboard" replace />} />
            <Route path="/super-admin/dashboard" element={<SuperAdminDashboard />} />
            <Route path="/super-admin/companies" element={<BusCompanies />} />

          </Route>

          {/* 404 */}
          <Route
            path="*"
            element={
              <div className="flex h-screen flex-col items-center justify-center">
                <h1 className="mb-4 text-6xl font-bold text-red-500">404</h1>
                <p className="mb-6 text-xl font-medium text-gray-600">
                  Không tìm thấy trang
                </p>
                <a
                  href="/"
                  className="rounded-lg bg-primary px-6 py-2 font-bold text-white hover:bg-primary/90"
                >
                  Về trang chủ
                </a>
              </div>
            }
          />
          </Routes>
        </BrowserRouter>
      </CallProvider>
    </ToastProvider>
  );
}

export default App;
