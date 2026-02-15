import React, { useState } from "react";
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
  BookOpen,
  Activity,
  ChevronDown,
  ChevronRight,
  Cpu,
  Globe,
  Terminal,
  Truck, // Pastikan ikon Truck sudah diimport
} from "lucide-react";
import { SidebarItem } from "./SharedUI";
import { useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();
  const [openGroups, setOpenGroups] = useState<string[]>([
    "finance",
    "main",
    "system",
  ]);

  const toggleGroup = (group: string) => {
    setOpenGroups((prev) =>
      prev.includes(group) ? prev.filter((g) => g !== group) : [...prev, group],
    );
  };

  const handleTabChange = (tab: string, path?: string) => {
    setActiveTab(tab);
    // Jika path ada, pindah halaman. Jika tidak, ganti tab saja (SPA).
    if (path) navigate(path);
    if (setAuditMarket) setAuditMarket(null);
  };

  return (
    <aside className="hidden md:flex w-[260px] flex-col fixed h-full z-20 bg-[#0f172a] border-r border-white/5 text-left overflow-hidden shadow-2xl">
      {/* 1. EXECUTIVE BRANDING - HIGH CONTRAST */}
      <div
        className="p-6 border-b border-white/5 flex items-center justify-between bg-slate-900/50 cursor-pointer group"
        onClick={() => navigate("/super-admin")}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-teal-500 rounded-lg flex items-center justify-center text-slate-900 shadow-[0_0_15px_rgba(20,184,166,0.4)] transition-all group-hover:scale-105">
            <Cpu size={20} strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="font-black text-sm text-white uppercase tracking-tighter leading-none">
              PASARQU <span className="text-teal-400">OS</span>
            </h2>
            <div className="flex items-center gap-1.5 mt-1">
              <div className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse"></div>
              <span className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-500">
                System v2.0.26
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. HIGH-DENSITY NAVIGATION - DARK MODE */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6 no-scrollbar">
        {/* GROUP: FINANCIAL ENGINE */}
        <div className="space-y-1">
          <button
            onClick={() => toggleGroup("finance")}
            className="w-full flex items-center justify-between px-3 py-1.5 text-[9px] font-black text-slate-500 uppercase tracking-widest hover:text-teal-400 transition-colors"
          >
            <span className="flex items-center gap-2">
              <DollarSign size={10} /> Financial Engine
            </span>
            {openGroups.includes("finance") ? (
              <ChevronDown size={10} />
            ) : (
              <ChevronRight size={10} />
            )}
          </button>

          {openGroups.includes("finance") && (
            <div className="space-y-[2px] animate-in fade-in duration-300">
              <SidebarItem
                icon={<Activity size={16} className="text-teal-400" />}
                label="Finance Dashboard"
                active={activeTab === "finance-master"}
                onClick={() =>
                  handleTabChange("finance-master", "/super-admin/finance")
                }
                theme="dark"
              />
              <SidebarItem
                icon={<BookOpen size={16} className="text-indigo-400" />}
                label="General Ledger"
                active={activeTab === "ledger"}
                onClick={() => handleTabChange("ledger")}
                theme="dark"
              />
              <SidebarItem
                icon={<Banknote size={16} className="text-emerald-400" />}
                label="Payout Requests"
                active={activeTab === "withdrawals"}
                onClick={() => handleTabChange("withdrawals")}
                theme="dark"
              />
              <SidebarItem
                icon={<Coins size={16} className="text-amber-400" />}
                label="Topup Queue"
                active={activeTab === "topup-requests"}
                onClick={() => handleTabChange("topup-requests")}
                theme="dark"
              />
              <SidebarItem
                icon={<Landmark size={16} className="text-blue-400" />}
                label="Regional Analytics"
                active={activeTab === "regional-finance"}
                onClick={() => handleTabChange("regional-finance")}
                theme="dark"
              />
              <SidebarItem
                icon={<BarChart3 size={16} className="text-purple-400" />}
                label="Profit Reports"
                active={activeTab === "finance-report"}
                onClick={() => handleTabChange("finance-report")}
                theme="dark"
              />
            </div>
          )}
        </div>

        {/* GROUP: CORE OPERATIONS */}
        <div className="space-y-1">
          <button
            onClick={() => toggleGroup("main")}
            className="w-full flex items-center justify-between px-3 py-1.5 text-[9px] font-black text-slate-500 uppercase tracking-widest"
          >
            <span className="flex items-center gap-2">
              <Globe size={10} /> Core Operations
            </span>
            {openGroups.includes("main") ? (
              <ChevronDown size={10} />
            ) : (
              <ChevronRight size={10} />
            )}
          </button>

          {openGroups.includes("main") && (
            <div className="space-y-[2px] animate-in fade-in duration-300">
              <SidebarItem
                icon={<MapPin size={16} className="text-slate-400" />}
                label="Market Mapping"
                active={activeTab === "dashboard"}
                onClick={() => handleTabChange("dashboard")}
                theme="dark"
              />
              <SidebarItem
                icon={<Users size={16} className="text-slate-400" />}
                label="User Registry"
                active={activeTab === "users"}
                onClick={() => handleTabChange("users")}
                theme="dark"
                count={counts.users}
              />
              <SidebarItem
                icon={<Store size={16} className="text-slate-400" />}
                label="Merchant Master"
                active={activeTab === "markets"}
                onClick={() => handleTabChange("markets")}
                theme="dark"
              />
              <SidebarItem
                icon={<UserCheck size={16} className="text-slate-400" />}
                label="Verification"
                active={activeTab === "verification"}
                onClick={() => handleTabChange("verification")}
                theme="dark"
                count={counts.candidates}
                isAlert={counts.candidates > 0}
              />

              {/* ✅ LOGISTICS ENGINE (Updated) */}
              <SidebarItem
                icon={<Truck size={16} className="text-orange-400" />}
                label="Logistics Engine"
                active={activeTab === "shipping-config"}
                // HAPUS PATH URL AGAR TETAP DI DASHBOARD (KOLOM KANAN)
                onClick={() => handleTabChange("shipping-config")}
                theme="dark"
              />
            </div>
          )}
        </div>

        {/* GROUP: INFRASTRUCTURE */}
        <div className="space-y-1">
          <button
            onClick={() => toggleGroup("system")}
            className="w-full flex items-center justify-between px-3 py-1.5 text-[9px] font-black text-slate-500 uppercase tracking-widest"
          >
            <span className="flex items-center gap-2">
              <Terminal size={10} /> Infrastructure
            </span>
            {openGroups.includes("system") ? (
              <ChevronDown size={10} />
            ) : (
              <ChevronRight size={10} />
            )}
          </button>

          {openGroups.includes("system") && (
            <div className="space-y-[2px] animate-in fade-in duration-300">
              <SidebarItem
                icon={<ImageIcon size={16} className="text-sky-400" />}
                label="Ad Manager"
                active={activeTab === "manage-ads"}
                onClick={() => handleTabChange("manage-ads")}
                theme="dark"
              />
              <SidebarItem
                icon={<LayoutGrid size={16} className="text-teal-400" />}
                label="Global Categories"
                active={activeTab === "categories"}
                onClick={() => handleTabChange("categories")}
                theme="dark"
              />
              <SidebarItem
                icon={<Megaphone size={16} className="text-blue-400" />}
                label="Broadcast Node"
                active={activeTab === "broadcast"}
                onClick={() => handleTabChange("broadcast")}
                theme="dark"
              />
              <SidebarItem
                icon={<Flag size={16} className="text-red-400" />}
                label="Dispute Center"
                active={activeTab === "disputes"}
                onClick={() => handleTabChange("disputes")}
                theme="dark"
                count={counts.complaints}
                isAlert={counts.complaints > 0}
              />
              <SidebarItem
                icon={<ShieldAlert size={16} className="text-slate-400" />}
                label="Audit Ledger"
                active={activeTab === "logs"}
                onClick={() => handleTabChange("logs")}
                theme="dark"
              />
            </div>
          )}
        </div>
      </nav>

      {/* 3. SYSTEM FOOTER */}
      <div className="p-4 bg-slate-900/80 border-t border-white/5 space-y-2">
        <button
          onClick={() => handleTabChange("settings")}
          className={`w-full flex items-center justify-between px-4 py-2 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-all ${activeTab === "settings" ? "bg-teal-500 text-slate-900 shadow-lg" : "text-slate-400 hover:text-white hover:bg-white/5"}`}
        >
          <span className="flex items-center gap-3">
            <Settings size={14} /> Config
          </span>
          <ChevronRight size={10} />
        </button>
        <button
          onClick={onLogout}
          className="w-full py-2.5 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-lg font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all active:scale-95"
        >
          <LogOut size={14} /> Terminate
        </button>
      </div>
    </aside>
  );
};
