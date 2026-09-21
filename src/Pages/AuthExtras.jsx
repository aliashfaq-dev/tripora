import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { forgotPassword, resetPassword, changePassword } from "../api/auth";
import { apiError } from "../api/response";
import { AuthShell } from "./Login";

export function ForgotPassword(){
  const [email,setEmail]=useState(""),[token,setToken]=useState(""),[loading,setLoading]=useState(false);
  const submit=async(e)=>{e.preventDefault();if(!email.trim())return toast.error("Enter your email.");setLoading(true);try{const r=await forgotPassword(email.trim().toLowerCase());const t=r?.data?.data?.resetToken;if(t)setToken(t);else toast.success("Password reset instructions requested.");}catch(e){toast.error(apiError(e,"Request failed."));}finally{setLoading(false)}};
  return <AuthShell title="Forgot password" subtitle="Request a password reset token."><form onSubmit={submit} className="space-y-4"><input className="input" type="email" placeholder="Email address" value={email} onChange={e=>setEmail(e.target.value)}/><button className="btn" disabled={loading}>{loading?"Requesting...":"Request reset"}</button></form>{token&&<div className="mt-5 rounded-xl border border-[#263746] p-4"><p className="text-sm font-bold">Development reset token</p><p className="mt-2 break-all font-mono text-xs text-[#9ee8c0]">{token}</p><Link className="mt-4 block text-center font-bold text-[#9ee8c0]" to={`/reset-password?token=${encodeURIComponent(token)}`}>Continue</Link></div>}<Link className="mt-5 block text-center text-sm text-[#91a7a1]" to="/login">Back to login</Link></AuthShell>;
}
export function ResetPassword(){
  const [params]=useSearchParams(),navigate=useNavigate();const [token,setToken]=useState(params.get("token")||""),[password,setPassword]=useState(""),[loading,setLoading]=useState(false);
  const submit=async(e)=>{e.preventDefault();if(!token||password.length<8)return toast.error("Token and an 8+ character password are required.");setLoading(true);try{await resetPassword(token,password);toast.success("Password reset successfully.");navigate("/login",{replace:true});}catch(e){toast.error(apiError(e,"Reset failed."));}finally{setLoading(false)}};
  return <AuthShell title="Reset password" subtitle="Choose a new password."><form onSubmit={submit} className="space-y-4"><input className="input" value={token} onChange={e=>setToken(e.target.value)} placeholder="Reset token"/><input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="New password"/><button className="btn" disabled={loading}>{loading?"Resetting...":"Reset password"}</button></form></AuthShell>;
}
export function ChangePassword(){
  const [form,setForm]=useState({currentPassword:"",newPassword:""}),[loading,setLoading]=useState(false);
  const submit=async(e)=>{e.preventDefault();if(form.newPassword.length<8)return toast.error("New password must be at least 8 characters.");setLoading(true);try{await changePassword(form);toast.success("Password changed.");setForm({currentPassword:"",newPassword:""});}catch(e){toast.error(apiError(e,"Could not change password."));}finally{setLoading(false)}};
  return <form onSubmit={submit} className="space-y-3"><input className="input" type="password" placeholder="Current password" value={form.currentPassword} onChange={e=>setForm({...form,currentPassword:e.target.value})}/><input className="input" type="password" placeholder="New password" value={form.newPassword} onChange={e=>setForm({...form,newPassword:e.target.value})}/><button className="btn" disabled={loading}>{loading?"Changing...":"Change password"}</button></form>;
}
