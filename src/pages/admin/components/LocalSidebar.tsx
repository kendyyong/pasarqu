import React from "react";
import {
  LayoutDashboard,
  Store,
  Truck,
  Users,
  DollarSign,
  LogOut,
  ShieldCheck,
  Package,
  Map as MapIcon,
  Radio,
  BarChart3, // Import ikon tambahan untuk Laporan
} from "lucide-react";

interface Props {
  marketName: string;
  activeTab: string;
  setActiveTab: (tab: any) => void;
  pendingMerchants: number;
  pendingCouriers: number;
  pendingProducts: number;
  onLogout: () => void;
}

export const LocalSidebar: React.FC<Props> = ({
  marketName,
  activeTab,
  setActiveTab,
  pendingMerchants,
  pendingCouriers,
  pendingProducts,
  onLogout,
}) => {
  return (
    <aside className="w-72 bg-white border-r border-slate-100 flex flex-col p-6 fixed h-full z-20 transition-all duration-300 text-left">
      {/* BRANDING */}
      <div className="flex items-center gap-3 mb-10 px-2">
        <div className="w-10 h-10 bg-teal-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-teal-600/20 font-black text-xl">
          P
        </div>
        <div className="overflow-hidden">
          <h2 className="font-black text-base text-slate-800 uppercase tracking-tighter leading-none">
            PASARQU
          </h2>
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-teal-600 truncate block">
            {marketName || "Admin Wilayah"}
          </span>
        </div>
      </div>

      {/* MENU NAVIGASI */}
      <nav className="space-y-1.5 flex-1 overflow-y-auto no-scrollbar">
        {/* GROUP 1: MONITORING */}
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3 mb-3">
          Monitoring Wilayah
        </p>
        <NavItem
          icon={<LayoutDashboard size={18} />}
          label="Ikhtisar"
          active={activeTab === "overview"}
          onClick={() => setActiveTab("overview")}
        />
        <NavItem
          icon={
            <Radio
              size={18}
              className={activeTab === "radar" ? "animate-pulse" : ""}
            />
          }
          label="Radar Live"
          active={activeTab === "radar"}
          onClick={() => setActiveTab("radar")}
        />

        {/* GROUP 2: MANAJEMEN MITRA */}
        <div className="pt-6 mt-6 border-t border-slate-50">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3 mb-3">
            Manajemen Mitra
          </p>
          <NavItem
            icon={<Store size={18} />}
            label="Kelola Toko"
            active={activeTab === "merchants"}
            onClick={() => setActiveTab("merchants")}
            count={pendingMerchants}
          />
          <NavItem
            icon={<Package size={18} />}
            label="Verifikasi Produk"
            active={activeTab === "products"}
            onClick={() => setActiveTab("products")}
            count={pendingProducts}
          />
          <NavItem
            icon={<Truck size={18} />}
            label="Kelola Kurir"
            active={activeTab === "couriers"}
            onClick={() => setActiveTab("couriers")}
            count={pendingCouriers}
          />
        </div>

        {/* GROUP 3: LAPORAN & KEUANGAN */}
        <div className="pt-6 mt-6 border-t border-slate-50">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3 mb-3">
            Data & Analitik
          </p>
          <NavItem
            icon={<Users size={18} />}
            label="Data Pelanggan"
            active={activeTab === "customers"}
            onClick={() => setActiveTab("customers")}
          />
          <NavItem
            icon={<BarChart3 size={18} />} // Ikon berubah agar lebih "Analitik"
            label="Laporan Keuangan"
            active={activeTab === "finance"}
            onClick={() => setActiveTab("finance")}
          />
        </div>
      </nav>

      {/* FOOTER: KELUAR */}
      <div className="pt-6 border-t border-slate-50">
        <button
          onClick={onLogout}
          className="w-full py-4 bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-600 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all border border-transparent hover:border-red-100 active:scale-95"
        >
          <LogOut size={16} /> Keluar Wilayah
        </button>
      </div>
    </aside>
  );
};

/* --- SUB-COMPONENT: NAV ITEM --- */
const NavItem = ({ icon, label, active, onClick, count }: any) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center justify-between px-5 py-3.5 rounded-2xl transition-all duration-200 group ${
      active
        ? "bg-teal-50 text-teal-600 shadow-sm"
        : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
    }`}
  >
    <div className="flex items-center gap-4">
      <div
        className={`${active ? "text-teal-600" : "text-slate-400 group-hover:text-slate-600"} transition-colors`}
      >
        {icon}
      </div>
      <span
        className={`text-[11px] font-black uppercase tracking-widest ${active ? "opacity-100" : "opacity-70 group-hover:opacity-100"}`}
      >
        {label}
      </span>
    </div>

    {count > 0 && (
      <span
        className={`px-2 py-0.5 rounded-lg text-[9px] font-bold shadow-sm ${
          active
            ? "bg-teal-600 text-white"
            : "bg-orange-500 text-white animate-pulse"
        }`}
      >
        {count}
      </span>
    )}
  </button>
);
