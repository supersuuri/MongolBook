import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import MapView from "../components/MapView";
import PlaceSidebar from "../components/PlaceSidebar";
import api from "../utils/api";
import { CATEGORY_OPTIONS } from "../utils/categories";
import { filterPlaces, normalizeCategory } from "../utils/placeFilters";
import { PinIcon } from "../components/UiIcons";

export default function HomePage() {
  const [params, setParams] = useSearchParams();
  const [allPlaces, setAllPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userPos, setUserPos] = useState(null);
  const [mapCenter, setMapCenter] = useState(null);
  const [mapZoom, setMapZoom] = useState(13);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const cat = normalizeCategory(params.get("category"));

  const visiblePlaces = useMemo(
    () => filterPlaces(allPlaces, { category: cat, search, userPos }),
    [allPlaces, cat, search, userPos],
  );

  const setAllPlacesAndScroll = (list) => {
    setAllPlaces(list);
    try {
      const el = document.getElementById("place-sidebar");
      if (el) el.scrollTop = 0;
    } catch (e) {
      // ignore
    }
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/places");
      setAllPlacesAndScroll(data.data || []);
    } catch {
      setAllPlaces([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const getLocation = () => {
    navigator.geolocation?.getCurrentPosition(async (pos) => {
      const { latitude: lat, longitude: lng } = pos.coords;
      setUserPos([lat, lng]);
      setMapCenter([lat, lng]);
      setMapZoom(14);
    });
  };

  useEffect(() => {
    getLocation();
  }, []); // eslint-disable-line

  // removed dynamic radius effect — radius is fixed

  const setCat = (key) => {
    const nextCategory = normalizeCategory(key);
    const next = new URLSearchParams(params);
    if (nextCategory === "all") next.delete("category");
    else next.set("category", nextCategory);
    setParams(next);

    const filtered = filterPlaces(allPlaces, {
      category: nextCategory,
      search,
      userPos,
    });

    if (filtered[0]) {
      const first = filtered[0];
      setSelectedId(first._id);
      if (first.location) {
        setMapCenter([first.location.lat, first.location.lng]);
        setMapZoom(nextCategory === "resort" ? 10 : 15);
      }
    }

    if (!userPos) {
      // scroll category button into view
      try {
        const btn = document.querySelector(`[data-cat="${nextCategory}"]`);
        btn?.scrollIntoView({
          behavior: "smooth",
          inline: "center",
          block: "nearest",
        });
      } catch (e) {}
      return;
    }

    try {
      const btn = document.querySelector(`[data-cat="${nextCategory}"]`);
      btn?.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    } catch (e) {}
  };

  const selectPlace = (place) => {
    setSelectedId(place._id);
    setMapCenter([place.location.lat, place.location.lng]);
    setMapZoom(16);
    // Ensure user's current location marker is available when a place is selected
    if (!userPos) {
      navigator.geolocation?.getCurrentPosition(
        (pos) => {
          const { latitude: lat, longitude: lng } = pos.coords;
          setUserPos([lat, lng]);
        },
        () => {},
      );
    }
  };

  useEffect(() => {
    if (!visiblePlaces.length) return;

    const selectedStillVisible = visiblePlaces.some(
      (place) => place._id === selectedId,
    );

    if (!selectedStillVisible) {
      const first = visiblePlaces[0];
      setSelectedId(first._id);
      if (first.location) {
        setMapCenter([first.location.lat, first.location.lng]);
        setMapZoom(cat === "resort" ? 10 : 15);
      }
    }
  }, [visiblePlaces, selectedId, cat]);

  useEffect(() => {
    try {
      const el = document.getElementById("place-sidebar");
      if (el) el.scrollTop = 0;
    } catch (e) {
      // ignore
    }
  }, [cat, search]);

  return (
    <div
      style={{
        height: "calc(100vh - 56px)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          padding: "10px 20px",
          background: "var(--bg)",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          gap: 8,
          alignItems: "center",
          overflowX: "auto",
        }}
      >
        {CATEGORY_OPTIONS.map((c) => {
          const CategoryIcon = c.icon;
          return (
            <button
              key={c.value}
              data-cat={c.value}
              onClick={() => setCat(c.value)}
              style={{
                padding: "6px 16px",
                borderRadius: 20,
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
                border: "1px solid",
                whiteSpace: "nowrap",
                background: cat === c.value ? "var(--teal)" : "var(--card)",
                color: cat === c.value ? "#fff" : "var(--muted)",
                borderColor: cat === c.value ? "var(--teal)" : "var(--border)",
              }}
            >
              <span style={{ display: "inline-flex", marginRight: 6 }}>
                <CategoryIcon size={14} />
              </span>
              {c.label}
            </button>
          );
        })}

        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            gap: 8,
            alignItems: "center",
          }}
        >
          <input
            placeholder="Хайх..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              padding: "6px 12px",
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              color: "var(--text)",
              fontSize: 13,
              width: 180,
            }}
          />

          {/* radius control removed */}

          <button
            onClick={getLocation}
            style={{
              padding: "6px 14px",
              background: "var(--blue)",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: 13,
              whiteSpace: "nowrap",
            }}
          >
            <span style={{ display: "inline-flex", marginRight: 6 }}>
              <PinIcon size={14} />
            </span>
            Байршил
          </button>
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        <div style={{ flex: 1, position: "relative" }}>
          <MapView
            businesses={visiblePlaces}
            userPos={userPos}
            center={mapCenter}
            zoom={mapZoom}
          />
        </div>

        <PlaceSidebar
          places={visiblePlaces}
          selectedId={selectedId}
          loading={loading}
          onSelect={selectPlace}
        />
      </div>
    </div>
  );
}
