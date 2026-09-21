import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Pencil, Trash2, Send, Plus, Power } from "lucide-react";
import toast from "react-hot-toast";
import Layout from "../components/Layout";
import {
  getMyPosts,
  deleteMyPost,
  submitMyPost,
  deactivateMyPost,
} from "../api/posts";
import { getList, apiError } from "../api/response";
import { fetchAllPages } from "../api/pagination";
import { getImage } from "../components/ui";
import ConfirmDialog from "../components/ConfirmDialog";

const statusClass = (status) => {
  if (status === "PUBLISHED") return "text-emerald-300 bg-emerald-500/10";
  if (status === "REJECTED") return "text-red-300 bg-red-500/10";
  if (status === "EXPIRED") return "text-purple-300 bg-purple-500/10";
  if (status === "INACTIVE" || status === "ARCHIVED") {
    return "text-slate-300 bg-slate-500/10";
  }
  return "text-amber-300 bg-amber-500/10";
};

const getId = (post) => post?._id || post?.id;

export default function UserPosts() {
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState(null);
  const [deactivateId, setDeactivateId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const list = await fetchAllPages(
        (page, limit) => getMyPosts({ page, limit, ...(status ? { status } : {}) }),
        ["trips", "posts", "items", "results"],
        { limit: 100, maxPages: 50 }
      );
      setItems(list);
    } catch (error) {
      setItems([]);
      toast.error(apiError(error, "Could not load your trips."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [status]);

  const remove = async (id) => {
    try {
      await deleteMyPost(id);
      toast.success("Trip deleted.");
      await load();
    } catch (error) {
      toast.error(apiError(error, "Delete failed."));
    } finally {
      setDeleteId(null);
    }
  };

  const submit = async (id) => {
    try {
      await submitMyPost(id);
      toast.success("Submitted for admin approval.");
      await load();
    } catch (error) {
      toast.error(apiError(error, "Submission failed."));
    }
  };

  const deactivate = async (id) => {
    try {
      await deactivateMyPost(id);
      toast.success("Trip deactivated.");
      await load();
    } catch (error) {
      toast.error(apiError(error, "Could not deactivate this trip."));
    } finally {
      setDeactivateId(null);
    }
  };

  const statuses = [
    "",
    "DRAFT",
    "PENDING_APPROVAL",
    "PUBLISHED",
    "REJECTED",
    "EXPIRED",
    "INACTIVE",
    "ARCHIVED",
  ];

  return (
    <Layout>
      <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.2em] text-[#9ee8c0]">
              My content
            </p>
            <h1 className="mt-2 text-4xl font-black">My Trips</h1>
            <p className="mt-2 text-[#91a7a1]">
              Manage drafts, approvals, published and expired trips.
            </p>
          </div>

          <Link
            to="/create-trip"
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#2e8b63] px-4 text-sm font-extrabold text-white shadow-sm transition hover:brightness-105"
          >
            <Plus size={16} />
            Create trip
          </Link>
        </div>

        <div className="mt-7 flex flex-wrap gap-2">
          {statuses.map((value) => (
            <button
              key={value || "ALL"}
              type="button"
              onClick={() => setStatus(value)}
              className={`inline-flex h-10 items-center rounded-full border px-4 text-xs font-bold transition ${
                status === value
                  ? "border-[#9ee8c0] bg-[#173f34] text-[#9ee8c0]"
                  : "border-[#263746] bg-transparent text-[#91a7a1] hover:border-[#6ea88d]"
              }`}
            >
              {value || "ALL"}
            </button>
          ))}
        </div>

        <div className="mt-8 grid gap-4">
          {loading ? (
            [1, 2, 3].map((number) => (
              <div
                key={number}
                className="h-44 animate-pulse rounded-2xl bg-[#101d2a]"
              />
            ))
          ) : items.length === 0 ? (
            <div className="rounded-2xl border border-[#263746] bg-[#101d2a] p-12 text-center">
              <h2 className="text-xl font-extrabold">No trips found</h2>
              <p className="mt-2 text-sm text-[#91a7a1]">
                There are no trips in this category yet.
              </p>
              <Link
                to="/create-trip"
                className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl bg-[#2e8b63] px-5 text-sm font-extrabold text-white"
              >
                <Plus size={16} />
                Create a trip
              </Link>
            </div>
          ) : (
            items.map((trip) => {
              const id = getId(trip);
              const currentStatus = String(trip?.status || "DRAFT").toUpperCase();
              const canSubmit = ["DRAFT", "REJECTED", "EXPIRED"].includes(currentStatus);
              const isPublished = currentStatus === "PUBLISHED";

              return (
                <article
                  key={id}
                  className="overflow-hidden rounded-2xl border border-[#263746] bg-[#101d2a]"
                >
                  <div className="grid gap-0 sm:grid-cols-[190px_minmax(0,1fr)]">
                    <div className="h-44 sm:h-full">
                      <img
                        src={getImage(trip)}
                        alt={trip?.title || "Trip"}
                        className="h-full w-full object-cover"
                        onError={(event) => {
                          event.currentTarget.onerror = null;
                          event.currentTarget.src =
                            "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80";
                        }}
                      />
                    </div>

                    <div className="min-w-0 p-5">
                      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0">
                          <h2 className="truncate text-xl font-extrabold">
                            {trip?.title || "Untitled trip"}
                          </h2>
                          <p className="mt-1 text-sm text-[#91a7a1]">
                            {trip?.city || "Unknown city"}
                            {trip?.country ? `, ${trip.country}` : ""}
                            {" · "}
                            {trip?.price ?? 0} {trip?.currency || "USD"}
                            {" · "}
                            {trip?.duration ?? 0} days
                          </p>

                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <span
                              className={`inline-flex h-7 items-center rounded-full px-3 text-xs font-bold ${statusClass(
                                currentStatus
                              )}`}
                            >
                              {currentStatus.replaceAll("_", " ")}
                            </span>
                            <span className="text-xs text-[#91a7a1]">
                              ♥ {trip?.favoriteCount ?? 0} · 👁 {trip?.viewCount ?? 0}
                            </span>
                          </div>

                          {currentStatus === "REJECTED" && trip?.rejectionReason && (
                            <p className="mt-3 text-xs text-red-300">
                              Reason: {trip.rejectionReason}
                            </p>
                          )}
                        </div>

                        {/* Never stretch these controls to the card height. */}
                        <div className="flex shrink-0 flex-wrap items-center gap-2 lg:justify-end">
                          {id && (
                            <Link
                              to={`/edit-trip/${id}`}
                              className="post-action-btn"
                            >
                              <Pencil size={15} />
                              Edit
                            </Link>
                          )}

                          {canSubmit && id && (
                            <button
                              type="button"
                              onClick={() => submit(id)}
                              className="post-action-btn bg-[#2e8b63] text-white border-[#2e8b63]"
                            >
                              <Send size={15} />
                              Submit
                            </button>
                          )}

                          {isPublished && id && (
                            <button
                              type="button"
                              onClick={() => setDeactivateId(id)}
                              className="post-action-btn border-amber-700/60 text-amber-300 hover:bg-amber-900/20"
                            >
                              <Power size={15} />
                              Deactivate
                            </button>
                          )}

                          {currentStatus === "INACTIVE" && id && (
                            <Link
                              to={`/edit-trip/${id}?activate=1`}
                              className="post-action-btn bg-[#2e8b63] text-white border-[#2e8b63]"
                            >
                              <Power size={15} />
                              Activate
                            </Link>
                          )}

                          {id && (
                            <button
                              type="button"
                              onClick={() => setDeleteId(id)}
                              className="post-action-btn border-red-900/70 text-red-300 hover:bg-red-900/20"
                            >
                              <Trash2 size={15} />
                              Delete
                            </button>
                          )}
                        </div>
                      </div>

                      {trip?.expiresAt && (
                        <p className="mt-4 text-xs text-[#91a7a1]">
                          Available Until: {new Date(trip.expiresAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </section>

      <ConfirmDialog
        open={Boolean(deactivateId)}
        title="Deactivate this trip?"
        message="The trip will be taken off the public marketplace while keeping your post history."
        confirmLabel="Deactivate"
        onConfirm={() => deactivate(deactivateId)}
        onCancel={() => setDeactivateId(null)}
      />

      <ConfirmDialog
        open={Boolean(deleteId)}
        title="Delete this trip?"
        message="This action will remove the trip from your content list."
        confirmLabel="Delete trip"
        danger
        onConfirm={() => remove(deleteId)}
        onCancel={() => setDeleteId(null)}
      />
    </Layout>
  );
}
