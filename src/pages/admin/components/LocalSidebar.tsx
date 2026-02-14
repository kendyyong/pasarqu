import React from "react";
import {
  LayoutDashboard,
  Store,
  Truck,
  Users,
  LogOut,
  Package,
  Radio,
  BarChart3,
  ChevronRight,
  Map,
  Star,
  ShieldAlert,
  Megaphone,
  ShoppingBag,
  ClipboardCheck, // Icon baru untuk kesan verifikasi resmi
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
    <aside className="w-72 bg-white border-r border-slate-200 h-screen fixed left-0 top-0 z-50 flex flex-col font-sans antialiased shadow-sm text-left">
      {/* BRANDING SECTION */}
      <div className="p-8 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-teal-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-teal-200 font-black text-xl">
            P
          </div>
          <div className="text-left min-w-0">
            <h2 className="font-black text-base text-slate-800 uppercase tracking-tighter leading-none">
              PASARQU
            </h2>
            <p className="text-[9px] font-black text-teal-600 uppercase tracking-[0.2em] mt-1 truncate">
              Admin Wilayah
            </p>
          </div>
        </div>

        {/* ZONA KELOLA CARD */}
        <div className="mt-8 p-4 bg-slate-50 rounded-2xl border border-slate-100/80">
          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">
            Wilayah Tugas
          </p>
          <p className="text-[11px] font-black text-slate-700 uppercase truncate italic">
            {marketName || "Pasar Kalimantan"}
          </p>
        </div>
      </div>

      {/* NAVIGATION SECTION */}
      <nav className="flex-1 overflow-y-auto px-4 space-y-1 no-scrollbar pb-10">
        <GroupLabel label="Monitoring" />
        <NavItem
          icon={<LayoutDashboard size={18} />}
          label="Ringkasan"
          active={activeTab === "overview"}
          onClick={() => setActiveTab("overview")}
        />
        <NavItem
          icon={<ShoppingBag size={18} />}
          label="Data Pesanan"
          active={activeTab === "orders"}
          onClick={() => setActiveTab("orders")}
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

        <GroupLabel label="Verifikasi Mitra" />
        {/* MENU VERIF PRODUK (Kini dengan Label Lebih Tegas) */}
        <NavItem
          icon={<ClipboardCheck size={18} />}
          label="Verifikasi Produk"
          active={activeTab === "products"}
          onClick={() => setActiveTab("products")}
          count={pendingProducts}
          isAlert={pendingProducts > 0}
        />
        <NavItem
          icon={<Store size={18} />}
          label="Kelola Toko"
          active={activeTab === "merchants"}
          onClick={() => setActiveTab("merchants")}
          count={pendingMerchants}
        />
        <NavItem
          icon={<Truck size={18} />}
          label="Kelola Kurir"
          active={activeTab === "couriers"}
          onClick={() => setActiveTab("couriers")}
          count={pendingCouriers}
        />

        <GroupLabel label="Data & Analitik" />
        <NavItem
          icon={<Users size={18} />}
          label="Data Pelanggan"
          active={activeTab === "customers"}
          onClick={() => setActiveTab("customers")}
        />
        <NavItem
          icon={<BarChart3 size={18} />}
          label="Laporan Keuangan"
          active={activeTab === "finance"}
          onClick={() => setActiveTab("finance")}
        />
        <NavItem
          icon={<Star size={18} />}
          label="Rating & Ulasan"
          active={activeTab === "ratings"}
          onClick={() => setActiveTab("ratings")}
        />
        <NavItem
          icon={<Megaphone size={18} />}
          label="Siaran Broadcast"
          active={activeTab === "broadcast"}
          onClick={() => setActiveTab("broadcast")}
        />
        <NavItem
          icon={<ShieldAlert size={18} />}
          label="Pusat Bantuan"
          active={activeTab === "resolution"}
          onClick={() => setActiveTab("resolution")}
        />
      </nav>

      {/* FOOTER SECTION */}
      <div className="p-4 border-t border-slate-100 bg-white">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-4 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all duration-300 group"
        >
          <LogOut
            size={18}
            className="group-hover:-translate-x-1 transition-transform"
          />
          <span className="text-[11px] font-black uppercase tracking-widest">
            Logout Sistem
          </span>
        </button>
      </div>
    </aside>
  );
};

// --- SUB-KOMPONEN NAV ITEM ---
const NavItem = ({ icon, label, active, onClick, count, isAlert }: any) => (
  <button
    onClick={onClick}
    className={`
      w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all duration-300 group
      ${
        active
          ? "bg-slate-900 text-white shadow-xl shadow-slate-200"
          : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
      }
    `}
  >
    <div className="flex items-center gap-4">
      <div
        className={`
        w-5 h-5 flex items-center justify-center transition-colors shrink-0
        ${active ? "text-teal-400" : "text-slate-400 group-hover:text-teal-600"}
      `}
      >
        {icon}
      </div>
      <span
        className={`text-[11px] font-black uppercase tracking-tight text-left leading-none ${active ? "opacity-100" : "opacity-80"}`}
      >
        {label}
      </span>
    </div>

    {count !== undefined && count > 0 ? (
      <span
        className={`
        px-2 py-0.5 rounded-lg text-[9px] font-black min-w-[20px] text-center
        ${isAlert ? "bg-orange-500 text-white animate-pulse shadow-sm" : "bg-teal-100 text-teal-700"}
        ${active && !isAlert ? "bg-teal-500 text-white" : ""}
      `}
      >
        {count}
      </span>
    ) : (
      active && <ChevronRight size={14} className="text-teal-400/50" />
    )}
  </button>
);

const GroupLabel = ({ label }: { label: string }) => (
  <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.25em] ml-4 mt-6 mb-2 text-left">
    {label}
  </p>
);
