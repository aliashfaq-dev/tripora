import api from "./client";

// Backend contract: POST /api/v1/trips/:tripId/bookings
// Body: { tripDateId, travelers }
export const createBooking = (tripId, data = {}) => {
  const payload = { tripDateId: data.tripDateId, travelers: data.travelers };
  return api.post(`/trips/${encodeURIComponent(tripId)}/bookings`, payload);
};

// Traveler booking list/detail.
export const getBookings = (params = {}) => api.get("/users/bookings", { params });

export const getBooking = (id) => {
  const value = id?._id || id?.id || id;
  if (!value) throw new Error("Invalid booking id.");
  return api.get(`/bookings/${encodeURIComponent(String(value))}`);
};

// Traveler cancellation: PATCH /api/v1/bookings/:bookingId/cancel
export const cancelBooking = (id, reason) => {
  const value = id?._id || id?.id || id;
  if (!value) throw new Error("Invalid booking id.");
  const body = reason ? { reason } : undefined;
  return api.patch(`/bookings/${encodeURIComponent(String(value))}/cancel`, body);
};

// Seller incoming bookings.
export const getOwnedBookings = (params = {}) => api.get("/users/owned-bookings", { params });

// Seller booking action: status is CONFIRMED or REJECTED.
export const updateBookingStatus = (id, status) => {
  const value = id?._id || id?.id || id;
  if (!value) throw new Error("Invalid booking id.");
  return api.patch(`/seller/bookings/${encodeURIComponent(String(value))}/status`, { status });
};
