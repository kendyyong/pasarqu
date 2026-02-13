import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabaseClient";
import { useToast } from "../../contexts/ToastContext";
import { useNavigate } from "react-router-dom";
import {
  Loader2,
  AlertTriangle,
  Volume2,
  VolumeX,
  Bell,
  X,
  Package,
  ArrowUpRight,
} from "lucide-react";

import { MerchantSidebar } from "./components/MerchantSidebar";
import { MerchantOverview } from "./components/MerchantOverview";
import { MerchantProducts } from "./components/MerchantProducts";
import { MerchantOrders } from "./components/MerchantOrders";
import { MerchantWallet } from "./components/MerchantWallet"; // Import Tab Dompet
import { LocationPickerModal } from "./components/LocationPickerModal";

// Mendefinisikan tipe tab yang diizinkan
type TabType = "overview" | "products" | "orders" | "wallet";

export const MerchantDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // State Utama
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [merchantProfile, setMerchantProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [showLocationModal, setShowLocationModal] = useState(false);

  // Audio & Live State
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const fetchBaseData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: merchantData, error: mError } = await supabase
        .from("merchants")
        .select("*, markets(name)")
        .eq("user_id", user.id)
        .maybeSingle();

      if (mError) throw mError;
      if (!merchantData) {
        setMerchantProfile(null);
        return;
      }

      const [resProducts, resOrders] = await Promise.all([
        supabase
          .from("products")
          .select("*")
          .eq("merchant_id", merchantData.id),
        supabase
          .from("orders")
          .select("*")
          .eq("merchant_id", merchantData.id)
          .order("created_at", { ascending: false }),
      ]);

      setMerchantProfile(merchantData);
      setProducts(resProducts.data || []);
      setOrders(resOrders.data || []);
    } catch (err: any) {
      showToast("Gagal memuat data: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  // --- LOGIKA REAL-TIME PESANAN MASUK ---
  useEffect(() => {
    if (!merchantProfile?.id) return;

    audioRef.current = new Audio("/sounds/kaching.mp3");

    const ordersSubscription = supabase
      .channel(`merchant_orders_${merchantProfile.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "orders",
          filter: `merchant_id=eq.${merchantProfile.id}`,
        },
        (payload) => {
          if (!isMuted && audioRef.current) {
            audioRef.current.play().catch(() => console.log("Audio blocked"));
          }
          showToast("📦 ADA PESANAN BARU MASUK!", "success");
          fetchBaseData();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ordersSubscription);
    };
  }, [merchantProfile?.id, isMuted]);

  useEffect(() => {
    fetchBaseData();
  }, [user]);

  const handleLogout = async () => {
    if (window.confirm("Keluar dari Dashboard?")) {
      await logout();
      navigate("/portal");
    }
  };

  const handleToggleStatus = async () => {
    if (!merchantProfile) return;
    const newStatus = !merchantProfile.is_shop_open;
    const { error } = await supabase
      .from("merchants")
      .update({ is_shop_open: newStatus })
      .eq("id", merchantProfile.id);

    if (!error) {
      setMerchantProfile({ ...merchantProfile, is_shop_open: newStatus });
      showToast(
        newStatus ? "Toko Berhasil DIBUKA" : "Toko Berhasil DITUTUP",
        "info",
      );
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <Loader2
            className="animate-spin text-teal-600 mx-auto mb-4"
            size={40}
          />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
            Otentikasi Toko...
          </p>
        </div>
      </div>
    );

  if (!merchantProfile) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
        <div className="bg-white p-10 rounded-[3rem] shadow-2xl max-w-sm border border-orange-100">
          <AlertTriangle size={60} className="mx-auto text-orange-400 mb-6" />
          <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">
            Toko Belum Aktif
          </h2>
          <p className="text-xs text-slate-500 font-bold mt-4 leading-relaxed uppercase tracking-tight">
            Hubungi Admin Pasar untuk aktivasi menggunakan User ID di bawah:
          </p>
          <div className="mt-4 p-4 bg-slate-50 rounded-2xl text-[10px] font-mono text-teal-600 break-all border border-teal-50">
            {user?.id}
          </div>
          <button
            onClick={handleLogout}
            className="mt-8 w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest active:scale-95 transition-all"
          >
            Keluar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex font-sans text-left overflow-hidden">
      <MerchantSidebar
        activeTab={activeTab}
        setActiveTab={(tab: any) => setActiveTab(tab)}
        merchantProfile={merchantProfile}
        onLocationClick={() => setShowLocationModal(true)}
        onLogout={handleLogout}
        onToggleStatus={handleToggleStatus}
        onAddProduct={() => setActiveTab("products")}
        orderCount={
          orders.filter((o) => o.status === "pending" || o.status === "PENDING")
            .length
        }
        productCount={products.length}
      />

      <div className="flex-1 flex flex-col min-w-0 pb-24 lg:pb-0 overflow-y-auto no-scrollbar">
        {/* HEADER PRO */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-40 px-10 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <div
              className={`w-3 h-3 rounded-full ${merchantProfile.is_shop_open ? "bg-green-500 animate-pulse" : "bg-red-500"}`}
            ></div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
              Status:{" "}
              <span
                className={
                  merchantProfile.is_shop_open
                    ? "text-green-600"
                    : "text-red-600"
                }
              >
                {merchantProfile.is_shop_open ? "Toko Buka" : "Toko Tutup"}
              </span>
            </span>
          </div>

          <div className="flex items-center gap-6">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`p-2.5 rounded-xl transition-all ${isMuted ? "text-slate-300" : "text-teal-600 bg-teal-50"}`}
            >
              {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>

            <div className="flex items-center gap-3 bg-slate-50 pl-4 pr-1.5 py-1.5 rounded-2xl border border-slate-100">
              <div className="text-right">
                <p className="text-[10px] font-black text-slate-800 uppercase leading-none">
                  {merchantProfile.shop_name}
                </p>
                <p className="text-[8px] font-bold text-teal-600 uppercase mt-1 tracking-tighter">
                  {merchantProfile.markets?.name}
                </p>
              </div>
              <div className="w-8 h-8 bg-teal-600 text-white rounded-xl flex items-center justify-center font-black text-xs shadow-sm uppercase">
                {merchantProfile.shop_name?.charAt(0)}
              </div>
            </div>
          </div>
        </header>

        <main className="p-6 md:p-10 max-w-6xl mx-auto w-full">
          <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-3">
                {activeTab === "overview"
                  ? "DASHBOARD"
                  : activeTab.toUpperCase()}
              </h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                Pengelolaan Lapak Digital Pasarqu
              </p>
            </div>

            <div className="flex bg-white p-1.5 rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/50">
              <button
                onClick={handleToggleStatus}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl transition-all font-black text-[10px] uppercase tracking-widest ${
                  merchantProfile.is_shop_open
                    ? "bg-green-500 text-white shadow-lg shadow-green-200"
                    : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                }`}
              >
                {merchantProfile.is_shop_open
                  ? "Buka Sekarang"
                  : "Tutup Sementara"}
              </button>
            </div>
          </div>

          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            {activeTab === "overview" && (
              <MerchantOverview
                merchantProfile={merchantProfile}
                stats={{ orders: orders.length, products: products.length }}
              />
            )}
            {activeTab === "products" && (
              <MerchantProducts merchantProfile={merchantProfile} />
            )}
            {activeTab === "orders" && (
              <MerchantOrders merchantProfile={merchantProfile} />
            )}
            {activeTab === "wallet" && (
              <MerchantWallet merchantProfile={merchantProfile} />
            )}
          </div>
        </main>
      </div>

      {showLocationModal && merchantProfile && (
        <LocationPickerModal
          merchantProfile={merchantProfile}
          onClose={() => setShowLocationModal(false)}
          onUpdate={fetchBaseData}
        />
      )}
    </div>
  );
};
