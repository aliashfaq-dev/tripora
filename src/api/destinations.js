import api from "./client";
export const getDestinations = (params = {}) => api.get("/destinations", { params });
export const createDestination = (data) => api.post("/destinations", data);
