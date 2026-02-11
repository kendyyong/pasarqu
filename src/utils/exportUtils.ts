import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

export const exportToPDF = (title: string, data: any[]) => {
  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("PT. PASAR MJ NUSANTARA", 105, 20, { align: "center" });
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Laporan Resmi Super Admin", 105, 26, { align: "center" });
  doc.line(15, 30, 195, 30);
  doc.text(title.toUpperCase(), 105, 40, { align: "center" });

  const tableColumn = ["Nama", "Role", "Email", "HP", "Pasar", "Status"];
  const tableRows = data.map((u) => [
    u.name,
    u.role,
    u.email,
    u.phone_number,
    u.markets?.name || "-",
    u.is_verified ? "AKTIF" : "PENDING",
  ]);

  // @ts-ignore
  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 50,
    theme: "grid",
  });
  doc.save(`${title}_${Date.now()}.pdf`);
};

export const exportToExcel = (title: string, data: any[]) => {
  const formattedData = data.map((u) => ({
    Nama: u.name,
    Role: u.role,
    Email: u.email,
    HP: u.phone_number,
    Pasar: u.markets?.name || "-",
    Status: u.is_verified ? "AKTIF" : "PENDING",
  }));
  const worksheet = XLSX.utils.json_to_sheet(formattedData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
  XLSX.writeFile(workbook, `${title}_${Date.now()}.xlsx`);
};
