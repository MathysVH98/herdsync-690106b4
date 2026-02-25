import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";

interface ExpenseItem {
  expense_date: string;
  category: string;
  description: string;
  amount: number;
  supplier_vendor: string | null;
  receipt_reference: string | null;
}

interface EmployeeItem {
  first_name: string;
  last_name: string;
  role: string;
  salary: number | null;
}

interface CategorySummary {
  category: string;
  total: number;
}

interface ExpensesPdfData {
  farmName: string;
  selectedMonth: string;
  expenses: ExpenseItem[];
  employees: EmployeeItem[];
  expensesByCategory: CategorySummary[];
  monthlyExpenseTotal: number;
  totalSalaries: number;
  grandTotal: number;
}

export function useExpensesPdf() {
  const generateExpensesPdf = (data: ExpensesPdfData) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const monthLabel = format(new Date(data.selectedMonth + "-01"), "MMMM yyyy");
    let y = 15;

    // ── Header bar ──
    doc.setFillColor(34, 87, 52);
    doc.rect(0, 0, pageWidth, 40, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("Farm Expense Report", 14, 18);

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(data.farmName, 14, 26);
    doc.text(`Period: ${monthLabel}`, 14, 33);

    doc.setFontSize(9);
    doc.text(`Generated: ${new Date().toLocaleDateString("en-ZA")}`, pageWidth - 14, 33, { align: "right" });

    doc.setTextColor(0, 0, 0);
    y = 50;

    // ── Executive Summary ──
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("Financial Summary", 14, y);
    y += 8;

    autoTable(doc, {
      startY: y,
      head: [["Metric", "Amount (ZAR)"]],
      body: [
        ["Operating Expenses", `R ${data.monthlyExpenseTotal.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}`],
        ["Employee Salaries", `R ${data.totalSalaries.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}`],
        ["Total Transactions", data.expenses.length.toString()],
        ["Active Employees", data.employees.length.toString()],
      ],
      theme: "plain",
      headStyles: { fillColor: [34, 87, 52], textColor: 255, fontStyle: "bold", fontSize: 10 },
      bodyStyles: { fontSize: 10 },
      alternateRowStyles: { fillColor: [245, 247, 245] },
      margin: { left: 14, right: 14 },
      columnStyles: { 1: { halign: "right", fontStyle: "bold" } },
    });

    y = (doc as any).lastAutoTable.finalY + 5;

    // Grand total highlight row
    autoTable(doc, {
      startY: y,
      body: [["TOTAL MONTHLY COST", `R ${data.grandTotal.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}`]],
      theme: "plain",
      bodyStyles: { fillColor: [34, 87, 52], textColor: 255, fontStyle: "bold", fontSize: 12 },
      margin: { left: 14, right: 14 },
      columnStyles: { 1: { halign: "right" } },
    });

    y = (doc as any).lastAutoTable.finalY + 15;

    // ── Category Breakdown ──
    if (data.expensesByCategory.length > 0) {
      if (y > 230) { doc.addPage(); y = 20; }

      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.text("Expenses by Category", 14, y);
      y += 8;

      const catTotal = data.expensesByCategory.reduce((s, c) => s + c.total, 0);
      autoTable(doc, {
        startY: y,
        head: [["Category", "Amount (ZAR)", "% of Total"]],
        body: data.expensesByCategory.map((c) => [
          c.category,
          `R ${c.total.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}`,
          catTotal > 0 ? `${((c.total / catTotal) * 100).toFixed(1)}%` : "0%",
        ]),
        foot: [["Total", `R ${catTotal.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}`, "100%"]],
        theme: "striped",
        headStyles: { fillColor: [34, 87, 52], textColor: 255, fontSize: 10 },
        footStyles: { fillColor: [34, 87, 52], textColor: 255, fontStyle: "bold", fontSize: 10 },
        bodyStyles: { fontSize: 9 },
        margin: { left: 14, right: 14 },
        columnStyles: { 1: { halign: "right" }, 2: { halign: "center" } },
      });

      y = (doc as any).lastAutoTable.finalY + 15;
    }

    // ── Employee Salaries ──
    if (data.employees.length > 0) {
      if (y > 220) { doc.addPage(); y = 20; }

      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.text("Employee Salaries", 14, y);
      y += 8;

      autoTable(doc, {
        startY: y,
        head: [["Employee", "Role", "Monthly Salary (ZAR)"]],
        body: data.employees.map((e) => [
          `${e.first_name} ${e.last_name}`,
          e.role,
          `R ${(e.salary || 0).toLocaleString("en-ZA", { minimumFractionDigits: 2 })}`,
        ]),
        foot: [["", "Total", `R ${data.totalSalaries.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}`]],
        theme: "striped",
        headStyles: { fillColor: [34, 87, 52], textColor: 255, fontSize: 10 },
        footStyles: { fillColor: [34, 87, 52], textColor: 255, fontStyle: "bold", fontSize: 10 },
        bodyStyles: { fontSize: 9 },
        margin: { left: 14, right: 14 },
        columnStyles: { 2: { halign: "right" } },
      });

      y = (doc as any).lastAutoTable.finalY + 15;
    }

    // ── Detailed Transactions ──
    if (data.expenses.length > 0) {
      if (y > 200) { doc.addPage(); y = 20; }

      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.text("Detailed Transactions", 14, y);
      y += 8;

      autoTable(doc, {
        startY: y,
        head: [["Date", "Category", "Description", "Supplier", "Ref #", "Amount (ZAR)"]],
        body: data.expenses.map((e) => [
          format(new Date(e.expense_date), "dd MMM yyyy"),
          e.category,
          e.description,
          e.supplier_vendor || "-",
          e.receipt_reference || "-",
          `R ${Number(e.amount).toLocaleString("en-ZA", { minimumFractionDigits: 2 })}`,
        ]),
        foot: [["", "", "", "", "Total", `R ${data.monthlyExpenseTotal.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}`]],
        theme: "striped",
        headStyles: { fillColor: [34, 87, 52], textColor: 255, fontSize: 9 },
        footStyles: { fillColor: [34, 87, 52], textColor: 255, fontStyle: "bold", fontSize: 9 },
        bodyStyles: { fontSize: 8 },
        margin: { left: 14, right: 14 },
        columnStyles: { 5: { halign: "right" } },
      });
    }

    // ── Footer on all pages ──
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      const pageH = doc.internal.pageSize.getHeight();

      // Footer line
      doc.setDrawColor(34, 87, 52);
      doc.setLineWidth(0.5);
      doc.line(14, pageH - 15, pageWidth - 14, pageH - 15);

      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100);
      doc.text(`${data.farmName} — Confidential`, 14, pageH - 10);
      doc.text(`Page ${i} of ${pageCount}`, pageWidth - 14, pageH - 10, { align: "right" });
      doc.setTextColor(0, 0, 0);
    }

    const fileName = `${data.farmName.replace(/\s+/g, "_")}_Expenses_${data.selectedMonth}.pdf`;
    doc.save(fileName);
  };

  return { generateExpensesPdf };
}
