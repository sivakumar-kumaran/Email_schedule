import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const router = useRouter();

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("reachinbox_token");
    }
    router.push("/auth");
  };

  return (
    <nav className="flex items-center justify-between px-6 py-3 bg-[#0a0e1a] border-b border-surfaceBorder">
      <div className="flex items-center gap-4">
        <Link href="/home" className="text-lg font-semibold text-white hover:text-brand-400">
          ReachInbox
        </Link>
        <Link href="/home" className="text-sm text-slate-300 hover:text-white">
          Home
        </Link>
        <Link href="/about" className="text-sm text-slate-300 hover:text-white">
          About
        </Link>
        <Link href="/dashboard" className="text-sm text-slate-300 hover:text-white">
          Dashboard
        </Link>
      </div>
      <button
        onClick={handleLogout}
        className="text-sm text-slate-300 hover:text-white transition"
      >
        Sign Out
      </button>
    </nav>
  );
}
