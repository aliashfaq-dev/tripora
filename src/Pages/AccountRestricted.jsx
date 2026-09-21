import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ShieldAlert, Send, LogOut, Clock } from "lucide-react";
import toast from "react-hot-toast";
import { logout, clearRestriction } from "../store/authSlice";

export default function AccountRestricted() {
  const dispatch = useDispatch();
  const restriction = useSelector((s) => s.auth.restriction);
  const [appeal, setAppeal] = useState(
    "Hello Tripora Admin, I would like to appeal this account restriction. I believe there may have been a misunderstanding and I request a review of my account."
  );
  const [submitted, setSubmitted] = useState(false);

  if (!restriction) return null;

  const status = String(restriction.status || "SUSPENDED").toUpperCase();
  const banned = status === "BANNED";
  const reason = restriction.reason || restriction.message || "No reason was provided by the administrator.";
  const until = restriction.suspendedUntil ? new Date(restriction.suspendedUntil) : null;
  const validUntil = until && !Number.isNaN(until.getTime()) ? until.toLocaleString() : null;
  const durationDays = Number(restriction.durationDays);

  const signOut = () => {
    dispatch(clearRestriction());
    dispatch(logout());
    window.location.assign("/login");
  };

  const submitAppeal = (e) => {
    e.preventDefault();
    if (!appeal.trim()) return toast.error("Please enter your appeal.");
    const payload = {
      appealId: "DEMO-APPEAL-2026-001",
      submittedAt: new Date().toISOString(),
      status,
      message: appeal.trim(),
    };
    localStorage.setItem("tripora-demo-appeal", JSON.stringify(payload));
    setSubmitted(true);
    toast.success("Demo appeal submitted for review.");
  };

  return (
    <div className="restriction-backdrop" role="dialog" aria-modal="true" aria-labelledby="restriction-title">
      <section className="restriction-modal">
        <div className="flex items-start justify-between gap-4">
          <div className={`restriction-icon ${banned ? "bg-red-500/10 text-red-500" : "bg-amber-500/10 text-amber-500"}`}>
            <ShieldAlert size={29} />
          </div>
          <span className={`rounded-full px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wider ${banned ? "bg-red-500/10 text-red-600" : "bg-amber-500/10 text-amber-700"}`}>
            {banned ? "Banned" : "Temporarily suspended"}
          </span>
        </div>

        <p className="mt-6 text-xs font-extrabold uppercase tracking-[.18em] text-[#2e8b63]">Tripora account notice</p>
        <h1 id="restriction-title" className="mt-2 text-3xl font-black">
          Your account is {banned ? "banned" : "temporarily suspended"}.
        </h1>
        <p className="mt-3 leading-7 tp-muted">
          You cannot use Tripora while this restriction is active. The administrator provided the details below.
        </p>

        <div className="restriction-reason">
          <p className="text-xs font-extrabold uppercase tracking-[.14em] tp-muted">Reason provided by admin</p>
          <p className="mt-2 whitespace-pre-wrap font-semibold tp-heading">{reason}</p>
          <div className="mt-4 flex flex-wrap gap-x-7 gap-y-2 text-sm tp-muted">
            {banned ? (
              <span><strong className="tp-heading">Duration:</strong> Permanent</span>
            ) : (
              <>
                <span className="inline-flex items-center gap-1.5"><Clock size={14} /><strong className="tp-heading">Duration:</strong> {durationDays > 0 ? `${durationDays} day${durationDays === 1 ? "" : "s"}` : "Temporary"}</span>
                {validUntil && <span><strong className="tp-heading">Ends:</strong> {validUntil}</span>}
              </>
            )}
          </div>
        </div>

        <form className="restriction-appeal" onSubmit={submitAppeal}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-extrabold">Appeal this decision</h2>
              <p className="mt-1 text-xs tp-muted">Demo appeal data is enabled for now. Backend appeal submission can be connected later.</p>
            </div>
            {submitted && <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-[10px] font-extrabold text-emerald-700">Submitted</span>}
          </div>
          <textarea value={appeal} onChange={(e) => setAppeal(e.target.value)} disabled={submitted} className="mt-4" aria-label="Appeal message" />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-[11px] tp-muted">Demo reference: <strong className="tp-heading">DEMO-APPEAL-2026-001</strong></p>
            {!submitted && <button type="submit" className="inline-flex items-center gap-2 rounded-xl bg-[#2e8b63] px-4 py-2.5 text-sm font-extrabold text-white hover:bg-[#247652]"><Send size={15} /> Submit appeal</button>}
          </div>
        </form>

        <button type="button" onClick={signOut} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--tp-line)] px-4 py-3 text-sm font-extrabold tp-heading hover:bg-[var(--tp-surface-2)]">
          <LogOut size={16} /> Sign out
        </button>
      </section>
    </div>
  );
}
