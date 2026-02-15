import React from "react";
import { CheckCircle, Info, AlertTriangle, XCircle, X } from "lucide-react";

const typeStyles = {
  success:
    "bg-brand-info text-text-inverse border-brand-info/80",
  error:
    "bg-brand-accent text-text-inverse border-brand-accent/80",
  warning:
    "bg-brand-warning text-text-primary border-brand-warning/80",
  info: "bg-brand-primary text-text-inverse border-brand-primary/80",
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
      <div className={`flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl border ${styleClass}`}>
        <Icon className="w-5 h-5" />
        <span className="font-semibold">{message}</span>
        <button
          type="button"
          onClick={onClose}
          className="ml-2 p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/20"
          aria-label="Close notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
