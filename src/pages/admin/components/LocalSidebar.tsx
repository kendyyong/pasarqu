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
    <aside className="w-72 bg-slate-900 text-white flex flex-col p-8 fixed h-full z-20 shadow-2xl">
      <div className="mb-12 text-center">
        <div className="w-14 h-14 bg-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-teal-500/20">
          <ShieldCheck size={32} />
        </div>
        <h2 className="font-black text-lg leading-tight uppercase">
          {marketName || "ADMIN ZONA"}
        </h2>
      </div>

      <nav className="space-y-2 flex-1">
        <NavItem
          icon={<LayoutDashboard size={18} />}
          label="Ikhtisar"
          active={activeTab === "overview"}
          onClick={() => setActiveTab("overview")}
        />
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
        <NavItem
          icon={<Users size={18} />}
          label="Data Pelanggan"
          active={activeTab === "customers"}
          onClick={() => setActiveTab("customers")}
        />
        <NavItem
          icon={<DollarSign size={18} />}
          label="Keuangan"
          active={activeTab === "finance"}
          onClick={() => setActiveTab("finance")}
        />
      </nav>

      <button
        onClick={onLogout}
        className="mt-auto w-full py-4 bg-red-500/10 text-red-500 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-red-500 hover:text-white transition-all"
      >
        <LogOut size={16} /> Keluar
      </button>
    </aside>
  );
};

const NavItem = ({ icon, label, active, onClick, count }: any) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all group ${
      active
        ? "bg-teal-500 text-white shadow-lg"
        : "text-slate-500 hover:bg-slate-800/50 hover:text-slate-300"
    }`}
  >
    <div className="flex items-center gap-4">
      {icon} <span>{label}</span>
    </div>
    {count > 0 && (
      <span
        className={`px-2 py-0.5 rounded-lg text-[9px] ${
          active
            ? "bg-white text-teal-600"
            : "bg-orange-500 text-white animate-pulse"
        }`}
      >
        {count}
      </span>
    )}
  </button>
);
