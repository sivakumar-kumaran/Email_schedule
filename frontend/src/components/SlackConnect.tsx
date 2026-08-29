import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { slackApi } from "../lib/api";
import { toast } from "sonner";
import { CheckCircle2, MessageSquare, Unlink } from "lucide-react";
import { Button } from "./ui/Button";

export const SlackConnect: React.FC = () => {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["slack-status"],
    queryFn: slackApi.getStatus,
  });

  const disconnectMutation = useMutation({
    mutationFn: slackApi.disconnect,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["slack-status"] });
      toast.success("Disconnected from Slack");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to disconnect Slack");
    },
  });

  const handleConnect = async () => {
    try {
      const url = await slackApi.getConnectUrl();
      window.location.href = url;
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to initiate Slack OAuth");
    }
  };

  if (isLoading) {
    return (
      <div className="h-9 w-28 bg-surfaceBorder/40 animate-pulse rounded-xl" />
    );
  }

  if (data?.connected) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#4A154B]/20 border border-[#4A154B]/40 text-[#E01E5A] text-xs font-medium">
        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
        <span className="text-slate-200 font-semibold truncate max-w-[120px]">
          {data.connection?.workspace || "Slack"}
        </span>
        <button
          onClick={() => disconnectMutation.mutate()}
          disabled={disconnectMutation.isPending}
          title="Disconnect Slack"
          className="ml-1 p-1 hover:bg-white/10 rounded text-slate-400 hover:text-rose-400 transition-colors"
        >
          <Unlink className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={handleConnect}
      className="bg-[#4A154B]/20 border-[#4A154B]/50 hover:bg-[#4A154B]/30 text-slate-200 hover:text-white"
      leftIcon={<MessageSquare className="w-3.5 h-3.5 text-[#E01E5A]" />}
    >
      Connect Slack
    </Button>
  );
};
