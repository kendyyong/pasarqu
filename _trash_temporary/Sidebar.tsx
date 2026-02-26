import React from "react";
import {
  LayoutDashboard,
  Store,
  Users,
  ShieldCheck,
  Wallet,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
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
  Landmark, // ✅ Ikon baru untuk Pajak & CSR
} from "lucide-react";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  onLogout: () => void;
  brand: any;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isSidebarOpen,
  setIsSidebarOpen,
  onLogout,
  brand,
}) => {
  const menuGroups = [
    {
      group: "CORE MONITORING",
      items: [
        { id: "dashboard", label: "DASHBOARD MONITOR", icon: LayoutDashboard },
        { id: "markets", label: "KELOLA PASAR", icon: Store },
        { id: "users", label: "DATABASE PENGGUNA", icon: Users },
      ],
    },
    {
      group: "FINANCE & AUDIT",
      items: [
        { id: "finance-master", label: "FINANCE DASHBOARD", icon: Wallet },
        { id: "ledger", label: "BUKU BESAR", icon: Receipt },
        { id: "withdrawals", label: "PENCAIRAN DANA", icon: CheckSquare },
        { id: "topup-requests", label: "PERMINTAAN TOPUP", icon: ArrowUpRight },
        /** 🛠️ PENGEMBALIAN FITUR: PAJAK & CSR */
        { id: "tax-csr", label: "PENGATURAN PAJAK & CSR", icon: Landmark },
      ],
    },
    {
      group: "OPERATIONAL",
      items: [
        { id: "verification", label: "VERIFIKASI ADMIN", icon: ShieldCheck },
        {
          id: "shipping-config",
          label: "PENGATURAN TARIF PASAR DAN APLIKASI",
          icon: Truck,
        },
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
    <aside
      className={`hidden md:flex flex-col bg-white border-r border-slate-200 transition-all duration-300 relative z-50 ${isSidebarOpen ? "w-72" : "w-20"}`}
    >
      {/* 1. LOGO AREA */}
      <div
        className={`h-20 flex items-center px-6 border-b border-slate-100 shrink-0`}
      >
        <div className="flex items-center gap-1">
          <span className="text-2xl font-black tracking-tighter text-[#008080]">
            Pasar
            <span className="text-[#FF6600]">Qu</span>
          </span>
          {isSidebarOpen && (
            <div className="ml-2 pl-2 border-l border-slate-200">
              <span className="text-[10px] font-black text-slate-400 uppercase leading-none block">
                Super
              </span>
              <span className="text-[10px] font-black text-slate-400 uppercase leading-none block">
                Admin
              </span>
            </div>
          )}
        </div>
      </div>

      {/* NAVIGATION MENU */}
      <nav className="flex-1 overflow-y-auto py-4 no-scrollbar space-y-4">
        {menuGroups.map((group, idx) => (
          <div key={idx} className="px-3">
            {isSidebarOpen && (
              <p className="text-[9px] text-slate-400 px-4 mb-2 tracking-[0.2em] font-black uppercase">
                {group.group}
              </p>
            )}
            <div className="space-y-1">
              {group.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-4 p-3.5 rounded-xl transition-all ${
                    activeTab === item.id
                      ? `${brand.bgTosca} text-white shadow-lg shadow-teal-900/20`
                      : "text-slate-800 hover:bg-slate-50 hover:text-teal-600"
                  }`}
                >
                  <item.icon size={20} className="shrink-0" />
                  {isSidebarOpen && (
                    <span className="text-[12px] truncate font-black uppercase tracking-tighter text-left">
                      {item.label}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* LOGOUT BUTTON */}
      <div className="p-4 border-t border-slate-100">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-4 p-4 text-red-500 hover:bg-red-50 rounded-2xl transition-all font-black uppercase"
        >
          <LogOut size={20} />
          {isSidebarOpen && (
            <span className="text-[12px] tracking-tighter">KELUAR SISTEM</span>
          )}
        </button>
      </div>

      {/* SIDEBAR TOGGLE */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="absolute -right-3 top-24 bg-white border border-slate-200 rounded-full p-1 text-slate-400 hover:text-teal-600 shadow-sm z-50 transition-transform active:scale-90"
      >
        {isSidebarOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
      </button>
    </aside>
  );
};
