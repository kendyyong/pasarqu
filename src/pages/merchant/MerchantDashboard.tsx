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

import {
  Moon,
  Sun,
  Loader2,
  Settings,
  ShoppingBag,
  MessageSquare,
  LogOut,
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

  // 🚀 STATE KHUSUS UNTUK PROMO DAN CHAT ADMIN
  const [triggerAddProduct, setTriggerAddProduct] = useState(0);
  const [isPromoMode, setIsPromoMode] = useState(false);
  const [chatTarget, setChatTarget] = useState<string | null>(null);

  const [visitedTabs, setVisitedTabs] = useState<Record<string, boolean>>({
    overview: true,
  });

  const [isDarkMode, setIsDarkMode] = useState(
    () => localStorage.getItem("merchant-theme") === "dark",
  );

  const {
    merchantProfile,
    products,
    orders,
    incomingOrder,
    unreadChat,
    setUnreadChat,
    fetchBaseData,
    toggleShopStatus,
    stopAlarm,
  } = useMerchantDashboard();

  useEffect(() => {
    if (
      profile &&
      profile.role === "MERCHANT" &&
      profile.is_verified === false
    ) {
      navigate("/waiting-approval", { replace: true });
    }
  }, [profile, navigate]);

  useEffect(() => {
    if (!visitedTabs[activeTab])
      setVisitedTabs((prev) => ({ ...prev, [activeTab]: true }));
    if (activeTab === "messages") setUnreadChat(false);
  }, [activeTab, visitedTabs, setUnreadChat]);

  useEffect(() => {
    const root = window.document.documentElement;
    isDarkMode ? root.classList.add("dark") : root.classList.remove("dark");
    localStorage.setItem("merchant-theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  const validProductsCount =
    products?.filter((p: any) => p && p.id).length || 0;
  const validOrdersCount =
    orders?.filter(
      (o: any) =>
        ["PROCESSING", "READY"].includes(o.status) ||
        ["PACKING", "READY_TO_PICKUP", "SHIPPED"].includes(o.shipping_status),
    ).length || 0;

  // 🚀 FUNGSI ROUTING PINTAR DARI OVERVIEW
  const handleSmartNavigation = (tab: string) => {
    if (tab === "products") {
      setIsPromoMode(false); // Mode Katalog Normal
      setActiveTab("products");
    } else if (tab === "promo") {
      setIsPromoMode(true); // Mode Promo (Edit Harga Saja)
      setActiveTab("products");
    } else if (tab === "help") {
      setChatTarget("admin"); // Buka chat dan targetkan Admin
      setActiveTab("messages");
    } else {
      setActiveTab(tab as TabType);
      setIsPromoMode(false); // Reset
      setChatTarget(null); // Reset
    }
  };

  const calculateTodayOmzet = () => {
    if (!orders) return 0;
    const today = new Date().toDateString();
    return orders
      .filter(
        (o: any) =>
          new Date(o.created_at).toDateString() === today &&
          o.status !== "UNPAID",
      )
      .reduce((sum: number, o: any) => sum + (o.total_price || 0), 0);
  };

  const calculatePendingOrders = () => {
    if (!orders) return 0;
    return orders.filter(
      (o: any) => o.shipping_status === "PACKING" || o.status === "PROCESSING",
    ).length;
  };

  if (!merchantProfile) {
    return (
      <div
        className={`min-h-screen flex flex-col items-center justify-center font-bold text-[12px] uppercase tracking-[0.2em] transition-colors duration-300 ${isDarkMode ? "bg-slate-950 text-slate-700" : "bg-slate-50 text-slate-400"}`}
      >
        <Loader2 className="animate-spin mb-4" size={28} /> MEMUAT DASHBOARD...
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen flex flex-col md:flex-row font-sans text-left overflow-hidden transition-colors duration-500 ${isDarkMode ? "bg-slate-950" : "bg-slate-50"}`}
    >
      <aside
        className={`hidden md:flex w-64 h-screen fixed left-0 top-0 z-50 border-r transition-colors duration-300 ${isDarkMode ? "bg-slate-900 border-slate-800 shadow-2xl" : "bg-white border-slate-200 shadow-sm"}`}
      >
        <MerchantSidebar
          activeTab={activeTab}
          setActiveTab={handleSmartNavigation}
          merchantProfile={merchantProfile}
          onLocationClick={() => setActiveTab("location")}
          onLogout={logout}
          onToggleStatus={toggleShopStatus}
          onAddProduct={() => {
            setIsPromoMode(false);
            setActiveTab("products");
          }}
          orderCount={validOrdersCount}
          productCount={validProductsCount}
          isDarkMode={isDarkMode}
          hasUnreadChat={unreadChat}
        />
      </aside>

      <div className="flex-1 flex flex-col min-w-0 md:ml-64 w-full h-screen overflow-hidden">
        <div
          className={`border-b sticky top-0 z-[100] shadow-sm flex items-center justify-between h-[60px] md:h-[70px] px-3 md:px-8 transition-colors duration-300 ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}
        >
          <div className="flex-1 min-w-0 pr-2">
            <MerchantHeader
              shopName={merchantProfile.shop_name}
              marketName={merchantProfile.market_name}
              isOpen={merchantProfile.is_shop_open}
              avatarUrl={profile?.avatar_url}
            />
          </div>

          <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
            <div className="hidden md:block relative">
              <button
                onClick={() => handleSmartNavigation("messages")}
                className={`w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-lg md:rounded-xl transition-all active:scale-90 border ${unreadChat ? "bg-red-50 border-red-200 text-red-600 animate-bounce" : isDarkMode ? "bg-slate-800 border-slate-700 text-slate-400 hover:text-white" : "bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-800"}`}
              >
                <MessageSquare
                  size={16}
                  strokeWidth={2.5}
                  className="md:w-[18px] md:h-[18px]"
                />
              </button>
              {unreadChat && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 md:w-3 md:h-3 bg-red-600 rounded-full border-2 border-white shadow-sm"></span>
              )}
            </div>

            <button
              onClick={() => navigate("/?mode=belanja")}
              className="flex items-center gap-1.5 h-8 px-2.5 md:h-10 md:px-3 rounded-lg md:rounded-xl font-black text-[10px] md:text-[11px] uppercase tracking-wide transition-all active:scale-90 border shadow-sm bg-[#FF6600] text-white border-orange-400 hover:bg-orange-600"
            >
              <ShoppingBag
                size={14}
                strokeWidth={2.5}
                className="md:w-[15px] md:h-[15px]"
              />
              <span className="hidden sm:inline-block">BELANJA</span>
            </button>

            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-lg md:rounded-xl transition-all active:scale-90 border ${isDarkMode ? "bg-slate-800 border-slate-700 text-yellow-400" : "bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-800"}`}
            >
              {isDarkMode ? (
                <Sun
                  size={16}
                  strokeWidth={2.5}
                  className="md:w-[18px] md:h-[18px]"
                />
              ) : (
                <Moon
                  size={16}
                  strokeWidth={2.5}
                  className="md:w-[18px] md:h-[18px]"
                />
              )}
            </button>

            <button
              onClick={() => handleSmartNavigation("settings")}
              className={`w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-lg md:rounded-xl transition-all active:scale-90 border ${activeTab === "settings" ? "bg-[#008080] text-white border-[#008080]" : isDarkMode ? "bg-slate-800 border-slate-700 text-slate-400 hover:text-white" : "bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-800"}`}
            >
              <Settings
                size={16}
                strokeWidth={2.5}
                className="md:w-[18px] md:h-[18px]"
              />
            </button>
          </div>
        </div>

        <main
          className={`flex-1 overflow-y-auto no-scrollbar pb-[70px] md:pb-10 transition-colors duration-300 ${isDarkMode ? "bg-slate-950" : "bg-slate-50/50"} p-3 md:p-8`}
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
                onNavigate={handleSmartNavigation}
              />
            </div>

            {/* 🚀 KIRIM PROP isPromoMode ke MerchantProducts */}
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
                  isPromoMode={isPromoMode}
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

            {/* 🚀 KIRIM PROP autoSelectTarget ke MerchantMessages */}
            {visitedTabs["messages"] && (
              <div
                className={
                  activeTab === "messages"
                    ? "block animate-in fade-in duration-500"
                    : "hidden"
                }
              >
                <MerchantMessages autoSelectTarget={chatTarget} />
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
                  onLogout={logout}
                />
              </div>
            )}
            {activeTab === "location" && (
              <div className="border rounded-[2rem] shadow-xl md:p-8 transition-colors bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 overflow-hidden">
                <LocationPickerModal
                  merchantProfile={merchantProfile}
                  onClose={() => setActiveTab("overview")}
                  onUpdate={fetchBaseData}
                />
              </div>
            )}
          </div>
        </main>

        <div
          className={`md:hidden fixed bottom-0 left-0 right-0 z-50 border-t transition-colors duration-300 ${isDarkMode ? "bg-slate-900 border-slate-800 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]" : "bg-white border-slate-200 shadow-[0_-10px_20px_rgba(0,0,0,0.03)]"}`}
        >
          <MerchantSidebar
            activeTab={activeTab}
            setActiveTab={handleSmartNavigation}
            merchantProfile={merchantProfile}
            onLocationClick={() => setActiveTab("location")}
            onLogout={logout}
            onToggleStatus={toggleShopStatus}
            onAddProduct={() => {
              setIsPromoMode(false);
              setActiveTab("products");
            }}
            orderCount={validOrdersCount}
            productCount={validProductsCount}
            isDarkMode={isDarkMode}
            hasUnreadChat={unreadChat}
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
    </div>
  );
};

export default MerchantDashboard;
