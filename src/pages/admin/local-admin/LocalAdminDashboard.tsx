import React, { useState, useEffect } from "react";
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
  MapPin,
  UserCog,
  ShieldAlert,
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
// 🚀 IMPORT KOMPONEN UPDATE DATA
import { AdminProfileUpdate } from "./components/AdminProfileUpdate";

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
  | "orders"
  | "settings"; // 🚀 Tambah Tab Settings

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

  // 🚀 LOGIK GERBANG OTOMATIS: Jika profil belum lengkap, paksa ke tab settings
  useEffect(() => {
    if (isLoaded && profile && !profile.is_profile_complete) {
      setActiveTab("settings");
    }
  }, [isLoaded, profile]);

  if (isLoading) return <PageLoader bgClass="bg-white" />;

  // Cek apakah Admin sedang dalam mode "Wajib Update"
  const isUpdateRequired = profile && !profile.is_profile_complete;

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

      {/* SIDEBAR - Kirim props isUpdateRequired untuk mengunci menu jika perlu */}
      <LocalSidebar
        marketName={myMarket?.name || "PASAR WILAYAH"}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pendingMerchants={myMerchants.filter((m: any) => !m.is_verified).length}
        pendingCouriers={myCouriers.filter((c: any) => !c.is_verified).length}
        pendingProducts={pendingProducts.length}
        onLogout={() => logout().then(() => navigate("/"))}
        disabled={isUpdateRequired}
      />

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 lg:ml-72 flex flex-col min-h-screen relative">
        <LocalAdminHeader
          isAlarmActive={isAlarmActive}
          isMuted={isMuted}
          setIsMuted={setIsMuted}
          onRefresh={fetchData}
          adminName={profile?.full_name || profile?.name} // Gunakan full_name jika sudah diupdate
        />

        <main className="p-6 md:p-10 max-w-7xl w-full mx-auto pb-32">
          {/* BANNER PERINGATAN JIKA DATA BELUM LENGKAP */}
          {isUpdateRequired && (
            <div className="bg-red-600 text-white p-4 rounded-xl mb-8 flex items-center justify-between shadow-xl animate-bounce">
              <div className="flex items-center gap-3">
                <ShieldAlert size={24} />
                <div>
                  <h3 className="text-sm font-black">AKSES TERBATAS!</h3>
                  <p className="text-[10px] opacity-90">
                    LENGKAPI DATA IDENTITAS & BANK ANDA UNTUK MENGAKTIFKAN FITUR
                    ADMIN.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* HEADER PAGE */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 border-b-4 border-slate-900 pb-6">
            <div className="text-left">
              {onBack && !isUpdateRequired && (
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
                  : activeTab === "settings"
                    ? "PENGATURAN PROFIL"
                    : activeTab.replace("_", " ")}
              </h1>
              <p className="text-[10px] font-black text-slate-400 tracking-[0.2em] flex items-center gap-2">
                <MapPin size={12} className="text-[#008080]" /> PENGAWASAN AREA:{" "}
                {myMarket?.name || "MEMUAT..."}
              </p>
            </div>

            {/* QUICK TAB NAVIGATOR (Disembunyikan jika wajib update) */}
            {!isUpdateRequired && (
              <div className="flex flex-wrap bg-white p-1 rounded-md border border-slate-200 shadow-sm">
                <QuickActionBtn
                  active={activeTab === "overview"}
                  icon={<LayoutDashboard size={16} />}
                  label="OVERVIEW"
                  onClick={() => setActiveTab("overview")}
                />
                <QuickActionBtn
                  active={activeTab === "settings"}
                  icon={<UserCog size={16} />}
                  label="PROFIL"
                  onClick={() => setActiveTab("settings")}
                />
                <div className="w-[1px] h-6 bg-slate-100 mx-1 self-center"></div>
                <QuickActionBtn
                  active={activeTab === "orders"}
                  icon={<ShoppingBag size={16} />}
                  label="ORDERS"
                  onClick={() => setActiveTab("orders")}
                />
              </div>
            )}
          </div>

          {/* CONTENT ROUTING */}
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            {activeTab === "settings" ? (
              <AdminProfileUpdate /> // 🚀 TAMPILKAN FORM UPDATE PROFIL
            ) : activeTab === "products" ? (
              <AdminProductVerification
                products={pendingProducts}
                onAction={fetchData}
              />
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
      className={`text-[10px] font-black uppercase ${active ? "block" : "hidden md:block opacity-60"}`}
    >
      {label}
    </span>
  </button>
);

export default LocalAdminDashboard;
