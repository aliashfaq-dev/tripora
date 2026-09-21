import { useEffect, useState } from "react";

export default function ModerationDialog({ open, title, message, submitLabel = "Save", danger = false, temporary = false, onSubmit, onCancel }) {
  const [reason, setReason] = useState("");
  const [days, setDays] = useState("7");

  useEffect(() => {
    if (open) { setReason(""); setDays("7"); }
  }, [open]);

  if (!open) return null;
  const submit = (e) => {
    e.preventDefault();
    if (!reason.trim()) return;
    onSubmit({ reason: reason.trim(), days: temporary ? Math.max(1, Number(days) || 1) : null });
  };

  return <div className="fixed inset-0 z-[130] grid place-items-center bg-black/70 p-5 backdrop-blur-sm" role="dialog" aria-modal="true">
    <form onSubmit={submit} className="w-full max-w-lg rounded-3xl border border-[var(--tp-line)] bg-[var(--tp-surface)] p-6 shadow-[0_30px_100px_rgba(0,0,0,.45)]">
      <h2 className="text-xl font-extrabold tp-heading">{title}</h2>
      <p className="mt-2 text-sm leading-6 tp-muted">{message}</p>
      <label className="mt-5 block"><span className="mb-2 block text-sm font-bold tp-heading">Reason <span className="text-red-500">*</span></span><textarea autoFocus required rows={5} value={reason} onChange={(e) => setReason(e.target.value)} className="input resize-none" placeholder="Explain clearly why this action is being taken..." /></label>
      {temporary && <label className="mt-4 block"><span className="mb-2 block text-sm font-bold tp-heading">Suspend for</span><div className="flex items-center gap-3"><input required min="1" type="number" value={days} onChange={(e) => setDays(e.target.value)} className="input max-w-[150px]"/><span className="text-sm tp-muted">days</span></div></label>}
      <div className="mt-6 flex justify-end gap-3"><button type="button" onClick={onCancel} className="rounded-xl border border-[var(--tp-line)] px-4 py-2.5 text-sm font-bold tp-heading hover:bg-[var(--tp-surface-2)]">Cancel</button><button type="submit" disabled={!reason.trim()} className={`rounded-xl px-4 py-2.5 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50 ${danger ? "bg-[#a9434d] text-white hover:bg-[#bd4d58]" : "bg-[#2e8b63] text-white hover:bg-[#247652]"}`}>{submitLabel}</button></div>
    </form>
  </div>;
}
