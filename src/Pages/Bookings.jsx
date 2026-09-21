import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { CalendarCheck, CheckCircle2, Clock3, XCircle, Ban, RefreshCw } from "lucide-react";
import Layout from "../components/Layout";
import { getBookings, cancelBooking, getOwnedBookings, updateBookingStatus } from "../api/bookings";
import { getOne, apiError } from "../api/response";
import { fetchAllPages } from "../api/pagination";
import { useSelector } from "react-redux";

const idOf = (value) => value?._id || value?.id || value;
const normalizeStatus = (status) => {
  const value = String(status || "PENDING").toUpperCase();
  if (value === "CONFIRMED" || value === "ACCEPTED") return "ACCEPTED";
  if (value === "CANCELLED" || value === "CANCELED") return "CANCELLED";
  if (value === "REJECTED" || value === "DECLINED") return "REJECTED";
  return "PENDING";
};

const statusMeta = {
  PENDING: { label: "Pending", icon: Clock3, className: "bg-amber-500/10 text-amber-300 border-amber-500/20" },
  ACCEPTED: { label: "Accepted", icon: CheckCircle2, className: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20" },
  REJECTED: { label: "Rejected", icon: XCircle, className: "bg-red-500/10 text-red-300 border-red-500/20" },
  CANCELLED: { label: "Cancelled", icon: Ban, className: "bg-red-500/10 text-red-300 border-red-500/20" },
};

const ownerIdOf = (booking) =>
  idOf(booking?.trip?.ownerId) ||
  idOf(booking?.trip?.owner) ||
  idOf(booking?.trip?.createdBy) ||
  idOf(booking?.trip?.userId) ||
  idOf(booking?.trip?.user) ||
  idOf(booking?.trip?.sellerId) ||
  idOf(booking?.trip?.seller) ||
  idOf(booking?.tripId?.ownerId) ||
  idOf(booking?.tripId?.owner) ||
  idOf(booking?.tripId?.createdBy) ||
  idOf(booking?.tripId?.userId) ||
  idOf(booking?.tripId?.user) ||
  idOf(booking?.post?.ownerId) ||
  idOf(booking?.post?.owner) ||
  idOf(booking?.post?.createdBy) ||
  idOf(booking?.post?.userId) ||
  idOf(booking?.post?.user) ||
  idOf(booking?.postId?.ownerId) ||
  idOf(booking?.postId?.owner) ||
  idOf(booking?.postId?.createdBy) ||
  idOf(booking?.postId?.userId) ||
  idOf(booking?.sellerId) ||
  idOf(booking?.seller) ||
  idOf(booking?.seller?.id) ||
  idOf(booking?.seller?._id);

const requesterIdOf = (booking) =>
  idOf(booking?.userId) ||
  idOf(booking?.user) ||
  idOf(booking?.travelerId) ||
  idOf(booking?.traveler) ||
  idOf(booking?.traveler?.userId) ||
  idOf(booking?.bookedBy) ||
  idOf(booking?.booker) ||
  idOf(booking?.buyerId) ||
  idOf(booking?.buyer) ||
  idOf(booking?.customerId) ||
  idOf(booking?.customer);

function StatusBadge({ status }) {
  const normalized = normalizeStatus(status);
  const meta = statusMeta[normalized] || statusMeta.PENDING;
  const Icon = meta.icon;
  return <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-extrabold ${meta.className}`}><Icon size={13} />{meta.label}</span>;
}

function StatusTabs({ value, onChange, options }) {
  return <div className="flex flex-wrap gap-2" role="tablist" aria-label="Booking status">
    {options.map((option) => <button key={option.value} type="button" role="tab" aria-selected={value === option.value} onClick={() => onChange(option.value)} className={`rounded-xl border px-4 py-2 text-xs font-extrabold transition ${value === option.value ? "border-[#9ee8c0] bg-[#9ee8c0] text-[#06251b]" : "border-[#2b4050] bg-[#0b1722] text-[#91a7a1] hover:border-[#527567]"}`}>{option.label}</button>)}
  </div>;
}

function BookingCard({ booking, received, onStatus, onCancel, onDetails }) {
  const normalized = normalizeStatus(booking.status);
  const title = booking.trip?.title || booking.post?.title || "Trip booking";
  const travelerName = booking.user?.name || booking.userId?.name || booking.traveler?.name || "Traveler";
  const travelerPhone = booking.user?.phone || booking.userId?.phone || booking.traveler?.phone;
  const date = booking.selectedDepartureDate ? new Date(booking.selectedDepartureDate).toLocaleDateString() : "Date unavailable";
  const returnDate = booking.selectedReturnDate ? new Date(booking.selectedReturnDate).toLocaleDateString() : null;
  const canCancel = !received && !["CANCELLED", "REJECTED"].includes(normalized);

  return <article className="rounded-2xl border border-[#263746] bg-[#101d2a] p-5 transition hover:border-[#365365]">
    <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-3"><h3 className="truncate text-base font-extrabold text-white">{title}</h3><StatusBadge status={booking.status} /></div>
        <p className="mt-2 text-sm text-[#91a7a1]">{received ? `Booking from ${travelerName}` : `${booking.travelers ?? 0} traveler(s)`}</p>
        {received && travelerPhone && <p className="mt-2 text-xs font-semibold text-[#9ee8c0]">Phone: {travelerPhone}</p>}
        <p className="mt-2 text-xs text-[#71878b]">{date}{returnDate ? ` → ${returnDate}` : ""}</p>
        <p className="mt-2 text-xs text-[#71878b]">{booking.currency || "USD"} {booking.amount ?? 0}</p>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        {received && normalized === "PENDING" && <><button type="button" onClick={() => onStatus(booking, "CONFIRMED")} className="rounded-xl bg-[#9ee8c0] px-4 py-2 text-xs font-extrabold text-[#06251b]">Accept</button><button type="button" onClick={() => onStatus(booking, "REJECTED")} className="rounded-xl border border-red-900/60 px-4 py-2 text-xs font-extrabold text-red-300">Reject</button></>}
        {!received && <button type="button" onClick={() => onDetails(booking)} className="rounded-xl border border-[#2b4050] px-4 py-2 text-xs font-extrabold text-[#d7e4e0]">Details</button>}
        {canCancel && <button type="button" onClick={() => onCancel(booking)} className="rounded-xl border border-red-900/60 px-4 py-2 text-xs font-extrabold text-red-300">Cancel</button>}
      </div>
    </div>
  </article>;
}

export default function Bookings() {
  const { user } = useSelector((state) => state.auth);
  const [mine, setMine] = useState([]);
  const [incoming, setIncoming] = useState([]);
  const [activeArea, setActiveArea] = useState("received");
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [incomingLoading, setIncomingLoading] = useState(true);
  const [incomingFilter, setIncomingFilter] = useState("ALL");
  const [mineFilter, setMineFilter] = useState("ALL");

  const loadMine = async () => {
    try {
      const list = await fetchAllPages((page, limit) => getBookings({ page, limit }), ["bookings", "items", "results"], { limit: 100, maxPages: 50 });
      setMine(list);
    } catch (e) { toast.error(apiError(e, "Could not load your bookings.")); }
  };

  const loadIncoming = async () => {
    setIncomingLoading(true);
    try {
      const list = await fetchAllPages((page, limit) => getOwnedBookings({ page, limit }), ["bookings", "items", "results"], { limit: 100, maxPages: 50 });
      setIncoming(list);
    } catch (e) {
      setIncoming([]);
      toast.error(apiError(e, "Could not load booking requests for your trips."));
    } finally { setIncomingLoading(false); }
  };

  useEffect(() => { setLoading(true); Promise.all([loadMine(), loadIncoming()]).finally(() => setLoading(false)); }, []);

  const currentUserId = idOf(user);

  // Keep the two areas mutually exclusive at the UI boundary, even if a backend
  // endpoint returns a broader booking collection than its documented scope.
  // The seller-owned endpoint is already scoped to trips owned by the
  // authenticated user. Do not re-filter it by optional populated owner fields:
  // some backend responses omit those fields, which previously hid valid
  // incoming bookings.
  const incomingOwned = useMemo(() => incoming, [incoming]);

  // The traveler endpoint is scoped to bookings made by the authenticated user.
  // If a response also contains populated owner data, explicitly exclude a
  // booking for a trip owned by the current user so it cannot leak into the
  // Made area.
  const mineOwned = useMemo(() => {
    if (!currentUserId) return [];
    return mine.filter((booking) => {
      const owner = ownerIdOf(booking);
      if (owner && String(owner) === String(currentUserId)) return false;
      const requester = requesterIdOf(booking);
      return !requester || String(requester) === String(currentUserId);
    });
  }, [mine, currentUserId]);

  const incomingByStatus = useMemo(() => incomingOwned.filter((booking) => incomingFilter === "ALL" || normalizeStatus(booking.status) === incomingFilter), [incomingOwned, incomingFilter]);
  const mineByStatus = useMemo(() => mineOwned.filter((booking) => mineFilter === "ALL" || normalizeStatus(booking.status) === mineFilter), [mineOwned, mineFilter]);

  const updateStatus = async (booking, status) => {
    try {
      const response = await updateBookingStatus(idOf(booking), status);
      const updated = getOne(response, ["booking"]);
      setIncoming((items) => items.map((item) => idOf(item) === idOf(booking) ? { ...item, ...(updated || {}), status } : item));
      toast.success(status === "CONFIRMED" ? "Booking accepted." : "Booking rejected.");
      await loadIncoming();
    } catch (e) { toast.error(apiError(e, "Could not update booking status.")); }
  };

  const cancelMine = async (booking) => {
    const status = normalizeStatus(booking?.status);
    if (["CANCELLED", "REJECTED"].includes(status)) return;
    try {
      const response = await cancelBooking(idOf(booking));
      const updated = getOne(response, ["booking"]);
      setMine((items) => items.map((item) => idOf(item) === idOf(booking) ? { ...item, ...(updated || {}), status: updated?.status || "CANCELLED" } : item));
      toast.success("Booking cancelled.");
    } catch (e) { toast.error(apiError(e, "Could not cancel this booking.")); }
  };

  const refreshActive = () => activeArea === "received" ? loadIncoming() : loadMine();
  const activeList = activeArea === "received" ? incomingByStatus : mineByStatus;
  const activeLoading = activeArea === "received" ? incomingLoading : loading;
  const activeFilter = activeArea === "received" ? incomingFilter : mineFilter;
  const setActiveFilter = activeArea === "received" ? setIncomingFilter : setMineFilter;

  return <Layout><section className="mx-auto max-w-6xl px-6 py-10 lg:px-8">
    <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="text-xs font-extrabold uppercase tracking-[.2em] text-[#9ee8c0]">BOOKINGS</p><h1 className="mt-2 text-4xl font-black tracking-[-.03em]">Bookings</h1><p className="mt-2 text-[#91a7a1]">Manage trips you booked and booking requests for your trips.</p></div>
      <button type="button" onClick={refreshActive} className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#2b4050] px-4 py-2.5 text-xs font-extrabold text-[#d7e4e0]"><RefreshCw size={14}/> Refresh</button>
    </div>

    <div className="mt-8 rounded-2xl border border-[#263746] bg-[#0b1722] p-1.5 sm:max-w-xl" role="tablist" aria-label="Booking area">
      <div className="grid grid-cols-2 gap-1.5">
        <button type="button" role="tab" aria-selected={activeArea === "received"} onClick={() => setActiveArea("received")} className={`rounded-xl px-5 py-3.5 text-sm font-extrabold transition ${activeArea === "received" ? "bg-[#9ee8c0] text-[#06251b]" : "text-[#91a7a1] hover:bg-white/[.03]"}`}>Bookings received <span className="ml-1.5 opacity-70">{incomingOwned.length}</span></button>
        <button type="button" role="tab" aria-selected={activeArea === "made"} onClick={() => setActiveArea("made")} className={`rounded-xl px-5 py-3.5 text-sm font-extrabold transition ${activeArea === "made" ? "bg-[#9ee8c0] text-[#06251b]" : "text-[#91a7a1] hover:bg-white/[.03]"}`}>Bookings made <span className="ml-1.5 opacity-70">{mineOwned.length}</span></button>
      </div>
    </div>

    <section className="mt-6 rounded-3xl border border-[#2b5a48] bg-[radial-gradient(circle_at_85%_10%,rgba(86,173,126,.13),transparent_35%),#0d1a26] p-5 sm:p-7">
      <div className="flex flex-col gap-4 border-b border-[#233543] pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div><div className="flex items-center gap-2 text-[#75d8a4]"><CalendarCheck size={17}/><p className="text-[10px] font-extrabold uppercase tracking-[.18em]">{activeArea === "received" ? "Incoming" : "Your bookings"}</p></div><h2 className="mt-1 text-2xl font-black">{activeArea === "received" ? "Bookings you received" : "Bookings you made"}</h2><p className="mt-1 text-sm text-[#71878b]">{activeArea === "received" ? "Approve or reject requests for your published trips." : "Track and manage the trips you have booked."}</p></div>
      </div>

      <div className="mt-5"><StatusTabs value={activeFilter} onChange={setActiveFilter} options={activeArea === "received" ? [{ value: "ALL", label: "All" }, { value: "PENDING", label: "Pending" }, { value: "ACCEPTED", label: "Accepted" }, { value: "REJECTED", label: "Rejected" }] : [{ value: "ALL", label: "All" }, { value: "PENDING", label: "Pending" }, { value: "ACCEPTED", label: "Accepted" }, { value: "CANCELLED", label: "Cancelled" }]} /></div>

      <div className="mt-5 space-y-3">
        {activeLoading ? <div className="rounded-2xl border border-dashed border-[#2b4050] p-10 text-center text-sm text-[#71878b]">Loading bookings...</div> : activeList.length ? activeList.map((booking) => <BookingCard key={idOf(booking)} booking={booking} received={activeArea === "received"} onStatus={updateStatus} onCancel={cancelMine} onDetails={setSelected} />) : <div className="rounded-2xl border border-dashed border-[#2b4050] p-12 text-center text-sm text-[#71878b]">No {activeFilter === "ALL" ? "bookings" : activeFilter.toLowerCase()} {activeArea === "received" ? "requests" : "bookings"} yet.</div>}
      </div>
    </section>

    {selected && <div className="fixed inset-0 z-[120] grid place-items-center bg-black/70 p-5" onClick={() => setSelected(null)}><div className="w-full max-w-2xl rounded-2xl border border-[#263746] bg-[#101d2a] p-6" onClick={(event) => event.stopPropagation()}><h2 className="text-xl font-bold">Booking details</h2><div className="mt-5 grid gap-3 sm:grid-cols-2"><div className="rounded-xl border border-[#263746] bg-[#0b1722] p-4"><p className="text-[10px] font-extrabold uppercase tracking-wider text-[#60777c]">Trip</p><p className="mt-1 font-bold">{selected.trip?.title || selected.post?.title || "Trip booking"}</p></div><div className="rounded-xl border border-[#263746] bg-[#0b1722] p-4"><p className="text-[10px] font-extrabold uppercase tracking-wider text-[#60777c]">Status</p><p className="mt-1 font-bold">{normalizeStatus(selected.status)}</p></div><div className="rounded-xl border border-[#263746] bg-[#0b1722] p-4"><p className="text-[10px] font-extrabold uppercase tracking-wider text-[#60777c]">Travelers</p><p className="mt-1 font-bold">{selected.travelers ?? 0}</p></div><div className="rounded-xl border border-[#263746] bg-[#0b1722] p-4"><p className="text-[10px] font-extrabold uppercase tracking-wider text-[#60777c]">Amount</p><p className="mt-1 font-bold">{selected.currency || "USD"} {selected.amount ?? 0}</p></div></div><button type="button" className="btn mt-5" onClick={() => setSelected(null)}>Close</button></div></div>}
  </section></Layout>;
}
