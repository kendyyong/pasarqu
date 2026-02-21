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
  Crown,
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

  // Otomatis tutup menu mobile jika tab/menu diklik
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [activeTab]);

  if (!isLoaded)
    return <PageLoader bgClass={isDark ? "bg-slate-950" : "bg-slate-50"} />;

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
        // 🚀 PERBAIKAN: Sekarang id 'merchant-manager' menjadi tab internal
        {
          id: "merchant-manager",
          label: "MANAJEMEN MITRA TOKO",
          icon: Crown,
        },
      ],
    },
    {
      group: "FINANCE & AUDIT",
      items: [
        { id: "finance-master", label: "FINANCE DASHBOARD", icon: Wallet },
        { id: "ledger", label: "BUKU BESAR", icon: Receipt },
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
    <div
      className={`h-screen flex flex-col md:flex-row text-left overflow-hidden font-black uppercase tracking-tighter transition-colors duration-500 ${isDark ? "bg-slate-950 text-white" : "bg-[#F8FAFC] text-slate-900"}`}
    >
      {/* --- 📱 MOBILE HEADER --- */}
      <div
        className={`md:hidden flex items-center justify-between px-4 py-4 shrink-0 border-b z-30 ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className={`p-1.5 rounded-lg active:scale-95 transition-all ${isDark ? "bg-slate-800 text-teal-400" : "bg-slate-100 text-slate-900"}`}
          >
            <Menu size={22} />
          </button>
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isDark ? "bg-slate-800 text-teal-400" : "bg-teal-600 text-white"}`}
            >
              <span className="text-sm font-black">P</span>
            </div>
            <span className="text-sm tracking-tighter leading-none">
              PASARQU{" "}
              <span
                className={`text-[8px] block opacity-80 uppercase mt-0.5 ${isDark ? "text-slate-400" : "text-orange-600"}`}
              >
                SUPER ADMIN
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* --- 📱 MOBILE OVERLAY GELAP --- */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* --- 🖥️📱 SIDEBAR --- */}
      <aside
        className={`fixed md:relative flex flex-col transition-all duration-300 z-50 h-screen w-72 
          ${isSidebarOpen ? "md:w-72" : "md:w-20"} 
          ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0
          ${isDark ? "bg-slate-900 border-r border-slate-800 shadow-2xl md:shadow-none" : "bg-white border-r border-slate-200 shadow-2xl md:shadow-none"}
        `}
      >
        <div
          className={`h-20 flex items-center justify-between px-6 shrink-0 ${isDark ? "bg-slate-950 border-b border-slate-800" : `${brand.bgTosca} border-b border-slate-100`}`}
        >
          <div className="flex items-center gap-3 text-white">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isDark ? "bg-slate-800 text-teal-400" : "bg-white text-teal-600"}`}
            >
              <span className="text-xl font-black">P</span>
            </div>
            {(isSidebarOpen || isMobileMenuOpen) && (
              <span className="text-xl tracking-tighter leading-none">
                PASARQU{" "}
                <span
                  className={`text-[9px] block opacity-80 uppercase ${isDark ? "text-slate-400" : "text-orange-300"}`}
                >
                  SUPER ADMIN ENGINE
                </span>
              </span>
            )}
          </div>

          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="md:hidden text-white/70 hover:text-white active:scale-90 transition-all p-1"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 no-scrollbar space-y-4">
          {menuGroups.map((group, idx) => (
            <div key={idx} className="px-3">
              {(isSidebarOpen || isMobileMenuOpen) && (
                <p
                  className={`text-[9px] px-4 mb-2 tracking-[0.2em] ${isDark ? "text-slate-500" : "text-slate-900 font-black"}`}
                >
                  {group.group}
                </p>
              )}
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive = activeTab === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        // 🚀 Sekarang semua menu ID di sini akan mengganti tab internal
                        setActiveTab(item.id);
                      }}
                      className={`w-full flex items-center gap-4 p-3.5 rounded-xl transition-all ${
                        isActive
                          ? isDark
                            ? "bg-[#008080]/20 text-[#008080] border border-[#008080]/30 shadow-lg shadow-teal-900/10"
                            : `${brand.bgTosca} text-white shadow-lg shadow-teal-900/20`
                          : isDark
                            ? "text-slate-400 hover:bg-slate-800 hover:text-white"
                            : "text-black hover:bg-slate-100"
                      }`}
                    >
                      <item.icon
                        size={20}
                        className={`shrink-0 ${isActive && !isDark ? "text-white" : ""}`}
                      />
                      {(isSidebarOpen || isMobileMenuOpen) && (
                        <span className="text-[12px] truncate">
                          {item.label}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div
          className={`p-4 border-t ${isDark ? "border-slate-800" : "border-slate-100"}`}
        >
          <button
            onClick={() => logout().then(() => navigate("/"))}
            className={`w-full flex items-center gap-4 p-4 text-red-500 rounded-2xl transition-all ${isDark ? "hover:bg-red-500/10" : "hover:bg-red-50"}`}
          >
            <LogOut size={20} />
            {(isSidebarOpen || isMobileMenuOpen) && (
              <span className="text-[12px]">KELUAR SISTEM</span>
            )}
          </button>
        </div>

        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className={`hidden md:flex absolute -right-3 top-24 border rounded-full p-1 shadow-sm z-50 transition-transform active:scale-90 ${isDark ? "bg-slate-800 border-slate-700 text-slate-400 hover:text-teal-400" : "bg-white border-slate-200 text-slate-400 hover:text-teal-600"}`}
        >
          {isSidebarOpen ? (
            <ChevronLeft size={14} />
          ) : (
            <ChevronRight size={14} />
          )}
        </button>
      </aside>

      {/* --- CONTENT AREA (KOLOM KANAN) --- */}
      <div
        className={`flex-1 flex flex-col h-full overflow-hidden relative border-l ${isDark ? "border-slate-800" : "border-slate-100"}`}
      >
        {/* 🖥️ HEADER KONTEN */}
        <header
          className={`hidden md:flex h-20 items-center justify-between px-8 z-40 shrink-0 border-b transition-colors duration-500 ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}
        >
          <div className="flex items-center gap-4">
            <div
              className={`p-2 rounded-xl ${isDark ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-400"}`}
            >
              <LayoutDashboard size={18} />
            </div>
            <h1
              className={`text-[16px] font-black tracking-tighter uppercase ${isDark ? "text-white" : "text-slate-800"}`}
            >
              {activeTab.replace("-", " ")}
            </h1>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex flex-col text-right">
              <span
                className={`text-[12px] font-black uppercase ${isDark ? "text-white" : "text-slate-800"}`}
              >
                {profile?.full_name || "SUPER ADMIN"}
              </span>
              <span
                className={`text-[10px] font-bold uppercase ${isDark ? "text-orange-400" : brand.orange}`}
              >
                PASARQU MANAGEMENT
              </span>
            </div>
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg active:scale-95 transition-transform ${isDark ? "bg-orange-600 shadow-orange-900/30" : `${brand.bgOrange} shadow-orange-500/20`}`}
            >
              <Smartphone size={24} />
            </div>
          </div>
        </header>

        {/* MAIN KONTEN (SCROLLABLE) */}
        <main
          className={`flex-1 overflow-y-auto no-scrollbar p-4 md:p-8 transition-colors duration-500 ${isDark ? "bg-slate-950" : "bg-slate-50"}`}
        >
          <div className="max-w-7xl mx-auto pb-20 md:pb-0">
            {auditMarket ? (
              <div className="animate-in fade-in zoom-in-95">
                <button
                  onClick={() => setAuditMarket(null)}
                  className={`mb-6 flex items-center gap-2 font-black text-[11px] hover:translate-x-[-4px] transition-all uppercase tracking-widest ${isDark ? "text-teal-400" : brand.tosca}`}
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
