import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getCurrentUser } from "../api/auth";
import { logout, setLoading, setUser, setRestriction } from "../store/authSlice";
import { getOne, normalizeUser } from "../api/response";

export default function AuthInitializer({ children }) {
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth.token);

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      const currentToken = token || localStorage.getItem("accessToken") || localStorage.getItem("token");
      if (!currentToken) {
        // A previously detected ban/suspension is intentionally retained so a
        // refresh cannot hide the restriction screen.
        dispatch(setLoading(false));
        return;
      }
      localStorage.setItem("accessToken", currentToken);
      localStorage.setItem("token", currentToken);
      try {
        const root = getOne(await getCurrentUser(), ["user"]);
        const user = normalizeUser(root);
        const accountStatus = String(user?.status || user?.accountStatus || "ACTIVE").toUpperCase();
        if (mounted && user && (accountStatus === "BANNED" || accountStatus === "SUSPENDED")) {
          dispatch(logout());
          dispatch(setRestriction({ status: accountStatus, reason: user?.reason || user?.banReason || user?.suspensionReason || user?.restrictionReason || "Your account has been restricted.", suspendedUntil: user?.suspendedUntil || null, durationDays: user?.durationDays || user?.suspensionDurationDays || null }));
        } else if (mounted && user) dispatch(setUser(user));
        else if (mounted) dispatch(logout());
      } catch (error) {
        const responseBody = error?.response?.data || {};
        const data = responseBody?.data || responseBody || {};
        const stored = (() => { try { return JSON.parse(localStorage.getItem("tripora-access-restriction") || "null"); } catch { return null; } })();
        const userData = data?.user || data?.account || data?.data?.user || {};
        const status = String(
          data.status || data.accountStatus || userData.status || userData.accountStatus || stored?.status || (error?.response?.status === 403 ? "BANNED" : "")
        ).toUpperCase();
        const reason = data.reason || data.banReason || data.suspensionReason || data.restrictionReason || data.moderationReason || userData.reason || userData.banReason || userData.suspensionReason || userData.restrictionReason || stored?.reason || (error?.response?.status === 403 ? "Your account has been restricted by an administrator." : "");
        const suspendedUntil = data.suspendedUntil || data.suspensionEndsAt || userData.suspendedUntil || userData.suspensionEndsAt || stored?.suspendedUntil || null;
        const durationDays = data.durationDays || data.suspensionDurationDays || userData.durationDays || userData.suspensionDurationDays || stored?.durationDays || null;
        if (mounted && (status === "BANNED" || status === "SUSPENDED")) {
          dispatch(logout());
          dispatch(setRestriction({ status, reason, suspendedUntil, durationDays }));
        } else if (mounted) dispatch(logout());
      } finally {
        if (mounted) dispatch(setLoading(false));
      }
    };
    const expired = () => dispatch(logout());
    window.addEventListener("auth:expired", expired);
    init();
    return () => { mounted = false; window.removeEventListener("auth:expired", expired); };
  }, [dispatch, token]);

  return children;
}
