import axios from "axios";
import {
  EmailListResponse,
  ScheduleEmailPayload,
  SearchEmailResponse,
  Sender,
  User,
} from "../types/api";

const getInitialBackendUrl = (): string => {
  if (typeof window !== "undefined") {
    const isLocalhost =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";
    if (isLocalhost) {
      return "http://localhost:5000/api";
    }
  }
  const rawEnv = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL;
  const raw = rawEnv || "https://email-schedule-gr55.onrender.com/api";
  return raw.endsWith("/api") ? raw : `${raw}/api`;
};

export const BACKEND_URL = getInitialBackendUrl();
export const ROOT_URL = BACKEND_URL.replace(/\/api\/?$/, "");

export const api = axios.create({
  baseURL: BACKEND_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach JWT token from localStorage to every request and ensure correct baseURL
api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const isLocalhost =
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1";
      if (isLocalhost) {
        config.baseURL = "http://localhost:5000/api";
      } else if (!config.baseURL || config.baseURL.includes("localhost")) {
        const rawEnv = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "https://email-schedule-gr55.onrender.com/api";
        config.baseURL = rawEnv.endsWith("/api") ? rawEnv : `${rawEnv}/api`;
      }
      const token = localStorage.getItem("reachinbox_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      const p = window.location.pathname;
      if (p !== "/" && !p.startsWith("/auth") && !p.startsWith("/login")) {
        localStorage.removeItem("reachinbox_token");
        window.location.href = "/";
      }
    }
    return Promise.reject(error);
  }
);

// ─── API Endpoints ──────────────────────────────────────────────────────────

export const authApi = {
  getMe: async () => {
    const res = await api.get<{ user: User }>("/auth/me");
    return res.data.user;
  },
  login: async (data: { email: string; password?: string }) => {
    const res = await api.post<{ token: string; user: User }>("/auth/login", data);
    if (typeof window !== "undefined") {
      localStorage.setItem("reachinbox_token", res.data.token);
    }
    return res.data;
  },
  signup: async (data: { name: string; email: string; password?: string }) => {
    const res = await api.post<{ token: string; user: User }>("/auth/signup", data);
    if (typeof window !== "undefined") {
      localStorage.setItem("reachinbox_token", res.data.token);
    }
    return res.data;
  },
  devLogin: async (email?: string, name?: string) => {
    const res = await api.post<{ token: string; user: User }>("/auth/dev-login", {
      email,
      name,
    });
    if (typeof window !== "undefined") {
      localStorage.setItem("reachinbox_token", res.data.token);
    }
    return res.data;
  },
  getGoogleAuthUrl: () => {
    let backend = "https://email-schedule-gr55.onrender.com/api";
    if (typeof window !== "undefined") {
      const isLocalhost =
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1";
      if (isLocalhost) {
        backend = "http://localhost:5000/api";
      } else {
        const envUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL;
        if (envUrl) {
          backend = envUrl.endsWith("/api") ? envUrl : `${envUrl}/api`;
        }
      }
    }
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return `${backend}/auth/google${origin ? `?frontend_url=${encodeURIComponent(origin)}` : ""}`;
  },
  getBullBoardUrl: () => "/queue",
  getRawBullBoardUrl: () =>
    process.env.NEXT_PUBLIC_BULL_BOARD_URL || `${ROOT_URL}/admin/queues`,
};

export const emailApi = {
  getEmails: async (params?: { status?: string; senderId?: string; page?: number; limit?: number }) => {
    const res = await api.get<EmailListResponse>("/emails", { params });
    return res.data;
  },
  scheduleEmails: async (payload: ScheduleEmailPayload) => {
    const res = await api.post<{ success: boolean; count: number; emails: any[] }>(
      "/emails/schedule",
      payload
    );
    return res.data;
  },
  searchEmails: async (query: string) => {
    const res = await api.get<SearchEmailResponse>("/emails/search", {
      params: { q: query },
    });
    return res.data;
  },
  deleteEmail: async (emailId: string) => {
    const res = await api.delete<{ success: boolean }>(`/emails/${emailId}`);
    return res.data;
  },
  cancelEmail: async (emailId: string) => {
    const res = await api.delete<{ success: boolean }>(`/emails/${emailId}`);
    return res.data;
  },
};

export const senderApi = {
  getSenders: async () => {
    const res = await api.get<{ senders: Sender[] }>("/senders");
    return res.data.senders;
  },
  createSender: async (data: { address: string; name?: string }) => {
    const res = await api.post<{ sender: Sender }>("/senders", data);
    return res.data.sender;
  },
};

export const slackApi = {
  getConnectUrl: async () => {
    const res = await api.get<{ url: string }>("/slack/connect");
    return res.data.url;
  },
  getStatus: async () => {
    const res = await api.get<{ connected: boolean; connection: any }>("/slack/status");
    return res.data;
  },
  disconnect: async () => {
    const res = await api.delete<{ success: boolean }>("/slack/disconnect");
    return res.data;
  },
};

export interface QueueStatsResponse {
  queueName: string;
  redisConnected: boolean;
  isPaused: boolean;
  counts: {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
    pendingRateLimited: number;
    total: number;
  };
  config: {
    workerConcurrency: number;
    maxEmailsPerHour: number;
    minDelayMs: number;
    redisUrl: string;
  };
  recentJobs: Array<{
    id: string;
    recipient: string;
    subject: string;
    body: string;
    status: string;
    scheduledAt: string;
    sentAt?: string | null;
    errorMessage?: string | null;
    idempotencyKey: string;
    sender: {
      id: string;
      address: string;
      name?: string | null;
    };
  }>;
}

export const queueApi = {
  getStats: async () => {
    const res = await api.get<QueueStatsResponse>("/queue/stats");
    return res.data;
  },
  pauseQueue: async () => {
    const res = await api.post<{ success: boolean; message: string }>("/queue/pause");
    return res.data;
  },
  resumeQueue: async () => {
    const res = await api.post<{ success: boolean; message: string }>("/queue/resume");
    return res.data;
  },
  retryFailed: async () => {
    const res = await api.post<{ success: boolean; message: string }>("/queue/retry-failed");
    return res.data;
  },
  cleanQueue: async () => {
    const res = await api.post<{ success: boolean; message: string }>("/queue/clean");
    return res.data;
  },
};
