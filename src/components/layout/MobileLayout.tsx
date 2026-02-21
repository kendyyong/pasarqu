import React from "react";
import { Home, Search, ClipboardList, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

// 🚀 CUSTOMER SERVICE SECTION SUDAH TIDAK DIIMPOR LAGI DI SINI

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
    {
      id: "home",
      label: "BERANDA",
      icon: <Home size={22} strokeWidth={2.5} />,
    },
    {
      id: "search",
      label: "CARI",
      icon: <Search size={22} strokeWidth={2.5} />,
    },
    {
      id: "orders",
      label: "PESANAN",
      icon: <ClipboardList size={22} strokeWidth={2.5} />,
    },
    {
      id: "account",
      label: "SAYA",
      icon: <User size={22} strokeWidth={2.5} />,
    },
  ];

  const handleTabClick = (tabId: string) => {
    if (tabId === "account") {
      navigate("/customer-dashboard");
    } else {
      onTabChange(tabId);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex flex-col font-black uppercase tracking-tighter overflow-x-hidden text-left">
      {/* AREA KONTEN UTAMA */}
      <main className="flex-1 w-full max-w-[1200px] mx-auto bg-white min-h-screen relative pt-[60px] md:pt-[70px] pb-20 md:pb-10 isolate">
        <div className="flex flex-col m-0 p-0 bg-white">
          {children}
          {/* 🚀 BARIS CustomerServiceSection SUDAH DIHAPUS TOTAL DARI SINI */}
        </div>
      </main>

      {/* --- NAVIGASI BAWAH SLIM & FLAT (HP ONLY) --- */}
      <nav className="fixed bottom-0 left-0 right-0 w-full bg-white border-t border-slate-200 flex justify-around items-end h-[56px] pb-1 z-[2000] shadow-[0_-2px_10px_rgba(0,0,0,0.05)] md:hidden">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.id)}
            className={`flex-1 h-full flex flex-col items-center justify-center gap-0.5 transition-all active:bg-slate-50 ${
              activeTab === tab.id ? "text-[#008080]" : "text-slate-400"
            }`}
          >
            <div
              className={`transition-transform duration-200 ${activeTab === tab.id ? "-translate-y-0.5" : ""}`}
            >
              {tab.icon}
            </div>
            <span className="text-[9px] font-black leading-none text-center tracking-widest uppercase">
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
