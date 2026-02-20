import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  LogOut,
  LayoutDashboard,
  Store,
  Users,
  ShieldCheck,
  Wallet,
  Settings,
  Bell,
  Search,
  Smartphone,
  CheckSquare,
  Truck,
  Package,
  List,
  Radio,
  History,
  AlertTriangle,
  Image as ImageIcon,
  Receipt,
  ArrowUpRight,
} from "lucide-react";

import { useSuperAdminDashboard } from "../../../hooks/useSuperAdminDashboard";
import { useAuth } from "../../../contexts/AuthContext";

// --- COMPONENTS ---
import { MarketAuditFullView } from "./components/MarketAudit";
import { SuperAdminContent } from "./components/SuperAdminContent";
import { PageLoader } from "../../../components/ui/PageLoader";

export const SuperAdminDashboard: React.FC = () => {
  const { logout, profile } = useAuth();
  const navigate = useNavigate();

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const {
    isDark,
    currentTheme,
    isLoaded,
    activeTab,
    setActiveTab,
    auditMarket,
    setAuditMarket,
    markets,
    allUsers,
    candidates,
    finance,
    fetchData,
  } = useSuperAdminDashboard();

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [activeTab]);

  if (!isLoaded) return <PageLoader bgClass="bg-slate-50" />;

  const brand = {
    tosca: "text-[#008080]",
    bgTosca: "bg-[#008080]",
    orange: "text-[#FF6600]",
    bgOrange: "bg-[#FF6600]",
  };

  // KONFIGURASI MENU SIDEBAR
  const menuGroups = [
    {
      group: "CORE MONITORING",
      items: [
        {
          id: "dashboard",
          label: "DASHBOARD MONITORING",
          icon: LayoutDashboard,
        },
        { id: "markets", label: "KELOLA WILAYAH", icon: Store },
        { id: "users", label: "DATABASE USER", icon: Users },
      ],
    },
    {
      group: "FINANCE & AUDIT",
      items: [
        { id: "finance-master", label: "FINANCE DASHBOARD", icon: Wallet },
        { id: "ledger", label: "BUKU BESAR", icon: Receipt }, // ✅ TERHUBUNG KE FinancialLedger.tsx
        { id: "withdrawals", label: "PENCAIRAN DANA", icon: CheckSquare },
        { id: "topup-requests", label: "PERMINTAAN TOPUP", icon: ArrowUpRight },
      ],
    },
    {
      group: "OPERATIONAL",
      items: [
        { id: "verification", label: "VERIFIKASI ADMIN", icon: ShieldCheck },
        { id: "shipping-config", label: "LOGISTIK & ONGKIR", icon: Truck },
        { id: "categories", label: "KATEGORI PRODUK", icon: List },
        { id: "menus", label: "MANAJEMEN MENU", icon: Package },
        { id: "disputes", label: "PUSAT RESOLUSI", icon: AlertTriangle },
      ],
    },
    {
      group: "MARKETING & SYSTEM",
      items: [
        { id: "manage-ads", label: "MANAJEMEN IKLAN", icon: ImageIcon },
        { id: "broadcast", label: "BROADCAST NOTIF", icon: Radio },
        { id: "logs", label: "LOG AKTIVITAS", icon: History },
        { id: "settings", label: "PENGATURAN SISTEM", icon: Settings },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex text-left overflow-hidden font-black uppercase tracking-tighter">
      {/* --- SIDEBAR DESKTOP --- */}
      <aside
        className={`hidden md:flex flex-col bg-white border-r border-slate-200 transition-all duration-300 relative z-50 ${isSidebarOpen ? "w-72" : "w-20"}`}
      >
        <div
          className={`h-20 flex items-center px-6 border-b border-slate-100 ${brand.bgTosca} shrink-0`}
        >
          <div className="flex items-center gap-3 text-white">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shrink-0">
              <span className={`text-xl font-black ${brand.tosca}`}>P</span>
            </div>
            {isSidebarOpen && (
              <span className="text-xl tracking-tighter leading-none">
                PASARQU{" "}
                <span className="text-orange-300 text-[9px] block opacity-80 uppercase">
                  SUPER ADMIN ENGINE
                </span>
              </span>
            )}
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 no-scrollbar space-y-4">
          {menuGroups.map((group, idx) => (
            <div key={idx} className="px-3">
              {isSidebarOpen && (
                <p className="text-[9px] text-slate-400 px-4 mb-2 tracking-[0.2em]">
                  {group.group}
                </p>
              )}
              <div className="space-y-1">
                {group.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-4 p-3.5 rounded-xl transition-all ${activeTab === item.id ? `${brand.bgTosca} text-white shadow-lg shadow-teal-900/20` : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"}`}
                  >
                    <item.icon size={20} className="shrink-0" />
                    {isSidebarOpen && (
                      <span className="text-[12px] truncate">{item.label}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button
            onClick={() => logout().then(() => navigate("/"))}
            className="w-full flex items-center gap-4 p-4 text-red-500 hover:bg-red-50 rounded-2xl transition-all"
          >
            <LogOut size={20} />
            {isSidebarOpen && (
              <span className="text-[12px]">KELUAR SISTEM</span>
            )}
          </button>
        </div>

        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute -right-3 top-24 bg-white border border-slate-200 rounded-full p-1 text-slate-400 hover:text-teal-600 shadow-sm z-50 transition-transform active:scale-90"
        >
          {isSidebarOpen ? (
            <ChevronLeft size={14} />
          ) : (
            <ChevronRight size={14} />
          )}
        </button>
      </aside>

      {/* --- CONTENT AREA --- */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative border-l border-slate-100">
        <header className="hidden md:flex h-20 bg-white border-b border-slate-200 items-center justify-between px-8 z-40 shrink-0">
          <div className="flex items-center gap-4">
            <div className="bg-slate-100 p-2 rounded-xl text-slate-400">
              <LayoutDashboard size={18} />
            </div>
            <h1 className="text-[16px] font-black text-slate-800 tracking-tighter uppercase">
              {activeTab.replace("-", " ")}
            </h1>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex flex-col text-right">
              <span className="text-[12px] font-black text-slate-800 uppercase">
                {profile?.name || "SUPER ADMIN"}
              </span>
              <span
                className={`text-[10px] font-bold ${brand.orange} uppercase`}
              >
                PASARQU MANAGEMENT
              </span>
            </div>
            <div
              className={`w-12 h-12 ${brand.bgOrange} rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange-500/20 active:scale-95 transition-transform`}
            >
              <Smartphone size={24} />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto no-scrollbar p-4 md:p-8 bg-slate-50">
          <div className="max-w-7xl mx-auto">
            {auditMarket ? (
              <div className="animate-in fade-in zoom-in-95">
                <button
                  onClick={() => setAuditMarket(null)}
                  className={`mb-6 flex items-center gap-2 ${brand.tosca} font-black text-[11px] hover:translate-x-[-4px] transition-all uppercase tracking-widest`}
                >
                  <ChevronLeft size={16} /> KEMBALI KE PETA
                </button>
                <MarketAuditFullView
                  market={auditMarket}
                  allUsers={allUsers}
                  theme={currentTheme}
                  onViewUser={() => {}}
                />
              </div>
            ) : (
              <SuperAdminContent
                activeTab={activeTab}
                theme={currentTheme}
                isLoaded={isLoaded}
                isDark={isDark}
                data={{ markets, allUsers, finance, candidates }}
                actions={{ setAuditMarket, fetchData }}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
