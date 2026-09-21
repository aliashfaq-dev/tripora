export const unwrap = (response) => response?.data?.data ?? response?.data ?? {};

export const getList = (response, keys = []) => {
  const root = unwrap(response);
  if (Array.isArray(root)) return root;
  const candidates = [...new Set([...keys, "items", "results", "trips", "posts", "favorites", "bookings", "chats", "conversations", "messages", "destinations"] )];
  for (const key of candidates) if (Array.isArray(root?.[key])) return root[key];
  if (Array.isArray(root?.data)) return root.data;
  return [];
};
export const getOne = (response, keys = []) => {
  const root = unwrap(response);
  for (const key of keys) if (root?.[key]) return root[key];
  return root;
};
export const apiError = (error, fallback = "Something went wrong") => {
  const data = error?.response?.data;
  if (typeof data === "string" && data.trim()) return data;
  if (Array.isArray(data?.errors) && data.errors.length) {
    return data.errors.map((x) => typeof x === "string" ? x : x?.message || x?.msg || `${x?.field || "Field"} is invalid`).join(" · ");
  }
  if (data?.errors && typeof data.errors === "object") {
    const values = Object.entries(data.errors).flatMap(([field, value]) => {
      if (Array.isArray(value)) return value.map((x) => `${field}: ${x?.message || x}`);
      return [`${field}: ${value?.message || value}`];
    });
    if (values.length) return values.join(" · ");
  }
  return data?.message || data?.error || error?.message || fallback;
};
export const normalizeRole = (value) => {
  const role = String(value || "USER").trim().toUpperCase();
  // Backend has only USER and ADMIN roles. Any legacy/unknown role is
  // normalized to USER so old SELLER role data cannot leak into the UI.
  return role === "ADMIN" ? "ADMIN" : "USER";
};
export const normalizeUser = (value) => {
  if (!value || typeof value !== "object") return null;
  const user = value.user && typeof value.user === "object" ? value.user : value;
  const result = { ...user };
  result.role = normalizeRole(result.role) || result.role;
  if (result.id == null && result._id != null) result.id = result._id;
  if (result._id == null && result.id != null) result._id = result.id;
  // Normalize backend phone field variants so Profile/Settings stay in sync
  // after a successful profile update and subsequent /users/me fetch.
  if (!result.phone) {
    result.phone = result.phoneNumber || result.mobile || result.mobileNumber || result.contactNumber || "";
  }
  if (!result.profilePhoto) {
    result.profilePhoto = result.profileImage || result.profilePicture || result.avatarUrl || result.photoUrl || result.photo || result.avatar || "";
  }
  return result;
};
