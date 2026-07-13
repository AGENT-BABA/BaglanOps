import { Wifi, WifiOff, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

const MAP = {
  online: {
    label: "ONLINE",
    icon: Wifi,
    cls: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    dot: "bg-emerald-500",
  },
  warning: {
    label: "DEGRADED",
    icon: AlertTriangle,
    cls: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30",
    dot: "bg-amber-500 pulse-warning",
  },
  offline: {
    label: "OFFLINE",
    icon: WifiOff,
    cls: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30",
    dot: "bg-rose-500 pulse-danger",
  },
};

export function StatusPill({ status, testId, showIcon = true, compact = false }) {
  const m = MAP[status] || MAP.offline;
  const Icon = m.icon;
  return (
    <span
      data-testid={testId || `status-pill-${status}`}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 font-label text-[10px]",
        m.cls,
        compact && "px-1.5"
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", m.dot)} />
      {showIcon && <Icon className="h-3 w-3" />}
      {m.label}
    </span>
  );
}
