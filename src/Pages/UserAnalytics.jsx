import { useEffect, useState } from "react";
import { Eye, FileText, Heart, CalendarCheck, DollarSign } from "lucide-react";
import toast from "react-hot-toast";
import Layout from "../components/Layout";
import { getAnalytics } from "../api/users";
import { getOne, apiError } from "../api/response";

const cards = [
  ["totalPosts", "Trips", FileText], ["totalViews", "Views", Eye], ["totalFavorites", "Favorites", Heart],
  ["totalBookings", "Bookings", CalendarCheck], ["totalRevenue", "Revenue", DollarSign],
];
export default function UserAnalytics() {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  useEffect(() => { getAnalytics().then((r) => setData(getOne(r, ["analytics", "statistics"]))).catch((e) => toast.error(apiError(e, "Could not load analytics."))).finally(() => setLoading(false)); }, []);
  return <Layout><section className="mx-auto max-w-7xl px-6 py-12 lg:px-8"><p className="text-xs font-bold uppercase tracking-[.2em] text-[#9ee8c0]">HOST WORKSPACE</p><h1 className="mt-2 text-4xl font-black">Analytics</h1><p className="mt-2 text-[#91a7a1]">Performance of the trips you have posted on Tripora.</p><div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">{cards.map(([key,label,Icon])=><div key={key} className="rounded-2xl border border-[#263746] bg-[#101d2a] p-5"><Icon size={19} className="text-[#9ee8c0]"/><p className="mt-4 text-sm text-[#91a7a1]">{label}</p><b className="mt-1 block text-3xl">{loading?"—":key==="totalRevenue"?`$${data[key]??0}`:data[key]??0}</b></div>)}</div><div className="mt-8 rounded-2xl border border-[#263746] bg-[#101d2a] p-6"><h2 className="text-xl font-black">Publishing performance</h2><div className="mt-5 grid gap-3 sm:grid-cols-4">{[["publishedPosts","Published"],["pendingPosts","Pending"],["rejectedPosts","Rejected"],["expiredPosts","Expired"]].map(([key,label])=><div key={key} className="rounded-xl border border-[#203442] bg-[#0b1722] p-4"><p className="text-xs text-[#71878b]">{label}</p><b className="mt-2 block text-2xl">{loading?"—":data[key]??0}</b></div>)}</div></div></section></Layout>;
}
