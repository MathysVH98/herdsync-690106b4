import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface LivestockStat {
  name: string;
  count: number;
  avgWeight: number;
  avgAge: string;
}

interface DailyCost {
  name: string;
  daily: number;
  weekly: number;
  monthly: number;
}

interface HealthDataItem {
  name: string;
  value: number;
}

interface FeedConsumptionItem {
  name: string;
  consumption: number;
}

interface ReportData {
  farmName: string;
  totalDailyCost: number;
  totalWeeklyCost: number;
  totalMonthlyCost: number;
  totalAnimals: number;
  livestockStats: LivestockStat[];
  dailyCosts: DailyCost[];
  healthData: HealthDataItem[];
  feedConsumption: FeedConsumptionItem[];
}

export function useReportPdf() {
  const generatePdf = (data: ReportData) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPosition = 20;

    // Header
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("Farm Reports & Analytics", pageWidth / 2, yPosition, { align: "center" });
    
    yPosition += 10;
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Farm: ${data.farmName}`, pageWidth / 2, yPosition, { align: "center" });
    
    yPosition += 5;
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString("en-ZA")}`, pageWidth / 2, yPosition, { align: "center" });

    // Cost Summary Section
    yPosition += 15;
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Cost Summary", 14, yPosition);
    
    yPosition += 8;
    autoTable(doc, {
      startY: yPosition,
      head: [["Metric", "Amount (ZAR)"]],
      body: [
        ["Daily Feed Cost", `R${data.totalDailyCost}`],
        ["Weekly Feed Cost", `R${data.totalWeeklyCost}`],
        ["Monthly Feed Cost", `R${data.totalMonthlyCost}`],
        ["Total Animals", data.totalAnimals.toString()],
      ],
      theme: "striped",
      headStyles: { fillColor: [34, 87, 52] },
      margin: { left: 14, right: 14 },
    });

    yPosition = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;

    // Livestock Statistics
    if (data.livestockStats.length > 0) {
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Livestock Statistics by Type", 14, yPosition);
      
      yPosition += 8;
      autoTable(doc, {
        startY: yPosition,
        head: [["Type", "Count", "Avg Weight (kg)", "Avg Age (yrs)"]],
        body: data.livestockStats.map((stat) => [
          stat.name,
          stat.count.toString(),
          stat.avgWeight.toString(),
          stat.avgAge,
        ]),
        theme: "striped",
        headStyles: { fillColor: [34, 87, 52] },
        margin: { left: 14, right: 14 },
      });

      yPosition = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;
    }

    // Health Status Breakdown
    if (data.healthData.length > 0) {
      // Check if we need a new page
      if (yPosition > 240) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Health Status Breakdown", 14, yPosition);
      
      yPosition += 8;
      autoTable(doc, {
        startY: yPosition,
        head: [["Status", "Count", "Percentage"]],
        body: data.healthData.map((item) => {
          const total = data.healthData.reduce((sum, i) => sum + i.value, 0);
          const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : "0";
          return [item.name, item.value.toString(), `${percentage}%`];
        }),
        theme: "striped",
        headStyles: { fillColor: [34, 87, 52] },
        margin: { left: 14, right: 14 },
      });

      yPosition = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;
    }

    // Daily Feed Costs
    if (data.dailyCosts.length > 0) {
      if (yPosition > 240) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Feed Costs Breakdown", 14, yPosition);
      
      yPosition += 8;
      autoTable(doc, {
        startY: yPosition,
        head: [["Feed Type", "Daily (R)", "Weekly (R)", "Monthly (R)"]],
        body: data.dailyCosts.map((cost) => [
          cost.name,
          cost.daily.toString(),
          cost.weekly.toString(),
          cost.monthly.toString(),
        ]),
        theme: "striped",
        headStyles: { fillColor: [34, 87, 52] },
        margin: { left: 14, right: 14 },
      });

      yPosition = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;
    }

    // Feed Consumption by Animal Type
    if (data.feedConsumption.length > 0) {
      if (yPosition > 240) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Daily Feed Consumption by Animal Type", 14, yPosition);
      
      yPosition += 8;
      autoTable(doc, {
        startY: yPosition,
        head: [["Animal Type", "Daily Consumption (kg)"]],
        body: data.feedConsumption.map((item) => [
          item.name,
          item.consumption.toString(),
        ]),
        theme: "striped",
        headStyles: { fillColor: [34, 87, 52] },
        margin: { left: 14, right: 14 },
      });
    }

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text(
        `Page ${i} of ${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: "center" }
      );
    }

    // Save the PDF
    const fileName = `${data.farmName.replace(/\s+/g, "_")}_Report_${new Date().toISOString().split("T")[0]}.pdf`;
    doc.save(fileName);
  };

  return { generatePdf };
}
