import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, UserRound } from "lucide-react";
import toast from "react-hot-toast";
import { AuthShell } from "./Login";
import { registerUser } from "../api/auth";
import { apiError } from "../api/response";

const AuthInput = ({ icon: Icon, ...props }) => <div className="auth-input-wrap"><Icon className="auth-input-icon" size={17} strokeWidth={1.8}/><input {...props} className="auth-input"/></div>;

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (form.name.trim().length < 2) return toast.error("Name must be at least 2 characters.");
    if (!form.email.trim()) return toast.error("Email is required.");
    if (form.password.length < 8) return toast.error("Password must be at least 8 characters.");
    if (form.password !== form.confirmPassword) return toast.error("Passwords do not match.");
    setLoading(true);
    try {
      await registerUser({ name: form.name.trim(), email: form.email.trim().toLowerCase(), password: form.password });
      toast.success("Account created. Please sign in.");
      navigate("/login", { replace: true, state: { email: form.email.trim().toLowerCase() } });
    } catch (error) {
      toast.error(apiError(error, "Registration failed."));
    } finally {
      setLoading(false);
    }
  };

  return <AuthShell eyebrow="Create your account" title="Start your journey" subtitle="Create a USER account and build trips people will want to experience.">
    <form onSubmit={submit} className="space-y-4">
      <label className="block"><span className="auth-label">Full name</span><AuthInput icon={UserRound} type="text" autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your name" disabled={loading}/></label>
      <label className="block"><span className="auth-label">Email</span><AuthInput icon={Mail} type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" disabled={loading}/></label>
      <label className="block"><span className="auth-label">Password</span><div className="auth-password-wrap"><AuthInput icon={LockKeyhole} type={showPassword ? "text" : "password"} autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Minimum 8 characters" disabled={loading}/><button type="button" onClick={() => setShowPassword((v) => !v)} className="auth-eye" aria-label="Toggle password">{showPassword ? <EyeOff size={17}/> : <Eye size={17}/>}</button></div></label>
      <label className="block"><span className="auth-label">Confirm password</span><div className="auth-password-wrap"><AuthInput icon={LockKeyhole} type={showConfirm ? "text" : "password"} autoComplete="new-password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} placeholder="Repeat your password" disabled={loading}/><button type="button" onClick={() => setShowConfirm((v) => !v)} className="auth-eye" aria-label="Toggle confirm password">{showConfirm ? <EyeOff size={17}/> : <Eye size={17}/>}</button></div></label>
      <button className="auth-submit" disabled={loading}>{loading ? "Creating..." : <>Create account <ArrowRight size={17}/></>}</button>
      <p className="pt-2 text-center text-xs text-[#71878b]">Already have an account? <Link to="/login" className="font-bold text-[#9ee8c0]">Sign in</Link></p>
    </form>
  </AuthShell>;
}
