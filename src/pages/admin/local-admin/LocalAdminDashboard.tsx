import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ClipboardCheck,
  ShoppingBag,
  Radio,
  Megaphone,
  BarChart3,
  AlertCircle,
  Map as MapIcon,
} from "lucide-react";

// --- HOOKS & SHARED ---
import { useLocalAdminDashboard } from "../../../hooks/useLocalAdminDashboard";
import { PageLoader } from "../../../components/ui/PageLoader";
import { LocalSidebar } from "./components/LocalSidebar";
import { PartnerDetailModal } from "./components/PartnerDetailModal";

// --- LOCAL UI COMPONENTS ---
import { LocalAdminHeader } from "./components/LocalAdminHeader";
import { LocalAdminContent } from "./components/LocalAdminContent";

// ✅ 1. DEFINE PROPS INTERFACE
interface LocalAdminProps {
  onBack?: () => void; // Opsional agar tidak pecah jika dipanggil tanpa onBack
}

type TabType =
  | "overview"
  | "merchants"
  | "products"
  | "couriers"
  | "customers"
  | "finance"
  | "radar"
  | "ratings"
  | "resolution"
  | "broadcast"
  | "orders";

// ✅ 2. TERIMA PROPS onBack
export const LocalAdminDashboard: React.FC<LocalAdminProps> = ({ onBack }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [detailModal, setDetailModal] = useState<{
    isOpen: boolean;
    user: any;
  }>({ isOpen: false, user: null });

  // PANGGIL HOOK UTAMA
  const {
    profile,
    isLoaded,
    isLoading,
    isMuted,
    setIsMuted,
    isAlarmActive,
    myMarket,
    myMerchants,
    myCouriers,
    myCustomers,
    pendingProducts,
    marketFinance,
    fetchData,
    stopAlarm,
    logout,
    showToast,
  } = useLocalAdminDashboard();

  if (isLoading) return <PageLoader bgClass="bg-white" />;

  return (
    <div
      className={`min-h-screen flex font-sans text-left antialiased transition-all duration-500 overflow-hidden ${isAlarmActive ? "bg-red-50" : "bg-[#f8fafc]"}`}
    >
      {isAlarmActive && (
        <div className="fixed inset-0 z-[999] bg-red-600/10 animate-pulse pointer-events-none border-[15px] border-red-500/30"></div>
      )}

      <LocalSidebar
        marketName={myMarket?.name || "Pasar Wilayah"}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pendingMerchants={myMerchants.filter((m: any) => !m.is_verified).length}
        pendingCouriers={myCouriers.filter((c: any) => !c.is_verified).length}
        pendingProducts={pendingProducts.length}
        onLogout={() => logout().then(() => navigate("/"))}
      />

      <div className="flex-1 ml-72 flex flex-col min-h-screen relative">
        <LocalAdminHeader
          isAlarmActive={isAlarmActive}
          isMuted={isMuted}
          setIsMuted={setIsMuted}
          onRefresh={fetchData}
          adminName={profile?.name}
        />

        <main className="p-10 max-w-7xl mx-auto w-full pb-32">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div className="text-left text-slate-800">
              {/* ✅ 3. GUNAKAN onBack JIKA ADA (OPSIONAL) */}
              {onBack && (
                <button
                  onClick={onBack}
                  className="mb-4 text-[10px] font-black uppercase text-slate-400 hover:text-teal-600 transition-colors flex items-center gap-1"
                >
                  ← Kembali ke Utama
                </button>
              )}
              <h1 className="text-4xl font-black uppercase tracking-tighter leading-none mb-3">
                {activeTab === "overview"
                  ? "Dashboard Wilayah"
                  : activeTab.replace("_", " ")}
              </h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none flex items-center gap-2">
                <MapIcon size={12} className="text-teal-500" /> Pengawasan Area{" "}
                {myMarket?.name}
              </p>
            </div>

            <div className="flex bg-white p-2 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40">
              <button
                onClick={() => setActiveTab("products")}
                className="flex items-center gap-2 px-5 py-2.5 rounded-[1.5rem] transition-all group shrink-0 text-orange-500 hover:bg-orange-50"
              >
                <ClipboardCheck size={18} />
                <span className="text-[10px] font-black uppercase tracking-widest">
                  Produk
                </span>
                {pendingProducts.length > 0 && (
                  <span className="bg-orange-500 text-white text-[8px] px-1.5 py-0.5 rounded-full animate-bounce">
                    {pendingProducts.length}
                  </span>
                )}
              </button>
              <div className="w-[1px] h-8 bg-slate-100 mx-2 self-center"></div>
              <QuickActionBtn
                active={activeTab === "orders"}
                icon={<ShoppingBag size={18} />}
                label="Orders"
                onClick={() => setActiveTab("orders")}
              />
              <QuickActionBtn
                active={activeTab === "radar"}
                icon={<Radio size={18} />}
                label="Radar"
                onClick={() => setActiveTab("radar")}
              />
              <QuickActionBtn
                active={activeTab === "broadcast"}
                icon={<Megaphone size={18} />}
                label="Siaran"
                onClick={() => setActiveTab("broadcast")}
              />
              <QuickActionBtn
                active={activeTab === "finance"}
                icon={<BarChart3 size={18} />}
                label="Finance"
                onClick={() => setActiveTab("finance")}
              />
              <QuickActionBtn
                active={activeTab === "resolution"}
                icon={<AlertCircle size={18} />}
                label="Help"
                onClick={() => setActiveTab("resolution")}
                color="hover:text-red-500"
              />
            </div>
          </div>

          <LocalAdminContent
            activeTab={activeTab}
            isAlarmActive={isAlarmActive}
            data={{
              myMarket,
              myMerchants,
              myCouriers,
              myCustomers,
              pendingProducts,
              marketFinance,
              profile,
              isLoaded,
            }}
            actions={{ fetchData, stopAlarm, setDetailModal }}
          />
        </main>
      </div>

      <PartnerDetailModal
        user={detailModal.user}
        isOpen={detailModal.isOpen}
        onClose={() => setDetailModal({ isOpen: false, user: null })}
        onApprove={() => {
          fetchData();
          showToast("Mitra disetujui!", "success");
        }}
        onDeactivate={() => {
          fetchData();
          showToast("Mitra dinonaktifkan", "error");
        }}
        onActivate={() => {
          fetchData();
          showToast("Mitra diaktifkan", "success");
        }}
      />
    </div>
  );
};

const QuickActionBtn = ({
  active,
  icon,
  label,
  onClick,
  color = "hover:text-teal-600",
}: any) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-5 py-2.5 rounded-[1.5rem] transition-all group shrink-0 ${active ? "bg-slate-900 text-white shadow-lg shadow-slate-900/20" : `text-slate-400 ${color}`}`}
  >
    {icon}
    <span
      className={`text-[10px] font-black uppercase tracking-widest ${active ? "block" : "hidden group-hover:block"}`}
    >
      {label}
    </span>
  </button>
);

export default LocalAdminDashboard;
