import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, Plane } from "lucide-react";
import { useDispatch } from "react-redux";
import toast from "react-hot-toast";
import { loginUser, getCurrentUser } from "../api/auth";
import { setCredentials, setRestriction } from "../store/authSlice";
import { apiError, getOne, normalizeUser } from "../api/response";

export function AuthShell({ title, subtitle, children, eyebrow = "Welcome to Tripora" }) {
  return (
    <div className="auth-page min-h-[100dvh] text-white">
      <div className="mx-auto flex min-h-[100dvh] max-w-[1180px] items-center px-5 py-8 sm:px-8 lg:px-10">
        <div className="grid w-full gap-10 lg:grid-cols-[1fr_430px] lg:items-center lg:gap-20">
          <div className="hidden lg:block">
            <Link to="/" className="inline-flex items-center gap-3 text-sm font-extrabold tracking-[.14em] text-[#b5efd0]">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#123b30]"><Plane size={18}/></span>
              TRIPORA
            </Link>
            <h1 className="mt-10 max-w-[600px] font-['Plus_Jakarta_Sans'] text-6xl font-extrabold leading-[.98] tracking-[-.055em]">Travel better.<br/><span className="text-[#9ee8c0]">Go further.</span></h1>
            <p className="mt-7 max-w-[560px] text-[17px] leading-8 text-[#82999c]">Discover journeys, create experiences and manage your own trips from one focused travel workspace.</p>
            <div className="mt-9 flex gap-8 text-xs font-bold text-[#637a7e]"><span>Discover trips</span><span>Save favorites</span><span>Book experiences</span></div>
          </div>

          <div className="w-full">
            <Link to="/" className="mb-6 inline-flex items-center gap-2 text-sm font-extrabold text-[#a8e8c4] lg:hidden"><span className="grid h-9 w-9 place-items-center rounded-lg bg-[#123b30]"><Plane size={16}/></span> Tripora</Link>
            <div className="rounded-2xl border border-[#223543] bg-[#0d1a26] p-6 shadow-[0_30px_90px_rgba(0,0,0,.28)] sm:p-8">
              <p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-[#75d8a4]">{eyebrow}</p>
              <h2 className="mt-3 text-3xl font-extrabold tracking-[-.035em]">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-[#789095]">{subtitle}</p>
              <div className="mt-7">{children}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const AuthInput = ({ icon: Icon, ...props }) => (
  <div className="auth-input-wrap">
    <Icon className="auth-input-icon" size={17} strokeWidth={1.8}/>
    <input {...props} className="auth-input" />
  </div>
);

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const [form, setForm] = useState({ email: location.state?.email || "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.email.trim() || !form.password) return toast.error("Please enter your email and password.");
    setLoading(true);
    try {
      const response = await loginUser({ email: form.email.trim().toLowerCase(), password: form.password });
      const body = response?.data?.data || response?.data || {};
      const accessToken = body.accessToken || body.token || body.access_token;
      const refreshToken = body.refreshToken || body.refresh_token;
      if (!accessToken) throw new Error("The server did not return an access token.");

      // Persist the token before requesting /auth/me. Some backends return the
      // token but omit the user object from the login response.
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("token", accessToken);
      if (refreshToken) localStorage.setItem("refreshToken", refreshToken);

      let user = normalizeUser(body.user || body.data?.user);
      if (!user) user = normalizeUser(getOne(await getCurrentUser(), ["user"]));
      const accountStatus = String(user?.status || user?.accountStatus || body.status || "ACTIVE").toUpperCase();
      if (accountStatus === "BANNED" || accountStatus === "SUSPENDED") {
        const restriction = { status: accountStatus, reason: user?.reason || user?.banReason || user?.suspensionReason || user?.restrictionReason || body.reason || body.banReason || body.suspensionReason || body.message || "Your account has been restricted.", suspendedUntil: user?.suspendedUntil || body.suspendedUntil || body.suspensionEndsAt || null, durationDays: user?.durationDays || user?.suspensionDurationDays || body.durationDays || body.suspensionDurationDays || null };
        dispatch(setRestriction(restriction));
        localStorage.removeItem("accessToken"); localStorage.removeItem("token"); localStorage.removeItem("refreshToken");
        navigate("/account-restricted", { replace: true });
        return;
      }
      dispatch(setCredentials({ accessToken, refreshToken, user }));
      toast.success("Welcome back.");
      navigate(user?.role === "ADMIN" ? "/admin" : "/dashboard", { replace: true });
    } catch (error) {
      const responseBody = error?.response?.data || {};
      const data = responseBody?.data || responseBody || {};
      const userData = data?.user || {};
      const status = String(data.status || userData.status || data.accountStatus || userData.accountStatus || "").toUpperCase();
      const reason = data.reason || data.banReason || data.suspensionReason || data.restrictionReason || data.moderationReason || userData.reason || userData.banReason || userData.suspensionReason || userData.restrictionReason || data.message || "";
      if (status === "BANNED" || status === "SUSPENDED" || error?.response?.status === 403) {
        dispatch(setRestriction({ status: status || "BANNED", reason: reason || "Your account has been restricted by an administrator.", suspendedUntil: data.suspendedUntil || data.suspensionEndsAt || userData.suspendedUntil || null, durationDays: data.durationDays || data.suspensionDurationDays || userData.durationDays || userData.suspensionDurationDays || null }));
        navigate("/account-restricted", { replace: true });
      } else toast.error(apiError(error, "Login failed."));
    } finally {
      setLoading(false);
    }
  };

  return <AuthShell title="Welcome back" subtitle="Sign in to continue your travel workspace.">
    <form onSubmit={submit} className="space-y-4">
      <label className="block"><span className="auth-label">Email</span><AuthInput icon={Mail} type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" disabled={loading}/></label>
      <label className="block"><span className="auth-label">Password</span><div className="auth-password-wrap"><AuthInput icon={LockKeyhole} type={showPassword ? "text" : "password"} autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Enter your password" disabled={loading}/><button type="button" onClick={() => setShowPassword((v) => !v)} className="auth-eye" aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={17}/> : <Eye size={17}/>}</button></div></label>
      <div className="flex justify-end pt-1"><Link to="/forgot-password" className="text-xs font-bold text-[#83dbaa] hover:text-[#b7f0d0]">Forgot password?</Link></div>
      <button className="auth-submit" disabled={loading}>{loading ? "Signing in..." : <>Sign in <ArrowRight size={17}/></>}</button>
      <p className="pt-2 text-center text-xs text-[#71878b]">Don't have an account? <Link to="/register" className="font-bold text-[#9ee8c0]">Create one</Link></p>
    </form>
  </AuthShell>;
}
