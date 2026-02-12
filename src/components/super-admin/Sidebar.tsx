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
  Zap,
  Settings,
  Megaphone,
  ShieldAlert,
  Landmark, // Icon Baru untuk Regional Finance
} from "lucide-react";
import { SidebarItem } from "./SharedUI";

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
    setAuditMarket(null);
  };

  return (
    <aside className="hidden md:flex w-72 border-r flex-col p-6 fixed h-full z-20 transition-all duration-300 bg-white border-slate-200 text-left">
      {/* HEADER LOGO */}
      <div className="flex items-center gap-3 mb-10 px-2">
        <div className="w-10 h-10 bg-teal-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-teal-600/20 font-black text-xl">
          P
        </div>
        <div>
          <h2 className="font-black text-base text-slate-800 uppercase tracking-tighter leading-none">
            PASARQU
          </h2>
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-teal-600">
            Master Admin
          </span>
        </div>
      </div>

      {/* MENU NAVIGASI */}
      <nav className="space-y-1.5 flex-1 overflow-y-auto no-scrollbar">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3 mb-3">
          Menu Utama
        </p>
        <SidebarItem
          icon={<MapPin size={18} />}
          label="Peta Sebaran"
          active={activeTab === "dashboard"}
          onClick={() => handleTabChange("dashboard")}
          theme={theme}
        />
        <SidebarItem
          icon={<Users size={18} />}
          label="Master User"
          active={activeTab === "users"}
          onClick={() => handleTabChange("users")}
          theme={theme}
          count={counts.users}
        />
        <SidebarItem
          icon={<Store size={18} />}
          label="Master Pasar"
          active={activeTab === "markets"}
          onClick={() => handleTabChange("markets")}
          theme={theme}
        />

        <div className="pt-6 mt-6 border-t border-slate-100">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3 mb-3">
            Pengaturan Beranda
          </p>
          <SidebarItem
            icon={<Zap size={18} className="text-orange-500" />}
            label="Quick Buttons"
            active={activeTab === "menus"}
            onClick={() => handleTabChange("menus")}
            theme={theme}
          />
          <SidebarItem
            icon={<Tags size={18} />}
            label="Kategori Global"
            active={activeTab === "categories"}
            onClick={() => handleTabChange("categories")}
            theme={theme}
          />
        </div>

        <div className="pt-6 mt-6 border-t border-slate-100">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3 mb-3">
            Validasi & Finansial
          </p>
          <SidebarItem
            icon={<UserCheck size={18} />}
            label="Verifikasi Mitra"
            active={activeTab === "verification"}
            onClick={() => handleTabChange("verification")}
            theme={theme}
            count={counts.candidates}
            isAlert={counts.candidates > 0}
          />
          <SidebarItem
            icon={<DollarSign size={18} />}
            label="Laporan Keuangan"
            active={activeTab === "finance"}
            onClick={() => handleTabChange("finance")}
            theme={theme}
          />
          {/* MENU BARU: REGIONAL FINANCE */}
          <SidebarItem
            icon={<Landmark size={18} className="text-teal-600" />}
            label="Regional Finance"
            active={activeTab === "regional-finance"}
            onClick={() => handleTabChange("regional-finance")}
            theme={theme}
          />
          <SidebarItem
            icon={<Flag size={18} />}
            label="Pusat Komplain"
            active={activeTab === "disputes"}
            onClick={() => handleTabChange("disputes")}
            theme={theme}
            count={counts.complaints}
            isAlert={counts.complaints > 0}
          />
        </div>

        <div className="pt-6 mt-6 border-t border-slate-100">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3 mb-3">
            System Control
          </p>
          <SidebarItem
            icon={<Settings size={18} className="text-slate-600" />}
            label="App Settings"
            active={activeTab === "settings"}
            onClick={() => handleTabChange("settings")}
            theme={theme}
          />
          <SidebarItem
            icon={<Megaphone size={18} className="text-blue-600" />}
            label="Broadcast Center"
            active={activeTab === "broadcast"}
            onClick={() => handleTabChange("broadcast")}
            theme={theme}
          />
          <SidebarItem
            icon={<ShieldAlert size={18} className="text-red-500" />}
            label="Audit Logs"
            active={activeTab === "logs"}
            onClick={() => handleTabChange("logs")}
            theme={theme}
          />
        </div>
      </nav>

      {/* TOMBOL LOGOUT */}
      <div className="pt-6 border-t border-slate-100">
        <button
          onClick={onLogout}
          className="w-full py-3.5 bg-slate-50 text-slate-600 hover:bg-red-50 hover:text-red-600 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all border border-transparent hover:border-red-100"
        >
          <LogOut size={16} /> Keluar Sistem
        </button>
      </div>
    </aside>
  );
};
