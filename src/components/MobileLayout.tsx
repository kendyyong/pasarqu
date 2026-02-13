import React from "react";
import { AppLogo } from "./AppLogo";
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

  const tabs = [
    { id: "home", label: "Beranda", icon: <Home size={20} /> },
    { id: "search", label: "Cari", icon: <Search size={20} /> },
    { id: "orders", label: "Pesanan", icon: <ClipboardList size={20} /> },
    { id: "account", label: "Saya", icon: <User size={20} /> },
  ];

  const handleTabClick = (tabId: string) => {
    if (tabId === "account") {
      navigate("/portal");
    } else {
      onTabChange(tabId);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans overflow-x-hidden text-left">
      {/* AREA KONTEN UTAMA 
          pb-32: Kita naikkan padding bawah kontainer utama agar konten tidak tertutup bar navigasi yang makin tinggi.
      */}
      <main className="flex-1 w-full max-w-[1200px] mx-auto bg-white min-h-screen relative pt-[64px] md:pt-[74px] pb-32 md:pb-10 isolate">
        <div className="flex flex-col m-0 p-0 [&>*]:first:mt-0 bg-white">
          {children}
        </div>
      </main>

      {/* NAVIGASI BAWAH YANG DINAIKKAN:
          - pb-10: Memberikan ruang ekstra 40px di bawah tombol (Sangat Tinggi & Nyaman).
          - pt-4: Memberikan ruang napas di atas ikon.
          - rounded-t-[2rem]: Lengkungan lebih tegas agar terlihat estetik saat naik ke atas.
          - shadow-2xl: Shadow lebih kuat agar bar terlihat "melayang" di atas konten.
      */}
      <nav className="fixed bottom-0 left-0 right-0 w-full bg-white border-t border-slate-100 flex justify-around items-center pt-4 pb-10 z-[2000] shadow-[0_-10px_25px_rgba(0,0,0,0.08)] md:hidden rounded-t-[2rem]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.id)}
            className={`flex flex-col items-center gap-1.5 flex-1 transition-all active:scale-90 ${
              activeTab === tab.id
                ? "text-teal-600 font-bold"
                : "text-slate-400"
            }`}
          >
            <div className="mb-0.5">{tab.icon}</div>
            <span className="text-[10px] font-black uppercase tracking-widest text-center">
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
