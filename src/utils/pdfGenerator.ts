import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const generateOfficialPDF = async (
  title: string, 
  subtitle: string, 
  headers: string[][], 
  data: any[][], 
  fileName: string
) => {
  const doc = new jsPDF();
  const date = new Date().toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  // --- 1. PROSES LOAD LOGO ---
  const logoUrl = "https://rutyhzpctkfsshckiuqn.supabase.co/storage/v1/object/public/assets/Logo%20Pasarqu.png";

  const addLogo = (url: string): Promise<void> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = url;
      img.crossOrigin = "Anonymous"; 
      img.onload = () => {
        doc.addImage(img, 'PNG', 15, 12, 23, 23); 
        resolve();
      };
      img.onerror = () => {
        resolve();
      };
    });
  };

  await addLogo(logoUrl);

  // --- 2. KOP SURAT (PASARQU INDONESIA) ---
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  
  const pasarText = "PASAR";
  const quText = "QU";
  const indoText = " INDONESIA";
  const fullText = "PASARQU INDONESIA";
  
  const totalWidth = doc.getTextWidth(fullText);
  const startX = 105 - (totalWidth / 2);
  
  doc.setTextColor(0, 128, 128); // Tosca
  doc.text(pasarText, startX, 20);
  
  const quX = startX + doc.getTextWidth(pasarText);
  doc.setTextColor(255, 102, 0); // Orange
  doc.text(quText, quX, 20);
  
  const indoX = quX + doc.getTextWidth(quText);
  doc.setTextColor(0, 128, 128); // Tosca
  doc.text(indoText, indoX, 20);

  // --- 3. ALAMAT RESMI ---
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  doc.text("Digital Modern Marketplace - Solusi UMKM Indonesia", 105, 27, { align: "center" });
  doc.text("Jl. A. Yani RT. 08 Muara Jawa Ulu - Kec. Muara Jawa", 105, 32, { align: "center" });
  doc.text("Kutai Kartanegara, Kalimantan Timur | support@pasarqu.id", 105, 36, { align: "center" });
  
  doc.setDrawColor(0, 128, 128);
  doc.setLineWidth(0.8);
  doc.line(15, 42, 195, 42); 
  doc.setLineWidth(0.2);
  doc.line(15, 44, 195, 44);

  // --- 4. DATA LAPORAN ---
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0);
  doc.text(title.toUpperCase(), 15, 55);
  
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(subtitle, 15, 60);
  doc.text(`Cetak: ${date}`, 195, 60, { align: "right" });

  // --- 5. TABEL UTAMA ---
  autoTable(doc, {
    startY: 65,
    head: headers,
    body: data,
    headStyles: { fillColor: [0, 128, 128], textColor: [255, 255, 255], fontStyle: "bold" },
    styles: { fontSize: 8, cellPadding: 2, font: "helvetica" },
    alternateRowStyles: { fillColor: [245, 250, 250] },
    margin: { left: 15, right: 15 },
  });

  // --- 6. PENGESAHAN (FOOTER) ---
  const finalY = (doc as any).lastAutoTable.finalY + 20;
  if (finalY < 250) { 
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");

    // ✅ PENGESAHAN: PASARQU INDONESIA (Dua Warna)
    const footerStartX = 150;
    
    // PASAR (Tosca)
    doc.setTextColor(0, 128, 128);
    doc.text("PASAR", footerStartX, finalY);
    
    // QU (Orange)
    const footerQuX = footerStartX + doc.getTextWidth("PASAR");
    doc.setTextColor(255, 102, 0);
    doc.text("QU", footerQuX, finalY);

    // INDONESIA (Tosca)
    const footerIndoX = footerQuX + doc.getTextWidth("QU");
    doc.setTextColor(0, 128, 128);
    doc.text(" INDONESIA,", footerIndoX, finalY);

    // IDENTITAS PAK KENDY
    doc.setTextColor(0); // Kembali ke Hitam
    doc.setFont("helvetica", "bold");
    doc.text("Kendy Yong Assa", 150, finalY + 25);
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("Founder & CEO", 150, finalY + 30);
    
    // FOOTER TEKS OTOMATIS
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(150);
    doc.text("Laporan digital ini sah dan dihasilkan secara otomatis oleh sistem PASARQU.", 15, finalY + 40);
  }

  doc.save(`${fileName}.pdf`);
};