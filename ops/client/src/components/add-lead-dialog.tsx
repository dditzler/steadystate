import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { InsertLead } from "@shared/schema";
import { PIPELINE_STAGES, LEAD_SOURCES } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Sparkles, ArrowRight, Loader2 } from "lucide-react";

// ── Parser ──────────────────────────────────────────────────────────────────

const PM_SOFTWARE = [
  "AppFolio", "Buildium", "Rent Manager", "Yardi", "RentRedi",
  "TenantCloud", "Propertyware", "Spreadsheets",
];

function parseLeadText(raw: string): Partial<InsertLead> {
  const text = raw;
  const lower = raw.toLowerCase();
  const result: Partial<InsertLead> = {};

  // Email
  const emailMatch = text.match(/\b[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}\b/);
  if (emailMatch) result.contactEmail = emailMatch[0];

  // Phone
  const phoneMatch = text.match(/\(?\d{3}\)?[\s.\-]\d{3}[\s.\-]\d{4}/);
  if (phoneMatch) result.contactPhone = phoneMatch[0];

  // Door count
  const doorMatch = text.match(/(\d+)\s*\+?\s*(doors?|units?|properties|rentals?|homes?|apartments?)/i);
  if (doorMatch) result.doorCount = parseInt(doorMatch[1], 10);

  // City, State
  const cityStateMatch = text.match(/\b([A-Z][a-zA-Z\s]+),\s*([A-Z]{2})\b/);
  if (cityStateMatch) result.region = cityStateMatch[0];

  // PM software
  for (const sw of PM_SOFTWARE) {
    if (lower.includes(sw.toLowerCase())) {
      result.pmSoftware = sw;
      break;
    }
  }

  // Estimated MRR
  const mrrMatch = text.match(/\$\s?([\d,]+)(?:\s*\/\s*mo(?:nth)?)?/i);
  if (mrrMatch) {
    const num = parseInt(mrrMatch[1].replace(/,/g, ""), 10);
    if (num < 50000) result.estimatedValue = num * 100;
  }

  // Stage keywords
  const stageKeywords: Record<string, string> = {
    won: "won", closed: "won", lost: "lost", churned: "lost",
    negotiat: "negotiation", proposal: "proposal", "demo complete": "demo_done",
    "demo done": "demo_done", "demo scheduled": "demo_scheduled",
    contacted: "contacted", "follow.?up": "contacted",
  };
  for (const [kw, stage] of Object.entries(stageKeywords)) {
    if (new RegExp(kw, "i").test(text)) {
      result.stage = stage;
      break;
    }
  }

  // Priority
  if (/\bhot\b/i.test(text)) result.priority = "hot";
  else if (/\bhigh\b/i.test(text)) result.priority = "high";
  else if (/\blow\b/i.test(text)) result.priority = "low";

  // Contact name
  const nameLabelMatch = text.match(
    /(?:name|contact|person|rep|owner|manager)\s*[:\-]\s*([A-Z][a-z]+(?:\s[A-Z][a-z]+)+)/i
  );
  if (nameLabelMatch) {
    result.contactName = nameLabelMatch[1].trim();
  } else {
    const nameMatch = text.match(/\b([A-Z][a-z]{1,14})\s+([A-Z][a-z]{1,14})\b/);
    if (nameMatch) {
      const candidate = `${nameMatch[1]} ${nameMatch[2]}`;
      if (!result.region?.startsWith(candidate)) {
        result.contactName = candidate;
      }
    }
  }

  // Company name
  const companyLabelMatch = text.match(
    /(?:company|firm|org(?:anization)?|business|group|mgmt|management co\.?)\s*[:\-]\s*([^\n,]+)/i
  );
  if (companyLabelMatch) {
    result.company = companyLabelMatch[1].trim();
  } else {
    const lines = text
      .split(/\n/)
      .map((l) => l.trim())
      .filter(
        (l) =>
          l.length > 2 &&
          l.length < 80 &&
          !l.includes("@") &&
          !/^\(?\d/.test(l) &&
          !/^https?:\/\//i.test(l)
      );
    if (lines.length) result.company = lines[0];
  }

  // Source
  if (/linkedin/i.test(text)) result.source = "LinkedIn Outreach";
  else if (/referral|referred/i.test(text)) result.source = "Referral";
  else if (/email/i.test(text)) result.source = "Cold Email";
  else if (/trade\s*show|conference|expo/i.test(text)) result.source = "Trade Show";
  else if (/webinar/i.test(text)) result.source = "Webinar";
  else result.source = "Other";

  // Notes
  const noteLines = text
    .split(/\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 10 && !l.includes("@") && !/^\(?\d{3}\)?/.test(l));
  if (noteLines.length) result.notes = noteLines.slice(0, 4).join(" | ");

  return result;
}

// ── Form fields helper ───────────────────────────────────────────────────────

type LeadForm = {
  company: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  doorCount: string;
  region: string;
  pmSoftware: string;
  source: string;
  stage: string;
  priority: string;
  estimatedValue: string;
  notes: string;
};

const EMPTY_FORM: LeadForm = {
  company: "",
  contactName: "",
  contactEmail: "",
  contactPhone: "",
  doorCount: "",
  region: "",
  pmSoftware: "",
  source: "Other",
  stage: "lead",
  priority: "medium",
  estimatedValue: "",
  notes: "",
};

function parsedToForm(parsed: Partial<InsertLead>): LeadForm {
  return {
    company: parsed.company || "",
    contactName: parsed.contactName || "",
    contactEmail: parsed.contactEmail || "",
    contactPhone: parsed.contactPhone || "",
    doorCount: parsed.doorCount != null ? String(parsed.doorCount) : "",
    region: parsed.region || "",
    pmSoftware: parsed.pmSoftware || "",
    source: parsed.source || "Other",
    stage: parsed.stage || "lead",
    priority: parsed.priority || "medium",
    estimatedValue:
      parsed.estimatedValue != null
        ? String(Math.round(parsed.estimatedValue / 100))
        : "",
    notes: parsed.notes || "",
  };
}

function formToPayload(form: LeadForm): InsertLead {
  return {
    company: form.company || "Unknown",
    contactName: form.contactName || "Unknown",
    contactEmail: form.contactEmail || null,
    contactPhone: form.contactPhone || null,
    doorCount: form.doorCount ? parseInt(form.doorCount, 10) : null,
    region: form.region || null,
    pmSoftware: form.pmSoftware || null,
    source: form.source || null,
    stage: form.stage || "lead",
    priority: form.priority || "medium",
    estimatedValue: form.estimatedValue
      ? Math.round(parseFloat(form.estimatedValue) * 100)
      : null,
    notes: form.notes || null,
    assignedTo: null,
    nextAction: null,
    nextActionDate: null,
    lastContactDate: null,
    tags: null,
    zipCode: null,
    lostReason: null,
  };
}

// ── Component ────────────────────────────────────────────────────────────────

type Step = "paste" | "review";

export function AddLeadDialog() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("paste");
  const [rawText, setRawText] = useState("");
  const [form, setForm] = useState<LeadForm>(EMPTY_FORM);

  const createMutation = useMutation({
    mutationFn: async (payload: InsertLead) => {
      const res = await apiRequest("POST", "/api/leads", payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      handleClose();
    },
  });

  function handleClose() {
    setOpen(false);
    setStep("paste");
    setRawText("");
    setForm(EMPTY_FORM);
    createMutation.reset();
  }

  function handleParse() {
    const parsed = parseLeadText(rawText);
    setForm(parsedToForm(parsed));
    setStep("review");
  }

  function handleSkip() {
    setForm(EMPTY_FORM);
    setStep("review");
  }

  function setField(field: keyof LeadForm, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleSave() {
    createMutation.mutate(formToPayload(form));
  }

  return (
    <>
      <Button
        size="sm"
        className="h-8 gap-1.5"
        onClick={() => setOpen(true)}
        data-testid="btn-add-lead"
      >
        <Plus className="w-3.5 h-3.5" />
        Add Lead
      </Button>

      <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {step === "paste" ? (
                <>
                  <Sparkles className="w-4 h-4 text-primary" />
                  Paste &amp; Parse Lead Info
                </>
              ) : (
                <>
                  <ArrowRight className="w-4 h-4 text-primary" />
                  Review &amp; Save Lead
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          {step === "paste" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Paste anything — an email, LinkedIn profile, business card text,
                call notes, or a plain paragraph. We'll extract what we can and
                let you fill in the rest.
              </p>
              <Textarea
                className="min-h-[220px] font-mono text-sm resize-y"
                placeholder={`Examples of things you can paste:

"Hi, I'm Sarah Chen with Greenfield Property Group. We manage 85 doors in Austin, TX using AppFolio. sarah@greenfieldpg.com · (512) 555-0192"

--- or ---

Pacific Crest Management
Owner: Mark Williams
180 units across Portland, OR
Currently on Buildium
mark@pacificcrest.com`}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                autoFocus
              />
              <DialogFooter className="gap-2 sm:gap-2">
                <Button variant="ghost" size="sm" onClick={handleSkip}>
                  Skip — enter manually
                </Button>
                <Button
                  size="sm"
                  onClick={handleParse}
                  disabled={!rawText.trim()}
                  className="gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Parse Text
                </Button>
              </DialogFooter>
            </div>
          )}

          {step === "review" && (
            <div className="space-y-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  Contact
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="al-company" className="text-xs">Company *</Label>
                    <Input
                      id="al-company"
                      className="h-8 text-sm"
                      value={form.company}
                      onChange={(e) => setField("company", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="al-contactName" className="text-xs">Contact Name *</Label>
                    <Input
                      id="al-contactName"
                      className="h-8 text-sm"
                      value={form.contactName}
                      onChange={(e) => setField("contactName", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="al-email" className="text-xs">Email</Label>
                    <Input
                      id="al-email"
                      type="email"
                      className="h-8 text-sm"
                      value={form.contactEmail}
                      onChange={(e) => setField("contactEmail", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="al-phone" className="text-xs">Phone</Label>
                    <Input
                      id="al-phone"
                      type="tel"
                      className="h-8 text-sm"
                      value={form.contactPhone}
                      onChange={(e) => setField("contactPhone", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  Portfolio
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="al-doors" className="text-xs">Door Count</Label>
                    <Input
                      id="al-doors"
                      type="number"
                      className="h-8 text-sm"
                      placeholder="e.g. 85"
                      value={form.doorCount}
                      onChange={(e) => setField("doorCount", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="al-region" className="text-xs">Region</Label>
                    <Input
                      id="al-region"
                      className="h-8 text-sm"
                      placeholder="City, ST"
                      value={form.region}
                      onChange={(e) => setField("region", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="al-software" className="text-xs">PM Software</Label>
                    <Input
                      id="al-software"
                      className="h-8 text-sm"
                      placeholder="AppFolio, Buildium…"
                      value={form.pmSoftware}
                      onChange={(e) => setField("pmSoftware", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="al-mrr" className="text-xs">Est. MRR ($)</Label>
                    <Input
                      id="al-mrr"
                      type="number"
                      className="h-8 text-sm"
                      placeholder="e.g. 595"
                      value={form.estimatedValue}
                      onChange={(e) => setField("estimatedValue", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  Pipeline
                </p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Stage</Label>
                    <Select value={form.stage} onValueChange={(v) => setField("stage", v)}>
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PIPELINE_STAGES.map((s) => (
                          <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Priority</Label>
                    <Select value={form.priority} onValueChange={(v) => setField("priority", v)}>
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hot">🔥 Hot</SelectItem>
                        <SelectItem value="high">↑ High</SelectItem>
                        <SelectItem value="medium">— Medium</SelectItem>
                        <SelectItem value="low">↓ Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Source</Label>
                    <Select value={form.source} onValueChange={(v) => setField("source", v)}>
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LEAD_SOURCES.map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="al-notes" className="text-xs">Notes</Label>
                <Textarea
                  id="al-notes"
                  className="text-sm resize-none"
                  rows={3}
                  value={form.notes}
                  onChange={(e) => setField("notes", e.target.value)}
                />
              </div>

              {createMutation.isError && (
                <p className="text-sm text-destructive">
                  {(createMutation.error as Error)?.message || "Failed to save lead."}
                </p>
              )}

              <DialogFooter className="gap-2 sm:gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStep("paste")}
                  disabled={createMutation.isPending}
                >
                  \u2190 Back
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={createMutation.isPending || !form.company.trim()}
                  className="gap-1.5"
                >
                  {createMutation.isPending && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  )}
                  Save Lead
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
