import axios from "axios";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://trip-maker-backend.vercel.app/api/v1";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (typeof FormData !== "undefined" && config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }
  return config;
});

let refreshPromise = null;

const clearSession = () => {
  ["accessToken", "refreshToken", "token", "user"].forEach((key) => localStorage.removeItem(key));
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const status = error?.response?.status;
    const refresh = localStorage.getItem("refreshToken");
    const isAuth = ["/auth/login", "/auth/register", "/auth/refresh-token"].some((p) =>
      String(original?.url || "").includes(p)
    );

    if (status !== 401 || !refresh || original?._retry || isAuth) return Promise.reject(error);
    original._retry = true;

    try {
      if (!refreshPromise) {
        refreshPromise = axios.post(
          `${API_BASE_URL}/auth/refresh-token`,
          { refreshToken: refresh },
          { timeout: 20000, withCredentials: true, headers: { "Content-Type": "application/json" } }
        ).then((res) => {
          const root = res?.data?.data || res?.data || {};
          const data = root?.data && typeof root.data === "object" ? root.data : root;
          const nextAccessToken = data?.accessToken || data?.token || data?.access_token;
          const nextRefreshToken = data?.refreshToken || data?.refresh_token;
          if (!nextAccessToken) throw new Error("Refresh failed: no access token returned.");
          localStorage.setItem("accessToken", nextAccessToken);
          localStorage.setItem("token", nextAccessToken);
          if (nextRefreshToken) localStorage.setItem("refreshToken", nextRefreshToken);
          return { accessToken: nextAccessToken, refreshToken: nextRefreshToken };
        }).finally(() => { refreshPromise = null; });
      }
      const data = await refreshPromise;
      original.headers = original.headers || {};
      original.headers.Authorization = `Bearer ${data.accessToken}`;
      return api(original);
    } catch (refreshError) {
      clearSession();
      window.dispatchEvent(new Event("auth:expired"));
      return Promise.reject(refreshError);
    }
  }
);

export default api;
