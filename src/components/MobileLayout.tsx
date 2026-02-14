import React from "react";
import { AppLogo } from "./AppLogo"; // Sesuaikan path jika perlu
import { Home, Search, ClipboardList, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface MobileLayoutProps {
  children: React.ReactNode;
  activeTab: "home" | "search" | "orders" | "account";
  onTabChange: (tab: any) => void;
  searchTerm?: string;
  onSearch: (val: string) => void;
  onCartClick: () => void;
  cartCount: number;
}

export const MobileLayout: React.FC<MobileLayoutProps> = ({
  children,
  activeTab,
  onTabChange,
}) => {
  const navigate = useNavigate();

  // ICON SIZE TETAP 24 (Besar & Jelas)
  const tabs = [
    {
      id: "home",
      label: "Beranda",
      icon: <Home size={24} strokeWidth={2.5} />,
    },
    {
      id: "search",
      label: "Cari",
      icon: <Search size={24} strokeWidth={2.5} />,
    },
    {
      id: "orders",
      label: "Pesanan",
      icon: <ClipboardList size={24} strokeWidth={2.5} />,
    },
    {
      id: "account",
      label: "Saya",
      icon: <User size={24} strokeWidth={2.5} />,
    },
  ];

  const handleTabClick = (tabId: string) => {
    if (tabId === "account") {
      navigate("/portal");
    } else {
      onTabChange(tabId);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex flex-col font-sans overflow-x-hidden text-left">
      {/* AREA KONTEN UTAMA */}
      {/* pb-20: Saya kurangi dari pb-32 karena navbarnya sekarang sudah slim */}
      <main className="flex-1 w-full max-w-[1200px] mx-auto bg-white min-h-screen relative pt-[64px] md:pt-[74px] pb-20 md:pb-10 isolate">
        <div className="flex flex-col m-0 p-0 [&>*]:first:mt-0 bg-white">
          {children}
        </div>
      </main>

      {/* --- NAVIGASI BAWAH SLIM & FLAT --- */}
      {/* PERUBAHAN CSS:
          1. Menghapus 'rounded-t-[2rem]' -> Agar kotak rata bawah.
          2. Menghapus 'pb-10' dan 'pt-4' -> Diganti tinggi fix h-[54px].
          3. Menambah 'border-t' -> Garis tipis pemisah di atas.
      */}
      <nav className="fixed bottom-0 left-0 right-0 w-full bg-white border-t border-slate-200 flex justify-around items-end h-[54px] pb-1 z-[2000] shadow-[0_-2px_10px_rgba(0,0,0,0.03)] md:hidden">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.id)}
            // CSS TOMBOL:
            // h-full: Memenuhi tinggi nav
            // gap-0.5: Jarak icon ke teks sangat rapat (biar slim)
            className={`flex-1 h-full flex flex-col items-center justify-center gap-0.5 transition-all active:bg-slate-50 ${
              activeTab === tab.id
                ? "text-teal-600" // Warna aktif
                : "text-slate-400" // Warna mati
            }`}
          >
            {/* ICON CONTAINER */}
            <div
              className={`transition-transform duration-200 ${activeTab === tab.id ? "-translate-y-0.5" : ""}`}
            >
              {tab.icon}
            </div>

            {/* LABEL TEKS */}
            {/* text-[9px]: Font kecil tapi tebal agar muat di bar pendek */}
            <span className="text-[9px] font-bold uppercase tracking-wide leading-none text-center">
              {tab.label}
            </span>
          </button>
        ))}
      </nav>

      {/* FOOTER DESKTOP */}
      <footer className="hidden md:block bg-white border-t border-slate-200 py-10 mt-auto">
        <div className="max-w-[1200px] mx-auto px-4 grid grid-cols-4 gap-8 text-left">
          <div>
            <h4 className="font-black text-slate-700 mb-4 uppercase text-[10px] tracking-widest">
              Layanan Pelanggan
            </h4>
            <ul className="text-xs text-slate-500 space-y-2 font-medium">
              <li>Pusat Bantuan</li>
              <li>Metode Pembayaran</li>
              <li>Lacak Pesanan</li>
            </ul>
          </div>
          <div>
            <h4 className="font-black text-slate-700 mb-4 uppercase text-[10px] tracking-widest">
              Jelajahi Pasarqu
            </h4>
            <ul className="text-xs text-slate-500 space-y-2 font-medium">
              <li>Tentang Kami</li>
              <li>Kebijakan Privasi</li>
              <li>Blog Pasarqu</li>
            </ul>
          </div>
          <div className="col-span-2 text-right">
            <AppLogo
              size="sm"
              regionName="PASARQU"
              className="justify-end mb-4 opacity-80"
            />
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              © 2026 Pasarqu Ecosystem. All Rights Reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MobileLayout;
