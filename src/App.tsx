import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { FarmProvider } from "@/hooks/useFarm";
import { SubscriptionProvider } from "@/hooks/useSubscription";
import Dashboard from "./pages/Dashboard";
import Livestock from "./pages/Livestock";
import Feeding from "./pages/Feeding";
import Inventory from "./pages/Inventory";
import Health from "./pages/Health";
import Reports from "./pages/Reports";
import Tracking from "./pages/Tracking";
import Audit from "./pages/Audit";
import Auth from "./pages/Auth";
import MarketArea from "./pages/MarketArea";
import ComplianceDashboard from "./pages/ComplianceDashboard";
import DocumentVault from "./pages/DocumentVault";
import LabourOHS from "./pages/LabourOHS";
import ChemicalsRemedies from "./pages/ChemicalsRemedies";
import AuditPackBuilder from "./pages/AuditPackBuilder";
import Pricing from "./pages/Pricing";
import Employees from "./pages/Employees";
import AnimalSale from "./pages/AnimalSale";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <FarmProvider>
        <SubscriptionProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/livestock" element={<Livestock />} />
                <Route path="/feeding" element={<Feeding />} />
                <Route path="/inventory" element={<Inventory />} />
                <Route path="/health" element={<Health />} />
                <Route path="/audit" element={<Audit />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/tracking" element={<Tracking />} />
                <Route path="/market" element={<MarketArea />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/compliance" element={<ComplianceDashboard />} />
                <Route path="/compliance/audit-pack" element={<AuditPackBuilder />} />
                <Route path="/compliance/documents" element={<DocumentVault />} />
                <Route path="/compliance/labour-ohs" element={<LabourOHS />} />
                <Route path="/compliance/chemicals" element={<ChemicalsRemedies />} />
                <Route path="/employees" element={<Employees />} />
                <Route path="/animal-sale" element={<AnimalSale />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </SubscriptionProvider>
      </FarmProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
