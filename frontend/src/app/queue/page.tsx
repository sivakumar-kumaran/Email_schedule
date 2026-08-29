"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  Layers,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Play,
  Pause,
  RotateCw,
  Trash2,
  ExternalLink,
  Shield,
  Zap,
  Cpu,
  Database,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Search,
  Check,
} from "lucide-react";
import { queueApi, authApi } from "../../lib/api";
import { Button } from "../../components/ui/Button";
import { QueueLogo } from "../../components/ui/QueueLogo";
import { toast } from "sonner";
import { formatDistanceToNow, format } from "date-fns";

function Badge({ children, variant = "purple" }: { children: React.ReactNode; variant?: "purple" | "cyan" | "emerald" | "amber" | "rose" }) {
  const styles = {
    purple: "border-purple-500/30 bg-purple-500/10 text-purple-300",
    cyan: "border-cyan-500/30 bg-cyan-500/10 text-cyan-300",
    emerald: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    amber: "border-amber-500/30 bg-amber-500/10 text-amber-300",
    rose: "border-rose-500/30 bg-rose-500/10 text-rose-300",
  };

  return (
    <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-semibold tracking-wider uppercase backdrop-blur-sm ${styles[variant]}`}>
      <Sparkles className="w-3.5 h-3.5" />
      {children}
    </div>
  );
}

export default function QueuePage() {
  const queryClient = useQueryClient();
  const [filterState, setFilterState] = useState<"ALL" | "SCHEDULED" | "SENT" | "FAILED" | "PENDING">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(true);

  // 1. Fetch live queue stats & jobs with polling
  const { data: stats, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ["queue-stats"],
    queryFn: queueApi.getStats,
    refetchInterval: autoRefresh ? 3000 : false,
  });

  // 2. Queue control mutations
  const pauseMutation = useMutation({
    mutationFn: queueApi.pauseQueue,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["queue-stats"] });
      toast.success("BullMQ Queue paused");
    },
    onError: (err: any) => toast.error(err.response?.data?.error || "Failed to pause queue"),
  });

  const resumeMutation = useMutation({
    mutationFn: queueApi.resumeQueue,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["queue-stats"] });
      toast.success("BullMQ Queue resumed");
    },
    onError: (err: any) => toast.error(err.response?.data?.error || "Failed to resume queue"),
  });

  const retryMutation = useMutation({
    mutationFn: queueApi.retryFailed,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["queue-stats"] });
      toast.success(data.message || "Retried failed jobs");
    },
    onError: (err: any) => toast.error(err.response?.data?.error || "Failed to retry jobs"),
  });

  const cleanMutation = useMutation({
    mutationFn: queueApi.cleanQueue,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["queue-stats"] });
      toast.success("Queue history cleaned");
    },
    onError: (err: any) => toast.error(err.response?.data?.error || "Failed to clean queue"),
  });

  const counts = stats?.counts || {
    waiting: 0,
    active: 0,
    completed: 0,
    failed: 0,
    delayed: 0,
    pendingRateLimited: 0,
    total: 0,
  };

  const isPaused = stats?.isPaused ?? false;
  const rawBullBoardUrl = authApi.getBullBoardUrl();

  const filteredJobs = (stats?.recentJobs || []).filter((job) => {
    const matchesFilter = filterState === "ALL" || job.status === filterState;
    const matchesSearch =
      !searchQuery.trim() ||
      job.recipient.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.idempotencyKey.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <main className="min-h-screen bg-[#07090e] text-white overflow-x-hidden pb-20">
      {/* ── HERO & HEADER ─────────────────────────────────────── */}
      <section className="relative px-4 pt-12 pb-8 max-w-7xl mx-auto">
        {/* Glow backdrop */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-purple-700/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-20 right-1/4 w-[400px] h-[300px] bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-white/10">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <QueueLogo size="md" href="/queue" />
              <Badge variant={isPaused ? "amber" : "cyan"}>
                {isPaused ? "Queue State: Paused" : "Engine v5.3 • Live"}
              </Badge>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] text-slate-300 font-mono">
                <span className={`w-2 h-2 rounded-full ${stats?.redisConnected ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
                Redis: {stats?.redisConnected ? "Connected" : "Fallback Mode"}
              </div>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
              BullMQ Queue{" "}
              <span className="bg-gradient-to-r from-purple-400 via-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                Orchestrator
              </span>
            </h1>
            <p className="text-sm sm:text-base text-slate-400 max-w-2xl">
              Inspect real-time BullMQ delayed queue workers, rate limit throttles, SHA-256 idempotency locks, and job execution telemetry.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`text-xs ${autoRefresh ? "border-cyan-500/40 text-cyan-300" : ""}`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefetching ? "animate-spin text-cyan-400" : ""}`} />
              <span>{autoRefresh ? "Live (3s)" : "Auto-Refresh Off"}</span>
            </Button>

            {isPaused ? (
              <Button
                variant="gradient"
                size="sm"
                onClick={() => resumeMutation.mutate()}
                isLoading={resumeMutation.isPending}
                leftIcon={<Play className="w-3.5 h-3.5" />}
              >
                Resume Queue
              </Button>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => pauseMutation.mutate()}
                isLoading={pauseMutation.isPending}
                leftIcon={<Pause className="w-3.5 h-3.5" />}
                className="hover:border-amber-500/50 hover:text-amber-300"
              >
                Pause Queue
              </Button>
            )}

            <Button
              variant="secondary"
              size="sm"
              onClick={() => retryMutation.mutate()}
              isLoading={retryMutation.isPending}
              leftIcon={<RotateCw className="w-3.5 h-3.5 text-emerald-400" />}
              title="Retry all failed jobs"
            >
              Retry Failed
            </Button>

            <a href={rawBullBoardUrl} target="_blank" rel="noopener noreferrer">
              <Button
                variant="outline"
                size="sm"
                className="border-purple-500/40 text-purple-300 hover:bg-purple-500/10 shadow-sm"
                leftIcon={<ExternalLink className="w-3.5 h-3.5 text-purple-400" />}
              >
                Raw Bull Board UI
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* ── 4-METRIC INTERACTIVE CARDS MATRIX ─────────────────── */}
      <section className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Delayed / Scheduled */}
          <div className="group relative rounded-2xl p-6 border border-white/5 bg-[#1a2133]/60 backdrop-blur-sm hover:border-cyan-500/40 hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 overflow-hidden">
            <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-300 bg-cyan-500" />
            <div className="flex items-center justify-between relative z-10">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Delayed / In Queue
              </span>
              <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 group-hover:scale-110 transition-transform">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline justify-between relative z-10">
              <span className="text-3xl font-extrabold text-white">{counts.delayed}</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                Awaiting Send Time
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">Durable BullMQ delayed jobs backed by Redis.</p>
          </div>

          {/* Card 2: Active / Processing Workers */}
          <div className="group relative rounded-2xl p-6 border border-white/5 bg-[#1a2133]/60 backdrop-blur-sm hover:border-purple-500/40 hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 overflow-hidden">
            <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-300 bg-purple-500" />
            <div className="flex items-center justify-between relative z-10">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Active Workers
              </span>
              <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 group-hover:scale-110 transition-transform">
                <Cpu className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline justify-between relative z-10">
              <span className="text-3xl font-extrabold text-white">{counts.active}</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/30">
                Concurrency: {stats?.config.workerConcurrency ?? 5}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">Parallel worker threads processing jobs with Ethereal SMTP.</p>
          </div>

          {/* Card 3: Delivered (Completed) */}
          <div className="group relative rounded-2xl p-6 border border-white/5 bg-[#1a2133]/60 backdrop-blur-sm hover:border-emerald-500/40 hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 overflow-hidden">
            <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-300 bg-emerald-500" />
            <div className="flex items-center justify-between relative z-10">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Delivered (Completed)
              </span>
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 group-hover:scale-110 transition-transform">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline justify-between relative z-10">
              <span className="text-3xl font-extrabold text-white">{counts.completed}</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                100% Idempotent
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">Indexed in Elasticsearch & marked SENT in Postgres.</p>
          </div>

          {/* Card 4: Rate Limited & Failed */}
          <div className="group relative rounded-2xl p-6 border border-white/5 bg-[#1a2133]/60 backdrop-blur-sm hover:border-amber-500/40 hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 overflow-hidden">
            <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-300 bg-amber-500" />
            <div className="flex items-center justify-between relative z-10">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Rate Limit & Failed
              </span>
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 group-hover:scale-110 transition-transform">
                <Zap className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline justify-between relative z-10">
              <span className="text-3xl font-extrabold text-white">
                {counts.pendingRateLimited + counts.failed}
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30">
                Cap: {stats?.config.maxEmailsPerHour ?? 50}/hr
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">Auto-delayed on cap with Slack webhook dispatch.</p>
          </div>
        </div>
      </section>

      {/* ── QUEUE ARCHITECTURE & SPECS PANEL ─────────────────── */}
      <section className="max-w-7xl mx-auto px-4 py-4">
        <div className="rounded-2xl p-5 border border-white/10 bg-[#0d121f]/90 backdrop-blur-xl shadow-xl">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-accent-violet flex items-center justify-center text-white shadow-lg">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Queue Architecture Specification</h3>
                <p className="text-xs text-slate-400">
                  Zero-Cron delayed queue pipeline using BullMQ v5, Redis key-value locks, and worker clustering.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">Worker Concurrency</p>
                <p className="font-bold text-slate-200 mt-0.5">{stats?.config.workerConcurrency ?? 5} Parallel Jobs</p>
              </div>
              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">Hourly Throttle</p>
                <p className="font-bold text-accent-amber mt-0.5">{stats?.config.maxEmailsPerHour ?? 50} Emails / Hour</p>
              </div>
              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">Min Delay Interval</p>
                <p className="font-bold text-cyan-300 mt-0.5">{stats?.config.minDelayMs ?? 2000} ms / Send</p>
              </div>
              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">Retry Strategy</p>
                <p className="font-bold text-purple-300 mt-0.5">3 Attempts (Exp Backoff)</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── LIVE JOBS INSPECTOR ──────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 pt-6">
        <div className="rounded-2xl border border-white/10 bg-[#0d121f]/90 backdrop-blur-xl shadow-2xl overflow-hidden">
          {/* Controls Bar */}
          <div className="p-4 sm:p-6 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-[#07090e] border border-white/5">
              {(["ALL", "SCHEDULED", "SENT", "PENDING", "FAILED"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilterState(tab)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    filterState === tab
                      ? "bg-brand-600 text-white shadow-md shadow-brand-600/40"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search job or idempotency key..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#141b2d] border border-white/10 rounded-xl pl-9 pr-4 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors"
              />
            </div>
          </div>

          {/* Job Items Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0a0e1a] text-slate-400 font-semibold border-b border-white/5 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-5 py-3.5">Status & Job ID</th>
                  <th className="px-5 py-3.5">Recipient</th>
                  <th className="px-5 py-3.5">Subject</th>
                  <th className="px-5 py-3.5">Scheduled / ETA</th>
                  <th className="px-5 py-3.5">Idempotency Lock</th>
                  <th className="px-5 py-3.5 text-right">Sender</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredJobs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white/5 text-slate-400 mb-3">
                        <Activity className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-semibold text-slate-300">No jobs match your current filter</p>
                      <p className="text-xs text-slate-500 mt-1">Schedule an email campaign from the Dashboard to see real-time jobs in this queue.</p>
                    </td>
                  </tr>
                ) : (
                  filteredJobs.map((job) => {
                    const scheduledDate = new Date(job.scheduledAt);
                    const isFuture = scheduledDate.getTime() > Date.now();

                    const statusPills: Record<string, { bg: string; text: string; label: string }> = {
                      SCHEDULED: { bg: "bg-cyan-500/10 border-cyan-500/30", text: "text-cyan-400", label: "Delayed (Queued)" },
                      PENDING: { bg: "bg-amber-500/10 border-amber-500/30", text: "text-amber-400", label: "Rate Limited" },
                      SENT: { bg: "bg-emerald-500/10 border-emerald-500/30", text: "text-emerald-400", label: "Delivered" },
                      FAILED: { bg: "bg-rose-500/10 border-rose-500/30", text: "text-rose-400", label: "Failed" },
                      CANCELLED: { bg: "bg-slate-700/30 border-slate-600/30", text: "text-slate-400", label: "Cancelled" },
                    };

                    const pill = statusPills[job.status] || {
                      bg: "bg-slate-800 border-slate-700",
                      text: "text-slate-300",
                      label: job.status,
                    };

                    return (
                      <tr key={job.id} className="hover:bg-white/[0.02] transition-colors">
                        {/* Status */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold ${pill.bg} ${pill.text}`}>
                              <span className="w-1.5 h-1.5 rounded-full bg-current" />
                              {pill.label}
                            </span>
                          </div>
                          <p className="font-mono text-[10px] text-slate-500 mt-1 truncate max-w-[120px]">
                            {job.id}
                          </p>
                        </td>

                        {/* Recipient */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className="font-medium text-slate-200">{job.recipient}</span>
                        </td>

                        {/* Subject */}
                        <td className="px-5 py-4 max-w-xs truncate">
                          <span className="text-slate-300">{job.subject}</span>
                        </td>

                        {/* Scheduled Time */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="text-slate-300 font-medium">
                              {format(scheduledDate, "MMM d, h:mm:ss a")}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {isFuture ? `In ${formatDistanceToNow(scheduledDate)}` : `${formatDistanceToNow(scheduledDate)} ago`}
                            </span>
                          </div>
                        </td>

                        {/* Idempotency Key */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1 text-[11px] font-mono text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20 max-w-[180px] truncate" title={job.idempotencyKey}>
                            <Shield className="w-3 h-3 text-purple-400 shrink-0" />
                            <span className="truncate">{job.idempotencyKey.slice(0, 16)}...</span>
                          </div>
                        </td>

                        {/* Sender */}
                        <td className="px-5 py-4 whitespace-nowrap text-right text-slate-400">
                          {job.sender?.address || "Default"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── FOOTER CTA ────────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-4 mt-16 text-center">
        <div className="rounded-3xl p-8 bg-gradient-to-br from-purple-900/20 via-indigo-900/20 to-cyan-900/20 border border-white/10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          <h3 className="text-2xl font-bold text-white mb-2">Need direct worker telemetry?</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mb-6">
            Open the raw BullMQ Bull Board dashboard for advanced job memory inspection and low-level Redis stream logs.
          </p>
          <div className="flex justify-center gap-3">
            <a href={rawBullBoardUrl} target="_blank" rel="noopener noreferrer">
              <Button
                variant="gradient"
                size="md"
                leftIcon={<Activity className="w-4 h-4" />}
                rightIcon={<ExternalLink className="w-4 h-4" />}
              >
                Launch Bull Board
              </Button>
            </a>
            <Link href="/dashboard">
              <Button variant="secondary" size="md">
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
