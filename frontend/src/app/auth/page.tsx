"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Mail,
  Zap,
  ShieldCheck,
  Clock,
  ArrowRight,
  Sparkles,
  Send,
  Lock,
  User,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { BrandLogo } from "../../components/ui/BrandLogo";
import { authApi } from "../../lib/api";
import { toast } from "sonner";

function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "signup" ? "signup" : "login";

  const [activeTab, setActiveTab] = useState<"login" | "signup">(initialTab);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "signup" || tabParam === "login") {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  useEffect(() => {
    const token = localStorage.getItem("reachinbox_token");
    if (token) {
      router.push("/home");
    }
  }, [router]);

  const handleGoogleLogin = () => {
    window.location.href = authApi.getGoogleAuthUrl();
  };

  const handleDemoLogin = async () => {
    try {
      setIsDemoLoading(true);
      await authApi.devLogin("demo.user@reachinbox.ai", "Alex Rivera");
      toast.success("Welcome to ReachInbox Scheduler!");
      router.push("/home");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to log in");
    } finally {
      setIsDemoLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }
    if (!password.trim()) {
      toast.error("Please enter a password");
      return;
    }
    if (activeTab === "signup" && !name.trim()) {
      toast.error("Please enter your name");
      return;
    }

    try {
      setIsLoading(true);
      if (activeTab === "signup") {
        await authApi.signup({ name, email, password });
        toast.success("Account created successfully!");
      } else {
        await authApi.login({ email, password });
        toast.success("Welcome back!");
      }
      router.push("/home");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main suppressHydrationWarning className="relative min-h-screen flex items-center justify-center p-4 sm:p-6 overflow-hidden bg-[#07090e]">
      {/* Radiant Background Glows */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-brand-600/25 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-accent-violet/25 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-brand-500/5 rounded-full blur-[180px] pointer-events-none" />

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293d15_1px,transparent_1px),linear-gradient(to_bottom,#1f293d15_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-6 flex flex-col items-center">
          <BrandLogo size="lg" href="/home" />
          <p className="text-xs text-slate-400 mt-2">
            Enterprise Email Scheduler & Intelligent Queue Orchestration
          </p>
        </div>

        {/* Auth Card */}
        <div className="glass-panel rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/10 relative">
          {/* Tab Switcher: Login vs Sign Up */}
          <div className="grid grid-cols-2 p-1 rounded-xl bg-[#0a0e1a] border border-surfaceBorder mb-6">
            <button
              type="button"
              onClick={() => setActiveTab("login")}
              className={`py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
                activeTab === "login"
                  ? "bg-brand-600 text-white shadow-md shadow-brand-600/40"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("signup")}
              className={`py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
                activeTab === "signup"
                  ? "bg-brand-600 text-white shadow-md shadow-brand-600/40"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {activeTab === "signup" && (
              <Input
                label="Full Name"
                placeholder="Alex Rivera"
                value={name}
                onChange={(e) => setName(e.target.value)}
                leftIcon={<User className="w-4 h-4" />}
                required
              />
            )}

            <Input
              label="Email Address"
              type="email"
              placeholder="alex@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4" />}
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
              required
            />

            <Button
              type="submit"
              variant="gradient"
              size="lg"
              className="w-full justify-center text-sm font-semibold mt-2"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
              suppressHydrationWarning={true}
            >
              {activeTab === "signup" ? "Create Account & Go to Home" : "Sign In & Go to Home"}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center justify-center my-5">
            <div className="border-t border-surfaceBorder w-full" />
            <span className="bg-surface px-3 text-[11px] uppercase tracking-wider text-slate-500 font-medium">
              Or Continue With
            </span>
            <div className="border-t border-surfaceBorder w-full" />
          </div>

          {/* Google OAuth + Quick Demo */}
          <div className="space-y-2.5">
            <Button
              type="button"
              variant="secondary"
              size="md"
              className="w-full justify-center text-xs font-semibold hover:border-slate-500"
              onClick={handleGoogleLogin}
              leftIcon={
                <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              }
              suppressHydrationWarning={true}
            >
              Google Workspace SSO
            </Button>

            <Button
              type="button"
              variant="outline"
              size="md"
              className="w-full justify-center text-xs font-semibold border-brand-500/30 hover:bg-brand-500/10 text-brand-300"
              onClick={handleDemoLogin}
              isLoading={isDemoLoading}
              leftIcon={<Sparkles className="w-3.5 h-3.5 text-brand-400" />}
              suppressHydrationWarning={true}
            >
              Instant 1-Click Demo Login
            </Button>
          </div>

          {/* Feature Highlights */}
          <div className="mt-6 pt-5 border-t border-surfaceBorder/60 grid grid-cols-2 gap-2 text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-accent-cyan shrink-0" />
              <span>BullMQ Delayed Queue</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-accent-emerald shrink-0" />
              <span>Zero-Cron Idempotent</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-accent-amber shrink-0" />
              <span>Redis Rate Limiter</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-accent-violet shrink-0" />
              <span>Slack Webhook Alerts</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-5">
          <Link href="/home" className="text-xs text-slate-400 hover:text-white transition-colors">
            ← Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#07090e]">
          <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
        </div>
      }
    >
      <AuthForm />
    </Suspense>
  );
}
