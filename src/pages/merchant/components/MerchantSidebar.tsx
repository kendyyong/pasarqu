import React from "react";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  MapPin,
  Wallet,
  LogOut,
  Store,
  CheckCircle,
  Power,
  Plus,
} from "lucide-react";

interface Props {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  merchantProfile: any;
  onLocationClick: () => void;
  onLogout: () => void;
  onToggleStatus: () => void;
  onAddProduct: () => void;
  orderCount: number;
  productCount: number;
}

export const MerchantSidebar: React.FC<Props> = ({
  activeTab,
  setActiveTab,
  merchantProfile,
  onLocationClick,
  onLogout,
  onToggleStatus,
  onAddProduct,
  orderCount,
  productCount,
}) => {
  return (
    <>
      {/* SIDEBAR DESKTOP */}
      <aside className="hidden md:flex w-72 bg-slate-900 flex-col sticky top-0 h-screen z-30 shadow-2xl">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-teal-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-teal-600/20">
              <Store size={22} />
            </div>
            <div>
              <h2 className="text-white font-black text-lg tracking-tighter leading-none uppercase">
                Juragan
              </h2>
              <p className="text-teal-500 text-[10px] font-black uppercase tracking-widest mt-1 italic">
                Seller Centre
              </p>
            </div>
          </div>

          <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700/50">
            <p className="text-xs font-black text-slate-100 truncate uppercase mb-1">
              {merchantProfile?.shop_name || "Toko Anda"}
            </p>
            <p className="text-[9px] text-slate-400 font-bold uppercase truncate flex items-center gap-1">
              <MapPin size={10} className="text-teal-500" />{" "}
              {merchantProfile?.markets?.name || "Wilayah Belum Diset"}
            </p>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1.5 mt-2 text-left">
          <NavItem
            icon={<LayoutDashboard size={18} />}
            label="Ringkasan"
            active={activeTab === "overview"}
            onClick={() => setActiveTab("overview")}
          />
          <NavItem
            icon={<ShoppingBag size={18} />}
            label="Pesanan"
            active={activeTab === "orders"}
            onClick={() => setActiveTab("orders")}
            count={orderCount}
          />
          <NavItem
            icon={<Package size={18} />}
            label="Produk"
            active={activeTab === "products"}
            onClick={() => setActiveTab("products")}
            count={productCount}
          />
          <NavItem
            icon={<MapPin size={18} />}
            label="Lokasi Toko"
            active={false}
            onClick={onLocationClick}
          />
          <NavItem
            icon={<Wallet size={18} />}
            label="Keuangan"
            active={activeTab === "finance"}
            onClick={() => setActiveTab("finance")}
          />
        </nav>

        <div className="p-6 space-y-3">
          <button
            onClick={onToggleStatus}
            className={`w-full py-2.5 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-all ${merchantProfile?.is_shop_open ? "bg-green-500 text-white shadow-lg shadow-green-500/20" : "bg-slate-700 text-slate-400"}`}
          >
            <Power size={14} />{" "}
            {merchantProfile?.is_shop_open ? "TOKO BUKA" : "TOKO TUTUP"}
          </button>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-5 py-4 rounded-xl text-red-400 hover:bg-red-500/10 transition-all font-black text-[10px] uppercase tracking-widest group"
          >
            <LogOut
              size={18}
              className="group-hover:-translate-x-1 transition-transform"
            />{" "}
            Keluar Dashboard
          </button>
        </div>
      </aside>

      {/* MOBILE BOTTOM NAV */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 flex justify-around items-center z-50 pb-safe shadow-2xl h-20 px-2">
        <MobileItem
          icon={<LayoutDashboard size={22} />}
          label="Home"
          active={activeTab === "overview"}
          onClick={() => setActiveTab("overview")}
        />
        <MobileItem
          icon={<Package size={22} />}
          label="Produk"
          active={activeTab === "products"}
          onClick={() => setActiveTab("products")}
        />
        <div className="relative -top-6">
          <button
            onClick={onAddProduct}
            className="w-14 h-14 bg-orange-500 rounded-full text-white flex items-center justify-center shadow-xl border-[6px] border-white active:scale-90 transition-all"
          >
            <Plus size={28} />
          </button>
        </div>
        <MobileItem
          icon={<ShoppingBag size={22} />}
          label="Order"
          active={activeTab === "orders"}
          onClick={() => setActiveTab("orders")}
          count={orderCount}
        />
        <MobileItem
          icon={<MapPin size={22} />}
          label="Lokasi"
          active={false}
          onClick={onLocationClick}
        />
      </div>
    </>
  );
};

const NavItem = ({ icon, label, active, onClick, count }: any) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-xl transition-all font-black text-[10px] uppercase tracking-widest ${active ? "bg-teal-600 text-white shadow-lg shadow-teal-600/20" : "text-slate-400 hover:bg-slate-800 hover:text-white"}`}
  >
    <div className={active ? "text-white" : "text-slate-500"}>{icon}</div>
    <span className="flex-1 text-left">{label}</span>
    {count > 0 && (
      <span
        className={`px-2 py-0.5 rounded-lg text-[9px] font-black ${active ? "bg-teal-700 text-white" : "bg-slate-800 text-teal-500"}`}
      >
        {count}
      </span>
    )}
  </button>
);

const MobileItem = ({ icon, label, active, onClick, count }: any) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center w-16 relative transition-all ${active ? "text-teal-600 scale-110" : "text-slate-400"}`}
  >
    <div className="relative">
      {icon}
      {count > 0 && (
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[8px] font-black rounded-full flex items-center justify-center border-2 border-white">
          {count}
        </span>
      )}
    </div>
    <span className="text-[8px] font-black mt-1 uppercase tracking-tighter">
      {label}
    </span>
  </button>
);
