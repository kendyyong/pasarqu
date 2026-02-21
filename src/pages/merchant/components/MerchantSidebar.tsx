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
  onAddProduct: () => void;
  orderCount: number;
  productCount: number;
  isDarkMode: boolean; // ✅ FIX: Sekarang sudah dikenali oleh TypeScript
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
  isDarkMode,
}) => {
  const hasLocation =
    merchantProfile?.latitude && merchantProfile?.latitude !== 0;
  const marketDisplayName =
    merchantProfile?.market_name ||
    merchantProfile?.markets?.name ||
    "LOKASI BLM DISET";

  return (
    <>
      {/* SIDEBAR DESKTOP */}
      <aside
        className={`hidden md:flex w-full flex-col h-full transition-colors duration-300 ${isDarkMode ? "bg-slate-900 text-slate-300" : "bg-white text-slate-700"} relative z-50`}
      >
        {/* BRANDING */}
        <div
          className={`p-6 border-b ${isDarkMode ? "border-slate-800" : "border-slate-100"}`}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-[#008080] rounded-xl flex items-center justify-center text-white shadow-sm">
              <Store size={20} />
            </div>
            <div className="text-left">
              <h2
                className={`text-[16px] font-bold leading-none tracking-tight ${isDarkMode ? "text-white" : "text-slate-800"}`}
              >
                Pasarqu
              </h2>
              <p className="text-orange-500 text-[10px] font-semibold tracking-widest mt-1 uppercase">
                SELLER CENTER
              </p>
            </div>
          </div>

          <button
            onClick={onLocationClick}
            className={`w-full p-3 rounded-xl border text-left group transition-all ${
              hasLocation
                ? isDarkMode
                  ? "bg-slate-800 border-slate-700 hover:bg-slate-700"
                  : "bg-teal-50/50 border-teal-100 hover:bg-teal-50"
                : "bg-orange-50 border-orange-200 animate-pulse"
            }`}
          >
            <p
              className={`text-[10px] font-semibold tracking-widest mb-1 ${hasLocation ? "text-[#008080]" : "text-orange-600"}`}
            >
              {hasLocation ? "LOKASI AKTIF" : "SETTING LOKASI!"}
            </p>
            <div className="flex items-center gap-2">
              <MapPin
                size={14}
                className={hasLocation ? "text-[#008080]" : "text-orange-500"}
              />
              <p
                className={`text-[12px] font-medium truncate ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}
              >
                {marketDisplayName}
              </p>
            </div>
          </button>
        </div>

        {/* NAVIGATION */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto no-scrollbar">
          <NavItem
            isDarkMode={isDarkMode}
            icon={<LayoutDashboard size={18} />}
            label="Ringkasan"
            active={activeTab === "overview"}
            onClick={() => setActiveTab("overview")}
          />
          <NavItem
            isDarkMode={isDarkMode}
            icon={<ShoppingBag size={18} />}
            label="Pesanan"
            active={activeTab === "orders"}
            onClick={() => setActiveTab("orders")}
            count={orderCount}
          />
          <NavItem
            isDarkMode={isDarkMode}
            icon={<MessageSquare size={18} />}
            label="Chat"
            active={activeTab === "messages"}
            onClick={() => setActiveTab("messages")}
          />
          <NavItem
            isDarkMode={isDarkMode}
            icon={<Package size={18} />}
            label="Produk"
            active={activeTab === "products"}
            onClick={() => setActiveTab("products")}
            count={productCount}
          />

          <div
            className={`h-[1px] my-4 mx-2 ${isDarkMode ? "bg-slate-800" : "bg-slate-100"}`}
          ></div>

          <NavItem
            isDarkMode={isDarkMode}
            icon={<MapPin size={18} />}
            label="Titik Map"
            active={activeTab === "location"}
            onClick={() => setActiveTab("location")}
          />
          <NavItem
            isDarkMode={isDarkMode}
            icon={<Wallet size={18} />}
            label="Keuangan"
            active={activeTab === "finance"}
            onClick={() => setActiveTab("finance")}
          />
        </nav>

        {/* BOTTOM ACTION */}
        <div
          className={`p-5 border-t space-y-3 transition-colors ${isDarkMode ? "border-slate-800 bg-slate-900/50" : "border-slate-100 bg-slate-50/50"}`}
        >
          <button
            onClick={onToggleStatus}
            className={`w-full py-3 rounded-xl text-[12px] font-semibold tracking-wide flex items-center justify-center gap-2 transition-all ${
              merchantProfile?.is_shop_open
                ? "bg-[#008080] text-white shadow-md hover:bg-teal-700"
                : isDarkMode
                  ? "bg-slate-700 text-slate-400 hover:bg-slate-600"
                  : "bg-slate-200 text-slate-500 hover:bg-slate-300"
            }`}
          >
            <Power size={16} />
            {merchantProfile?.is_shop_open ? "Toko Dibuka" : "Toko Ditutup"}
          </button>
          <button
            onClick={onLogout}
            className={`w-full py-3 text-[12px] font-medium transition-all flex items-center justify-center gap-2 rounded-xl hover:bg-red-500/10 hover:text-red-500 ${isDarkMode ? "text-slate-500" : "text-slate-500"}`}
          >
            <LogOut size={16} /> Keluar Akun
          </button>
        </div>
      </aside>

      {/* MOBILE BOTTOM NAV */}
      <div
        className={`md:hidden flex justify-around items-center w-full h-16 px-2 border-t shadow-lg pb-safe transition-colors duration-300 ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}
      >
        <MobileItem
          isDarkMode={isDarkMode}
          icon={<LayoutDashboard size={20} />}
          label="Home"
          active={activeTab === "overview"}
          onClick={() => setActiveTab("overview")}
        />
        <MobileItem
          isDarkMode={isDarkMode}
          icon={<MessageSquare size={20} />}
          label="Chat"
          active={activeTab === "messages"}
          onClick={() => setActiveTab("messages")}
        />

        <div className="relative -top-6">
          <button
            onClick={onAddProduct}
            className={`w-14 h-14 bg-orange-500 text-white flex items-center justify-center rounded-2xl shadow-lg border-[4px] transition-all active:scale-95 ${isDarkMode ? "border-slate-950" : "border-white"}`}
          >
            <Plus size={28} />
          </button>
        </div>

        <MobileItem
          isDarkMode={isDarkMode}
          icon={<ShoppingBag size={20} />}
          label="Order"
          active={activeTab === "orders"}
          onClick={() => setActiveTab("orders")}
          count={orderCount}
        />
        <MobileItem
          isDarkMode={isDarkMode}
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

const NavItem = ({ icon, label, active, onClick, count, isDarkMode }: any) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-[12px] font-medium ${
      active
        ? isDarkMode
          ? "bg-[#008080]/30 text-[#008080]"
          : "bg-[#008080]/10 text-[#008080]"
        : isDarkMode
          ? "text-slate-400 hover:bg-slate-800 hover:text-white"
          : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
    }`}
  >
    <div
      className={
        active
          ? "text-[#008080]"
          : isDarkMode
            ? "text-slate-500"
            : "text-slate-400"
      }
    >
      {icon}
    </div>
    <span className="flex-1 text-left">{label}</span>
    {count > 0 && (
      <span
        className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold ${active ? "bg-[#008080] text-white" : isDarkMode ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-500"}`}
      >
        {count}
      </span>
    )}
  </button>
);

const MobileItem = ({
  icon,
  label,
  active,
  onClick,
  count,
  isDarkMode,
}: any) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center w-14 relative transition-all ${
      active
        ? "text-[#008080]"
        : isDarkMode
          ? "text-slate-500"
          : "text-slate-400"
    }`}
  >
    <div className="relative">
      {icon}
      {count > 0 && (
        <span className="absolute -top-1.5 -right-1.5 px-1 min-w-[16px] h-[16px] bg-orange-500 text-white text-[9px] font-bold flex items-center justify-center rounded-full border-2 border-white">
          {count}
        </span>
      )}
    </div>
    <span className="text-[10px] font-medium mt-1">{label}</span>
  </button>
);
