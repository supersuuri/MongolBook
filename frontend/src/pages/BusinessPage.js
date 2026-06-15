import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import L from "leaflet";
import api from "../utils/api";
import { CATEGORY_META, getBookingMode } from "../utils/categories";
import { CalendarIcon, PinIcon, StarIcon } from "../components/UiIcons";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

export default function BusinessPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const [place, setPlace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState("");

  useEffect(() => {
    api
      .get(`/places/${id}`)
      .then(({ data }) => {
        setPlace(data.data);
        setSelectedService(data.data?.services?.[0]?._id || "");
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div style={{ padding: 24, color: "var(--muted)" }}>Ачаалж байна...</div>
    );
  }

  if (!place) {
    return (
      <div style={{ padding: 24, color: "var(--red)" }}>
        Газрын мэдээлэл олдсонгүй.
      </div>
    );
  }

  const mode = getBookingMode(place.category);
  const category = CATEGORY_META[place.category] || {
    icon: PinIcon,
    label: place.category,
  };
  const CategoryIcon = category.icon;
  const svc = place.services?.find((s) => s._id === selectedService);

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "20px" }}>
      <div
        style={{
          borderRadius: 16,
          overflow: "hidden",
          background: "var(--card)",
          marginBottom: 20,
        }}
      >
        <div style={{ height: 320, background: "#1C2128" }}>
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
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : null;
          })()}
        </div>
        <div style={{ padding: 16 }}>
          <div style={{ fontSize: 12, color: "var(--teal)", marginBottom: 6 }}>
            <span style={{ display: "inline-flex", marginRight: 6 }}>
              <CategoryIcon size={12} />
            </span>
            {category.label}
          </div>
          <h1 style={{ fontSize: 28, marginBottom: 6 }}>{place.name}</h1>
          <div style={{ color: "var(--muted)", fontSize: 14 }}>
            {place.address}
          </div>
          <div style={{ marginTop: 6, color: "var(--muted)", fontSize: 13 }}>
            <span
              style={{
                display: "inline-flex",
                verticalAlign: "-2px",
                marginRight: 4,
              }}
            >
              <StarIcon size={13} />
            </span>
            {place.rating || 0} ({place.reviewCount || 0} үнэлгээ)
          </div>
        </div>
      </div>

      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20 }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="card">
            <h3 style={{ marginBottom: 12 }}>Үйлчилгээ</h3>
            <div style={{ display: "grid", gap: 10 }}>
              {place.services?.map((s) => (
                <button
                  key={s._id}
                  onClick={() => setSelectedService(s._id)}
                  style={{
                    textAlign: "left",
                    background:
                      selectedService === s._id
                        ? "rgba(37,99,235,0.15)"
                        : "var(--surface)",
                    border: `1px solid ${selectedService === s._id ? "var(--blue)" : "var(--border)"}`,
                    borderRadius: 10,
                    padding: "12px 14px",
                    color: "var(--text)",
                    cursor: "pointer",
                  }}
                >
                  <div style={{ fontWeight: 600 }}>{s.name}</div>
                  <div
                    style={{
                      marginTop: 4,
                      fontSize: 12,
                      color: "var(--muted)",
                    }}
                  >
                    {s.duration} мин • ₮{(s.price || 0).toLocaleString()}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {mode === "staff" && (
            <div className="card">
              <h3 style={{ marginBottom: 12 }}>Ажилтнууд</h3>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                  gap: 10,
                }}
              >
                {place.staffs?.map((st) => (
                  <div
                    key={st._id}
                    style={{
                      border: "1px solid var(--border)",
                      borderRadius: 10,
                      padding: 10,
                    }}
                  >
                    <div
                      style={{ display: "flex", gap: 10, alignItems: "center" }}
                    >
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: "50%",
                          overflow: "hidden",
                          background: "var(--surface)",
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
                        <div style={{ fontWeight: 600 }}>{st.name}</div>
                        <div style={{ fontSize: 12, color: "var(--muted)" }}>
                          {st.role}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {mode === "table" && (
            <div className="card">
              <h3 style={{ marginBottom: 12 }}>Ширээний 2D схем</h3>
              <div style={{ display: "grid", gap: 10 }}>
                {place.tables?.map((t) => (
                  <div
                    key={t._id}
                    style={{
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      padding: "8px 10px",
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 13,
                    }}
                  >
                    <span>{t.name}</span>
                    <span style={{ color: "var(--muted)" }}>
                      {t.type} • {t.capacity} хүн
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div
            className="card"
            style={{ height: 260, padding: 0, overflow: "hidden" }}
          >
            <MapContainer
              center={[place.location.lat, place.location.lng]}
              zoom={14}
              style={{ width: "100%", height: "100%" }}
              zoomControl={false}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <Marker position={[place.location.lat, place.location.lng]} />
            </MapContainer>
          </div>
        </div>

        <div>
          <div className="card" style={{ position: "sticky", top: 76 }}>
            <h3 style={{ marginBottom: 10 }}>Захиалах</h3>
            {svc ? (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontWeight: 600 }}>{svc.name}</div>
                <div style={{ fontSize: 12, color: "var(--muted)" }}>
                  {svc.duration} мин • ₮{(svc.price || 0).toLocaleString()}
                </div>
              </div>
            ) : (
              <div
                style={{
                  marginBottom: 14,
                  color: "var(--muted)",
                  fontSize: 13,
                }}
              >
                Үйлчилгээ сонгоно уу.
              </div>
            )}

            <button
              className="btn btn-primary"
              style={{ width: "100%" }}
              onClick={() =>
                nav(
                  `/book/${place._id}${selectedService ? `?serviceId=${selectedService}` : ""}`,
                )
              }
            >
              <span style={{ display: "inline-flex", marginRight: 6 }}>
                <CalendarIcon size={14} />
              </span>
              Цаг захиалах
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
