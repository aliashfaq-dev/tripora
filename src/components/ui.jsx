export const getId = (item) => item?._id || item?.id;

export const normalizeImageUrl = (value) => {
  if (!value) return "";
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return "";
    if (/^data:image\//i.test(trimmed) || /^blob:/i.test(trimmed)) return trimmed;
    const configuredBase = import.meta.env.VITE_API_BASE_URL || "https://trip-maker-backend.vercel.app/api/v1";
    const base = configuredBase.startsWith("/") ? window.location.origin : configuredBase.replace(/\/api\/v1\/?$/, "");
    if (/^https?:\/\//i.test(trimmed)) {
      // Backends sometimes return development URLs such as http://localhost:5000/uploads/...
      // Replace those with the deployed API origin so post images work in production too.
      if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//i.test(trimmed)) {
        try { return `${base}${new URL(trimmed).pathname}${new URL(trimmed).search}`; } catch { return trimmed; }
      }
      return trimmed;
    }
    return `${base}/${trimmed.replace(/^\//, "")}`;
  }
  if (Array.isArray(value)) return normalizeImageUrl(value[0]);
  const raw = value?.url || value?.secure_url || value?.src || value?.path || value?.location || value?.fileUrl || value?.imageUrl || "";
  return normalizeImageUrl(raw);
};

export const getImage = (item) => {
  const candidates = [
    item?.coverImage, item?.cover_image, item?.thumbnail, item?.thumbnailUrl,
    item?.imageUrl, item?.image, item?.photo, item?.photoUrl, item?.mainImage,
    item?.destination?.imageUrl, item?.destination?.image, item?.destination?.photo,
    ...(Array.isArray(item?.galleryImages) ? item.galleryImages : []),
    ...(Array.isArray(item?.gallery) ? item.gallery : []),
    ...(Array.isArray(item?.images) ? item.images : []),
    ...(Array.isArray(item?.photos) ? item.photos : []),
    ...(Array.isArray(item?.media) ? item.media : []),
  ];
  return candidates.map(normalizeImageUrl).find(Boolean) ||
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80";
};

export const getTripEndDate = (trip) => {
  const dates = Array.isArray(trip?.availability) ? trip.availability : [];
  const returns = dates.map((d) => new Date(d?.returnDate || d?.departureDate)).filter((d) => !Number.isNaN(d.getTime()));
  const direct = trip?.expiresAt || trip?.returnDate;
  if (direct) { const d = new Date(direct); if (!Number.isNaN(d.getTime())) returns.push(d); }
  return returns.length ? new Date(Math.max(...returns.map((d) => d.getTime()))) : null;
};
export const isTripExpired = (trip, now = Date.now()) => { const end = getTripEndDate(trip); return Boolean(end && end.getTime() <= now); };
export const isTripBookable = (trip, now = Date.now()) => {
  const dates = Array.isArray(trip?.availability) ? trip.availability : [];
  return dates.some((d) => {
    const departure = new Date(d?.departureDate);
    const end = new Date(d?.returnDate || d?.departureDate);
    return !Number.isNaN(departure.getTime()) && !Number.isNaN(end.getTime()) && departure.getTime() > now && end.getTime() > now && Number(d?.availableSeats ?? 1) > 0;
  });
};

export const getTitle = (item) => item?.title || item?.name || item?.destination || "Beautiful destination";

export const isPublishedTrip = (trip) => !trip?.status || ["PUBLISHED", "APPROVED"].includes(String(trip.status).toUpperCase());


export const getTripCreator = (trip) => trip?.seller || trip?.createdBy || trip?.user || {};
export const getTripCreatorName = (trip) => { const s=getTripCreator(trip); return s?.name || s?.fullName || s?.agencyName || s?.businessName || s?.email || "Trip creator"; };
export const getTripCreatorRating = (trip) => { const s=getTripCreator(trip); const value=s?.rating ?? s?.averageRating ?? s?.reviewRating ?? trip?.creatorRating; const n=Number(value); return Number.isFinite(n) && n > 0 ? Math.max(0, Math.min(5, n)) : 0; };
export const RatingStars = ({ rating=0 }) => { const n=Number(rating)||0; return <span className="inline-flex items-center gap-0.5" aria-label={`${n.toFixed(1)} out of 5 stars`}>{[1,2,3,4,5].map((star)=><span key={star} className={star <= Math.round(n) ? "text-amber-400" : "text-slate-700"}>★</span>)}<span className="ml-1 text-xs font-semibold text-[#718079]">{n.toFixed(1)}</span></span>; };
