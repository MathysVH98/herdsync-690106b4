import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useFarm } from "@/hooks/useFarm";
import {
  FileText,
  Download,
  Calendar,
  CheckCircle2,
  Package,
  AlertCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type AuditType = "department_of_labour" | "ohs" | "livestock_traceability" | "chemical_records" | "custom";

interface DocumentForExport {
  id: string;
  title: string;
  category: string;
  file_url: string;
  file_name: string;
  date_of_document: string | null;
  selected: boolean;
}

const auditTypeRequirements: Record<AuditType, { categories: string[]; label: string }> = {
  department_of_labour: {
    label: "Department of Labour (BCEA/UIF/COIDA)",
    categories: ["uif", "coida", "payslips_payroll", "employment_contracts"],
  },
  ohs: {
    label: "Occupational Health & Safety",
    categories: ["ohs_risk_assessments", "ppe_register", "incident_register", "first_aid"],
  },
  livestock_traceability: {
    label: "Livestock Traceability",
    categories: ["animal_id_ownership", "movement_records", "vet_letters"],
  },
  chemical_records: {
    label: "Chemical Records",
    categories: ["chemical_purchase_invoices", "chemical_stock_records", "chemical_application_records"],
  },
  custom: {
    label: "Custom Audit",
    categories: [],
  },
};

const categoryLabels: Record<string, string> = {
  uif: "UIF Registration",
  coida: "COIDA Certificate",
  payslips_payroll: "Payslips/Payroll",
  employment_contracts: "Employment Contracts",
  ohs_risk_assessments: "OHS Risk Assessments",
  ppe_register: "PPE Register",
  incident_register: "Incident Register",
  first_aid: "First Aid Records",
  animal_id_ownership: "Animal ID/Ownership",
  movement_records: "Movement Records",
  vet_letters: "Veterinary Letters",
  chemical_purchase_invoices: "Chemical Invoices",
  chemical_stock_records: "Stock Records",
  chemical_application_records: "Application Records",
  water_use_authorisation: "Water Use Licence",
  borehole_abstraction_logs: "Borehole Logs",
  abattoir_meat_safety: "Meat Safety Docs",
  other: "Other",
};

export default function AuditPackBuilder() {
  const { user } = useAuth();
  const { farm } = useFarm();
  const { toast } = useToast();

  const [auditType, setAuditType] = useState<AuditType>("department_of_labour");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [documents, setDocuments] = useState<DocumentForExport[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (farm?.id) {
      fetchDocuments();
    }
  }, [farm?.id, auditType]);

  const fetchDocuments = async () => {
    if (!farm?.id) return;
    setLoading(true);

    const requiredCategories = auditTypeRequirements[auditType].categories;
    
    let query = supabase
      .from("compliance_documents")
      .select("*")
      .eq("farm_id", farm.id);

    if (requiredCategories.length > 0) {
      query = query.in("category", requiredCategories as any);
    }

    const { data, error } = await query.order("category");

    if (error) {
      console.error("Error fetching documents:", error);
    } else {
      setDocuments(
        (data || []).map((doc) => ({
          ...doc,
          selected: true,
        }))
      );
    }
    setLoading(false);
  };

  const toggleDocument = (id: string) => {
    setDocuments((prev) =>
      prev.map((doc) =>
        doc.id === id ? { ...doc, selected: !doc.selected } : doc
      )
    );
  };

  const selectAll = () => {
    setDocuments((prev) => prev.map((doc) => ({ ...doc, selected: true })));
  };

  const deselectAll = () => {
    setDocuments((prev) => prev.map((doc) => ({ ...doc, selected: false })));
  };

  const generateCSVReport = (type: string, data: any[]) => {
    if (data.length === 0) return "";

    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(","),
      ...data.map((row) =>
        headers.map((h) => `"${String(row[h] || "").replace(/"/g, '""')}"`).join(",")
      ),
    ];
    return csvRows.join("\n");
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generateAuditPack = async () => {
    if (!farm?.id) return;
    setGenerating(true);

    try {
      const selectedDocs = documents.filter((d) => d.selected);
      const auditLabel = auditTypeRequirements[auditType].label;
      const dateStr = new Date().toISOString().split("T")[0];

      // Generate document list CSV
      const docListCSV = generateCSVReport("documents", selectedDocs.map((d) => ({
        Title: d.title,
        Category: categoryLabels[d.category] || d.category,
        FileName: d.file_name,
        DocumentDate: d.date_of_document || "N/A",
        URL: d.file_url,
      })));

      downloadFile(docListCSV, `${auditLabel.replace(/\s+/g, "_")}_Documents_${dateStr}.csv`, "text/csv");

      // Fetch and generate additional reports based on audit type
      if (auditType === "ohs") {
        // PPE Issues
        const { data: ppeData } = await supabase.from("ppe_issues").select("*").eq("farm_id", farm.id);
        if (ppeData && ppeData.length > 0) {
          const ppeCSV = generateCSVReport("ppe", ppeData.map((p) => ({
            EmployeeName: p.employee_name,
            PPEItem: p.ppe_item,
            IssueDate: p.issue_date,
            NextDueDate: p.next_due_date || "N/A",
            Notes: p.notes || "",
          })));
          downloadFile(ppeCSV, `PPE_Register_${dateStr}.csv`, "text/csv");
        }

        // Training Records
        const { data: trainingData } = await supabase.from("training_records").select("*").eq("farm_id", farm.id);
        if (trainingData && trainingData.length > 0) {
          const trainingCSV = generateCSVReport("training", trainingData.map((t) => ({
            EmployeeName: t.employee_name,
            TrainingType: t.training_type,
            TrainingDate: t.training_date,
            Provider: t.provider || "N/A",
            Notes: t.notes || "",
          })));
          downloadFile(trainingCSV, `Training_Records_${dateStr}.csv`, "text/csv");
        }

        // Incidents
        const { data: incidentData } = await supabase.from("incidents").select("*").eq("farm_id", farm.id);
        if (incidentData && incidentData.length > 0) {
          const incidentCSV = generateCSVReport("incidents", incidentData.map((i) => ({
            IncidentDate: i.incident_date,
            Description: i.description,
            Severity: i.severity,
            ActionTaken: i.action_taken || "N/A",
            Closed: i.closed ? "Yes" : "No",
          })));
          downloadFile(incidentCSV, `Incident_Register_${dateStr}.csv`, "text/csv");
        }
      }

      if (auditType === "chemical_records") {
        // Chemicals Inventory
        const { data: chemData } = await supabase.from("chemicals_inventory").select("*").eq("farm_id", farm.id);
        if (chemData && chemData.length > 0) {
          const chemCSV = generateCSVReport("chemicals", chemData.map((c) => ({
            ProductName: c.product_name,
            ActiveIngredient: c.active_ingredient || "N/A",
            BatchNo: c.batch_no || "N/A",
            ExpiryDate: c.expiry_date || "N/A",
            Quantity: c.quantity,
            Unit: c.unit,
            StorageLocation: c.storage_location || "N/A",
          })));
          downloadFile(chemCSV, `Chemical_Inventory_${dateStr}.csv`, "text/csv");
        }

        // Chemical Applications
        const { data: appData } = await supabase.from("chemical_applications").select("*").eq("farm_id", farm.id);
        if (appData && appData.length > 0) {
          const appCSV = generateCSVReport("applications", appData.map((a) => ({
            ApplicationDate: a.application_date,
            Product: a.product_name,
            BatchNo: a.batch_no || "N/A",
            Dosage: `${a.dosage} ${a.unit}`,
            Target: a.target,
            AnimalID: a.animal_id || "N/A",
            Location: a.location_or_paddock || "N/A",
            Operator: a.operator_name,
          })));
          downloadFile(appCSV, `Chemical_Applications_${dateStr}.csv`, "text/csv");
        }
      }

      // Save audit pack record
      await supabase.from("audit_packs").insert({
        farm_id: farm.id,
        audit_type: auditType,
        date_range_start: startDate || null,
        date_range_end: endDate || null,
        generated_by: user?.id,
        document_ids: selectedDocs.map((d) => d.id),
      });

      toast({
        title: "Audit Pack Generated",
        description: `${selectedDocs.length} documents and related reports have been downloaded.`,
      });
    } catch (error: any) {
      console.error("Error generating audit pack:", error);
      toast({
        title: "Error",
        description: "Failed to generate audit pack",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const requiredCategories = auditTypeRequirements[auditType].categories;
  const missingCategories = requiredCategories.filter(
    (cat) => !documents.some((d) => d.category === cat)
  );

  if (!user || !farm) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-[60vh] text-center">
          <Package className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Sign in Required</h2>
          <p className="text-muted-foreground">Please sign in to build audit packs.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold font-display text-foreground">Audit Pack Builder</h1>
          <p className="text-muted-foreground mt-1">
            Generate downloadable audit packs with documents and reports
          </p>
        </div>

        {/* Configuration */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="text-lg font-display">Configure Audit Pack</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Audit Type</Label>
              <Select value={auditType} onValueChange={(v) => setAuditType(v as AuditType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(auditTypeRequirements).map(([key, val]) => (
                    <SelectItem key={key} value={key}>{val.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date Range Start (optional)</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <Label>Date Range End (optional)</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Missing Documents Warning */}
        {missingCategories.length > 0 && (
          <Card className="card-elevated border-l-4 border-l-yellow-500">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-foreground">Missing Required Documents</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Upload these documents to complete your audit pack:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {missingCategories.map((cat) => (
                      <Badge key={cat} variant="outline" className="bg-yellow-500/10">
                        {categoryLabels[cat] || cat}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Documents Selection */}
        <Card className="card-elevated">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-display">
                Documents ({documents.filter((d) => d.selected).length} selected)
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={selectAll}>Select All</Button>
                <Button variant="outline" size="sm" onClick={deselectAll}>Deselect All</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center py-8 text-muted-foreground">Loading documents...</p>
            ) : documents.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                No documents found for this audit type. Upload documents to the Document Vault first.
              </p>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <Checkbox
                      checked={doc.selected}
                      onCheckedChange={() => toggleDocument(doc.id)}
                    />
                    <FileText className="w-4 h-4 text-primary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-sm truncate">{doc.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {categoryLabels[doc.category] || doc.category}
                        {doc.date_of_document && ` • ${new Date(doc.date_of_document).toLocaleDateString()}`}
                      </p>
                    </div>
                    {doc.selected && <CheckCircle2 className="w-4 h-4 text-primary" />}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Generate Button */}
        <Button
          size="lg"
          className="w-full bg-gradient-primary text-primary-foreground"
          onClick={generateAuditPack}
          disabled={generating || documents.filter((d) => d.selected).length === 0}
        >
          {generating ? (
            "Generating..."
          ) : (
            <>
              <Download className="w-5 h-5 mr-2" />
              Generate & Download Audit Pack
            </>
          )}
        </Button>
      </div>
    </Layout>
  );
}
