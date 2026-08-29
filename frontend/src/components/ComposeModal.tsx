import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Papa from "papaparse";
import {
  Mail,
  Upload,
  Calendar,
  Clock,
  Send,
  Plus,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Zap,
} from "lucide-react";
import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { emailApi, senderApi } from "../lib/api";
import { toast } from "sonner";
import { format, addMinutes } from "date-fns";

interface ComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ComposeModal: React.FC<ComposeModalProps> = ({ isOpen, onClose }) => {
  const queryClient = useQueryClient();

  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [recipientsInput, setRecipientsInput] = useState("");
  const [parsedRecipients, setParsedRecipients] = useState<string[]>([]);
  const [senderId, setSenderId] = useState("");

  // Timing controls: Date, Hour, Minute, AM/PM
  const now = new Date();
  const initialSendTime = addMinutes(now, 5);

  const [scheduleType, setScheduleType] = useState<"now" | "later">("later");
  const [dateVal, setDateVal] = useState(format(initialSendTime, "yyyy-MM-dd"));
  const [hourVal, setHourVal] = useState(format(initialSendTime, "hh")); // 01-12
  const [minuteVal, setMinuteVal] = useState(format(initialSendTime, "mm")); // 00-59
  const [ampmVal, setAmpmVal] = useState<"AM" | "PM">(
    parseInt(format(initialSendTime, "HH"), 10) >= 12 ? "PM" : "AM"
  );

  const [delaySeconds, setDelaySeconds] = useState("2");
  const [hourlyLimitPreview, setHourlyLimitPreview] = useState("50");
  const [csvFileName, setCsvFileName] = useState<string | null>(null);

  // Inline add sender
  const [isAddingSender, setIsAddingSender] = useState(false);
  const [newSenderEmail, setNewSenderEmail] = useState("");
  const [newSenderName, setNewSenderName] = useState("");

  // Fetch senders
  const { data: senders = [] } = useQuery({
    queryKey: ["senders"],
    queryFn: senderApi.getSenders,
  });

  // Select first sender if none selected
  React.useEffect(() => {
    if (senders.length > 0 && !senderId) {
      setSenderId(senders[0].id);
    }
  }, [senders, senderId]);

  // Mutation for creating new sender
  const createSenderMutation = useMutation({
    mutationFn: senderApi.createSender,
    onSuccess: (newSender) => {
      queryClient.invalidateQueries({ queryKey: ["senders"] });
      setSenderId(newSender.id);
      setIsAddingSender(false);
      setNewSenderEmail("");
      setNewSenderName("");
      toast.success(`Sender "${newSender.address}" added!`);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to add sender");
    },
  });

  // Handle CSV Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvFileName(file.name);
    Papa.parse(file, {
      complete: (results) => {
        const detectedEmails = new Set<string>();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        results.data.forEach((row: any) => {
          if (Array.isArray(row)) {
            row.forEach((cell) => {
              if (typeof cell === "string" && emailRegex.test(cell.trim())) {
                detectedEmails.add(cell.trim());
              }
            });
          } else if (typeof row === "object" && row !== null) {
            Object.values(row).forEach((cell: any) => {
              if (typeof cell === "string" && emailRegex.test(cell.trim())) {
                detectedEmails.add(cell.trim());
              }
            });
          }
        });

        const list = Array.from(detectedEmails);
        setParsedRecipients(list);
        setRecipientsInput(list.join(", "));
        toast.success(`Detected ${list.length} recipient(s) from CSV`);
      },
      error: () => {
        toast.error("Failed to parse CSV file");
      },
    });
  };

  const getFinalRecipients = (): string[] => {
    const rawList = recipientsInput
      .split(/[\n,;]+/)
      .map((e) => e.trim())
      .filter((e) => e.length > 0 && e.includes("@"));

    return Array.from(new Set([...parsedRecipients, ...rawList]));
  };

  // Compute final scheduled date
  const computeScheduledDate = (): Date => {
    if (scheduleType === "now") {
      return new Date();
    }

    let h = parseInt(hourVal, 10) || 12;
    if (ampmVal === "PM" && h < 12) h += 12;
    if (ampmVal === "AM" && h === 12) h = 0;

    const m = parseInt(minuteVal, 10) || 0;
    const [year, month, day] = dateVal.split("-").map(Number);
    return new Date(year, month - 1, day, h, m, 0);
  };

  // Schedule mutation
  const scheduleMutation = useMutation({
    mutationFn: emailApi.scheduleEmails,
    // Optimistic update: add a pending email entry to cache immediately
    onMutate: (newPayload) => {
      const tempId = Date.now();
      const pendingEmail = {
        id: tempId,
        subject: newPayload.subject,
        body: newPayload.body,
        recipients: newPayload.recipients,
        senderId: newPayload.senderId,
        scheduledAt: newPayload.scheduledAt,
        status: "pending",
        createdAt: new Date().toISOString(),
      };
      // Update emails list optimistically
      queryClient.setQueryData(["emails"], (old: any) => {
        const existing = old?.pages ? old.pages.flat() : [];
        return { pages: [[pendingEmail, ...existing]], pageParams: [] };
      });
      // Show immediate feedback
      toast.success(`Email scheduled (pending) – ${newPayload.recipients.length} recipient(s)`);
    },
    onSuccess: (data) => {
      // Replace optimistic entry with real data
      queryClient.invalidateQueries({ queryKey: ["emails"] });
      queryClient.invalidateQueries({ queryKey: ["emails-stats-scheduled"] });
      queryClient.invalidateQueries({ queryKey: ["emails-stats-sent"] });
      toast.success(`Successfully queued ${data.count} email(s)!`);
      // Reset form & close
      setSubject("");
      setBody("");
      setRecipientsInput("");
      setParsedRecipients([]);
      setCsvFileName(null);
      onClose();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to schedule email");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const recipients = getFinalRecipients();

    if (!subject.trim()) {
      toast.error("Subject line is required");
      return;
    }
    if (!body.trim()) {
      toast.error("Email content is required");
      return;
    }
    if (recipients.length === 0) {
      toast.error("Please provide at least one recipient email");
      return;
    }
    if (!senderId) {
      toast.error("Please select a sender identity");
      return;
    }

    const scheduledDate = computeScheduledDate();
    const delayBetweenSendsMs = Math.max(0, parseFloat(delaySeconds || "0") * 1000);

    scheduleMutation.mutate({
      subject,
      body,
      recipients,
      senderId,
      scheduledAt: scheduledDate.toISOString(),
      delayBetweenSendsMs,
    });
  };

  const finalCount = getFinalRecipients().length;
  const computedDate = computeScheduledDate();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Compose & Schedule Campaign"
      description=""
      maxWidth="3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Sender & Timing Mode */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              From
            </label>
            <div className="flex gap-2">
              <select
                value={senderId}
                onChange={(e) => setSenderId(e.target.value)}
                className="w-full rounded-xl bg-surface border border-surfaceBorder px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {senders.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name ? `${s.name} (${s.address})` : s.address}
                  </option>
                ))}
              </select>
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={() => setIsAddingSender(!isAddingSender)}
                title="Add New Sender Identity"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Schedule Mode Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Dispatch Mode
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setScheduleType("later")}
                className={`py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
                  scheduleType === "later"
                    ? "bg-brand-600/30 border-brand-500 text-white shadow-sm"
                    : "bg-surface border-surfaceBorder text-slate-400 hover:text-white"
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                Schedule Later
              </button>
              <button
                type="button"
                onClick={() => setScheduleType("now")}
                className={`py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
                  scheduleType === "now"
                    ? "bg-accent-emerald/20 border-accent-emerald/50 text-accent-emerald shadow-sm"
                    : "bg-surface border-surfaceBorder text-slate-400 hover:text-white"
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                Send Immediately
              </button>
            </div>
          </div>
        </div>

        {/* Date & 12-Hour AM/PM Time Selector (Visible when 'later' is selected) */}
        {scheduleType === "later" && (
          <div className="p-4 rounded-2xl bg-[#0a0e1a] border border-surfaceBorder/80 space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Schedule Start Time
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              {/* Date Input */}
              <div className="sm:col-span-2">
                <label className="block text-[10px] uppercase font-semibold text-slate-400 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={dateVal}
                  onChange={(e) => setDateVal(e.target.value)}
                  className="w-full rounded-xl bg-surface border border-surfaceBorder px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {/* Hour & Minute */}
              <div>
                <label className="block text-[10px] uppercase font-semibold text-slate-400 mb-1">
                  Hour & Minute
                </label>
                <div className="flex items-center gap-1">
                  <select
                    value={hourVal}
                    onChange={(e) => setHourVal(e.target.value)}
                    className="w-1/2 rounded-xl bg-surface border border-surfaceBorder px-2 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
                  >
                    {[...Array(12)].map((_, i) => {
                      const val = (i + 1).toString().padStart(2, "0");
                      return (
                        <option key={val} value={val}>
                          {val}
                        </option>
                      );
                    })}
                  </select>
                  <span className="text-slate-400 font-bold">:</span>
                  <select
                    value={minuteVal}
                    onChange={(e) => setMinuteVal(e.target.value)}
                    className="w-1/2 rounded-xl bg-surface border border-surfaceBorder px-2 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
                  >
                    {["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"].map(
                      (m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>

              {/* AM / PM Toggle */}
              <div>
                <label className="block text-[10px] uppercase font-semibold text-slate-400 mb-1">
                  Period
                </label>
                <div className="grid grid-cols-2 gap-1 bg-surface rounded-xl p-1 border border-surfaceBorder">
                  <button
                    type="button"
                    onClick={() => setAmpmVal("AM")}
                    className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                      ampmVal === "AM"
                        ? "bg-brand-600 text-white shadow-sm"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    AM
                  </button>
                  <button
                    type="button"
                    onClick={() => setAmpmVal("PM")}
                    className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                      ampmVal === "PM"
                        ? "bg-brand-600 text-white shadow-sm"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    PM
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Inline Add Sender Form */}
        {isAddingSender && (
          <div className="p-4 rounded-xl bg-brand-950/40 border border-brand-500/30 space-y-3 animate-scaleUp">
            <h4 className="text-xs font-bold uppercase text-brand-300">Add New Sender Identity</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input
                placeholder="Sender Name (e.g. Sales Team)"
                value={newSenderName}
                onChange={(e) => setNewSenderName(e.target.value)}
              />
              <Input
                placeholder="sales@reachinbox.ai"
                type="email"
                value={newSenderEmail}
                onChange={(e) => setNewSenderEmail(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsAddingSender(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                isLoading={createSenderMutation.isPending}
                onClick={() =>
                  createSenderMutation.mutate({
                    address: newSenderEmail,
                    name: newSenderName || undefined,
                  })
                }
              >
                Save Identity
              </Button>
            </div>
          </div>
        )}

        {/* Recipients & CSV Parser */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Recipients
              </label>
              {finalCount > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-brand-500/20 text-brand-400 border border-brand-500/30">
                  ✓ {finalCount} email{finalCount === 1 ? "" : "s"} detected
                </span>
              )}
            </div>
            <label className="cursor-pointer inline-flex items-center gap-1.5 text-xs text-brand-400 hover:text-brand-300 font-medium bg-brand-500/10 px-2.5 py-1 rounded-lg border border-brand-500/20 hover:border-brand-500/40 transition-all">
              <Upload className="w-3.5 h-3.5" />
              <span>{csvFileName ? `CSV: ${csvFileName}` : "Upload Leads CSV / TXT"}</span>
              <input
                type="file"
                accept=".csv,.txt"
                className="hidden"
                onChange={handleFileUpload}
              />
            </label>
          </div>
          <textarea
            rows={2}
            value={recipientsInput}
            onChange={(e) => setRecipientsInput(e.target.value)}
            className="w-full rounded-xl bg-surface border border-surfaceBorder px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono text-xs"
          />
        </div>

        {/* Subject */}
        <Input
          label="Subject Line"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          leftIcon={<Mail className="w-4 h-4" />}
        />

        {/* Body Content */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
            Email Content
          </label>
          <textarea
            rows={4}
            placeholder="Hi there,\n\nI wanted to follow up on our recent conversation..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="w-full rounded-xl bg-surface border border-surfaceBorder px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {/* Delay & Rate Limiting Stagger Info */}
        <div className="p-3.5 rounded-xl bg-[#0e1424] border border-surfaceBorder grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <Input
            label="Delay Between Sends (Seconds)"
            type="number"
            min="0"
            step="0.5"
            value={delaySeconds}
            onChange={(e) => setDelaySeconds(e.target.value)}
            leftIcon={<Clock className="w-4 h-4 text-accent-cyan" />}

          />

          <Input
            label="Hourly Rate Limit Cap (Max/hr)"
            type="number"
            value={hourlyLimitPreview}
            onChange={(e) => setHourlyLimitPreview(e.target.value)}
            leftIcon={<AlertCircle className="w-4 h-4 text-accent-amber" />}

          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-surfaceBorder">
          <div className="text-xs text-slate-400">
            {finalCount > 0 && (
              <span className="inline-flex items-center gap-1.5 text-accent-emerald font-medium">
                <CheckCircle2 className="w-4 h-4" /> Ready to dispatch {finalCount} email
                {finalCount === 1 ? "" : "s"}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="gradient"
              leftIcon={<Send className="w-4 h-4" />}
            >
              {scheduleType === "now" ? "Send Now" : "Schedule Campaign"}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
