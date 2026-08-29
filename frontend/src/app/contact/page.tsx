"use client";

import React from "react";
import Link from "next/link";
import { Sparkles, Mail, MessageSquare, Twitter, ArrowRight } from "lucide-react";
import { Button } from "../../components/ui/Button";

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300 text-xs font-semibold tracking-widest uppercase backdrop-blur-sm">
      <Sparkles className="w-3.5 h-3.5" />
      {children}
    </div>
  );
}

function ContactCard({
  icon: Icon,
  title,
  desc,
  accent,
  linkText,
  href,
}: {
  icon: React.ElementType;
  title: string;
  desc: string;
  accent: string;
  linkText: string;
  href: string;
}) {
  return (
    <div className="group relative rounded-2xl p-6 border border-white/5 bg-[#1a2133]/60 backdrop-blur-sm hover:border-white/15 hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 overflow-hidden flex flex-col h-full">
      <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-300 ${accent}`} />
      
      <div className={`inline-flex items-center justify-center w-11 h-11 rounded-xl mb-4 ${accent} bg-opacity-20`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      
      <h3 className="text-xl font-semibold text-white mb-2 relative z-10">{title}</h3>
      <p className="text-sm text-slate-400 leading-relaxed flex-grow relative z-10">{desc}</p>
      
      <div className="mt-6 relative z-10">
        <a 
          href={href} 
          className={`inline-flex items-center gap-2 text-sm font-medium hover:underline transition-all`}
        >
          {linkText} <ArrowRight className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-[#07090e] text-white overflow-x-hidden">
      {/* ── HERO ──────────────────────────────────────────────── */}
      <section className="relative flex flex-col items-center text-center px-4 pt-20 pb-16">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-purple-700/10 rounded-full blur-[120px]" />
          <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[400px] h-[300px] bg-indigo-600/10 rounded-full blur-[80px]" />
        </div>

        <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center gap-6">
          <Badge>Get in touch</Badge>

          <h1 className="text-5xl sm:text-6xl font-extrabold leading-[1.1] tracking-tight">
            We'd love to <br />
            <span className="bg-gradient-to-r from-purple-400 via-indigo-400 to-cyan-400 bg-clip-text text-transparent">
              hear from you
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-400 max-w-2xl leading-relaxed">
            Whether you have a question about features, trials, pricing, need a demo, or anything else, our team is ready to answer all your questions.
          </p>
        </div>
      </section>

      {/* ── CONTACT CARDS ──────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 pb-24">
        <div className="grid sm:grid-cols-3 gap-6">
          <ContactCard
            icon={Mail}
            title="Email Support"
            desc="Prefer to email? Send us an email and we'll get back to you within 24 hours."
            accent="bg-purple-600"
            linkText="support@reachinbox.app"
            href="mailto:support@reachinbox.app"
          />
          <ContactCard
            icon={MessageSquare}
            title="Live Chat"
            desc="Need help right away? Chat with our support team in real-time."
            accent="bg-cyan-500"
            linkText="Start a chat"
            href="#"
          />
          <ContactCard
            icon={Twitter}
            title="Social Media"
            desc="Reach out to us on Twitter for quick updates and general questions."
            accent="bg-blue-500"
            linkText="@reachinbox"
            href="#"
          />
        </div>
      </section>

      {/* ── CONTACT FORM ──────────────────────────────────────── */}
      <section className="relative py-24 bg-white/[0.02] border-y border-white/5">
        <div className="max-w-2xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-extrabold mb-4">Send us a message</h2>
            <p className="text-slate-400">Fill out the form below and we'll be in touch shortly.</p>
          </div>

          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">First Name</label>
                <input 
                  type="text" 
                  className="w-full bg-[#1a2133]/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all"
                  placeholder="Jane"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Last Name</label>
                <input 
                  type="text" 
                  className="w-full bg-[#1a2133]/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all"
                  placeholder="Doe"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Email Address</label>
              <input 
                type="email" 
                className="w-full bg-[#1a2133]/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all"
                placeholder="jane@company.com"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Message</label>
              <textarea 
                rows={5}
                className="w-full bg-[#1a2133]/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all resize-none"
                placeholder="How can we help you?"
              ></textarea>
            </div>

            <Button
              variant="gradient"
              size="lg"
              className="w-full mt-4"
              type="submit"
            >
              Send Message
            </Button>
          </form>
        </div>
      </section>
      
      {/* ── FINAL CTA ─────────────────────────────────────────── */}
      <section className="relative py-24 text-center overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-indigo-900/20 to-cyan-900/20" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-purple-600/10 rounded-full blur-[100px]" />
        </div>
        <div className="relative z-10 max-w-2xl mx-auto px-4">
          <h2 className="text-3xl font-extrabold mb-4">Ready to get started?</h2>
          <p className="text-slate-400 mb-8">
            Create an account and send your first batch of emails today.
          </p>
          <Link href="/auth">
            <Button
              variant="gradient"
              size="lg"
              leftIcon={<Sparkles className="w-4 h-4" />}
            >
              Sign up for free
            </Button>
          </Link>
        </div>
      </section>
    </main>
  );
}
