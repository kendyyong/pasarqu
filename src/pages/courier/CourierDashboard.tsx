import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabaseClient";
import { useToast } from "../../contexts/ToastContext";
import { useNavigate } from "react-router-dom";
import {
  Loader2,
  Clock,
  MessageCircle,
  Wallet,
  ArrowUpRight,
  History,
  Power,
  Bell,
  Navigation,
  ShieldCheck,
  Plus,
  X,
  ArrowDownLeft,
} from "lucide-react";

// KOMPONEN MODULAR
import { CourierSidebar } from "./components/CourierSidebar";
import { CourierBidArea } from "./components/CourierBidArea";
import { CourierProfile } from "./components/CourierProfile";
import { CourierActiveOrder } from "./components/CourierActiveOrder";
import { CourierMessages } from "./components/CourierMessages";
import { LocationPickerModal } from "../merchant/components/LocationPickerModal";

// IMPORT KOMPONEN TOP UP & WITHDRAWAL
import { KurirTopUp } from "./components/KurirTopUp";
import { WithdrawalModal } from "../../components/Finance/WithdrawalModal";

export const CourierDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("bid");
  const [isOnline, setIsOnline] = useState(false);
  const [courierData, setCourierData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeOrder, setActiveOrder] = useState<any>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);

  // STATE UNTUK MODAL KEUANGAN
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [showWDModal, setShowWDModal] = useState(false);

  const [currentCoords, setCurrentCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const MIN_WITHDRAWAL_COURIER = 20000;

  const fetchInitialData = async () => {
    if (!user) return;
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("*, markets(name)")
        .eq("id", user.id)
        .single();

      if (profile) {
        setCourierData(profile);
        setIsOnline(profile.is_active || false);
        if (profile.latitude)
          setCurrentCoords({ lat: profile.latitude, lng: profile.longitude });
      }

      const { data: order } = await supabase
        .from("orders")
        .select(
          `
          *,
          profiles:customer_id (id, full_name, phone_number, address, latitude, longitude),
          merchants:merchant_id (id, shop_name, address, latitude, longitude)
        `,
        )
        .eq("courier_id", user.id)
        .in("shipping_status", ["COURIER_ASSIGNED", "PICKING_UP", "DELIVERING"])
        .maybeSingle();

      setActiveOrder(order || null);
    } catch (err: any) {
      console.error("Init data error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
    if (!user) return;

    const channel = supabase
      .channel(`courier_realtime_${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `courier_id=eq.${user.id}`,
        },
        () => fetchInitialData(),
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${user.id}`,
        },
        (payload) => setCourierData(payload.new),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleLogout = async () => {
    if (window.confirm("Selesai bekerja & keluar dari sistem?")) {
      await logout();
      navigate("/portal");
    }
  };

  const toggleOnline = async () => {
    if (!courierData?.is_verified) {
      showToast("Akun Anda sedang dalam verifikasi Admin", "error");
      return;
    }
    const newState = !isOnline;
    const { error } = await supabase
      .from("profiles")
      .update({ is_active: newState })
      .eq("id", user?.id);

    if (!error) {
      setIsOnline(newState);
      showToast(
        newState ? "DRIVER ONLINE: Radar Aktif" : "DRIVER OFFLINE",
        newState ? "success" : "info",
      );
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="animate-spin text-teal-600" size={40} />
      </div>
    );

  if (courierData && !courierData.is_verified) {
    return (
      <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center p-6 text-left text-center">
        <div className="bg-white w-full max-w-md rounded-[3rem] p-10 shadow-2xl animate-in zoom-in-95">
          <div className="w-20 h-20 bg-teal-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <ShieldCheck size={40} className="text-teal-600 animate-pulse" />
          </div>
          <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">
            Verifikasi Akun
          </h1>
          <p className="text-xs text-slate-500 font-bold uppercase mt-4 leading-relaxed tracking-tight">
            Identitas Anda sedang divalidasi oleh Admin Wilayah{" "}
            {courierData.markets?.name || "Pasar"}.
          </p>
          <div className="mt-10 space-y-3">
            <button
              onClick={() => window.open("https://wa.me/628123456789")}
              className="w-full py-4 bg-teal-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-lg shadow-teal-200"
            >
              Hubungi Admin
            </button>
            <button
              onClick={handleLogout}
              className="w-full py-4 bg-slate-50 text-slate-400 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em]"
            >
              Keluar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex font-sans text-left overflow-hidden relative">
      <CourierSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOnline={isOnline}
        onToggleOnline={toggleOnline}
        courierData={courierData}
        onLocationClick={() => setShowLocationModal(true)}
        onLogout={handleLogout}
      />

      <div className="flex-1 flex flex-col min-w-0 pb-24 lg:pb-0 overflow-y-auto no-scrollbar">
        {/* TOPBAR */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-40 px-6 md:px-10 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <div
              className={`w-3 h-3 rounded-full ${isOnline ? "bg-green-500 animate-pulse" : "bg-red-500"}`}
            ></div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
              Status:{" "}
              <span className={isOnline ? "text-green-600" : "text-red-600"}>
                {isOnline ? "Online" : "Offline"}
              </span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end hidden md:block">
              <p className="text-[10px] font-black text-slate-800 uppercase leading-none">
                {courierData?.full_name || courierData?.name}
              </p>
              <p className="text-[8px] font-bold text-teal-600 uppercase mt-1">
                {courierData?.markets?.name || "Pasar Lokal"}
              </p>
            </div>
            <div className="w-10 h-10 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black shadow-lg uppercase">
              {(courierData?.full_name || courierData?.name || "C").charAt(0)}
            </div>
          </div>
        </header>

        <main className="p-6 md:p-10 max-w-5xl mx-auto w-full">
          {activeTab === "bid" && (
            <div className="space-y-6">
              <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">
                Radar Driver
              </h1>
              {activeOrder ? (
                <CourierActiveOrder
                  order={activeOrder}
                  onFinished={() => {
                    setActiveOrder(null);
                    fetchInitialData();
                  }}
                />
              ) : (
                <CourierBidArea
                  isOnline={isOnline}
                  currentCoords={currentCoords}
                  onOrderAccepted={fetchInitialData}
                />
              )}
            </div>
          )}

          {activeTab === "messages" && <CourierMessages />}
          {activeTab === "profile" && (
            <CourierProfile courierData={courierData} />
          )}

          {/* TAB: FINANCE */}
          {activeTab === "finance" && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4">
              <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter text-left">
                Dompet Saya
              </h1>
              <div className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl shadow-slate-900/30">
                <div className="relative z-10 text-left">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-2">
                    Gaji Bersih Tersedia
                  </p>
                  <h2 className="text-5xl font-black tracking-tighter mb-10 italic leading-none">
                    Rp{" "}
                    {Number(courierData?.wallet_balance || 0).toLocaleString(
                      "id-ID",
                    )}
                  </h2>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowTopUpModal(true)}
                      className="py-4 px-8 bg-white/10 hover:bg-white/20 text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center gap-2"
                    >
                      <Plus size={16} /> Top Up (Deposit)
                    </button>
                    <button
                      onClick={() => {
                        if (
                          courierData?.wallet_balance < MIN_WITHDRAWAL_COURIER
                        ) {
                          showToast(
                            `Minimal tarik gaji Rp ${MIN_WITHDRAWAL_COURIER.toLocaleString()}`,
                            "info",
                          );
                          return;
                        }
                        setShowWDModal(true);
                      }}
                      className={`py-4 px-8 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center gap-2 shadow-lg ${
                        courierData?.wallet_balance >= MIN_WITHDRAWAL_COURIER
                          ? "bg-teal-500 hover:bg-teal-400 text-slate-900 shadow-teal-500/20"
                          : "bg-slate-800 text-slate-500 cursor-not-allowed"
                      }`}
                    >
                      <ArrowDownLeft size={16} /> Tarik Dana (WD)
                    </button>
                  </div>
                </div>
                <div className="absolute right-[-40px] bottom-[-40px] text-white/[0.03] w-80 h-80 rotate-[-15deg]">
                  <Wallet size={320} />
                </div>
              </div>
              {courierData?.wallet_balance < MIN_WITHDRAWAL_COURIER && (
                <p className="text-xs font-bold text-slate-400 uppercase italic flex items-center gap-2 px-6">
                  <AlertCircle size={14} className="text-orange-500" />{" "}
                  Kumpulkan saldo minimal Rp{" "}
                  {MIN_WITHDRAWAL_COURIER.toLocaleString()} untuk mencairkan ke
                  bank.
                </p>
              )}
            </div>
          )}

          {activeTab === "history" && (
            <div className="py-24 text-center flex flex-col items-center bg-white rounded-[3rem] border border-slate-100">
              <History size={40} className="text-slate-200 mb-4" />
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">
                Riwayat Kosong
              </h3>
            </div>
          )}
        </main>
      </div>

      {/* MODAL TOP UP KURIR */}
      {showTopUpModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in"
            onClick={() => setShowTopUpModal(false)}
          />
          <div className="relative w-full max-w-md animate-in zoom-in-95">
            <button
              onClick={() => setShowTopUpModal(false)}
              className="absolute -top-14 right-0 p-3 text-white/70 hover:text-white"
            >
              <X size={32} />
            </button>
            <KurirTopUp
              courierId={user?.id || ""}
              theme={{
                card: "bg-white",
                text: "text-slate-900",
                border: "border-slate-100",
                subText: "text-slate-400",
              }}
            />
          </div>
        </div>
      )}

      {/* ✅ MODAL TARIK DANA (WITHDRAWAL) */}
      <WithdrawalModal
        isOpen={showWDModal}
        onClose={() => setShowWDModal(false)}
        profile={courierData}
        role="COURIER"
        onSuccess={fetchInitialData}
      />

      {showLocationModal && (
        <LocationPickerModal
          merchantProfile={courierData}
          onClose={() => setShowLocationModal(false)}
          onUpdate={fetchInitialData}
        />
      )}
    </div>
  );
};

// Helper component untuk icon peringatan
const AlertCircle = ({
  size,
  className,
}: {
  size: number;
  className?: string;
}) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);
