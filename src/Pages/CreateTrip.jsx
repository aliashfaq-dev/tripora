import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Check, ChevronLeft, ChevronRight, ImagePlus, Save, Sparkles, UploadCloud } from "lucide-react";
import toast from "react-hot-toast";
import Layout from "../components/Layout";
import { createPost, getMyPost, updateMyPost, submitMyPost, activateMyPost } from "../api/posts";
import { getDestinations, createDestination } from "../api/destinations";
import { getList, getOne, apiError } from "../api/response";
import { normalizeImageUrl } from "../components/ui";

const DRAFT_KEY = "tripora-create-draft-v2";
const DRAFT_ID_KEY = "tripora-create-draft-id-v2";
const CUSTOM_DESTINATION_RE = /^\p{L}[\p{L}\p{M}'’.-]*(?:[ \t]+[\p{L}\p{M}'’.-]+)*,\s*\p{L}[\p{L}\p{M}'’.-]*(?:[ \t]+[\p{L}\p{M}'’.-]+)*$/u;
const isValidCustomDestination = (value) => {
  const normalized = String(value || "").trim();
  if (normalized.length < 5 || normalized.length > 120) return false;
  return CUSTOM_DESTINATION_RE.test(normalized);
};

const localDateTime = (date) => {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const tomorrowAtNine = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(9, 0, 0, 0);
  return localDateTime(d);
};

const plusDays = (value, days) => {
  const d = value ? new Date(value) : new Date();
  if (Number.isNaN(d.getTime())) return "";
  d.setDate(d.getDate() + days);
  return localDateTime(d);
};

const iso = (value) => (value ? new Date(value).toISOString() : "");

const initialDeparture = tomorrowAtNine();
const initialReturn = plusDays(initialDeparture, 3);

const blank = {
  title: "",
  description: "",
  destination: "",
  customDestination: false,
  departureDate: initialDeparture,
  returnDate: initialReturn,
  seats: 10,
  price: "",
  currency: "PKR",
  coverImage: null,
  galleryImages: [],
  existingCoverImage: "",
  existingGalleryImages: [],
};

const Field = ({ label, hint, children, className = "" }) => (
  <label className={`block ${className}`}>
    <span className="text-[12px] font-bold text-[#c7d4d2]">{label}</span>
    {hint && <span className="ml-2 text-[10px] text-[#63797e]">{hint}</span>}
    {children}
  </label>
);

const inputClass = "input mt-2 h-12 rounded-xl px-3.5";

export default function CreateTrip() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const editing = Boolean(id);
  const activateAfterSave = editing && searchParams.get("activate") === "1";
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(blank);
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [draftSaving, setDraftSaving] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [editingStatus, setEditingStatus] = useState("");
  const [draftId, setDraftId] = useState("");

  useEffect(() => {
    let alive = true;
    getDestinations({ limit: 100 }).then((response) => {
      if (alive) setDestinations(getList(response, ["destinations"]));
    }).catch(() => {});

    const load = async () => {
      if (editing) {
        setDraftId(id);
        try {
          const response = await getMyPost(id);
          const trip = getOne(response, ["trip"]);
          if (!alive || !trip) return;
          const availability = trip.availability?.[0] || {};
          const destinationValue = typeof trip.destination === "object" ? trip.destination?._id || trip.destination?.id : trip.destination;
          const selectedDestination = typeof trip.destination === "object" ? trip.destination : null;
          setEditingStatus(String(trip.status || "DRAFT").toUpperCase());
          setForm({
            ...blank,
            title: trip.title || "",
            description: trip.description || "",
            destination: destinationValue || "",
            customDestination: !selectedDestination && !String(destinationValue || "").match(/^[a-f\\d]{24}$/i),
            departureDate: availability.departureDate ? localDateTime(new Date(availability.departureDate)) : initialDeparture,
            returnDate: availability.returnDate ? localDateTime(new Date(availability.returnDate)) : initialReturn,
            seats: availability.totalSeats || availability.availableSeats || 10,
            price: trip.price ?? "",
            currency: trip.currency === "USD" ? "USD" : "PKR",
            existingCoverImage: normalizeImageUrl(trip.coverImage),
            existingGalleryImages: Array.isArray(trip.galleryImages) ? trip.galleryImages.map(normalizeImageUrl).filter(Boolean) : [],
            coverImage: null,
            galleryImages: [],
          });
        } catch (error) {
          toast.error(apiError(error, "Could not load trip."));
        } finally {
          if (alive) setInitialized(true);
        }
      } else {
        // A fresh /create-trip page must never reuse a stale server draft id.
        // Reusing it turns a new POST into PATCH and causes 404s when that old id
        // no longer exists on the reset backend.
        localStorage.removeItem(DRAFT_ID_KEY);
        setDraftId("");
        try {
          const saved = JSON.parse(localStorage.getItem(DRAFT_KEY) || "null");
          if (saved && alive) setForm((current) => ({ ...current, ...saved, coverImage: null, galleryImages: [], existingCoverImage: "", existingGalleryImages: [] }));
        } catch { /* ignore malformed local draft */ }
        if (alive) setInitialized(true);
      }
    };

    load();
    return () => { alive = false; };
  }, [editing, id]);

  useEffect(() => {
    if (!initialized || editing) return;
    const serializable = { ...form, coverImage: null, galleryImages: [], existingCoverImage: "", existingGalleryImages: [] };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(serializable));
  }, [form, initialized, editing]);

  const selectedDestination = useMemo(
    () => destinations.find((d) => String(d?._id || d?.id) === String(form.destination)),
    [destinations, form.destination]
  );

  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const selectDestination = (value) => {
    setForm((current) => ({
      ...current,
      destination: value === "__custom__" ? "" : value,
      customDestination: value === "__custom__",
    }));
  };

  const changeDeparture = (value) => {
    setForm((current) => ({ ...current, departureDate: value }));
  };

  const imageCount = (form.coverImage || form.existingCoverImage ? 1 : 0) + form.existingGalleryImages.length + form.galleryImages.length;

  const buildPayload = (destinationValue = form.destination) => ({
    title: String(form.title ?? "").trim(),
    description: form.description.trim(),
    destination: destinationValue,
    departureDate: iso(form.departureDate),
    returnDate: iso(form.returnDate),
    seats: Number(form.seats),
    price: Number(form.price),
    currency: form.currency,
    availability: [{
      departureDate: iso(form.departureDate),
      returnDate: iso(form.returnDate),
      totalSeats: Number(form.seats),
      availableSeats: Number(form.seats),
    }],
    ...(form.coverImage || form.existingCoverImage ? { coverImage: form.coverImage || form.existingCoverImage } : {}),
    galleryImages: [...form.existingGalleryImages, ...form.galleryImages],
  });

  const resolveDestinationId = async () => {
    const current = String(form.destination || "").trim();
    if (!form.customDestination) return current;
    if (!current) return "";

    // The post API requires destination to be a real Mongo ObjectId.
    // When the user chooses "My destination isn't listed", create/reuse
    // the destination first and send the returned id to the post API.
    const existing = destinations.find(
      (item) => String(item?.name || "").trim().toLowerCase() === current.toLowerCase()
    );
    const existingId = existing?._id || existing?.id;
    if (existingId && /^[a-f\d]{24}$/i.test(String(existingId))) {
      setForm((previous) => ({ ...previous, destination: String(existingId), customDestination: false }));
      return String(existingId);
    }

    const match = current.match(/^(.+?),\s*(.+)$/);
    if (!match || !isValidCustomDestination(current)) throw new Error("Enter your destination as City, Country.");
    const response = await createDestination({ name: current, city: match[1].trim(), country: match[2].trim() });
    const root = response?.data?.data ?? response?.data ?? {};
    const created = root?.destination || root?.item || root;
    const destinationId = created?._id || created?.id || root?._id || root?.id;
    if (!destinationId || !/^[a-f\d]{24}$/i.test(String(destinationId))) {
      throw new Error("The destination could not be created. Please try again.");
    }

    const normalized = { ...(created || {}), _id: String(destinationId), id: String(destinationId), name: created?.name || current };
    setDestinations((previous) => [normalized, ...previous.filter((item) => String(item?._id || item?.id) !== String(destinationId))]);
    setForm((previous) => ({ ...previous, destination: String(destinationId), customDestination: false }));
    return String(destinationId);
  };

  const persistDraft = async (showToast = true) => {
    const serializable = { ...form, coverImage: null, galleryImages: [], existingCoverImage: "", existingGalleryImages: [] };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(serializable));

    // Do not create an invalid backend record from an empty first step.
    if (!form.title.trim() || !(form.customDestination ? form.destination.trim() : form.destination)) {
      if (showToast) toast.success("Draft saved on this device.");
      return null;
    }

    setDraftSaving(true);
    try {
      const destinationId = await resolveDestinationId();
      if (!destinationId) throw new Error("Please choose a valid destination.");
      const payload = buildPayload(destinationId);
      const existingDraftId = editing ? (id || draftId) : draftId;
      const response = existingDraftId ? await updateMyPost(existingDraftId, payload) : await createPost(payload);
      const trip = getOne(response, ["trip"]);
      const tripId = existingDraftId || trip?._id || trip?.id;
      if (tripId) { setDraftId(String(tripId)); localStorage.setItem(DRAFT_ID_KEY, tripId); }
      if (showToast) toast.success("Draft saved.");
      return tripId;
    } catch (error) {
      if (showToast) toast.error(`${apiError(error, "Draft saved locally. Backend draft could not be updated.")}`);
      return null;
    } finally {
      setDraftSaving(false);
    }
  };

  const next = async () => {
    if (step === 1) {
      if (!form.title.trim()) return toast.error("Add a trip title first.");
      if (!(form.customDestination ? form.destination.trim() : form.destination)) return toast.error("Choose a destination or add your own.");
      if (form.customDestination && !isValidCustomDestination(form.destination)) return toast.error("Enter your destination as City, Country.");
    }
    if (step === 2) {
      if (!String(form.price).trim() || !Number.isFinite(Number(form.price)) || Number(form.price) <= 0) return toast.error("Enter a valid price greater than 0.");
      if (!form.currency || !["PKR", "USD"].includes(form.currency)) return toast.error("Currency must be PKR or USD.");
      if (!form.departureDate || !form.returnDate || new Date(form.returnDate) <= new Date(form.departureDate)) return toast.error("Return must be after departure.");
      if (!Number.isInteger(Number(form.seats)) || Number(form.seats) < 1) return toast.error("Enter at least 1 available seat.");
    }
    // Continue is navigation only. The form is already autosaved locally.
    setStep((current) => Math.min(3, current + 1));
  };

  const cancel = async () => {
    if (!editing) {
      try { await persistDraft(true); } catch { /* local draft is already autosaved */ }
    }
    navigate("/my-trips");
  };

  const submit = async (asSubmitted) => {
    if (!form.title.trim() || !form.description.trim()) return toast.error("Add a title and description.");
    if (!(form.customDestination ? form.destination.trim() : form.destination)) return toast.error("Choose a destination or add your own.");
    if (form.customDestination && !isValidCustomDestination(form.destination)) return toast.error("Enter your destination as City, Country.");
    if (!form.departureDate || !form.returnDate || new Date(form.returnDate) <= new Date(form.departureDate)) return toast.error("Return date must be after departure.");
    if (!Number.isInteger(Number(form.seats)) || Number(form.seats) < 1) return toast.error("Enter valid available seats.");
    if (!String(form.price).trim() || !Number.isFinite(Number(form.price)) || Number(form.price) <= 0) return toast.error("Enter a valid price greater than 0.");
    if (!form.currency || !["PKR", "USD"].includes(form.currency)) return toast.error("Currency must be PKR or USD.");
    if (imageCount < 1) return toast.error("Add at least one cover picture.");
    if (imageCount > 11) return toast.error("A trip can contain a maximum of 11 pictures (1 cover + 10 gallery images).");

    setLoading(true);
    try {
      const destinationId = await resolveDestinationId();
      if (!destinationId) throw new Error("Please choose a valid destination.");
      const payload = buildPayload(destinationId);
      const existingDraftId = editing ? (id || draftId) : draftId;
      const response = existingDraftId ? await updateMyPost(existingDraftId, payload) : await createPost(payload);
      const trip = getOne(response, ["trip"]);
      const tripId = existingDraftId || trip?._id || trip?.id;
      if (!tripId) throw new Error("The server did not return the trip id.");

      // Editing an already-published post is an update, not a submission.
      // The submit endpoint intentionally accepts only DRAFT/REJECTED/EXPIRED
      // posts, so never call it for PUBLISHED (or other non-submittable) posts.
      const currentStatus = String(editing ? editingStatus || trip?.status || "DRAFT" : "DRAFT").toUpperCase();
      const canSubmitEditedPost = ["DRAFT", "REJECTED", "EXPIRED"].includes(currentStatus);

      if (asSubmitted && (!editing || canSubmitEditedPost)) {
        await submitMyPost(tripId);
        toast.success("Trip submitted for approval.");
      } else if (editing) {
        if (activateAfterSave && currentStatus === "INACTIVE") {
          await activateMyPost(tripId);
          toast.success("Trip changes saved and trip activated.");
        } else {
          toast.success("Trip changes saved.");
        }
      } else {
        toast.success("Trip saved as draft.");
      }
      localStorage.removeItem(DRAFT_KEY);
      localStorage.removeItem(DRAFT_ID_KEY);
      navigate("/my-trips");
    } catch (error) {
      toast.error(apiError(error, "Could not save the trip. Check your connection and try again."));
    } finally {
      setLoading(false);
    }
  };

  const coverPreview = useMemo(() => {
    if (!form.coverImage) return normalizeImageUrl(form.existingCoverImage);
    return URL.createObjectURL(form.coverImage);
  }, [form.coverImage, form.existingCoverImage]);

  useEffect(() => () => {
    if (coverPreview?.startsWith("blob:")) URL.revokeObjectURL(coverPreview);
  }, [coverPreview]);

  const galleryPreviews = useMemo(() => form.galleryImages.map((file) => ({ file, url: URL.createObjectURL(file) })), [form.galleryImages]);
  useEffect(() => () => {
    galleryPreviews.forEach(({ url }) => URL.revokeObjectURL(url));
  }, [galleryPreviews]);

  return (
    <Layout>
      <section className="create-trip-page mx-auto max-w-[1120px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-[#75d8a4]">{editing ? "Edit trip" : "New trip"}</p>
            <h2 className="mt-1 text-2xl font-extrabold tracking-[-.03em]">{editing ? "Update your trip" : "Create a trip"}</h2>
            <p className="mt-1 text-sm text-[#71878b]">Keep it simple. Add the essentials and let Tripora handle the rest.</p>
          </div>
          <Link to="/my-trips" className="hidden text-sm font-semibold text-[#8fa5a7] hover:text-white sm:block">Back to my trips</Link>
        </div>

        <div className="mb-5 grid grid-cols-3 gap-2 rounded-2xl border border-[#233543] bg-[#0b1722] p-2">
          {["Basics", "Schedule", "Photos & review"].map((label, index) => {
            const number = index + 1;
            return <button key={label} type="button" onClick={() => number < step && setStep(number)} className={`create-step flex items-center gap-2 rounded-xl px-3 py-2.5 text-left text-xs font-bold transition ${step === number ? "active bg-[#123b30] text-[#b9efd0]" : number < step ? "complete text-[#9ee8c0] hover:bg-white/[.03]" : "text-[#61777d]"}`}><span className={`create-step-number grid h-6 w-6 place-items-center rounded-full text-[10px] ${step === number ? "active" : ""}`}>{number < step ? <Check size={13}/> : number}</span><span className="hidden sm:block">{label}</span></button>;
          })}
        </div>

        <div className="rounded-2xl border border-[#233543] bg-[#0d1a26] p-5 shadow-2xl sm:p-7">
          {step === 1 && (
            <div className="space-y-5">
              <div><h3 className="text-lg font-extrabold">Tell travelers what they're booking</h3><p className="mt-1 text-xs text-[#71878b]">One clear description is enough. You can edit everything later.</p></div>
              <div className="grid gap-5 md:grid-cols-2">
                <Field label="Trip title *" className="md:col-span-2"><input className={inputClass} value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Give your trip a clear title" /></Field>
                <Field label="Destination *" hint="Choose an existing destination or enter a new one"><select className={inputClass} value={form.customDestination ? "__custom__" : form.destination} onChange={(e) => selectDestination(e.target.value)}><option value="">Choose a destination</option>{destinations.map((d) => <option key={d._id || d.id} value={d._id || d.id}>{d.name}{d.country ? ` · ${d.country}` : ""}</option>)}<option value="__custom__">My destination isn't listed</option></select></Field>
                {form.customDestination && <Field label="Your destination *"><input className={inputClass} value={form.destination} onChange={(e) => set("destination", e.target.value)} placeholder="City, Country — e.g. Fairy Meadows, Pakistan" /></Field>}
                <Field label="Description *" className="md:col-span-2"><textarea className="input mt-2 min-h-[150px] resize-y rounded-xl p-3.5" value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Tell travelers what makes this trip worth taking..." /></Field>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div><h3 className="text-lg font-extrabold">Set the practical details</h3><p className="mt-1 text-xs text-[#71878b]">Departure is automatically set to tomorrow at 9:00 AM. Change it whenever you need.</p></div>
              <div className="grid gap-5 md:grid-cols-2">
                <Field label="Departure *" hint="Tomorrow by default"><input className={inputClass} type="datetime-local" min={tomorrowAtNine()} value={form.departureDate} onChange={(e) => changeDeparture(e.target.value)} /></Field>
                <Field label="Return *"><input className={inputClass} type="datetime-local" min={form.departureDate} value={form.returnDate} onChange={(e) => set("returnDate", e.target.value)} /></Field>
                <Field label="Available seats *"><input className={inputClass} type="number" min="1" value={form.seats} onChange={(e) => set("seats", e.target.value)} /></Field>
                <Field label="Price per traveler *"><input className={inputClass} type="number" min="0.01" step="0.01" value={form.price} onChange={(e) => set("price", e.target.value)} placeholder="e.g. 15000" /></Field>
                <Field label="Currency *"><select className={inputClass} value={form.currency} onChange={(e) => set("currency", e.target.value)}><option value="PKR">PKR</option><option value="USD">USD</option></select></Field>
                <div className="flex items-center gap-3 rounded-xl border border-[#244235] bg-[#0e2a21] p-4"><Sparkles size={19} className="shrink-0 text-[#9ee8c0]"/><div><p className="text-xs font-bold text-[#bcefd2]">Simple schedule</p><p className="mt-1 text-[11px] leading-5 text-[#789b8d]">Set the dates and available seats for this trip.</p></div></div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-end justify-between gap-3"><div><h3 className="text-lg font-extrabold">Make it look good</h3><p className="mt-1 text-xs text-[#71878b]">One cover is required. You can use up to 11 pictures total (1 cover + 10 gallery).</p></div><span className={`rounded-full border px-3 py-1 text-xs font-bold ${imageCount > 11 ? "border-red-800 bg-red-950/30 text-red-300" : "border-[#29483c] bg-[#102a21] text-[#9ee8c0]"}`}>{imageCount}/11 pictures</span></div>
              <div className="grid gap-5 lg:grid-cols-[1.05fr_.95fr]">
                <div className="rounded-2xl border border-dashed border-[#355061] bg-[#0a1621] p-4">
                  <div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-lg bg-[#123b30] text-[#9ee8c0]"><ImagePlus size={17}/></span><div><p className="text-sm font-bold">Cover picture *</p><p className="text-[11px] text-[#71878b]">The main image shown on your trip.</p></div></div>
                  {coverPreview ? <img src={coverPreview} alt="Cover preview" className="mt-4 h-56 w-full rounded-xl object-cover" /> : <div className="mt-4 grid h-56 place-items-center rounded-xl border border-[#1f3340] bg-[#08131d] text-center text-[#657b80]"><UploadCloud size={28} className="mx-auto"/><p className="mt-2 text-xs">Choose a cover image</p></div>}
                  <label className="mt-4 flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#2b4050] text-xs font-bold text-[#b8c8c7] hover:bg-white/[.03]"><UploadCloud size={15}/>{form.coverImage ? "Replace cover" : form.existingCoverImage ? "Replace existing cover" : "Choose cover"}<input type="file" accept="image/*" className="hidden" onChange={(e) => set("coverImage", e.target.files?.[0] || null)} /></label>
                </div>
                <div className="rounded-2xl border border-[#233543] bg-[#0a1621] p-4"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-lg bg-[#162633] text-[#9aaeb0]"><UploadCloud size={17}/></span><div><p className="text-sm font-bold">Additional pictures</p><p className="text-[11px] text-[#71878b]">Up to 10 gallery images.</p></div></div><label className="mt-4 flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#2b4050] text-xs font-bold text-[#b8c8c7] hover:bg-white/[.03]"><ImagePlus size={15}/> Choose gallery images<input type="file" multiple accept="image/*" className="hidden" onChange={(e) => { const files = Array.from(e.target.files || []).slice(0, 10 - (form.existingGalleryImages.length)); set("galleryImages", files); }} /></label><div className="mt-4 grid grid-cols-2 gap-2">{[...form.existingGalleryImages.map((url) => ({ url: normalizeImageUrl(url), key: url })), ...galleryPreviews.map(({ file, url }) => ({ url, key: `${file.name}-${file.lastModified}` }))].slice(0, 10).map((image, index) => <div key={`${image.key}-${index}`} className="overflow-hidden rounded-lg border border-[#233543] bg-[#101d27]"><img src={image.url} alt={`Gallery ${index + 1}`} className="h-24 w-full object-cover"/></div>)}</div></div>
              </div>

              <div className="rounded-2xl border border-[#233543] bg-[#0a1621] p-5"><p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-[#6e8589]">Review</p><div className="mt-3 grid gap-4 sm:grid-cols-2"><div><p className="text-xs text-[#71878b]">Trip</p><p className="mt-1 font-bold">{form.title || "Untitled trip"}</p></div><div><p className="text-xs text-[#71878b]">Destination</p><p className="mt-1 font-bold">{selectedDestination?.name || form.destination || "Not selected"}</p></div><div><p className="text-xs text-[#71878b]">Schedule</p><p className="mt-1 text-sm font-semibold">{form.departureDate ? new Date(form.departureDate).toLocaleString() : "—"} → {form.returnDate ? new Date(form.returnDate).toLocaleString() : "—"}</p></div><div><p className="text-xs text-[#71878b]">Seats</p><p className="mt-1 font-bold text-[#9ee8c0]">{form.seats || "0"} available</p></div><div><p className="text-xs text-[#71878b]">Price</p><p className="mt-1 font-bold text-[#9ee8c0]">{form.currency} {Number(form.price || 0).toLocaleString()} / traveler</p></div></div></div>
            </div>
          )}

          <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-[#233543] pt-5">
            <div className="flex items-center gap-2"><button type="button" onClick={cancel} className="h-11 rounded-xl px-4 text-sm font-semibold text-[#71878b] hover:text-white">Cancel</button>{step > 1 && <button type="button" onClick={() => setStep((current) => current - 1)} className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#263746] px-4 text-sm font-bold text-[#b8c7c6] hover:bg-white/[.03]"><ChevronLeft size={16}/> Back</button>}</div>
            <div className="flex items-center gap-2">
              {step < 3 ? <button type="button" onClick={next} className="tp-primary-action inline-flex h-11 items-center gap-2 rounded-xl px-5 text-sm font-extrabold">Continue <ChevronRight size={16}/></button> : editing && !["DRAFT", "REJECTED", "EXPIRED"].includes(String(editingStatus).toUpperCase()) ? <button type="button" onClick={() => submit(false)} disabled={loading || draftSaving} className="tp-primary-action inline-flex h-11 items-center gap-2 rounded-xl px-5 text-sm font-extrabold">{loading ? "Saving..." : "Save changes"}<Save size={16}/></button> : <><button type="button" onClick={() => persistDraft(true)} disabled={loading || draftSaving} className="theme-outline inline-flex h-11 items-center gap-2 rounded-xl border px-4 text-sm font-bold hover:bg-white/[.03]"><Save size={15}/> Save as draft</button><button type="button" onClick={() => submit(true)} disabled={loading || draftSaving} className="tp-primary-action inline-flex h-11 items-center gap-2 rounded-xl px-5 text-sm font-extrabold">{loading ? "Posting..." : "Post trip"}<ChevronRight size={16}/></button></>}
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
