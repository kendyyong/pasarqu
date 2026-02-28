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
  CircleDot,
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
    acceptOrder,
  } = useCourierDashboard();

  const MIN_WITHDRAWAL = 20000;

  // AMBIL NAMA KURIR
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
    <div className="h-[100dvh] w-screen bg-slate-200 flex justify-center font-sans text-left uppercase tracking-tighter not-italic text-[12px] overflow-hidden">
      <div className="w-full max-w-[480px] bg-[#F8FAFC] h-full relative flex flex-col shadow-2xl border-x border-slate-300">
        {/* HEADER TOP BAR - LEBIH COMPACT */}
        <header className="shrink-0 bg-white border-b border-slate-200 px-4 py-2.5 flex items-center justify-between shadow-sm z-[50]">
          <div className="flex flex-col min-w-0 flex-1 pr-2">
            <div className="flex items-center gap-1.5">
              <div
                className={`w-2 h-2 rounded-full ${isOnline ? "bg-green-500 animate-pulse" : "bg-slate-300"}`}
              ></div>
              <h1 className="text-[14px] font-[1000] text-slate-800 truncate uppercase tracking-tight">
                {courierName}
              </h1>
            </div>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest truncate flex items-center gap-1">
              <MapPin size={8} className="text-[#FF6600]" />{" "}
              {courierData?.markets?.name || "LOKASI"}
            </p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => {
                window.location.href = "/customer-dashboard";
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-black text-[10px] uppercase tracking-tighter transition-all active:scale-90 border shadow-sm bg-slate-50 text-slate-600 hover:bg-slate-100"
            >
              <ShoppingBag size={14} />
            </button>
            <button
              onClick={() => setActiveTab("messages")}
              className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-colors active:scale-90 ${
                activeTab === "messages"
                  ? "bg-teal-50 border-[#008080] text-[#008080]"
                  : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"
              }`}
            >
              <MessageSquare size={14} strokeWidth={2.5} />
            </button>
          </div>
        </header>

        {/* 🚀 QUICK STATS - DESAIN BARU (TIDAK BERTUMPUK & LEBIH TIPIS) */}
        {activeTab === "bid" && (
          <div className="shrink-0 bg-slate-900 px-4 py-3 shadow-md z-40 relative flex items-center justify-between gap-3">
            {/* Saldo Dompet */}
            <div
              onClick={() => setShowTopUpModal(true)}
              className="flex-1 bg-white/10 rounded-xl p-2.5 border border-white/10 flex items-center justify-between cursor-pointer active:bg-white/20 transition-all"
            >
              <div>
                <p className="text-[8px] text-slate-400 font-bold tracking-widest flex items-center gap-1">
                  <Wallet size={10} className="text-teal-400" /> SALDO
                </p>
                <p className="text-[14px] font-[1000] text-white tracking-tighter leading-none mt-1">
                  RP {(courierData?.wallet_balance || 0).toLocaleString()}
                </p>
              </div>
              <div className="bg-[#FF6600] text-white w-6 h-6 rounded-full flex items-center justify-center font-black pb-0.5 shadow-md">
                +
              </div>
            </div>

            {/* Tombol Online/Offline */}
            <button
              onClick={handleToggleOnline}
              className={`flex-1 py-3 px-2 rounded-xl flex items-center justify-center gap-1.5 font-[1000] text-[11px] tracking-widest transition-all shadow-md active:scale-95 border-2 ${
                isOnline
                  ? "bg-teal-500 text-white border-teal-400 shadow-teal-900/50"
                  : "bg-slate-200 text-slate-600 border-slate-100"
              }`}
            >
              {isOnline ? (
                <CircleDot size={14} className="animate-pulse" />
              ) : (
                <Power size={14} />
              )}
              {isOnline ? "ON BID" : "OFFLINE"}
            </button>
          </div>
        )}

        {/* MAIN AREA */}
        {/* 🚀 PADDING BOTTOM DIKURANGI AGAR PETA LEBIH LUAS */}
        <main
          className={`flex-1 w-full overflow-y-auto relative z-0 ${activeTab === "bid" ? "p-0 overflow-hidden" : "px-4 pt-6 pb-[90px]"}`}
        >
          {activeTab === "bid" && (
            <CourierRadar
              activeOrder={activeOrder}
              isOnline={isOnline}
              currentCoords={currentCoords}
              onRefresh={fetchInitialData}
              acceptOrder={acceptOrder}
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
        <nav className="absolute bottom-0 left-0 w-full bg-white border-t border-slate-200 flex justify-around items-center h-[65px] pb-safe z-[100] shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
          <NavButton
            active={activeTab === "bid"}
            icon={<Map size={20} strokeWidth={activeTab === "bid" ? 2.5 : 2} />}
            label="RADAR"
            onClick={() => setActiveTab("bid")}
          />
          <NavButton
            active={activeTab === "history"}
            icon={
              <History
                size={20}
                strokeWidth={activeTab === "history" ? 2.5 : 2}
              />
            }
            label="RIWAYAT"
            onClick={() => setActiveTab("history")}
          />
          <NavButton
            active={activeTab === "finance"}
            icon={
              <Wallet
                size={20}
                strokeWidth={activeTab === "finance" ? 2.5 : 2}
              />
            }
            label="SALDO"
            onClick={() => setActiveTab("finance")}
          />
          <NavButton
            active={activeTab === "profile"}
            icon={
              <User size={20} strokeWidth={activeTab === "profile" ? 2.5 : 2} />
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
            <div className="w-full max-w-[480px] bg-white flex flex-col rounded-xl overflow-hidden animate-in zoom-in-95 h-[80vh]">
              <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 shrink-0 shadow-sm">
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
      className={`p-1.5 rounded-lg transition-colors ${active ? "bg-teal-50" : ""}`}
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
