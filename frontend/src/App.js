import { BrowserRouter, Routes, Route, Navigate, Link } from "react-router-dom";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import HomePage from "./pages/HomePage";
import BusinessPage from "./pages/BusinessPage";
import BookingPage from "./pages/BookingPage";
import MyBookingsPage from "./pages/MyBookingsPage";
import AdminPage from "./pages/AdminPage";
import ProfilePage from "./pages/ProfilePage";
import { LoginPage, RegisterPage } from "./pages/AuthPages";
import { PinIcon, UserIcon } from "./components/UiIcons";
import NotificationBell from "./components/NotificationBell";
import "./index.css";

function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
}

function AdminRoute({ children }) {
  const { user, canManagePlaces } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (!canManagePlaces) return <Navigate to="/" />;
  return children;
}

function Layout() {
  const { user } = useAuth();

  return (
    <>
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 2500,
          background: "rgba(13,17,23,0.95)",
          backdropFilter: "blur(8px)",
          borderBottom: "1px solid var(--border)",
          padding: "0 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: 56,
        }}
      >
        <Link
          to="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            textDecoration: "none",
          }}
        >
          <span style={{ display: "inline-flex", color: "var(--blue)" }}>
            <PinIcon />
          </span>
          <span style={{ fontWeight: 800, fontSize: 18, color: "var(--text)" }}>
            MongolBook
          </span>
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <NotificationBell user={user} />
          {user ? (
            <Link
              to="/profile"
              className="btn btn-outline btn-sm"
              style={{ textDecoration: "none" }}
            >
              <span style={{ display: "inline-flex" }}>
                <UserIcon />
              </span>
              Профайл
            </Link>
          ) : (
            <Link
              to="/login"
              className="btn btn-outline btn-sm"
              style={{ textDecoration: "none" }}
            >
              Нэвтрэх
            </Link>
          )}
        </div>
      </div>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/place/:id" element={<BusinessPage />} />
        <Route path="/business/:id" element={<BusinessPage />} />
        <Route
          path="/book/:id"
          element={
            <PrivateRoute>
              <BookingPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/my-bookings"
          element={
            <PrivateRoute>
              <MyBookingsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <ProfilePage />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminPage />
            </AdminRoute>
          }
        />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Layout />
      </BrowserRouter>
    </AuthProvider>
  );
}
