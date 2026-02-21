import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { useNavigate } from "react-router-dom";
import { Loader2, X } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";

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
import { CourierRadar } from "./components/CourierRadar";

// --- IMPORT MODALS ---
import { LocationPickerModal } from "../merchant/components/LocationPickerModal";
import { KurirTopUp } from "./components/KurirTopUp";
import { WithdrawalModal } from "../../components/finance/WithdrawalModal";

export const CourierDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // STATE UI
  const [activeTab, setActiveTab] = useState("bid");
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [showWDModal, setShowWDModal] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

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
    if (!isOnline && user) {
      setIsVerifying(true);
      try {
        const { data: latestData, error } = await supabase
          .from("profiles")
          .select("is_verified")
          .eq("id", user.id)
          .single();

        if (error) throw error;

        // 🛠️ PERBAIKAN DI SINI: Tambahkan tanda tanya (?) agar tidak error saat null
        if (latestData?.is_verified && !courierData?.is_verified) {
          await fetchInitialData();
        } else if (!latestData?.is_verified) {
          showToast("AKUN BELUM DIVERIFIKASI ADMIN. MOHON TUNGGU.", "error");
          setIsVerifying(false);
          return;
        }
      } catch (err) {
        console.error("Gagal cek status verifikasi:", err);
      }
      setIsVerifying(false);
    }

    const res = await toggleOnlineStatus();
    showToast(res.msg.toUpperCase(), res.success ? "success" : "error");
  };

  const handleLogout = async () => {
    if (window.confirm("SELESAI BEKERJA HARI INI?")) {
      await logout();
      navigate("/portal");
    }
  };

  // --- RENDER ---
  if (loading || isVerifying)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <Loader2 className="animate-spin text-[#008080]" size={48} />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
          MEMUAT DATA SISTEM...
        </p>
      </div>
    );

  // Jika akun benar-benar belum diverifikasi, arahkan ke Halaman Verifikasi (Menunggu)
  if (courierData && !courierData?.is_verified) {
    return (
      <CourierVerification
        marketName={courierData?.markets?.name || "MUARA JAWA"}
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
          name={courierData?.full_name || courierData?.name || "MEMBER"}
          marketName={courierData?.markets?.name || "MUARA JAWA"}
          initial={(courierData?.full_name || courierData?.name || "C").charAt(
            0,
          )}
        />

        <main className="p-6 md:p-10 max-w-5xl mx-auto w-full space-y-8">
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
                    `MINIMAL WD ${formatRupiah(MIN_WITHDRAWAL)}`,
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

      {showTopUpModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md animate-in zoom-in-95">
            <button
              onClick={() => setShowTopUpModal(false)}
              className="absolute -top-14 right-0 text-white hover:text-orange-500 transition-colors"
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
          <header className="h-16 bg-white border-b-4 border-slate-900 flex items-center justify-between px-6 shrink-0 shadow-sm">
            <h2 className="font-black text-slate-800 uppercase text-xs tracking-widest">
              SET RADAR AREA
            </h2>
            <button
              onClick={() => {
                setShowLocationModal(false);
                fetchInitialData();
              }}
              className="bg-slate-900 text-white px-6 py-3 rounded-lg font-black text-[10px] uppercase hover:bg-orange-500 transition-colors"
            >
              SIMPAN AREA
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
