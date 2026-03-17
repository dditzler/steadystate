import { useQuery } from "@tanstack/react-query";
import type { Lead } from "@shared/schema";
import { PIPELINE_STAGES, LEAD_SOURCES } from "@shared/schema";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";
import {
  Search,
  Building2,
  Flame,
  ChevronUp,
  Minus,
  ChevronDown,
  ArrowUpDown,
} from "lucide-react";

const stageBadge: Record<string, string> = {
  lead: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  contacted: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  demo_scheduled: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  demo_done: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
  proposal: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  negotiation: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  won: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  lost: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
};

const priorityIcon: Record<string, { icon: typeof Flame; color: string }> = {
  hot: { icon: Flame, color: "text-red-500" },
  high: { icon: ChevronUp, color: "text-orange-500" },
  medium: { icon: Minus, color: "text-muted-foreground" },
  low: { icon: ChevronDown, color: "text-muted-foreground/60" },
};

function formatMRR(cents: number | null) {
  if (!cents) return "—";
  return `$${(cents / 100).toLocaleString()}`;
}

export default function LeadsPage() {
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");

  const { data: leads, isLoading } = useQuery<Lead[]>({
    queryKey: ["/api/leads"],
  });

  const filtered = (leads || []).filter((lead) => {
    const matchSearch =
      !search ||
      lead.company.toLowerCase().includes(search.toLowerCase()) ||
      lead.contactName.toLowerCase().includes(search.toLowerCase()) ||
      (lead.region || "").toLowerCase().includes(search.toLowerCase()) ||
      (lead.zipCode || "").includes(search);
    const matchStage = stageFilter === "all" || lead.stage === stageFilter;
    const matchSource = sourceFilter === "all" || lead.source === sourceFilter;
    return matchSearch && matchStage && matchSource;
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 pb-3 border-b border-border/60">
        <h1 className="text-lg font-semibold mb-3" data-testid="text-page-title">All Leads</h1>
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search company, contact, region, zip..."
              className="pl-8 h-9 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              data-testid="input-search-leads"
            />
          </div>
          <Select value={stageFilter} onValueChange={setStageFilter}>
            <SelectTrigger className="w-[160px] h-9 text-sm" data-testid="select-stage-filter">
              <SelectValue placeholder="Stage" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stages</SelectItem>
              {PIPELINE_STAGES.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger className="w-[180px] h-9 text-sm" data-testid="select-source-filter">
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              {LEAD_SOURCES.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <Table>
          <TableHeader>
            <TableRow className="text-xs">
              <TableHead className="w-[200px]">Company</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead className="text-center">Doors</TableHead>
              <TableHead>Region</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead className="text-center">Priority</TableHead>
              <TableHead>Software</TableHead>
              <TableHead className="text-right">Est. MRR</TableHead>
              <TableHead>Next Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((lead) => {
              const pri = priorityIcon[lead.priority || "medium"];
              const PriIcon = pri.icon;
              const stageObj = PIPELINE_STAGES.find((s) => s.id === lead.stage);
              return (
                <TableRow key={lead.id} className="cursor-pointer hover:bg-muted/40" data-testid={`row-lead-${lead.id}`}>
                  <TableCell>
                    <Link href={`/leads/${lead.id}`} className="flex items-center gap-1.5 text-sm font-medium hover:text-primary">
                      <Building2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      {lead.company}
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm">{lead.contactName}</TableCell>
                  <TableCell className="text-center tabular-nums text-sm">{lead.doorCount || "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{lead.region || "—"}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={`text-xs ${stageBadge[lead.stage] || ""}`}>
                      {stageObj?.label || lead.stage}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <PriIcon className={`w-4 h-4 mx-auto ${pri.color}`} />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{lead.pmSoftware || "—"}</TableCell>
                  <TableCell className="text-right tabular-nums text-sm font-medium">{formatMRR(lead.estimatedValue)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{lead.nextAction || "—"}</TableCell>
                </TableRow>
              );
            })}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-sm text-muted-foreground py-12">
                  No leads match your filters
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );
}
