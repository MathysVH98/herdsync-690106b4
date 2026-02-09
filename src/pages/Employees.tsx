import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useFarm } from "@/hooks/useFarm";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, UserMinus, Edit, Users, UserCheck, UserX, Phone, Mail, ShieldCheck, KeyRound, ClipboardList } from "lucide-react";
import { format } from "date-fns";
import { InviteEmployeeDialog } from "@/components/InviteEmployeeDialog";
import { TasksSection } from "@/components/tasks";

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  id_number: string | null;
  tax_number: string | null;
  uif_registered: boolean | null;
  phone: string | null;
  email: string | null;
  role: string;
  start_date: string;
  end_date: string | null;
  salary: number | null;
  address: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  notes: string | null;
  status: string;
}

const roleOptions = [
  "Farm Manager",
  "Farm Worker",
  "Herdsman",
  "Veterinary Assistant",
  "Equipment Operator",
  "Security",
  "Administrative",
  "Seasonal Worker",
  "Other",
];

export default function Employees() {
  const { farm } = useFarm();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    id_number: "",
    tax_number: "",
    uif_registered: false,
    phone: "",
    email: "",
    role: "Farm Worker",
    start_date: format(new Date(), "yyyy-MM-dd"),
    salary: "",
    address: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    notes: "",
  });

  const { data: employees = [], isLoading } = useQuery({
    queryKey: ["employees", farm?.id],
    queryFn: async () => {
      if (!farm?.id) return [];
      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .eq("farm_id", farm.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Employee[];
    },
    enabled: !!farm?.id,
  });

  const addMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!farm?.id) throw new Error("No farm selected");
      const { error } = await supabase.from("employees").insert({
        farm_id: farm.id,
        first_name: data.first_name,
        last_name: data.last_name,
        id_number: data.id_number || null,
        tax_number: data.tax_number || null,
        uif_registered: data.uif_registered,
        phone: data.phone || null,
        email: data.email || null,
        role: data.role,
        start_date: data.start_date,
        salary: data.salary ? parseFloat(data.salary) : 0,
        address: data.address || null,
        emergency_contact_name: data.emergency_contact_name || null,
        emergency_contact_phone: data.emergency_contact_phone || null,
        notes: data.notes || null,
        status: "active",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees", farm?.id] });
      setIsAddDialogOpen(false);
      resetForm();
      toast({ title: "Employee added successfully" });
    },
    onError: (error) => {
      toast({ title: "Error adding employee", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase
        .from("employees")
        .update({
          first_name: data.first_name,
          last_name: data.last_name,
          id_number: data.id_number || null,
          tax_number: data.tax_number || null,
          uif_registered: data.uif_registered,
          phone: data.phone || null,
          email: data.email || null,
          role: data.role,
          start_date: data.start_date,
          salary: data.salary ? parseFloat(data.salary) : 0,
          address: data.address || null,
          emergency_contact_name: data.emergency_contact_name || null,
          emergency_contact_phone: data.emergency_contact_phone || null,
          notes: data.notes || null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees", farm?.id] });
      setIsEditDialogOpen(false);
      setSelectedEmployee(null);
      resetForm();
      toast({ title: "Employee updated successfully" });
    },
    onError: (error) => {
      toast({ title: "Error updating employee", description: error.message, variant: "destructive" });
    },
  });

  const terminateMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("employees")
        .update({
          status: "terminated",
          end_date: format(new Date(), "yyyy-MM-dd"),
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees", farm?.id] });
      setIsDeleteDialogOpen(false);
      setSelectedEmployee(null);
      toast({ title: "Employee removed successfully" });
    },
    onError: (error) => {
      toast({ title: "Error removing employee", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      first_name: "",
      last_name: "",
      id_number: "",
      tax_number: "",
      uif_registered: false,
      phone: "",
      email: "",
      role: "Farm Worker",
      start_date: format(new Date(), "yyyy-MM-dd"),
      salary: "",
      address: "",
      emergency_contact_name: "",
      emergency_contact_phone: "",
      notes: "",
    });
  };

  const handleEdit = (employee: Employee) => {
    setSelectedEmployee(employee);
    setFormData({
      first_name: employee.first_name,
      last_name: employee.last_name,
      id_number: employee.id_number || "",
      tax_number: employee.tax_number || "",
      uif_registered: employee.uif_registered ?? false,
      phone: employee.phone || "",
      email: employee.email || "",
      role: employee.role,
      start_date: employee.start_date,
      salary: employee.salary?.toString() || "",
      address: employee.address || "",
      emergency_contact_name: employee.emergency_contact_name || "",
      emergency_contact_phone: employee.emergency_contact_phone || "",
      notes: employee.notes || "",
    });
    setIsEditDialogOpen(true);
  };

  const activeEmployees = employees.filter((e) => e.status === "active");
  const formerEmployees = employees.filter((e) => e.status === "terminated");

  const filteredActive = activeEmployees.filter(
    (e) =>
      e.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredFormer = formerEmployees.filter(
    (e) =>
      e.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalSalaries = activeEmployees.reduce((sum, e) => sum + (e.salary || 0), 0);
  const uifRegisteredCount = activeEmployees.filter((e) => e.uif_registered).length;
  const uifNotRegisteredCount = activeEmployees.length - uifRegisteredCount;

  const formContent = (
    <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="first_name">First Name *</Label>
          <Input
            id="first_name"
            value={formData.first_name}
            onChange={(e) => setFormData((prev) => ({ ...prev, first_name: e.target.value }))}
            placeholder="John"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="last_name">Last Name *</Label>
          <Input
            id="last_name"
            value={formData.last_name}
            onChange={(e) => setFormData((prev) => ({ ...prev, last_name: e.target.value }))}
            placeholder="Doe"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="id_number">ID Number</Label>
          <Input
            id="id_number"
            value={formData.id_number}
            onChange={(e) => setFormData((prev) => ({ ...prev, id_number: e.target.value }))}
            placeholder="SA ID Number"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tax_number">Tax Number</Label>
          <Input
            id="tax_number"
            value={formData.tax_number}
            onChange={(e) => setFormData((prev) => ({ ...prev, tax_number: e.target.value }))}
            placeholder="SARS Tax Number"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="role">Role *</Label>
        <Select value={formData.role} onValueChange={(v) => setFormData((prev) => ({ ...prev, role: v }))}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {roleOptions.map((role) => (
              <SelectItem key={role} value={role}>
                {role}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
            placeholder="+27 XX XXX XXXX"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
            placeholder="john@example.com"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="start_date">Start Date *</Label>
          <Input
            id="start_date"
            type="date"
            value={formData.start_date}
            onChange={(e) => setFormData((prev) => ({ ...prev, start_date: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="salary">Monthly Salary (ZAR)</Label>
          <Input
            id="salary"
            type="number"
            value={formData.salary}
            onChange={(e) => setFormData((prev) => ({ ...prev, salary: e.target.value }))}
            placeholder="0.00"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Input
          id="address"
          value={formData.address}
          onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
          placeholder="Full address"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="emergency_contact_name">Emergency Contact Name</Label>
          <Input
            id="emergency_contact_name"
            value={formData.emergency_contact_name}
            onChange={(e) => setFormData((prev) => ({ ...prev, emergency_contact_name: e.target.value }))}
            placeholder="Contact name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="emergency_contact_phone">Emergency Contact Phone</Label>
          <Input
            id="emergency_contact_phone"
            value={formData.emergency_contact_phone}
            onChange={(e) => setFormData((prev) => ({ ...prev, emergency_contact_phone: e.target.value }))}
            placeholder="+27 XX XXX XXXX"
          />
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox
          id="uif_registered"
          checked={formData.uif_registered}
          onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, uif_registered: checked === true }))}
        />
        <Label htmlFor="uif_registered" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          Registered with UIF
        </Label>
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
          placeholder="Additional notes..."
        />
      </div>
    </div>
  );

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Employees</h1>
            <p className="text-muted-foreground">Manage your farm workers and staff</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="w-4 h-4 mr-2" />
                Add Employee
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Employee</DialogTitle>
                <DialogDescription>Enter the employee's details below.</DialogDescription>
              </DialogHeader>
              {formContent}
              <DialogFooter>
                <Button onClick={() => addMutation.mutate(formData)} disabled={!formData.first_name || !formData.last_name}>
                  Add Employee
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary Stats */}
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeEmployees.length}</div>
              <p className="text-xs text-muted-foreground">Active employees</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Payroll</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R {totalSalaries.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Total salaries</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">UIF Registered</CardTitle>
              <ShieldCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{uifRegisteredCount}</div>
              <p className="text-xs text-muted-foreground">
                {uifNotRegisteredCount > 0 ? (
                  <span className="text-destructive">{uifNotRegisteredCount} not registered</span>
                ) : (
                  "All registered"
                )}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Former Staff</CardTitle>
              <UserX className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formerEmployees.length}</div>
              <p className="text-xs text-muted-foreground">Past employees</p>
            </CardContent>
          </Card>
        </div>

        {/* Role Breakdown */}
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">Employees by Role</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {roleOptions.map((role) => {
              const count = activeEmployees.filter((e) => e.role === role).length;
              const hasEmployees = count > 0;
              return (
                <Card
                  key={role}
                  className={`transition-all ${
                    hasEmployees
                      ? "bg-card border-primary/20 cursor-pointer hover:shadow-md hover:border-primary/40"
                      : "bg-transparent border-dashed border-border/50"
                  }`}
                  onClick={() => {
                    if (hasEmployees) {
                      setSelectedRole(role);
                      setIsRoleDialogOpen(true);
                    }
                  }}
                >
                  <CardContent className="p-4">
                    <div className={`text-2xl font-bold ${hasEmployees ? "text-foreground" : "text-muted-foreground/50"}`}>
                      {count}
                    </div>
                    <p className={`text-xs truncate ${hasEmployees ? "text-muted-foreground" : "text-muted-foreground/50"}`} title={role}>
                      {role}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search employees..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="active" className="w-full">
          <TabsList>
            <TabsTrigger value="active">Active ({activeEmployees.length})</TabsTrigger>
            <TabsTrigger value="former">Former ({formerEmployees.length})</TabsTrigger>
            <TabsTrigger value="tasks" className="flex gap-2">
              <ClipboardList className="h-4 w-4" />
              Tasks
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active">
            <Card>
              <CardContent className="pt-6">
                {isLoading ? (
                  <p className="text-center text-muted-foreground py-8">Loading...</p>
                ) : filteredActive.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    {searchQuery ? "No employees match your search" : "No active employees yet"}
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Start Date</TableHead>
                        <TableHead>Salary</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredActive.map((employee) => (
                        <TableRow key={employee.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">
                                {employee.first_name} {employee.last_name}
                              </p>
                              {employee.id_number && (
                                <p className="text-xs text-muted-foreground">ID: {employee.id_number}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{employee.role}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {employee.phone && (
                                <div className="flex items-center gap-1 text-sm">
                                  <Phone className="w-3 h-3" />
                                  {employee.phone}
                                </div>
                              )}
                              {employee.email && (
                                <div className="flex items-center gap-1 text-sm">
                                  <Mail className="w-3 h-3" />
                                  {employee.email}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{format(new Date(employee.start_date), "dd MMM yyyy")}</TableCell>
                          <TableCell>R {(employee.salary || 0).toLocaleString()}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Grant System Access"
                                onClick={() => {
                                  setSelectedEmployee(employee);
                                  setIsInviteDialogOpen(true);
                                }}
                              >
                                <KeyRound className="w-4 h-4 text-primary" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleEdit(employee)}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setSelectedEmployee(employee);
                                  setIsDeleteDialogOpen(true);
                                }}
                              >
                                <UserMinus className="w-4 h-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="former">
            <Card>
              <CardContent className="pt-6">
                {filteredFormer.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No former employees</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Employed</TableHead>
                        <TableHead>End Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredFormer.map((employee) => (
                        <TableRow key={employee.id}>
                          <TableCell>
                            <p className="font-medium">
                              {employee.first_name} {employee.last_name}
                            </p>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{employee.role}</Badge>
                          </TableCell>
                          <TableCell>{format(new Date(employee.start_date), "dd MMM yyyy")}</TableCell>
                          <TableCell>
                            {employee.end_date ? format(new Date(employee.end_date), "dd MMM yyyy") : "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tasks">
            <TasksSection />
          </TabsContent>
        </Tabs>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Employee</DialogTitle>
              <DialogDescription>Update the employee's details.</DialogDescription>
            </DialogHeader>
            {formContent}
            <DialogFooter>
              <Button
                onClick={() => selectedEmployee && updateMutation.mutate({ id: selectedEmployee.id, data: formData })}
                disabled={!formData.first_name || !formData.last_name}
              >
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove Employee</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to remove {selectedEmployee?.first_name} {selectedEmployee?.last_name}? They will
                be moved to the former employees list.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => selectedEmployee && terminateMutation.mutate(selectedEmployee.id)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Role Overview Dialog */}
        <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{selectedRole}</DialogTitle>
              <DialogDescription>
                {activeEmployees.filter((e) => e.role === selectedRole).length} employee(s) in this role
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              {activeEmployees
                .filter((e) => e.role === selectedRole)
                .map((employee) => (
                  <div
                    key={employee.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                  >
                    <div className="space-y-1">
                      <p className="font-medium">
                        {employee.first_name} {employee.last_name}
                      </p>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        {employee.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {employee.phone}
                          </span>
                        )}
                        {employee.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {employee.email}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Started: {format(new Date(employee.start_date), "dd MMM yyyy")}
                        {employee.salary ? ` • R ${employee.salary.toLocaleString()}/month` : ""}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setIsRoleDialogOpen(false);
                        handleEdit(employee);
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
            </div>
          </DialogContent>
        </Dialog>

        {/* Invite Employee Dialog */}
        {selectedEmployee && farm && (
          <InviteEmployeeDialog
            open={isInviteDialogOpen}
            onOpenChange={setIsInviteDialogOpen}
            employeeId={selectedEmployee.id}
            employeeName={`${selectedEmployee.first_name} ${selectedEmployee.last_name}`}
            farmId={farm.id}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ["employees", farm.id] });
            }}
          />
        )}
      </div>
    </Layout>
  );
}
