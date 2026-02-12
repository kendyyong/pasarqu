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
} from "lucide-react";

// KOMPONEN MODULAR
import { CourierSidebar } from "./components/CourierSidebar";
import { CourierBidArea } from "./components/CourierBidArea";
import { CourierProfile } from "./components/CourierProfile";
import { CourierActiveOrder } from "./components/CourierActiveOrder"; // <--- PASTIKAN SUDAH DIBUAT
import { LocationPickerModal } from "../merchant/components/LocationPickerModal";

export const CourierDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("bid");
  const [isOnline, setIsOnline] = useState(false);
  const [courierData, setCourierData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeOrder, setActiveOrder] = useState<any>(null); // State untuk order yang sedang dikerjakan
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [currentCoords, setCurrentCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  // Fungsi ambil data profile & cek apakah ada order yang sedang jalan
  const fetchInitialData = async () => {
    if (!user) return;
    try {
      // 1. Ambil Profile
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

      // 2. Ambil Order Aktif (Status ON_DELIVERY)
      const { data: order } = await supabase
        .from("orders")
        .select(
          `
          *,
          profiles:buyer_id (name, phone_number, address, latitude, longitude),
          merchants:merchant_id (shop_name, address, latitude, longitude)
        `,
        )
        .eq("courier_id", user.id)
        .eq("status", "ON_DELIVERY")
        .maybeSingle();

      if (order) setActiveOrder(order);
    } catch (err: any) {
      console.error("Init data error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, [user]);

  const handleLogout = async () => {
    if (window.confirm("Selesai bekerja & keluar?")) {
      await logout();
      navigate("/portal");
    }
  };

  const toggleOnline = async () => {
    if (!courierData?.is_verified) {
      showToast("Akun belum diverifikasi Admin", "error");
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
        newState ? "ONLINE: Radar Aktif" : "OFFLINE",
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
      <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center p-6 text-center">
        <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl animate-in zoom-in-95 text-center">
          <Clock
            size={60}
            className="text-teal-600 mx-auto mb-6 animate-pulse"
          />
          <h1 className="text-xl font-black text-slate-800 uppercase">
            Verifikasi Admin
          </h1>
          <p className="text-[11px] text-slate-500 font-bold uppercase mt-4 leading-relaxed">
            Data Anda sedang diperiksa. Mohon tunggu aktivasi.
          </p>
          <div className="mt-8 space-y-3">
            <button
              onClick={() => window.open("https://wa.me/628123456789")}
              className="w-full py-4 bg-teal-600 text-white rounded-2xl font-black uppercase text-xs"
            >
              Chat Admin
            </button>
            <button
              onClick={handleLogout}
              className="w-full py-4 bg-white border border-slate-200 text-slate-400 rounded-2xl font-black uppercase text-[10px]"
            >
              Keluar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f7f6] flex font-sans">
      <CourierSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOnline={isOnline}
        onToggleOnline={toggleOnline}
        courierData={courierData}
        onLocationClick={() => setShowLocationModal(true)}
        onLogout={handleLogout}
      />

      <main className="flex-1 flex flex-col min-w-0 pb-24 lg:pb-0 text-left">
        <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-20 px-6 flex items-center justify-between lg:hidden">
          <div className="text-lg font-black text-teal-600 tracking-tighter uppercase italic">
            PASARQU DRIVER
          </div>
          <div
            onClick={toggleOnline}
            className={`px-4 py-1.5 rounded-full text-[10px] font-black transition-all cursor-pointer ${isOnline ? "bg-green-100 text-green-600 shadow-sm" : "bg-slate-100 text-slate-400"}`}
          >
            {isOnline ? "ONLINE" : "OFFLINE"}
          </div>
        </header>

        <div className="p-4 md:p-10 max-w-5xl mx-auto w-full">
          {activeTab === "bid" &&
            /* LOGIKA: JIKA ADA ORDER JALAN, TAMPILKAN NAVIGASI. JIKA TIDAK, TAMPILKAN RADAR */
            (activeOrder ? (
              <CourierActiveOrder
                order={activeOrder}
                onFinished={() => {
                  setActiveOrder(null);
                  fetchInitialData(); // Refresh saldo & status
                }}
              />
            ) : (
              <CourierBidArea
                isOnline={isOnline}
                currentCoords={currentCoords}
                onOrderAccepted={fetchInitialData} // <--- FUNGSI INI YANG TADI DICARI (SOLUSI ERROR 2741)
              />
            ))}

          {activeTab === "profile" && (
            <CourierProfile courierData={courierData} />
          )}

          {activeTab === "finance" && (
            <div className="space-y-6 animate-in fade-in">
              <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-xl">
                <p className="text-teal-400 text-[10px] font-black uppercase tracking-widest mb-1">
                  Dompet Driver
                </p>
                <h2 className="text-4xl font-black tracking-tighter">
                  Rp {courierData?.wallet_balance?.toLocaleString() || 0}
                </h2>
                <button className="mt-6 px-6 py-3 bg-teal-600 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-teal-700 transition-all">
                  <ArrowUpRight size={14} /> Tarik Dana
                </button>
                <Wallet className="absolute right-[-20px] bottom-[-20px] text-white/5 w-64 h-64 rotate-[-15deg]" />
              </div>
            </div>
          )}

          {activeTab === "history" && (
            <div className="py-20 text-center flex flex-col items-center opacity-30 uppercase">
              <History size={40} className="mb-4" />
              <span className="text-[10px] font-black tracking-widest">
                Riwayat Kosong
              </span>
            </div>
          )}
        </div>
      </main>

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
