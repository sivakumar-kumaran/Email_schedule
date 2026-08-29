import React from "react";
import { EmailStatus } from "../../types/api";

interface BadgeProps {
  status: EmailStatus | string;
  size?: "sm" | "md";
}

export const Badge: React.FC<BadgeProps> = ({ status, size = "sm" }) => {
  const styles: Record<string, { bg: string; text: string; dot: string; label: string }> = {
    SCHEDULED: {
      bg: "bg-accent-cyan/10 border-accent-cyan/30",
      text: "text-accent-cyan",
      dot: "bg-accent-cyan",
      label: "Scheduled",
    },
    PENDING: {
      bg: "bg-accent-amber/10 border-accent-amber/30",
      text: "text-accent-amber",
      dot: "bg-accent-amber animate-pulse",
      label: "Pending (Rate Limited)",
    },
    SENT: {
      bg: "bg-accent-emerald/10 border-accent-emerald/30",
      text: "text-accent-emerald",
      dot: "bg-accent-emerald",
      label: "Sent",
    },
    FAILED: {
      bg: "bg-accent-rose/10 border-accent-rose/30",
      text: "text-accent-rose",
      dot: "bg-accent-rose",
      label: "Failed",
    },
    CANCELLED: {
      bg: "bg-slate-700/30 border-slate-600/30",
      text: "text-slate-400",
      dot: "bg-slate-400",
      label: "Cancelled",
    },
  };

  const style = styles[status] || {
    bg: "bg-slate-700/30 border-slate-600/30",
    text: "text-slate-400",
    dot: "bg-slate-400",
    label: status,
  };

  const sizeClasses = size === "sm" ? "px-2.5 py-0.5 text-xs" : "px-3 py-1 text-sm";

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${style.bg} ${style.text} ${sizeClasses}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      {style.label}
    </span>
  );
};
