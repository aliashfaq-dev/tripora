import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import Layout, { Card } from "../components/Layout";
import { getFavorites, removeFavorite, getFavoriteTripId, getTrip } from "../api/trips";
import { getList, apiError } from "../api/response";
import { fetchAllPages } from "../api/pagination";

export default function SavedTrips() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const all = await fetchAllPages((page, limit) => getFavorites({ page, limit }), ["favorites", "trips", "posts", "items", "results", "data"], { limit: 100, maxPages: 50 });
      // Some API versions return favorite records, others return only trip/post IDs.
      // Hydrate ID-only records so the Saved page can always render the trip.
      const hydrated = await Promise.all(all.map(async (item) => {
        const embedded = item?.trip || item?.post || item;
        if (embedded?.title) return item;
        const id = getFavoriteTripId(item);
        if (!id) return item;
        try {
          const response = await getTrip(id);
          const trip = response?.data?.data?.trip || response?.data?.data?.post || response?.data?.data || response?.data?.trip || response?.data?.post || response?.data;
          return trip?.title ? { ...item, trip } : item;
        } catch { return item; }
      }));
      setItems(hydrated);
    } catch (e) {
      toast.error(apiError(e, "Could not load favorites."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const remove = async (value) => {
    const id = getFavoriteTripId(value);
    if (!id) return toast.error("This saved trip has an invalid id.");
    try {
      await removeFavorite(id);
      setItems((current) => current.filter((item) => {
        const itemId = getFavoriteTripId(item);
        return itemId == null || String(itemId) !== String(id);
      }));
      toast.success("Removed from favorites.");
    } catch (e) {
      toast.error(apiError(e, "Could not remove favorite."));
    }
  };

  const trips = items.map((item) => item?.trip || item?.post || item).filter((trip) => trip?.title);

  return <Layout>
    <section className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
      <h1 className="text-4xl font-black">Favorites</h1>
      <p className="mt-2 text-[#91a7a1]">Trips you have saved.</p>
      {loading ? <div className="mt-8 h-60 animate-pulse rounded-3xl bg-[#101d2a]" /> : trips.length ?
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">{trips.map((trip) => <Card key={trip._id || trip.id} trip={trip} favorite onFavorite={remove} />)}</div> :
        <div className="mt-8 rounded-3xl border border-dashed border-[#263746] p-12 text-center text-[#91a7a1]">No favorite trips yet. <Link className="text-[#9ee8c0]" to="/trips">Explore trips</Link></div>}
    </section>
  </Layout>;
}
