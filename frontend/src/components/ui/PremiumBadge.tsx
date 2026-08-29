"use client";

import React from "react";

interface PremiumBadgeProps {
  children: React.ReactNode;
}

export default function PremiumBadge({ children }: PremiumBadgeProps) {
  return (
    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300 text-xs font-semibold tracking-widest uppercase backdrop-blur-sm">
      {/* Sparkles icon */}
      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l2.39 7.64h8.03l-6.5 4.73 2.39 7.64L12 16.28l-6.31 4.73 2.39-7.64-6.5-4.73h8.03L12 2z"/></svg>
      {children}
    </div>
  );
}
