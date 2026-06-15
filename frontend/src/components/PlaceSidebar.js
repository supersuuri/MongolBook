import { CATEGORY_META } from "../utils/categories";
import { PinIcon, StarIcon } from "./UiIcons";

export default function PlaceSidebar({
  places,
  selectedId,
  onSelect,
  loading,
}) {
  return (
    <div
      style={{
        width: 360,
        overflowY: "auto",
        borderLeft: "1px solid var(--border)",
        background: "var(--bg)",
      }}
      id="place-sidebar"
    >
      <div
        style={{ padding: "14px 16px", fontSize: 13, color: "var(--muted)" }}
      >
        {loading
          ? "Газрууд ачааллаж байна..."
          : `${places.length} газар олдлоо`}
      </div>

      {places.map((p) => {
        const active = selectedId === p._id;
        const meta = CATEGORY_META[p.category] || {
          icon: PinIcon,
          label: p.category,
        };
        const MetaIcon = meta.icon;

        return (
          <div
            key={p._id}
            onClick={() => onSelect(p)}
            style={{
              margin: "0 10px 10px",
              borderRadius: 12,
              overflow: "hidden",
              background: "var(--card)",
              border: `1px solid ${active ? "var(--blue)" : "var(--border)"}`,
              cursor: "pointer",
            }}
          >
            <div style={{ height: 118, background: "#1C2128" }}>
              {(() => {
                const isBlueCue = /blue\s*cue/i.test(p.name || "");
                const src = isBlueCue
                  ? "https://static.where-e.com/United_States/Cue-Club-Of-Wisconsin_e116e4e638ace7aa0c3ebe20f1492acf.jpg"
                  : p.images?.[0];
                return src ? (
                  <img
                    src={src}
                    alt={p.name}
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

            <div style={{ padding: "10px 12px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 8,
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 600 }}>{p.name}</div>
                <div style={{ fontSize: 12, color: "var(--muted)" }}>
                  <span
                    style={{
                      display: "inline-flex",
                      verticalAlign: "-2px",
                      marginRight: 4,
                    }}
                  >
                    <StarIcon size={12} />
                  </span>
                  {p.rating?.toFixed?.(1) || 0}
                </div>
              </div>

              <div
                style={{ marginTop: 4, fontSize: 12, color: "var(--muted)" }}
              >
                {p.address}
              </div>

              <div
                style={{
                  marginTop: 8,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    padding: "2px 8px",
                    borderRadius: 10,
                    background: "rgba(13,148,136,0.15)",
                    color: "var(--teal)",
                  }}
                >
                  <span style={{ display: "inline-flex", marginRight: 4 }}>
                    <MetaIcon size={12} />
                  </span>
                  {meta.label}
                </span>
                {p.distance != null ? (
                  <span style={{ fontSize: 12, color: "#60A5FA" }}>
                    <span
                      style={{
                        display: "inline-flex",
                        verticalAlign: "-2px",
                        marginRight: 4,
                      }}
                    >
                      <PinIcon size={12} />
                    </span>
                    {p.distance} км
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
