"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");
    const error = searchParams.get("error");

    if (error) {
      toast.error(`Authentication failed: ${error}`);
      router.push("/");
      return;
    }

    if (token) {
      localStorage.setItem("reachinbox_token", token);
      toast.success("Successfully authenticated!");
      router.push("/home");
    } else {
      toast.error("No token received from auth server");
      router.push("/");
    }
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0d14] text-white">
      <Loader2 className="w-10 h-10 animate-spin text-brand-500 mb-4" />
      <p className="text-sm text-slate-400">Completing sign-in and setting up your workspace...</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#0a0d14]">
          <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
        </div>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}
