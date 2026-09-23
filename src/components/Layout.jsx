import { useEffect, useMemo, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  BarChart3, CalendarCheck, ChevronDown, Compass, FileText, Heart, Home,
  LayoutDashboard, LogIn, LogOut, Map, Menu, MessageCircle, Plus, Settings,
  Shield, UserRound, Users, X, Sun, Moon,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { logout } from "../store/authSlice";
import { logoutUser } from "../api/auth";
import { getMyPosts } from "../api/posts";
import { getId, getTitle, getImage } from "./ui";
import { fetchAllPages } from "../api/pagination";
import RealtimeNotifications from "./RealtimeNotifications";

const baseUserLinks = [
  ["/dashboard", "Overview", LayoutDashboard],
  ["/trips", "Explore trips", Compass],
  ["/favorites", "Saved", Heart],
  ["/chat", "Messages", MessageCircle],
];
const adminLinks = [
  ["/admin", "Overview", LayoutDashboard],
  ["/admin/posts", "Posts", FileText],
  ["/admin/users", "Users", Users],
  ["/admin/analytics", "Analytics", BarChart3],
  ["/admin/bookings", "Bookings", CalendarCheck],
];
const publicLinks = [["/", "Home", Home], ["/trips", "Explore trips", Compass]];
const itemClass = ({ isActive }) => `tp-nav-item group flex h-11 items-center gap-3 rounded-xl px-3.5 text-[13px] font-semibold transition ${isActive ? "tp-nav-active" : "tp-nav-inactive"}`;
const initials = (name = "User") => name.trim().split(/\s+/).slice(0, 2).map((x) => x[0]).join("").toUpperCase() || "U";
const avatarOf = (user) => user?.profilePhoto || user?.avatar || user?.avatarUrl || user?.photoUrl || user?.photo || "";

export function Footer({ onComingSoon }) {
  const comingSoon = (label) => onComingSoon?.(label);
  return <footer className="tripora-footer mt-auto border-t">
    <div className="tripora-footer-desktop mx-auto max-w-7xl px-6 py-12 lg:px-8">
      <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div><div className="flex items-center gap-2"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#123b30] text-[#9ee8c0]"><Compass size={18}/></span><span className="text-lg font-black">tripora</span></div><p className="tp-muted mt-4 max-w-sm text-sm leading-6">Discover trips, save favorites, book experiences and share journeys with the Tripora community.</p></div>
        <div><p className="font-extrabold">Explore</p><div className="tp-muted mt-4 space-y-3 text-sm"><Link className="block hover:text-[#3b8f68]" to="/trips">All trips</Link><Link className="block hover:text-[#3b8f68]" to="/favorites">Favorites</Link><Link className="block hover:text-[#3b8f68]" to="/create-trip">Post a trip</Link></div></div>
        <div><p className="font-extrabold">Company</p><div className="tp-muted mt-4 space-y-3 text-sm"><a className="block hover:text-[#3b8f68]" href="mailto:hello@tripora.example">Contact us</a><a className="block hover:text-[#3b8f68]" href="mailto:support@tripora.example">Support</a><button type="button" className="block text-left hover:text-[#3b8f68]" onClick={() => comingSoon("About Tripora")}>About Tripora</button></div></div>
        <div><p className="font-extrabold">Follow</p><div className="tp-muted mt-4 space-y-3 text-sm"><button type="button" className="block text-left hover:text-[#3b8f68]" onClick={() => comingSoon("Instagram")}>Instagram</button><button type="button" className="block text-left hover:text-[#3b8f68]" onClick={() => comingSoon("TikTok")}>TikTok</button><button type="button" className="block text-left hover:text-[#3b8f68]" onClick={() => comingSoon("X")}>X</button></div></div>
      </div>
      <div className="mx-auto mt-10 flex max-w-7xl flex-wrap justify-between gap-3 border-t pt-5 text-xs tp-muted"><span>© 2026 Tripora. All rights reserved.</span><span>Travel smarter. Experience more.</span></div>
    </div>

    <div className="tripora-footer-mobile">
      <div className="tripora-footer-brand"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#123b30] text-[#9ee8c0]"><Compass size={18}/></span><span className="text-lg font-black">tripora</span></div>
      <p className="tp-muted mt-3 text-sm leading-6">Discover trips, save favorites, book experiences and share journeys with the Tripora community.</p>
      <div className="tripora-footer-accordions mt-5">
        <details open><summary>Support</summary><div className="tripora-footer-links"><a href="mailto:hello@tripora.example">Contact us</a><a href="mailto:support@tripora.example">Support</a></div></details>
        <details><summary>Discover</summary><div className="tripora-footer-links"><Link to="/trips">All trips</Link><Link to="/favorites">Favorites</Link><Link to="/create-trip">Post a trip</Link></div></details>
        <details><summary>Company</summary><div className="tripora-footer-links"><button type="button" onClick={() => comingSoon("About Tripora")}>About Tripora</button></div></details>
        <details><summary>Follow</summary><div className="tripora-footer-links"><button type="button" onClick={() => comingSoon("Instagram")}>Instagram</button><button type="button" onClick={() => comingSoon("TikTok")}>TikTok</button><button type="button" onClick={() => comingSoon("X")}>X</button></div></details>
      </div>
      <div className="tripora-footer-mobile-meta"><span>🌐</span><span>Tripora</span></div>
      <div className="tripora-footer-mobile-copy">© 2026 Tripora. All rights reserved.<br/>Travel smarter. Experience more.</div>
    </div>
  </footer>;
}

export default function Layout({ children }) {
  const { user, isAuthenticated } = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [postCount, setPostCount] = useState(null);
  const [theme, setTheme] = useState(() => localStorage.getItem("tripora-theme") || "dark");

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("tripora-theme", theme);
  }, [theme]);
  const admin = user?.role === "ADMIN";

  useEffect(() => {
    setSidebarOpen(false);
    setProfileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const close = (e) => {
      if (e.key === "Escape") {
        setSidebarOpen(false);
        setProfileOpen(false);
      }
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, []);

  useEffect(() => {
    let alive = true;
    if (!isAuthenticated || admin) {
      setPostCount(null);
      return undefined;
    }
    setPostCount(null);
    fetchAllPages((page, limit) => getMyPosts({ page, limit }), ["trips", "posts", "items", "results"], { limit: 100, maxPages: 50 })
      .then((posts) => {
        if (!alive) return;
        setPostCount(posts.length);
      })
      .catch(() => alive && setPostCount(0));
    return () => { alive = false; };
  }, [isAuthenticated, admin, location.pathname]);

  const hasPosts = postCount === null ? false : postCount > 0;
  const links = useMemo(() => {
    if (admin) return adminLinks;
    if (!isAuthenticated) return publicLinks;
    return [
      ["/dashboard", "Overview", LayoutDashboard],
      ["/trips", "Explore trips", Compass],
      ...(hasPosts ? [["/my-trips", "My posts", FileText]] : []),
      ["/bookings", "Bookings", CalendarCheck],
      ["/favorites", "Saved", Heart],
      ["/chat", "Messages", MessageCircle],
      ...(hasPosts ? [["/analytics", "Analytics", BarChart3]] : []),
    ];
  }, [admin, isAuthenticated, hasPosts]);

  const signOut = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await logoutUser();
      toast.success("Signed out successfully.");
    } catch {
      toast("Your local session was cleared.");
    } finally {
      dispatch(logout());
      setProfileOpen(false);
      setSidebarOpen(false);
      setBusy(false);
      navigate("/login", { replace: true });
    }
  };

  const pageTitle = admin
    ? adminLinks.find(([path]) => location.pathname === path)?.[1] || "Admin workspace"
    : location.pathname === "/dashboard"
      ? "Dashboard"
      : links.find(([path]) => location.pathname === path)?.[1] || (location.pathname.startsWith("/edit-trip") ? "Edit trip" : "Travel workspace");

  const sidebar = (
    <aside className="tripora-sidebar flex h-full w-[278px] shrink-0 flex-col border-r border-[#1d2d39] bg-[#07121c]">
      <div className="flex h-[74px] items-center justify-between border-b border-[#1d2d39] px-5">
        <Link to={admin ? "/admin" : isAuthenticated ? "/dashboard" : "/"} className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#123b30] text-[#a6e8c3]"><Compass size={19} /></span>
          <span className="font-['Plus_Jakarta_Sans'] text-[18px] font-extrabold">tripora</span>
        </Link>
        <button type="button" onClick={() => setSidebarOpen(false)} aria-label="Close sidebar" className="grid h-9 w-9 place-items-center rounded-lg border border-[#263746] text-[#809599] hover:bg-white/[.04] hover:text-white"><X size={17} /></button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-5">
        <p className="mb-2 px-3 text-[10px] font-extrabold uppercase tracking-[.18em] text-[#536a70]">{isAuthenticated ? "Workspace" : "Navigation"}</p>
        <nav className="space-y-1">
          {links.map(([to, label, Icon]) => <NavLink key={to} to={to} className={itemClass}><Icon size={17} strokeWidth={1.8} /><span>{label}</span></NavLink>)}
        </nav>

        {isAuthenticated && !admin && (
          <div className="mt-6 border-t border-[#1d2d39] pt-5">
            <p className="mb-2 px-3 text-[10px] font-extrabold uppercase tracking-[.18em] text-[#536a70]">Create</p>
            <NavLink to="/create-trip" className={itemClass}><Plus size={17} /><span>{hasPosts ? "Post another trip" : "Post a trip"}</span></NavLink>
          </div>
        )}

        {!isAuthenticated && (
          <div className="mt-6 border-t border-[#1d2d39] pt-5">
            <p className="mb-2 px-3 text-[10px] font-extrabold uppercase tracking-[.18em] text-[#536a70]">Account</p>
            <NavLink to="/login" className={itemClass}><LogIn size={17} /><span>Login</span></NavLink>
            <NavLink to="/register" className={itemClass}><Plus size={17} /><span>Create account</span></NavLink>
          </div>
        )}
      </div>

      {isAuthenticated && <div className="border-t border-[#1d2d39] p-3"><div className="rounded-2xl border border-[#1f3240] bg-[#0b1722] p-3"><div className="flex items-center gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full bg-[#123b30] text-xs font-extrabold text-[#a6e8c3]">{avatarOf(user) ? <img src={avatarOf(user)} alt="" className="h-full w-full object-cover" /> : initials(user?.name)}</span><div className="min-w-0"><p className="truncate text-sm font-bold text-[#eef5f3]">{user?.name || "User"}</p><p className="truncate text-[11px] text-[#6f8589]">{admin ? "Administrator" : "Tripora member"}</p></div></div></div></div>}
    </aside>
  );

  return <div className="tripora-app min-h-[100dvh]">
    {sidebarOpen && <button type="button" aria-label="Close sidebar overlay" onClick={() => setSidebarOpen(false)} className="fixed inset-0 z-[60] bg-black/65 backdrop-blur-[2px]" />}
    <div className={`fixed inset-y-0 left-0 z-[90] transform transition-transform duration-300 ease-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>{sidebar}</div>

    <header className="sticky top-0 z-[100] flex h-[74px] items-center justify-between border-b border-[#1d2d39] tp-header-bg px-4 backdrop-blur-xl sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button type="button" onClick={() => setSidebarOpen((v) => !v)} aria-label={sidebarOpen ? "Close menu" : "Open menu"} aria-expanded={sidebarOpen} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[#263746] tp-control shadow-lg transition hover:brightness-95">{sidebarOpen ? <X size={19} /> : <Menu size={19} />}</button>
        <div className="min-w-0"><p className="hidden text-[10px] font-extrabold uppercase tracking-[.18em] text-[#5e7778] sm:block">Tripora</p><h1 className="truncate text-sm font-bold text-[#e9f2ef] sm:text-base">{isAuthenticated ? pageTitle : "Travel, planned better"}</h1></div>
      </div>

      <div className="flex items-center gap-2">
        <button type="button" onClick={() => setTheme((value) => value === "dark" ? "light" : "dark")} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`} title={`${theme === "dark" ? "Light" : "Dark"} theme`} className="grid h-10 w-10 place-items-center rounded-xl border border-[#263746] tp-control transition hover:brightness-95">{theme === "dark" ? <Sun size={17}/> : <Moon size={17}/>}</button>
        {isAuthenticated && !admin && <RealtimeNotifications />}
        {isAuthenticated && !admin && <Link to="/create-trip" className="tp-header-post hidden h-10 items-center gap-2 rounded-xl px-4 text-sm font-extrabold shadow-[0_8px_30px_rgba(37,105,77,.16)] transition hover:-translate-y-0.5 sm:inline-flex"><Plus size={16} /> Post a trip</Link>}
        {admin && <span className="hidden items-center gap-2 rounded-xl border border-[#263746] bg-[#0d1b27] px-3 py-2 text-xs font-bold text-[#8fa5a7] sm:inline-flex"><Shield size={14} /> Admin</span>}
        {isAuthenticated ? <div className="relative"><button type="button" onClick={() => setProfileOpen((v) => !v)} aria-expanded={profileOpen} aria-label="Open profile menu" className="tp-profile flex h-11 items-center gap-2 rounded-xl px-2 transition sm:pr-3"><span className="grid h-8 w-8 place-items-center overflow-hidden rounded-full bg-[#123b30] text-[11px] font-extrabold text-[#a6e8c3]">{avatarOf(user) ? <img src={avatarOf(user)} alt="" className="h-full w-full object-cover" /> : initials(user?.name)}</span><span className="hidden max-w-[120px] truncate text-xs font-bold text-[#e7f0ed] sm:block">{user?.name || "Profile"}</span><ChevronDown size={15} className={`hidden text-[#71878b] transition sm:block ${profileOpen ? "rotate-180" : ""}`} /></button>
          {profileOpen && <div className="absolute right-0 top-[calc(100%+10px)] w-[245px] overflow-hidden rounded-2xl border border-[#263746] tp-menu p-2 shadow-[0_25px_70px_rgba(0,0,0,.20)]"><div className="border-b border-[#1d2d39] px-3 py-3"><p className="truncate text-sm font-extrabold tp-heading">{user?.name || "User"}</p><p className="mt-1 truncate text-[11px] text-[#6f8589]">{user?.email || ""}</p></div>{!admin && <><Link to="/profile" className="mt-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold tp-menu-item hover:bg-black/[0.05]"><UserRound size={16} /> Profile</Link><Link to="/settings" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold tp-menu-item hover:bg-black/[0.05]"><Settings size={16} /> Settings</Link></>}{admin && <Link to="/admin" className="mt-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold tp-menu-item hover:bg-black/[0.05]"><Shield size={16} /> Admin workspace</Link>}<button type="button" onClick={signOut} disabled={busy} className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-[#e29b9b] hover:bg-[#3a2024] disabled:opacity-50"><LogOut size={16} /> {busy ? "Signing out..." : "Sign out"}</button></div>}
        </div> : <div className="flex items-center gap-2"><Link to="/login" className="hidden rounded-xl border border-[#263746] px-4 py-2.5 text-xs font-bold text-[#b9c8c5] hover:bg-white/[.04] sm:block">Login</Link><Link to="/register" className="rounded-xl bg-[#9ee8c0] px-4 py-2.5 text-xs font-extrabold text-[#06251b]">Get started</Link></div>}
      </div>
    </header>
    <main className="min-w-0">{children}</main>
    {!admin && <Footer onComingSoon={(label) => toast(`${label} on Tripora is coming soon.`)} />}
  </div>;
}

export const Card = ({ trip, favorite = false, onFavorite }) => {
  const id = getId(trip);
  const title = getTitle(trip);
  return <article className="trip-card-premium group flex h-full flex-col overflow-hidden rounded-2xl border border-[#233543] bg-[#0e1b27] transition duration-300 hover:-translate-y-1 hover:border-[#355265]">
    <Link to={`/trips/${id}`} className="block overflow-hidden"><img src={getImage(trip)} alt={title} className="h-52 w-full object-cover transition duration-500 group-hover:scale-[1.03]" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80"; }} /></Link>
    <div className="flex flex-1 flex-col p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-[11px] font-bold uppercase tracking-wider text-[#75d8a4]">{trip?.category || "Travel"}</p><Link to={`/trips/${id}`} className="mt-1 block text-lg font-extrabold text-white">{title}</Link></div>{onFavorite && <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onFavorite(trip); }} aria-label={favorite ? "Remove from favorites" : "Add to favorites"} className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[#263746] transition ${favorite ? "bg-[#173f34] text-[#9ee8c0] shadow-[0_0_0_4px_rgba(158,232,192,.08)]" : "text-[#91a7a1] hover:text-[#9ee8c0]"}`}><Heart size={16} fill={favorite ? "currentColor" : "none"}/></button>}</div><p className="mt-2 text-sm text-[#91a7a1]">{trip?.city || trip?.location || ""}{trip?.country ? `, ${trip.country}` : ""}</p><div className="mt-auto flex items-end justify-between pt-5"><div><span className="text-xl font-black text-[#9ee8c0]">{trip?.currency === "USD" ? "$" : "Rs."} {Number(trip?.price ?? 0).toLocaleString()}</span><span className="ml-1 text-xs text-[#71878b]">/ person</span></div><Link to={`/trips/${id}`} className="text-xs font-extrabold text-[#b8e8cf]">View trip →</Link></div></div>
  </article>;
};
