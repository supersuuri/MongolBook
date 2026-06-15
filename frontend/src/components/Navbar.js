import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { CATEGORY_OPTIONS } from "../utils/categories";
import { PinIcon } from "./UiIcons";

const CATS = CATEGORY_OPTIONS.filter((c) => c.value !== "all");

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();

  return (
    <nav
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        background: "rgba(13,17,23,0.95)",
        backdropFilter: "blur(8px)",
        borderBottom: "1px solid var(--border)",
        padding: "0 24px",
        display: "flex",
        alignItems: "center",
        gap: 24,
        height: 56,
      }}
    >
      {/* Logo */}
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
          <PinIcon size={20} />
        </span>
        <span style={{ fontWeight: 700, fontSize: 18, color: "var(--text)" }}>
          Захиалга
        </span>
      </Link>

      {/* Category nav */}
      <div style={{ display: "flex", gap: 4, flex: 1 }}>
        {CATS.map((c) => {
          const CategoryIcon = c.icon;
          const active = loc.search.includes(c.value);
          return (
            <Link
              key={c.value}
              to={`/?category=${c.value}`}
              style={{
                padding: "6px 14px",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 500,
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: 5,
                color: active ? "var(--text)" : "var(--muted)",
                background: active ? "var(--card)" : "transparent",
                border: "1px solid",
                borderColor: active ? "var(--border)" : "transparent",
              }}
            >
              <CategoryIcon size={14} /> {c.label}
            </Link>
          );
        })}
      </div>

      {/* Right */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {user ? (
          <>
            <Link to="/my-bookings" className="btn btn-outline btn-sm">
              Миний захиалга
            </Link>
            {isAdmin && (
              <Link to="/admin" className="btn btn-outline btn-sm">
                Admin
              </Link>
            )}
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: "var(--blue)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: 14,
                cursor: "pointer",
              }}
              onClick={() => {
                if (window.confirm("Гарах уу?")) logout();
                nav("/");
              }}
            >
              {user.name?.charAt(0).toUpperCase()}
            </div>
          </>
        ) : (
          <>
            <Link to="/login" className="btn btn-outline btn-sm">
              Нэвтрэх
            </Link>
            <Link to="/register" className="btn btn-primary btn-sm">
              Бүртгүүлэх
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
