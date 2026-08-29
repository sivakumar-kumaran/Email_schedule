"use client";

import "./globals.css";
import React, { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { ThemeProvider } from "../context/ThemeContext";
import Header from "../components/Header";
import { TabMetaManager } from "../components/TabMetaManager";
import { DashboardProvider, useDashboard } from "../context/DashboardContext";
import { ComposeModal } from "../components/ComposeModal";

// We'll render ComposeModal via a wrapper that consumes the DashboardContext

const ComposeModalWrapper: React.FC = () => {
  const { isComposeOpen, closeCompose } = useDashboard();
  return <ComposeModal isOpen={isComposeOpen} onClose={closeCompose} />;
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Hook usage moved to inner wrapper component
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 4000,
            refetchInterval: 60000,
          },
        },
      })
  );
  return (
    <html lang="en">
      <head>
        <title>ReachInbox | Next-Gen Email Scheduler</title>
        <meta
          name="description"
          content="Production-grade delayed email scheduler with BullMQ, Redis rate limiting, Slack alerting, and full-text Elasticsearch search."
        />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="alternate icon" href="/favicon.svg" />
      </head>
      <body className="min-h-screen bg-background text-slate-100 antialiased selection:bg-brand-500 selection:text-white">
        <TabMetaManager />
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <DashboardProvider>
              <Header />
              {children}
              {/* Wrapper to render ComposeModal using context within provider */}
              <ComposeModalWrapper />
              <Toaster
                position="bottom-right"
                theme="dark"
                toastOptions={{
                  style: {
                    background: "#111726",
                    border: "1px solid #1f293d",
                    color: "#f1f5f9",
                  },
                }}
              />
            </DashboardProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}
