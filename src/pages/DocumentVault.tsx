import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useFarm } from "@/hooks/useFarm";
import {
  FileText,
  Upload,
  Search,
  Trash2,
  Download,
  Filter,
  Plus,
  File,
  Calendar,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type DocumentCategory = 
  | "uif" | "coida" | "payslips_payroll" | "employment_contracts"
  | "ohs_risk_assessments" | "ppe_register" | "incident_register" | "first_aid"
  | "animal_id_ownership" | "movement_records" | "vet_letters"
  | "chemical_purchase_invoices" | "chemical_stock_records" | "chemical_application_records"
  | "water_use_authorisation" | "borehole_abstraction_logs" | "abattoir_meat_safety" | "other";

interface ComplianceDocument {
  id: string;
  farm_id: string;
  title: string;
  category: DocumentCategory;
  file_url: string;
  file_name: string;
  uploaded_by: string | null;
  date_of_document: string | null;
  notes: string | null;
  created_at: string;
}

const categoryLabels: Record<DocumentCategory, string> = {
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

const categoryGroups = {
  "Labour & Employment": ["uif", "coida", "payslips_payroll", "employment_contracts"],
  "Health & Safety": ["ohs_risk_assessments", "ppe_register", "incident_register", "first_aid"],
  "Livestock": ["animal_id_ownership", "movement_records", "vet_letters"],
  "Chemicals": ["chemical_purchase_invoices", "chemical_stock_records", "chemical_application_records"],
  "Water & Environment": ["water_use_authorisation", "borehole_abstraction_logs"],
  "Other": ["abattoir_meat_safety", "other"],
};

export default function DocumentVault() {
  const { user } = useAuth();
  const { farm } = useFarm();
  const { toast } = useToast();
  const [documents, setDocuments] = useState<ComplianceDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");

  // Upload form state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadCategory, setUploadCategory] = useState<DocumentCategory>("other");
  const [uploadDate, setUploadDate] = useState("");
  const [uploadNotes, setUploadNotes] = useState("");

  useEffect(() => {
    if (farm?.id) {
      fetchDocuments();
    }
  }, [farm?.id]);

  const fetchDocuments = async () => {
    if (!farm?.id) return;

    const { data, error } = await supabase
      .from("compliance_documents")
      .select("*")
      .eq("farm_id", farm.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching documents:", error);
      toast({ title: "Error", description: "Failed to load documents", variant: "destructive" });
    } else {
      setDocuments(data || []);
    }
    setLoading(false);
  };

  const handleUpload = async () => {
    if (!uploadFile || !uploadTitle || !farm?.id || !user?.id) {
      toast({ title: "Missing Information", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    setUploading(true);

    try {
      // Upload file to storage
      const fileExt = uploadFile.name.split(".").pop();
      const fileName = `${farm.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("compliance-documents")
        .upload(fileName, uploadFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("compliance-documents")
        .getPublicUrl(fileName);

      // Create document record
      const { error: insertError } = await supabase
        .from("compliance_documents")
        .insert({
          farm_id: farm.id,
          title: uploadTitle,
          category: uploadCategory,
          file_url: urlData.publicUrl,
          file_name: uploadFile.name,
          uploaded_by: user.id,
          date_of_document: uploadDate || null,
          notes: uploadNotes || null,
        });

      if (insertError) throw insertError;

      toast({ title: "Document Uploaded", description: `${uploadTitle} has been saved.` });
      setIsUploadOpen(false);
      resetUploadForm();
      fetchDocuments();
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({ title: "Upload Failed", description: error.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const resetUploadForm = () => {
    setUploadFile(null);
    setUploadTitle("");
    setUploadCategory("other");
    setUploadDate("");
    setUploadNotes("");
  };

  const deleteDocument = async (doc: ComplianceDocument) => {
    // Delete from storage
    const filePath = doc.file_url.split("/").slice(-2).join("/");
    await supabase.storage.from("compliance-documents").remove([filePath]);

    // Delete record
    const { error } = await supabase
      .from("compliance_documents")
      .delete()
      .eq("id", doc.id);

    if (error) {
      toast({ title: "Error", description: "Failed to delete document", variant: "destructive" });
    } else {
      toast({ title: "Deleted", description: "Document has been removed" });
      fetchDocuments();
    }
  };

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.file_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === "all" || doc.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  if (!user || !farm) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-[60vh] text-center">
          <FileText className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Sign in Required</h2>
          <p className="text-muted-foreground">Please sign in to access the Document Vault.</p>
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
            <h1 className="text-3xl font-bold font-display text-foreground">Document Vault</h1>
            <p className="text-muted-foreground mt-1">Store and manage compliance documents</p>
          </div>
          <Button onClick={() => setIsUploadOpen(true)} className="bg-gradient-primary text-primary-foreground">
            <Upload className="w-4 h-4 mr-2" />
            Upload Document
          </Button>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {Object.entries(categoryLabels).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Documents Grid */}
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading documents...</div>
        ) : filteredDocuments.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No documents found</p>
            <Button variant="outline" className="mt-4" onClick={() => setIsUploadOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Upload your first document
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDocuments.map((doc) => (
              <div key={doc.id} className="card-elevated p-4 group">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <File className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-foreground truncate">{doc.title}</h3>
                    <p className="text-xs text-muted-foreground truncate">{doc.file_name}</p>
                    <Badge variant="outline" className="mt-2 text-xs">
                      {categoryLabels[doc.category]}
                    </Badge>
                    {doc.date_of_document && (
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(doc.date_of_document).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => window.open(doc.file_url, "_blank")}
                  >
                    <Download className="w-3 h-3 mr-1" />
                    Download
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteDocument(doc)}
                  >
                    <Trash2 className="w-3 h-3 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Upload Dialog */}
        <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="font-display">Upload Document</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>File</Label>
                <Input
                  type="file"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                />
              </div>
              <div>
                <Label>Title</Label>
                <Input
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="e.g., UIF Certificate 2026"
                />
              </div>
              <div>
                <Label>Category</Label>
                <Select value={uploadCategory} onValueChange={(v) => setUploadCategory(v as DocumentCategory)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(categoryGroups).map(([group, categories]) => (
                      <div key={group}>
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">{group}</div>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {categoryLabels[cat as DocumentCategory]}
                          </SelectItem>
                        ))}
                      </div>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Document Date (optional)</Label>
                <Input
                  type="date"
                  value={uploadDate}
                  onChange={(e) => setUploadDate(e.target.value)}
                />
              </div>
              <div>
                <Label>Notes (optional)</Label>
                <Textarea
                  value={uploadNotes}
                  onChange={(e) => setUploadNotes(e.target.value)}
                  placeholder="Any additional notes..."
                  rows={2}
                />
              </div>
            </div>
            <Button onClick={handleUpload} disabled={uploading} className="w-full bg-gradient-primary text-primary-foreground">
              {uploading ? "Uploading..." : "Upload Document"}
            </Button>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
