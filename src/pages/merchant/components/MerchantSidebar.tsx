import React, { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { useAuth } from "../../../contexts/AuthContext";
import { useToast } from "../../../contexts/ToastContext";
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
  Loader2,
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
  hasUnreadChat?: boolean;
}

export const MerchantSidebar: React.FC<Props> = ({
  activeTab,
  setActiveTab,
  merchantProfile,
  onLocationClick,
  onLogout,
  onAddProduct,
  orderCount,
  productCount,
  isDarkMode,
  hasUnreadChat,
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [marketName, setMarketName] = useState<string>("MEMUAT PASAR...");
  const [isStoreOpen, setIsStoreOpen] = useState(
    merchantProfile?.is_shop_open || false,
  );
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    const fetchMarketName = async () => {
      const marketId =
        merchantProfile?.market_id || merchantProfile?.markets?.id;
      if (!marketId) {
        setMarketName("CABANG PASAR LOKAL");
        return;
      }
      try {
        const { data } = await supabase
          .from("markets")
          .select("name")
          .eq("id", marketId)
          .maybeSingle();
        if (data) setMarketName(data.name);
      } catch (err) {
        console.error("Gagal memuat nama pasar:", err);
      }
    };

    fetchMarketName();
    setIsStoreOpen(merchantProfile?.is_shop_open || false);
  }, [merchantProfile]);

  const handleToggleStoreStatus = async () => {
    if (!user?.id) return;
    setIsUpdatingStatus(true);
    try {
      const newStatus = !isStoreOpen;
      const { error } = await supabase
        .from("merchants")
        .update({ is_shop_open: newStatus })
        .eq("id", user.id);
      if (error) throw error;
      setIsStoreOpen(newStatus);
      showToast(
        newStatus ? "TOKO BERHASIL DIBUKA! 🟢" : "TOKO DITUTUP! 🔴",
        "success",
      );
    } catch (err: any) {
      showToast("Gagal mengubah status: " + err.message, "error");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <>
      {/* --- SIDEBAR DESKTOP --- */}
      <aside
        className={`hidden md:flex w-full flex-col h-full transition-colors duration-300 ${isDarkMode ? "bg-slate-900 text-slate-300" : "bg-white text-slate-700"} relative z-50`}
      >
        <div
          className={`p-6 border-b ${isDarkMode ? "border-slate-800" : "border-slate-100"}`}
        >
          <div className="flex flex-col gap-3 mb-6">
            <div className="h-10 w-full flex items-center">
              <img
                src="/logo-text.png"
                alt="PasarQu"
                className={`h-full object-contain transition-all duration-300 ${isDarkMode ? "brightness-[2] contrast-125" : "brightness-100"}`}
              />
            </div>
            <div className="px-0.5">
              <p className="text-[#FF6600] text-[10px] font-[1000] tracking-[0.3em] uppercase leading-none">
                SELLER CENTER
              </p>
            </div>
          </div>

          <div
            className={`w-full p-3 rounded-xl border text-left transition-all ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-teal-50/50 border-teal-100"}`}
          >
            <p className="text-[9px] font-bold tracking-widest mb-1 uppercase text-[#008080]">
              LOKASI LAPAK:
            </p>
            <div className="flex items-center gap-2">
              <MapPin size={14} className="text-[#008080]" />
              <p
                className={`text-[11px] font-bold uppercase truncate ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}
              >
                {marketName}
              </p>
            </div>
          </div>
        </div>

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
            hasDot={hasUnreadChat}
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
            className={`h-[1px] my-4 mx-2 ${isDarkMode ? "bg-slate-800" : "bg-slate-100"}`}
          ></div>

          <NavItem
            isDarkMode={isDarkMode}
            icon={<MapPin size={18} />}
            label="TITIK MAP TOKO"
            active={activeTab === "location"}
            onClick={() => {
              setActiveTab("location");
              onLocationClick();
            }}
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

        <div
          className={`p-5 border-t space-y-3 transition-colors ${isDarkMode ? "border-slate-800 bg-slate-900/50" : "border-slate-100 bg-slate-50/50"}`}
        >
          <button
            onClick={handleToggleStoreStatus}
            disabled={isUpdatingStatus}
            className={`w-full py-3 rounded-xl text-[11px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all disabled:opacity-50 ${isStoreOpen ? "bg-[#008080] text-white shadow-md hover:bg-teal-700" : isDarkMode ? "bg-slate-700 text-red-400 hover:bg-slate-600" : "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"}`}
          >
            {isUpdatingStatus ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Power size={16} />
            )}
            {isStoreOpen ? "TOKO DIBUKA" : "TOKO DITUTUP"}
          </button>
          <button
            onClick={onLogout}
            className={`w-full py-3 text-[11px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 rounded-xl hover:bg-red-500/10 hover:text-red-500 ${isDarkMode ? "text-slate-500" : "text-slate-500"}`}
          >
            <LogOut size={16} /> KELUAR AKUN
          </button>
        </div>
      </aside>

      {/* --- MOBILE BOTTOM NAV (PADAT & ELEGAN) --- */}
      <div
        className={`md:hidden flex justify-between items-end w-full h-[60px] px-2 pb-2 pt-1 border-t fixed bottom-0 left-0 z-[100] transition-colors duration-300 ${isDarkMode ? "bg-slate-900 border-slate-800 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]" : "bg-white border-slate-200 shadow-[0_-10px_20px_rgba(0,0,0,0.04)]"}`}
      >
        <MobileItem
          isDarkMode={isDarkMode}
          icon={<LayoutDashboard size={22} />}
          label="Home"
          active={activeTab === "overview"}
          onClick={() => setActiveTab("overview")}
        />
        <MobileItem
          isDarkMode={isDarkMode}
          icon={<ShoppingBag size={22} />}
          label="Order"
          active={activeTab === "orders"}
          onClick={() => setActiveTab("orders")}
          count={orderCount}
        />

        {/* FAB (TOMBOL PLUS) DIPADATKAN */}
        <div className="relative -top-5 flex flex-col items-center justify-center w-14">
          <button
            onClick={onAddProduct}
            className={`w-12 h-12 bg-gradient-to-tr from-[#FF6600] to-orange-500 text-white flex items-center justify-center rounded-2xl shadow-[0_8px_20px_-5px_rgba(255,102,0,0.5)] transition-all active:scale-90`}
          >
            <Plus size={28} strokeWidth={3} />
          </button>
        </div>

        {/* 🚀 CHAT MENGGANTIKAN KELUAR DI SINI AGAR LEBIH PAS */}
        <MobileItem
          isDarkMode={isDarkMode}
          icon={
            <MessageSquare
              size={22}
              className={hasUnreadChat ? "animate-pulse text-red-500" : ""}
            />
          }
          label="Chat"
          active={activeTab === "messages"}
          onClick={() => setActiveTab("messages")}
          hasDot={hasUnreadChat}
        />
        <MobileItem
          isDarkMode={isDarkMode}
          icon={<MapPin size={22} />}
          label="Map"
          active={activeTab === "location"}
          onClick={() => {
            setActiveTab("location");
            onLocationClick();
          }}
        />
      </div>
    </>
  );
};

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
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-[11px] font-bold uppercase tracking-widest ${active ? (isDarkMode ? "bg-[#008080]/30 text-[#008080]" : "bg-[#008080]/10 text-[#008080]") : isDarkMode ? "text-slate-400 hover:bg-slate-800 hover:text-white" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"}`}
  >
    <div
      className={`relative ${active ? "text-[#008080]" : isDarkMode ? "text-slate-500" : "text-slate-400"}`}
    >
      {icon}
      {hasDot && (
        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-600 rounded-full border-2 border-white animate-pulse"></span>
      )}
    </div>
    <span className="flex-1 text-left">{label}</span>
    {count > 0 && (
      <span
        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${active ? "bg-[#008080] text-white" : isDarkMode ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-500"}`}
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
  hasDot,
}: any) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center w-[20%] relative transition-all ${active ? "text-[#008080]" : isDarkMode ? "text-slate-500 hover:text-slate-300" : "text-slate-400 hover:text-slate-600"}`}
  >
    <div className="relative mb-1">
      {icon}
      {hasDot && (
        <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-600 rounded-full border-2 border-white animate-bounce shadow-sm"></span>
      )}
      {count > 0 && (
        <span className="absolute -top-1.5 -right-2 min-w-[16px] h-[16px] px-1 bg-[#FF6600] text-white text-[9px] font-bold flex items-center justify-center rounded-full border-2 border-white shadow-sm">
          {count}
        </span>
      )}
    </div>
    <span className="text-[10px] font-semibold tracking-wide capitalize">
      {label}
    </span>
  </button>
);

export default MerchantSidebar;
