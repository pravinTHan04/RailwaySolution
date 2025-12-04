import { BrowserRouter, Routes, Route, Navigate, useLocation, Link } from "react-router-dom";
import useAuth from "./auth/useAuth";

import SchedulePage from "./pages/SchedulePage";
import BookingPage from "./pages/BookingPage";
import SearchPage from "./pages/SearchPage";
import PassengerPage from "./pages/PassengerDetailPage";
import PaymentPage from "./pages/PaymentPage";
import TicketPage from "./pages/TicketPage";
import SigninPage from "./pages/SigninPage";
import SignupPage from "./pages/SignupPage";
import ChatBot from "./components/Chatbot";
import Navbar from "./components/Navbar";

import AdminLayout from "./pages/admin/AdminLayout";
import DashboardPage from "./pages/admin/DashboardPage";
import StationsPage from "./pages/admin/StationPage";
import TrainsPage from "./pages/admin/TrainPage";

// User protected route
function ProtectedRoute({ children }) {
  const { user } = useAuth();

  const token = localStorage.getItem("authToken");

  if (!token || !user) {
    return <Navigate to="/" replace />;
  }

  return children;
}

// Admin protected route
function AdminRoute({ children }) {
  const { isAdmin } = useAuth();
  return isAdmin ? children : <Navigate to="/" replace />;
}




function UserLayout({ children }) {
  const { pathname } = useLocation();
  const hideNav = pathname === "/" || pathname === "/signup";

  return (
    <>
      {!hideNav && <Navbar />}  {/* USE NAVBAR HERE */}

      {children}

      {!hideNav && <ChatBot />}
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ---------------- PUBLIC ROUTES ---------------- */}
        <Route path="/" element={<SigninPage />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* ---------------- USER (LOGGED-IN) ROUTES ---------------- */}
        <Route
          path="/schedule"
          element={<ProtectedRoute><UserLayout><SchedulePage /></UserLayout></ProtectedRoute>}
        />

        <Route
          path="/book"
          element={<ProtectedRoute><UserLayout><BookingPage /></UserLayout></ProtectedRoute>}
        />

        <Route
          path="/search"
          element={<ProtectedRoute><UserLayout><SearchPage /></UserLayout></ProtectedRoute>}
        />

        <Route
          path="/passenger"
          element={<ProtectedRoute><UserLayout><PassengerPage /></UserLayout></ProtectedRoute>}
        />

        <Route
          path="/payment"
          element={<ProtectedRoute><UserLayout><PaymentPage /></UserLayout></ProtectedRoute>}
        />

        <Route
          path="/ticket"
          element={<ProtectedRoute><UserLayout><TicketPage /></UserLayout></ProtectedRoute>}
        />

        {/* ---------------- ADMIN ROUTES ---------------- */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="stations" element={<StationsPage />} />
          <Route path="trains" element={<TrainsPage />} />
        </Route>

        {/* Catch unknown URLs */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </BrowserRouter>
  );
}
