import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { Loader2 } from "lucide-react";

// --- PERBAIKAN 1: Import Path diarahkan ke folder 'src/hooks' ---
import { useMerchantDashboard } from "../../hooks/useMerchantDashboard";

// --- IMPORT COMPONENTS ---
import { MerchantSidebar } from "./components/MerchantSidebar";
import { MerchantHeader } from "./components/MerchantHeader";
import { MerchantAlarmModal } from "./components/MerchantAlarmModal";
import { MerchantOverview } from "./components/MerchantOverview";
import { MerchantProducts } from "./components/MerchantProducts";
import { MerchantOrders } from "./components/MerchantOrders";
import { MerchantFinanceDashboard } from "./components/MerchantFinanceDashboard";
import { MerchantMessages } from "./components/MerchantMessages";
import { LocationPickerModal } from "./components/LocationPickerModal";

// Definisi tipe tab yang ketat
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

  // PANGGIL HOOK UTAMA
  const {
    merchantProfile,
    products,
    orders,
    loading,
    incomingOrder,
    fetchBaseData,
    toggleShopStatus,
    stopAlarm,
  } = useMerchantDashboard();

  // Handlers UI
  const handleAddProductShortcut = () => {
    setActiveTab("products");
    setTriggerAddProduct(true);
    setTimeout(() => setTriggerAddProduct(false), 500);
  };

  const handleProcessOrder = () => {
    stopAlarm();
    setActiveTab("orders");
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="animate-spin text-slate-900" size={32} />
      </div>
    );

  if (!merchantProfile)
    return (
      <div className="p-10 text-center">
        Data Merchant Tidak Ditemukan / Belum Verifikasi
      </div>
    );

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row font-sans text-left overflow-hidden">
      {/* SIDEBAR */}
      <aside className="hidden md:flex w-64 h-screen fixed left-0 top-0 z-50 border-r border-slate-200 bg-white">
        <MerchantSidebar
          activeTab={activeTab}
          // PERBAIKAN 2: Casting tipe data 'tab' agar TypeScript tidak error
          setActiveTab={(tab: any) => setActiveTab(tab as TabType)}
          merchantProfile={merchantProfile}
          onLocationClick={() => setActiveTab("location")}
          onLogout={logout}
          onToggleStatus={toggleShopStatus}
          onAddProduct={handleAddProductShortcut}
          orderCount={orders.length}
          productCount={products.length}
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

        {/* TAB CONTENT */}
        <main className="flex-1 overflow-y-auto no-scrollbar pb-24 md:pb-6 bg-slate-50/20">
          <div className="p-3 md:p-6 w-full">
            {activeTab === "overview" && (
              <MerchantOverview
                merchantProfile={merchantProfile}
                stats={{ orders: orders.length, products: products.length }}
              />
            )}

            {activeTab === "products" && (
              <MerchantProducts
                merchantProfile={merchantProfile}
                autoOpenForm={triggerAddProduct}
              />
            )}

            {activeTab === "orders" && (
              <MerchantOrders merchantProfile={merchantProfile} />
            )}

            {activeTab === "messages" && <MerchantMessages />}

            {(activeTab === "wallet" || activeTab === "finance") && (
              <MerchantFinanceDashboard />
            )}

            {activeTab === "location" && (
              <div className="bg-white border border-slate-200 overflow-hidden">
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
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white">
          <MerchantSidebar
            activeTab={activeTab}
            // PERBAIKAN 2: Casting tipe data juga di sini
            setActiveTab={(tab: any) => setActiveTab(tab as TabType)}
            merchantProfile={merchantProfile}
            onLocationClick={() => setActiveTab("location")}
            onLogout={logout}
            onToggleStatus={toggleShopStatus}
            onAddProduct={handleAddProductShortcut}
            orderCount={orders.length}
            productCount={products.length}
          />
        </div>
      </div>

      {/* MODAL ALARM */}
      <MerchantAlarmModal
        incomingOrder={incomingOrder}
        onProcess={handleProcessOrder}
        onMute={stopAlarm}
      />
    </div>
  );
};
