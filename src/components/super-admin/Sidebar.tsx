import React from "react";
import {
  Globe,
  LogOut,
  MapPin,
  DollarSign,
  Flag,
  Users,
  Store,
  Tags,
  UserCheck,
} from "lucide-react";
import { SidebarItem } from "./SharedUI"; // Ambil dari SharedUI yang sudah kita buat

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
  onLogout: () => void;
  theme: any;
  counts: {
    users: number;
    candidates: number;
    complaints: number;
  };
  setAuditMarket: (val: any) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  onLogout,
  theme,
  counts,
  setAuditMarket,
}) => {
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setAuditMarket(null); // Reset audit view setiap ganti tab
  };

  return (
    <aside
      className={`hidden md:flex w-72 border-r flex-col p-6 fixed h-full z-20 transition-colors duration-300 ${theme.sidebar}`}
    >
      {/* HEADER SIDEBAR */}
      <div className="flex items-center gap-4 mb-10 px-2">
        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
          <Globe size={24} />
        </div>
        <div>
          <h2 className="font-black text-sm uppercase leading-none">
            Super Admin
          </h2>
          <span
            className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${theme.accent}`}
          >
            Pusat Data
          </span>
        </div>
      </div>

      {/* MENU NAVIGASI */}
      <nav className="space-y-2 flex-1">
        <SidebarItem
          icon={<MapPin size={20} />}
          label="Peta Sebaran"
          active={activeTab === "dashboard"}
          onClick={() => handleTabChange("dashboard")}
          theme={theme}
        />
        <SidebarItem
          icon={<DollarSign size={20} />}
          label="Keuangan"
          active={activeTab === "finance"}
          onClick={() => handleTabChange("finance")}
          theme={theme}
        />
        <SidebarItem
          icon={<Flag size={20} />}
          label="Resolusi Sengketa"
          active={activeTab === "disputes"}
          onClick={() => handleTabChange("disputes")}
          theme={theme}
          count={counts.complaints}
          isAlert={counts.complaints > 0}
        />
        <SidebarItem
          icon={<Users size={20} />}
          label="Master User"
          active={activeTab === "users"}
          onClick={() => handleTabChange("users")}
          theme={theme}
          count={counts.users}
        />

        <div className="pt-6 mt-6 border-t border-slate-700/20">
          <SidebarItem
            icon={<Store size={20} />}
            label="Master Pasar"
            active={activeTab === "markets"}
            onClick={() => handleTabChange("markets")}
            theme={theme}
          />
          <SidebarItem
            icon={<Tags size={20} />}
            label="Kategori"
            active={activeTab === "categories"}
            onClick={() => handleTabChange("categories")}
            theme={theme}
          />
          <SidebarItem
            icon={<UserCheck size={20} />}
            label="Verifikasi"
            active={activeTab === "verification"}
            onClick={() => handleTabChange("verification")}
            theme={theme}
            count={counts.candidates}
            isAlert={counts.candidates > 0}
          />
        </div>
      </nav>

      {/* TOMBOL LOGOUT */}
      <button
        onClick={onLogout}
        className="mt-auto py-3 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-2xl font-bold text-xs uppercase flex items-center justify-center gap-2 transition-all"
      >
        <LogOut size={20} /> Keluar
      </button>
    </aside>
  );
};
