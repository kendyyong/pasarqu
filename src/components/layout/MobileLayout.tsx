import React from "react";
import { Home, Search, ClipboardList, Zap, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface MobileLayoutProps {
  children: React.ReactNode;
  /** * 🛠️ UPDATE TAB:
   * portal -> mitra
   * account ditambahkan kembali
   */
  activeTab: "home" | "search" | "orders" | "mitra" | "account";
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
    {
      id: "home",
      label: "BERANDA",
      icon: <Home size={20} strokeWidth={2.5} />,
    },
    {
      id: "search",
      label: "CARI",
      icon: <Search size={20} strokeWidth={2.5} />,
    },
    {
      id: "orders",
      label: "PESANAN",
      icon: <ClipboardList size={20} strokeWidth={2.5} />,
    },
    {
      id: "mitra", // 🚀 SEBELUMNYA PORTAL
      label: "MITRA",
      icon: (
        <div className="relative">
          <Zap
            size={20}
            strokeWidth={2.5}
            fill={activeTab === "mitra" ? "#FF6600" : "none"}
            className={
              activeTab === "mitra" ? "text-[#FF6600]" : "text-slate-400"
            }
          />
          {/* Dot Orange penanda fitur Mitra */}
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-[#FF6600] rounded-full border border-white animate-pulse"></div>
        </div>
      ),
    },
    {
      id: "account", // 🚀 TOMBOL SAYA DI SEBELAH KANAN
      label: "SAYA",
      icon: <User size={20} strokeWidth={2.5} />,
    },
  ];

  const handleTabClick = (tabId: string) => {
    if (tabId === "mitra") {
      navigate("/portal"); // Tetap mengarah ke route portal
    } else if (tabId === "account") {
      navigate("/customer-dashboard"); // Mengarah ke profil pembeli
    } else {
      onTabChange(tabId);
    }
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] flex flex-col font-black uppercase tracking-tighter overflow-x-hidden text-left">
      {/* AREA KONTEN UTAMA */}
      <main className="flex-1 w-full max-w-[1200px] mx-auto relative pt-0 pb-20 md:pb-10 isolate">
        <div className="flex flex-col m-0 p-0">{children}</div>
      </main>

      {/* --- NAVIGASI BAWAH 5 TOMBOL (HP ONLY) --- */}
      <nav className="fixed bottom-0 left-0 right-0 w-full bg-white border-t border-slate-200 flex justify-around items-end h-[60px] pb-2 z-[2000] shadow-[0_-2px_15px_rgba(0,0,0,0.08)] md:hidden">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.id)}
            className={`flex-1 h-full flex flex-col items-center justify-center gap-1 transition-all active:scale-90 ${
              activeTab === tab.id ? "text-[#008080]" : "text-slate-400"
            }`}
          >
            <div
              className={`transition-all duration-300 ${
                activeTab === tab.id ? "-translate-y-1 scale-110" : ""
              }`}
            >
              {tab.icon}
            </div>
            <span
              className={`text-[8px] font-black leading-none text-center tracking-widest uppercase transition-colors ${
                activeTab === tab.id ? "text-[#008080]" : "text-slate-400"
              }`}
            >
              {tab.label}
            </span>
          </button>
        ))}
      </nav>

      {/* FOOTER DESKTOP */}
      <footer className="hidden md:block bg-white border-t border-slate-100 py-6 mt-auto">
        <div className="max-w-[1200px] mx-auto px-4 flex justify-between items-center">
          <p className="text-[10px] text-slate-400 font-black tracking-widest">
            © 2026 PASARQU ECOSYSTEM. ALL RIGHTS RESERVED.
          </p>
          <div className="flex gap-6 text-[10px] font-black text-slate-400">
            <span>TENTANG KAMI</span>
            <span>KEBIJAKAN PRIVASI</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MobileLayout;
