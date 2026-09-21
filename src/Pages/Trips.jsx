import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, SlidersHorizontal } from "lucide-react";
import Layout, { Card } from "../components/Layout";
import { getTrips, getFavorites, addFavorite, removeFavorite, getFavoriteTripId } from "../api/trips";
import { getList, apiError } from "../api/response";
import { toast } from "react-hot-toast";
import { isPublishedTrip, isTripExpired } from "../components/ui";
import { fetchAllPages } from "../api/pagination";
import { useSelector } from "react-redux";

export default function Trips(){
 const [params,setParams]=useSearchParams(); const { isAuthenticated } = useSelector((state) => state.auth); const [items,setItems]=useState([]),[loading,setLoading]=useState(true),[favoriteIds,setFavoriteIds]=useState(new Set());
 const [filters,setFilters]=useState({search:params.get("search")||"",country:params.get("country")||"",city:"",duration:"",sort:params.get("sort")||"most_famous"});
 const load=async(next=filters)=>{setLoading(true);try{const clean=Object.fromEntries(Object.entries(next).filter(([,v])=>v!==""&&v!=null));const list=await fetchAllPages((page,limit)=>getTrips({...clean,page,limit}),["trips","posts","items","results"],{limit:100,maxPages:50});setItems(list.filter((x) => isPublishedTrip(x) && !isTripExpired(x)));setParams(clean,{replace:true});}catch(e){toast.error(apiError(e,"Could not load trips."));}finally{setLoading(false)}};
 const loadFavorites=async()=>{if(!isAuthenticated){setFavoriteIds(new Set());return;}try{const all=await fetchAllPages((page,limit)=>getFavorites({page,limit}),["favorites","trips","posts","items","results"],{limit:100,maxPages:50});setFavoriteIds(new Set(all.map(getFavoriteTripId).filter(Boolean).map((value) => String(value))));}catch{setFavoriteIds(new Set());}};
 const toggleCardFavorite=async(trip)=>{if(!isAuthenticated){toast.error("Login to favorite trips.");return;}const id=trip?._id||trip?.id;if(!id)return;const key=String(id);const wasFavorite=favoriteIds.has(key);setFavoriteIds(prev=>{const next=new Set(prev);wasFavorite?next.delete(key):next.add(key);return next;});try{wasFavorite?await removeFavorite(id):await addFavorite(id);toast.success(wasFavorite?"Removed from favorites.":"Added to favorites.");}catch(e){setFavoriteIds(prev=>{const next=new Set(prev);wasFavorite?next.add(key):next.delete(key);return next;});toast.error(apiError(e,"Could not update favorite."));}};
 useEffect(()=>{load(filters);},[]);
 useEffect(()=>{loadFavorites();},[isAuthenticated]);
 const change=(k,v)=>setFilters(f=>({...f,[k]:v}));
 return <Layout><section className="mx-auto max-w-7xl px-6 py-12 lg:px-8"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-[#9ee8c0]">Explore</p><h1 className="mt-2 text-5xl font-black">Find your next trip.</h1><p className="mt-3 text-[#91a7a1]">Search, filters and sorting are applied to the trip results.</p></div>
 <div className="mt-8 rounded-3xl border border-[#263746] bg-[#101d2a] p-4"><div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4"><div className="relative lg:col-span-2"><Search aria-hidden="true" size={18} className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-[#91a7a1]"/><input className="input trip-search-input" value={filters.search} onChange={e=>change("search",e.target.value)} placeholder="Search title, city, country, category"/></div><input className="input" value={filters.country} onChange={e=>change("country",e.target.value)} placeholder="Country"/><input className="input" value={filters.city} onChange={e=>change("city",e.target.value)} placeholder="City"/><input className="input" type="number" value={filters.duration} onChange={e=>change("duration",e.target.value)} placeholder="Duration (days)"/><select className="input" value={filters.sort} onChange={e=>change("sort",e.target.value)}><option value="most_famous">Most Famous</option><option value="most_viewed">Most Viewed</option><option value="newest">Newest</option><option value="oldest">Oldest</option></select><button onClick={()=>load()} className="rounded-xl bg-[#9ee8c0] px-5 py-3 font-extrabold text-[#06251b]"><SlidersHorizontal size={16} className="mr-2 inline"/>Apply filters</button></div></div>
 <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{loading?[1,2,3,4,5,6].map(i=><div key={i} className="h-[420px] animate-pulse rounded-3xl bg-[#101d2a]"/>):items.map(t=><Card key={t._id||t.id} trip={t} favorite={favoriteIds.has(String(t?._id||t?.id))} onFavorite={toggleCardFavorite}/> )}</div>{!loading&&!items.length&&<div className="mt-8 rounded-3xl border border-dashed border-[#263746] p-12 text-center text-[#91a7a1]">No published trips match these filters.</div>}</section></Layout>;
}
