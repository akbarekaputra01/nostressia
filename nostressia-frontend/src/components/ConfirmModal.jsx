import React from "react";

export default function ConfirmModal({
  isOpen,
  title = "Confirm action",
  message,
  confirmLabel = "Yes",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-neutral-950/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface-elevated glass-panel rounded-2xl w-full max-w-md shadow-2xl border border-border p-6">
        <h3 className="text-lg font-bold text-text-primary mb-2">{title}</h3>
        <p className="text-sm text-text-secondary mb-6 whitespace-pre-line">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-text-secondary bg-surface-muted hover:bg-surface-muted/70 transition-all cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-text-inverse bg-brand-accent hover:bg-brand-accent/90 transition-all cursor-pointer"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
