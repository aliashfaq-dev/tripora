import { createSlice } from "@reduxjs/toolkit";
import { normalizeUser } from "../api/response";

const accessToken = localStorage.getItem("accessToken") || localStorage.getItem("token") || null;
const refreshToken = localStorage.getItem("refreshToken") || null;
const storedRestriction = (() => { try { return JSON.parse(localStorage.getItem("tripora-access-restriction") || "null"); } catch { return null; } })();

const slice = createSlice({
  name: "auth",
  initialState: {
    user: null,
    token: accessToken,
    refreshToken,
    isAuthenticated: Boolean(accessToken),
    loading: true,
    restriction: storedRestriction,
  },
  reducers: {
    setCredentials: (state, action) => {
      const { accessToken: nextAccessToken, refreshToken: nextRefreshToken, user } = action.payload;
      state.token = nextAccessToken;
      state.refreshToken = nextRefreshToken || state.refreshToken || null;
      state.user = normalizeUser(user);
      state.isAuthenticated = Boolean(nextAccessToken);
      state.loading = false;
      if (nextAccessToken) {
        localStorage.setItem("accessToken", nextAccessToken);
        localStorage.setItem("token", nextAccessToken);
      }
      if (nextRefreshToken) localStorage.setItem("refreshToken", nextRefreshToken);
      localStorage.removeItem("user");
      state.restriction = null;
      localStorage.removeItem("tripora-access-restriction");
    },
    setUser: (state, action) => {
      state.user = normalizeUser(action.payload);
      state.isAuthenticated = Boolean(state.token && state.user);
      localStorage.removeItem("user");
    },
    setLoading: (state, action) => { state.loading = action.payload; },
    setRestriction: (state, action) => { state.restriction = action.payload || null; if (action.payload) localStorage.setItem("tripora-access-restriction", JSON.stringify(action.payload)); else localStorage.removeItem("tripora-access-restriction"); },
    clearRestriction: (state) => { state.restriction = null; localStorage.removeItem("tripora-access-restriction"); },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.loading = false;
      ["accessToken", "refreshToken", "token", "user"].forEach((k) => localStorage.removeItem(k));
    },
  },
});

export const { setCredentials, setUser, setLoading, setRestriction, clearRestriction, logout } = slice.actions;
export default slice.reducer;
