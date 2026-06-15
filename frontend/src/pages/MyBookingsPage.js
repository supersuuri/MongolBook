import { useCallback, useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import api from "../utils/api";
import {
  BilliardIcon,
  ClipboardIcon,
  ChairIcon,
  LipstickIcon,
  PinIcon,
  RestaurantIcon,
  ResortIcon,
  ScissorsIcon,
  UserIcon,
  ClockIcon,
  QuestionIcon,
} from "../components/UiIcons";

const STATUS_LABEL = {
  pending: "Хүлээгдэж буй",
  confirmed: "Баталгаажсан",
  cancelled: "Цуцлагдсан",
  completed: "Дууссан",
};
const STATUS_CLASS = {
  pending: "badge-pending",
  confirmed: "badge-confirmed",
  cancelled: "badge-cancelled",
  completed: "badge-completed",
};

export default function MyBookingsPage() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [tab, setTab] = useState("all");
  const [loading, setLoading] = useState(true);
  const [reviewDraft, setReviewDraft] = useState({});
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setErr("");
    try {
      const { data } = await api.get("/bookings/my");
      setBookings(data.data || []);
    } catch (error) {
      setBookings([]);
      setErr(
        error.response?.data?.message || "Захиалгуудыг ачаалахад алдаа гарлаа",
      );
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!user) {
      nav("/login");
      return;
    }
    load();
  }, [user, nav, load]);

  const cancel = async (id) => {
    if (!window.confirm("Захиалгыг цуцлах уу?")) return;
    try {
      await api.put(`/bookings/${id}/cancel`);
      load();
    } catch (error) {
      setErr(error.response?.data?.message || "Захиалга цуцлахад алдаа гарлаа");
    }
  };

  const submitReview = async (bookingId) => {
    const draft = reviewDraft[bookingId] || {};
    try {
      await api.post(`/bookings/${bookingId}/review`, {
        rating: draft.rating,
        review: draft.review,
      });
      setReviewDraft((prev) => {
        const next = { ...prev };
        delete next[bookingId];
        return next;
      });
      load();
    } catch (error) {
      setErr(
        error.response?.data?.message || "Сэтгэгдэл илгээхэд алдаа гарлаа",
      );
    }
  };

  const filtered =
    tab === "all"
      ? bookings
      : tab === "active"
        ? bookings.filter((b) => ["pending", "confirmed"].includes(b.status))
        : bookings.filter((b) => ["cancelled", "completed"].includes(b.status));

  const fmt = (dt) =>
    new Date(dt).toLocaleString("mn-MN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

  const CAT_ICONS = {
    salon: ChairIcon,
    barber: ScissorsIcon,
    beauty: LipstickIcon,
    billiard: BilliardIcon,
    restaurant: RestaurantIcon,
    resort: ResortIcon,
    other: PinIcon,
  };

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: "32px 20px" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 6 }}>
          Миний захиалгууд
        </h1>
        <p style={{ color: "var(--muted)", fontSize: 14 }}>
          Таны захиалсан үйлчилгээнүүдийн жагсаалт болон төлөв.
        </p>
        {err ? (
          <div style={{ marginTop: 8, color: "var(--red)", fontSize: 13 }}>
            {err}
          </div>
        ) : null}
      </div>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: 4,
          marginBottom: 20,
          borderBottom: "1px solid var(--border)",
          paddingBottom: 0,
        }}
      >
        {[
          ["all", "Бүгд"],
          ["active", "Идэвхтэй"],
          ["past", "Өнгөрсөн"],
        ].map(([k, l]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            style={{
              padding: "10px 20px",
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 500,
              color: tab === k ? "var(--text)" : "var(--muted)",
              borderBottom:
                tab === k ? "2px solid var(--blue)" : "2px solid transparent",
              marginBottom: -1,
            }}
          >
            {l} {k === "all" ? `(${bookings.length})` : ""}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div
          style={{ textAlign: "center", padding: 40, color: "var(--muted)" }}
        >
          Ачаалж байна...
        </div>
      ) : filtered.length === 0 ? (
        <div
          style={{ textAlign: "center", padding: 60, color: "var(--muted)" }}
        >
          <div
            style={{
              display: "inline-flex",
              color: "var(--blue)",
              marginBottom: 12,
            }}
          >
            <ClipboardIcon size={40} />
          </div>
          <div>Захиалга байхгүй байна</div>
          <Link
            to="/"
            className="btn btn-primary"
            style={{ marginTop: 16, display: "inline-flex" }}
          >
            Захиалга хийх
          </Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map((b) => (
            <div
              key={b._id}
              className="card"
              style={{
                display: "flex",
                gap: 16,
                alignItems: "flex-start",
                padding: 16,
              }}
            >
              {/* Image */}
              <div
                style={{
                  width: 100,
                  height: 80,
                  borderRadius: 8,
                  overflow: "hidden",
                  background: "var(--surface)",
                  flexShrink: 0,
                }}
              >
                {b.placeId?.images?.[0] ? (
                  <img
                    src={b.placeId.images[0]}
                    alt=""
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 28,
                    }}
                  >
                    {(() => {
                      const CatIcon = CAT_ICONS[b.placeId?.category] || PinIcon;
                      return <CatIcon size={28} />;
                    })()}
                  </div>
                )}
              </div>

              {/* Info */}
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 6,
                  }}
                >
                  <span className={`badge ${STATUS_CLASS[b.status]}`}>
                    ● {STATUS_LABEL[b.status]}
                  </span>
                  <span style={{ fontSize: 12, color: "var(--muted)" }}>
                    #{b._id.slice(-4).toUpperCase()}
                  </span>
                </div>
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>
                  {b.placeId?.name}
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: 16,
                    fontSize: 13,
                    color: "var(--muted)",
                  }}
                >
                  <span
                    style={{
                      display: "inline-flex",
                      gap: 4,
                      alignItems: "center",
                    }}
                  >
                    <ScissorsIcon size={14} /> {b.serviceId?.name}
                  </span>
                  <span
                    style={{
                      display: "inline-flex",
                      gap: 4,
                      alignItems: "center",
                    }}
                  >
                    <ClockIcon size={14} /> {fmt(b.datetime)}
                  </span>
                  {b.staffId && (
                    <span
                      style={{
                        display: "inline-flex",
                        gap: 4,
                        alignItems: "center",
                      }}
                    >
                      <UserIcon size={14} /> {b.staffId.name}
                    </span>
                  )}
                  {b.tableId && (
                    <span
                      style={{
                        display: "inline-flex",
                        gap: 4,
                        alignItems: "center",
                      }}
                    >
                      <RestaurantIcon size={14} /> Ширээ
                    </span>
                  )}
                </div>
                {b.totalPrice > 0 && (
                  <div
                    style={{
                      marginTop: 6,
                      fontSize: 14,
                      fontWeight: 600,
                      color: "var(--blue)",
                    }}
                  >
                    ₮{b.totalPrice.toLocaleString()}
                  </div>
                )}
                {b.status === "completed" && b.rating ? (
                  <div
                    style={{
                      marginTop: 8,
                      fontSize: 12,
                      color: "var(--muted)",
                    }}
                  >
                    Үнэлгээ: {b.rating}/5 {b.review ? `• ${b.review}` : ""}
                  </div>
                ) : null}
                {b.status === "completed" && !b.rating ? (
                  <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "110px 1fr",
                        gap: 8,
                      }}
                    >
                      <input
                        type="number"
                        min="1"
                        max="5"
                        className="input"
                        placeholder="Rating 1-5"
                        value={reviewDraft[b._id]?.rating || ""}
                        onChange={(e) =>
                          setReviewDraft((prev) => ({
                            ...prev,
                            [b._id]: {
                              ...(prev[b._id] || {}),
                              rating: e.target.value,
                            },
                          }))
                        }
                      />
                      <input
                        className="input"
                        placeholder="Сэтгэгдэл"
                        value={reviewDraft[b._id]?.review || ""}
                        onChange={(e) =>
                          setReviewDraft((prev) => ({
                            ...prev,
                            [b._id]: {
                              ...(prev[b._id] || {}),
                              review: e.target.value,
                            },
                          }))
                        }
                      />
                    </div>
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => submitReview(b._id)}
                    >
                      Үнэлгээ өгөх
                    </button>
                  </div>
                ) : null}
              </div>

              {/* Actions */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  flexShrink: 0,
                }}
              >
                <Link
                  to={`/place/${b.placeId?._id}`}
                  className="btn btn-outline btn-sm"
                >
                  Дэлгэрэнгүй
                </Link>
                {["pending", "confirmed"].includes(b.status) && (
                  <button
                    onClick={() => cancel(b._id)}
                    className="btn btn-danger btn-sm"
                  >
                    Цуцлах
                  </button>
                )}
                {b.status === "cancelled" && (
                  <Link
                    to={`/book/${b.placeId?._id}`}
                    className="btn btn-primary btn-sm"
                  >
                    Дахин захиалах
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Help */}
      <div
        style={{
          marginTop: 32,
          padding: 20,
          borderRadius: 12,
          border: "1px dashed var(--border)",
          textAlign: "center",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            color: "var(--blue)",
            marginBottom: 8,
          }}
        >
          <QuestionIcon size={24} />
        </div>
        <div style={{ color: "var(--muted)", fontSize: 13 }}>
          Захиалгатай холбоотой асуудал гарсан уу?
        </div>
        <a
          href="tel:99001122"
          style={{ color: "var(--blue)", fontSize: 13, textDecoration: "none" }}
        >
          Тусламжийн төвтэй холбогдох
        </a>
      </div>
    </div>
  );
}
