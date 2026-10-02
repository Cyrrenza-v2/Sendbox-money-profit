import React from "react";

export default function ConfirmationModal({open,title="Confirm action",message,confirmLabel="Confirm",cancelLabel="Cancel",onConfirm,onCancel,danger=false}) {
  if (!open) return null;
  return <div className="vel-modal-backdrop" role="presentation">
    <div className="vel-modal" role="dialog" aria-modal="true" aria-labelledby="vel-confirm-title">
      <h2 id="vel-confirm-title">{title}</h2>
      <p>{message}</p>
      <div className="vel-modal-actions">
        <button className="vel-button vel-button-muted" onClick={onCancel}>{cancelLabel}</button>
        <button className={danger ? "vel-button vel-button-danger" : "vel-button"} onClick={onConfirm}>{confirmLabel}</button>
      </div>
    </div>
  </div>;
}
