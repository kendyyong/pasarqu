import React from "react";
import {
  LogOut,
  MapPin,
  DollarSign,
  Flag,
  Users,
  Store,
  UserCheck,
  Zap,
  Settings,
  Megaphone,
  ShieldAlert,
  Landmark,
  BarChart3,
  Image as ImageIcon,
  LayoutGrid,
  Wallet2,
  Banknote,
  Coins,
  BookOpen, // Ikon untuk Buku Besar
} from "lucide-react";
import { SidebarItem } from "./SharedUI";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
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
  /**
   * Fungsi untuk menangani perpindahan tab tanpa reload halaman (SPA style).
   */
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    // Reset view audit market ke null agar tidak menutupi tab lain yang dipilih
    if (setAuditMarket) {
      setAuditMarket(null);
    }
  };

  return (
    <aside className="hidden md:flex w-72 border-r flex-col p-6 fixed h-full z-20 transition-all duration-300 bg-white border-slate-200 text-left overflow-hidden">
      {/* BRANDING / LOGO */}
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

      {/* NAVIGASI MENU UTAMA */}
      <nav className="space-y-1.5 flex-1 overflow-y-auto no-scrollbar pr-1">
        {/* SECTION: DATA MASTER */}
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

        {/* SECTION: KONTEN BERANDA */}
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
            icon={<ImageIcon size={18} className="text-teal-600" />}
            label="Manage Ads"
            active={activeTab === "manage-ads"}
            onClick={() => handleTabChange("manage-ads")}
            theme={theme}
          />
          <SidebarItem
            icon={<LayoutGrid size={18} className="text-teal-600" />}
            label="Kategori Global"
            active={activeTab === "categories"}
            onClick={() => handleTabChange("categories")}
            theme={theme}
          />
        </div>

        {/* SECTION: FINANSIAL & VALIDASI */}
        <div className="pt-6 mt-6 border-t border-slate-100">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3 mb-3">
            Validasi & Finansial
          </p>

          {/* MENU PRIORITAS: BUKU BESAR */}
          <SidebarItem
            icon={<BookOpen size={18} className="text-indigo-600" />}
            label="Buku Besar (Ledger)"
            active={activeTab === "ledger"}
            onClick={() => handleTabChange("ledger")}
            theme={theme}
          />

          <SidebarItem
            icon={<UserCheck size={18} />}
            label="Verifikasi Mitra"
            active={activeTab === "verification"}
            onClick={() => handleTabChange("verification")}
            theme={theme}
            count={counts.candidates}
            isAlert={counts.candidates > 0}
          />

          {/* KEUANGAN KURIR (Penambahan Saldo) */}
          <SidebarItem
            icon={<Wallet2 size={18} className="text-orange-600" />}
            label="Keuangan Kurir"
            active={activeTab === "courier-finance"}
            onClick={() => handleTabChange("courier-finance")}
            theme={theme}
          />

          {/* ANTREAN TOP UP (Requests dari Admin Lokal) */}
          <SidebarItem
            icon={<Coins size={18} className="text-teal-500" />}
            label="Antrean Top Up"
            active={activeTab === "topup-requests"}
            onClick={() => handleTabChange("topup-requests")}
            theme={theme}
          />

          {/* TARIK SALDO (Withdrawals) */}
          <SidebarItem
            icon={<Banknote size={18} className="text-emerald-600" />}
            label="Tarik Saldo"
            active={activeTab === "withdrawals"}
            onClick={() => handleTabChange("withdrawals")}
            theme={theme}
          />

          <SidebarItem
            icon={<Landmark size={18} className="text-teal-600" />}
            label="Regional Finance"
            active={activeTab === "regional-finance"}
            onClick={() => handleTabChange("regional-finance")}
            theme={theme}
          />

          <SidebarItem
            icon={<BarChart3 size={18} className="text-blue-600" />}
            label="Laporan Profit"
            active={activeTab === "finance-report"}
            onClick={() => handleTabChange("finance-report")}
            theme={theme}
          />

          <SidebarItem
            icon={<DollarSign size={18} />}
            label="Finance Summary"
            active={activeTab === "finance"}
            onClick={() => handleTabChange("finance")}
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

        {/* SECTION: SISTEM */}
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

      {/* FOOTER: ACTION */}
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
