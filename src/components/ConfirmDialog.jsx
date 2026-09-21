export default function ConfirmDialog({ open, title, message, confirmLabel = "Confirm", danger = false, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="tp-dialog-backdrop" role="dialog" aria-modal="true" aria-labelledby="tp-dialog-title">
      <div className="tp-dialog">
        <div className="tp-dialog-icon" aria-hidden="true">!</div>
        <h2 id="tp-dialog-title" className="tp-dialog-title">{title}</h2>
        <p className="tp-dialog-message">{message}</p>
        <div className="tp-dialog-actions">
          <button type="button" onClick={onCancel} className="tp-dialog-cancel">Cancel</button>
          <button type="button" onClick={onConfirm} className={danger ? "tp-dialog-confirm tp-dialog-danger" : "tp-dialog-confirm"}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
