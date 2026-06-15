import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import api from "../utils/api";
import { CATEGORY_META, getBookingMode } from "../utils/categories";
import { CheckIcon, PinIcon } from "../components/UiIcons";

const STEP_TITLES = ["Цаг сонгох", "Сонголт", "Баталгаажуулах"];

function pad(n) {
  return String(n).padStart(2, "0");
}

function toDateInput(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function monthLabel(date) {
  return new Intl.DateTimeFormat("mn-MN", {
    month: "long",
    year: "numeric",
  }).format(date);
}

function buildCalendarGrid(viewDate) {
  const first = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
  const startOffset = first.getDay();
  const daysInMonth = new Date(
    viewDate.getFullYear(),
    viewDate.getMonth() + 1,
    0,
  ).getDate();
  const cells = [];

  for (let i = 0; i < startOffset; i += 1) cells.push(null);
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(viewDate.getFullYear(), viewDate.getMonth(), day));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function addDaysInput(dateInput, days) {
  const next = new Date(dateInput);
  next.setDate(next.getDate() + days);
  return toDateInput(next);
}

function diffDays(startInput, endInput) {
  const start = new Date(startInput);
  const end = new Date(endInput);
  const diff = Math.round((end - start) / (24 * 60 * 60 * 1000));
  return Math.max(1, diff);
}

function roomCapacityTone(capacity) {
  if (capacity === 2) return { bg: "rgba(37,99,235,0.18)", fg: "#CFE0FF" };
  if (capacity === 3) return { bg: "rgba(13,148,136,0.18)", fg: "#C9FFF7" };
  if (capacity === 4) return { bg: "rgba(245,158,11,0.18)", fg: "#FFE2B4" };
  return { bg: "rgba(255,255,255,0.08)", fg: "#E8EEF9" };
}

export default function BookingPage() {
  const { id } = useParams();
  const [sp] = useSearchParams();
  const nav = useNavigate();
  const { user } = useAuth();

  const [place, setPlace] = useState(null);
  const [services, setServices] = useState([]);
  const [staffs, setStaffs] = useState([]);
  const [slots, setSlots] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [bookedTargetIds, setBookedTargetIds] = useState({
    staffIds: [],
    tableIds: [],
  });

  const [serviceId, setServiceId] = useState(sp.get("serviceId") || "");
  const [staffId, setStaffId] = useState("");
  const [tableId, setTableId] = useState("");
  const [date, setDate] = useState(toDateInput(new Date()));
  const [checkInDate, setCheckInDate] = useState(toDateInput(new Date()));
  const [checkOutDate, setCheckOutDate] = useState(
    addDaysInput(toDateInput(new Date()), 1),
  );
  const [rangeFocus, setRangeFocus] = useState("in");
  const [time, setTime] = useState("");
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [monthView, setMonthView] = useState(new Date());
  const availabilityRequestId = useRef(0);
  const bookedTargetsRequestId = useRef(0);

  useEffect(() => {
    api.get(`/places/${id}`).then(({ data }) => {
      const p = data.data;
      setPlace(p);
      setServices(p.services || []);
      setStaffs(p.staffs || []);
      if (!serviceId && p.services?.[0]) setServiceId(p.services[0]._id);
    });
  }, [id, serviceId]);

  const mode = useMemo(() => getBookingMode(place?.category), [place]);
  const category = CATEGORY_META[place?.category] || {
    icon: PinIcon,
    label: place?.category,
  };
  const CategoryIcon = category.icon;

  const selectedService = services.find((s) => s._id === serviceId);
  const selectedServiceDuration = Number(selectedService?.duration) || 0;

  useEffect(() => {
    if (mode === "overnight") return;
    setSlots([]);
    setTime("");
    setBookedTargetIds({ staffIds: [], tableIds: [] });
  }, [serviceId, selectedServiceDuration, mode]);

  useEffect(() => {
    if (!place || !date) return;
    if (mode !== "overnight" && !selectedServiceDuration) return;

    const requestId = ++availabilityRequestId.current;

    const q = new URLSearchParams({
      placeId: place._id,
      date: mode === "overnight" ? checkInDate : date,
    });
    if (serviceId) q.set("serviceId", serviceId);
    q.set("durationMinutes", String(selectedServiceDuration || 0));
    if (mode === "staff" && staffId) q.set("staffId", staffId);
    if (mode === "table" && tableId) q.set("tableId", tableId);

    api
      .get(`/bookings/availability?${q.toString()}`)
      .then(({ data }) => {
        if (requestId !== availabilityRequestId.current) return;
        if (mode === "overnight") {
          setRooms(data.data || []);
          setSlots([]);
        } else {
          setSlots(data.data || []);
          setRooms([]);
        }
      })
      .catch(() => {
        if (requestId !== availabilityRequestId.current) return;
        setSlots([]);
        setRooms([]);
      });
  }, [
    place,
    date,
    checkInDate,
    staffId,
    tableId,
    mode,
    serviceId,
    selectedServiceDuration,
  ]);

  useEffect(() => {
    if (!place || !date) return;
    if (mode !== "overnight" && !selectedServiceDuration) return;

    const requestId = ++bookedTargetsRequestId.current;

    if (mode === "overnight") {
      // availability for rooms already returned in previous call
      setBookedTargetIds({ staffIds: [], tableIds: [] });
      return;
    }

    if (!time) return;

    const datetime = `${date}T${time}:00`;
    const durationMinutes = selectedServiceDuration || 0;
    api
      .get(
        `/bookings/booked-targets?placeId=${place._id}&datetime=${datetime}&serviceId=${serviceId}&durationMinutes=${durationMinutes}`,
      )
      .then(({ data }) => {
        if (requestId !== bookedTargetsRequestId.current) return;
        setBookedTargetIds(data.data || { staffIds: [], tableIds: [] });
      })
      .catch(() => {
        if (requestId !== bookedTargetsRequestId.current) return;
        setBookedTargetIds({ staffIds: [], tableIds: [] });
      });
  }, [place, date, time, serviceId, selectedServiceDuration, mode]);

  const overnightNights = useMemo(
    () => (mode === "overnight" ? diffDays(checkInDate, checkOutDate) : 0),
    [mode, checkInDate, checkOutDate],
  );

  const groupedTables = useMemo(() => {
    if (!place?.tables?.length) return [];
    return [...place.tables].sort((a, b) =>
      `${a.row}${a.col}`.localeCompare(`${b.row}${b.col}`),
    );
  }, [place]);

  const sortedRooms = useMemo(() => {
    if (!rooms.length) return [];
    return [...rooms].sort((a, b) => {
      const capacityDiff = (a.capacity || 0) - (b.capacity || 0);
      if (capacityDiff !== 0) return capacityDiff;
      return String(a.name).localeCompare(String(b.name));
    });
  }, [rooms]);

  const tableRows = useMemo(() => {
    const rows = groupedTables.reduce((acc, t) => {
      if (!acc[t.row]) acc[t.row] = [];
      acc[t.row].push(t);
      return acc;
    }, {});
    return Object.entries(rows);
  }, [groupedTables]);

  const canSubmit =
    !!serviceId &&
    !!date &&
    (mode === "overnight" ? !!tableId && overnightNights > 0 : !!time) &&
    (mode !== "staff" || !!staffId) &&
    (mode !== "table" || !!tableId);

  const handleCalendarPick = (iso) => {
    if (mode === "overnight") {
      if (rangeFocus === "in") {
        setCheckInDate(iso);
        if (new Date(iso) >= new Date(checkOutDate)) {
          setCheckOutDate(addDaysInput(iso, 1));
        }
        setRangeFocus("out");
        return;
      }

      if (new Date(iso) <= new Date(checkInDate)) {
        setCheckOutDate(addDaysInput(checkInDate, 1));
      } else {
        setCheckOutDate(iso);
      }
      setRangeFocus("in");
      return;
    }

    setDate(iso);
    setTime("");
  };

  const isOvernightRangeSelected = (iso) =>
    mode === "overnight" &&
    new Date(iso) > new Date(checkInDate) &&
    new Date(iso) < new Date(checkOutDate);

  const submit = async () => {
    if (!user) {
      nav("/login");
      return;
    }

    setLoading(true);
    setMsg("");

    try {
      if (mode === "overnight") {
        await api.post("/bookings", {
          placeId: id,
          serviceId,
          tableId: tableId || undefined,
          datetime: checkInDate,
          nights: overnightNights,
          note,
        });
      } else {
        await api.post("/bookings", {
          placeId: id,
          serviceId,
          staffId: mode === "staff" ? staffId : undefined,
          tableId: mode === "table" ? tableId : undefined,
          datetime: `${date}T${time}:00`,
          note,
        });
      }
      nav("/my-bookings");
    } catch (e) {
      setMsg(e.response?.data?.message || "Захиалга хийхэд алдаа гарлаа");
    }

    setLoading(false);
  };

  const calendarGrid = useMemo(() => buildCalendarGrid(monthView), [monthView]);

  if (!place) {
    return (
      <div style={{ padding: 24, color: "var(--muted)" }}>Ачаалж байна...</div>
    );
  }

  return (
    <div
      style={{
        minHeight: "calc(100vh - 56px)",
        padding: "22px 18px 28px",
        background:
          "radial-gradient(circle at top, rgba(37,99,235,0.16), transparent 30%), linear-gradient(180deg, #0B1020 0%, #0D1117 100%)",
      }}
    >
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <div style={{ marginBottom: 18 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 16,
              alignItems: "flex-start",
              flexWrap: "wrap",
            }}
          >
            <div>
              <div
                style={{
                  color: "var(--teal)",
                  fontSize: 13,
                  fontWeight: 600,
                  marginBottom: 6,
                }}
              >
                <span style={{ display: "inline-flex", marginRight: 6 }}>
                  <CategoryIcon size={12} />
                </span>
                {category.label}
              </div>
              <h1 style={{ margin: 0, fontSize: 32, letterSpacing: "-0.03em" }}>
                Захиалга хийх
              </h1>
              <div
                style={{ color: "var(--muted)", fontSize: 14, marginTop: 6 }}
              >
                {place.name}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: 8,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <button
                className="btn btn-outline btn-sm"
                onClick={() => nav(-1)}
                style={{ background: "rgba(255,255,255,0.02)" }}
              >
                ← Буцах
              </button>
              <div
                style={{
                  padding: "8px 12px",
                  borderRadius: 999,
                  background: "rgba(37,99,235,0.12)",
                  border: "1px solid rgba(37,99,235,0.3)",
                  color: "#9CC0FF",
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                {mode === "staff"
                  ? "Staff booking"
                  : mode === "table"
                    ? "Table booking"
                    : "Basic booking"}
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 14,
            marginBottom: 18,
            flexWrap: "wrap",
          }}
        >
          {STEP_TITLES.map((label, index) => {
            const active =
              index === 0 ||
              (index === 1 && (mode === "staff" || mode === "table")) ||
              (index === 2 && !!canSubmit);
            return (
              <div
                key={label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  flex: "1 1 160px",
                }}
              >
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: "50%",
                    display: "grid",
                    placeItems: "center",
                    fontWeight: 800,
                    background: active ? "var(--blue)" : "#1A2234",
                    color: "#fff",
                    boxShadow: active
                      ? "0 0 0 6px rgba(37,99,235,0.12)"
                      : "none",
                  }}
                >
                  {index + 1}
                </div>
                <div>
                  <div
                    style={{
                      color: active ? "#fff" : "var(--muted)",
                      fontWeight: 600,
                      fontSize: 13,
                    }}
                  >
                    {label}
                  </div>
                  <div
                    style={{
                      width: 120,
                      height: 2,
                      marginTop: 8,
                      background: active ? "var(--blue)" : "#263145",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) 320px",
            gap: 18,
            alignItems: "start",
          }}
        >
          <div style={{ display: "grid", gap: 18 }}>
            <div
              className="card"
              style={{
                background: "rgba(22,27,34,0.92)",
                borderColor: "rgba(255,255,255,0.06)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 16,
                }}
              >
                <div>
                  <div
                    style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}
                  >
                    Алхам 1: Өдөр болон цаг
                  </div>
                  <div style={{ color: "var(--muted)", fontSize: 13 }}>
                    Календарь дээр өдөр сонгоод, дараа нь боломжтой цагийг
                    товшино.
                  </div>
                </div>
                <div style={{ color: "var(--muted)", fontSize: 12 }}>
                  {monthLabel(monthView)}
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(0, 1fr) 360px",
                  gap: 18,
                }}
              >
                <div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 14,
                    }}
                  >
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() =>
                        setMonthView(
                          new Date(
                            monthView.getFullYear(),
                            monthView.getMonth() - 1,
                            1,
                          ),
                        )
                      }
                    >
                      ‹
                    </button>
                    <div style={{ fontWeight: 700, fontSize: 16 }}>
                      {monthLabel(monthView)}
                    </div>
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() =>
                        setMonthView(
                          new Date(
                            monthView.getFullYear(),
                            monthView.getMonth() + 1,
                            1,
                          ),
                        )
                      }
                    >
                      ›
                    </button>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
                      gap: 8,
                      marginBottom: 10,
                      color: "var(--muted)",
                      fontSize: 12,
                      textAlign: "center",
                    }}
                  >
                    {["НЯ", "ДА", "МЯ", "ЛХ", "ПҮ", "БА", "БЯ"].map((d) => (
                      <div key={d}>{d}</div>
                    ))}
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
                      gap: 8,
                    }}
                  >
                    {calendarGrid.map((cell, idx) => {
                      const iso = cell ? toDateInput(cell) : null;
                      const isSelected =
                        mode === "overnight"
                          ? iso === checkInDate || iso === checkOutDate
                          : iso === date;
                      const isToday = iso === toDateInput(new Date());
                      const isPast = cell
                        ? cell < new Date(new Date().setHours(0, 0, 0, 0))
                        : false;
                      const inRange = isOvernightRangeSelected(iso);
                      return (
                        <button
                          key={`${iso || "blank"}-${idx}`}
                          disabled={!cell || isPast}
                          onClick={() => {
                            if (!cell) return;
                            handleCalendarPick(iso);
                          }}
                          style={{
                            minHeight: 54,
                            borderRadius: 14,
                            border: `1px solid ${isSelected ? "var(--blue)" : inRange ? "rgba(37,99,235,0.35)" : "#2A3142"}`,
                            background: isSelected
                              ? "rgba(37,99,235,0.2)"
                              : inRange
                                ? "rgba(37,99,235,0.12)"
                                : isToday
                                  ? "rgba(13,148,136,0.12)"
                                  : "#111726",
                            color: !cell || isPast ? "#556" : "var(--text)",
                            opacity: !cell || isPast ? 0.35 : 1,
                            cursor: !cell || isPast ? "not-allowed" : "pointer",
                            padding: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 700,
                            position: "relative",
                          }}
                        >
                          {cell ? cell.getDate() : ""}
                          {isToday && !isSelected && (
                            <span
                              style={{
                                position: "absolute",
                                top: 8,
                                right: 8,
                                width: 7,
                                height: 7,
                                borderRadius: "50%",
                                background: "var(--teal)",
                              }}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div
                  style={{
                    borderLeft: "1px solid rgba(255,255,255,0.06)",
                    paddingLeft: 18,
                  }}
                >
                  <div style={{ fontWeight: 700, marginBottom: 10 }}>
                    Боломжтой цагууд
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                      gap: 10,
                    }}
                  >
                    {slots.map((s) => {
                      const active = time === s.time;
                      return (
                        <button
                          key={s.time}
                          onClick={() => setTime(s.time)}
                          disabled={!s.available}
                          style={{
                            padding: "12px 10px",
                            borderRadius: 14,
                            border: `1px solid ${active ? "var(--blue)" : s.available ? "#273040" : "#242b36"}`,
                            background: active
                              ? "linear-gradient(180deg, rgba(37,99,235,0.55), rgba(37,99,235,0.28))"
                              : s.available
                                ? "#111726"
                                : "#151a23",
                            color: active
                              ? "#fff"
                              : s.available
                                ? "var(--text)"
                                : "#556",
                            fontWeight: 700,
                            cursor: s.available ? "pointer" : "not-allowed",
                            boxShadow: active
                              ? "0 10px 25px rgba(37,99,235,0.2)"
                              : "none",
                          }}
                        >
                          {s.time}
                        </button>
                      );
                    })}
                  </div>
                  {!slots.length && (
                    <div
                      style={{
                        color: "var(--muted)",
                        fontSize: 13,
                        marginTop: 8,
                      }}
                    >
                      {serviceId
                        ? "Цагийн мэдээлэл ачаалж байна..."
                        : "Эхлээд үйлчилгээ сонгоно уу."}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {mode === "staff" && (
              <div
                className="card"
                style={{
                  background: "rgba(22,27,34,0.92)",
                  borderColor: "rgba(255,255,255,0.06)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 12,
                  }}
                >
                  <div>
                    <div
                      style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}
                    >
                      Алхам 2: Мэргэжилтэн сонгох
                    </div>
                    <div style={{ color: "var(--muted)", fontSize: 13 }}>
                      Боломжтой ажилтнаас нэгийг сонгоно.
                    </div>
                  </div>
                  <div style={{ color: "var(--muted)", fontSize: 12 }}>
                    {staffs.length} хүн
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                    gap: 12,
                  }}
                >
                  {staffs.map((st) => {
                    const blocked =
                      bookedTargetIds.staffIds.includes(st._id) && !!time;
                    const active = staffId === st._id;
                    return (
                      <button
                        key={st._id}
                        disabled={blocked}
                        onClick={() => setStaffId(st._id)}
                        style={{
                          textAlign: "left",
                          borderRadius: 18,
                          padding: 14,
                          border: `1px solid ${active ? "var(--blue)" : blocked ? "#3A2A2A" : "#273040"}`,
                          background: active
                            ? "rgba(37,99,235,0.18)"
                            : "#111726",
                          color: "var(--text)",
                          cursor: blocked ? "not-allowed" : "pointer",
                          position: "relative",
                          minHeight: 118,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                          }}
                        >
                          <div
                            style={{
                              width: 46,
                              height: 46,
                              borderRadius: "50%",
                              overflow: "hidden",
                              background: "#20283A",
                              flexShrink: 0,
                            }}
                          >
                            {st.profileImage ? (
                              <img
                                src={st.profileImage}
                                alt={st.name}
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "cover",
                                }}
                              />
                            ) : null}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700 }}>{st.name}</div>
                            <div
                              style={{
                                fontSize: 12,
                                color: "var(--muted)",
                                marginTop: 2,
                              }}
                            >
                              {st.role}
                            </div>
                          </div>
                        </div>
                        <div
                          style={{
                            marginTop: 18,
                            fontSize: 12,
                            color: blocked
                              ? "#D98B8B"
                              : active
                                ? "#A9C7FF"
                                : "var(--muted)",
                          }}
                        >
                          {blocked
                            ? "Захиалагдсан"
                            : active
                              ? "Сонгосон"
                              : "Сонгох"}
                        </div>
                        {active && (
                          <div
                            style={{
                              position: "absolute",
                              top: 12,
                              right: 12,
                              width: 18,
                              height: 18,
                              borderRadius: "50%",
                              background: "var(--blue)",
                              display: "grid",
                              placeItems: "center",
                              color: "#fff",
                              fontSize: 12,
                              fontWeight: 900,
                            }}
                          >
                            <CheckIcon size={12} />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {mode === "table" && (
              <div
                className="card"
                style={{
                  background: "rgba(22,27,34,0.92)",
                  borderColor: "rgba(255,255,255,0.06)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 12,
                  }}
                >
                  <div>
                    <div
                      style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}
                    >
                      Алхам 2: Ширээ сонгох
                    </div>
                    <div style={{ color: "var(--muted)", fontSize: 13 }}>
                      VIP / Hall / Regular схемээс ширээ сонгоно.
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: 10,
                      fontSize: 12,
                      color: "var(--muted)",
                    }}
                  >
                    <span>● Сул</span>
                    <span>● Захиалагдсан</span>
                    <span>● Сонгосон</span>
                  </div>
                </div>

                <div
                  style={{
                    borderRadius: 24,
                    padding: 18,
                    background: "linear-gradient(180deg, #101624, #0D1320)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <div
                    style={{
                      borderRadius: 18,
                      border: "1px dashed rgba(255,255,255,0.08)",
                      padding: 18,
                      minHeight: 360,
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        inset: 18,
                        borderRadius: 14,
                        background:
                          "radial-gradient(circle at center, rgba(37,99,235,0.12), transparent 45%)",
                        pointerEvents: "none",
                      }}
                    />

                    <div
                      style={{
                        position: "relative",
                        zIndex: 1,
                        display: "grid",
                        gap: 18,
                      }}
                    >
                      <div
                        style={{
                          textAlign: "center",
                          color: "var(--muted)",
                          fontSize: 12,
                          letterSpacing: "0.26em",
                        }}
                      >
                        НЭВТРЭХ ХЭСЭГ
                      </div>

                      {tableRows.length ? (
                        tableRows.map(([rowName, rowTables]) => (
                          <div
                            key={rowName}
                            style={{
                              display: "grid",
                              gridTemplateColumns: `repeat(${Math.min(4, rowTables.length)}, minmax(0, 1fr))`,
                              gap: 12,
                              alignItems: "center",
                            }}
                          >
                            <div
                              style={{
                                color: "var(--muted)",
                                fontSize: 12,
                                fontWeight: 700,
                              }}
                            >
                              {rowName}
                            </div>
                            <div style={{ display: "contents" }}>
                              {rowTables.map((tb) => {
                                const blocked =
                                  bookedTargetIds.tableIds.includes(tb._id) &&
                                  !!time;
                                const active = tableId === tb._id;
                                return (
                                  <button
                                    key={tb._id}
                                    disabled={blocked}
                                    onClick={() => setTableId(tb._id)}
                                    style={{
                                      height: 106,
                                      borderRadius: 16,
                                      border: `1px solid ${active ? "var(--blue)" : blocked ? "#402B2B" : "#273040"}`,
                                      background: active
                                        ? "linear-gradient(180deg, rgba(37,99,235,0.48), rgba(37,99,235,0.18))"
                                        : blocked
                                          ? "#151A23"
                                          : "#101522",
                                      color: blocked
                                        ? "#59616F"
                                        : "var(--text)",
                                      cursor: blocked
                                        ? "not-allowed"
                                        : "pointer",
                                      display: "flex",
                                      flexDirection: "column",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      gap: 6,
                                      boxShadow: active
                                        ? "0 16px 30px rgba(37,99,235,0.15)"
                                        : "none",
                                    }}
                                  >
                                    <div
                                      style={{ fontSize: 13, fontWeight: 800 }}
                                    >
                                      {tb.name}
                                    </div>
                                    <div
                                      style={{
                                        fontSize: 11,
                                        color: blocked
                                          ? "#A37D7D"
                                          : "var(--muted)",
                                      }}
                                    >
                                      {tb.type.toUpperCase()} • {tb.capacity}{" "}
                                      хүн
                                    </div>
                                    {active && (
                                      <div
                                        style={{
                                          position: "absolute",
                                          top: 10,
                                          right: 10,
                                          width: 18,
                                          height: 18,
                                          borderRadius: "50%",
                                          background: "var(--blue)",
                                          display: "grid",
                                          placeItems: "center",
                                          color: "#fff",
                                          fontSize: 12,
                                          fontWeight: 900,
                                        }}
                                      >
                                        <CheckIcon size={12} />
                                      </div>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div style={{ color: "var(--muted)", fontSize: 13 }}>
                          Ширээний схем олдсонгүй.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {mode === "overnight" && (
              <div
                className="card"
                style={{
                  background: "rgba(22,27,34,0.92)",
                  borderColor: "rgba(255,255,255,0.06)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 12,
                  }}
                >
                  <div>
                    <div
                      style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}
                    >
                      Алхам 2: Өрөө сонгох
                    </div>
                    <div style={{ color: "var(--muted)", fontSize: 13 }}>
                      Өрөөнүүд нь тухайн өдөр сул эсэхийг шалгана.
                    </div>
                  </div>
                  <div style={{ color: "var(--muted)", fontSize: 12 }}>
                    {rooms.length} өрөө
                  </div>
                </div>

                <div style={{ marginBottom: 12 }}>
                  <label style={{ color: "var(--muted)", fontSize: 13 }}>
                    Check-in / Check-out
                  </label>
                  <div
                    style={{
                      marginTop: 8,
                      display: "grid",
                      gap: 8,
                      flexWrap: "wrap",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setRangeFocus("in")}
                      style={{
                        textAlign: "left",
                        padding: 10,
                        borderRadius: 12,
                        border: `1px solid ${rangeFocus === "in" ? "var(--blue)" : "#273040"}`,
                        background:
                          rangeFocus === "in"
                            ? "rgba(37,99,235,0.15)"
                            : "#0F1720",
                        color: "var(--text)",
                        cursor: "pointer",
                      }}
                    >
                      <div style={{ color: "var(--muted)", fontSize: 12 }}>
                        Check-in
                      </div>
                      <div style={{ fontWeight: 800 }}>{checkInDate}</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRangeFocus("out")}
                      style={{
                        textAlign: "left",
                        padding: 10,
                        borderRadius: 12,
                        border: `1px solid ${rangeFocus === "out" ? "var(--blue)" : "#273040"}`,
                        background:
                          rangeFocus === "out"
                            ? "rgba(37,99,235,0.15)"
                            : "#0F1720",
                        color: "var(--text)",
                        cursor: "pointer",
                      }}
                    >
                      <div style={{ color: "var(--muted)", fontSize: 12 }}>
                        Check-out
                      </div>
                      <div style={{ fontWeight: 800 }}>{checkOutDate}</div>
                    </button>
                    <div
                      style={{
                        padding: 12,
                        borderRadius: 14,
                        background: "rgba(37,99,235,0.12)",
                        border: "1px solid rgba(37,99,235,0.22)",
                        color: "#D7E6FF",
                        fontSize: 13,
                      }}
                    >
                      Календар дээр{" "}
                      {rangeFocus === "in" ? "check-in" : "check-out"} өдрөө
                      сонгоно. Сонгосон хоног: {overnightNights}.
                    </div>
                    {[1, 2, 3, 4, 5, 7].map((days) => (
                      <button
                        key={days}
                        type="button"
                        onClick={() => {
                          const nextCheckOut = addDaysInput(checkInDate, days);
                          setCheckOutDate(nextCheckOut);
                          setRangeFocus("out");
                        }}
                        style={{
                          padding: "8px 12px",
                          borderRadius: 999,
                          border: `1px solid ${overnightNights === days ? "var(--blue)" : "#273040"}`,
                          background:
                            overnightNights === days
                              ? "rgba(37,99,235,0.2)"
                              : "#0F1720",
                          color:
                            overnightNights === days ? "#fff" : "var(--text)",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        {days} хоног
                      </button>
                    ))}
                  </div>
                </div>

                <div
                  style={{
                    borderRadius: 24,
                    padding: 18,
                    background: "linear-gradient(180deg, #101624, #0D1320)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <div style={{ display: "grid", gap: 12 }}>
                    {sortedRooms.length ? (
                      sortedRooms.map((r) => {
                        const active = tableId === r.roomId;
                        const blocked = !r.available;
                        const badge = roomCapacityTone(r.capacity);
                        return (
                          <button
                            key={r.roomId}
                            disabled={blocked}
                            onClick={() => setTableId(r.roomId)}
                            style={{
                              textAlign: "left",
                              borderRadius: 12,
                              padding: 12,
                              border: `1px solid ${active ? "var(--blue)" : blocked ? "#3A2A2A" : "#273040"}`,
                              background: active
                                ? "rgba(37,99,235,0.18)"
                                : "#0F1720",
                              color: "var(--text)",
                              cursor: blocked ? "not-allowed" : "pointer",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <div>
                              <div
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  padding: "4px 10px",
                                  borderRadius: 999,
                                  fontSize: 11,
                                  fontWeight: 800,
                                  background: badge.bg,
                                  color: badge.fg,
                                  marginBottom: 8,
                                }}
                              >
                                {r.capacity} хүний өрөө
                              </div>
                              <div style={{ fontWeight: 800 }}>{r.name}</div>
                              <div
                                style={{
                                  fontSize: 12,
                                  color: "var(--muted)",
                                  marginTop: 4,
                                }}
                              >
                                Check-in / Check-out-оор сул эсэхийг шалгана
                              </div>
                            </div>
                            <div style={{ textAlign: "right" }}>
                              <div style={{ fontWeight: 800 }}>
                                ₮
                                {(
                                  r.price ||
                                  selectedService?.price ||
                                  0
                                ).toLocaleString()}
                              </div>
                              <div
                                style={{
                                  fontSize: 12,
                                  color: blocked ? "#D98B8B" : "var(--muted)",
                                  marginTop: 4,
                                }}
                              >
                                {blocked
                                  ? "Захиалагдсан"
                                  : active
                                    ? "Сонгосон"
                                    : "Сул"}
                              </div>
                            </div>
                          </button>
                        );
                      })
                    ) : (
                      <div style={{ color: "var(--muted)", fontSize: 13 }}>
                        Өрөөнүүд олдсонгүй.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div
              className="card"
              style={{
                background: "rgba(22,27,34,0.92)",
                borderColor: "rgba(255,255,255,0.06)",
              }}
            >
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>
                Тэмдэглэл
              </div>
              <textarea
                className="input"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={4}
                placeholder="Нэмэлт хүсэлт, тайлбар..."
                style={{ resize: "vertical", background: "#111726" }}
              />
            </div>
          </div>

          <div>
            <div
              className="card"
              style={{
                position: "sticky",
                top: 76,
                background: "rgba(22,27,34,0.95)",
                borderColor: "rgba(255,255,255,0.06)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 16,
                }}
              >
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 14,
                    overflow: "hidden",
                    background: "#20283A",
                    flexShrink: 0,
                  }}
                >
                  {(() => {
                    const isBlueCue = /blue\s*cue/i.test(place.name || "");
                    const src = isBlueCue
                      ? "https://static.where-e.com/United_States/Cue-Club-Of-Wisconsin_e116e4e638ace7aa0c3ebe20f1492acf.jpg"
                      : place.images?.[0];
                    return src ? (
                      <img
                        src={src}
                        alt={place.name}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = "/images/blue-cue-club.svg";
                        }}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    ) : null;
                  })()}
                </div>
                <div>
                  <div style={{ fontWeight: 800 }}>{place.name}</div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--muted)",
                      marginTop: 3,
                    }}
                  >
                    {place.address}
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gap: 10,
                  marginBottom: 16,
                  fontSize: 13,
                }}
              >
                <SummaryRow
                  label="Үйлчилгээ"
                  value={selectedService?.name || "—"}
                />
                {mode === "overnight" ? (
                  <>
                    <SummaryRow label="Check-in" value={checkInDate || "—"} />
                    <SummaryRow label="Check-out" value={checkOutDate || "—"} />
                    <SummaryRow
                      label="Хоног"
                      value={`${overnightNights} хоног`}
                    />
                  </>
                ) : (
                  <>
                    <SummaryRow label="Огноо" value={date || "—"} />
                    <SummaryRow label="Цаг" value={time || "—"} />
                  </>
                )}
                {mode === "staff" ? (
                  <SummaryRow
                    label="Мэргэжилтэн"
                    value={staffs.find((s) => s._id === staffId)?.name || "—"}
                  />
                ) : null}
                {mode === "table" ? (
                  <SummaryRow
                    label="Ширээ"
                    value={
                      place.tables?.find((t) => t._id === tableId)?.name || "—"
                    }
                  />
                ) : null}
                {mode === "overnight" ? (
                  <SummaryRow
                    label="Өрөө"
                    value={(() => {
                      const selectedRoom = rooms.find(
                        (r) => r.roomId === tableId,
                      );
                      if (selectedRoom) {
                        return `${selectedRoom.name} (${selectedRoom.capacity} хүний)`;
                      }
                      return (
                        place.tables?.find((t) => t._id === tableId)?.name ||
                        "—"
                      );
                    })()}
                  />
                ) : null}
              </div>

              <div
                style={{
                  padding: 14,
                  borderRadius: 16,
                  background: "rgba(37,99,235,0.12)",
                  border: "1px solid rgba(37,99,235,0.24)",
                  marginBottom: 16,
                }}
              >
                <div
                  style={{ fontSize: 12, color: "#9DB9FF", marginBottom: 4 }}
                >
                  НИЙТ ҮНЭ
                </div>
                <div style={{ fontSize: 28, fontWeight: 900, color: "#fff" }}>
                  ₮
                  {(mode === "overnight"
                    ? (rooms.find((r) => r.roomId === tableId)?.price ||
                        selectedService?.price ||
                        0) * (overnightNights || 1)
                    : selectedService?.price || 0
                  ).toLocaleString()}
                </div>
              </div>

              {msg ? (
                <div
                  style={{
                    color: "var(--red)",
                    fontSize: 13,
                    marginBottom: 12,
                  }}
                >
                  {msg}
                </div>
              ) : null}

              <button
                className="btn btn-primary"
                onClick={submit}
                disabled={!canSubmit || loading}
                style={{ width: "100%", padding: "12px 0" }}
              >
                {loading ? "Илгээж байна..." : "Захиалга баталгаажуулах"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 12,
        padding: "8px 0",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      <span style={{ color: "var(--muted)" }}>{label}</span>
      <span style={{ fontWeight: 700, textAlign: "right" }}>{value}</span>
    </div>
  );
}
