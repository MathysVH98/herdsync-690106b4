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
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  notes?: string;
}

interface ChecklistCategory {
  id: string;
  name: string;
  icon: React.ElementType;
  items: ChecklistItem[];
}

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

const initialChecklists: ChecklistCategory[] = [
  {
    id: "animal-welfare",
    name: "Animal Welfare",
    icon: Shield,
    items: [
      { id: "aw1", text: "Adequate food and water available", completed: true },
      { id: "aw2", text: "Appropriate shelter and living conditions", completed: true },
      { id: "aw3", text: "Regular health monitoring documented", completed: false },
      { id: "aw4", text: "Humane handling procedures in place", completed: true },
      { id: "aw5", text: "Pain management protocols documented", completed: false },
    ],
  },
  {
    id: "biosecurity",
    name: "Biosecurity",
    icon: Bug,
    items: [
      { id: "bs1", text: "Biosecurity plan documented and current", completed: true },
      { id: "bs2", text: "Visitor log maintained", completed: false },
      { id: "bs3", text: "Quarantine procedures documented", completed: true },
      { id: "bs4", text: "Vehicle and equipment cleaning protocols", completed: false },
      { id: "bs5", text: "Disease outbreak response plan", completed: true },
    ],
  },
  {
    id: "chemical-use",
    name: "Chemical Use",
    icon: Pill,
    items: [
      { id: "ch1", text: "Chemical storage meets regulations", completed: true },
      { id: "ch2", text: "All treatments recorded with WHP/ESI", completed: true },
      { id: "ch3", text: "Chemical inventory current", completed: false },
      { id: "ch4", text: "Staff trained in chemical handling", completed: true },
      { id: "ch5", text: "Disposal procedures documented", completed: false },
    ],
  },
  {
    id: "traceability",
    name: "Traceability",
    icon: Truck,
    items: [
      { id: "tr1", text: "All animals identified with NLIS tags", completed: true },
      { id: "tr2", text: "Movement records up to date", completed: true },
      { id: "tr3", text: "NVDs/eNVDs properly completed", completed: true },
      { id: "tr4", text: "Deceased animal records maintained", completed: false },
      { id: "tr5", text: "Birth and purchase records complete", completed: true },
    ],
  },
  {
    id: "staff-safety",
    name: "Staff Safety",
    icon: Users,
    items: [
      { id: "ss1", text: "Safety induction completed for all staff", completed: true },
      { id: "ss2", text: "PPE available and properly maintained", completed: false },
      { id: "ss3", text: "First aid kits stocked and accessible", completed: true },
      { id: "ss4", text: "Emergency procedures documented", completed: true },
      { id: "ss5", text: "Incident reporting system in place", completed: true },
    ],
  },
  {
    id: "sustainability",
    name: "Sustainability",
    icon: Leaf,
    items: [
      { id: "su1", text: "Grazing rotation plan documented", completed: true },
      { id: "su2", text: "Water usage monitoring in place", completed: false },
      { id: "su3", text: "Pasture condition assessments recorded", completed: false },
      { id: "su4", text: "Environmental impact measures documented", completed: false },
      { id: "su5", text: "Carbon footprint tracking initiated", completed: false },
    ],
  },
];

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
  const [checklists, setChecklists] = useState<ChecklistCategory[]>(initialChecklists);
  const [records, setRecords] = useState<ComplianceRecord[]>(initialRecords);
  const [audits, setAudits] = useState<ScheduledAudit[]>(initialAudits);
  const [isAddRecordOpen, setIsAddRecordOpen] = useState(false);
  const [isAddAuditOpen, setIsAddAuditOpen] = useState(false);
  const [newRecord, setNewRecord] = useState({ type: "treatment", title: "", details: "" });
  const [newAudit, setNewAudit] = useState({ name: "", date: "", type: "" });
  const { toast } = useToast();

  const toggleChecklistItem = (categoryId: string, itemId: string) => {
    setChecklists(prev => prev.map(cat => {
      if (cat.id === categoryId) {
        return {
          ...cat,
          items: cat.items.map(item => 
            item.id === itemId ? { ...item, completed: !item.completed } : item
          ),
        };
      }
      return cat;
    }));
  };

  const getCategoryProgress = (category: ChecklistCategory) => {
    const completed = category.items.filter(i => i.completed).length;
    return Math.round((completed / category.items.length) * 100);
  };

  const getOverallProgress = () => {
    const allItems = checklists.flatMap(c => c.items);
    const completed = allItems.filter(i => i.completed).length;
    return Math.round((completed / allItems.length) * 100);
  };

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
    toast({ 
      title: "Report Generated", 
      description: "Your compliance report has been prepared and is ready for download.",
    });
  };

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

        {/* Overall Progress */}
        <div className="card-elevated p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <ClipboardCheck className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="font-display font-semibold text-lg text-foreground">
                  Overall Compliance
                </h2>
                <p className="text-sm text-muted-foreground">
                  {getOverallProgress()}% of checklist items complete
                </p>
              </div>
            </div>
            <Badge 
              variant="outline" 
              className={getOverallProgress() >= 80 ? statusColors.compliant : getOverallProgress() >= 50 ? statusColors.pending : statusColors.review}
            >
              {getOverallProgress() >= 80 ? "Audit Ready" : getOverallProgress() >= 50 ? "Needs Attention" : "Action Required"}
            </Badge>
          </div>
          <Progress value={getOverallProgress()} className="h-3" />
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {checklists.map((category) => {
                const CategoryIcon = category.icon;
                const progress = getCategoryProgress(category);
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
                                  onCheckedChange={() => toggleChecklistItem(category.id, item.id)}
                                  className="mt-0.5"
                                />
                                <span className={`text-sm ${item.completed ? "text-muted-foreground line-through" : "text-foreground"}`}>
                                  {item.text}
                                </span>
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
