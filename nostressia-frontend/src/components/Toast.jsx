import React from "react";
import { CheckCircle, Info, AlertTriangle, XCircle, X } from "lucide-react";

const typeStyles = {
  success:
    "bg-emerald-600 text-white border-emerald-700 dark:bg-emerald-500 dark:border-emerald-400",
  error:
    "bg-rose-600 text-white border-rose-700 dark:bg-rose-500 dark:border-rose-400",
  warning:
    "bg-amber-500 text-neutral-950 border-amber-600 dark:bg-amber-400 dark:border-amber-300",
  info: "bg-sky-600 text-white border-sky-700 dark:bg-sky-500 dark:border-sky-400",
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
