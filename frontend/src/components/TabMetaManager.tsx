"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Crisp SVG Data URI for ReachInbox Brand Logo (White top flap + Purple-Cyan gradient)
const BRAND_FAVICON = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Cdefs%3E%3ClinearGradient id='rBorder' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23a855f7'/%3E%3Cstop offset='100%25' stop-color='%2306b6d4'/%3E%3C/linearGradient%3E%3ClinearGradient id='rGrad' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23c084fc'/%3E%3Cstop offset='50%25' stop-color='%23818cf8'/%3E%3Cstop offset='100%25' stop-color='%2322d3ee'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='64' height='64' rx='16' fill='%230b0f19' stroke='url(%23rBorder)' stroke-width='3'/%3E%3Crect x='4' y='4' width='56' height='56' rx='13' fill='%23111827' fill-opacity='0.9'/%3E%3Cpath d='M10 18C10 14.68 12.68 12 16 12H48C51.31 12 54 14.68 54 18V46C54 49.31 51.31 52 48 52H16C12.68 52 10 49.31 10 46V18Z' fill='%23182238' stroke='url(%23rGrad)' stroke-width='3.5' stroke-linejoin='round'/%3E%3Cpath d='M10 18L32 34L54 18' stroke='%23ffffff' stroke-width='4.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3Cpath d='M32 34L20 48M32 34L44 48' stroke='%2338bdf8' stroke-width='3.5' stroke-linecap='round'/%3E%3Ccircle cx='32' cy='34' r='4.5' fill='%2338bdf8' stroke='%23ffffff' stroke-width='1.5'/%3E%3C/svg%3E`;

// Crisp SVG Data URI for BullMQ Hex-Lightning Logo
const QUEUE_FAVICON = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Cdefs%3E%3ClinearGradient id='qbg' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23083344'/%3E%3Cstop offset='100%25' stop-color='%23020617'/%3E%3C/linearGradient%3E%3ClinearGradient id='qbrand' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%2322d3ee'/%3E%3Cstop offset='50%25' stop-color='%23818cf8'/%3E%3Cstop offset='100%25' stop-color='%23c084fc'/%3E%3C/linearGradient%3E%3ClinearGradient id='bolt' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%2338bdf8'/%3E%3Cstop offset='100%25' stop-color='%2334d399'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='32' height='32' rx='7' fill='url(%23qbg)' stroke='%2322d3ee' stroke-width='1.5'/%3E%3Cpath d='M16 4L26 9.5V22.5L16 28L6 22.5V9.5L16 4Z' fill='url(%23qbrand)' fill-opacity='0.2' stroke='url(%23qbrand)' stroke-width='1.8' stroke-linejoin='round'/%3E%3Cpath d='M17 7L10 17H16L15 25L22 15H16L17 7Z' fill='url(%23bolt)' fill-opacity='0.95' stroke='%23ffffff' stroke-width='0.75' stroke-linejoin='round'/%3E%3Ccircle cx='23' cy='10' r='1.8' fill='%2322d3ee'/%3E%3Ccircle cx='9' cy='22' r='1.8' fill='%23a855f7'/%3E%3C/svg%3E`;

export function TabMetaManager() {
  const pathname = usePathname();

  useEffect(() => {
    const isQueue = pathname?.startsWith("/queue");
    const isDashboard = pathname?.startsWith("/dashboard");
    const isAbout = pathname === "/about";
    const isContact = pathname === "/contact";
    const isAuth = pathname === "/auth";

    // 1. Dynamic Tab Title
    if (isQueue) {
      document.title = "⚡ BullMQ Queue Orchestrator | ReachInbox";
    } else if (isDashboard) {
      document.title = "Dashboard • ReachInbox Scheduler";
    } else if (isAbout) {
      document.title = "About ReachInbox • Architecture & Engine";
    } else if (isContact) {
      document.title = "Contact ReachInbox Support";
    } else if (isAuth) {
      document.title = "Sign In / Sign Up • ReachInbox";
    } else {
      document.title = "ReachInbox | Next-Gen Email Scheduler";
    }

    // 2. Dynamic Tab Favicon Injection
    const activeFavicon = isQueue ? QUEUE_FAVICON : BRAND_FAVICON;

    // Remove existing icon links so browser immediately registers the new icon
    const existingIcons = document.querySelectorAll("link[rel*='icon']");
    existingIcons.forEach((el) => el.remove());

    const iconLink = document.createElement("link");
    iconLink.rel = "icon";
    iconLink.type = "image/svg+xml";
    iconLink.href = activeFavicon;
    document.head.appendChild(iconLink);

    const shortcutLink = document.createElement("link");
    shortcutLink.rel = "shortcut icon";
    shortcutLink.type = "image/svg+xml";
    shortcutLink.href = activeFavicon;
    document.head.appendChild(shortcutLink);

    const appleLink = document.createElement("link");
    appleLink.rel = "apple-touch-icon";
    appleLink.href = activeFavicon;
    document.head.appendChild(appleLink);
  }, [pathname]);

  return null;
}

export default TabMetaManager;
