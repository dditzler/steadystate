import { useState, useCallback, useRef, useMemo } from "react";
import Papa from "papaparse";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Loader2,
  Building2,
  X,
  Info,
} from "lucide-react";

type DetectedSource = "appfolio" | "buildium" | "rentmanager" | "other" | null;

interface FieldMapping {
  steadyStateField: string;
  csvColumn: string;
  required: boolean;
  preview: string;
}

interface ParsedProperty {
  name: string;
  address: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  zip?: string;
  unitName?: string;
  type?: string;
  bedrooms?: number;
  bathrooms?: number;
  unitCount?: number;
}

const STEADY_STATE_FIELDS = [
  { key: "name", label: "Property Name", required: true },
  { key: "address", label: "Street Address", required: true },
  { key: "addressLine2", label: "Address Line 2", required: false },
  { key: "city", label: "City", required: false },
  { key: "state", label: "State", required: false },
  { key: "zip", label: "Zip Code", required: false },
  { key: "unitName", label: "Unit Name/Number", required: false },
  { key: "type", label: "Property Type", required: false },
  { key: "bedrooms", label: "Bedrooms", required: false },
  { key: "bathrooms", label: "Bathrooms", required: false },
];

const APPFOLIO_MAP: Record<string, string[]> = {
  name: ["property name", "property"],
  address: ["unit street address 1", "property street address 1"],
  addressLine2: ["unit street address 2", "property street address 2"],
  city: ["unit city", "property city"],
  state: ["unit state", "property state"],
  zip: ["unit zip", "property zip"],
  unitName: ["unit name"],
  type: ["unit type"],
  bedrooms: ["bedrooms"],
  bathrooms: ["bathrooms"],
};

const BUILDIUM_MAP: Record<string, string[]> = {
  name: ["name"],
  address: ["address line 1"],
  addressLine2: ["address line 2"],
  city: ["city"],
  state: ["state"],
  zip: ["zipcode", "zip code"],
  unitName: [],
  type: ["propertytype", "property type", "rentaltype", "rental type"],
  bedrooms: [],
  bathrooms: [],
};

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase();
}

function detectSource(headers: string[]): { source: DetectedSource; confidence: number } {
  const normalized = headers.map(normalizeHeader);

  // AppFolio markers
  const appfolioMarkers = [
    "unit street address 1", "unit street address 2",
    "unit city", "unit state", "unit zip",
    "property id", "unit type", "unit name",
  ];
  const appfolioHits = appfolioMarkers.filter((m) => normalized.includes(m)).length;

  // Buildium markers
  const buildiumMarkers = [
    "abbreviation", "numberofunits", "number of units",
    "propertytype", "property type", "rentaltype", "rental type",
    "yearbuilt", "year built", "operatingbankaccount",
  ];
  const buildiumHits = buildiumMarkers.filter((m) => normalized.includes(m)).length;

  if (appfolioHits >= 2) return { source: "appfolio", confidence: Math.min(100, appfolioHits * 15 + 10) };
  if (buildiumHits >= 2) return { source: "buildium", confidence: Math.min(100, buildiumHits * 15 + 10) };

  return { source: null, confidence: 0 };
}

function autoMap(headers: string[], source: DetectedSource): Record<string, string> {
  const normalized = headers.map(normalizeHeader);
  const mapping: Record<string, string> = {};

  const mapRef = source === "appfolio" ? APPFOLIO_MAP : source === "buildium" ? BUILDIUM_MAP : null;

  if (mapRef) {
    for (const [field, candidates] of Object.entries(mapRef)) {
      for (const candidate of candidates) {
        const idx = normalized.indexOf(candidate);
        if (idx !== -1) {
          mapping[field] = headers[idx];
          break;
        }
      }
    }
  } else {
    // Best-guess for "other"
    const guessMap: Record<string, string[]> = {
      name: ["property name", "property", "name", "building name", "building"],
      address: ["address", "street address", "address line 1", "street", "address1"],
      addressLine2: ["address line 2", "address2", "suite", "apt"],
      city: ["city", "town"],
      state: ["state", "st"],
      zip: ["zip", "zip code", "zipcode", "postal code", "postal"],
      unitName: ["unit", "unit name", "unit number", "unit #", "unit no"],
      type: ["type", "property type", "unit type", "category"],
      bedrooms: ["bedrooms", "beds", "br"],
      bathrooms: ["bathrooms", "baths", "ba"],
    };
    for (const [field, candidates] of Object.entries(guessMap)) {
      for (const candidate of candidates) {
        const idx = normalized.indexOf(candidate);
        if (idx !== -1) {
          mapping[field] = headers[idx];
          break;
        }
      }
    }
  }

  return mapping;
}

// ---- Step Components ----

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-2 py-3" data-testid="step-indicator">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`w-2 h-2 rounded-full transition-all duration-300 ${
            i < current
              ? "bg-primary"
              : i === current
              ? "bg-primary w-6"
              : "bg-muted-foreground/30"
          }`}
        />
      ))}
      <span className="ml-2 text-xs text-muted-foreground">
        Step {current + 1} of {total}
      </span>
    </div>
  );
}

// ---- STEP 1: Upload CSV ----
function UploadStep({
  onFileLoaded,
}: {
  onFileLoaded: (file: File, data: string[][], headers: string[]) => void;
}) {
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const parseFile = useCallback(
    (file: File) => {
      setError(null);
      setLoading(true);

      if (!file.name.endsWith(".csv") && !file.name.endsWith(".xlsx")) {
        setError("Please upload a .csv or .xlsx file");
        setLoading(false);
        return;
      }

      Papa.parse(file, {
        skipEmptyLines: true,
        complete: (results) => {
          setLoading(false);
          const allRows = results.data as string[][];
          if (allRows.length < 2) {
            setError("File appears empty or has only headers");
            return;
          }
          const headers = allRows[0];
          const data = allRows.slice(1);
          onFileLoaded(file, data, headers);
        },
        error: () => {
          setLoading(false);
          setError("Failed to parse file. Please try a .csv file.");
        },
      });
    },
    [onFileLoaded]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) parseFile(file);
    },
    [parseFile]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) parseFile(file);
    },
    [parseFile]
  );

  return (
    <div className="flex flex-col items-center justify-center flex-1 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-3">
            <FileSpreadsheet className="w-7 h-7 text-primary" />
          </div>
          <h2 className="text-lg font-bold" data-testid="upload-heading">
            Upload Your Property List
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Import from AppFolio, Buildium, or any CSV export
          </p>
        </div>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
            dragging
              ? "border-primary bg-primary/5 scale-[1.02]"
              : "border-border hover:border-primary/50 hover:bg-muted/30"
          }`}
          data-testid="drop-zone"
        >
          {loading ? (
            <Loader2 className="w-10 h-10 mx-auto text-primary animate-spin" />
          ) : (
            <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
          )}
          <p className="text-sm font-medium mt-2">
            {loading ? "Parsing file..." : "Drag & drop your CSV here"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            or tap to browse files
          </p>
          <input
            ref={inputRef}
            type="file"
            accept=".csv,.xlsx"
            className="hidden"
            onChange={handleFileChange}
            data-testid="file-input"
          />
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 text-destructive text-sm bg-destructive/10 rounded-lg px-3 py-2" data-testid="upload-error">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <p className="text-xs text-muted-foreground text-center mt-4">
          Supports .csv files. Export your property list from your current management software.
        </p>
      </div>
    </div>
  );
}

// ---- STEP 2: Detect Source ----
function DetectStep({
  headers,
  detectedSource,
  confidence,
  selectedSource,
  onSelectSource,
  onNext,
  onBack,
  rowCount,
  colCount,
  fileName,
}: {
  headers: string[];
  detectedSource: DetectedSource;
  confidence: number;
  selectedSource: DetectedSource;
  onSelectSource: (s: DetectedSource) => void;
  onNext: () => void;
  onBack: () => void;
  rowCount: number;
  colCount: number;
  fileName: string;
}) {
  const sourceLabels: Record<string, string> = {
    appfolio: "AppFolio",
    buildium: "Buildium",
    rentmanager: "Rent Manager",
    other: "Other",
  };

  return (
    <div className="flex flex-col flex-1 px-4">
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-6">
          <h2 className="text-lg font-bold" data-testid="detect-heading">Detect Source</h2>
          <p className="text-sm text-muted-foreground mt-1">
            We'll auto-map your columns based on the source software
          </p>
        </div>

        {/* File info card */}
        <Card className="p-4 mb-4">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="w-8 h-8 text-primary flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate" data-testid="file-name">{fileName}</p>
              <p className="text-xs text-muted-foreground" data-testid="file-stats">
                {rowCount} rows · {colCount} columns
              </p>
            </div>
          </div>
        </Card>

        {/* Detection result */}
        {detectedSource ? (
          <Card className="p-4 mb-4 border-green-500/30 bg-green-500/5">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold" data-testid="detected-source">
                  Detected: {sourceLabels[detectedSource]} export
                </p>
                <p className="text-xs text-muted-foreground">
                  Confidence: {confidence}%
                </p>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="p-4 mb-4 border-amber-500/30 bg-amber-500/5">
            <div className="flex items-center gap-3 mb-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
              <p className="text-sm font-semibold" data-testid="detect-unknown">
                Could not auto-detect source
              </p>
            </div>
            <Select
              value={selectedSource || ""}
              onValueChange={(v) => onSelectSource(v as DetectedSource)}
            >
              <SelectTrigger data-testid="source-select">
                <SelectValue placeholder="Select your software" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="appfolio">AppFolio</SelectItem>
                <SelectItem value="buildium">Buildium</SelectItem>
                <SelectItem value="rentmanager">Rent Manager</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </Card>
        )}

        {/* Columns preview */}
        <Card className="p-4 mb-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Detected Columns
          </p>
          <div className="flex flex-wrap gap-1.5">
            {headers.slice(0, 12).map((h, i) => (
              <Badge key={i} variant="secondary" className="text-xs">
                {h}
              </Badge>
            ))}
            {headers.length > 12 && (
              <Badge variant="outline" className="text-xs">
                +{headers.length - 12} more
              </Badge>
            )}
          </div>
        </Card>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onBack} className="flex-1" data-testid="back-btn">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <Button
            onClick={onNext}
            className="flex-1"
            disabled={!detectedSource && !selectedSource}
            data-testid="next-btn"
          >
            Next <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ---- STEP 3: Field Mapping ----
function MappingStep({
  headers,
  data,
  mappings,
  onUpdateMapping,
  onNext,
  onBack,
  source,
}: {
  headers: string[];
  data: string[][];
  mappings: Record<string, string>;
  onUpdateMapping: (field: string, csvCol: string) => void;
  onNext: () => void;
  onBack: () => void;
  source: DetectedSource;
}) {
  const isBuildium = source === "buildium";
  const canProceed = mappings["name"] && mappings["address"];

  function getPreview(csvCol: string): string {
    if (!csvCol) return "—";
    const colIdx = headers.indexOf(csvCol);
    if (colIdx === -1) return "—";
    const val = data[0]?.[colIdx];
    return val || "—";
  }

  return (
    <div className="flex flex-col flex-1 px-4">
      <div className="w-full max-w-lg mx-auto">
        <div className="text-center mb-4">
          <h2 className="text-lg font-bold" data-testid="mapping-heading">Map Your Fields</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Match your CSV columns to SteadyState fields
          </p>
        </div>

        {isBuildium && (
          <div className="flex items-start gap-2 text-xs bg-blue-500/10 text-blue-400 rounded-lg px-3 py-2 mb-4" data-testid="buildium-note">
            <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>
              Buildium exports one row per property. Units will be created based on the unit count column.
            </span>
          </div>
        )}

        <div className="overflow-x-auto -mx-4 px-4">
          <Table data-testid="mapping-table">
            <TableHeader className="sticky top-0 bg-background z-10">
              <TableRow>
                <TableHead className="text-xs w-[140px]">SteadyState Field</TableHead>
                <TableHead className="text-xs">Your CSV Column</TableHead>
                <TableHead className="text-xs w-[100px]">Preview</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {STEADY_STATE_FIELDS.map((field) => {
                const mapped = mappings[field.key] || "";
                const preview = getPreview(mapped);
                const isMissing = !mapped;

                return (
                  <TableRow key={field.key} data-testid={`mapping-row-${field.key}`}>
                    <TableCell className="py-2">
                      <div className="flex items-center gap-1.5">
                        {isMissing && field.required && (
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                        )}
                        {isMissing && !field.required && (
                          <div className="w-3.5" />
                        )}
                        <span className="text-xs font-medium">{field.label}</span>
                        <Badge variant={field.required ? "default" : "outline"} className="text-[9px] px-1 py-0 h-4">
                          {field.required ? "Required" : "Optional"}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="py-2">
                      <Select
                        value={mapped || "__none__"}
                        onValueChange={(v) => onUpdateMapping(field.key, v === "__none__" ? "" : v)}
                      >
                        <SelectTrigger
                          className={`h-8 text-xs ${isMissing ? "border-amber-500/50" : ""}`}
                          data-testid={`mapping-select-${field.key}`}
                        >
                          <SelectValue placeholder="Select column" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">— None —</SelectItem>
                          {headers.map((h, i) => (
                            <SelectItem key={i} value={h}>
                              {h}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="py-2">
                      <span className="text-xs text-muted-foreground truncate block max-w-[100px]">
                        {preview}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        <div className="flex gap-3 mt-4 pb-4">
          <Button variant="outline" onClick={onBack} className="flex-1" data-testid="back-btn">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <Button
            onClick={onNext}
            className="flex-1"
            disabled={!canProceed}
            data-testid="next-btn"
          >
            Next <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ---- STEP 4: Preview & Confirm ----
function PreviewStep({
  properties,
  warnings,
  onImport,
  onBack,
  importing,
}: {
  properties: ParsedProperty[];
  warnings: string[];
  onImport: () => void;
  onBack: () => void;
  importing: boolean;
}) {
  // Group by property name
  const grouped = useMemo(() => {
    const map = new Map<string, ParsedProperty[]>();
    for (const p of properties) {
      const key = p.name;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    }
    return Array.from(map.entries());
  }, [properties]);

  const totalProperties = grouped.length;
  const totalUnits = properties.reduce((sum, p) => sum + (p.unitCount || 1), 0);
  const missingRequired = properties.filter((p) => !p.name || !p.address);

  return (
    <div className="flex flex-col flex-1 px-4">
      <div className="w-full max-w-lg mx-auto">
        <div className="text-center mb-4">
          <h2 className="text-lg font-bold" data-testid="preview-heading">Preview Import</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Review your data before importing
          </p>
        </div>

        {/* Summary badges */}
        <div className="flex items-center justify-center gap-3 mb-4">
          <Badge variant="secondary" className="text-sm px-3 py-1" data-testid="import-summary">
            <Building2 className="w-4 h-4 mr-1.5" />
            {totalProperties} properties, {totalUnits} units
          </Badge>
        </div>

        {/* Warnings */}
        {warnings.length > 0 && (
          <div className="space-y-1.5 mb-4">
            {warnings.map((w, i) => (
              <div
                key={i}
                className="flex items-start gap-2 text-xs bg-amber-500/10 text-amber-400 rounded-lg px-3 py-2"
                data-testid={`warning-${i}`}
              >
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                {w}
              </div>
            ))}
          </div>
        )}

        {/* Preview table */}
        <div className="overflow-x-auto -mx-4 px-4 mb-4">
          <Table data-testid="preview-table">
            <TableHeader className="sticky top-0 bg-background z-10">
              <TableRow>
                <TableHead className="text-xs">Property Name</TableHead>
                <TableHead className="text-xs">Address</TableHead>
                <TableHead className="text-xs">Unit</TableHead>
                <TableHead className="text-xs">Type</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {grouped.slice(0, 10).map(([name, rows], gi) =>
                rows.map((row, ri) => {
                  const isMissing = !row.name || !row.address;
                  return (
                    <TableRow
                      key={`${gi}-${ri}`}
                      className={isMissing ? "bg-amber-500/5" : ""}
                      data-testid={`preview-row-${gi}-${ri}`}
                    >
                      <TableCell className="py-2 text-xs font-medium">
                        {ri === 0 ? name : ""}
                      </TableCell>
                      <TableCell className="py-2 text-xs text-muted-foreground">
                        {ri === 0 ? [row.address, row.city, row.state, row.zip].filter(Boolean).join(", ") : ""}
                      </TableCell>
                      <TableCell className="py-2 text-xs">
                        {row.unitName || "Main"}
                      </TableCell>
                      <TableCell className="py-2 text-xs">
                        <Badge variant="outline" className="text-[10px]">
                          {row.type || "Residential"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {grouped.length > 10 && (
          <p className="text-xs text-muted-foreground text-center mb-4">
            Showing first 10 of {totalProperties} properties
          </p>
        )}

        <div className="flex gap-3 pb-4">
          <Button variant="outline" onClick={onBack} className="flex-1" disabled={importing} data-testid="back-btn">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <Button
            onClick={onImport}
            className="flex-1"
            disabled={importing || missingRequired.length === properties.length}
            data-testid="import-btn"
          >
            {importing ? (
              <>
                <Loader2 className="w-4 h-4 mr-1 animate-spin" /> Importing...
              </>
            ) : (
              <>Import All</>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ---- STEP 5: Success ----
function SuccessStep({
  propertiesAdded,
  unitsAdded,
}: {
  propertiesAdded: number;
  unitsAdded: number;
}) {
  const [, navigate] = useLocation();

  return (
    <div className="flex flex-col items-center justify-center flex-1 px-4">
      <div className="w-full max-w-md text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 mb-4 animate-in zoom-in-50 duration-500">
          <CheckCircle2 className="w-8 h-8 text-green-500" />
        </div>
        <h2 className="text-lg font-bold mb-1" data-testid="success-heading">
          Import Complete!
        </h2>
        <p className="text-sm text-muted-foreground mb-6" data-testid="success-summary">
          Successfully imported {propertiesAdded} properties and {unitsAdded} units
        </p>

        <div className="flex items-start gap-2 text-xs bg-blue-500/10 text-blue-400 rounded-lg px-3 py-2 mb-6 text-left" data-testid="no-sensor-info">
          <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>
            No sensors installed yet. Connect SteadyState sensors to start monitoring your imported properties.
          </span>
        </div>

        <Button
          onClick={() => navigate("/properties")}
          className="w-full"
          data-testid="view-properties-btn"
        >
          <Building2 className="w-4 h-4 mr-2" />
          View Properties
        </Button>
      </div>
    </div>
  );
}

// ---- MAIN WIZARD ----
export default function ImportPage() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState(0);

  // Step 1 state
  const [fileName, setFileName] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [data, setData] = useState<string[][]>([]);

  // Step 2 state
  const [detectedSource, setDetectedSource] = useState<DetectedSource>(null);
  const [confidence, setConfidence] = useState(0);
  const [selectedSource, setSelectedSource] = useState<DetectedSource>(null);

  // Step 3 state
  const [mappings, setMappings] = useState<Record<string, string>>({});

  // Step 4/5 state
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ propertiesAdded: number; unitsAdded: number } | null>(null);

  const effectiveSource = detectedSource || selectedSource;

  // Step 1 → Step 2
  const handleFileLoaded = useCallback(
    (file: File, parsedData: string[][], parsedHeaders: string[]) => {
      setFileName(file.name);
      setHeaders(parsedHeaders);
      setData(parsedData);

      // Auto-detect
      const detection = detectSource(parsedHeaders);
      setDetectedSource(detection.source);
      setConfidence(detection.confidence);
      setSelectedSource(null);

      // Auto-map based on detection
      const source = detection.source || "other";
      const autoMappings = autoMap(parsedHeaders, source);
      setMappings(autoMappings);

      setStep(1);
    },
    []
  );

  // When source selection changes (step 2), re-auto-map
  const handleSelectSource = useCallback(
    (source: DetectedSource) => {
      setSelectedSource(source);
      if (source) {
        const autoMappings = autoMap(headers, source);
        setMappings(autoMappings);
      }
    },
    [headers]
  );

  const handleUpdateMapping = useCallback(
    (field: string, csvCol: string) => {
      setMappings((prev) => ({ ...prev, [field]: csvCol }));
    },
    []
  );

  // Build properties from mapped data
  const buildProperties = useCallback((): { properties: ParsedProperty[]; warnings: string[] } => {
    const warnings: string[] = [];
    const isBuildium = effectiveSource === "buildium";

    function getVal(row: string[], field: string): string {
      const col = mappings[field];
      if (!col) return "";
      const idx = headers.indexOf(col);
      if (idx === -1) return "";
      return (row[idx] || "").trim();
    }

    if (isBuildium) {
      // Each row is a property; expand units based on NumberOfUnits
      const properties: ParsedProperty[] = [];
      let missingZip = 0;

      for (const row of data) {
        const name = getVal(row, "name");
        const address = getVal(row, "address");
        if (!name && !address) continue;

        const zip = getVal(row, "zip");
        if (!zip) missingZip++;

        // Get unit count from the NumberOfUnits column
        const unitCountCol = headers.find(
          (h) => normalizeHeader(h) === "numberofunits" || normalizeHeader(h) === "number of units"
        );
        let unitCount = 1;
        if (unitCountCol) {
          const idx = headers.indexOf(unitCountCol);
          const val = parseInt(row[idx] || "1");
          if (!isNaN(val) && val > 0) unitCount = val;
        }

        const typeRaw = getVal(row, "type").toLowerCase();
        const type = typeRaw.includes("residential") ? "Residential" : typeRaw || "Residential";

        properties.push({
          name,
          address,
          addressLine2: getVal(row, "addressLine2"),
          city: getVal(row, "city"),
          state: getVal(row, "state"),
          zip,
          type,
          unitCount,
        });
      }

      if (missingZip > 0) warnings.push(`${missingZip} row${missingZip > 1 ? "s" : ""} missing zip code — will import without zip`);

      return { properties, warnings };
    } else {
      // AppFolio / Other — each row can be a unit, group by property name
      const rowsByProperty = new Map<string, ParsedProperty[]>();
      let missingZip = 0;

      for (const row of data) {
        const name = getVal(row, "name");
        const address = getVal(row, "address");
        if (!name && !address) continue;

        const zip = getVal(row, "zip");
        if (!zip) missingZip++;

        const bedroomsRaw = getVal(row, "bedrooms");
        const bathroomsRaw = getVal(row, "bathrooms");

        const parsed: ParsedProperty = {
          name,
          address,
          addressLine2: getVal(row, "addressLine2"),
          city: getVal(row, "city"),
          state: getVal(row, "state"),
          zip,
          unitName: getVal(row, "unitName") || "Main",
          type: getVal(row, "type") || "Residential",
          bedrooms: bedroomsRaw ? parseInt(bedroomsRaw) : undefined,
          bathrooms: bathroomsRaw ? parseInt(bathroomsRaw) : undefined,
          unitCount: 1,
        };

        if (!rowsByProperty.has(name)) rowsByProperty.set(name, []);
        rowsByProperty.get(name)!.push(parsed);
      }

      if (missingZip > 0) warnings.push(`${missingZip} row${missingZip > 1 ? "s" : ""} missing zip code — will import without zip`);

      // Flatten but keep group awareness for preview
      const allRows: ParsedProperty[] = [];
      for (const [, rows] of rowsByProperty) {
        allRows.push(...rows);
      }

      return { properties: allRows, warnings };
    }
  }, [data, headers, mappings, effectiveSource]);

  const { properties: previewProperties, warnings } = useMemo(() => {
    if (step >= 3) {
      return buildProperties();
    }
    return { properties: [], warnings: [] };
  }, [step, buildProperties]);

  // Import handler
  const handleImport = useCallback(async () => {
    setImporting(true);
    const isBuildium = effectiveSource === "buildium";

    // Transform to API format: group by property
    const propMap = new Map<
      string,
      {
        name: string;
        address: string;
        city?: string;
        state?: string;
        zip?: string;
        type: string;
        units: { unitNumber: string; bedrooms?: number; bathrooms?: number }[];
      }
    >();

    if (isBuildium) {
      for (const p of previewProperties) {
        const unitCount = p.unitCount || 1;
        const units: { unitNumber: string }[] = [];
        if (unitCount === 1) {
          units.push({ unitNumber: "Main" });
        } else {
          for (let i = 1; i <= unitCount; i++) {
            units.push({ unitNumber: String(i) });
          }
        }
        propMap.set(p.name, {
          name: p.name,
          address: p.address,
          city: p.city,
          state: p.state,
          zip: p.zip,
          type: mapPropertyType(p.type),
          units,
        });
      }
    } else {
      for (const p of previewProperties) {
        if (!propMap.has(p.name)) {
          propMap.set(p.name, {
            name: p.name,
            address: p.address,
            city: p.city,
            state: p.state,
            zip: p.zip,
            type: mapPropertyType(p.type),
            units: [],
          });
        }
        propMap.get(p.name)!.units.push({
          unitNumber: p.unitName || "Main",
          bedrooms: p.bedrooms,
          bathrooms: p.bathrooms,
        });
      }
    }

    const payload = { properties: Array.from(propMap.values()) };

    try {
      const res = await apiRequest("POST", "/api/import/properties", payload);
      const data = await res.json();
      setResult(data);
      // Invalidate caches
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      setStep(4);
    } catch (e) {
      console.error("Import failed", e);
    } finally {
      setImporting(false);
    }
  }, [previewProperties, effectiveSource]);

  return (
    <div className="min-h-screen flex flex-col bg-background" data-testid="import-page">
      {/* Header */}
      <div className="border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate("/properties")}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            data-testid="close-wizard"
          >
            <X className="w-4 h-4" />
            <span className="hidden sm:inline">Close</span>
          </button>
          <span className="text-sm font-semibold">Import Properties</span>
          <div className="w-8" /> {/* Spacer */}
        </div>
        <StepIndicator current={step} total={5} />
      </div>

      {/* Step content */}
      <div className="flex-1 flex flex-col py-4">
        {step === 0 && <UploadStep onFileLoaded={handleFileLoaded} />}
        {step === 1 && (
          <DetectStep
            headers={headers}
            detectedSource={detectedSource}
            confidence={confidence}
            selectedSource={selectedSource}
            onSelectSource={handleSelectSource}
            onNext={() => setStep(2)}
            onBack={() => setStep(0)}
            rowCount={data.length}
            colCount={headers.length}
            fileName={fileName}
          />
        )}
        {step === 2 && (
          <MappingStep
            headers={headers}
            data={data}
            mappings={mappings}
            onUpdateMapping={handleUpdateMapping}
            onNext={() => setStep(3)}
            onBack={() => setStep(1)}
            source={effectiveSource}
          />
        )}
        {step === 3 && (
          <PreviewStep
            properties={previewProperties}
            warnings={warnings}
            onImport={handleImport}
            onBack={() => setStep(2)}
            importing={importing}
          />
        )}
        {step === 4 && (
          <SuccessStep
            propertiesAdded={result?.propertiesAdded || 0}
            unitsAdded={result?.unitsAdded || 0}
          />
        )}
      </div>
    </div>
  );
}

function mapPropertyType(raw?: string): "multifamily" | "sfr" | "vacation" {
  if (!raw) return "multifamily";
  const lower = raw.toLowerCase();
  if (lower.includes("single") || lower === "sfr") return "sfr";
  if (lower.includes("vacation") || lower.includes("short")) return "vacation";
  return "multifamily";
}
