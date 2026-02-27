import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useMerchantDashboard } from "../../hooks/useMerchantDashboard";
import { useNavigate } from "react-router-dom";

// --- COMPONENTS ---
import { MerchantSidebar } from "./components/MerchantSidebar";
import { MerchantHeader } from "./components/MerchantHeader";
import { MerchantAlarmModal } from "./components/MerchantAlarmModal";
import { MerchantOverview } from "./components/MerchantOverview";
import { MerchantProducts } from "./components/MerchantProducts";
import { MerchantOrders } from "./components/MerchantOrders";
import { MerchantFinanceDashboard } from "./components/MerchantFinanceDashboard";
import { MerchantMessages } from "./components/MerchantMessages";
import { LocationPickerModal } from "./components/LocationPickerModal";
import { MerchantSettings } from "./components/MerchantSettings";

// --- ICONS ---
import {
  Moon,
  Sun,
  Loader2,
  Settings,
  ShoppingBag,
  MessageSquare,
} from "lucide-react";

type TabType =
  | "overview"
  | "products"
  | "orders"
  | "wallet"
  | "messages"
  | "finance"
  | "location"
  | "settings";

export const MerchantDashboard: React.FC = () => {
  const { logout, profile } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [triggerAddProduct, setTriggerAddProduct] = useState(0);

  const [visitedTabs, setVisitedTabs] = useState<Record<string, boolean>>({
    overview: true,
  });

  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem("merchant-theme") === "dark";
  });

  // 🚀 AMBIL UNREAD CHAT DARI HOOK YANG SUDAH KITA PERBAIKI
  const {
    merchantProfile,
    products,
    orders,
    incomingOrder,
    unreadChat, // 🔔 Telinga baru untuk chat
    setUnreadChat, // 🔔 Tangan untuk mematikan notif
    fetchBaseData,
    toggleShopStatus,
    stopAlarm,
  } = useMerchantDashboard();

  // 🛡️ PENJAGA PINTU BELAKANG
  useEffect(() => {
    if (profile) {
      if (profile.role === "MERCHANT" && profile.is_verified === false) {
        navigate("/waiting-approval", { replace: true });
      }
    }
  }, [profile, navigate]);

  useEffect(() => {
    if (!visitedTabs[activeTab])
      setVisitedTabs((prev) => ({ ...prev, [activeTab]: true }));

    // 🚀 AUTO-OFF NOTIF: Jika tab pesan dibuka, matikan tanda merah
    if (activeTab === "messages") {
      setUnreadChat(false);
    }
  }, [activeTab, visitedTabs, setUnreadChat]);

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add("dark");
      localStorage.setItem("merchant-theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("merchant-theme", "light");
    }
  }, [isDarkMode]);

  const validProductsCount = products
    ? products.filter((p: any) => p && p.id).length
    : 0;
  const validOrdersCount = orders
    ? orders.filter((o: any) => o && o.id).length
    : 0;

  const handleAddProductShortcut = () => {
    setTriggerAddProduct((prev) => prev + 1);
    setActiveTab("products");
  };

  const calculateTodayOmzet = () => {
    if (!orders) return 0;
    const today = new Date().toDateString();
    return orders
      .filter((o: any) => {
        const orderDate = new Date(o.created_at).toDateString();
        return orderDate === today && o.status !== "UNPAID";
      })
      .reduce((sum: number, o: any) => sum + (o.total_price || 0), 0);
  };

  const calculatePendingOrders = () => {
    if (!orders) return 0;
    return orders.filter(
      (o: any) => o.shipping_status === "PACKING" || o.status === "UNPAID",
    ).length;
  };

  if (!merchantProfile) {
    return (
      <div
        className={`min-h-screen flex flex-col items-center justify-center font-bold text-[12px] uppercase tracking-[0.3em] transition-colors duration-300 ${isDarkMode ? "bg-slate-950 text-slate-700" : "bg-slate-50 text-slate-300"}`}
      >
        <Loader2 className="animate-spin mb-4" size={32} />
        MENYIAPKAN DASHBOARD...
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen flex flex-col md:flex-row font-sans text-left overflow-hidden transition-colors duration-500 ${isDarkMode ? "bg-slate-950" : "bg-slate-50"}`}
    >
      {/* SIDEBAR DESKTOP */}
      <aside
        className={`hidden md:flex w-64 h-screen fixed left-0 top-0 z-50 border-r transition-colors duration-300 ${isDarkMode ? "bg-slate-900 border-slate-800 shadow-2xl" : "bg-white border-slate-200 shadow-sm"}`}
      >
        <MerchantSidebar
          activeTab={activeTab}
          setActiveTab={(tab: any) => {
            setActiveTab(tab as TabType);
            setTriggerAddProduct(0);
          }}
          merchantProfile={merchantProfile}
          onLocationClick={() => setActiveTab("location")}
          onLogout={logout}
          onToggleStatus={toggleShopStatus}
          onAddProduct={handleAddProductShortcut}
          orderCount={validOrdersCount}
          productCount={validProductsCount}
          isDarkMode={isDarkMode}
          hasUnreadChat={unreadChat} // 🚀 Oper notif ke sidebar
        />
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 md:ml-64 w-full h-screen overflow-hidden">
        {/* HEADER / TOP BAR */}
        <div
          className={`border-b sticky top-0 z-[100] shadow-sm flex items-center h-[70px] px-4 md:px-8 transition-colors duration-300 ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}
        >
          <div className="flex-1 min-w-0 pr-2">
            <MerchantHeader
              shopName={merchantProfile.shop_name}
              marketName={merchantProfile.market_name}
              isOpen={merchantProfile.is_shop_open}
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* 🚀 TOMBOL CHAT CEPAT (Hanya Desktop) */}
            <div className="hidden md:block relative mr-2">
              <button
                onClick={() => setActiveTab("messages")}
                className={`p-2.5 rounded-xl transition-all active:scale-90 shadow-sm border ${unreadChat ? "bg-red-50 border-red-200 text-red-600 animate-bounce" : isDarkMode ? "bg-slate-800 border-slate-700 text-slate-400" : "bg-slate-50 border-slate-100 text-slate-500"}`}
              >
                <MessageSquare size={18} strokeWidth={2.5} />
              </button>
              {unreadChat && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-600 rounded-full border-2 border-white shadow-sm"></span>
              )}
            </div>

            {/* TOMBOL BELANJA */}
            <button
              onClick={() => {
                navigate("/?mode=belanja");
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-black text-[10px] md:text-[11px] uppercase tracking-tighter transition-all active:scale-90 border shadow-md bg-[#FF6600] text-white border-orange-400 hover:bg-orange-600"
            >
              <ShoppingBag size={15} strokeWidth={3} />
              <span className="inline-block">BELANJA</span>
            </button>

            {/* DARK MODE TOGGLE */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-2.5 rounded-xl transition-all active:scale-90 shadow-sm border ${isDarkMode ? "bg-slate-800 border-slate-700 text-yellow-400" : "bg-slate-50 border-slate-100 text-slate-500"}`}
            >
              {isDarkMode ? (
                <Sun size={18} strokeWidth={2.5} />
              ) : (
                <Moon size={18} strokeWidth={2.5} />
              )}
            </button>

            {/* TOMBOL SETTING (MOBILE) */}
            <button
              onClick={() => setActiveTab("settings")}
              className={`md:hidden p-2.5 rounded-xl transition-all active:scale-90 border ${activeTab === "settings" ? "bg-[#008080] text-white border-[#008080]" : isDarkMode ? "bg-slate-800 border-slate-700 text-slate-400" : "bg-slate-50 border-slate-100 text-slate-500"}`}
            >
              <Settings size={18} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        <main
          className={`flex-1 overflow-y-auto no-scrollbar pb-24 md:pb-10 transition-colors duration-300 ${isDarkMode ? "bg-slate-950" : "bg-slate-50/50"} p-4 md:p-8`}
        >
          <div className="w-full max-w-[1400px] mx-auto relative text-left">
            <div
              className={
                activeTab === "overview"
                  ? "block animate-in fade-in slide-in-from-bottom-2 duration-500"
                  : "hidden"
              }
            >
              <MerchantOverview
                merchantProfile={merchantProfile}
                stats={{
                  orders: validOrdersCount,
                  products: validProductsCount,
                  todayOmzet: calculateTodayOmzet(),
                  pendingOrders: calculatePendingOrders(),
                }}
                recentOrders={orders || []}
                onNavigate={(tab) => {
                  setActiveTab(tab as TabType);
                  if (tab === "products")
                    setTriggerAddProduct((prev) => prev + 1);
                }}
              />
            </div>

            {visitedTabs["products"] && (
              <div
                className={
                  activeTab === "products"
                    ? "block animate-in fade-in duration-500"
                    : "hidden"
                }
              >
                <MerchantProducts
                  merchantProfile={merchantProfile}
                  autoOpenTrigger={triggerAddProduct}
                />
              </div>
            )}

            {visitedTabs["orders"] && (
              <div
                className={
                  activeTab === "orders"
                    ? "block animate-in fade-in duration-500"
                    : "hidden"
                }
              >
                <MerchantOrders merchantProfile={merchantProfile} />
              </div>
            )}

            {visitedTabs["messages"] && (
              <div
                className={
                  activeTab === "messages"
                    ? "block animate-in fade-in duration-500"
                    : "hidden"
                }
              >
                <MerchantMessages />
              </div>
            )}

            {(visitedTabs["wallet"] || visitedTabs["finance"]) && (
              <div
                className={
                  activeTab === "wallet" || activeTab === "finance"
                    ? "block animate-in fade-in duration-500"
                    : "hidden"
                }
              >
                <MerchantFinanceDashboard />
              </div>
            )}

            {visitedTabs["settings"] && (
              <div
                className={
                  activeTab === "settings"
                    ? "block animate-in fade-in duration-500"
                    : "hidden"
                }
              >
                <MerchantSettings
                  merchantProfile={merchantProfile}
                  onUpdate={fetchBaseData}
                />
              </div>
            )}

            {activeTab === "location" && (
              <div className="border rounded-[2rem] shadow-xl p-4 md:p-8 transition-colors bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                <LocationPickerModal
                  merchantProfile={merchantProfile}
                  onClose={() => setActiveTab("overview")}
                  onUpdate={fetchBaseData}
                />
              </div>
            )}
          </div>
        </main>

        {/* BOTTOM NAV MOBILE DENGAN NOTIF CHAT */}
        <div
          className={`md:hidden fixed bottom-0 left-0 right-0 z-50 border-t transition-colors duration-300 ${isDarkMode ? "bg-slate-900 border-slate-800 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]" : "bg-white border-slate-200 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]"}`}
        >
          <MerchantSidebar
            activeTab={activeTab}
            setActiveTab={(tab: any) => {
              setActiveTab(tab as TabType);
              setTriggerAddProduct(0);
            }}
            merchantProfile={merchantProfile}
            onLocationClick={() => setActiveTab("location")}
            onLogout={logout}
            onToggleStatus={toggleShopStatus}
            onAddProduct={handleAddProductShortcut}
            orderCount={validOrdersCount}
            productCount={validProductsCount}
            isDarkMode={isDarkMode}
            hasUnreadChat={unreadChat} // 🚀 Oper notif ke mobile sidebar
          />
        </div>
      </div>

      <MerchantAlarmModal
        incomingOrder={incomingOrder}
        onProcess={() => {
          stopAlarm();
          setActiveTab("orders");
          fetchBaseData();
        }}
        onMute={stopAlarm}
      />

      <style>{`
        .dark .bg-white { background-color: #0f172a !important; color: #f1f5f9 !important; }
        .dark .text-slate-800, .dark .text-slate-900 { color: #f8fafc !important; }
        .dark .border-slate-200, .dark .border-slate-100 { border-color: #1e293b !important; }
        .dark .bg-slate-50, .dark .bg-slate-100 { background-color: #020617 !important; }
        .dark input, .dark select, .dark textarea { background-color: #1e293b !important; border-color: #334155 !important; color: white !important; }
        h1, h2, h3, h4, h5, button, label, span, p, input { font-weight: 800 !important; text-transform: uppercase !important; }
      `}</style>
    </div>
  );
};

export default MerchantDashboard;
