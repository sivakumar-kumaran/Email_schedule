"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  Shield,
  Zap,
  Eye,
  Bell,
  CheckCircle,
  Mail,
  Send,
  BarChart2,
  Clock,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "../../components/ui/Button";

/* ────────────────────────── Badge ──────────────────────────── */
function Badge({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300 text-xs font-semibold tracking-widest uppercase backdrop-blur-sm">
      <Sparkles className="w-3.5 h-3.5" />
      {children}
    </div>
  );
}

/* ────────────────────────── FeatureCard ────────────────────── */
function FeatureCard({
  icon: Icon,
  title,
  desc,
  accent,
}: {
  icon: React.ElementType;
  title: string;
  desc: string;
  accent: string;
}) {
  return (
    <div className="group relative rounded-2xl p-6 border border-white/5 bg-white/[0.03] backdrop-blur-sm hover:border-white/15 hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 overflow-hidden">
      <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-300 ${accent}`} />
      <div className={`inline-flex items-center justify-center w-11 h-11 rounded-xl mb-4 ${accent} bg-opacity-20`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <h3 className="text-base font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
    </div>
  );
}

/* ────────────────────────── StepCard ──────────────────────── */
function StepCard({
  num,
  title,
  desc,
  icon: Icon,
}: {
  num: number;
  title: string;
  desc: string;
  icon: React.ElementType;
}) {
  return (
    <div className="flex flex-col items-center text-center gap-3">
      <div className="relative">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-600/30">
          <Icon className="w-6 h-6 text-white" />
        </div>
        <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-cyan-400 text-[#0a0d14] text-[10px] font-black flex items-center justify-center">
          {num}
        </span>
      </div>
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      <p className="text-xs text-slate-400 leading-relaxed max-w-[160px]">{desc}</p>
    </div>
  );
}

/* ────────────────────────── FAQ ────────────────────────────── */
const FAQ_ITEMS = [
  {
    q: "What happens if the server restarts mid-send?",
    a: "Nothing is lost. Every email is a durable queue job backed by Redis. On restart the system only re-queues jobs that were orphaned — already-sent emails are never touched or duplicated.",
  },
  {
    q: "How does rate limiting work?",
    a: "You set a global or per-sender hourly cap. When the limit is hit emails are automatically deferred to the next available window — never dropped, never failed.",
  },
  {
    q: "Can I upload a CSV of recipients?",
    a: "Yes. Upload a CSV or plain-text file with email addresses. We validate and de-duplicate on the spot so you know exactly how many jobs will be queued before you confirm.",
  },
  {
    q: "Do I get notified when something goes wrong?",
    a: "Connect Slack once and you'll get a real-time notification the instant a rate limit is hit — not a buried log line.",
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="border border-white/5 rounded-2xl bg-white/[0.02] overflow-hidden cursor-pointer group hover:border-purple-500/30 transition-colors duration-200"
      onClick={() => setOpen(!open)}
    >
      <div className="flex items-center justify-between px-6 py-4">
        <span className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors">{q}</span>
        {open ? (
          <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
        )}
      </div>
      {open && (
        <div className="px-6 pb-4 text-sm text-slate-400 leading-relaxed border-t border-white/5 pt-3">{a}</div>
      )}
    </div>
  );
}

/* ────────────────────────── Mockup Panel ───────────────────── */
function MockupPanel() {
  return (
    <div className="relative mx-auto max-w-4xl mt-16 w-full">
      {/* glow */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-600/20 via-indigo-600/20 to-cyan-500/20 blur-3xl scale-110 pointer-events-none" />

      {/* browser chrome */}
      <div className="relative rounded-2xl border border-white/10 bg-[#0d1117] shadow-2xl overflow-hidden">
        {/* address bar */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-[#0a0d14]">
          <span className="w-3 h-3 rounded-full bg-red-500" />
          <span className="w-3 h-3 rounded-full bg-yellow-400" />
          <span className="w-3 h-3 rounded-full bg-green-500" />
          <div className="flex-1 mx-4 px-3 py-1 rounded-md bg-white/5 text-xs text-slate-500 font-mono">
            reachinbox.app/dashboard
          </div>
          <span className="text-[10px] text-cyan-400 font-semibold tracking-wider">LIVE DASHBOARD</span>
        </div>

        {/* mock content */}
        <div className="p-5 grid grid-cols-12 gap-4 min-h-[260px]">
          {/* sidebar */}
          <div className="col-span-2 flex flex-col gap-3">
            {["Dashboard", "Scheduled", "Sent", "Records", "Settings"].map((item) => (
              <div
                key={item}
                className={`text-xs px-3 py-2 rounded-lg ${
                  item === "Dashboard"
                    ? "bg-purple-600/30 text-purple-300 font-semibold"
                    : "text-slate-500"
                }`}
              >
                {item}
              </div>
            ))}
          </div>

          {/* main */}
          <div className="col-span-10 flex flex-col gap-4">
            {/* stat row */}
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: "Total Scheduled", val: "1,284", color: "from-purple-600 to-indigo-600" },
                { label: "Sent Today", val: "342", color: "from-cyan-600 to-blue-600" },
                { label: "Pending", val: "96", color: "from-amber-600 to-orange-600" },
                { label: "Success Rate", val: "99.1%", color: "from-emerald-600 to-teal-600" },
              ].map(({ label, val, color }) => (
                <div key={label} className="rounded-xl p-3 bg-white/[0.04] border border-white/5">
                  <p className="text-[10px] text-slate-500 mb-1">{label}</p>
                  <p className={`text-lg font-bold bg-gradient-to-r ${color} bg-clip-text text-transparent`}>
                    {val}
                  </p>
                </div>
              ))}
            </div>

            {/* email rows */}
            <div className="flex flex-col gap-2">
              {[
                { to: "alice@example.com", subject: "Welcome to ReachInbox", status: "Sent", color: "text-emerald-400" },
                { to: "bob@company.io", subject: "Your weekly digest", status: "Scheduled", color: "text-blue-400" },
                { to: "team@startup.dev", subject: "Product update v2.1", status: "Pending", color: "text-amber-400" },
              ].map((row) => (
                <div
                  key={row.to}
                  className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-xs"
                >
                  <span className="text-slate-400 w-36 truncate">{row.to}</span>
                  <span className="text-slate-300 flex-1 px-4 truncate">{row.subject}</span>
                  <span className={`font-semibold ${row.color}`}>{row.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────── Page ───────────────────────────── */
export default function HomePage() {
  const [hasToken, setHasToken] = useState(false);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      setHasToken(!!localStorage.getItem("reachinbox_token"));
    }
  }, []);

  return (
    <main className="min-h-screen bg-[#07090e] text-white overflow-x-hidden">

      {/* ── HERO ──────────────────────────────────────────────── */}
      <section className="relative flex flex-col items-center text-center px-4 pt-20 pb-8">
        {/* radial glows */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-purple-700/10 rounded-full blur-[120px]" />
          <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[400px] h-[300px] bg-indigo-600/10 rounded-full blur-[80px]" />
        </div>

        <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center gap-6">
          <Badge>Reliable email scheduling, done right</Badge>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-[1.1] tracking-tight">
            Schedule emails at scale.{" "}
            <span className="bg-gradient-to-r from-purple-400 via-indigo-400 to-cyan-400 bg-clip-text text-transparent">
              Never lose a send.
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-400 max-w-2xl leading-relaxed">
            A queue-backed scheduler that survives restarts, respects your rate limits, and tells
            you the moment something needs attention — no cron jobs, no lost jobs, no duplicates.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 mt-2">
            <Link href={hasToken ? "/dashboard" : "/auth"}>
              <Button
                variant="gradient"
                size="lg"
                leftIcon={<Sparkles className="w-4 h-4" />}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                {hasToken ? "Go to Dashboard" : "Get Started"}
              </Button>
            </Link>
            <Link href="/about">
              <Button variant="secondary" size="lg">
                Learn More
              </Button>
            </Link>
          </div>

          <p className="text-xs text-slate-500 mt-2">
            Built on BullMQ + Redis&nbsp;·&nbsp;PostgreSQL-backed&nbsp;·&nbsp;Live queue
            visibility&nbsp;·&nbsp;Slack alerts on rate limits
          </p>
        </div>

        <MockupPanel />
      </section>

      {/* ── FEATURES ──────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 py-24">
        <div className="text-center mb-12">
          <Badge>Features</Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold mt-4 mb-3">
            Everything you need. Nothing you don&apos;t.
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto text-sm">
            Built for teams that need reliable delivery at any volume — with full visibility into every job.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <FeatureCard
            icon={Shield}
            title="Persistent by design"
            desc="Every scheduled email is backed by a durable queue job, not a timer in memory. Restart the server mid-send and nothing is lost, duplicated, or restarted from scratch."
            accent="bg-purple-600"
          />
          <FeatureCard
            icon={Zap}
            title="Rate limits that actually hold"
            desc="Set a global or per-sender hourly cap. When a limit is hit, emails are automatically deferred to the next window in order — never dropped, never failed outright."
            accent="bg-cyan-500"
          />
          <FeatureCard
            icon={Eye}
            title="Live visibility"
            desc="Watch every job move through the queue in real time, from scheduled to processing to sent, with a live dashboard you can check anytime."
            accent="bg-emerald-500"
          />
          <FeatureCard
            icon={Bell}
            title="Slack, the moment it matters"
            desc="Connect Slack once. The instant a sender's rate limit is hit, you get a real notification — not a buried log line."
            accent="bg-amber-500"
          />
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────── */}
      <section className="relative py-24 bg-white/[0.02] border-y border-white/5">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-14">
            <Badge>How it works</Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold mt-4 mb-3">
              From compose to delivered in 3 steps
            </h2>
            <p className="text-slate-400 text-sm max-w-lg mx-auto">
              No cron jobs. No timing hacks. Just a queue that does what it says.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-10">
            <StepCard
              num={1}
              icon={Mail}
              title="Compose & schedule"
              desc="Write your email, upload a CSV of recipients, set when it should go out."
            />
            <StepCard
              num={2}
              icon={Clock}
              title="We queue it safely"
              desc="Each email becomes a durable, idempotent job — trackable, restart-proof, rate-limit aware."
            />
            <StepCard
              num={3}
              icon={Send}
              title="It sends, you see it"
              desc="Track scheduled and sent emails in one dashboard, searchable in seconds."
            />
          </div>

          <div className="text-center mt-10">
            <Link
              href="/about"
              className="inline-flex items-center gap-1.5 text-sm text-purple-400 hover:text-purple-300 transition-colors"
            >
              Read the full workflow <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── DASHBOARD OVERVIEW ────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 py-24 text-center">
        <Badge>Dashboard</Badge>
        <h2 className="text-3xl sm:text-4xl font-extrabold mt-4 mb-3">Everything in one place</h2>
        <p className="text-slate-400 max-w-xl mx-auto text-sm mb-10">
          See what&apos;s scheduled, what&apos;s sent, and what failed — with search across every
          email you&apos;ve ever queued.
        </p>
        <div className="grid sm:grid-cols-3 gap-6">
          {[
            { icon: BarChart2, label: "Live queue stats", color: "from-purple-600 to-indigo-600" },
            { icon: CheckCircle, label: "Sent & failed tracking", color: "from-cyan-600 to-blue-600" },
            { icon: Eye, label: "Full-text search", color: "from-emerald-600 to-teal-600" },
          ].map(({ icon: Icon, label, color }) => (
            <div
              key={label}
              className="rounded-2xl p-6 border border-white/5 bg-white/[0.03] hover:border-white/10 hover:-translate-y-1 transition-all duration-300 flex flex-col items-center gap-3"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <p className="text-sm font-medium text-slate-200">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────── */}
      <section className="max-w-3xl mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <Badge>FAQ</Badge>
          <h2 className="text-3xl font-extrabold mt-4 mb-2">Common questions</h2>
        </div>
        <div className="flex flex-col gap-3">
          {FAQ_ITEMS.map((item) => (
            <FAQItem key={item.q} q={item.q} a={item.a} />
          ))}
        </div>
      </section>

      {/* ── FINAL CTA ─────────────────────────────────────────── */}
      <section className="relative py-24 text-center overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-indigo-900/20 to-cyan-900/20" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-purple-600/10 rounded-full blur-[100px]" />
        </div>
        <div className="relative z-10 max-w-2xl mx-auto px-4">
          <h2 className="text-4xl sm:text-5xl font-extrabold mb-4">Start scheduling in minutes</h2>
          <p className="text-slate-400 mb-8 text-lg">
            Connect your Google account and send your first batch today.
          </p>
          <Link href={hasToken ? "/dashboard" : "/auth"}>
            <Button
              variant="gradient"
              size="lg"
              leftIcon={<Sparkles className="w-4 h-4" />}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              {hasToken ? "Go to Dashboard" : "Sign in with Google"}
            </Button>
          </Link>
        </div>
      </section>
    </main>
  );
}
