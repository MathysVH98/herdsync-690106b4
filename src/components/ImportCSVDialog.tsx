import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImportCSVDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  farmId: string;
  onImportComplete: () => void;
}

interface ColumnMapping {
  csvColumn: string;
  livestockField: string | null;
  confidence: number;
}

interface ParsedData {
  headers: string[];
  rows: string[][];
}

const LIVESTOCK_FIELDS = [
  { value: "name", label: "Name" },
  { value: "tag", label: "Tag Number" },
  { value: "type", label: "Animal Type" },
  { value: "breed", label: "Breed" },
  { value: "age", label: "Age" },
  { value: "weight", label: "Weight" },
  { value: "status", label: "Health Status" },
  { value: "sex", label: "Sex" },
  { value: "date_of_birth", label: "Date of Birth" },
  { value: "purchase_cost", label: "Purchase Cost" },
  { value: "feed_type", label: "Feed Type" },
  { value: "notes", label: "Notes" },
  { value: "microchip_number", label: "Microchip Number" },
  { value: "brand_mark", label: "Brand Mark" },
  { value: "color_markings", label: "Color/Markings" },
];

export function ImportCSVDialog({ open, onOpenChange, farmId, onImportComplete }: ImportCSVDialogProps) {
  const [step, setStep] = useState<"upload" | "mapping" | "preview" | "importing">("upload");
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const parseCSV = (text: string): ParsedData => {
    const lines = text.split(/\r?\n/).filter(line => line.trim());
    if (lines.length === 0) return { headers: [], rows: [] };

    // Detect delimiter (comma, semicolon, or tab)
    const firstLine = lines[0];
    const delimiter = firstLine.includes(";") ? ";" : firstLine.includes("\t") ? "\t" : ",";

    const parseRow = (line: string): string[] => {
      const result: string[] = [];
      let current = "";
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === delimiter && !inQuotes) {
          result.push(current.trim());
          current = "";
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };

    const headers = parseRow(lines[0]);
    const rows = lines.slice(1).map(parseRow).filter(row => row.some(cell => cell.trim()));

    return { headers, rows };
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".csv")) {
      toast({ title: "Invalid File", description: "Please upload a CSV file.", variant: "destructive" });
      return;
    }

    try {
      const text = await file.text();
      const data = parseCSV(text);

      if (data.headers.length === 0) {
        toast({ title: "Empty File", description: "The CSV file appears to be empty.", variant: "destructive" });
        return;
      }

      setParsedData(data);
      setIsAnalyzing(true);
      setStep("mapping");

      // Call edge function to analyze and map columns
      const { data: mappingResult, error } = await supabase.functions.invoke("map-csv-columns", {
        body: { headers: data.headers, sampleRows: data.rows.slice(0, 5) },
      });

      if (error) {
        console.error("Mapping error:", error);
        // Fallback to empty mappings
        setMappings(data.headers.map(h => ({ csvColumn: h, livestockField: null, confidence: 0 })));
      } else {
        setMappings(mappingResult.mappings || []);
      }
    } catch (err) {
      console.error("Error reading file:", err);
      toast({ title: "Error", description: "Failed to read the CSV file.", variant: "destructive" });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const updateMapping = (csvColumn: string, newField: string | null) => {
    setMappings(mappings.map(m => 
      m.csvColumn === csvColumn 
        ? { ...m, livestockField: newField === "skip" ? null : newField, confidence: 1 }
        : m
    ));
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.8) return <Badge className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-500/30">High</Badge>;
    if (confidence >= 0.5) return <Badge className="bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/30">Medium</Badge>;
    return <Badge variant="outline" className="text-muted-foreground">Low</Badge>;
  };

  const handleImport = async () => {
    if (!parsedData || !farmId) return;

    setStep("importing");
    setImportProgress(0);

    const fieldToColumn: Record<string, string> = {};
    mappings.forEach(m => {
      if (m.livestockField) {
        fieldToColumn[m.livestockField] = m.csvColumn;
      }
    });

    const getColumnIndex = (field: string): number => {
      const colName = fieldToColumn[field];
      return colName ? parsedData.headers.indexOf(colName) : -1;
    };

    const getValue = (row: string[], field: string): string | null => {
      const idx = getColumnIndex(field);
      return idx >= 0 && row[idx] ? row[idx].trim() : null;
    };

    const normalizeType = (value: string | null): string => {
      if (!value) return "Other";
      const v = value.toLowerCase();
      if (v.includes("cattle") || v.includes("cow") || v.includes("bull") || v.includes("heifer")) return "Cattle";
      if (v.includes("sheep") || v.includes("lamb") || v.includes("ewe") || v.includes("ram")) return "Sheep";
      if (v.includes("goat") || v.includes("kid")) return "Goat";
      if (v.includes("pig") || v.includes("swine") || v.includes("hog") || v.includes("sow") || v.includes("boar")) return "Pig";
      if (v.includes("chicken") || v.includes("hen") || v.includes("rooster") || v.includes("poultry")) return "Chicken";
      if (v.includes("duck")) return "Duck";
      if (v.includes("horse") || v.includes("mare") || v.includes("stallion") || v.includes("foal")) return "Horse";
      // If no match, capitalize first letter
      return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
    };

    const normalizeStatus = (value: string | null): string => {
      if (!value) return "Healthy";
      const v = value.toLowerCase();
      if (v.includes("sick") || v.includes("ill")) return "Sick";
      if (v.includes("pregnant") || v.includes("expecting")) return "Pregnant";
      if (v.includes("observation") || v.includes("watch") || v.includes("monitor")) return "Under Observation";
      return "Healthy";
    };

    const parseCost = (value: string | null): number | null => {
      if (!value) return null;
      const num = parseFloat(value.replace(/[^0-9.-]/g, ""));
      return isNaN(num) ? null : num;
    };

    let successCount = 0;
    let errorCount = 0;
    const batchSize = 50;
    const totalRows = parsedData.rows.length;

    for (let i = 0; i < totalRows; i += batchSize) {
      const batch = parsedData.rows.slice(i, i + batchSize);
      
      const animalsToInsert = batch.map(row => {
        const name = getValue(row, "name");
        const tag = getValue(row, "tag");
        
        // Generate tag if missing
        const finalTag = tag || `IMP-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        const finalName = name || `Animal ${finalTag}`;

        return {
          farm_id: farmId,
          name: finalName,
          tag: finalTag,
          type: normalizeType(getValue(row, "type")),
          breed: getValue(row, "breed"),
          age: getValue(row, "age"),
          weight: getValue(row, "weight"),
          status: normalizeStatus(getValue(row, "status")),
          sex: getValue(row, "sex"),
          date_of_birth: getValue(row, "date_of_birth"),
          purchase_cost: parseCost(getValue(row, "purchase_cost")),
          feed_type: getValue(row, "feed_type"),
          notes: getValue(row, "notes"),
          microchip_number: getValue(row, "microchip_number"),
          brand_mark: getValue(row, "brand_mark"),
          color_markings: getValue(row, "color_markings"),
        };
      });

      const { error } = await supabase.from("livestock").insert(animalsToInsert);
      
      if (error) {
        console.error("Import batch error:", error);
        errorCount += batch.length;
      } else {
        successCount += batch.length;
      }

      setImportProgress(Math.round(((i + batch.length) / totalRows) * 100));
    }

    if (successCount > 0) {
      toast({
        title: "Import Complete",
        description: `Successfully imported ${successCount} animals.${errorCount > 0 ? ` ${errorCount} failed.` : ""}`,
      });
      onImportComplete();
      handleClose();
    } else {
      toast({
        title: "Import Failed",
        description: "No animals were imported. Please check your CSV format.",
        variant: "destructive",
      });
      setStep("mapping");
    }
  };

  const handleClose = () => {
    setStep("upload");
    setParsedData(null);
    setMappings([]);
    setImportProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
    onOpenChange(false);
  };

  const mappedFieldsCount = mappings.filter(m => m.livestockField).length;
  const hasRequiredFields = mappings.some(m => m.livestockField === "tag" || m.livestockField === "name");

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            Import Animals from CSV
          </DialogTitle>
          <DialogDescription>
            Upload a CSV file and we'll intelligently map your columns to livestock fields.
          </DialogDescription>
        </DialogHeader>

        {step === "upload" && (
          <div className="py-8">
            <div
              className="border-2 border-dashed border-muted-foreground/25 rounded-xl p-12 text-center hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg mb-2">Drop your CSV file here</h3>
              <p className="text-sm text-muted-foreground mb-4">or click to browse</p>
              <Input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button variant="outline" size="sm">
                Select File
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-4 text-center">
              Supports any CSV format. Our AI will automatically detect and map your columns.
            </p>
          </div>
        )}

        {step === "mapping" && (
          <div className="space-y-4">
            {isAnalyzing ? (
              <div className="py-12 text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary mb-4" />
                <p className="text-muted-foreground">Analyzing your CSV structure...</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Found <span className="font-semibold text-foreground">{parsedData?.headers.length}</span> columns and{" "}
                      <span className="font-semibold text-foreground">{parsedData?.rows.length}</span> rows
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Mapped <span className="font-semibold text-foreground">{mappedFieldsCount}</span> fields
                    </p>
                  </div>
                  {hasRequiredFields ? (
                    <Badge className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-500/30">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Ready to import
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-amber-600 dark:text-amber-400 border-amber-500/50">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      Map name or tag
                    </Badge>
                  )}
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>CSV Column</TableHead>
                        <TableHead>Sample Data</TableHead>
                        <TableHead>Maps To</TableHead>
                        <TableHead className="w-20">Confidence</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mappings.map((mapping, idx) => (
                        <TableRow key={mapping.csvColumn}>
                          <TableCell className="font-medium">{mapping.csvColumn}</TableCell>
                          <TableCell className="text-muted-foreground text-sm truncate max-w-[150px]">
                            {parsedData?.rows[0]?.[idx] || "-"}
                          </TableCell>
                          <TableCell>
                            <Select
                              value={mapping.livestockField || "skip"}
                              onValueChange={(v) => updateMapping(mapping.csvColumn, v)}
                            >
                              <SelectTrigger className="w-[180px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="skip">
                                  <span className="text-muted-foreground">Skip this column</span>
                                </SelectItem>
                                {LIVESTOCK_FIELDS.map(f => (
                                  <SelectItem key={f.value} value={f.value}>
                                    {f.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            {mapping.livestockField && getConfidenceBadge(mapping.confidence)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button variant="outline" onClick={() => setStep("upload")}>
                    Back
                  </Button>
                  <Button
                    className="flex-1 bg-gradient-primary text-primary-foreground"
                    onClick={handleImport}
                    disabled={!hasRequiredFields}
                  >
                    Import {parsedData?.rows.length} Animals
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        {step === "importing" && (
          <div className="py-12 text-center space-y-4">
            <Loader2 className="w-10 h-10 animate-spin mx-auto text-primary" />
            <div>
              <p className="font-semibold text-lg">Importing animals...</p>
              <p className="text-muted-foreground">{importProgress}% complete</p>
            </div>
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <div
                className="bg-primary h-full transition-all duration-300"
                style={{ width: `${importProgress}%` }}
              />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
