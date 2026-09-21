import api from "./client";

export const getTrips = (params = {}) => { const page = Number(params.page || 1); const limit = Number(params.limit || 100); const offset = (page - 1) * limit; const requestParams = { ...params, page, limit, pageNumber: page, currentPage: page, offset, skip: offset, start: offset }; return api.get("/trips", { params: requestParams }); };
export const getTrip = (id) => api.get(`/trips/${id}`);
export const recordTripView = (id) => api.post(`/trips/${id}/view`);

// The current backend rollout has had different favorite-list route names.
// Prefer the new user-scoped route, then gracefully fall back while the API is migrated.
export const getFavorites = (params = {}) => api.get("/favorites", { params });

export const getFavoriteCheck = (tripId) =>
  api.get(`/favorites/${encodeURIComponent(tripId)}/check`);

export const addFavorite = (tripId) =>
  api.post(`/favorites/${encodeURIComponent(tripId)}`);

export const removeFavorite = (tripId) =>
  api.delete(`/favorites/${encodeURIComponent(tripId)}`);

export const toggleFavorite = (tripId, currentlyFavorite = false) =>
  currentlyFavorite ? removeFavorite(tripId) : addFavorite(tripId);

export const getFavoriteTripId = (favorite) => {
  const value = favorite?.tripId ?? favorite?.postId ?? favorite?.trip ?? favorite?.post ?? favorite?._id ?? favorite?.id;
  if (value == null) return null;
  if (typeof value === "string" || typeof value === "number") return value;
  return value?._id || value?.id || value?.tripId || value?.postId || null;
};
