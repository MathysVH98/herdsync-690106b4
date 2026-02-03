import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useFarm } from "@/hooks/useFarm";
import {
  ClipboardCheck,
  FileText,
  Users,
  Beaker,
  AlertCircle,
  CheckCircle2,
  Upload,
  ArrowRight,
  Shield,
  Truck,
  Calendar,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMonthlyCompliance, getMonthYearLabel } from "@/hooks/useMonthlyCompliance";

interface ComplianceStatus {
  category: string;
  label: string;
  icon: React.ElementType;
  required: number;
  uploaded: number;
  color: string;
}

const auditTypeRequirements: Record<string, string[]> = {
  department_of_labour: ["uif", "coida", "payslips_payroll", "employment_contracts"],
  ohs: ["ohs_risk_assessments", "ppe_register", "incident_register", "first_aid"],
  livestock_traceability: ["animal_id_ownership", "movement_records", "vet_letters"],
  chemical_records: ["chemical_purchase_invoices", "chemical_stock_records", "chemical_application_records"],
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

export default function ComplianceDashboard() {
  const { user } = useAuth();
  const { farm } = useFarm();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [documentCounts, setDocumentCounts] = useState<Record<string, number>>({});
  const [incidentCount, setIncidentCount] = useState(0);
  const [ppeCount, setPpeCount] = useState(0);
  const [trainingCount, setTrainingCount] = useState(0);
  const [chemicalCount, setChemicalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const {
    loading: complianceLoading,
    getOverallProgress,
    getComplianceStatus,
    currentMonthYear,
    history,
  } = useMonthlyCompliance();
  
  const complianceStatus = getComplianceStatus();

  useEffect(() => {
    if (farm?.id) {
      fetchComplianceData();
    }
  }, [farm?.id]);

  const fetchComplianceData = async () => {
    if (!farm?.id) return;

    try {
      // Fetch document counts by category
      const { data: docs } = await supabase
        .from("compliance_documents")
        .select("category")
        .eq("farm_id", farm.id);

      const counts: Record<string, number> = {};
      docs?.forEach((doc) => {
        counts[doc.category] = (counts[doc.category] || 0) + 1;
      });
      setDocumentCounts(counts);

      // Fetch other counts
      const [incidents, ppe, training, chemicals] = await Promise.all([
        supabase.from("incidents").select("id", { count: "exact" }).eq("farm_id", farm.id).eq("closed", false),
        supabase.from("ppe_issues").select("id", { count: "exact" }).eq("farm_id", farm.id),
        supabase.from("training_records").select("id", { count: "exact" }).eq("farm_id", farm.id),
        supabase.from("chemicals_inventory").select("id", { count: "exact" }).eq("farm_id", farm.id),
      ]);

      setIncidentCount(incidents.count || 0);
      setPpeCount(ppe.count || 0);
      setTrainingCount(training.count || 0);
      setChemicalCount(chemicals.count || 0);
    } catch (error) {
      console.error("Error fetching compliance data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getAuditReadiness = (auditType: string) => {
    const required = auditTypeRequirements[auditType] || [];
    if (required.length === 0) return 0;
    
    const present = required.filter((cat) => (documentCounts[cat] || 0) > 0).length;
    return Math.round((present / required.length) * 100);
  };

  const auditTypes = [
    { id: "department_of_labour", label: "Dept of Labour (BCEA/UIF/COIDA)", icon: Users, color: "bg-blue-500" },
    { id: "ohs", label: "Occupational Health & Safety", icon: Shield, color: "bg-orange-500" },
    { id: "livestock_traceability", label: "Livestock Traceability", icon: Truck, color: "bg-green-500" },
    { id: "chemical_records", label: "Chemical Records", icon: Beaker, color: "bg-purple-500" },
  ];

  if (!user) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-[60vh] text-center">
          <ClipboardCheck className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Sign in Required</h2>
          <p className="text-muted-foreground mb-4">Please sign in to access the Compliance module.</p>
          <Button onClick={() => navigate("/auth")}>Sign In</Button>
        </div>
      </Layout>
    );
  }

  if (!farm) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-[60vh] text-center">
          <ClipboardCheck className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">No Farm Found</h2>
          <p className="text-muted-foreground mb-4">Create a farm to start using the Compliance module.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-display text-foreground">
              Compliance Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              SA audit readiness for {farm.name}
            </p>
          </div>
          <Button onClick={() => navigate("/compliance/audit-pack")} className="bg-gradient-primary text-primary-foreground">
            <FileText className="w-4 h-4 mr-2" />
            Build Audit Pack
          </Button>
        </div>

        {/* Audit Readiness Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {auditTypes.map((audit) => {
            const readiness = getAuditReadiness(audit.id);
            const AuditIcon = audit.icon;
            return (
              <Card key={audit.id} className="card-elevated">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className={`w-10 h-10 rounded-lg ${audit.color}/10 flex items-center justify-center`}>
                      <AuditIcon className={`w-5 h-5 ${audit.color.replace("bg-", "text-")}`} />
                    </div>
                    <Badge 
                      variant="outline" 
                      className={readiness >= 75 ? "bg-green-500/10 text-green-600" : readiness >= 50 ? "bg-yellow-500/10 text-yellow-600" : "bg-red-500/10 text-red-600"}
                    >
                      {readiness}%
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <h3 className="font-medium text-foreground text-sm mb-2">{audit.label}</h3>
                  <Progress value={readiness} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-2">
                    {auditTypeRequirements[audit.id]?.filter((cat) => (documentCounts[cat] || 0) > 0).length || 0} of {auditTypeRequirements[audit.id]?.length || 0} required docs
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="card-elevated cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate("/compliance/documents")}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Documents</p>
                  <p className="text-2xl font-bold text-foreground">{Object.values(documentCounts).reduce((a, b) => a + b, 0)}</p>
                </div>
                <FileText className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="card-elevated cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate("/compliance/labour-ohs")}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Open Incidents</p>
                  <p className="text-2xl font-bold text-foreground">{incidentCount}</p>
                </div>
                <AlertCircle className={`w-8 h-8 ${incidentCount > 0 ? "text-destructive" : "text-primary"}`} />
              </div>
            </CardContent>
          </Card>

          <Card className="card-elevated cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate("/compliance/labour-ohs")}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Training Records</p>
                  <p className="text-2xl font-bold text-foreground">{trainingCount}</p>
                </div>
                <Users className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="card-elevated cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate("/compliance/chemicals")}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Chemicals</p>
                  <p className="text-2xl font-bold text-foreground">{chemicalCount}</p>
                </div>
                <Beaker className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Compliance Status Block */}
        <Card 
          className={`card-elevated cursor-pointer hover:shadow-lg transition-shadow border-l-4 ${
            complianceStatus.color === "green" 
              ? "border-l-green-500" 
              : complianceStatus.color === "yellow" 
              ? "border-l-yellow-500" 
              : "border-l-red-500"
          }`}
          onClick={() => navigate("/audit")}
        >
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                complianceStatus.color === "green" 
                  ? "bg-green-500/10" 
                  : complianceStatus.color === "yellow" 
                  ? "bg-yellow-500/10" 
                  : "bg-red-500/10"
              }`}>
                {complianceStatus.color === "green" ? (
                  <CheckCircle2 className="w-7 h-7 text-green-600" />
                ) : complianceStatus.color === "yellow" ? (
                  <AlertTriangle className="w-7 h-7 text-yellow-600" />
                ) : (
                  <XCircle className="w-7 h-7 text-red-600" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-lg text-foreground">
                    Monthly Compliance Status
                  </h3>
                  <Badge 
                    variant="outline" 
                    className={
                      complianceStatus.color === "green" 
                        ? "bg-green-500/10 text-green-600 border-green-500/20" 
                        : complianceStatus.color === "yellow" 
                        ? "bg-yellow-500/10 text-yellow-600 border-yellow-500/20" 
                        : "bg-red-500/10 text-red-600 border-red-500/20"
                    }
                  >
                    {complianceStatus.label}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  {getMonthYearLabel(currentMonthYear)} • {complianceLoading ? "Loading..." : `${getOverallProgress()}% of checklist items completed`}
                </p>
                <Progress 
                  value={complianceLoading ? 0 : getOverallProgress()} 
                  className="h-2" 
                />
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        {/* Compliance History */}
        {history.length > 1 && (
          <Card className="card-elevated">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Compliance History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {history.slice(0, 6).map((month) => (
                  <div 
                    key={month.monthYear} 
                    className={`flex items-center gap-4 p-3 rounded-lg ${
                      month.monthYear === currentMonthYear 
                        ? "bg-primary/5 border border-primary/20" 
                        : "bg-muted/30"
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      month.status.color === "green" 
                        ? "bg-green-500/10" 
                        : month.status.color === "yellow" 
                        ? "bg-yellow-500/10" 
                        : "bg-red-500/10"
                    }`}>
                      {month.status.color === "green" ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      ) : month.status.color === "yellow" ? (
                        <AlertTriangle className="w-5 h-5 text-yellow-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-foreground">
                          {month.label}
                        </span>
                        {month.monthYear === currentMonthYear && (
                          <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                            Current
                          </Badge>
                        )}
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${
                            month.status.color === "green" 
                              ? "bg-green-500/10 text-green-600 border-green-500/20" 
                              : month.status.color === "yellow" 
                              ? "bg-yellow-500/10 text-yellow-600 border-yellow-500/20" 
                              : "bg-red-500/10 text-red-600 border-red-500/20"
                          }`}
                        >
                          {month.status.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3">
                        <Progress value={month.progress} className="h-2 flex-1" />
                        <span className="text-sm text-muted-foreground w-12 text-right">
                          {month.progress}%
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {month.completedItems} of {month.totalItems} items completed
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Missing Documents Alert */}
        <Card className="card-elevated border-l-4 border-l-yellow-500">
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <AlertCircle className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-1">Missing Documents</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Upload these to improve your audit readiness:
                </p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(categoryLabels)
                    .filter(([key]) => !documentCounts[key] && key !== "other")
                    .slice(0, 6)
                    .map(([key, label]) => (
                      <Badge key={key} variant="outline" className="bg-muted">
                        {label}
                      </Badge>
                    ))}
                </div>
                <Button 
                  variant="link" 
                  className="px-0 mt-2"
                  onClick={() => navigate("/compliance/documents")}
                >
                  Upload missing documents <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="card-elevated hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/compliance/documents")}>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Upload className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Document Vault</h3>
                <p className="text-sm text-muted-foreground">Upload & manage compliance docs</p>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground ml-auto" />
            </CardContent>
          </Card>

          <Card className="card-elevated hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/compliance/labour-ohs")}>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Labour & OHS</h3>
                <p className="text-sm text-muted-foreground">PPE, training & incidents</p>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground ml-auto" />
            </CardContent>
          </Card>

          <Card className="card-elevated hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/compliance/chemicals")}>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Beaker className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Chemicals & Remedies</h3>
                <p className="text-sm text-muted-foreground">Inventory & applications</p>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground ml-auto" />
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
