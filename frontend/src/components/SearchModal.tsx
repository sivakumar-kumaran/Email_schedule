import React, { useState, useEffect } from "react";
import { Search, Loader2, Mail, User, Clock, AlertCircle } from "lucide-react";
import { Modal } from "./ui/Modal";
import { emailApi } from "../lib/api";
import { Badge } from "./ui/Badge";
import { format } from "date-fns";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [searchSource, setSearchSource] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const data = await emailApi.searchEmails(query);
        setResults(data.results || []);
        setSearchSource(data.source);
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Search Emails"
      description="Instant full-text search across subjects, recipients, and content via Elasticsearch"
      maxWidth="2xl"
    >
      <div className="space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search keywords, email addresses, subjects..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full pl-10 pr-10 py-3 rounded-xl bg-surface border border-surfaceBorder text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
          />
          {isLoading && (
            <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-400 animate-spin" />
          )}
        </div>

        {/* Results Metadata */}
        {results.length > 0 && (
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>Found {results.length} results</span>
            <span className="bg-white/5 px-2 py-0.5 rounded text-[11px] font-mono">
              Engine: {searchSource}
            </span>
          </div>
        )}

        {/* Results List */}
        <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
          {results.map((item, idx) => {
            const senderAddress =
              typeof item.sender === "string"
                ? item.sender
                : item.sender?.address || "Unknown";

            return (
              <div
                key={item.id || item.emailId || idx}
                className="p-3.5 rounded-xl bg-[#141c2e]/60 border border-surfaceBorder hover:border-brand-500/40 transition-all text-sm space-y-1.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-semibold text-slate-100 truncate flex-1">
                    {item.subject}
                  </span>
                  <Badge status={item.status} size="sm" />
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <div className="flex items-center gap-1 truncate">
                    <User className="w-3.5 h-3.5 text-slate-500" />
                    <span>To: {item.recipient}</span>
                  </div>
                  <div className="flex items-center gap-1 truncate">
                    <Mail className="w-3.5 h-3.5 text-slate-500" />
                    <span>From: {senderAddress}</span>
                  </div>
                  <div className="flex items-center gap-1 ml-auto shrink-0">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>
                      {item.scheduledAt
                        ? format(new Date(item.scheduledAt), "MMM d, h:mm a")
                        : "N/A"}
                    </span>
                  </div>
                </div>

                {item.body && (
                  <p className="text-xs text-slate-400 line-clamp-2 pt-1 border-t border-surfaceBorder/40">
                    {item.body.replace(/<[^>]*>?/gm, "")}
                  </p>
                )}
              </div>
            );
          })}

          {!isLoading && query && results.length === 0 && (
            <div className="text-center py-10 text-slate-500 text-sm">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-600" />
              No matching emails found for &quot;{query}&quot;
            </div>
          )}

          {!query && (
            <div className="text-center py-8 text-slate-500 text-xs">
              Type keywords above to search all indexed emails.
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
