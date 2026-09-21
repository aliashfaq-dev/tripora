import api from "./client";

// Backend contract: POST /api/v1/trips/:tripId/bookings
// Body: { tripDateId, travelers }
export const createBooking = (tripId, data = {}) => {
  const payload = { tripDateId: data.tripDateId, travelers: data.travelers };
  return api.post(`/trips/${encodeURIComponent(tripId)}/bookings`, payload);
};

// Traveler booking list/detail.
export const getBookings = (params = {}) => api.get("/bookings", { params });

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
export const getOwnedBookings = async (params = {}) => {
  try {
    return await api.get("/seller/bookings", { params });
  } catch (error) {
    // Older Tripora deployments exposed the same seller-owned list under this
    // route. Keep it only as a 404 compatibility fallback; the documented
    // endpoint above remains the primary contract.
    if (![403, 404].includes(error?.response?.status)) throw error;
    return api.get("/users/owned-bookings", { params });
  }
};

// Seller booking action: status is CONFIRMED or REJECTED.
export const updateBookingStatus = (id, status) => {
  const value = id?._id || id?.id || id;
  if (!value) throw new Error("Invalid booking id.");
  return api.patch(`/seller/bookings/${encodeURIComponent(String(value))}/status`, { status });
};
