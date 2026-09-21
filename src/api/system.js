import api from "./client";
export const apiRoot = () => api.get("/");
export const healthCheck = () => api.get("/health");
