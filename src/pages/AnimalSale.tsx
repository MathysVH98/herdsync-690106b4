import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/hooks/useAuth";
import { useFarm } from "@/hooks/useFarm";
import { useAnimalSales, AnimalSale as AnimalSaleType } from "@/hooks/useAnimalSales";
import { AnimalSaleForm } from "@/components/animal-sale/AnimalSaleForm";
import { format } from "date-fns";
import { FileText, Plus, Eye } from "lucide-react";

export default function AnimalSale() {
  const { user } = useAuth();
  const { farm } = useFarm();
  const { sales, loading, fetchSales } = useAnimalSales();
  
  const [view, setView] = useState<"list" | "form">("list");
  const [editingSale, setEditingSale] = useState<AnimalSaleType | undefined>(undefined);

  const handleNewSale = () => {
    setEditingSale(undefined);
    setView("form");
  };

  const handleViewSale = (sale: AnimalSaleType) => {
    setEditingSale(sale);
    setView("form");
  };

  const handleBack = () => {
    setView("list");
    setEditingSale(undefined);
    fetchSales();
  };

  if (!user || !farm) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-[60vh] text-center">
          <FileText className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Sign in Required</h2>
          <p className="text-muted-foreground">Please sign in to create animal sales.</p>
        </div>
      </Layout>
    );
  }

  if (view === "form") {
    return (
      <Layout>
        <AnimalSaleForm 
          existingSale={editingSale} 
          onBack={handleBack}
          onSaved={fetchSales}
        />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-display text-foreground">Animal Sales</h1>
            <p className="text-muted-foreground mt-1">
              Create and manage Bills of Sale for your livestock
            </p>
          </div>
          <Button onClick={handleNewSale}>
            <Plus className="w-4 h-4 mr-2" />
            New Sale
          </Button>
        </div>

        {/* Sales List */}
        <Card>
          <CardHeader>
            <CardTitle>Sales History</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading sales...</div>
            ) : sales.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No sales yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first Bill of Sale by clicking the button above.
                </p>
                <Button onClick={handleNewSale}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Sale
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sale Number</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Buyer</TableHead>
                    <TableHead>Seller</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell className="font-medium">{sale.sale_number}</TableCell>
                      <TableCell>
                        {format(new Date(sale.sale_date), "dd MMM yyyy")}
                      </TableCell>
                      <TableCell>{sale.buyer_name}</TableCell>
                      <TableCell>{sale.seller_name}</TableCell>
                      <TableCell>R {(sale.total_amount || 0).toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={sale.sale_status === "finalized" ? "default" : "secondary"}
                        >
                          {sale.sale_status === "finalized" ? "Finalized" : "Draft"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewSale(sale)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
