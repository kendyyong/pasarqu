import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useMerchantDashboard } from "../../hooks/useMerchantDashboard";

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

// --- ICONS ---
import { Moon, Sun } from "lucide-react";

type TabType =
  | "overview"
  | "products"
  | "orders"
  | "wallet"
  | "messages"
  | "finance"
  | "location";

export const MerchantDashboard: React.FC = () => {
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [triggerAddProduct, setTriggerAddProduct] = useState(false);
  const [visitedTabs, setVisitedTabs] = useState<Record<string, boolean>>({
    overview: true,
  });

  // ✅ 1. LOGIKA THEME (DARK / LIGHT)
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem("merchant-theme") === "dark";
  });

  const {
    merchantProfile,
    products,
    orders,
    incomingOrder,
    fetchBaseData,
    toggleShopStatus,
    stopAlarm,
  } = useMerchantDashboard();

  useEffect(() => {
    if (!visitedTabs[activeTab])
      setVisitedTabs((prev) => ({ ...prev, [activeTab]: true }));
  }, [activeTab, visitedTabs]);

  // ✅ 2. SYNC THEME KE HTML CLASS & LOCAL STORAGE
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
    setActiveTab("products");
    setTriggerAddProduct(true);
    setTimeout(() => setTriggerAddProduct(false), 500);
  };

  if (!merchantProfile) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center font-black text-[12px] uppercase tracking-[0.3em] animate-pulse transition-colors duration-300 ${isDarkMode ? "bg-slate-950 text-slate-700" : "bg-slate-50 text-slate-300"}`}
      >
        Menyiapkan Dashboard...
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen flex flex-col md:flex-row font-sans text-left overflow-hidden transition-colors duration-500 ${isDarkMode ? "bg-slate-950" : "bg-slate-50"}`}
    >
      {/* SIDEBAR DESKTOP */}
      <aside
        className={`hidden md:flex w-64 h-screen fixed left-0 top-0 z-50 border-r transition-colors duration-300 ${isDarkMode ? "bg-slate-900 border-slate-800 shadow-2xl shadow-black" : "bg-white border-slate-200"}`}
      >
        <MerchantSidebar
          activeTab={activeTab}
          setActiveTab={(tab: any) => setActiveTab(tab as TabType)}
          merchantProfile={merchantProfile}
          onLocationClick={() => setActiveTab("location")}
          onLogout={logout}
          onToggleStatus={toggleShopStatus}
          onAddProduct={handleAddProductShortcut}
          orderCount={validOrdersCount}
          productCount={validProductsCount}
          isDarkMode={isDarkMode} // Kirim prop theme ke sidebar
        />
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 md:ml-64 w-full md:w-[calc(100%-16rem)] h-screen overflow-hidden">
        {/* HEADER DENGAN SWITCHER TEMA */}
        <div
          className={`border-b sticky top-0 z-40 shadow-sm flex items-center transition-colors duration-300 ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}
        >
          <div className="flex-1">
            <MerchantHeader
              shopName={merchantProfile.shop_name}
              marketName={merchantProfile.market_name}
              isOpen={merchantProfile.is_shop_open}
            />
          </div>

          {/* ✅ TOMBOL TOGGLE DARK MODE */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`mr-4 p-2.5 rounded-xl transition-all active:scale-90 ${isDarkMode ? "bg-slate-800 text-yellow-400 hover:bg-slate-700" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
            title={isDarkMode ? "Ganti ke Terang" : "Ganti ke Gelap"}
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>

        {/* WORKSPACE / HALAMAN UTAMA */}
        <main
          className={`flex-1 overflow-y-auto no-scrollbar pb-24 md:pb-10 transition-colors duration-300 ${isDarkMode ? "bg-slate-950" : "bg-slate-50/50"} p-4 md:p-8`}
        >
          <div className="w-full max-w-[1400px] mx-auto relative">
            {/* 1. OVERVIEW */}
            <div className={activeTab === "overview" ? "block" : "hidden"}>
              <MerchantOverview
                merchantProfile={merchantProfile}
                stats={{
                  orders: validOrdersCount,
                  products: validProductsCount,
                }}
              />
            </div>

            {/* 2. PRODUCTS */}
            {visitedTabs["products"] && (
              <div className={activeTab === "products" ? "block" : "hidden"}>
                <MerchantProducts
                  merchantProfile={merchantProfile}
                  autoOpenForm={triggerAddProduct}
                />
              </div>
            )}

            {/* 3. ORDERS */}
            {visitedTabs["orders"] && (
              <div className={activeTab === "orders" ? "block" : "hidden"}>
                <MerchantOrders merchantProfile={merchantProfile} />
              </div>
            )}

            {/* 4. MESSAGES */}
            {visitedTabs["messages"] && (
              <div className={activeTab === "messages" ? "block" : "hidden"}>
                <MerchantMessages />
              </div>
            )}

            {/* 5. FINANCE */}
            {(visitedTabs["wallet"] || visitedTabs["finance"]) && (
              <div
                className={
                  activeTab === "wallet" || activeTab === "finance"
                    ? "block"
                    : "hidden"
                }
              >
                <MerchantFinanceDashboard />
              </div>
            )}

            {/* 6. LOCATION */}
            {activeTab === "location" && (
              <div
                className={`border rounded-xl shadow-sm p-4 transition-colors ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}
              >
                <LocationPickerModal
                  merchantProfile={merchantProfile}
                  onClose={() => setActiveTab("overview")}
                  onUpdate={fetchBaseData}
                />
              </div>
            )}
          </div>
        </main>

        {/* BOTTOM NAV MOBILE */}
        <div
          className={`md:hidden fixed bottom-0 left-0 right-0 z-50 border-t transition-colors duration-300 ${isDarkMode ? "bg-slate-900 border-slate-800 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]" : "bg-white border-slate-200"}`}
        >
          <MerchantSidebar
            activeTab={activeTab}
            setActiveTab={(tab: any) => setActiveTab(tab as TabType)}
            merchantProfile={merchantProfile}
            onLocationClick={() => setActiveTab("location")}
            onLogout={logout}
            onToggleStatus={toggleShopStatus}
            onAddProduct={handleAddProductShortcut}
            orderCount={validOrdersCount}
            productCount={validProductsCount}
            isDarkMode={isDarkMode}
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

      {/* ✅ INTERNAL CSS UNTUK OVERRIDE MODE GELAP (Efisien & Cepat) */}
      <style>{`
        .dark .bg-white { background-color: #0f172a !important; color: #f1f5f9 !important; }
        .dark .text-slate-800, .dark .text-slate-900 { color: #f8fafc !important; }
        .dark .text-slate-700, .dark .text-slate-600 { color: #cbd5e1 !important; }
        .dark .border-slate-200, .dark .border-slate-100 { border-color: #1e293b !important; }
        .dark .bg-slate-50, .dark .bg-slate-100 { background-color: #020617 !important; }
        .dark input, .dark select, .dark textarea { background-color: #1e293b !important; border-color: #334155 !important; color: white !important; }
        .dark .shadow-sm { box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.4) !important; }
        .dark .bg-slate-50\/50 { background-color: rgba(2, 6, 23, 0.5) !important; }
      `}</style>
    </div>
  );
};
