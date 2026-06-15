import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import api from "../utils/api";
import { CATEGORY_OPTIONS, TABLE_BASED } from "../utils/categories";

const STATUS_LABEL = {
  pending: "Хүлээгдэж буй",
  confirmed: "Баталгаажсан",
  cancelled: "Цуцлагдсан",
  completed: "Дууссан",
};

function parseNumber(value, fallback = 0) {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
}

export default function AdminPage() {
  const { user, canManagePlaces } = useAuth();
  const nav = useNavigate();
  const [params] = useSearchParams();

  const [places, setPlaces] = useState([]);
  const [placeId, setPlaceId] = useState("");
  const [place, setPlace] = useState(null);
  const [services, setServices] = useState([]);
  const [staffs, setStaffs] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [bookingStatus, setBookingStatus] = useState("all");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [highlightBookingId, setHighlightBookingId] = useState("");
  const [savingPlace, setSavingPlace] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const [serviceForm, setServiceForm] = useState({
    name: "",
    duration: 30,
    price: 0,
  });
  const [staffForm, setStaffForm] = useState({
    name: "",
    role: "barber",
    profileImage: "",
  });
  const [tableForm, setTableForm] = useState({
    name: "",
    type: "regular",
    row: "A",
    col: 1,
    capacity: 4,
  });

  const loadPlace = useCallback(async (id) => {
    setErr("");
    setMsg("");
    try {
      const { data } = await api.get(`/places/${id}`);
      setPlace(data.data);
      setServices(data.data.services || []);
      setStaffs(data.data.staffs || []);
    } catch (error) {
      setErr(
        error.response?.data?.message || "Админ мэдээлэл ачаалж чадсангүй",
      );
    }
  }, []);

  const loadBookings = useCallback(
    async (id = placeId, status = bookingStatus) => {
      if (!id) return;
      setBookingLoading(true);
      try {
        const query = new URLSearchParams({ placeId: id });
        if (status !== "all") query.set("status", status);
        const { data } = await api.get(`/bookings/admin?${query.toString()}`);
        setBookings(data.data || []);
      } catch {
        setBookings([]);
      }
      setBookingLoading(false);
    },
    [placeId, bookingStatus],
  );

  useEffect(() => {
    if (!user || !canManagePlaces) {
      nav("/");
      return;
    }

    (async () => {
      try {
        const { data } = await api.get("/places/mine");
        const ownedPlaces = data.data || [];
        setPlaces(ownedPlaces);
        if (ownedPlaces[0]) setPlaceId(ownedPlaces[0]._id);
      } catch (error) {
        setPlaces([]);
        setErr(
          error.response?.data?.message || "Админ мэдээлэл ачаалж чадсангүй",
        );
      }
    })();
  }, [user, canManagePlaces, nav]);

  // check for booking query param to auto-focus a booking (from notifications)
  useEffect(() => {
    const bookingParam = params.get("booking");
    if (bookingParam) setHighlightBookingId(bookingParam);
  }, [params]);

  useEffect(() => {
    if (!placeId) return;
    loadPlace(placeId);
  }, [placeId, loadPlace]);

  useEffect(() => {
    if (!placeId) return;
    loadBookings(placeId, bookingStatus);
  }, [placeId, bookingStatus, loadBookings]);

  // after bookings load, if highlightBookingId exists, scroll to and highlight it
  useEffect(() => {
    if (!highlightBookingId) return;
    const el = document.getElementById(`booking-${highlightBookingId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      // clear highlight after a short time
      const t = setTimeout(() => setHighlightBookingId(""), 6000);
      return () => clearTimeout(t);
    }
  }, [highlightBookingId, bookings]);

  const savePlace = async () => {
    if (!place) return;
    setSavingPlace(true);
    setErr("");
    setMsg("");

    try {
      const payload = {
        name: place.name,
        category: place.category,
        description: place.description,
        address: place.address,
        phone: place.phone,
        location: {
          lat: parseNumber(place.location?.lat),
          lng: parseNumber(place.location?.lng),
        },
        images: place.images || [],
        tables: isTableBasedPlace ? place.tables || [] : [],
      };

      await api.put(`/places/${place._id}`, payload);
      await loadPlace(place._id);
      setMsg("Газрын мэдээлэл амжилттай хадгалагдлаа");
    } catch (error) {
      setErr(error.response?.data?.message || "Хадгалах үед алдаа гарлаа");
    }

    setSavingPlace(false);
  };

  const addService = async () => {
    if (!place) return;
    try {
      await api.post("/services", {
        placeId: place._id,
        name: serviceForm.name,
        duration: parseNumber(serviceForm.duration, 30),
        price: parseNumber(serviceForm.price, 0),
      });
      setServiceForm({ name: "", duration: 30, price: 0 });
      loadPlace(place._id);
    } catch (error) {
      setErr(error.response?.data?.message || "Үйлчилгээ нэмэхэд алдаа гарлаа");
    }
  };

  const removeService = async (id) => {
    try {
      await api.delete(`/services/${id}`);
      loadPlace(place._id);
    } catch (error) {
      setErr(
        error.response?.data?.message || "Үйлчилгээ устгахад алдаа гарлаа",
      );
    }
  };

  const addStaff = async () => {
    if (!place) return;
    try {
      await api.post("/staff", {
        placeId: place._id,
        name: staffForm.name,
        role: staffForm.role,
        profileImage: staffForm.profileImage,
      });
      setStaffForm({ name: "", role: "barber", profileImage: "" });
      loadPlace(place._id);
    } catch (error) {
      setErr(error.response?.data?.message || "Ажилтан нэмэхэд алдаа гарлаа");
    }
  };

  const removeStaff = async (id) => {
    try {
      await api.delete(`/staff/${id}`);
      loadPlace(place._id);
    } catch (error) {
      setErr(error.response?.data?.message || "Ажилтан устгахад алдаа гарлаа");
    }
  };

  const addTable = () => {
    if (!place || !isTableBasedPlace) return;
    setPlace({
      ...place,
      tables: [...(place.tables || []), { ...tableForm, _id: `${Date.now()}` }],
    });
    setTableForm({ name: "", type: "regular", row: "A", col: 1, capacity: 4 });
  };

  const removeTable = (id) => {
    if (!isTableBasedPlace) return;
    setPlace({
      ...place,
      tables: (place.tables || []).filter((table) => table._id !== id),
    });
  };

  const categoryOptions = useMemo(
    () => CATEGORY_OPTIONS.filter((item) => item.value !== "all"),
    [],
  );
  const isTableBasedPlace = useMemo(
    () => TABLE_BASED.includes(place?.category),
    [place?.category],
  );

  const confirmBooking = async (id) => {
    try {
      await api.put(`/bookings/${id}/confirm`);
      loadBookings();
    } catch (error) {
      setErr(error.response?.data?.message || "Захиалга батлахад алдаа гарлаа");
    }
  };

  const rejectBooking = async (id) => {
    try {
      await api.put(`/bookings/${id}/reject`);
      loadBookings();
    } catch (error) {
      setErr(
        error.response?.data?.message || "Захиалга татгалзахад алдаа гарлаа",
      );
    }
  };

  const markPaid = async (id) => {
    try {
      await api.put(`/bookings/${id}/paid`);
      loadBookings();
    } catch (error) {
      setErr(
        error.response?.data?.message || "Төлбөр тэмдэглэхэд алдаа гарлаа",
      );
    }
  };

  const completeBooking = async (id) => {
    try {
      await api.put(`/bookings/${id}/complete`);
      loadBookings();
    } catch (error) {
      setErr(
        error.response?.data?.message ||
          "Дууссан төлөвт шилжүүлэхэд алдаа гарлаа",
      );
    }
  };

  const cancelBooking = async (id) => {
    if (!window.confirm("Энэ захиалгыг цуцлах уу?")) return;
    try {
      await api.put(`/bookings/${id}/cancel`);
      loadBookings();
    } catch (error) {
      setErr(error.response?.data?.message || "Захиалга цуцлахад алдаа гарлаа");
    }
  };

  if (!place) {
    return (
      <div style={{ padding: 24, color: "var(--muted)" }}>
        Админ хэсэг ачаалж байна...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 20px" }}>
      <div style={{ marginBottom: 18 }}>
        <h1 style={{ fontSize: 26 }}>Owner/Admin Dashboard</h1>
        <div style={{ color: "var(--muted)", fontSize: 13 }}>
          Газар, зураг, үйлчилгээ, ажилтан, ширээ, захиалгын удирдлага
        </div>
      </div>

      <div
        style={{
          marginBottom: 12,
          display: "flex",
          gap: 8,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <label style={{ marginBottom: 0 }}>Газар сонгох</label>
        <select
          className="input"
          style={{ width: 360 }}
          value={placeId}
          onChange={(e) => setPlaceId(e.target.value)}
        >
          {places.map((item) => (
            <option key={item._id} value={item._id}>
              {item.name}
            </option>
          ))}
        </select>
      </div>

      {msg ? (
        <div style={{ marginBottom: 10, color: "var(--green)", fontSize: 13 }}>
          {msg}
        </div>
      ) : null}
      {err ? (
        <div style={{ marginBottom: 10, color: "var(--red)", fontSize: 13 }}>
          {err}
        </div>
      ) : null}

      <div
        style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 18 }}
      >
        <div className="card">
          <h3 style={{ marginBottom: 12 }}>Газарын мэдээлэл</h3>
          <div style={{ display: "grid", gap: 10 }}>
            <input
              className="input"
              value={place.name || ""}
              onChange={(e) => setPlace({ ...place, name: e.target.value })}
              placeholder="Нэр"
            />
            <select
              className="input"
              value={place.category || "salon"}
              onChange={(e) => {
                const nextCategory = e.target.value;
                setPlace({
                  ...place,
                  category: nextCategory,
                  tables: TABLE_BASED.includes(nextCategory)
                    ? place.tables || []
                    : [],
                });
              }}
            >
              {categoryOptions.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
            <input
              className="input"
              value={place.address || ""}
              onChange={(e) => setPlace({ ...place, address: e.target.value })}
              placeholder="Хаяг"
            />
            <input
              className="input"
              value={place.phone || ""}
              onChange={(e) => setPlace({ ...place, phone: e.target.value })}
              placeholder="Утас"
            />
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 8,
              }}
            >
              <input
                className="input"
                value={place.location?.lat || ""}
                onChange={(e) =>
                  setPlace({
                    ...place,
                    location: { ...place.location, lat: e.target.value },
                  })
                }
                placeholder="lat"
              />
              <input
                className="input"
                value={place.location?.lng || ""}
                onChange={(e) =>
                  setPlace({
                    ...place,
                    location: { ...place.location, lng: e.target.value },
                  })
                }
                placeholder="lng"
              />
            </div>
            <textarea
              className="input"
              rows={3}
              value={place.description || ""}
              onChange={(e) =>
                setPlace({ ...place, description: e.target.value })
              }
              placeholder="Тайлбар"
              style={{ resize: "vertical" }}
            />
            <button
              className="btn btn-primary"
              onClick={savePlace}
              disabled={savingPlace}
            >
              {savingPlace ? "Хадгалж байна..." : "Мэдээлэл хадгалах"}
            </button>
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: 12 }}>Зураг (URL)</h3>
          <div style={{ display: "grid", gap: 8 }}>
            {(place.images || []).map((image, index) => (
              <div key={index} style={{ display: "flex", gap: 8 }}>
                <input
                  className="input"
                  value={image}
                  onChange={(e) => {
                    const next = [...(place.images || [])];
                    next[index] = e.target.value;
                    setPlace({ ...place, images: next });
                  }}
                />
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() =>
                    setPlace({
                      ...place,
                      images: (place.images || []).filter(
                        (_, idx) => idx !== index,
                      ),
                    })
                  }
                >
                  Устгах
                </button>
              </div>
            ))}
            <button
              className="btn btn-outline"
              onClick={() =>
                setPlace({ ...place, images: [...(place.images || []), ""] })
              }
            >
              + Зураг нэмэх
            </button>
          </div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 18,
          marginTop: 18,
        }}
      >
        <div className="card">
          <h3 style={{ marginBottom: 12 }}>Үйлчилгээ</h3>
          <div style={{ display: "grid", gap: 8, marginBottom: 12 }}>
            {services.map((service) => (
              <div
                key={service._id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  padding: "8px 10px",
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>
                    {service.name}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--muted)" }}>
                    {service.duration} мин • ₮
                    {(service.price || 0).toLocaleString()}
                  </div>
                </div>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => removeService(service._id)}
                >
                  Устгах
                </button>
              </div>
            ))}
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            <input
              className="input"
              placeholder="Үйлчилгээний нэр"
              value={serviceForm.name}
              onChange={(e) =>
                setServiceForm({ ...serviceForm, name: e.target.value })
              }
            />
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 8,
              }}
            >
              <input
                className="input"
                type="number"
                value={serviceForm.duration}
                onChange={(e) =>
                  setServiceForm({ ...serviceForm, duration: e.target.value })
                }
                placeholder="минут"
              />
              <input
                className="input"
                type="number"
                value={serviceForm.price}
                onChange={(e) =>
                  setServiceForm({ ...serviceForm, price: e.target.value })
                }
                placeholder="үнэ"
              />
            </div>
            <button className="btn btn-primary" onClick={addService}>
              Үйлчилгээ нэмэх
            </button>
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: 12 }}>Ажилтан</h3>
          <div style={{ display: "grid", gap: 8, marginBottom: 12 }}>
            {staffs.map((staff) => (
              <div
                key={staff._id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  padding: "8px 10px",
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>
                    {staff.name}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--muted)" }}>
                    {staff.role}
                  </div>
                </div>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => removeStaff(staff._id)}
                >
                  Устгах
                </button>
              </div>
            ))}
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            <input
              className="input"
              placeholder="Нэр"
              value={staffForm.name}
              onChange={(e) =>
                setStaffForm({ ...staffForm, name: e.target.value })
              }
            />
            <input
              className="input"
              placeholder="Role (barber, host, waiter...)"
              value={staffForm.role}
              onChange={(e) =>
                setStaffForm({ ...staffForm, role: e.target.value })
              }
            />
            <input
              className="input"
              placeholder="Profile image URL"
              value={staffForm.profileImage}
              onChange={(e) =>
                setStaffForm({ ...staffForm, profileImage: e.target.value })
              }
            />
            <button className="btn btn-primary" onClick={addStaff}>
              Ажилтан нэмэх
            </button>
          </div>
        </div>
      </div>

      {isTableBasedPlace ? (
        <div className="card" style={{ marginTop: 18 }}>
          <h3 style={{ marginBottom: 12 }}>Ширээ (Billiard / Restaurant)</h3>
          <div style={{ display: "grid", gap: 8, marginBottom: 12 }}>
            {(place.tables || []).map((table) => (
              <div
                key={table._id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  padding: "8px 10px",
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>
                    {table.name}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--muted)" }}>
                    {table.type} • {table.row}-{table.col} • {table.capacity}{" "}
                    хүн
                  </div>
                </div>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => removeTable(table._id)}
                >
                  Устгах
                </button>
              </div>
            ))}
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
              gap: 8,
            }}
          >
            <input
              className="input"
              placeholder="Нэр"
              value={tableForm.name}
              onChange={(e) =>
                setTableForm({ ...tableForm, name: e.target.value })
              }
            />
            <select
              className="input"
              value={tableForm.type}
              onChange={(e) =>
                setTableForm({ ...tableForm, type: e.target.value })
              }
            >
              <option value="regular">regular</option>
              <option value="vip">vip</option>
              <option value="hall">hall</option>
            </select>
            <input
              className="input"
              placeholder="Row"
              value={tableForm.row}
              onChange={(e) =>
                setTableForm({ ...tableForm, row: e.target.value })
              }
            />
            <input
              className="input"
              type="number"
              placeholder="Col"
              value={tableForm.col}
              onChange={(e) =>
                setTableForm({
                  ...tableForm,
                  col: parseNumber(e.target.value, 1),
                })
              }
            />
            <input
              className="input"
              type="number"
              placeholder="Capacity"
              value={tableForm.capacity}
              onChange={(e) =>
                setTableForm({
                  ...tableForm,
                  capacity: parseNumber(e.target.value, 2),
                })
              }
            />
          </div>
          <div style={{ marginTop: 10 }}>
            <button className="btn btn-outline" onClick={addTable}>
              + Ширээ локал нэмэх
            </button>
            <span
              style={{ marginLeft: 10, fontSize: 12, color: "var(--muted)" }}
            >
              Ширээ өөрчлөлтөө хадгалахын тулд дээрх "Мэдээлэл хадгалах" товч
              дарна.
            </span>
          </div>
        </div>
      ) : null}

      <div className="card" style={{ marginTop: 18 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            marginBottom: 12,
            flexWrap: "wrap",
          }}
        >
          <h3>Захиалга удирдлага</h3>
          <select
            className="input"
            style={{ width: 180 }}
            value={bookingStatus}
            onChange={(e) => setBookingStatus(e.target.value)}
          >
            <option value="all">Бүх төлөв</option>
            <option value="pending">Хүлээгдэж буй</option>
            <option value="confirmed">Баталгаажсан</option>
            <option value="cancelled">Цуцлагдсан</option>
            <option value="completed">Дууссан</option>
          </select>
        </div>

        {bookingLoading ? (
          <div style={{ color: "var(--muted)", fontSize: 13 }}>
            Захиалга ачаалж байна...
          </div>
        ) : bookings.length === 0 ? (
          <div style={{ color: "var(--muted)", fontSize: 13 }}>
            Энэ газарт захиалга байхгүй байна.
          </div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {bookings.map((booking) => (
              <div
                id={`booking-${booking._id}`}
                key={booking._id}
                style={{
                  border:
                    booking._id === highlightBookingId
                      ? "2px solid var(--teal)"
                      : "1px solid var(--border)",
                  borderRadius: 10,
                  padding: 12,
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  alignItems: "flex-start",
                  flexWrap: "wrap",
                  boxShadow:
                    booking._id === highlightBookingId
                      ? "0 6px 20px rgba(34,197,94,0.06)"
                      : "none",
                }}
              >
                <div style={{ minWidth: 260, flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>
                    {booking.userId?.name} •{" "}
                    {booking.userId?.phone || "утасгүй"}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--muted)",
                      marginTop: 3,
                    }}
                  >
                    {new Date(booking.datetime).toLocaleString("mn-MN")} •{" "}
                    {booking.placeId?.name || place.name}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--muted)",
                      marginTop: 3,
                    }}
                  >
                    Үйлчилгээ: {booking.serviceId?.name || "-"}
                    {booking.staffId
                      ? ` • Ажилтан: ${booking.staffId.name}`
                      : ""}
                    {booking.tableId ? " • Ширээ сонгосон" : ""}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--muted)",
                      marginTop: 3,
                    }}
                  >
                    Төлөв: {STATUS_LABEL[booking.status]} • Төлбөр:{" "}
                    {booking.paymentStatus}
                  </div>

                  {/* Review display */}
                  {(booking.review || booking.rating) && (
                    <div
                      style={{
                        marginTop: 10,
                        paddingTop: 8,
                        borderTop: "1px dashed var(--border)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <strong style={{ fontSize: 13 }}>Үнэлгээ:</strong>
                        <span style={{ color: "#F59E0B", fontWeight: 700 }}>
                          {booking.rating || 0} / 5
                        </span>
                      </div>
                      {booking.review ? (
                        <div
                          style={{
                            marginTop: 6,
                            color: "var(--muted)",
                            fontSize: 13,
                          }}
                        >
                          {booking.review}
                        </div>
                      ) : null}
                      {booking.reviewedAt ? (
                        <div
                          style={{
                            marginTop: 6,
                            fontSize: 11,
                            color: "var(--muted)",
                          }}
                        >
                          {new Date(booking.reviewedAt).toLocaleString("mn-MN")}
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {booking.status === "pending" ? (
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => confirmBooking(booking._id)}
                    >
                      Accept
                    </button>
                  ) : null}
                  {booking.status === "pending" ? (
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => rejectBooking(booking._id)}
                    >
                      Reject
                    </button>
                  ) : null}
                  {booking.status === "confirmed" &&
                  booking.paymentStatus !== "paid" ? (
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => markPaid(booking._id)}
                    >
                      Mark paid
                    </button>
                  ) : null}
                  {booking.status === "confirmed" ? (
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => completeBooking(booking._id)}
                    >
                      Mark completed
                    </button>
                  ) : null}
                  {["pending", "confirmed"].includes(booking.status) ? (
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => cancelBooking(booking._id)}
                    >
                      Cancel
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
