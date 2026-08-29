import React from "react";
import Link from "next/link";

interface BrandLogoProps {
  size?: "sm" | "md" | "lg";
  withText?: boolean;
  className?: string;
  href?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = "md",
  withText = true,
  className = "",
  href = "/home",
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
      {/* ── Main ReachInbox Gradient Icon ── */}
      <div className={`relative ${iconSizes[size]} shrink-0 transition-transform duration-300 group-hover:scale-105`}>
        {/* Ambient Glow */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-500 to-cyan-400 opacity-60 blur-md group-hover:opacity-90 transition-opacity duration-300" />
        
        {/* SVG Emblem */}
        <div className="relative w-full h-full rounded-2xl bg-[#0c101c] border border-purple-500/40 p-1.5 flex items-center justify-center shadow-xl shadow-purple-950/60 overflow-hidden">
          <svg viewBox="0 0 64 64" fill="none" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="rGradMain" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#c084fc" />
                <stop offset="50%" stopColor="#818cf8" />
                <stop offset="100%" stopColor="#22d3ee" />
              </linearGradient>
              <linearGradient id="rBgGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#9333ea" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.3" />
              </linearGradient>
            </defs>
            {/* Inner fill */}
            <rect x="6" y="6" width="52" height="52" rx="12" fill="url(#rBgGlow)" />
            {/* Base Envelope */}
            <path
              d="M10 18C10 14.6863 12.6863 12 16 12H48C51.3137 12 54 14.6863 54 18V46C54 49.3137 51.3137 52 48 52H16C12.6863 52 10 49.3137 10 46V18Z"
              fill="#111728"
              stroke="url(#rGradMain)"
              strokeWidth="3.5"
              strokeLinejoin="round"
            />
            {/* Top Flap */}
            <path
              d="M10 18L32 34L54 18"
              stroke="#ffffff"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Speed wings */}
            <path
              d="M32 34L20 48M32 34L44 48"
              stroke="#38bdf8"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            {/* Center Core */}
            <circle cx="32" cy="34" r="4.5" fill="#38bdf8" stroke="#ffffff" strokeWidth="1.5" />
          </svg>
        </div>
      </div>

      {/* ── Brand Typography Lockup ── */}
      {withText && (
        <div className="flex flex-col">
          <div className={`font-black tracking-tight leading-none text-white ${textSizes[size]}`}>
            Reach<span className="bg-gradient-to-r from-purple-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent">Inbox</span>
          </div>
          <span className="text-[9px] font-bold tracking-[0.2em] text-slate-400 uppercase mt-0.5 group-hover:text-purple-300 transition-colors">
            Email Scheduler
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

export default BrandLogo;
