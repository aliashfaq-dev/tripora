import api from "./client";
export const registerUser = (data) => api.post("/auth/register", data);
export const loginUser = (data) => api.post("/auth/login", data);
export const getCurrentUser = () => api.get("/auth/me");
export const refreshToken = (token) => api.post("/auth/refresh-token", { refreshToken: token });
export const forgotPassword = (email) => api.post("/auth/forgot-password", { email });
export const resetPassword = (token, password) => api.post("/auth/reset-password", { token, password });
export const changePassword = (data) => api.put("/auth/change-password", data);
export const logoutUser = () => api.post("/auth/logout");
