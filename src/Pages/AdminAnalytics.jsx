import { useEffect,useState } from "react";
import Layout from "../components/Layout";
import { getDashboard } from "../api/admin";
import { getOne } from "../api/response";
export default function AdminAnalytics(){const [d,setD]=useState({});useEffect(()=>{getDashboard().then(r=>setD(getOne(r,["statistics"]))).catch(()=>{})},[]);return <Layout><section className="mx-auto max-w-6xl px-6 py-12 lg:px-8"><p className="text-xs font-bold uppercase tracking-[.2em] text-[#9ee8c0]">ADMIN</p><h1 className="mt-2 text-4xl font-black">Analytics</h1><p className="mt-2 text-[#91a7a1]">Platform statistics.</p><div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{Object.entries(d).map(([k,v])=><div key={k} className="rounded-2xl border border-[#263746] bg-[#101d2a] p-6"><p className="text-sm capitalize text-[#91a7a1]">{k.replace(/([A-Z])/g," $1")}</p><b className="mt-2 block text-3xl">{k.toLowerCase().includes("revenue")?`$${v}`:v}</b></div>)}</div></section></Layout>}
