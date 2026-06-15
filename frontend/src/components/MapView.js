import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { useNavigate } from "react-router-dom";
import { PinIcon, StarIcon } from "./UiIcons";

// Leaflet icon fix
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

// Category icon colors
const CAT_COLORS = {
  salon: "#0EA5E9",
  barber: "#3B82F6",
  beauty: "#EC4899",
  billiard: "#10B981",
  restaurant: "#F59E0B",
  resort: "#22C55E",
  other: "#6B7280",
};

const CAT_MARKUP = {
  salon: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 10V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v4"/><path d="M6 10h12v6H6z"/><path d="M8 16v4M16 16v4"/></svg>`,
  barber: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 8a2 2 0 1 0 4 0 2 2 0 0 0-4 0Z"/><path d="M7 16a2 2 0 1 0 4 0 2 2 0 0 0-4 0Z"/><path d="M9 9.5 19 4M9 14.5 19 20M9 9.5l10 10M9 14.5l10-10"/></svg>`,
  beauty: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4c3.5 3 5 5.3 5 7.4A5 5 0 0 1 12 16a5 5 0 0 1-5-4.6C7 9.3 8.5 7 12 4Z"/><path d="M12 16v4"/></svg>`,
  billiard: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="2.4" fill="#fff" stroke="none"/></svg>`,
  restaurant: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3v8M6 11c0 1.7 1 3 2.5 3S11 12.7 11 11V3M11 3v18"/><path d="M16 3v6c0 1.7 1 3 2 3"/><path d="M18 3v18"/></svg>`,
  resort: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 17l4-5 3 3 3-4 6 6"/><circle cx="7" cy="7" r="2" fill="#fff" stroke="none"/></svg>`,
  other: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s6-5.2 6-11a6 6 0 1 0-12 0c0 5.8 6 11 6 11Z"/><circle cx="12" cy="11" r="2.4" fill="#fff" stroke="none"/></svg>`,
};

function createIcon(cat) {
  const color = CAT_COLORS[cat] || "#6B7280";
  const iconMarkup = CAT_MARKUP[cat] || CAT_MARKUP.other;
  return L.divIcon({
    html: `<div style="
      width:36px;height:36px;border-radius:50% 50% 50% 0;
      background:${color};transform:rotate(-45deg);
      display:flex;align-items:center;justify-content:center;
      box-shadow:0 2px 8px rgba(0,0,0,0.4);
      border:2px solid rgba(255,255,255,0.3);
    ">${iconMarkup}</div>`,
    className: "",
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -38],
  });
}

// User location marker
const userIcon = L.divIcon({
  html: `<div style="
    width:16px;height:16px;border-radius:50%;
    background:#2563EB;border:3px solid #fff;
    box-shadow:0 0 0 4px rgba(37,99,235,0.3);
  "></div>`,
  className: "",
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

function FlyTo({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (!center) return;
    map.flyTo(center, zoom || 14, { duration: 1.1 });
  }, [center, zoom, map]);
  return null;
}

export default function MapView({ businesses, userPos, center, zoom = 13 }) {
  const nav = useNavigate();

  return (
    <MapContainer
      center={center || [47.9077, 106.8832]}
      zoom={zoom}
      style={{ width: "100%", height: "100%" }}
      zoomControl={false}
    >
      <TileLayer
        attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {center && <FlyTo center={center} zoom={zoom} />}

      {/* User location */}
      {userPos && <Marker position={userPos} icon={userIcon} />}

      {/* Place markers */}
      {businesses.map((b) => (
        <Marker
          key={b._id}
          position={[b.location.lat, b.location.lng]}
          icon={createIcon(b.category)}
        >
          <Popup>
            <div style={{ minWidth: 200, fontFamily: "Inter,sans-serif" }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>
                {b.name}
              </div>
              <div style={{ fontSize: 12, color: "#8B949E", marginBottom: 8 }}>
                {b.address}
              </div>
              {b.distance != null && (
                <div
                  style={{ fontSize: 12, color: "#60A5FA", marginBottom: 8 }}
                >
                  <span
                    style={{
                      display: "inline-flex",
                      verticalAlign: "-2px",
                      marginRight: 4,
                    }}
                  >
                    <PinIcon size={12} />
                  </span>
                  {b.distance} км
                </div>
              )}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  marginBottom: 10,
                }}
              >
                <span style={{ color: "#F59E0B", display: "inline-flex" }}>
                  <StarIcon size={14} />
                </span>
                <span style={{ fontSize: 13, fontWeight: 600 }}>
                  {b.rating || 0}
                </span>
                <span style={{ fontSize: 12, color: "#8B949E" }}>
                  ({b.reviewCount || 0} үнэлгээ)
                </span>
              </div>
              <button
                onClick={() => nav(`/place/${b._id}`)}
                style={{
                  width: "100%",
                  padding: "8px 0",
                  background: "#2563EB",
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 500,
                }}
              >
                Дэлгэрэнгүй →
              </button>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
