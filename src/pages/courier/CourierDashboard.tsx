import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import {
  Loader2,
  X,
  Power,
  Map,
  History,
  Wallet,
  User,
  MessageSquare,
  TrendingUp,
  MapPin,
  ShoppingBag,
} from "lucide-react";

// --- IMPORT LOGIKA & UTILS ---
import { useCourierDashboard } from "../../hooks/useCourierDashboard";
import { formatRupiah } from "../../utils/format";

// --- IMPORT UI COMPONENTS ---
import { CourierProfile } from "./components/CourierProfile";
import { CourierMessages } from "./components/CourierMessages";
import { CourierVerification } from "./components/CourierVerification";
import { CourierFinance } from "./components/CourierFinance";
import { CourierHistory } from "./components/CourierHistory";
import { CourierRadar } from "./components/CourierRadar";

// --- IMPORT MODALS ---
import { LocationPickerModal } from "../merchant/components/LocationPickerModal";
import { KurirTopUp } from "./components/KurirTopUp";
import { WithdrawalModal } from "../../components/finance/WithdrawalModal";

export const CourierDashboard: React.FC = () => {
  const { user, profile, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // STATE UI
  const [activeTab, setActiveTab] = useState("bid");
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [showWDModal, setShowWDModal] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // LOGIC HOOK (🚀 acceptOrder DITAMBAHKAN DI SINI)
  const {
    courierData,
    activeOrder,
    transactions,
    isOnline,
    loading,
    currentCoords,
    fetchInitialData,
    toggleOnlineStatus,
    acceptOrder, // <--- INI YANG TADI KELUPAAN DITARIK DARI HOOK
  } = useCourierDashboard();

  const MIN_WITHDRAWAL = 20000;

  // AMBIL NAMA KURIR DARI PROFILE KTP
  const courierName =
    profile?.name || profile?.full_name || courierData?.name || "KURIR JAGOAN";

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

  // --- RENDER LOADING & VERIFIKASI ---
  if (loading || isVerifying)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC] gap-4">
        <Loader2 className="animate-spin text-[#008080]" size={48} />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
          MEMUAT DATA SISTEM...
        </p>
      </div>
    );

  if (courierData && !courierData?.is_verified) {
    return (
      <CourierVerification
        marketName={courierData?.markets?.name || "MUARA JAWA"}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <div className="h-[100dvh] w-screen bg-slate-200 flex justify-center font-black text-left uppercase tracking-tighter not-italic text-[12px] overflow-hidden">
      <div className="w-full max-w-[480px] bg-[#F8FAFC] h-full relative flex flex-col shadow-2xl border-x border-slate-300">
        {/* HEADER TOP BAR */}
        <header className="shrink-0 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-sm z-[50]">
          <div className="flex flex-col min-w-0 flex-1 pr-2">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <h1 className="text-[12px] font-[1000] text-slate-800 truncate uppercase tracking-tighter">
                {courierName}
              </h1>
            </div>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest truncate">
              Driver Aktif PasarQu
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                window.location.href = "/customer-dashboard";
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-black text-[10px] uppercase tracking-tighter transition-all active:scale-90 border shadow-md bg-[#FF6600] text-white border-orange-400"
            >
              <ShoppingBag size={14} strokeWidth={3} />
              <span className="hidden sm:inline-block">BELANJA</span>
            </button>

            <button
              onClick={() => setActiveTab("messages")}
              className={`w-9 h-9 shrink-0 rounded-xl border flex items-center justify-center transition-colors active:scale-90 ${
                activeTab === "messages"
                  ? "bg-teal-50 border-[#008080] text-[#008080]"
                  : "bg-slate-50 border-slate-200 text-slate-500"
              }`}
            >
              <MessageSquare size={16} strokeWidth={2.5} />
            </button>
          </div>
        </header>

        {/* QUICK STATS */}
        {activeTab === "bid" && (
          <div className="shrink-0 bg-slate-900 pt-5 pb-6 px-4 rounded-b-2xl shadow-md z-40 relative">
            <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 w-[80%] max-w-[300px]">
              <button
                onClick={handleToggleOnline}
                className={`w-full py-3.5 rounded-full flex items-center justify-center gap-2 font-[1000] text-[13px] tracking-widest transition-all shadow-xl active:scale-95 border-2 ${
                  isOnline
                    ? "bg-[#008080] text-white border-teal-500 shadow-teal-900/50"
                    : "bg-slate-200 text-slate-500 border-white shadow-black/20"
                }`}
              >
                <Power size={18} strokeWidth={3} />
                {isOnline ? "STATUS: ONLINE" : "STATUS: OFFLINE"}
              </button>
            </div>

            <div className="flex justify-between items-center text-slate-300 mb-4 px-1">
              <button
                onClick={() => setShowLocationModal(true)}
                className="text-[10px] tracking-widest flex items-center gap-1 hover:text-white transition-colors"
              >
                <MapPin size={12} />{" "}
                {courierData?.markets?.name || "MUARA JAWA"}
              </button>
              <span className="text-[10px] tracking-widest flex items-center gap-1 text-teal-400">
                <TrendingUp size={14} /> PERFORMA: 100%
              </span>
            </div>

            <div className="bg-white rounded-md p-4 shadow-sm flex items-center justify-between border border-slate-100 pb-8">
              <div>
                <p className="text-[10px] text-slate-400 font-black tracking-widest">
                  SALDO DOMPET
                </p>
                <h3 className="text-[20px] font-sans font-[1000] leading-none mt-1 text-slate-800">
                  RP {(courierData?.wallet_balance || 0).toLocaleString()}
                </h3>
              </div>
              <button
                onClick={() => setShowTopUpModal(true)}
                className="bg-[#FF6600] text-white px-5 py-3 rounded-md text-[11px] font-black tracking-widest shadow-sm active:scale-95 transition-all"
              >
                ISI SALDO
              </button>
            </div>
          </div>
        )}

        {/* MAIN AREA */}
        <main className="flex-1 w-full overflow-y-auto px-4 pt-6 pb-[90px] relative z-0">
          {activeTab === "bid" && (
            <CourierRadar
              activeOrder={activeOrder}
              isOnline={isOnline}
              currentCoords={currentCoords}
              onRefresh={fetchInitialData}
              acceptOrder={acceptOrder} // 🚀 KABELNYA DISAMBUNGKAN DI SINI!
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

        {/* BOTTOM NAV */}
        <nav className="absolute bottom-0 left-0 w-full bg-white border-t border-slate-200 flex justify-around items-center h-[70px] pb-safe z-[100] shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
          <NavButton
            active={activeTab === "bid"}
            icon={<Map size={22} strokeWidth={activeTab === "bid" ? 3 : 2} />}
            label="RADAR"
            onClick={() => setActiveTab("bid")}
          />
          <NavButton
            active={activeTab === "history"}
            icon={
              <History
                size={22}
                strokeWidth={activeTab === "history" ? 3 : 2}
              />
            }
            label="RIWAYAT"
            onClick={() => setActiveTab("history")}
          />
          <NavButton
            active={activeTab === "finance"}
            icon={
              <Wallet size={22} strokeWidth={activeTab === "finance" ? 3 : 2} />
            }
            label="SALDO"
            onClick={() => setActiveTab("finance")}
          />
          <NavButton
            active={activeTab === "profile"}
            icon={
              <User size={22} strokeWidth={activeTab === "profile" ? 3 : 2} />
            }
            label="AKUN"
            onClick={() => setActiveTab("profile")}
          />
        </nav>

        {/* MODALS */}
        {showTopUpModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
            <div className="relative w-full max-w-sm animate-in zoom-in-95">
              <button
                onClick={() => setShowTopUpModal(false)}
                className="absolute -top-12 right-0 text-white hover:text-[#FF6600] transition-colors"
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
          <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-slate-900/80 p-4">
            <div className="w-full max-w-[480px] bg-white flex flex-col rounded-md overflow-hidden animate-in zoom-in-95 h-[80vh]">
              <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 shrink-0 shadow-sm">
                <h2 className="font-[1000] text-slate-800 uppercase text-[12px] tracking-widest flex items-center gap-2">
                  <MapPin size={16} className="text-[#008080]" /> SET AREA
                </h2>
                <button
                  onClick={() => {
                    setShowLocationModal(false);
                    fetchInitialData();
                  }}
                  className="bg-[#008080] text-white px-4 py-2 rounded-md font-black text-[10px] uppercase shadow-sm active:scale-95"
                >
                  SIMPAN
                </button>
              </header>
              <div className="flex-1 relative bg-slate-100">
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
          </div>
        )}
      </div>
    </div>
  );
};

// --- KOMPONEN TOMBOL NAVIGASI BAWAH ---
const NavButton = ({ active, icon, label, onClick }: any) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all active:scale-95 ${
      active ? "text-[#008080]" : "text-slate-400 hover:text-slate-600"
    }`}
  >
    <div
      className={`p-1.5 rounded-md transition-colors ${active ? "bg-teal-50" : ""}`}
    >
      {icon}
    </div>
    <span
      className={`text-[9px] tracking-widest leading-none ${active ? "font-[1000]" : "font-bold"}`}
    >
      {label}
    </span>
  </button>
);
