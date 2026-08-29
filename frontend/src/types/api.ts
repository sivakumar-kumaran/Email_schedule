export type EmailStatus = "SCHEDULED" | "PENDING" | "SENT" | "FAILED" | "CANCELLED";

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
  createdAt: string;
  senders?: Sender[];
  slackConnection?: SlackConnectionSummary | null;
}

export interface Sender {
  id: string;
  userId: string;
  address: string;
  name?: string | null;
  createdAt: string;
}

export interface Email {
  id: string;
  userId: string;
  senderId: string;
  recipient: string;
  subject: string;
  body: string;
  status: EmailStatus;
  scheduledAt: string;
  sentAt?: string | null;
  idempotencyKey: string;
  bullJobId?: string | null;
  errorMessage?: string | null;
  createdAt: string;
  updatedAt: string;
  sender?: {
    id: string;
    address: string;
    name?: string | null;
  };
}

export interface SlackConnectionSummary {
  id: string;
  workspace: string;
  teamId?: string | null;
  createdAt: string;
}

export interface ScheduleEmailPayload {
  subject: string;
  body: string;
  recipients: string[];
  senderId: string;
  scheduledAt?: string;
  delayBetweenSendsMs?: number;
}

export interface EmailListResponse {
  emails: Email[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SearchEmailResponse {
  source: string;
  results: Array<{
    emailId?: string;
    id?: string;
    userId: string;
    senderId: string;
    sender: string | { address: string; name?: string };
    recipient: string;
    subject: string;
    body: string;
    status: EmailStatus;
    scheduledAt: string;
    sentAt?: string | null;
    createdAt: string;
  }>;
}
