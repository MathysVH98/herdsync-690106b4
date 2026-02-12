import { Layout } from "@/components/Layout";
import { TasksSection } from "@/components/tasks";
import { useEmployeePermissions } from "@/hooks/useEmployeePermissions";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

export default function EmployeeTasks() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Employee Tasks</h1>
          <p className="text-muted-foreground">Manage and track tasks assigned to staff</p>
        </div>
        <TasksSection />
      </div>
    </Layout>
  );
}
