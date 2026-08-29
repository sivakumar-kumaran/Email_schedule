import React from "react";
import Link from "next/link";

interface QueueLogoProps {
  size?: "sm" | "md" | "lg";
  withText?: boolean;
  className?: string;
  href?: string;
}

export const QueueLogo: React.FC<QueueLogoProps> = ({
  size = "md",
  withText = true,
  className = "",
  href = "/queue",
}) => {
  const iconSizes = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
  };

  const textSizes = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
  };

  const content = (
    <div className={`inline-flex items-center gap-3 group select-none ${className}`}>
      {/* ── BullMQ Hex-Cluster Queue Engine Icon ── */}
      <div className={`relative ${iconSizes[size]} shrink-0 transition-transform duration-300 group-hover:scale-105`}>
        {/* Ambient Glow */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-600 opacity-50 blur-md group-hover:opacity-85 transition-opacity duration-300" />

        {/* SVG Engine Emblem */}
        <div className="relative w-full h-full rounded-2xl bg-[#090e1a] border border-cyan-500/30 p-2 flex items-center justify-center shadow-xl shadow-cyan-950/50 overflow-hidden">
          <svg viewBox="0 0 32 32" fill="none" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="bullmq-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#22d3ee" />
                <stop offset="50%" stopColor="#818cf8" />
                <stop offset="100%" stopColor="#c084fc" />
              </linearGradient>
              <linearGradient id="bullmq-bolt" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#34d399" />
              </linearGradient>
            </defs>
            {/* Hexagonal Queue Stack / Layer 1 */}
            <path
              d="M16 3L27 9V23L16 29L5 23V9L16 3Z"
              fill="url(#bullmq-grad)"
              fillOpacity="0.12"
              stroke="url(#bullmq-grad)"
              strokeWidth="1.75"
              strokeLinejoin="round"
            />
            {/* Lightning / Fast Queue Velocity Bolt */}
            <path
              d="M17 7L10 17H16L15 25L22 15H16L17 7Z"
              fill="url(#bullmq-bolt)"
              fillOpacity="0.85"
              stroke="#ffffff"
              strokeWidth="0.75"
              strokeLinejoin="round"
            />
            {/* Processing Dot */}
            <circle cx="23" cy="9" r="1.5" fill="#22d3ee" />
            <circle cx="9" cy="23" r="1.5" fill="#a855f7" />
          </svg>
        </div>
      </div>

      {/* ── BullMQ Typography Lockup ── */}
      {withText && (
        <div className="flex flex-col">
          <div className={`font-black tracking-tight leading-none text-white ${textSizes[size]}`}>
            <span className="text-cyan-400">Bull</span>
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">MQ</span>
          </div>
          <span className="text-[9px] font-bold tracking-[0.2em] text-cyan-300/80 uppercase mt-0.5 group-hover:text-cyan-200 transition-colors">
            Queue Orchestrator
          </span>
        </div>
      )}
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
};

export default QueueLogo;
