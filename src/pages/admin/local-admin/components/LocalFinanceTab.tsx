import React from "react";
// ... import lainnya

// ✅ TAMBAHKAN ATAU PASTIKAN INTERFACE INI ADA
interface LocalFinanceTabProps {
  merchants: any[];
  couriers: any[];
}

// ✅ PASTIKAN KOMPONEN MENGGUNAKAN PROPS TERSEBUT
export const LocalFinanceTab: React.FC<LocalFinanceTabProps> = ({
  merchants,
  couriers,
}) => {
  // Isi kode Juragan tetap sama seperti sebelumnya...
  return <div>{/* Konten Finance Juragan */}</div>;
};
