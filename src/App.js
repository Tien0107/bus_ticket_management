import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { Toaster } from "react-hot-toast";
import { ToastProvider } from "./context/ToastContext";
import Toast from "./components/Toast";
import { CallProvider } from "./components/call/CallContext";
import Home from "./pages/Home";


import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import StripeConnectCallback from "./pages/stripe/StripeConnectCallback";
import StripeConnectSuccess from "./pages/stripe/StripeConnectSuccess";
import PaymentResult from "./pages/customer/PaymentResult";


import DashboardLayout from "./components/layouts/DashboardLayout";
import MainLayout from "./components/layouts/MainLayout";
import PrivateRoute from "./components/PrivateRoute";
import { getRedirectUrl } from "./pages/login/authUtils";


import Booking from "./pages/customer/Booking";
import CustomerMyTickets from "./pages/customer/MyTickets";
import CustomerMyPaymentMethods from "./pages/customer/MyPaymentMethods";
import TicketDetail from "./pages/customer/TicketDetail";
import Profile from "./pages/customer/Profile";
import RoutesPage from "./pages/customer/Routes";
import Contact from "./pages/Contact";
import Companies from "./pages/customer/Companies";
import Promotions from "./pages/customer/Promotions";


import DriverDashboard from "./pages/driver/DriverDashboard";
import DriverProfile from "./pages/driver/DriverProfile";
import TripDetail from "./pages/driver/TripDetail";


import CompanyDashboard from "./pages/company/CompanyDashboard";
import Vehicles from "./pages/company/Vehicles";
import Drivers from "./pages/company/Drivers";
import Staff from "./pages/company/Staff";
import CompanyProfile from "./pages/company/CompanyProfile";
import CompanyPayments from "./pages/company/Payments";


import OperatorDashboard from "./pages/operator/OperatorDashboard";
import OperatorRoutes from "./pages/operator/Routes";
import Stations from "./pages/operator/Stations";
import Prices from "./pages/operator/Prices";
import OperatorSchedules from "./pages/operator/Schedules";
import StoppingPoints from "./pages/operator/StoppingPoints";
import Trips from "./pages/operator/Trips";
import OperatorProfile from "./pages/operator/OperatorProfile";


import SupportTickets from "./pages/company-support/SupportTickets";
import SupportCoupons from "./pages/company-support/SupportCoupons";
import SupportProfile from "./pages/company-support/SupportProfile";


import SuperAdminDashboard from "./pages/super-admin/SuperAdminDashboard";
import BusCompanies from "./pages/super-admin/BusCompanies";

function RootRedirect() {
  const token = localStorage.getItem("token")?.trim();
  if (!token) {
    return <Home />;
  }

  let user = {};
  try {
    const raw = localStorage.getItem("user");
    if (raw) {
      user = JSON.parse(raw);
    }
  } catch {
    user = {};
  }

  const target = getRedirectUrl(user);


  if (!target || target === "/") {
    return <Home />;
  }

  return <Navigate to={target} replace />;
}

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
            padding: "12px 14px"
          },
          success: {
            duration: 3200,
            iconTheme: {
              primary: "#059669",
              secondary: "#ecfdf5"
            }
          },
          error: {
            duration: 5500,
            iconTheme: {
              primary: "#dc2626",
              secondary: "#fef2f2"
            }
          }
        }} />
      

      <CallProvider>
        <BrowserRouter>
          <Routes>
          {}
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/register" element={<Register />} />
          <Route path="/company-signup" element={<Navigate to="/register?type=company" replace />} />
          <Route path="/stripe/connect/callback" element={<StripeConnectCallback />} />
          <Route path="/stripe/connect/success" element={<StripeConnectSuccess />} />
          <Route
              path="/payment-result"
              element={
              <PrivateRoute>
                <PaymentResult />
              </PrivateRoute>
              } />
            
          
          {}
          <Route
              path="/profile/tickets/:ticketId"
              element={
              <PrivateRoute>
                <TicketDetail />
              </PrivateRoute>
              } />
            
          <Route
              path="/my-tickets/:ticketId"
              element={
              <PrivateRoute>
                <TicketDetail />
              </PrivateRoute>
              } />
            

          {}
          <Route element={<MainLayout />}>
            <Route path="/" element={<RootRedirect />} />
            <Route path="/routes" element={<RoutesPage />} />
            <Route path="/companies" element={<Companies />} />
            <Route path="/promotions" element={<Promotions />} />
            <Route path="/contact" element={<Contact />} />
            
            {}
            <Route path="/booking/:tripId" element={<Booking />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/profile/tickets" element={<CustomerMyTickets />} />
            <Route path="/profile/payment-methods" element={<CustomerMyPaymentMethods />} />
            <Route path="/my-tickets" element={<Navigate to="/profile/tickets" replace />} />
            <Route path="/my-payment-methods" element={<Navigate to="/profile/payment-methods" replace />} />
          </Route>

          {}
          <Route
              path="/company-support"
              element={
              <PrivateRoute>
                <Navigate to="/company-support/tickets" replace />
              </PrivateRoute>
              } />
            
          <Route
              path="/company-support/tickets"
              element={
              <PrivateRoute>
                <SupportTickets />
              </PrivateRoute>
              } />
            
          <Route
              path="/company-support/coupons"
              element={
              <PrivateRoute>
                <SupportCoupons />
              </PrivateRoute>
              } />
            
          <Route
              path="/company-support/profile"
              element={
              <PrivateRoute>
                <SupportProfile />
              </PrivateRoute>
              } />
            

          {}
          <Route element={<DashboardLayout />}>

            {}
            <Route path="/driver" element={<Navigate to="/driver/dashboard" replace />} />
            <Route path="/driver/dashboard" element={<DriverDashboard />} />
            <Route path="/driver/trip/:tripId" element={<TripDetail />} />
            <Route path="/driver/profile" element={<DriverProfile />} />

            {}
            <Route path="/company" element={<Navigate to="/company/dashboard" replace />} />
            <Route path="/company/dashboard" element={<CompanyDashboard />} />
            <Route path="/company/vehicles" element={<Vehicles />} />
            <Route path="/company/drivers" element={<Drivers />} />
            <Route path="/company/staff" element={<Staff />} />
            <Route path="/company/payments" element={<CompanyPayments />} />
            <Route path="/company/profile" element={<CompanyProfile />} />
            <Route path="/company/staff-profile" element={<Navigate to="/company/profile" replace />} />

            {}
            <Route path="/operator" element={<Navigate to="/operator/dashboard" replace />} />
            <Route path="/operator/dashboard" element={<OperatorDashboard />} />
            <Route path="/operator/profile" element={<OperatorProfile />} />
            <Route path="/operator/routes" element={<OperatorRoutes />} />
            <Route path="/operator/stations" element={<Stations />} />
            <Route path="/operator/prices" element={<Prices />} />
            <Route path="/operator/schedules" element={<OperatorSchedules />} />
            <Route path="/operator/schedules/:scheduleId/stopping-points" element={<StoppingPoints />} />
            <Route path="/operator/schedules/:scheduleId/trips" element={<Trips />} />

            {}
            <Route path="/super-admin" element={<Navigate to="/super-admin/dashboard" replace />} />
            <Route path="/super-admin/dashboard" element={<SuperAdminDashboard />} />
            <Route path="/super-admin/companies" element={<BusCompanies />} />

          </Route>

          {}
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
                  className="rounded-lg bg-primary px-6 py-2 font-bold text-white hover:bg-primary/90">
                  
                  Về trang chủ
                </a>
              </div>
              } />
            
          </Routes>
        </BrowserRouter>
      </CallProvider>
    </ToastProvider>);

}

export default App;