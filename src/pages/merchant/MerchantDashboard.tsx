import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";

// --- HOOKS ---
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

  // State untuk melacak tab mana saja yang PERNAH dibuka
  // Agar tidak memuat semua tab sekaligus di awal (Lazy Load)
  const [visitedTabs, setVisitedTabs] = useState<Record<string, boolean>>({
    overview: true,
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

  // Update daftar tab yang pernah dikunjungi
  useEffect(() => {
    if (!visitedTabs[activeTab]) {
      setVisitedTabs((prev) => ({ ...prev, [activeTab]: true }));
    }
  }, [activeTab, visitedTabs]);

  // Safe Counters
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

  const handleProcessOrder = () => {
    stopAlarm();
    setActiveTab("orders");
    fetchBaseData();
  };

  // Tampilan awal saat memuat data profil
  if (!merchantProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white font-black text-slate-300 uppercase tracking-[0.3em] animate-pulse">
        Menyiapkan Dashboard...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row font-sans text-left overflow-hidden">
      {/* SIDEBAR */}
      <aside className="hidden md:flex w-64 h-screen fixed left-0 top-0 z-50 border-r border-slate-100 bg-white">
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
        />
      </aside>

      {/* KONTEN UTAMA */}
      <div className="flex-1 flex flex-col min-w-0 md:ml-64 w-full md:w-[calc(100%-16rem)] h-screen overflow-hidden">
        {/* HEADER */}
        <MerchantHeader
          shopName={merchantProfile.shop_name}
          marketName={merchantProfile.market_name}
          isOpen={merchantProfile.is_shop_open}
        />

        {/* TAB CONTENT AREA */}
        <main className="flex-1 overflow-y-auto no-scrollbar pb-24 md:pb-6 bg-slate-50/30">
          <div className="p-3 md:p-6 w-full max-w-[1400px] mx-auto relative">
            {/* TEKNIK ANTI-KEDIP (KEEP ALIVE):
                Semua tab dirender tapi disembunyikan (hidden) jika tidak aktif.
                Ini mencegah "Unmount/Mount" yang menyebabkan layar putih.
            */}

            {/* 1. OVERVIEW */}
            <div
              className={
                activeTab === "overview"
                  ? "block animate-in fade-in duration-300"
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

            {/* 2. PRODUCTS */}
            {visitedTabs["products"] && (
              <div
                className={
                  activeTab === "products"
                    ? "block animate-in fade-in duration-300"
                    : "hidden"
                }
              >
                <MerchantProducts
                  merchantProfile={merchantProfile}
                  autoOpenForm={triggerAddProduct}
                />
              </div>
            )}

            {/* 3. ORDERS */}
            {visitedTabs["orders"] && (
              <div
                className={
                  activeTab === "orders"
                    ? "block animate-in fade-in duration-300"
                    : "hidden"
                }
              >
                <MerchantOrders merchantProfile={merchantProfile} />
              </div>
            )}

            {/* 4. MESSAGES */}
            {visitedTabs["messages"] && (
              <div
                className={
                  activeTab === "messages"
                    ? "block animate-in fade-in duration-300"
                    : "hidden"
                }
              >
                <MerchantMessages />
              </div>
            )}

            {/* 5. FINANCE / WALLET */}
            {visitedTabs["wallet"] || visitedTabs["finance"] ? (
              <div
                className={
                  activeTab === "wallet" || activeTab === "finance"
                    ? "block animate-in fade-in duration-300"
                    : "hidden"
                }
              >
                <MerchantFinanceDashboard />
              </div>
            ) : null}

            {/* 6. LOCATION (Modal Style) */}
            {activeTab === "location" && (
              <div className="bg-white border-2 border-slate-100 animate-in zoom-in-95 duration-200">
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
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-slate-100 bg-white">
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
          />
        </div>
      </div>

      <MerchantAlarmModal
        incomingOrder={incomingOrder}
        onProcess={handleProcessOrder}
        onMute={stopAlarm}
      />
    </div>
  );
};
