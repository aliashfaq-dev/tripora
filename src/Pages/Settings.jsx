import { useEffect, useState } from "react";
import { Camera, Check, LockKeyhole, Mail, ShieldCheck, Trash2, UserRound } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Layout from "../components/Layout";
import { ChangePassword } from "./AuthExtras";
import { getProfile, updateProfile, deleteAccount, uploadProfilePhoto } from "../api/users";
import { apiError, getOne, normalizeUser } from "../api/response";
import { logout, setUser } from "../store/authSlice";
import ConfirmDialog from "../components/ConfirmDialog";
import PhoneInput, { isValidInternationalPhone } from "../components/PhoneInput";

const avatarOf = (user) => user?.profilePhoto || user?.avatar || user?.avatarUrl || user?.photoUrl || user?.photo || "";
const initials = (name = "User") => name.trim().split(/\s+/).slice(0, 2).map((x) => x[0]).join("").toUpperCase() || "U";
const daysSince = (value) => value ? Math.floor((Date.now() - new Date(value).getTime()) / 86400000) : Infinity;
const remainingDays = (value) => Math.max(0, 30 - daysSince(value));

function Section({ icon: Icon, title, description, children }) {
  return <section className="rounded-3xl border border-[#263746] bg-[#101d2a] p-6 sm:p-7">
    <div className="flex items-start gap-4">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#123b30] text-[#9ee8c0]"><Icon size={18}/></span>
      <div className="min-w-0"><h2 className="text-lg font-extrabold">{title}</h2><p className="mt-1 text-sm leading-6 text-[#71878b]">{description}</p></div>
    </div>
    <div className="mt-6">{children}</div>
  </section>;
}

export default function Settings() {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [profile, setProfile] = useState({ name: user?.name || "", email: user?.email || "", phone: user?.phone || "", showPhoneInPost: Boolean(user?.showPhoneInPost) });
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(avatarOf(user));
  const [saving, setSaving] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [activeTab, setActiveTab] = useState("profile");

  useEffect(() => {
    getProfile().then((response) => {
      const fresh = normalizeUser(getOne(response, ["user", "profile"]));
      if (!fresh) return;
      setProfile({ name: fresh.name || "", email: fresh.email || "", phone: fresh.phone || "", showPhoneInPost: Boolean(fresh.showPhoneInPost) });
      setPhotoPreview(avatarOf(fresh));
      dispatch(setUser({ ...user, ...fresh }));
    }).catch(() => {});
  }, []);

  const emailWait = remainingDays(user?.emailChangedAt);
  const usernameWait = remainingDays(user?.usernameChangedAt || user?.nameChangedAt);
  const emailLocked = emailWait > 0 && daysSince(user?.emailChangedAt) !== Infinity;
  const usernameLocked = usernameWait > 0 && daysSince(user?.usernameChangedAt || user?.nameChangedAt) !== Infinity;

  const choosePhoto = (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("Please choose an image file.");
    if (file.size > 5 * 1024 * 1024) return toast.error("Profile photo must be 5MB or smaller.");
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    if (!profile.name.trim()) return toast.error("Username is required.");
    if (profile.phone && !isValidInternationalPhone(profile.phone)) return toast.error("Enter a valid phone number with the selected country code.");
    if (usernameLocked) return toast.error(`Username can be changed again in ${usernameWait} day${usernameWait === 1 ? "" : "s"}.`);
    setSaving(true);
    try {
      // Upload the image first. The profile endpoint stores the resulting URL;
      // sending the raw File to /users/me does not persist the image on the backend.
      const profilePhoto = photo ? await uploadProfilePhoto(photo) : avatarOf(user);
      const phone = profile.phone.trim();
      const payload = {
        name: profile.name.trim(),
        phone,
        phoneNumber: phone,
        showPhoneInPost: Boolean(profile.showPhoneInPost),
        ...(profilePhoto ? { profilePhoto } : {}),
      };
      await updateProfile(payload);

      // Re-read the canonical user after saving so the UI reflects what the backend actually stored.
      const profileResponse = await getProfile();
      const fresh = normalizeUser(getOne(profileResponse, ["user", "profile"]));
      const next = {
        ...user,
        ...fresh,
        name: fresh?.name || profile.name.trim(),
        phone: fresh?.phone || phone,
        ...(profilePhoto ? { profilePhoto } : {}),
        showPhoneInPost: fresh?.showPhoneInPost ?? Boolean(profile.showPhoneInPost),
      };
      dispatch(setUser(next));
      setProfile({
        name: next.name || "",
        email: next.email || "",
        phone: next.phone || "",
        showPhoneInPost: Boolean(next.showPhoneInPost),
      });
      setPhoto(null);
      setPhotoPreview(avatarOf(next));
      toast.success("Profile settings updated.");
    } catch (error) { toast.error(apiError(error, "Could not update profile.")); }
    finally { setSaving(false); }
  };

  const saveEmail = async (e) => {
    e.preventDefault();
    const email = profile.email.trim().toLowerCase();
    if (!email || !email.includes("@")) return toast.error("Enter a valid email address.");
    if (emailLocked) return toast.error(`Email can be changed again in ${emailWait} day${emailWait === 1 ? "" : "s"}.`);
    setSavingEmail(true);
    try {
      const response = await updateProfile({ email });
      const fresh = normalizeUser(getOne(response, ["user", "profile"]));
      dispatch(setUser({ ...user, ...(fresh || {}), email }));
      toast.success("Email updated successfully.");
    } catch (error) { toast.error(apiError(error, "Could not update email.")); }
    finally { setSavingEmail(false); }
  };

  const runAccountAction = async () => {
    const action = confirmAction;
    setConfirmAction(null);
    if (action !== "delete") return;
    try {
      await deleteAccount();
      dispatch(logout());
      toast.success("Account deleted.");
      navigate("/login", { replace: true });
    } catch (error) { toast.error(apiError(error, "Could not delete your account.")); }
  };

  const privacyText = profile.showPhoneInPost ? "Your phone number will be visible on published trip posts." : "Your phone number will stay hidden from published trip posts.";

  return <Layout><section className="mx-auto max-w-4xl px-6 py-12 lg:px-8">
    <p className="text-xs font-bold uppercase tracking-[.2em] text-[#9ee8c0]">ACCOUNT</p>
    <h1 className="mt-2 text-4xl font-black tracking-[-.03em]">Settings</h1>
    <p className="mt-2 text-[#91a7a1]">Manage your profile, phone visibility and account security.</p>

    <div className="mt-8 rounded-2xl border border-[#263746] bg-[#0b1722] p-1.5 sm:max-w-md">
      <div className="grid grid-cols-2 gap-1">
        <button type="button" onClick={() => setActiveTab("profile")} className={`rounded-xl px-4 py-3 text-sm font-extrabold transition ${activeTab === "profile" ? "bg-[#173f34] text-[#9ee8c0]" : "text-[#71878b] hover:text-white"}`}><UserRound size={16} className="mr-2 inline"/>Profile</button>
        <button type="button" onClick={() => setActiveTab("security")} className={`rounded-xl px-4 py-3 text-sm font-extrabold transition ${activeTab === "security" ? "bg-[#173f34] text-[#9ee8c0]" : "text-[#71878b] hover:text-white"}`}><ShieldCheck size={16} className="mr-2 inline"/>Security</button>
      </div>
    </div>

    <div className="mt-5 space-y-5">
      {activeTab === "profile" && <Section icon={UserRound} title="Profile" description="Update your username, phone number and profile picture.">
        <form onSubmit={saveProfile} className="space-y-5">
          <div className="flex flex-wrap items-center gap-5 rounded-2xl border border-[#203442] bg-[#0b1722] p-4">
            <div className="relative grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-2xl border border-[#2b4050] bg-[#123b30] text-xl font-black text-[#9ee8c0]">
              {photoPreview ? <img src={photoPreview} alt="Profile preview" className="h-full w-full object-cover"/> : initials(profile.name)}
              <label className="absolute inset-x-0 bottom-0 flex cursor-pointer items-center justify-center gap-1 bg-black/70 py-1.5 text-[10px] font-bold text-white"><Camera size={12}/>Change<input type="file" accept="image/*" className="hidden" onChange={(e)=>choosePhoto(e.target.files?.[0])}/></label>
            </div>
            <div><p className="font-bold">Profile photo</p><p className="mt-1 text-xs text-[#71878b]">JPG, PNG or WebP · max 5MB.</p></div>
          </div>
          <label className="block"><span className="input-label">Username</span><input className="input" value={profile.name} onChange={(e)=>setProfile({...profile,name:e.target.value})} disabled={saving || usernameLocked}/>{usernameLocked && <span className="input-help text-amber-300">You can change your username again in {usernameWait} day{usernameWait === 1 ? "" : "s"}.</span>}</label>
          <PhoneInput value={profile.phone} onChange={(phone) => setProfile({ ...profile, phone })} disabled={saving} />
          <div className="flex flex-col gap-4 rounded-2xl border border-[#203442] bg-[#0b1722] p-4 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="text-sm font-bold">Show phone number on my trip posts</p><p className="mt-1 text-xs leading-5 text-[#71878b]">{privacyText}</p></div><button type="button" role="switch" aria-checked={profile.showPhoneInPost} onClick={()=>setProfile({...profile,showPhoneInPost:!profile.showPhoneInPost})} className={`relative h-7 w-12 shrink-0 rounded-full transition ${profile.showPhoneInPost ? "bg-[#72d5a0]" : "bg-[#263746]"}`}><span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${profile.showPhoneInPost ? "left-6" : "left-1"}`}/></button></div>
          <button disabled={saving} className="btn max-w-[210px]">{saving ? "Saving..." : <><Check size={16}/>Save profile</>}</button>
        </form>
      </Section>}

      {activeTab === "security" && <Section icon={ShieldCheck} title="Security" description="Email, password and account lifecycle controls live here.">
        <div className="space-y-7">
          <div>
            <div className="mb-3 flex items-center gap-2 text-sm font-extrabold"><Mail size={16} className="text-[#9ee8c0]"/> Email address</div>
            <form onSubmit={saveEmail} className="space-y-3"><input className="input" type="email" value={profile.email} onChange={(e)=>setProfile({...profile,email:e.target.value})} disabled={savingEmail || emailLocked}/>{emailLocked && <p className="text-xs text-amber-300">Email change is locked for {emailWait} more day{emailWait === 1 ? "" : "s"}.</p>}<button disabled={savingEmail || emailLocked} className="btn max-w-[190px]">{savingEmail?"Updating...":"Change email"}</button></form>
          </div>
          <div className="border-t border-[#263746] pt-7"><div className="mb-3 flex items-center gap-2 text-sm font-extrabold"><LockKeyhole size={16} className="text-[#9ee8c0]"/> Password</div><ChangePassword/></div>
          <div className="border-t border-[#263746] pt-7">
            <div className="mb-4 flex items-start gap-3"><ShieldCheck size={17} className="mt-0.5 shrink-0 text-[#9ee8c0]"/><div><p className="font-extrabold">Account status</p><p className="mt-1 text-xs leading-5 text-[#71878b]">Permanently delete your Tripora account and associated personal data.</p></div></div>
            <button type="button" onClick={()=>setConfirmAction("delete")} className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-900/60 bg-red-500/5 px-4 py-3 text-sm font-extrabold text-red-300 hover:bg-red-500/10"><Trash2 size={16}/>Delete account</button>
          </div>
        </div>
      </Section>}
    </div>
    
  </section>
  <ConfirmDialog open={confirmAction === "delete"} title="Delete account permanently?" message="This is permanent and should remove your account and associated personal data." confirmLabel="Delete account" danger onConfirm={runAccountAction} onCancel={()=>setConfirmAction(null)} />
  </Layout>;
}
