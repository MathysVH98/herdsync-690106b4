import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { FarmProvider } from "@/hooks/useFarm";
import { SubscriptionProvider } from "@/hooks/useSubscription";
import { EmployeePermissionsProvider } from "@/hooks/useEmployeePermissions";
import { SupportChat } from "@/components/SupportChat";
import Landing from "./pages/Landing";
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
import FarmExpenses from "./pages/FarmExpenses";
import Contact from "./pages/Contact";
import About from "./pages/About";
import Terms from "./pages/Terms";
import Disclaimer from "./pages/Disclaimer";
import AskAPro from "./pages/AskAPro";
import NotFound from "./pages/NotFound";
import Settings from "./pages/Settings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <FarmProvider>
        <SubscriptionProvider>
          <EmployeePermissionsProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<Landing />} />
                  <Route path="/dashboard" element={<Dashboard />} />
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
                  <Route path="/expenses" element={<FarmExpenses />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/terms" element={<Terms />} />
                  <Route path="/disclaimer" element={<Disclaimer />} />
                  <Route path="/ask-a-pro" element={<AskAPro />} />
                  <Route path="/settings" element={<Settings />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
                <SupportChat />
              </BrowserRouter>
            </TooltipProvider>
          </EmployeePermissionsProvider>
        </SubscriptionProvider>
      </FarmProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
