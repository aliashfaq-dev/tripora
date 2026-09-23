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
 const [filters,setFilters]=useState({search:params.get("search")||"",country:params.get("country")||"",city:"",duration:params.get("duration")||"",sort:params.get("sort")||"most_famous"});
 const getTripDateEntries=(trip)=>{
   const sources=[trip?.availability,trip?.tripDates,trip?.dates,trip?.schedule];
   const entries=sources.flatMap((value)=>{
     if(Array.isArray(value)) return value;
     if(value&&typeof value === "object") return Array.isArray(value?.items)?value.items:[value];
     return [];
   }).filter(Boolean);
   if(trip?.departureDate||trip?.returnDate) entries.push(trip);
   return entries;
 };
 const dateOnly=(value)=>{
   if(!value) return null;
   const text=String(value);
   const match=text.match(/^(\d{4})-(\d{2})-(\d{2})/);
   if(match) return Date.UTC(Number(match[1]),Number(match[2])-1,Number(match[3]));
   const parsed=new Date(value);
   return Number.isFinite(parsed.getTime()) ? Date.UTC(parsed.getFullYear(),parsed.getMonth(),parsed.getDate()) : null;
 };
 const getTripDurationDays=(trip)=>getTripDateEntries(trip).map((d)=>{
   const start=dateOnly(d?.departureDate);
   const end=dateOnly(d?.returnDate);
   if(start==null||end==null||end<start) return null;
   return Math.max(1,Math.round((end-start)/86400000)+1);
 }).filter(Number.isFinite);
 const load=async(next=filters)=>{setLoading(true);try{
   const clean=Object.fromEntries(Object.entries(next).filter(([k,v])=>!['date','duration'].includes(k)&&v!==""&&v!=null));
   const list=await fetchAllPages((page,limit)=>getTrips({...clean,page,limit}),["trips","posts","items","results"],{limit:100,maxPages:50});
   const visible=list.filter((x)=>{
     if(!isPublishedTrip(x)||isTripExpired(x))return false;
     if(next.duration){
       const wanted=Number(next.duration);
       const actual=getTripDurationDays(x);
       if(!actual.includes(wanted))return false;
     }
     return true;
   });
   const numberValue=(value)=>{const n=Number(value);return Number.isFinite(n)?n:0;};
   const dateValue=(trip)=>{const value=trip?.createdAt||trip?.publishedAt||trip?.updatedAt||trip?.date;const time=value?new Date(value).getTime():0;return Number.isFinite(time)?time:0;};
   const sorted=[...visible].sort((a,b)=>{
     if(next.sort==="most_viewed")return numberValue(b?.viewCount??b?.views??b?.viewsCount)-numberValue(a?.viewCount??a?.views??a?.viewsCount);
     if(next.sort==="newest")return dateValue(b)-dateValue(a);
     if(next.sort==="oldest")return dateValue(a)-dateValue(b);
     return numberValue(b?.favoriteCount??b?.favoritesCount??b?.likesCount)-numberValue(a?.favoriteCount??a?.favoritesCount??a?.likesCount);
   });
   setItems(sorted);setParams(clean,{replace:true});
 }catch(e){toast.error(apiError(e,"Could not load trips."));}finally{setLoading(false)}};
 const loadFavorites=async()=>{if(!isAuthenticated){setFavoriteIds(new Set());return;}try{const all=await fetchAllPages((page,limit)=>getFavorites({page,limit}),["favorites","trips","posts","items","results"],{limit:100,maxPages:50});setFavoriteIds(new Set(all.map(getFavoriteTripId).filter(Boolean).map((value) => String(value))));}catch{setFavoriteIds(new Set());}};
 const toggleCardFavorite=async(trip)=>{if(!isAuthenticated){toast.error("Login to favorite trips.");return;}const id=trip?._id||trip?.id;if(!id)return;const key=String(id);const wasFavorite=favoriteIds.has(key);setFavoriteIds(prev=>{const next=new Set(prev);wasFavorite?next.delete(key):next.add(key);return next;});try{wasFavorite?await removeFavorite(id):await addFavorite(id);toast.success(wasFavorite?"Removed from favorites.":"Added to favorites.");}catch(e){setFavoriteIds(prev=>{const next=new Set(prev);wasFavorite?next.add(key):next.delete(key);return next;});toast.error(apiError(e,"Could not update favorite."));}};
 useEffect(()=>{load(filters);},[]);
 useEffect(()=>{loadFavorites();},[isAuthenticated]);
 const change=(k,v)=>setFilters(f=>({...f,[k]:v}));
 return <Layout><section className="mx-auto max-w-7xl px-6 py-12 lg:px-8"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-[#9ee8c0]">Explore</p><h1 className="mt-2 text-5xl font-black">Find your next trip.</h1><p className="mt-3 text-[#91a7a1]">Search, filters and sorting are applied to the trip results.</p></div>
 <div className="mt-8 rounded-3xl border border-[#263746] bg-[#101d2a] p-4"><div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4"><div className="relative lg:col-span-2"><Search aria-hidden="true" size={18} className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-[#91a7a1]"/><input className="input trip-search-input" value={filters.search} onChange={e=>change("search",e.target.value)} placeholder="Search title, city, country, category"/></div><input className="input" value={filters.country} onChange={e=>change("country",e.target.value)} placeholder="Country"/><input className="input" value={filters.city} onChange={e=>change("city",e.target.value)} placeholder="City"/><select className="input" value={filters.duration} onChange={e=>change("duration",e.target.value)}><option value="">Any duration</option>{Array.from({length:30},(_,i)=>i+1).map(day=><option key={day} value={day}>{day} day{day===1?"":"s"}</option>)}</select><select className="input" value={filters.sort} onChange={e=>change("sort",e.target.value)} ><option value="most_famous">Most Famous</option><option value="most_viewed">Most Viewed</option><option value="newest">Newest</option><option value="oldest">Oldest</option></select><button onClick={()=>load()} className="rounded-xl bg-[#9ee8c0] px-5 py-3 font-extrabold text-[#06251b]"><SlidersHorizontal size={16} className="mr-2 inline"/>Apply filters</button></div></div>
 <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{loading?[1,2,3,4,5,6].map(i=><div key={i} className="h-[420px] animate-pulse rounded-3xl bg-[#101d2a]"/>):items.map(t=><Card key={t._id||t.id} trip={t} favorite={favoriteIds.has(String(t?._id||t?.id))} onFavorite={toggleCardFavorite}/> )}</div>{!loading&&!items.length&&<div className="mt-8 rounded-3xl border border-dashed border-[#263746] p-12 text-center text-[#91a7a1]">No published trips match these filters.</div>}</section></Layout>;
}
