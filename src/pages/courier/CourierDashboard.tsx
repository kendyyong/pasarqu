import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { useNavigate } from "react-router-dom";
import { Loader2, X } from "lucide-react";

// --- IMPORT LOGIKA & UTILS ---
import { useCourierDashboard } from "../../hooks/useCourierDashboard";
import { formatRupiah } from "../../utils/format";

// --- IMPORT UI COMPONENTS ---
import { CourierSidebar } from "./components/CourierSidebar";
import { CourierProfile } from "./components/CourierProfile";
import { CourierMessages } from "./components/CourierMessages";
import { CourierVerification } from "./components/CourierVerification";
import { CourierHeader } from "./components/CourierHeader";
import { CourierFinance } from "./components/CourierFinance";
import { CourierHistory } from "./components/CourierHistory";
import { CourierRadar } from "./components/CourierRadar"; // Komponen Baru

// --- IMPORT MODALS ---
import { LocationPickerModal } from "../merchant/components/LocationPickerModal";
import { KurirTopUp } from "./components/KurirTopUp";
import { WithdrawalModal } from "../../components/Finance/WithdrawalModal";

export const CourierDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // STATE UI
  const [activeTab, setActiveTab] = useState("bid");
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [showWDModal, setShowWDModal] = useState(false);

  // LOGIC HOOK
  const {
    courierData,
    activeOrder,
    transactions,
    isOnline,
    loading,
    currentCoords,
    fetchInitialData,
    toggleOnlineStatus,
  } = useCourierDashboard();

  const MIN_WITHDRAWAL = 20000;

  // HANDLERS
  const handleToggleOnline = async () => {
    const res = await toggleOnlineStatus();
    showToast(res.msg, res.success ? "success" : "error");
  };

  const handleLogout = async () => {
    if (window.confirm("Selesai bekerja?")) {
      await logout();
      navigate("/portal");
    }
  };

  // --- RENDER ---

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="animate-spin text-teal-600" size={40} />
      </div>
    );

  if (courierData && !courierData.is_verified) {
    return (
      <CourierVerification
        marketName={courierData.markets?.name || "Pasar"}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex font-sans text-left overflow-hidden relative">
      <CourierSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOnline={isOnline}
        onToggleOnline={handleToggleOnline}
        courierData={courierData}
        onLocationClick={() => setShowLocationModal(true)}
        onLogout={handleLogout}
      />

      <div className="flex-1 flex flex-col min-w-0 pb-24 lg:pb-0 overflow-y-auto no-scrollbar">
        <CourierHeader
          isOnline={isOnline}
          name={courierData?.full_name || "MEMBER"}
          marketName={courierData?.markets?.name || "PASAR"}
          initial={(courierData?.full_name || "C").charAt(0)}
        />

        <main className="p-6 md:p-10 max-w-5xl mx-auto w-full space-y-8">
          {/* ISI KONTEN LEBIH BERSIH */}
          {activeTab === "bid" && (
            <CourierRadar
              activeOrder={activeOrder}
              isOnline={isOnline}
              currentCoords={currentCoords}
              onRefresh={fetchInitialData}
            />
          )}

          {activeTab === "finance" && (
            <CourierFinance
              balance={courierData?.wallet_balance || 0}
              minWithdrawal={MIN_WITHDRAWAL}
              onTopUp={() => setShowTopUpModal(true)}
              onWithdraw={() => {
                if (courierData?.wallet_balance < MIN_WITHDRAWAL)
                  return showToast(
                    `Min WD ${formatRupiah(MIN_WITHDRAWAL)}`,
                    "info",
                  );
                setShowWDModal(true);
              }}
            />
          )}

          {activeTab === "history" && (
            <CourierHistory transactions={transactions} />
          )}
          {activeTab === "profile" && (
            <CourierProfile courierData={courierData} />
          )}
          {activeTab === "messages" && <CourierMessages />}
        </main>
      </div>

      {/* MODAL AREA */}
      {showTopUpModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
          <div className="relative w-full max-w-md animate-in zoom-in-95">
            <button
              onClick={() => setShowTopUpModal(false)}
              className="absolute -top-14 right-0 text-white"
            >
              <X size={32} />
            </button>
            <KurirTopUp courierId={user?.id || ""} />
          </div>
        </div>
      )}

      <WithdrawalModal
        isOpen={showWDModal}
        onClose={() => setShowWDModal(false)}
        profile={courierData}
        role="COURIER"
        onSuccess={fetchInitialData}
      />

      {showLocationModal && (
        <div className="fixed inset-0 z-[200] flex flex-col bg-white animate-in slide-in-from-bottom">
          <header className="h-16 bg-white border-b flex items-center justify-between px-6 shrink-0">
            <h2 className="font-black text-slate-800 uppercase text-xs">
              Set Lokasi Radar
            </h2>
            <button
              onClick={() => {
                setShowLocationModal(false);
                fetchInitialData();
              }}
              className="bg-teal-600 text-white px-4 py-2 rounded-xl font-black text-[10px] uppercase"
            >
              Simpan & Kembali
            </button>
          </header>
          <div className="flex-1 relative">
            <LocationPickerModal
              merchantProfile={courierData}
              onClose={() => {
                setShowLocationModal(false);
                fetchInitialData();
              }}
              onUpdate={fetchInitialData}
            />
          </div>
        </div>
      )}
    </div>
  );
};
