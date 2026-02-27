import React from "react";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  MapPin,
  Wallet,
  LogOut,
  Power,
  Plus,
  MessageSquare,
  Settings,
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
  isDarkMode: boolean;
  hasUnreadChat?: boolean; // 🚀 FIX: Pintu sekarang sudah dibuka!
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
  hasUnreadChat, // 🚀 Ambil kiriman paket notifikasinya di sini
}) => {
  const hasLocation =
    merchantProfile?.latitude && merchantProfile?.latitude !== 0;
  const marketDisplayName =
    merchantProfile?.market_name ||
    merchantProfile?.markets?.name ||
    "LOKASI BLM DISET";

  return (
    <>
      {/* --- SIDEBAR DESKTOP --- */}
      <aside
        className={`hidden md:flex w-full flex-col h-full transition-colors duration-300 ${
          isDarkMode ? "bg-slate-900 text-slate-300" : "bg-white text-slate-700"
        } relative z-50`}
      >
        {/* BRANDING AREA */}
        <div
          className={`p-6 border-b ${
            isDarkMode ? "border-slate-800" : "border-slate-100"
          }`}
        >
          <div className="flex flex-col gap-3 mb-6">
            <div className="h-10 w-full flex items-center">
              <img
                src="/logo-text.png"
                alt="PasarQu"
                className={`h-full object-contain transition-all duration-300 ${
                  isDarkMode ? "brightness-[2] contrast-125" : "brightness-100"
                }`}
              />
            </div>
            <div className="px-0.5">
              <p className="text-[#FF6600] text-[10px] font-[1000] tracking-[0.3em] uppercase leading-none">
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
                : "bg-orange-50 border-orange-200 animate-pulse shadow-sm"
            }`}
          >
            <p
              className={`text-[9px] font-bold tracking-widest mb-1 uppercase ${
                hasLocation ? "text-[#008080]" : "text-orange-600"
              }`}
            >
              {hasLocation ? "LOKASI AKTIF" : "SETTING LOKASI!"}
            </p>
            <div className="flex items-center gap-2">
              <MapPin
                size={14}
                className={hasLocation ? "text-[#008080]" : "text-orange-500"}
              />
              <p
                className={`text-[11px] font-bold uppercase truncate ${
                  isDarkMode ? "text-slate-300" : "text-slate-700"
                }`}
              >
                {marketDisplayName}
              </p>
            </div>
          </button>
        </div>

        {/* NAVIGATION LINKS (DESKTOP) */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto no-scrollbar">
          <NavItem
            isDarkMode={isDarkMode}
            icon={<LayoutDashboard size={18} />}
            label="RINGKASAN"
            active={activeTab === "overview"}
            onClick={() => setActiveTab("overview")}
          />
          <NavItem
            isDarkMode={isDarkMode}
            icon={<ShoppingBag size={18} />}
            label="PESANAN"
            active={activeTab === "orders"}
            onClick={() => setActiveTab("orders")}
            count={orderCount}
          />
          <NavItem
            isDarkMode={isDarkMode}
            icon={
              <MessageSquare
                size={18}
                className={hasUnreadChat ? "animate-bounce text-red-500" : ""}
              />
            }
            label="CHAT"
            active={activeTab === "messages"}
            onClick={() => setActiveTab("messages")}
            hasDot={hasUnreadChat} // 🚀 Munculkan titik merah di desktop
          />
          <NavItem
            isDarkMode={isDarkMode}
            icon={<Package size={18} />}
            label="PRODUK"
            active={activeTab === "products"}
            onClick={() => setActiveTab("products")}
            count={productCount}
          />

          <div
            className={`h-[1px] my-4 mx-2 ${
              isDarkMode ? "bg-slate-800" : "bg-slate-100"
            }`}
          ></div>

          <NavItem
            isDarkMode={isDarkMode}
            icon={<MapPin size={18} />}
            label="TITIK MAP"
            active={activeTab === "location"}
            onClick={() => setActiveTab("location")}
          />
          <NavItem
            isDarkMode={isDarkMode}
            icon={<Wallet size={18} />}
            label="KEUANGAN"
            active={activeTab === "finance"}
            onClick={() => setActiveTab("finance")}
          />
          <NavItem
            isDarkMode={isDarkMode}
            icon={<Settings size={18} />}
            label="PENGATURAN"
            active={activeTab === "settings"}
            onClick={() => setActiveTab("settings")}
          />
        </nav>

        {/* BOTTOM ACTION */}
        <div
          className={`p-5 border-t space-y-3 transition-colors ${
            isDarkMode
              ? "border-slate-800 bg-slate-900/50"
              : "border-slate-100 bg-slate-50/50"
          }`}
        >
          <button
            onClick={onToggleStatus}
            className={`w-full py-3 rounded-xl text-[11px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
              merchantProfile?.is_shop_open
                ? "bg-[#008080] text-white shadow-md hover:bg-teal-700"
                : isDarkMode
                  ? "bg-slate-700 text-slate-400 hover:bg-slate-600"
                  : "bg-slate-200 text-slate-500 hover:bg-slate-300"
            }`}
          >
            <Power size={16} />
            {merchantProfile?.is_shop_open ? "TOKO DIBUKA" : "TOKO DITUTUP"}
          </button>
          <button
            onClick={onLogout}
            className={`w-full py-3 text-[11px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 rounded-xl hover:bg-red-500/10 hover:text-red-500 ${
              isDarkMode ? "text-slate-500" : "text-slate-500"
            }`}
          >
            <LogOut size={16} /> KELUAR AKUN
          </button>
        </div>
      </aside>

      {/* --- MOBILE BOTTOM NAV --- */}
      <div
        className={`md:hidden flex justify-around items-center w-full h-16 px-2 border-t shadow-[0_-10px_30px_rgba(0,0,0,0.05)] fixed bottom-0 left-0 z-[100] transition-colors duration-300 ${
          isDarkMode
            ? "bg-slate-900 border-slate-800"
            : "bg-white border-slate-200"
        }`}
      >
        <MobileItem
          isDarkMode={isDarkMode}
          icon={<LayoutDashboard size={20} />}
          label="HOME"
          active={activeTab === "overview"}
          onClick={() => setActiveTab("overview")}
        />
        <MobileItem
          isDarkMode={isDarkMode}
          icon={
            <MessageSquare
              size={20}
              className={hasUnreadChat ? "animate-pulse" : ""}
            />
          }
          label="CHAT"
          active={activeTab === "messages"}
          onClick={() => setActiveTab("messages")}
          hasDot={hasUnreadChat} // 🚀 Munculkan titik merah di mobile
        />

        {/* TOMBOL SAKTI + (TENGAH) */}
        <div className="relative -top-6">
          <button
            onClick={onAddProduct}
            className={`w-14 h-14 bg-[#FF6600] text-white flex items-center justify-center rounded-2xl shadow-[0_10px_25px_-5px_rgba(255,102,0,0.5)] border-[4px] transition-all active:scale-90 ${
              isDarkMode ? "border-slate-900" : "border-white"
            }`}
          >
            <Plus size={32} strokeWidth={4} />
          </button>
        </div>

        <MobileItem
          isDarkMode={isDarkMode}
          icon={<ShoppingBag size={20} />}
          label="ORDER"
          active={activeTab === "orders"}
          onClick={() => setActiveTab("orders")}
          count={orderCount}
        />

        <MobileItem
          isDarkMode={isDarkMode}
          icon={<Package size={20} />}
          label="PRODUK"
          active={activeTab === "products"}
          onClick={() => setActiveTab("products")}
          count={productCount}
        />
      </div>
    </>
  );
};

// --- SUB-KOMPONEN NAV ITEM ---
const NavItem = ({
  icon,
  label,
  active,
  onClick,
  count,
  isDarkMode,
  hasDot,
}: any) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-[11px] font-bold uppercase tracking-widest ${
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
      className={`relative ${
        active
          ? "text-[#008080]"
          : isDarkMode
            ? "text-slate-500"
            : "text-slate-400"
      }`}
    >
      {icon}
      {/* 🔴 TITIK MERAH DESKTOP */}
      {hasDot && (
        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-600 rounded-full border-2 border-white animate-pulse"></span>
      )}
    </div>
    <span className="flex-1 text-left">{label}</span>
    {count > 0 && (
      <span
        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
          active
            ? "bg-[#008080] text-white"
            : isDarkMode
              ? "bg-slate-800 text-slate-400"
              : "bg-slate-100 text-slate-500"
        }`}
      >
        {count}
      </span>
    )}
  </button>
);

// --- SUB-KOMPONEN MOBILE ITEM ---
const MobileItem = ({
  icon,
  label,
  active,
  onClick,
  count,
  isDarkMode,
  hasDot, // 🚀 Terima prop dot
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
      {/* 🔴 TITIK MERAH MOBILE (CHAT) */}
      {hasDot && (
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-600 rounded-full border-2 border-white animate-bounce shadow-sm"></span>
      )}
      {/* BADGE ANGKA (ORDERS/PRODUCTS) */}
      {count > 0 && (
        <span className="absolute -top-1.5 -right-1.5 px-1 min-w-[16px] h-[16px] bg-[#FF6600] text-white text-[9px] font-bold flex items-center justify-center rounded-full border-2 border-white shadow-sm">
          {count}
        </span>
      )}
    </div>
    <span className="text-[9px] font-bold uppercase mt-1 tracking-wider">
      {label}
    </span>
  </button>
);

export default MerchantSidebar;
