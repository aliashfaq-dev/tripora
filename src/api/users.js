import api from "./client";

const hasFile = (value) => typeof File !== "undefined" && value instanceof File;

export const uploadProfilePhoto = async (file) => {
  if (!hasFile(file)) return file || "";
  const form = new FormData();
  form.append("image", file);
  const response = await api.post("/upload/image", form);
  const root = response?.data?.data ?? response?.data ?? {};
  const url = root?.url || root?.secure_url || root?.image?.url || root?.imageUrl || root?.profilePhoto;
  if (!url) throw new Error("Image upload succeeded but the server did not return an image URL.");
  return url;
};

export const getProfile = () => api.get("/users/me");
export const updateProfile = (data) => api.put("/users/me", data);
export const deactivateAccount = () => api.patch("/users/me/deactivate");
export const deleteAccount = () => api.delete("/users/me");
export const getAnalytics = () => api.get("/users/analytics");
