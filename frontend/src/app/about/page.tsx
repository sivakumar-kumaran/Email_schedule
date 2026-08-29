"use client";

import React from "react";
import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  PenTool,
  Database,
  ListTodo,
  Users,
  ShieldAlert,
  Send,
  RefreshCcw,
  Power,
} from "lucide-react";
import { Button } from "../../components/ui/Button";

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300 text-xs font-semibold tracking-widest uppercase backdrop-blur-sm">
      <Sparkles className="w-3.5 h-3.5" />
      {children}
    </div>
  );
}

function WorkflowCard({
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
    <div className="group relative rounded-2xl p-6 border border-white/5 bg-[#1a2133]/60 backdrop-blur-sm hover:border-white/15 hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 overflow-hidden">
      <div className={`inline-flex items-center justify-center w-11 h-11 rounded-xl mb-4 ${accent}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <h3 className="text-base font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
    </div>
  );
}

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#07090e] text-white overflow-x-hidden">
      {/* ── HERO ──────────────────────────────────────────────── */}
      <section className="relative flex flex-col items-center text-center px-4 pt-20 pb-8">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-purple-700/10 rounded-full blur-[120px]" />
          <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[400px] h-[300px] bg-indigo-600/10 rounded-full blur-[80px]" />
        </div>

        <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center gap-6">
          <Badge>About MailNova</Badge>

          <h1 className="text-5xl sm:text-6xl font-extrabold leading-[1.1] tracking-tight">
            How the scheduler <br />
            <span className="bg-gradient-to-r from-purple-400 via-indigo-400 to-cyan-400 bg-clip-text text-transparent">
              actually works
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-400 max-w-2xl leading-relaxed">
            Most "schedule for later" tools are a thin wrapper around a cron job and a hope. This one isn't. Every email you schedule becomes a durable, trackable job in a real queue — so it survives restarts, respects rate limits automatically, and never gets sent twice.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 mt-2">
            <Link href="/auth">
              <Button
                variant="gradient"
                size="lg"
                leftIcon={<Sparkles className="w-4 h-4" />}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Get Started
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="secondary" size="lg">
                Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── WORKFLOW / PLATFORM FEATURES ─────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 py-24">
        <div className="text-center mb-12">
          <Badge>Workflow</Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold mt-4 mb-3">
            The Step-by-Step Architecture
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto text-sm">
            Built with cutting-edge tech to deliver a premium, reliable email delivery experience.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <WorkflowCard
            icon={PenTool}
            title="1. You compose an email"
            desc="You write a subject and body, upload a list of recipients, and set a start time, a delay between sends, and an hourly limit. We validate and de-duplicate on the spot."
            accent="bg-purple-600"
          />
          <WorkflowCard
            icon={Database}
            title="2. It's recorded"
            desc="Each email is written to the database first, with a status of pending. That row's own ID is used as the identifier for its job in the queue, making it idempotent."
            accent="bg-blue-500"
          />
          <WorkflowCard
            icon={ListTodo}
            title="3. It joins the queue"
            desc="Each pending email becomes a delayed job in a Redis-backed queue. This isn't a setTimeout — it's a durable job that exists independently."
            accent="bg-emerald-500"
          />
          <WorkflowCard
            icon={Users}
            title="4. Workers pick it up"
            desc="When a job's time comes, a worker process picks it up and checks sender and global limits against shared counters."
            accent="bg-amber-500"
          />
          <WorkflowCard
            icon={ShieldAlert}
            title="5. Limit handling"
            desc="If sending would exceed a cap, it's automatically pushed into the next available hour. Nothing is lost, and Slack is notified."
            accent="bg-rose-500"
          />
          <WorkflowCard
            icon={Send}
            title="6. It sends"
            desc="Emails go out spaced apart by a configurable minimum delay. If a send fails for a transient reason, it's automatically retried with backoff."
            accent="bg-indigo-500"
          />
          <WorkflowCard
            icon={RefreshCcw}
            title="7. Status updates"
            desc="The moment an email sends (or fails), its database record updates, and it shows up instantly in your Sent Emails table."
            accent="bg-teal-500"
          />
          <WorkflowCard
            icon={Power}
            title="8. Restarts"
            desc="If the server restarts, nothing already sent gets touched, and nothing already queued gets duplicated. Only orphaned pending jobs are recovered."
            accent="bg-cyan-500"
          />
        </div>
      </section>

      {/* ── FINAL CTA ─────────────────────────────────────────── */}
      <section className="relative py-24 text-center overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-indigo-900/20 to-cyan-900/20" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-purple-600/10 rounded-full blur-[100px]" />
        </div>
        <div className="relative z-10 max-w-2xl mx-auto px-4">
          <h2 className="text-4xl sm:text-5xl font-extrabold mb-4">No cron jobs. No lost sends.</h2>
          <p className="text-slate-400 mb-8 text-lg">
            No duplicates. Just a queue that does what it says.
          </p>
          <Link href="/auth">
            <Button
              variant="gradient"
              size="lg"
              leftIcon={<Sparkles className="w-4 h-4" />}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Start scheduling
            </Button>
          </Link>
        </div>
      </section>
    </main>
  );
}

