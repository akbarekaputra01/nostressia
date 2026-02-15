import React from "react";
import { CheckCircle, Info, AlertTriangle, XCircle } from "lucide-react";

const typeStyles = {
  success:
    "bg-surface-elevated glass-panel text-brand-info border-brand-info/20 dark:bg-surface dark:text-brand-info dark:border-brand-info/30",
  error:
    "bg-surface-elevated glass-panel text-brand-accent border-brand-accent/20 dark:bg-surface dark:text-brand-accent dark:border-brand-accent/30",
  warning:
    "bg-surface-elevated glass-panel text-brand-warning border-brand-warning/20 dark:bg-surface dark:text-brand-warning dark:border-brand-warning/30",
  info: "bg-surface-elevated glass-panel text-brand-primary border-brand-primary/20 dark:bg-surface dark:text-brand-primary dark:border-brand-primary/30",
};

const typeIcons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

export default function Toast({ message, type = "info" }) {
  if (!message) return null;
  const Icon = typeIcons[type] || Info;
  const styleClass = typeStyles[type] || typeStyles.info;

  return (
    <div className="fixed top-24 right-4 z-[300] animate-bounce-in">
      <div className={`flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl border ${styleClass}`}>
        <Icon className="w-5 h-5" />
        <span className="font-bold">{message}</span>
      </div>
    </div>
  );
}
