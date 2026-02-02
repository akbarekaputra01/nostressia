import React from "react";
import { CheckCircle, Info, AlertTriangle, XCircle, X } from "lucide-react";

const typeStyles = {
  success:
    "bg-surface-elevated text-brand-info border-brand-info/30 dark:bg-surface dark:text-brand-info",
  error:
    "bg-surface-elevated text-brand-accent border-brand-accent/30 dark:bg-surface dark:text-brand-accent",
  warning:
    "bg-surface-elevated text-brand-warning border-brand-warning/30 dark:bg-surface dark:text-brand-warning",
  info: "bg-surface-elevated text-brand-primary border-brand-primary/30 dark:bg-surface dark:text-brand-primary",
};

const typeIcons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

export default function Toast({ message, type = "info", onClose }) {
  if (!message) return null;
  const Icon = typeIcons[type] || Info;
  const styleClass = typeStyles[type] || typeStyles.info;

  return (
    <div className="fixed top-6 right-4 z-[10050] animate-bounce-in">
      <div
        className={`flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl border glass-panel ${styleClass}`}
      >
        <Icon className="w-5 h-5" />
        <span className="font-semibold">{message}</span>
        <button
          type="button"
          onClick={onClose}
          className="ml-2 p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10"
          aria-label="Close notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
