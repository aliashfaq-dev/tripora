import api from "./client";
export const getDashboard = () => api.get("/admin/dashboard");
export const getUsers = (params = {}) => { const page = Number(params.page || 1); const limit = Number(params.limit || 100); const requestParams = { ...params, page, limit, pageNumber: page, offset: (page - 1) * limit }; return api.get("/admin/users", { params: requestParams }); };
export const getUser = (id) => api.get(`/admin/users/${id}`);

export const updateUserStatus = (id, status, details = {}) =>
  api.patch(`/admin/users/${id}/status`, { status, ...details });

export const banUser = (id, reason) => updateUserStatus(id, "BANNED", { reason });

export const getPosts = async (params = {}) => { const page = Number(params.page || 1); const limit = Number(params.limit || 100); const requestParams = { ...params, page, limit, pageNumber: page, offset: (page - 1) * limit }; try { return await api.get("/admin/trips", { params: requestParams }); } catch (error) { if (![404,405].includes(error?.response?.status)) throw error; return api.get("/admin/posts", { params: requestParams }); } };
export const getPost = async (id) => { try { return await api.get(`/admin/trips/${id}`); } catch (error) { if (![404,405].includes(error?.response?.status)) throw error; return api.get(`/admin/posts/${id}`); } };
export const approvePost = async (id) => { try { return await api.patch(`/admin/trips/${id}/approve`); } catch (error) { if (![404,405].includes(error?.response?.status)) throw error; return api.patch(`/admin/posts/${id}/approve`); } };
export const rejectPost = async (id, reason) => { try { return await api.patch(`/admin/trips/${id}/reject`, { reason }); } catch (error) { if (![404,405].includes(error?.response?.status)) throw error; return api.patch(`/admin/posts/${id}/reject`, { reason }); } };
export const suspendPost = async (id, reason) => {
  const body = { status: "SUSPENDED", reason, suspensionReason: reason };
  try { return await api.patch(`/admin/trips/${id}/status`, body); }
  catch (error) { if (![404,405].includes(error?.response?.status)) throw error; try { return await api.patch(`/admin/trips/${id}/suspend`, { reason }); } catch (second) { if (![404,405].includes(second?.response?.status)) throw second; return api.patch(`/admin/posts/${id}/status`, body); } }
};
export const reactivatePost = async (id) => {
  try { return await api.patch(`/admin/trips/${id}/reactivate`, { status: "PUBLISHED" }); }
  catch (error) { if (![404,405].includes(error?.response?.status)) throw error; try { return await api.patch(`/admin/trips/${id}/status`, { status: "PUBLISHED" }); } catch (second) { if (![404,405].includes(second?.response?.status)) throw second; return api.patch(`/admin/posts/${id}/status`, { status: "PUBLISHED" }); } }
};
export const getBookings = (params = {}) => { const page = Number(params.page || 1); const limit = Number(params.limit || 100); const requestParams = { ...params, page, limit, pageNumber: page, offset: (page - 1) * limit }; return api.get("/admin/bookings", { params: requestParams }); };
