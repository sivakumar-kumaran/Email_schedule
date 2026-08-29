"use client";

import React, { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  Send,
  Activity,
  LogOut,
  Plus,
  ChevronDown,
  ExternalLink,
  Mail,
} from "lucide-react";

import ThemeToggle from "./ThemeToggle";
import { Button } from "./ui/Button";
import { BrandLogo } from "./ui/BrandLogo";
import { QueueLogo } from "./ui/QueueLogo";
import { SlackConnect } from "./SlackConnect";
import { authApi } from "../lib/api";
import { useQuery } from "@tanstack/react-query";
import { useDashboard } from "../context/DashboardContext";

function ComposeButtonWrapper() {
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { openCompose } = useDashboard();
    return (
      <Button
        variant="gradient"
        size="sm"
        onClick={openCompose}
        className="shadow-md shadow-brand-600/30"
        leftIcon={<Plus className="w-4 h-4" />}
      >
        <span className="hidden sm:inline">Schedule Email</span>
        <span className="sm:hidden">New</span>
      </Button>
    );
  } catch {
    return null;
  }
}

export const Header: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [hasToken, setHasToken] = useState(false);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      setHasToken(!!localStorage.getItem("reachinbox_token"));
    }
  }, [pathname]);

  const isDashboard = pathname?.startsWith("/dashboard");
  const isQueue = pathname?.startsWith("/queue");

  const { data: user } = useQuery({
    queryKey: ["auth-me"],
    queryFn: authApi.getMe,
    enabled: hasToken,
    retry: 0,
    staleTime: 60000,
  });

  const handleLogout = () => {
    localStorage.removeItem("reachinbox_token");
    router.push("/");
  };

  const bullBoardUrl = authApi.getBullBoardUrl();
  const userInitial = user?.name ? user.name.trim()[0].toUpperCase() : "U";
  const userDisplayName = user?.name || "User";
  const userDisplayEmail = user?.email || "user@reachinbox.ai";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#07090e]/80 backdrop-blur-xl shadow-[0_4px_30px_rgba(0,0,0,0.5)] transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Dynamic Brand Logo */}
        <div className="flex items-center space-x-2">
          {isQueue ? (
            <QueueLogo size="sm" href="/queue" />
          ) : (
            <BrandLogo size="sm" href="/home" />
          )}
        </div>
        

        {/* Center: Nav links */}
        <nav className="flex-1 flex items-center justify-center gap-2">
          <Link
            href="/home"
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${pathname === "/home" ? "bg-white/10 text-white shadow-inner" : "text-slate-400 hover:text-white hover:bg-white/5"}`}
          >
            Home
          </Link>
          <Link
            href="/about"
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${pathname === "/about" ? "bg-white/10 text-white shadow-inner" : "text-slate-400 hover:text-white hover:bg-white/5"}`}
          >
            About
          </Link>
          <Link
            href="/contact"
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${pathname === "/contact" ? "bg-white/10 text-white shadow-inner" : "text-slate-400 hover:text-white hover:bg-white/5"}`}
          >
            Contact
          </Link>
          <Link
            href="/dashboard"
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${pathname?.startsWith("/dashboard") ? "bg-white/10 text-white shadow-inner" : "text-slate-400 hover:text-white hover:bg-white/5"}`}
          >
            Dashboard
          </Link>
        </nav>

        {/* Right: actions */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Theme toggle */}
<ThemeToggle />
          <ComposeButtonWrapper />

          {/* Compose button — only on dashboard */}


          {/* User avatar + dropdown */}
          {user && (
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 p-1 rounded-xl hover:bg-white/5 transition-colors group"
              >
                {user?.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.avatarUrl}
                    alt={userDisplayName}
                    className="w-8 h-8 rounded-xl object-cover ring-2 ring-brand-500/30 group-hover:ring-brand-500/60 transition-all"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-accent-violet border border-white/20 flex items-center justify-center text-white text-xs font-extrabold shadow-md">
                    {userInitial}
                  </div>
                )}
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-colors hidden sm:block" />
              </button>

              {isUserMenuOpen && (
                <div
                  className="absolute right-0 mt-2 w-64 rounded-2xl bg-surface border border-surfaceBorder p-2 shadow-2xl z-50 backdrop-blur-xl"
                  onMouseLeave={() => setIsUserMenuOpen(false)}
                >
                  <div className="flex items-center gap-3 p-3 border-b border-surfaceBorder/60 mb-1.5">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-accent-violet flex items-center justify-center text-white text-sm font-extrabold shadow-md shrink-0">
                      {userInitial}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-100 truncate">{userDisplayName}</p>
                    </div>
                  </div>

                  <Link
                    href="/queue"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Activity className="w-3.5 h-3.5 text-accent-cyan" />
                      <span>BullMQ Queue Monitor</span>
                    </div>
                    <ExternalLink className="w-3 h-3 text-slate-500" />
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-accent-rose hover:bg-accent-rose/10 transition-colors mt-1"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Show login link if no user and not on auth page */}
          {!user && pathname !== "/auth" && pathname !== "/" && (
            <Link
              href="/auth"
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white shadow-md shadow-brand-600/30 transition-all"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};
export default Header;
