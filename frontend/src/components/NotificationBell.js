import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import api from "../utils/api";
import { BellIcon, CalendarIcon, MoneyIcon, StarIcon } from "./UiIcons";

function typeIcon(type) {
  if (type === "payment") return MoneyIcon;
  if (type === "review") return StarIcon;
  return CalendarIcon;
}

function targetRoute(type, userRole, relatedId) {
  const bookingQuery = relatedId ? `?booking=${relatedId}` : "";
  if (type === "payment" || type === "review") return `/admin${bookingQuery}`;
  return userRole === "owner"
    ? `/admin${bookingQuery}`
    : `/my-bookings${bookingQuery}`;
}

export default function NotificationBell({ user }) {
  const nav = useNavigate();
  const panelRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const sortedNotifications = useMemo(
    () =>
      [...notifications].sort(
        (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt),
      ),
    [notifications],
  );

  useEffect(() => {
    if (!user) return undefined;

    const token = localStorage.getItem("token");
    const socket = io("http://localhost:5000", {
      transports: ["websocket"],
      auth: { token },
    });

    socket.on("notification:new", (payload) => {
      setNotifications((prev) => [payload, ...prev]);
      setUnreadCount((prev) => prev + 1);
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);

  useEffect(() => {
    if (!user) return;

    (async () => {
      setLoading(true);
      try {
        const { data } = await api.get("/notifications");
        setNotifications(data.data || []);
        setUnreadCount(data.unreadCount || 0);
      } catch {
        setNotifications([]);
        setUnreadCount(0);
      }
      setLoading(false);
    })();
  }, [user]);

  useEffect(() => {
    const onClickOutside = (event) => {
      if (!panelRef.current) return;
      if (!panelRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const handleNotificationClick = async (item) => {
    if (!item.isRead) {
      try {
        await api.patch(`/notifications/${item._id}/read`);
        setNotifications((prev) =>
          prev.map((n) => (n._id === item._id ? { ...n, isRead: true } : n)),
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch {
        // Keep navigation working even if read status fails
      }
    }

    setOpen(false);
    nav(targetRoute(item.type, user.role, item.relatedId));
  };

  const markAllRead = async () => {
    try {
      await api.patch("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // No-op
    }
  };

  if (!user) return null;

  return (
    <div ref={panelRef} style={{ position: "relative", zIndex: 2600 }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="btn btn-outline btn-sm"
        style={{ position: "relative" }}
        aria-label="Notifications"
      >
        <span style={{ display: "inline-flex" }}>
          <BellIcon />
        </span>
        {unreadCount > 0 ? (
          <span
            style={{
              position: "absolute",
              top: -6,
              right: -6,
              minWidth: 18,
              height: 18,
              borderRadius: 999,
              background: "#e11d48",
              color: "#fff",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 11,
              fontWeight: 700,
              padding: "0 5px",
              border: "1px solid rgba(255,255,255,0.2)",
            }}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          style={{
            position: "absolute",
            top: 42,
            right: 0,
            zIndex: 2700,
            width: 360,
            borderRadius: 12,
            border: "1px solid var(--border)",
            background: "rgba(16, 20, 27, 0.98)",
            boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "10px 12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: "1px solid var(--border)",
            }}
          >
            <strong style={{ fontSize: 14 }}>Мэдэгдэл</strong>
            <button
              type="button"
              onClick={markAllRead}
              style={{
                border: "none",
                background: "transparent",
                color: "var(--blue)",
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              Бүгдийг уншсан
            </button>
          </div>

          <div style={{ maxHeight: 360, overflowY: "auto" }}>
            {loading ? (
              <div style={{ padding: 16, color: "var(--muted)", fontSize: 13 }}>
                Ачаалж байна...
              </div>
            ) : sortedNotifications.length === 0 ? (
              <div style={{ padding: 16, color: "var(--muted)", fontSize: 13 }}>
                Одоогоор мэдэгдэл алга
              </div>
            ) : (
              sortedNotifications.map((item) => {
                const TypeIcon = typeIcon(item.type);
                return (
                  <button
                    key={item._id}
                    type="button"
                    onClick={() => handleNotificationClick(item)}
                    style={{
                      width: "100%",
                      border: "none",
                      background: item.isRead
                        ? "transparent"
                        : "rgba(37,99,235,0.12)",
                      color: "var(--text)",
                      textAlign: "left",
                      padding: "12px 12px",
                      borderBottom: "1px solid var(--border)",
                      cursor: "pointer",
                      display: "grid",
                      gridTemplateColumns: "24px 1fr",
                      gap: 10,
                      alignItems: "start",
                    }}
                  >
                    <span style={{ color: "var(--blue)", marginTop: 2 }}>
                      <TypeIcon size={18} />
                    </span>
                    <span>
                      <div style={{ fontSize: 13, lineHeight: 1.4 }}>
                        {item.message}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: "var(--muted)",
                          marginTop: 4,
                        }}
                      >
                        {new Date(item.createdAt).toLocaleString("mn-MN")}
                      </div>
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
