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
import { Moon, Sun, Loader2 } from "lucide-react";

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

  // 🚀 MENGGUNAKAN COUNTER AGAR SINYAL STABIL
  const [triggerAddProduct, setTriggerAddProduct] = useState(0);

  const [visitedTabs, setVisitedTabs] = useState<Record<string, boolean>>({
    overview: true,
  });

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

  // 🚀 FUNGSI KLIK + (TENGAH)
  const handleAddProductShortcut = () => {
    setTriggerAddProduct((prev) => prev + 1); // Tambah counter sinyal
    setActiveTab("products");
  };

  if (!merchantProfile) {
    return (
      <div
        className={`min-h-screen flex flex-col items-center justify-center font-bold text-[12px] uppercase tracking-[0.3em] transition-colors duration-300 ${
          isDarkMode
            ? "bg-slate-950 text-slate-700"
            : "bg-slate-50 text-slate-300"
        }`}
      >
        <Loader2 className="animate-spin mb-4" size={32} />
        MENYIAPKAN DASHBOARD...
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen flex flex-col md:flex-row font-sans text-left overflow-hidden transition-colors duration-500 ${
        isDarkMode ? "bg-slate-950" : "bg-slate-50"
      }`}
    >
      {/* SIDEBAR DESKTOP */}
      <aside
        className={`hidden md:flex w-64 h-screen fixed left-0 top-0 z-50 border-r transition-colors duration-300 ${
          isDarkMode
            ? "bg-slate-900 border-slate-800 shadow-2xl"
            : "bg-white border-slate-200 shadow-sm"
        }`}
      >
        <MerchantSidebar
          activeTab={activeTab}
          setActiveTab={(tab: any) => {
            setActiveTab(tab as TabType);
            setTriggerAddProduct(0); // Reset sinyal jika klik tab manual
          }}
          merchantProfile={merchantProfile}
          onLocationClick={() => setActiveTab("location")}
          onLogout={logout}
          onToggleStatus={toggleShopStatus}
          onAddProduct={handleAddProductShortcut}
          orderCount={validOrdersCount}
          productCount={validProductsCount}
          isDarkMode={isDarkMode}
        />
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 md:ml-64 w-full h-screen overflow-hidden">
        <div
          className={`border-b sticky top-0 z-40 shadow-sm flex items-center h-[70px] px-4 md:px-8 transition-colors duration-300 ${
            isDarkMode
              ? "bg-slate-900 border-slate-800"
              : "bg-white border-slate-200"
          }`}
        >
          <div className="flex-1">
            <MerchantHeader
              shopName={merchantProfile.shop_name}
              marketName={merchantProfile.market_name}
              isOpen={merchantProfile.is_shop_open}
            />
          </div>

          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-2.5 rounded-xl transition-all active:scale-90 shadow-sm border ${
              isDarkMode
                ? "bg-slate-800 border-slate-700 text-yellow-400 hover:bg-slate-700"
                : "bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100"
            }`}
          >
            {isDarkMode ? (
              <Sun size={18} strokeWidth={2.5} />
            ) : (
              <Moon size={18} strokeWidth={2.5} />
            )}
          </button>
        </div>

        <main
          className={`flex-1 overflow-y-auto no-scrollbar pb-24 md:pb-10 transition-colors duration-300 ${
            isDarkMode ? "bg-slate-950" : "bg-slate-50/50"
          } p-4 md:p-8`}
        >
          <div className="w-full max-w-[1400px] mx-auto relative">
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
                  autoOpenTrigger={triggerAddProduct} // 🚀 Gunakan trigger baru
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

        {/* BOTTOM NAV MOBILE */}
        <div
          className={`md:hidden fixed bottom-0 left-0 right-0 z-50 border-t transition-colors duration-300 ${
            isDarkMode
              ? "bg-slate-900 border-slate-800 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]"
              : "bg-white border-slate-200 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]"
          }`}
        >
          <MerchantSidebar
            activeTab={activeTab}
            setActiveTab={(tab: any) => {
              setActiveTab(tab as TabType);
              setTriggerAddProduct(0); // 🚀 Reset sinyal jika klik tab manual (Katalog dll)
            }}
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

      <style>{`
        .dark .bg-white { background-color: #0f172a !important; color: #f1f5f9 !important; }
        .dark .text-slate-800, .dark .text-slate-900 { color: #f8fafc !important; }
        .dark .border-slate-200, .dark .border-slate-100 { border-color: #1e293b !important; }
        .dark .bg-slate-50, .dark .bg-slate-100 { background-color: #020617 !important; }
        .dark input, .dark select, .dark textarea { background-color: #1e293b !important; border-color: #334155 !important; color: white !important; }
        
        * { font-style: normal !important; }
        h1, h2, h3, h4, h5, button, label, span, p, input { font-weight: 800 !important; text-transform: uppercase !important; }
      `}</style>
    </div>
  );
};

export default MerchantDashboard;
