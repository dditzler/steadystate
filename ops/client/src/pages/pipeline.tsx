import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Lead } from "@shared/schema";
import { PIPELINE_STAGES } from "@shared/schema";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Building2,
  User,
  DoorOpen,
  ArrowRight,
  Flame,
  ChevronUp,
  Minus,
  ChevronDown,
} from "lucide-react";
import { AddLeadDialog } from "@/components/add-lead-dialog";

const priorityConfig: Record<string, { icon: typeof Flame; color: string; label: string }> = {
  hot: { icon: Flame, color: "text-red-500", label: "Hot" },
  high: { icon: ChevronUp, color: "text-orange-500", label: "High" },
  medium: { icon: Minus, color: "text-muted-foreground", label: "Med" },
  low: { icon: ChevronDown, color: "text-muted-foreground/60", label: "Low" },
};

const stageColorMap: Record<string, string> = {
  lead: "bg-slate-100 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700",
  contacted: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
  demo_scheduled: "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800",
  demo_done: "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800",
  proposal: "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800",
  negotiation: "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800",
  won: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800",
  lost: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800",
};

function formatMRR(cents: number | null) {
  if (!cents) return "\u2014";
  return `$${(cents / 100).toLocaleString()}/mo`;
}

function LeadCard({ lead }: { lead: Lead }) {
  const pri = priorityConfig[lead.priority || "medium"];
  const PriIcon = pri.icon;

  return (
    <Link href={`/leads/${lead.id}`}>
      <Card
        className="p-3 cursor-pointer hover:shadow-md transition-shadow border border-border/60"
        data-testid={`card-lead-${lead.id}`}
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <Building2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <span className="text-sm font-medium truncate">{lead.company}</span>
          </div>
          <PriIcon className={`w-3.5 h-3.5 shrink-0 ${pri.color}`} />
        </div>

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5">
          <User className="w-3 h-3" />
          <span className="truncate">{lead.contactName}</span>
        </div>

        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1 text-muted-foreground">
            <DoorOpen className="w-3 h-3" />
            <span>{lead.doorCount || "?"} doors</span>
          </div>
          <span className="font-medium tabular-nums text-primary">
            {formatMRR(lead.estimatedValue)}
          </span>
        </div>

        {lead.nextAction && (
          <div className="mt-2 pt-2 border-t border-border/40">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <ArrowRight className="w-3 h-3 shrink-0" />
              <span className="truncate">{lead.nextAction}</span>
            </div>
          </div>
        )}
      </Card>
    </Link>
  );
}

function PipelineColumn({ stage, leads }: { stage: typeof PIPELINE_STAGES[number]; leads: Lead[] }) {
  const stageLeads = leads.filter((l) => l.stage === stage.id);
  const totalValue = stageLeads.reduce((sum, l) => sum + (l.estimatedValue || 0), 0);

  return (
    <div className="flex flex-col min-w-[260px] max-w-[300px] flex-1" data-testid={`column-${stage.id}`}>
      <div className={`rounded-lg border p-3 mb-2 ${stageColorMap[stage.id] || ""}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">{stage.label}</span>
            <Badge variant="secondary" className="text-xs px-1.5 py-0 h-5 tabular-nums">
              {stageLeads.length}
            </Badge>
          </div>
          <span className="text-xs font-medium tabular-nums text-muted-foreground">
            {formatMRR(totalValue)}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2 flex-1">
        {stageLeads.map((lead) => (
          <LeadCard key={lead.id} lead={lead} />
        ))}
        {stageLeads.length === 0 && (
          <div className="text-xs text-muted-foreground text-center py-8 border border-dashed rounded-lg">
            No leads
          </div>
        )}
      </div>
    </div>
  );
}

export default function PipelinePage() {
  const { data: leads, isLoading } = useQuery<Lead[]>({
    queryKey: ["/api/leads"],
  });

  const activeStages = PIPELINE_STAGES.filter((s) => s.id !== "won" && s.id !== "lost");
  const closedStages = PIPELINE_STAGES.filter((s) => s.id === "won" || s.id === "lost");
  const allLeads = leads || [];

  const totalPipeline = allLeads
    .filter((l) => l.stage !== "won" && l.stage !== "lost")
    .reduce((sum, l) => sum + (l.estimatedValue || 0), 0);
  const wonDeals = allLeads.filter((l) => l.stage === "won");
  const wonValue = wonDeals.reduce((sum, l) => sum + (l.estimatedValue || 0), 0);
  const hotLeads = allLeads.filter((l) => l.priority === "hot" && l.stage !== "won" && l.stage !== "lost");

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-64 w-64" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 pb-3 border-b border-border/60">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg font-semibold" data-testid="text-page-title">Sales Pipeline</h1>
          <AddLeadDialog />
        </div>
        <div className="flex gap-4 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted/50">
            <span className="text-xs text-muted-foreground">Pipeline</span>
            <span className="text-sm font-semibold tabular-nums">{formatMRR(totalPipeline)}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-emerald-50 dark:bg-emerald-900/20">
            <span className="text-xs text-muted-foreground">Won</span>
            <span className="text-sm font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
              {formatMRR(wonValue)}
            </span>
            <Badge variant="secondary" className="text-xs px-1.5 py-0 h-5">{wonDeals.length}</Badge>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-red-50 dark:bg-red-900/20">
            <Flame className="w-3.5 h-3.5 text-red-500" />
            <span className="text-xs text-muted-foreground">Hot</span>
            <span className="text-sm font-semibold tabular-nums">{hotLeads.length}</span>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1" orientation="horizontal">
        <div className="flex gap-3 p-4 min-w-max">
          {activeStages.map((stage) => (
            <PipelineColumn key={stage.id} stage={stage} leads={allLeads} />
          ))}
          <div className="w-px bg-border/60 mx-1 self-stretch" />
          {closedStages.map((stage) => (
            <PipelineColumn key={stage.id} stage={stage} leads={allLeads} />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
