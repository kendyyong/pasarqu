import React from "react";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  MapPin,
  Wallet,
  LogOut,
  Store,
  Power,
  Plus,
  MessageSquare,
} from "lucide-react";

interface Props {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  merchantProfile: any;
  onLocationClick: () => void;
  onLogout: () => void;
  onToggleStatus: () => void;
  onAddProduct: () => void; // ✅ Shortcut Langsung ke Form Barang Baru
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
  const hasLocation =
    merchantProfile?.latitude && merchantProfile?.latitude !== 0;
  const marketDisplayName =
    merchantProfile?.market_name ||
    merchantProfile?.markets?.name ||
    "WILAYAH BELUM DISET";

  return (
    <>
      {/* SIDEBAR DESKTOP - TETAP KOTAK GAGAH */}
      <aside className="hidden md:flex w-64 bg-slate-900 flex-col sticky top-0 h-screen z-30 shadow-2xl">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-teal-600 rounded-none flex items-center justify-center text-white shadow-lg">
              <Store size={22} />
            </div>
            <div className="text-left">
              <h2 className="text-white font-black text-lg tracking-tighter leading-none uppercase">
                PASARQU
              </h2>
              <p className="text-teal-500 text-[10px] font-black uppercase tracking-[0.2em] mt-1">
                Seller Center
              </p>
            </div>
          </div>

          <button
            onClick={onLocationClick}
            className={`w-full p-4 rounded-none border transition-all text-left group relative overflow-hidden ${
              hasLocation
                ? "bg-slate-800/50 border-teal-500/30"
                : "bg-orange-500/10 border-orange-500/50 animate-pulse"
            }`}
          >
            <p
              className={`text-[10px] font-black uppercase mb-1 tracking-widest ${hasLocation ? "text-teal-400" : "text-orange-400"}`}
            >
              {hasLocation ? "LOKASI AKTIF" : "PERLU SETTING"}
            </p>
            <div className="flex items-center gap-2">
              <MapPin
                size={12}
                className={hasLocation ? "text-teal-500" : "text-orange-500"}
              />
              <p className="text-xs font-black text-slate-100 truncate uppercase tracking-tight">
                {marketDisplayName}
              </p>
            </div>
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-1 mt-2 text-left overflow-y-auto no-scrollbar">
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
            icon={<MessageSquare size={18} />}
            label="Chat"
            active={activeTab === "messages"}
            onClick={() => setActiveTab("messages")}
          />
          <NavItem
            icon={<Package size={18} />}
            label="Produk"
            active={activeTab === "products"}
            onClick={() => setActiveTab("products")}
            count={productCount}
          />

          <div className="h-[1px] bg-slate-800 my-4 mx-4 opacity-50"></div>

          <NavItem
            icon={<MapPin size={18} />}
            label="Titik Map"
            active={activeTab === "location"}
            onClick={() => setActiveTab("location")}
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
            className={`w-full py-3 rounded-none text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-all ${merchantProfile?.is_shop_open ? "bg-teal-600 text-white" : "bg-slate-700 text-slate-400"}`}
          >
            <Power size={14} />
            {merchantProfile?.is_shop_open ? "TOKO BUKA" : "TOKO TUTUP"}
          </button>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-5 py-3 rounded-none text-slate-500 hover:text-red-400 transition-all font-black text-[10px] uppercase tracking-widest group"
          >
            <LogOut
              size={18}
              className="group-hover:-translate-x-1 transition-transform"
            />
            Keluar Akun
          </button>
        </div>
      </aside>

      {/* MOBILE BOTTOM NAV */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around items-center z-50 pb-safe h-16 px-2 shadow-[0_-5px_15px_rgba(0,0,0,0.05)]">
        <MobileItem
          icon={<LayoutDashboard size={20} />}
          label="Home"
          active={activeTab === "overview"}
          onClick={() => setActiveTab("overview")}
        />
        <MobileItem
          icon={<MessageSquare size={20} />}
          label="Chat"
          active={activeTab === "messages"}
          onClick={() => setActiveTab("messages")}
        />

        {/* ✅ TOMBOL + TETAP BULAT & SHORTCUT KE FORM BARANG BARU */}
        <div className="relative -top-5">
          <button
            onClick={onAddProduct} // Memanggil fungsi tambah barang baru
            className="w-14 h-14 bg-orange-600 rounded-full text-white flex items-center justify-center shadow-2xl border-[5px] border-white active:scale-90 transition-all hover:bg-slate-900"
          >
            <Plus size={32} />
          </button>
        </div>

        <MobileItem
          icon={<ShoppingBag size={20} />}
          label="Order"
          active={activeTab === "orders"}
          onClick={() => setActiveTab("orders")}
          count={orderCount}
        />
        <MobileItem
          icon={<Package size={20} />}
          label="Produk"
          active={activeTab === "products"}
          onClick={() => setActiveTab("products")}
          count={productCount}
        />
      </div>
    </>
  );
};

const NavItem = ({ icon, label, active, onClick, count }: any) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-5 py-3 rounded-none transition-all font-black text-[10px] uppercase tracking-widest ${active ? "bg-teal-600 text-white shadow-lg" : "text-slate-400 hover:bg-slate-800 hover:text-white"}`}
  >
    <div className={active ? "text-white" : "text-slate-500"}>{icon}</div>
    <span className="flex-1 text-left">{label}</span>
    {count > 0 && (
      <span
        className={`px-2 py-0.5 rounded-none text-[9px] font-black ${active ? "bg-teal-700 text-white" : "bg-slate-800 text-teal-500"}`}
      >
        {count}
      </span>
    )}
  </button>
);

const MobileItem = ({ icon, label, active, onClick, count }: any) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center w-14 relative transition-all ${active ? "text-teal-600 scale-105" : "text-slate-400"}`}
  >
    <div className="relative">
      {icon}
      {count > 0 && (
        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-600 text-white text-[7px] font-black rounded-none flex items-center justify-center border border-white">
          {count}
        </span>
      )}
    </div>
    <span className="text-[7px] font-black mt-1 uppercase tracking-tight">
      {label}
    </span>
  </button>
);
