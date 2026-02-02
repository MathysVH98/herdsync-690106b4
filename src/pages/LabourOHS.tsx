import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useFarm } from "@/hooks/useFarm";
import {
  HardHat,
  GraduationCap,
  AlertTriangle,
  Plus,
  Trash2,
  Edit,
  Calendar,
  User,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PPEIssue {
  id: string;
  farm_id: string;
  employee_name: string;
  ppe_item: string;
  issue_date: string;
  next_due_date: string | null;
  notes: string | null;
}

interface TrainingRecord {
  id: string;
  farm_id: string;
  employee_name: string;
  training_type: string;
  training_date: string;
  provider: string | null;
  certificate_url: string | null;
  notes: string | null;
}

type IncidentSeverity = "minor" | "moderate" | "serious" | "critical";

interface Incident {
  id: string;
  farm_id: string;
  incident_date: string;
  description: string;
  severity: IncidentSeverity;
  action_taken: string | null;
  closed: boolean;
}

const severityColors: Record<IncidentSeverity, string> = {
  minor: "bg-green-500/10 text-green-600 border-green-500/20",
  moderate: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  serious: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  critical: "bg-red-500/10 text-red-600 border-red-500/20",
};

export default function LabourOHS() {
  const { user } = useAuth();
  const { farm } = useFarm();
  const { toast } = useToast();

  const [ppeIssues, setPpeIssues] = useState<PPEIssue[]>([]);
  const [trainingRecords, setTrainingRecords] = useState<TrainingRecord[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog states
  const [isPPEOpen, setIsPPEOpen] = useState(false);
  const [isTrainingOpen, setIsTrainingOpen] = useState(false);
  const [isIncidentOpen, setIsIncidentOpen] = useState(false);

  // Form states
  const [editingPPE, setEditingPPE] = useState<PPEIssue | null>(null);
  const [editingTraining, setEditingTraining] = useState<TrainingRecord | null>(null);
  const [editingIncident, setEditingIncident] = useState<Incident | null>(null);

  useEffect(() => {
    if (farm?.id) {
      fetchData();
    }
  }, [farm?.id]);

  const fetchData = async () => {
    if (!farm?.id) return;

    const [ppeRes, trainingRes, incidentRes] = await Promise.all([
      supabase.from("ppe_issues").select("*").eq("farm_id", farm.id).order("issue_date", { ascending: false }),
      supabase.from("training_records").select("*").eq("farm_id", farm.id).order("training_date", { ascending: false }),
      supabase.from("incidents").select("*").eq("farm_id", farm.id).order("incident_date", { ascending: false }),
    ]);

    setPpeIssues(ppeRes.data || []);
    setTrainingRecords(trainingRes.data || []);
    setIncidents(incidentRes.data || []);
    setLoading(false);
  };

  // PPE CRUD
  const savePPE = async (data: Partial<PPEIssue>) => {
    if (!farm?.id) return;

    if (editingPPE?.id) {
      const { error } = await supabase.from("ppe_issues").update(data).eq("id", editingPPE.id);
      if (error) throw error;
    } else {
      const insertData = {
        farm_id: farm.id,
        employee_name: data.employee_name!,
        ppe_item: data.ppe_item!,
        issue_date: data.issue_date,
        next_due_date: data.next_due_date,
        notes: data.notes,
      };
      const { error } = await supabase.from("ppe_issues").insert(insertData);
      if (error) throw error;
    }
    toast({ title: "Saved", description: "PPE record saved successfully" });
    setIsPPEOpen(false);
    setEditingPPE(null);
    fetchData();
  };

  const deletePPE = async (id: string) => {
    await supabase.from("ppe_issues").delete().eq("id", id);
    toast({ title: "Deleted", description: "PPE record removed" });
    fetchData();
  };

  // Training CRUD
  const saveTraining = async (data: Partial<TrainingRecord>) => {
    if (!farm?.id) return;

    if (editingTraining?.id) {
      const { error } = await supabase.from("training_records").update(data).eq("id", editingTraining.id);
      if (error) throw error;
    } else {
      const insertData = {
        farm_id: farm.id,
        employee_name: data.employee_name!,
        training_type: data.training_type!,
        training_date: data.training_date!,
        provider: data.provider,
        notes: data.notes,
      };
      const { error } = await supabase.from("training_records").insert(insertData);
      if (error) throw error;
    }
    toast({ title: "Saved", description: "Training record saved successfully" });
    setIsTrainingOpen(false);
    setEditingTraining(null);
    fetchData();
  };

  const deleteTraining = async (id: string) => {
    await supabase.from("training_records").delete().eq("id", id);
    toast({ title: "Deleted", description: "Training record removed" });
    fetchData();
  };

  // Incident CRUD
  const saveIncident = async (data: Partial<Incident>) => {
    if (!farm?.id) return;

    if (editingIncident?.id) {
      const { error } = await supabase.from("incidents").update(data).eq("id", editingIncident.id);
      if (error) throw error;
    } else {
      const insertData = {
        farm_id: farm.id,
        description: data.description!,
        incident_date: data.incident_date,
        severity: data.severity,
        action_taken: data.action_taken,
      };
      const { error } = await supabase.from("incidents").insert(insertData);
      if (error) throw error;
    }
    toast({ title: "Saved", description: "Incident record saved successfully" });
    setIsIncidentOpen(false);
    setEditingIncident(null);
    fetchData();
  };

  const deleteIncident = async (id: string) => {
    await supabase.from("incidents").delete().eq("id", id);
    toast({ title: "Deleted", description: "Incident removed" });
    fetchData();
  };

  const toggleIncidentClosed = async (incident: Incident) => {
    await supabase.from("incidents").update({ closed: !incident.closed }).eq("id", incident.id);
    fetchData();
  };

  if (!user || !farm) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-[60vh] text-center">
          <HardHat className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Sign in Required</h2>
          <p className="text-muted-foreground">Please sign in to access Labour & OHS.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold font-display text-foreground">Labour & OHS</h1>
          <p className="text-muted-foreground mt-1">Manage PPE, training records, and incidents</p>
        </div>

        <Tabs defaultValue="ppe" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
            <TabsTrigger value="ppe" className="gap-2">
              <HardHat className="w-4 h-4" />
              <span className="hidden sm:inline">PPE Issues</span>
            </TabsTrigger>
            <TabsTrigger value="training" className="gap-2">
              <GraduationCap className="w-4 h-4" />
              <span className="hidden sm:inline">Training</span>
            </TabsTrigger>
            <TabsTrigger value="incidents" className="gap-2">
              <AlertTriangle className="w-4 h-4" />
              <span className="hidden sm:inline">Incidents</span>
            </TabsTrigger>
          </TabsList>

          {/* PPE Tab */}
          <TabsContent value="ppe" className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => { setEditingPPE(null); setIsPPEOpen(true); }}>
                <Plus className="w-4 h-4 mr-2" />
                Add PPE Issue
              </Button>
            </div>
            {ppeIssues.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">No PPE records yet</div>
            ) : (
              <div className="space-y-3">
                {ppeIssues.map((ppe) => (
                  <div key={ppe.id} className="card-elevated p-4 group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <HardHat className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-foreground">{ppe.ppe_item}</h4>
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <User className="w-3 h-3" /> {ppe.employee_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Issued: {new Date(ppe.issue_date).toLocaleDateString()}
                          {ppe.next_due_date && ` • Due: ${new Date(ppe.next_due_date).toLocaleDateString()}`}
                        </p>
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" onClick={() => { setEditingPPE(ppe); setIsPPEOpen(true); }}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deletePPE(ppe.id)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Training Tab */}
          <TabsContent value="training" className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => { setEditingTraining(null); setIsTrainingOpen(true); }}>
                <Plus className="w-4 h-4 mr-2" />
                Add Training Record
              </Button>
            </div>
            {trainingRecords.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">No training records yet</div>
            ) : (
              <div className="space-y-3">
                {trainingRecords.map((training) => (
                  <div key={training.id} className="card-elevated p-4 group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <GraduationCap className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-foreground">{training.training_type}</h4>
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <User className="w-3 h-3" /> {training.employee_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3 inline mr-1" />
                          {new Date(training.training_date).toLocaleDateString()}
                          {training.provider && ` • ${training.provider}`}
                        </p>
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" onClick={() => { setEditingTraining(training); setIsTrainingOpen(true); }}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteTraining(training.id)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Incidents Tab */}
          <TabsContent value="incidents" className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => { setEditingIncident(null); setIsIncidentOpen(true); }}>
                <Plus className="w-4 h-4 mr-2" />
                Report Incident
              </Button>
            </div>
            {incidents.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">No incidents reported</div>
            ) : (
              <div className="space-y-3">
                {incidents.map((incident) => (
                  <div key={incident.id} className="card-elevated p-4 group">
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${incident.closed ? "bg-muted" : "bg-destructive/10"}`}>
                        {incident.closed ? (
                          <CheckCircle2 className="w-5 h-5 text-muted-foreground" />
                        ) : (
                          <AlertTriangle className="w-5 h-5 text-destructive" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-foreground">{incident.description.slice(0, 50)}...</h4>
                          <Badge variant="outline" className={severityColors[incident.severity]}>
                            {incident.severity}
                          </Badge>
                          {incident.closed && <Badge variant="outline">Closed</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground">{incident.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          <Calendar className="w-3 h-3 inline mr-1" />
                          {new Date(incident.incident_date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" onClick={() => toggleIncidentClosed(incident)}>
                          {incident.closed ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => { setEditingIncident(incident); setIsIncidentOpen(true); }}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteIncident(incident.id)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* PPE Dialog */}
        <PPEDialog
          open={isPPEOpen}
          onOpenChange={setIsPPEOpen}
          editing={editingPPE}
          onSave={savePPE}
        />

        {/* Training Dialog */}
        <TrainingDialog
          open={isTrainingOpen}
          onOpenChange={setIsTrainingOpen}
          editing={editingTraining}
          onSave={saveTraining}
        />

        {/* Incident Dialog */}
        <IncidentDialog
          open={isIncidentOpen}
          onOpenChange={setIsIncidentOpen}
          editing={editingIncident}
          onSave={saveIncident}
        />
      </div>
    </Layout>
  );
}

// Sub-components for dialogs
function PPEDialog({ open, onOpenChange, editing, onSave }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: PPEIssue | null;
  onSave: (data: Partial<PPEIssue>) => void;
}) {
  const [employeeName, setEmployeeName] = useState("");
  const [ppeItem, setPpeItem] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [nextDueDate, setNextDueDate] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (editing) {
      setEmployeeName(editing.employee_name);
      setPpeItem(editing.ppe_item);
      setIssueDate(editing.issue_date);
      setNextDueDate(editing.next_due_date || "");
      setNotes(editing.notes || "");
    } else {
      setEmployeeName("");
      setPpeItem("");
      setIssueDate(new Date().toISOString().split("T")[0]);
      setNextDueDate("");
      setNotes("");
    }
  }, [editing, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Edit" : "Add"} PPE Issue</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label>Employee Name</Label>
            <Input value={employeeName} onChange={(e) => setEmployeeName(e.target.value)} />
          </div>
          <div>
            <Label>PPE Item</Label>
            <Input value={ppeItem} onChange={(e) => setPpeItem(e.target.value)} placeholder="e.g., Safety Boots" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Issue Date</Label>
              <Input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
            </div>
            <div>
              <Label>Next Due Date</Label>
              <Input type="date" value={nextDueDate} onChange={(e) => setNextDueDate(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>
        <Button onClick={() => onSave({ employee_name: employeeName, ppe_item: ppeItem, issue_date: issueDate, next_due_date: nextDueDate || null, notes: notes || null })} className="w-full">
          Save
        </Button>
      </DialogContent>
    </Dialog>
  );
}

function TrainingDialog({ open, onOpenChange, editing, onSave }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: TrainingRecord | null;
  onSave: (data: Partial<TrainingRecord>) => void;
}) {
  const [employeeName, setEmployeeName] = useState("");
  const [trainingType, setTrainingType] = useState("");
  const [trainingDate, setTrainingDate] = useState("");
  const [provider, setProvider] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (editing) {
      setEmployeeName(editing.employee_name);
      setTrainingType(editing.training_type);
      setTrainingDate(editing.training_date);
      setProvider(editing.provider || "");
      setNotes(editing.notes || "");
    } else {
      setEmployeeName("");
      setTrainingType("");
      setTrainingDate(new Date().toISOString().split("T")[0]);
      setProvider("");
      setNotes("");
    }
  }, [editing, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Edit" : "Add"} Training Record</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label>Employee Name</Label>
            <Input value={employeeName} onChange={(e) => setEmployeeName(e.target.value)} />
          </div>
          <div>
            <Label>Training Type</Label>
            <Input value={trainingType} onChange={(e) => setTrainingType(e.target.value)} placeholder="e.g., First Aid Level 1" />
          </div>
          <div>
            <Label>Training Date</Label>
            <Input type="date" value={trainingDate} onChange={(e) => setTrainingDate(e.target.value)} />
          </div>
          <div>
            <Label>Provider</Label>
            <Input value={provider} onChange={(e) => setProvider(e.target.value)} placeholder="e.g., SafetyFirst Training" />
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>
        <Button onClick={() => onSave({ employee_name: employeeName, training_type: trainingType, training_date: trainingDate, provider: provider || null, notes: notes || null })} className="w-full">
          Save
        </Button>
      </DialogContent>
    </Dialog>
  );
}

function IncidentDialog({ open, onOpenChange, editing, onSave }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Incident | null;
  onSave: (data: Partial<Incident>) => void;
}) {
  const [incidentDate, setIncidentDate] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<IncidentSeverity>("minor");
  const [actionTaken, setActionTaken] = useState("");

  useEffect(() => {
    if (editing) {
      setIncidentDate(editing.incident_date);
      setDescription(editing.description);
      setSeverity(editing.severity);
      setActionTaken(editing.action_taken || "");
    } else {
      setIncidentDate(new Date().toISOString().split("T")[0]);
      setDescription("");
      setSeverity("minor");
      setActionTaken("");
    }
  }, [editing, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Edit" : "Report"} Incident</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label>Incident Date</Label>
            <Input type="date" value={incidentDate} onChange={(e) => setIncidentDate(e.target.value)} />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe what happened..." rows={3} />
          </div>
          <div>
            <Label>Severity</Label>
            <Select value={severity} onValueChange={(v) => setSeverity(v as IncidentSeverity)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="minor">Minor</SelectItem>
                <SelectItem value="moderate">Moderate</SelectItem>
                <SelectItem value="serious">Serious</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Action Taken</Label>
            <Textarea value={actionTaken} onChange={(e) => setActionTaken(e.target.value)} placeholder="What corrective action was taken?" rows={2} />
          </div>
        </div>
        <Button onClick={() => onSave({ incident_date: incidentDate, description, severity, action_taken: actionTaken || null })} className="w-full">
          Save
        </Button>
      </DialogContent>
    </Dialog>
  );
}
