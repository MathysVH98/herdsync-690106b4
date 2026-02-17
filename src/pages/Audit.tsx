import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ClipboardCheck,
  Shield,
  FileText,
  Calendar,
  Plus,
  Download,
  CheckCircle2,
  AlertCircle,
  Clock,
  Trash2,
  Bug,
  Pill,
  Truck,
  Users,
  Leaf,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useFarm } from "@/hooks/useFarm";
import { useNavigate } from "react-router-dom";
import { useMonthlyCompliance, getMonthYearLabel } from "@/hooks/useMonthlyCompliance";

interface ComplianceRecord {
  id: string;
  type: "treatment" | "movement" | "safety" | "chemical" | "incident";
  title: string;
  date: string;
  details: string;
  status: "compliant" | "pending" | "review";
}

interface ScheduledAudit {
  id: string;
  name: string;
  date: string;
  type: string;
  status: "upcoming" | "overdue" | "completed";
}

const categoryIcons: Record<string, React.ElementType> = {
  "animal-welfare": Shield,
  "biosecurity": Bug,
  "chemical-use": Pill,
  "traceability": Truck,
  "staff-safety": Users,
  "sustainability": Leaf,
};

const initialRecords: ComplianceRecord[] = [
  { id: "1", type: "treatment", title: "Vaccination - Clostridial", date: "2026-01-28", details: "100 cattle vaccinated with 7-in-1. Batch #VX2026-001. WHP: 0 days, ESI: 0 days.", status: "compliant" },
  { id: "2", type: "movement", title: "Cattle Transport to Saleyard", date: "2026-01-25", details: "25 steers transported. eNVD #ENV-2026-0125 submitted. Destination: Regional Saleyards.", status: "compliant" },
  { id: "3", type: "safety", title: "Staff Training - Chemical Handling", date: "2026-01-20", details: "3 staff completed ChemCert refresher training. Certificates updated.", status: "compliant" },
  { id: "4", type: "chemical", title: "Drench Application", date: "2026-01-15", details: "200 sheep drenched with Ivermectin. WHP: 14 days, ESI: 42 days. Expires: 2026-01-29.", status: "pending" },
  { id: "5", type: "incident", title: "Minor Equipment Incident", date: "2026-01-10", details: "ATV rollover during paddock check. No injuries. Equipment damage minimal. Report filed.", status: "review" },
];

const initialAudits: ScheduledAudit[] = [
  { id: "1", name: "LPA Annual Audit", date: "2026-03-15", type: "Livestock Production Assurance", status: "upcoming" },
  { id: "2", name: "Biosecurity Inspection", date: "2026-02-01", type: "State Biosecurity", status: "overdue" },
  { id: "3", name: "Safety Compliance Check", date: "2026-01-05", type: "Workplace Safety", status: "completed" },
];

const recordTypeIcons = {
  treatment: Pill,
  movement: Truck,
  safety: Users,
  chemical: AlertTriangle,
  incident: AlertCircle,
};

const statusColors = {
  compliant: "bg-green-500/10 text-green-600 border-green-500/20",
  pending: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  review: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  upcoming: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  overdue: "bg-red-500/10 text-red-600 border-red-500/20",
  completed: "bg-green-500/10 text-green-600 border-green-500/20",
};

export default function Audit() {
  const { user } = useAuth();
  const { farm } = useFarm();
  const navigate = useNavigate();
  const [records, setRecords] = useState<ComplianceRecord[]>(initialRecords);
  const [audits, setAudits] = useState<ScheduledAudit[]>(initialAudits);
  const [isAddRecordOpen, setIsAddRecordOpen] = useState(false);
  const [isAddAuditOpen, setIsAddAuditOpen] = useState(false);
  const [newRecord, setNewRecord] = useState({ type: "treatment", title: "", details: "" });
  const [newAudit, setNewAudit] = useState({ name: "", date: "", type: "" });
  const { toast } = useToast();

  const {
    loading,
    categories,
    currentMonthYear,
    toggleItem,
    getOverallProgress,
    getCategoryProgress,
    getComplianceStatus,
  } = useMonthlyCompliance();

  const complianceStatus = getComplianceStatus();

  const addRecord = () => {
    if (!newRecord.title || !newRecord.details) {
      toast({ title: "Missing Information", description: "Please fill in all fields.", variant: "destructive" });
      return;
    }
    const record: ComplianceRecord = {
      id: Date.now().toString(),
      type: newRecord.type as ComplianceRecord["type"],
      title: newRecord.title,
      date: new Date().toISOString().split("T")[0],
      details: newRecord.details,
      status: "pending",
    };
    setRecords([record, ...records]);
    setNewRecord({ type: "treatment", title: "", details: "" });
    setIsAddRecordOpen(false);
    toast({ title: "Record Added", description: "Compliance record has been saved." });
  };

  const addAudit = () => {
    if (!newAudit.name || !newAudit.date || !newAudit.type) {
      toast({ title: "Missing Information", description: "Please fill in all fields.", variant: "destructive" });
      return;
    }
    const audit: ScheduledAudit = {
      id: Date.now().toString(),
      name: newAudit.name,
      date: newAudit.date,
      type: newAudit.type,
      status: "upcoming",
    };
    setAudits([audit, ...audits]);
    setNewAudit({ name: "", date: "", type: "" });
    setIsAddAuditOpen(false);
    toast({ title: "Audit Scheduled", description: `${audit.name} scheduled for ${audit.date}.` });
  };

  const removeRecord = (id: string) => {
    setRecords(records.filter(r => r.id !== id));
    toast({ title: "Record Removed", description: "Compliance record has been deleted." });
  };

  const removeAudit = (id: string) => {
    setAudits(audits.filter(a => a.id !== id));
    toast({ title: "Audit Removed", description: "Scheduled audit has been removed." });
  };

  const generateReport = () => {
    import("jspdf").then(({ default: jsPDF }) => {
      import("jspdf-autotable").then((autoTableModule) => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();

        // Title
        doc.setFontSize(20);
        doc.text("Audit & Compliance Report", pageWidth / 2, 20, { align: "center" });
        doc.setFontSize(11);
        doc.text(`Farm: ${farm?.name || "N/A"}`, pageWidth / 2, 28, { align: "center" });
        doc.text(`Generated: ${new Date().toLocaleDateString("en-ZA")}`, pageWidth / 2, 34, { align: "center" });

        let y = 44;

        // Monthly Compliance Summary
        doc.setFontSize(14);
        doc.text(`Monthly Compliance - ${getMonthYearLabel(currentMonthYear)}`, 14, y);
        y += 6;
        doc.setFontSize(10);
        doc.text(`Overall Progress: ${getOverallProgress()}% | Status: ${complianceStatus.label}`, 14, y);
        y += 8;

        // Checklist categories table
        const categoryRows = categories.map((cat) => {
          const completed = cat.items.filter((i) => i.completed).length;
          return [cat.name, `${completed}/${cat.items.length}`, `${getCategoryProgress(cat.id)}%`];
        });

        (doc as any).autoTable({
          startY: y,
          head: [["Category", "Items Completed", "Progress"]],
          body: categoryRows,
          theme: "grid",
          headStyles: { fillColor: [56, 96, 56] },
          margin: { left: 14, right: 14 },
        });

        y = (doc as any).lastAutoTable.finalY + 10;

        // Compliance Records
        if (y > 240) { doc.addPage(); y = 20; }
        doc.setFontSize(14);
        doc.text("Compliance Records", 14, y);
        y += 4;

        const recordRows = records.map((r) => [
          r.date,
          r.type.charAt(0).toUpperCase() + r.type.slice(1),
          r.title,
          r.status.charAt(0).toUpperCase() + r.status.slice(1),
        ]);

        (doc as any).autoTable({
          startY: y,
          head: [["Date", "Type", "Title", "Status"]],
          body: recordRows,
          theme: "grid",
          headStyles: { fillColor: [56, 96, 56] },
          margin: { left: 14, right: 14 },
        });

        y = (doc as any).lastAutoTable.finalY + 10;

        // Scheduled Audits
        if (y > 240) { doc.addPage(); y = 20; }
        doc.setFontSize(14);
        doc.text("Scheduled Audits", 14, y);
        y += 4;

        const auditRows = audits.map((a) => [a.date, a.name, a.type, a.status.charAt(0).toUpperCase() + a.status.slice(1)]);

        (doc as any).autoTable({
          startY: y,
          head: [["Date", "Name", "Type", "Status"]],
          body: auditRows,
          theme: "grid",
          headStyles: { fillColor: [56, 96, 56] },
          margin: { left: 14, right: 14 },
        });

        doc.save(`Audit_Report_${farm?.name || "Farm"}_${new Date().toISOString().split("T")[0]}.pdf`);

        toast({
          title: "Report Downloaded",
          description: "Your audit report PDF has been downloaded.",
        });
      });
    });
  };

  if (!user) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-[60vh] text-center">
          <ClipboardCheck className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Sign in Required</h2>
          <p className="text-muted-foreground mb-4">Please sign in to access Audit & Compliance.</p>
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
          <p className="text-muted-foreground mb-4">Create a farm to start using Audit & Compliance.</p>
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
              Audit & Compliance
            </h1>
            <p className="text-muted-foreground mt-1">
              Keep your farm audit-ready with real-time record keeping and one-click reports
            </p>
          </div>
          <Button onClick={generateReport} className="bg-gradient-primary text-primary-foreground">
            <Download className="w-4 h-4 mr-2" />
            Generate Audit Report
          </Button>
        </div>

        {/* Overall Progress with Month Info */}
        <div className="card-elevated p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <ClipboardCheck className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="font-display font-semibold text-lg text-foreground">
                  Monthly Compliance - {getMonthYearLabel(currentMonthYear)}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {loading ? "Loading..." : `${getOverallProgress()}% of checklist items complete`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right text-xs text-muted-foreground hidden sm:block">
                <RefreshCw className="w-3 h-3 inline mr-1" />
                Resets monthly
              </div>
              <Badge 
                variant="outline" 
                className={
                  complianceStatus.color === "green" 
                    ? statusColors.compliant 
                    : complianceStatus.color === "yellow" 
                    ? statusColors.pending 
                    : statusColors.review
                }
              >
                {complianceStatus.label}
              </Badge>
            </div>
          </div>
          <Progress value={loading ? 0 : getOverallProgress()} className="h-3" />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="checklists" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
            <TabsTrigger value="checklists" className="gap-2">
              <ClipboardCheck className="w-4 h-4" />
              <span className="hidden sm:inline">Checklists</span>
            </TabsTrigger>
            <TabsTrigger value="records" className="gap-2">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Records</span>
            </TabsTrigger>
            <TabsTrigger value="audits" className="gap-2">
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">Audits</span>
            </TabsTrigger>
          </TabsList>

          {/* Checklists Tab */}
          <TabsContent value="checklists" className="space-y-4">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="card-elevated p-4 animate-pulse">
                    <div className="h-10 bg-muted rounded mb-4" />
                    <div className="h-2 bg-muted rounded mb-4" />
                    <div className="h-8 bg-muted rounded" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {categories.map((category) => {
                  const CategoryIcon = categoryIcons[category.id] || Shield;
                  const progress = getCategoryProgress(category.id);
                  return (
                    <div key={category.id} className="card-elevated p-4">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <CategoryIcon className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-display font-semibold text-foreground">{category.name}</h3>
                          <p className="text-xs text-muted-foreground">{progress}% complete</p>
                        </div>
                        <Badge 
                          variant="outline" 
                          className={progress === 100 ? statusColors.compliant : progress >= 60 ? statusColors.pending : statusColors.review}
                        >
                          {category.items.filter(i => i.completed).length}/{category.items.length}
                        </Badge>
                      </div>
                      <Progress value={progress} className="h-2 mb-4" />
                      <Accordion type="single" collapsible>
                        <AccordionItem value="items" className="border-none">
                          <AccordionTrigger className="text-sm text-muted-foreground py-2 hover:no-underline">
                            View checklist items
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-2 pt-2">
                              {category.items.map((item) => (
                                <div 
                                  key={item.id}
                                  className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                                >
                                  <Checkbox 
                                    checked={item.completed}
                                    onCheckedChange={() => toggleItem(item.id, item.completed)}
                                    className="mt-0.5"
                                  />
                                  <div className="flex-1">
                                    <span className={`text-sm ${item.completed ? "text-muted-foreground line-through" : "text-foreground"}`}>
                                      {item.item_text}
                                    </span>
                                    {item.completed && item.completed_at && (
                                      <p className="text-xs text-muted-foreground mt-0.5">
                                        Completed {new Date(item.completed_at).toLocaleDateString("en-ZA")}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Records Tab */}
          <TabsContent value="records" className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                {records.length} compliance records
              </p>
              <Button onClick={() => setIsAddRecordOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Record
              </Button>
            </div>
            <div className="space-y-3">
              {records.map((record) => {
                const TypeIcon = recordTypeIcons[record.type];
                return (
                  <div key={record.id} className="card-elevated p-4 group">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <TypeIcon className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-foreground">{record.title}</h4>
                          <Badge variant="outline" className={statusColors[record.status]}>
                            {record.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{record.details}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {record.date}
                          <span className="capitalize">• {record.type}</span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeRecord(record.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>

          {/* Audits Tab */}
          <TabsContent value="audits" className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                {audits.filter(a => a.status === "upcoming").length} upcoming audits
              </p>
              <Button onClick={() => setIsAddAuditOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Schedule Audit
              </Button>
            </div>
            <div className="space-y-3">
              {audits.map((audit) => (
                <div key={audit.id} className="card-elevated p-4 group">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      audit.status === "overdue" ? "bg-destructive/10" : 
                      audit.status === "completed" ? "bg-primary/10" : "bg-accent"
                    }`}>
                      {audit.status === "completed" ? (
                        <CheckCircle2 className="w-5 h-5 text-primary" />
                      ) : audit.status === "overdue" ? (
                        <AlertCircle className="w-5 h-5 text-destructive" />
                      ) : (
                        <Calendar className="w-5 h-5 text-accent-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-foreground">{audit.name}</h4>
                        <Badge variant="outline" className={statusColors[audit.status]}>
                          {audit.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{audit.type}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        <Clock className="w-3 h-3 inline mr-1" />
                        {audit.date}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeAudit(audit.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Add Record Dialog */}
        <Dialog open={isAddRecordOpen} onOpenChange={setIsAddRecordOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-display">Add Compliance Record</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Record Type</Label>
                <Select value={newRecord.type} onValueChange={(v) => setNewRecord({ ...newRecord, type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="treatment">Treatment</SelectItem>
                    <SelectItem value="movement">Movement</SelectItem>
                    <SelectItem value="safety">Safety</SelectItem>
                    <SelectItem value="chemical">Chemical</SelectItem>
                    <SelectItem value="incident">Incident</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Title</Label>
                <Input 
                  value={newRecord.title}
                  onChange={(e) => setNewRecord({ ...newRecord, title: e.target.value })}
                  placeholder="e.g., Vaccination - Clostridial"
                />
              </div>
              <div>
                <Label>Details</Label>
                <Textarea 
                  value={newRecord.details}
                  onChange={(e) => setNewRecord({ ...newRecord, details: e.target.value })}
                  placeholder="Include batch numbers, WHP/ESI, quantities, etc."
                  rows={4}
                />
              </div>
            </div>
            <Button onClick={addRecord} className="w-full bg-gradient-primary text-primary-foreground">
              <Plus className="w-4 h-4 mr-2" />
              Add Record
            </Button>
          </DialogContent>
        </Dialog>

        {/* Add Audit Dialog */}
        <Dialog open={isAddAuditOpen} onOpenChange={setIsAddAuditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-display">Schedule Audit</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Audit Name</Label>
                <Input 
                  value={newAudit.name}
                  onChange={(e) => setNewAudit({ ...newAudit, name: e.target.value })}
                  placeholder="e.g., LPA Annual Audit"
                />
              </div>
              <div>
                <Label>Date</Label>
                <Input 
                  type="date"
                  value={newAudit.date}
                  onChange={(e) => setNewAudit({ ...newAudit, date: e.target.value })}
                />
              </div>
              <div>
                <Label>Audit Type</Label>
                <Input 
                  value={newAudit.type}
                  onChange={(e) => setNewAudit({ ...newAudit, type: e.target.value })}
                  placeholder="e.g., Livestock Production Assurance"
                />
              </div>
            </div>
            <Button onClick={addAudit} className="w-full bg-gradient-primary text-primary-foreground">
              <Plus className="w-4 h-4 mr-2" />
              Schedule Audit
            </Button>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
