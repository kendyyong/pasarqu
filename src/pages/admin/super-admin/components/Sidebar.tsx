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
        // ✅ JUDUL DIUBAH MENJADI DASHBOARD MONITORING
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
    <aside
      className={`hidden md:flex flex-col bg-white border-r border-slate-200 transition-all duration-300 relative z-50 ${isSidebarOpen ? "w-72" : "w-20"}`}
    >
      {/* LOGO AREA */}
      <div
        className={`h-20 flex items-center px-6 border-b border-slate-100 ${brand.bgTosca} shrink-0`}
      >
        <div className="flex items-center gap-3 text-white">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shrink-0 shadow-sm">
            <span className={`text-xl font-black ${brand.tosca}`}>P</span>
          </div>
          {isSidebarOpen && (
            <span className="text-xl tracking-tighter leading-none font-black uppercase">
              PASARQU
              <span className="text-orange-300 text-[9px] block opacity-80 font-bold">
                SUPER ADMIN ENGINE
              </span>
            </span>
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
                      : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                  }`}
                >
                  <item.icon size={20} className="shrink-0" />
                  {isSidebarOpen && (
                    <span className="text-[11px] truncate font-black uppercase tracking-tighter">
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
            <span className="text-[11px] tracking-tighter">KELUAR SISTEM</span>
          )}
        </button>
      </div>

      {/* SIDEBAR TOGGLE (DESKTOP) */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="absolute -right-3 top-24 bg-white border border-slate-200 rounded-full p-1 text-slate-400 hover:text-teal-600 shadow-sm z-50 transition-transform active:scale-90"
      >
        {isSidebarOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
      </button>
    </aside>
  );
};
