"use client";

import React, { useState } from "react";
import Link from "next/link";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Clock,
  CheckCircle2,
  RefreshCw,
  Send,
  Zap,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Filter,
  Activity,
  ExternalLink,
  ArrowRight,
} from "lucide-react";
import { emailApi, senderApi, authApi } from "../../lib/api";
import { EmailTable } from "../../components/EmailTable";
import { Button } from "../../components/ui/Button";
import { useDashboard } from "../../context/DashboardContext";
import { toast } from "sonner";

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const { openCompose } = useDashboard();

  const [activeTab, setActiveTab] = useState<"SCHEDULED" | "SENT" | "ALL">("SCHEDULED");
  const [selectedSenderId, setSelectedSenderId] = useState<string>("");
  const [page, setPage] = useState(1);
  const limit = 15;

  // 1. Fetch Senders
  const { data: senders = [] } = useQuery({
    queryKey: ["senders"],
    queryFn: senderApi.getSenders,
  });

  // 2. Fetch Emails with live polling
  const statusParam = activeTab === "ALL" ? undefined : activeTab;
  const {
    data: emailData,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ["emails", activeTab, selectedSenderId, page],
    queryFn: () =>
      emailApi.getEmails({
        status: statusParam,
        senderId: selectedSenderId || undefined,
        page,
        limit,
      }),
  });

  // 3. Stats Queries
  const { data: scheduledStats } = useQuery({
    queryKey: ["emails-stats-scheduled"],
    queryFn: () => emailApi.getEmails({ status: "SCHEDULED", limit: 1 }),
  });

  const { data: sentStats } = useQuery({
    queryKey: ["emails-stats-sent"],
    queryFn: () => emailApi.getEmails({ status: "SENT", limit: 1 }),
  });

  const { data: totalStats } = useQuery({
    queryKey: ["emails-stats-total"],
    queryFn: () => emailApi.getEmails({ limit: 1 }),
  });

  // 4. Cancel email mutation
  const deleteMutation = useMutation({
    mutationFn: emailApi.deleteEmail,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emails"] });
      toast.success("Deleted email successfully");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to delete email");
    },
  });

  // Cancel email mutation (for scheduled/pending emails)
  const cancelMutation = useMutation({
    mutationFn: emailApi.cancelEmail,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emails"] });
      queryClient.invalidateQueries({ queryKey: ["emails-stats-scheduled"] });
      toast.success("Scheduled email cancelled successfully");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to cancel email");
    },
  });


  const scheduledCount = scheduledStats?.total ?? 0;
  const sentCount = sentStats?.total ?? 0;
  const totalCount = totalStats?.total ?? 0;

  return (
    <div className="space-y-8">
      {/* Top Metrics Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Scheduled in Queue */}
        <div className="group relative rounded-2xl p-6 border border-white/5 bg-[#1a2133]/60 backdrop-blur-sm hover:border-white/15 hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 overflow-hidden">
          <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-300 bg-cyan-500" />
          <div className="flex items-center justify-between relative z-10">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              In Queue / Scheduled
            </span>
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 group-hover:scale-110 transition-transform">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between gap-2 relative z-10">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-white">{scheduledCount}</span>
              <span className="text-xs text-cyan-400 font-semibold">BullMQ Delayed</span>
            </div>
            <Link
              href="/queue"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 text-[11px] font-semibold transition-colors border border-cyan-500/30"
              title="Open BullMQ Queue in New Tab"
            >
              <Activity className="w-3 h-3 text-cyan-400" />
              <span>Queue UI</span>
              <ArrowRight className="w-2.5 h-2.5 opacity-70" />
            </Link>
          </div>
        </div>

        {/* Metric 2: Delivered Emails */}
        <div className="group relative rounded-2xl p-6 border border-white/5 bg-[#1a2133]/60 backdrop-blur-sm hover:border-white/15 hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 overflow-hidden">
          <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-300 bg-emerald-500" />
          <div className="flex items-center justify-between relative z-10">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Delivered Emails
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2 relative z-10">
            <span className="text-3xl font-extrabold text-white">{sentCount}</span>
            <span className="text-xs text-emerald-400 font-semibold">100% Idempotent</span>
          </div>
        </div>

        {/* Metric 3: Total Enqueued Lifetime */}
        <div className="group relative rounded-2xl p-6 border border-white/5 bg-[#1a2133]/60 backdrop-blur-sm hover:border-white/15 hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 overflow-hidden">
          <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-300 bg-purple-500" />
          <div className="flex items-center justify-between relative z-10">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Total Dispatched
            </span>
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 group-hover:scale-110 transition-transform">
              <Send className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2 relative z-10">
            <span className="text-3xl font-extrabold text-white">{totalCount}</span>
            <span className="text-xs text-slate-400">Total Leads Processed</span>
          </div>
        </div>

        {/* Metric 4: Rate Limiting & Throttling */}
        <div className="group relative rounded-2xl p-6 border border-white/5 bg-[#1a2133]/60 backdrop-blur-sm hover:border-white/15 hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 overflow-hidden">
          <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-300 bg-amber-500" />
          <div className="flex items-center justify-between relative z-10">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Hourly Limit & Slack
            </span>
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 group-hover:scale-110 transition-transform">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2 relative z-10">
            <span className="text-3xl font-extrabold text-white">50/hr</span>
            <span className="text-xs text-amber-400 font-semibold">Auto-Delay on Cap</span>
          </div>
        </div>
      </div>

      {/* Main Section: Tabs, Filter & Controls */}
      <div className="space-y-8">
        {/* In‑dashboard search bar */}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-surfaceBorder/80">
          {/* Tab buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setActiveTab("SCHEDULED");
                setPage(1);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === "SCHEDULED"
                  ? "bg-brand-600 text-white shadow-lg shadow-brand-600/30"
                  : "bg-surface text-slate-400 hover:text-white hover:bg-surfaceHover border border-surfaceBorder"
              }`}
            >
              Scheduled Queue ({scheduledCount})
            </button>

            <button
              onClick={() => {
                setActiveTab("SENT");
                setPage(1);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === "SENT"
                  ? "bg-brand-600 text-white shadow-lg shadow-brand-600/30"
                  : "bg-surface text-slate-400 hover:text-white hover:bg-surfaceHover border border-surfaceBorder"
              }`}
            >
              Sent Emails ({sentCount})
            </button>

            <button
              onClick={() => {
                setActiveTab("ALL");
                setPage(1);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === "ALL"
                  ? "bg-brand-600 text-white shadow-lg shadow-brand-600/30"
                  : "bg-surface text-slate-400 hover:text-white hover:bg-surfaceHover border border-surfaceBorder"
              }`}
            >
              All Records
            </button>
          </div>

          {/* Right Filters & Refresh */}
          <div className="flex items-center gap-2">
            {/* Sender Filter */}
            {senders.length > 1 && (
              <div className="relative">
                <select
                  value={selectedSenderId}
                  onChange={(e) => {
                    setSelectedSenderId(e.target.value);
                    setPage(1);
                  }}
                  className="rounded-xl bg-surface border border-surfaceBorder px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-brand-500"
                >
                  <option value="">All Senders</option>
                  {senders.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.address}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Refresh Button */}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => refetch()}
              title="Refresh queue"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isRefetching ? "animate-spin text-brand-400" : ""}`}
              />
            </Button>

            {/* BullMQ Queue Dashboard Button */}
            <Link
              href="/queue"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center"
            >
              <Button
                variant="outline"
                size="sm"
                className="border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/10 hover:border-cyan-400 shadow-sm"
                leftIcon={<Activity className="w-3.5 h-3.5 text-cyan-400" />}
                rightIcon={<ArrowRight className="w-3 h-3 text-cyan-400/70" />}
              >
                BullMQ Queue
              </Button>
            </Link>

            {/* Compose Button */}
            <Button
              variant="gradient"
              size="sm"
              onClick={openCompose}
              leftIcon={<Sparkles className="w-3.5 h-3.5" />}
            >
              Schedule Campaign
            </Button>
          </div>
        </div>

        {/* Emails Table */}
        <EmailTable
          emails={emailData?.emails || []}
          isLoading={isLoading}
          onCancelEmail={(id: string) => cancelMutation.mutate(id)}
          onDeleteEmail={(id: string) => deleteMutation.mutate(id)}
          onOpenCompose={openCompose}
          isCancelPending={cancelMutation.isPending}
        />

        {/* Pagination Controls */}
        {emailData && emailData.totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 text-xs text-slate-400">
            <div>
              Showing {(page - 1) * limit + 1} to{" "}
              {Math.min(page * limit, emailData.total)} of {emailData.total} emails
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Previous
              </Button>
              <span className="px-3 py-1 bg-surface border border-surfaceBorder rounded-lg font-mono">
                Page {page} of {emailData.totalPages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={page === emailData.totalPages}
                onClick={() => setPage((p) => Math.min(emailData.totalPages, p + 1))}
              >
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
