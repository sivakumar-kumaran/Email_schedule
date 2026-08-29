"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { authApi } from "../../lib/api";
import { ComposeModal } from "../../components/ComposeModal";
import { DashboardProvider, useDashboard } from "../../context/DashboardContext";
import { Loader2 } from "lucide-react";

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { isComposeOpen, closeCompose } = useDashboard();

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {children}
      <ComposeModal isOpen={isComposeOpen} onClose={closeCompose} />
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const token = localStorage.getItem("reachinbox_token");
    if (!token) {
      router.push("/");
    }
  }, [router]);

  const { isLoading } = useQuery({
    queryKey: ["auth-me"],
    queryFn: authApi.getMe,
    enabled: isMounted,
    retry: 1,
  });

  if (!isMounted || isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500 mb-3" />
        <p className="text-xs text-slate-400 font-mono">Loading dashboard workspace...</p>
      </div>
    );
  }

  return (
    <DashboardProvider>
      <DashboardContent>{children}</DashboardContent>
    </DashboardProvider>
  );
}
