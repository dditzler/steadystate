import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Lead, Activity } from "@shared/schema";
import { PIPELINE_STAGES } from "@shared/schema";
import { useParams, Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  DoorOpen,
  MapPin,
  Monitor,
  Calendar,
  ArrowRight,
  MessageSquare,
  PhoneCall,
  Video,
  FileText,
  StickyNote,
  Presentation,
  Flame,
  ChevronUp,
  Minus,
  ChevronDown,
} from "lucide-react";

const priorityConfig: Record<string, { icon: typeof Flame; color: string; label: string }> = {
  hot: { icon: Flame, color: "text-red-500", label: "Hot" },
  high: { icon: ChevronUp, color: "text-orange-500", label: "High" },
  medium: { icon: Minus, color: "text-muted-foreground", label: "Medium" },
  low: { icon: ChevronDown, color: "text-muted-foreground/60", label: "Low" },
};

const activityIcons: Record<string, typeof Mail> = {
  email: Mail,
  call: PhoneCall,
  meeting: Video,
  note: StickyNote,
  demo: Presentation,
  proposal: FileText,
};

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

function formatMRR(cents: number | null) {
  if (!cents) return "—";
  return `$${(cents / 100).toLocaleString()}/mo`;
}

export default function LeadDetailPage() {
  const params = useParams<{ id: string }>();
  const leadId = Number(params.id);
  const [noteText, setNoteText] = useState("");

  const { data: lead, isLoading: leadLoading } = useQuery<Lead>({
    queryKey: ["/api/leads", leadId],
    queryFn: () => apiRequest("GET", `/api/leads/${leadId}`).then((r) => r.json()),
  });

  const { data: activities, isLoading: activitiesLoading } = useQuery<Activity[]>({
    queryKey: ["/api/leads", leadId, "activities"],
    queryFn: () => apiRequest("GET", `/api/leads/${leadId}/activities`).then((r) => r.json()),
  });

  const updateStageMutation = useMutation({
    mutationFn: (stage: string) =>
      apiRequest("PATCH", `/api/leads/${leadId}`, { stage }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads", leadId] });
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
    },
  });

  const addNoteMutation = useMutation({
    mutationFn: () =>
      apiRequest("POST", `/api/leads/${leadId}/activities`, {
        type: "note",
        description: noteText,
        date: new Date().toISOString().split("T")[0],
        createdBy: "You",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads", leadId, "activities"] });
      setNoteText("");
    },
  });

  if (leadLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Lead not found</p>
      </div>
    );
  }

  const pri = priorityConfig[lead.priority || "medium"];
  const PriIcon = pri.icon;
  const stageObj = PIPELINE_STAGES.find((s) => s.id === lead.stage);
  const sortedActivities = [...(activities || [])].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <ScrollArea className="h-full">
      <div className="p-4 max-w-4xl">
        {/* Back + Header */}
        <Link href="/leads" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3">
          <ArrowLeft className="w-3.5 h-3.5" />
          All Leads
        </Link>

        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-lg font-semibold" data-testid="text-lead-company">{lead.company}</h1>
              <PriIcon className={`w-4 h-4 ${pri.color}`} />
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <Badge variant="secondary" className={`text-xs ${stageBadge[lead.stage] || ""}`}>
                {stageObj?.label || lead.stage}
              </Badge>
              {lead.source && (
                <span className="text-xs text-muted-foreground">via {lead.source}</span>
              )}
            </div>
          </div>

          <Select value={lead.stage} onValueChange={(v) => updateStageMutation.mutate(v)}>
            <SelectTrigger className="w-[180px] h-8 text-sm" data-testid="select-stage-change">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PIPELINE_STAGES.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          <Card>
            <CardHeader className="p-3 pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Contact</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                <span>{lead.contactName}</span>
              </div>
              {lead.contactEmail && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                  <a href={`mailto:${lead.contactEmail}`} className="text-primary hover:underline">{lead.contactEmail}</a>
                </div>
              )}
              {lead.contactPhone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>{lead.contactPhone}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-3 pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Property Details</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <DoorOpen className="w-3.5 h-3.5 text-muted-foreground" />
                <span>{lead.doorCount || "?"} doors</span>
                <span className="text-muted-foreground">·</span>
                <span className="font-medium text-primary tabular-nums">{formatMRR(lead.estimatedValue)}</span>
              </div>
              {lead.region && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>{lead.region}</span>
                  {lead.zipCode && <span className="text-muted-foreground">({lead.zipCode})</span>}
                </div>
              )}
              {lead.pmSoftware && (
                <div className="flex items-center gap-2 text-sm">
                  <Monitor className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>{lead.pmSoftware}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Next Action */}
        {lead.nextAction && (
          <Card className="mb-4 border-primary/20 bg-primary/5">
            <CardContent className="p-3 flex items-center gap-2">
              <ArrowRight className="w-4 h-4 text-primary shrink-0" />
              <div>
                <span className="text-sm font-medium">{lead.nextAction}</span>
                {lead.nextActionDate && (
                  <span className="text-xs text-muted-foreground ml-2">
                    <Calendar className="w-3 h-3 inline mr-1" />
                    {lead.nextActionDate}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Notes */}
        {lead.notes && (
          <Card className="mb-4">
            <CardHeader className="p-3 pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Notes</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <p className="text-sm">{lead.notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Activity timeline */}
        <Card>
          <CardHeader className="p-3 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Activity</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            {/* Add note */}
            <div className="flex gap-2 mb-4">
              <Textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Add a note..."
                className="text-sm min-h-[60px] resize-none"
                data-testid="input-add-note"
              />
              <Button
                size="sm"
                onClick={() => addNoteMutation.mutate()}
                disabled={!noteText.trim() || addNoteMutation.isPending}
                data-testid="button-add-note"
              >
                Add
              </Button>
            </div>

            {activitiesLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : sortedActivities.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No activity yet</p>
            ) : (
              <div className="space-y-0">
                {sortedActivities.map((activity, idx) => {
                  const Icon = activityIcons[activity.type] || MessageSquare;
                  return (
                    <div key={activity.id} className="flex gap-3 pb-4 last:pb-0" data-testid={`activity-${activity.id}`}>
                      <div className="flex flex-col items-center">
                        <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                          <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                        </div>
                        {idx < sortedActivities.length - 1 && (
                          <div className="w-px flex-1 bg-border mt-1" />
                        )}
                      </div>
                      <div className="pt-0.5 min-w-0">
                        <p className="text-sm">{activity.description}</p>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                          <span>{activity.date}</span>
                          {activity.createdBy && <span>· {activity.createdBy}</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  );
}
