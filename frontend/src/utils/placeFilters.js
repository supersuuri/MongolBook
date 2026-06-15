export function normalizeCategory(value) {
  if (!value) return "all";
  return String(value).trim().toLowerCase();
}

export function getPlaceDistanceKm(userPos, location) {
  if (!userPos || !location) return null;

  const [userLat, userLng] = userPos;
  const placeLat = Number(location.lat);
  const placeLng = Number(location.lng);

  if (!Number.isFinite(userLat) || !Number.isFinite(userLng)) return null;
  if (!Number.isFinite(placeLat) || !Number.isFinite(placeLng)) return null;

  const earthRadiusKm = 6371;
  const latDelta = ((placeLat - userLat) * Math.PI) / 180;
  const lngDelta = ((placeLng - userLng) * Math.PI) / 180;
  const a =
    Math.sin(latDelta / 2) ** 2 +
    Math.cos((userLat * Math.PI) / 180) *
      Math.cos((placeLat * Math.PI) / 180) *
      Math.sin(lngDelta / 2) ** 2;
  const distance =
    earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(distance * 10) / 10;
}

function matchesSearch(place, searchText) {
  if (!searchText) return true;

  const haystack = [place.name, place.address, place.description]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(searchText);
}

export function filterPlaces(
  places,
  { category = "all", search = "", userPos = null } = {},
) {
  const normalizedCategory = normalizeCategory(category);
  const searchText = String(search || "")
    .trim()
    .toLowerCase();

  return (Array.isArray(places) ? places : [])
    .filter((place) => {
      const placeCategory = normalizeCategory(place?.category);
      return (
        normalizedCategory === "all" || placeCategory === normalizedCategory
      );
    })
    .filter((place) => matchesSearch(place, searchText))
    .map((place) => ({
      ...place,
      distance: getPlaceDistanceKm(userPos, place.location),
    }))
    .sort((a, b) => {
      const aDistance = typeof a.distance === "number" ? a.distance : null;
      const bDistance = typeof b.distance === "number" ? b.distance : null;

      if (aDistance != null && bDistance != null) return aDistance - bDistance;
      if (aDistance != null) return -1;
      if (bDistance != null) return 1;
      return 0;
    });
}
