import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Compass, MessageCircle, Search, Sparkles } from "lucide-react";
import Layout, { Card } from "../components/Layout";
import { getTrips } from "../api/trips";
import { isPublishedTrip, isTripExpired } from "../components/ui";
import { fetchAllPages } from "../api/pagination";

export default function UserDashboard() {
  const [recommended, setRecommended] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let alive = true;
    Promise.allSettled([fetchAllPages((page,limit)=>getTrips({ page, limit }), ["trips","posts","items","results"], { limit: 100, maxPages: 50 })]).then(([rec]) => {
      if (!alive) return;
      if (rec.status === "fulfilled") setRecommended(rec.value.filter((x) => isPublishedTrip(x) && !isTripExpired(x)));
      setLoading(false);
    });
    return () => { alive = false; };
  }, []);
  return <Layout><section className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
    <div className="rounded-3xl border border-[#263746] bg-[radial-gradient(circle_at_90%_0%,rgba(91,183,134,.15),transparent_35%),var(--tp-surface)] p-7 sm:p-10">
      <p className="text-xs font-extrabold uppercase tracking-[.2em] text-[#3f9b70]">TRIPORA DASHBOARD</p>
      <h1 className="mt-3 max-w-3xl text-4xl font-black tracking-[-.03em] sm:text-5xl">Plan your next experience.</h1>
      <p className="tp-muted mt-4 max-w-2xl leading-7">Explore published trips, message trip creators, and post your own trip from the sidebar when you are ready.</p>
      <div className="mt-7 flex flex-wrap gap-3"><Link to="/trips" className="tp-primary-action inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-extrabold"><Search size={16}/> Explore trips</Link><Link to="/chat" className="inline-flex items-center gap-2 rounded-xl border border-[#263746] px-5 py-3 text-sm font-extrabold"><MessageCircle size={16}/> Messages</Link></div>
    </div>
    <div className="mt-7 grid gap-4 md:grid-cols-3">
      <Link to="/trips" className="rounded-2xl border border-[#263746] bg-[var(--tp-surface)] p-5 transition hover:-translate-y-0.5"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#123b30] text-[#9ee8c0]"><Compass size={18}/></span><p className="tp-muted mt-4 text-sm">Explore</p><h2 className="mt-1 text-xl font-black">Find a trip</h2></Link>
      <Link to="/chat" className="rounded-2xl border border-[#263746] bg-[var(--tp-surface)] p-5 transition hover:-translate-y-0.5"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#123b30] text-[#9ee8c0]"><MessageCircle size={18}/></span><p className="tp-muted mt-4 text-sm">Connect</p><h2 className="mt-1 text-xl font-black">Messages</h2></Link>
      <Link to="/create-trip" className="rounded-2xl border border-[#263746] bg-[var(--tp-surface)] p-5 transition hover:-translate-y-0.5"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#123b30] text-[#9ee8c0]"><Sparkles size={18}/></span><p className="tp-muted mt-4 text-sm">Create</p><h2 className="mt-1 text-xl font-black">Post a trip</h2></Link>
    </div>
    <section className="mt-12"><div className="flex items-end justify-between gap-4"><div><p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-[#3f9b70]">RECOMMENDED</p><h2 className="mt-1 text-2xl font-black">Trips you may like</h2><p className="tp-muted mt-1 text-sm">Fresh published experiences from the Tripora community.</p></div><Link to="/trips" className="text-sm font-extrabold text-[#3f9b70]">Explore all →</Link></div><div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-4">{loading ? [1,2,3,4].map(x=><div key={x} className="h-[350px] animate-pulse rounded-2xl bg-[var(--tp-surface)]"/>):recommended.slice(0,4).map(t=><Card key={t._id||t.id} trip={t}/>)}{!loading&&!recommended.length&&<div className="lg:col-span-4 rounded-2xl border border-dashed border-[#263746] p-10 text-center tp-muted">Recommended trips will appear when published trips are available.</div>}</div></section>
  </section></Layout>;
}
