
import React, { useState } from "react";
import { format } from "date-fns";
import {
  Mail,
  User,
  Clock,
  Trash2,
  Eye,
  Inbox,
  Sparkles,
} from "lucide-react";
import { Email } from "../types/api";
import { Badge } from "./ui/Badge";
import { Skeleton } from "./ui/Skeleton";
import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";

interface EmailTableProps {
  emails: Email[];
  isLoading: boolean;
  onCancelEmail?: (emailId: string) => void;
  onDeleteEmail?: (emailId: string) => void;
  onOpenCompose?: () => void;
  isCancelPending?: boolean;
}

export const EmailTable: React.FC<EmailTableProps> = ({
  emails,
  isLoading,
  onCancelEmail,
  onDeleteEmail,
  onOpenCompose,
  isCancelPending,
}) => {
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="glass-panel rounded-2xl p-4 flex items-center justify-between gap-4"
          >
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-8 w-20" />
          </div>
        ))}
      </div>
    );
  }

  if (emails.length === 0) {
    return (
      <div className="glass-panel rounded-3xl p-12 text-center border border-white/5 space-y-4 my-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-500/10 text-brand-400 border border-brand-500/20 mb-2">
          <Inbox className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-slate-200">No emails found</h3>
        <p className="text-sm text-slate-400 max-w-sm mx-auto">
          You don&apos;t have any emails in this queue yet. Start a new campaign or schedule outreach.
        </p>
        {onOpenCompose && (
          <div className="pt-2">
            <Button
              variant="gradient"
              onClick={onOpenCompose}
              leftIcon={<Sparkles className="w-4 h-4" />}
            >
              Schedule an Email
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-2xl border border-surfaceBorder bg-surface/50 backdrop-blur-md">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-[#0e1424] text-xs uppercase tracking-wider text-slate-400 border-b border-surfaceBorder">
            <tr>
              <th className="px-6 py-4 font-semibold">Subject & Recipient</th>
              <th className="px-6 py-4 font-semibold">Sender</th>
              <th className="px-6 py-4 font-semibold">Scheduled For</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surfaceBorder/60">
            {emails.map((email) => {
              const senderAddress = email.sender?.address || "Unknown";
              const isPendingOrScheduled =
                email.status === "SCHEDULED" || email.status === "PENDING";

              return (
                <tr
                  key={email.id}
                  className="hover:bg-white/[0.02] transition-colors cursor-pointer"
                  onClick={() => setSelectedEmail(email)}
                >
                  {/* Subject & Recipient */}
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-100 truncate max-w-md">
                        {email.subject}
                      </span>
                      <span className="text-xs text-slate-400 flex items-center gap-1 mt-0.5 font-mono">
                        <User className="w-3 h-3 text-slate-500" />
                        {email.recipient}
                      </span>
                    </div>
                  </td>

                  {/* Sender */}
                  <td className="px-6 py-4 text-xs font-mono text-slate-300">
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-brand-400 shrink-0" />
                      <span className="truncate max-w-[160px]">{senderAddress}</span>
                    </div>
                  </td>

                  {/* Scheduled For / Sent At */}
                  <td className="px-6 py-4 text-xs text-slate-300 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>
                        {email.sentAt
                          ? `Sent ${format(new Date(email.sentAt), "MMM d, h:mm a")}`
                          : format(new Date(email.scheduledAt), "MMM d, h:mm a")}
                      </span>
                    </div>
                  </td>

                  {/* Status Badge */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge status={email.status} />
                  </td>

                  {/* Actions */}
                  <td
                    className="px-6 py-4 text-right whitespace-nowrap"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedEmail(email)}
                        title="View Details"
                      >
                        <Eye className="w-4 h-4 text-slate-400 hover:text-white" />
                      </Button>

                      {isPendingOrScheduled && onCancelEmail && (
                        <Button
                          variant="danger"
                          size="sm"
                          disabled={isCancelPending}
                          onClick={() => onCancelEmail(email.id)}
                          title="Cancel Scheduled Send"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                      {/* Delete button for sent emails */}
                      { (email.status === "SENT" || email.status === "CANCELLED") && onDeleteEmail && (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => onDeleteEmail(email.id)}
                          title="Delete Email"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Email Details Modal */}
      <Modal
        isOpen={!!selectedEmail}
        onClose={() => setSelectedEmail(null)}
        title="Email Job Details"
        description="Idempotent queue execution metadata & payload preview"
        maxWidth="2xl"
      >
        {selectedEmail && (
          <div className="space-y-4 text-sm text-slate-300">
            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-[#0e1424] border border-surfaceBorder text-xs">
              <div>
                <span className="text-slate-500 uppercase font-semibold block text-[10px]">
                  Recipient
                </span>
                <span className="font-mono text-slate-200">{selectedEmail.recipient}</span>
              </div>
              <div>
                <span className="text-slate-500 uppercase font-semibold block text-[10px]">
                  Sender
                </span>
                <span className="font-mono text-slate-200">
                  {selectedEmail.sender?.address || "N/A"}
                </span>
              </div>
              <div>
                <span className="text-slate-500 uppercase font-semibold block text-[10px]">
                  Status
                </span>
                <div className="mt-1">
                  <Badge status={selectedEmail.status} />
                </div>
              </div>
              <div>
                <span className="text-slate-500 uppercase font-semibold block text-[10px]">
                  Scheduled Time
                </span>
                <span className="text-slate-200">
                  {format(new Date(selectedEmail.scheduledAt), "PPpp")}
                </span>
              </div>
            </div>

            {/* Idempotency Key */}
            <div className="p-3 rounded-xl bg-[#0e1424] border border-surfaceBorder space-y-1">
              <span className="text-slate-500 uppercase font-semibold block text-[10px]">
                Idempotency Key (SHA-256)
              </span>
              <p className="font-mono text-[11px] text-brand-300 break-all">
                {selectedEmail.idempotencyKey}
              </p>
            </div>

            {/* Subject */}
            <div>
              <span className="text-slate-400 text-xs font-semibold uppercase block mb-1">
                Subject
              </span>
              <p className="text-base font-bold text-white">{selectedEmail.subject}</p>
            </div>

            {/* Body */}
            <div>
              <span className="text-slate-400 text-xs font-semibold uppercase block mb-1">
                Body Content
              </span>
              <div
                className="p-4 rounded-xl bg-[#0e1424] border border-surfaceBorder text-slate-200 text-sm whitespace-pre-wrap font-sans max-h-60 overflow-y-auto"
                dangerouslySetInnerHTML={{ __html: selectedEmail.body }}
              />
            </div>

            {selectedEmail.errorMessage && (
              selectedEmail.errorMessage.includes("http") ? (
                <div className="p-3.5 rounded-xl bg-accent-emerald/10 border border-accent-emerald/30 text-xs flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-accent-emerald font-semibold">
                    <Sparkles className="w-4 h-4 shrink-0" />
                    <span>Delivered via Ethereal SMTP</span>
                  </div>
                  <a
                    href={selectedEmail.errorMessage.replace(/^Preview:\s*/, "")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-accent-emerald text-slate-950 font-bold hover:bg-accent-emerald/90 transition-colors inline-flex items-center gap-1.5"
                  >
                    <span>View Test Inbox</span>
                    <Eye className="w-3.5 h-3.5" />
                  </a>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-accent-rose/10 border border-accent-rose/30 text-accent-rose text-xs">
                  <span className="font-bold block mb-0.5">Delivery Status / Error:</span>
                  {selectedEmail.errorMessage}
                </div>
              )
            )}
          </div>
        )}
      </Modal>
    </>
  );
};
