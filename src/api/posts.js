import api from "./client";

const hasFile = (value) => typeof File !== "undefined" && value instanceof File;

const uploadImage = async (file) => {
  if (!hasFile(file)) return file || "";
  const fd = new FormData();
  fd.append("image", file);
  const response = await api.post("/upload/image", fd);
  const root = response?.data?.data ?? response?.data ?? {};
  const url = root?.url || root?.secure_url || root?.image?.url;
  if (!url) throw new Error("Image upload succeeded but the server did not return an image URL.");
  return url;
};

const prepareImages = async (data = {}) => {
  const coverImage = hasFile(data.coverImage) ? await uploadImage(data.coverImage) : (data.coverImage || "");
  const galleryImages = await Promise.all(
    (Array.isArray(data.galleryImages) ? data.galleryImages : []).map(uploadImage)
  );
  return { ...data, coverImage, galleryImages: galleryImages.filter(Boolean) };
};

const toMultipart = (data = {}) => {
  const form = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    if (Array.isArray(value) || (typeof value === "object" && !(value instanceof File))) {
      form.append(key, JSON.stringify(value));
    } else {
      form.append(key, String(value));
    }
  });
  return form;
};

const normalizeMethodError = (error, action) => {
  if (error?.response?.status === 404) {
    const message = new Error(`Tripora backend does not expose the USER ${action} endpoint yet.`);
    message.response = error.response;
    message.code = "USER_ROUTE_NOT_FOUND";
    throw message;
  }
  throw error;
};

// Tripora has exactly two application roles: USER and ADMIN.
// Trip creation is a USER operation; there are no seller API fallbacks.
export const createPost = async (data = {}) => {
  const prepared = await prepareImages({
    ...data,
    title: String(data.title ?? "").trim(),
    description: String(data.description ?? "").trim(),
  });
  if (!prepared.title) {
    throw new Error("Trip title is required.");
  }
  const tryCreate = async (route) => {
    try {
      return await api.post(route, prepared);
    } catch (error) {
      if ([400, 415, 422].includes(error?.response?.status)) {
        try { return await api.post(route, toMultipart(prepared)); }
        catch (secondError) { error = secondError; }
      }
      throw error;
    }
  };
  try {
    return await tryCreate("/seller/trips");
  } catch (error) {
    if ([403, 404].includes(error?.response?.status)) return tryCreate("/users/posts");
    return normalizeMethodError(error, "post-create");
  }
};

export const getMyPosts = async (params = {}) => {
  const requestParams = {
    page: Number(params.page) || 1,
    pageNumber: Number(params.pageNumber) || Number(params.page) || 1,
    limit: Number(params.limit) || 100,
    offset: Number(params.offset) || ((Number(params.page) || 1) - 1) * (Number(params.limit) || 100),
    ...(params.status ? { status: params.status } : {}),
  };
  try { return await api.get("/seller/trips", { params: requestParams }); }
  catch (error) {
    if (![403, 404].includes(error?.response?.status)) throw error;
    return api.get("/users/my-posts", { params: requestParams });
  }
};

export const getMyPost = async (id) => {
  try { return await api.get(`/seller/trips/${encodeURIComponent(id)}`); }
  catch (error) {
    if (![403, 404].includes(error?.response?.status)) throw error;
    return api.get(`/users/posts/${encodeURIComponent(id)}`);
  }
};

export const updateMyPost = async (id, data) => {
  const prepared = await prepareImages({
    ...data,
    title: String(data.title ?? "").trim(),
    description: String(data.description ?? "").trim(),
  });
  if (!prepared.title) {
    throw new Error("Trip title is required.");
  }
  const userRoute = `/users/posts/${encodeURIComponent(id)}`;
  const sellerRoute = `/seller/trips/${encodeURIComponent(id)}`;
  const tryUpdate = async (route, method = "patch") => {
    try {
      return await api[method](route, prepared);
    } catch (error) {
      if ([400, 415, 422].includes(error?.response?.status)) {
        try { return await api[method](route, toMultipart(prepared)); }
        catch (secondError) { error = secondError; }
      }
      throw error;
    }
  };
  try { return await tryUpdate(sellerRoute, "put"); }
  catch (error) {
    if ([403, 404].includes(error?.response?.status)) return tryUpdate(userRoute, "patch");
    return normalizeMethodError(error, "post-update");
  }
};

export const deleteMyPost = async (id) => {
  try { return await api.delete(`/seller/trips/${encodeURIComponent(id)}`); }
  catch (error) { if ([403, 404].includes(error?.response?.status)) return api.delete(`/users/posts/${encodeURIComponent(id)}`); throw error; }
};
export const submitMyPost = async (id) => {
  try { return await api.post(`/seller/trips/${encodeURIComponent(id)}/submit`); }
  catch (error) { if ([403, 404].includes(error?.response?.status)) return api.post(`/users/posts/${encodeURIComponent(id)}/submit`); throw error; }
};
export const deactivateMyPost = async (id) => {
  return api.patch(`/seller/trips/${encodeURIComponent(id)}/deactivate`);
};

export const activateMyPost = async (id) => {
  return api.patch(`/seller/trips/${encodeURIComponent(id)}/activate`);
};
