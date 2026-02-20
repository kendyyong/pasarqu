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
  ArrowLeft,
  LayoutDashboard,
  RefreshCw,
  MapPin,
} from "lucide-react";

// --- HOOKS & SHARED ---
import { useLocalAdminDashboard } from "../../../hooks/useLocalAdminDashboard";
import { PageLoader } from "../../../components/ui/PageLoader";
import { LocalSidebar } from "./components/LocalSidebar";
import { PartnerDetailModal } from "./components/PartnerDetailModal";

// --- LOCAL UI COMPONENTS ---
import { LocalAdminHeader } from "./components/LocalAdminHeader";
import { LocalAdminContent } from "./components/LocalAdminContent";
import { AdminProductVerification } from "./components/AdminProductVerification";

interface LocalAdminProps {
  onBack?: () => void;
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

// 🚩 MENGGUNAKAN NAMED EXPORT AGAR SESUAI DENGAN IMPORT DI APPROUTES
export const LocalAdminDashboard: React.FC<LocalAdminProps> = ({ onBack }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [detailModal, setDetailModal] = useState<{
    isOpen: boolean;
    user: any;
  }>({ isOpen: false, user: null });

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
      className={`min-h-screen flex font-black uppercase tracking-tighter text-left antialiased transition-all duration-500 overflow-hidden ${
        isAlarmActive ? "bg-red-50" : "bg-slate-50"
      }`}
    >
      {/* ALARM OVERLAY */}
      {isAlarmActive && (
        <div className="fixed inset-0 z-[999] bg-red-600/10 animate-pulse pointer-events-none border-[12px] border-red-500/30"></div>
      )}

      {/* SIDEBAR */}
      <LocalSidebar
        marketName={myMarket?.name || "PASAR WILAYAH"}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pendingMerchants={myMerchants.filter((m: any) => !m.is_verified).length}
        pendingCouriers={myCouriers.filter((c: any) => !c.is_verified).length}
        pendingProducts={pendingProducts.length}
        onLogout={() => logout().then(() => navigate("/"))}
      />

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 lg:ml-72 flex flex-col min-h-screen relative">
        <LocalAdminHeader
          isAlarmActive={isAlarmActive}
          isMuted={isMuted}
          setIsMuted={setIsMuted}
          onRefresh={fetchData}
          adminName={profile?.name}
        />

        <main className="p-6 md:p-10 max-w-7xl w-full mx-auto pb-32">
          {/* HEADER PAGE */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 border-b-4 border-slate-900 pb-6">
            <div className="text-left">
              {onBack && (
                <button
                  onClick={onBack}
                  className="mb-4 text-[10px] font-black text-slate-400 hover:text-[#008080] transition-colors flex items-center gap-1"
                >
                  <ArrowLeft size={12} /> KEMBALI KE UTAMA
                </button>
              )}
              <h1 className="text-3xl md:text-4xl font-black leading-none mb-2 tracking-tighter">
                {activeTab === "overview"
                  ? "DASHBOARD WILAYAH"
                  : activeTab.replace("_", " ")}
              </h1>
              <p className="text-[10px] font-black text-slate-400 tracking-[0.2em] flex items-center gap-2">
                <MapPin size={12} className="text-[#008080]" /> PENGAWASAN AREA:{" "}
                {myMarket?.name || "MEMUAT..."}
              </p>
            </div>

            {/* QUICK TAB NAVIGATOR */}
            <div className="flex flex-wrap bg-white p-1 rounded-md border border-slate-200 shadow-sm">
              <button
                onClick={() => setActiveTab("overview")}
                className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${
                  activeTab === "overview"
                    ? "bg-slate-900 text-white shadow-lg"
                    : "text-slate-400 hover:bg-slate-50"
                }`}
              >
                <LayoutDashboard size={16} />
                <span className="text-[10px] font-black uppercase">
                  OVERVIEW
                </span>
              </button>

              <div className="w-[1px] h-6 bg-slate-100 mx-1 self-center"></div>

              <button
                onClick={() => setActiveTab("products")}
                className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all group ${
                  activeTab === "products"
                    ? "bg-[#FF6600] text-white shadow-lg"
                    : "text-[#FF6600] hover:bg-orange-50"
                }`}
              >
                <ClipboardCheck size={16} />
                <span className="text-[10px] font-black uppercase">PRODUK</span>
                {pendingProducts.length > 0 && (
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded-sm font-black ${
                      activeTab === "products"
                        ? "bg-white text-orange-600"
                        : "bg-orange-600 text-white animate-pulse"
                    }`}
                  >
                    {pendingProducts.length}
                  </span>
                )}
              </button>

              <div className="w-[1px] h-6 bg-slate-100 mx-1 self-center"></div>

              <QuickActionBtn
                active={activeTab === "orders"}
                icon={<ShoppingBag size={16} />}
                label="ORDERS"
                onClick={() => setActiveTab("orders")}
              />
              <QuickActionBtn
                active={activeTab === "radar"}
                icon={<Radio size={16} />}
                label="RADAR"
                onClick={() => setActiveTab("radar")}
              />
              <QuickActionBtn
                active={activeTab === "broadcast"}
                icon={<Megaphone size={16} />}
                label="SIARAN"
                onClick={() => setActiveTab("broadcast")}
              />
              <QuickActionBtn
                active={activeTab === "finance"}
                icon={<BarChart3 size={16} />}
                label="FINANCE"
                onClick={() => setActiveTab("finance")}
              />
              <QuickActionBtn
                active={activeTab === "resolution"}
                icon={<AlertCircle size={16} />}
                label="HELP"
                onClick={() => setActiveTab("resolution")}
                color="text-red-500 hover:bg-red-50"
              />
            </div>
          </div>

          {/* CONTENT ROUTING */}
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            {activeTab === "products" ? (
              <AdminProductVerification />
            ) : (
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
            )}
          </div>
        </main>
      </div>

      <PartnerDetailModal
        user={detailModal.user}
        isOpen={detailModal.isOpen}
        onClose={() => setDetailModal({ isOpen: false, user: null })}
        onApprove={() => {
          fetchData();
          showToast("MITRA DISETUJUI", "success");
        }}
        onDeactivate={() => {
          fetchData();
          showToast("MITRA DINONAKTIFKAN", "error");
        }}
        onActivate={() => {
          fetchData();
          showToast("MITRA DIAKTIFKAN", "success");
        }}
      />
    </div>
  );
};

// --- HELPER COMPONENTS ---
const QuickActionBtn = ({
  active,
  icon,
  label,
  onClick,
  color = "text-slate-400 hover:text-[#008080] hover:bg-teal-50",
}: any) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all shrink-0 ${
      active ? "bg-slate-900 text-white shadow-lg" : `${color}`
    }`}
  >
    {icon}
    <span
      className={`text-[10px] font-black uppercase ${active ? "block" : "hidden md:group-hover:block"}`}
    >
      {label}
    </span>
  </button>
);

// 🚩 DITAMBAHKAN DEFAULT EXPORT SEBAGAI BACKUP
export default LocalAdminDashboard;
