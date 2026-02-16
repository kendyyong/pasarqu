import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabaseClient";
import { useToast } from "../../contexts/ToastContext";
import { useNavigate } from "react-router-dom";
import {
  Loader2,
  AlertTriangle,
  RefreshCw,
  MapPin,
  BellRing,
  CheckCircle,
  Volume2,
} from "lucide-react";

import { MerchantSidebar } from "./components/MerchantSidebar";
import { MerchantOverview } from "./components/MerchantOverview";
import { MerchantProducts } from "./components/MerchantProducts";
import { MerchantOrders } from "./components/MerchantOrders";
import { MerchantFinanceDashboard } from "./components/MerchantFinanceDashboard";
import { MerchantMessages } from "./components/MerchantMessages";
import { LocationPickerModal } from "./components/LocationPickerModal";

// --- LINK SUARA ALARM (DURASI PANJANG/LOOP) ---
const ALARM_URL =
  "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3";

type TabType =
  | "overview"
  | "products"
  | "orders"
  | "wallet"
  | "messages"
  | "finance"
  | "location";

export const MerchantDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [merchantProfile, setMerchantProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // State trigger Form Produk
  const [triggerAddProduct, setTriggerAddProduct] = useState(false);

  // Data Dashboard
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);

  // 🔥 STATE ALARM & ORDER BARU 🔥
  const [incomingOrder, setIncomingOrder] = useState<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // 1. INISIALISASI AUDIO
  useEffect(() => {
    audioRef.current = new Audio(ALARM_URL);
    audioRef.current.loop = true; // Alarm bunyi terus sampai dimatikan
  }, []);

  // 2. FETCH DATA DASAR
  const fetchBaseData = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("*, markets:managed_market_id(name)")
        .eq("id", user.id)
        .single();
      let { data: merchantData } = await supabase
        .from("merchants")
        .select("*, markets(name)")
        .or(`user_id.eq.${user.id},id.eq.${user.id}`)
        .maybeSingle();

      if (profile?.is_verified === true) {
        const effectiveMerchant = {
          ...(merchantData || {}),
          id: merchantData?.id || user.id,
          shop_name:
            merchantData?.shop_name ||
            profile.shop_name ||
            profile.name ||
            "Toko Saya",
          market_id: merchantData?.market_id || profile.managed_market_id,
          latitude: merchantData?.latitude || profile.latitude,
          longitude: merchantData?.longitude || profile.longitude,
          is_shop_open: merchantData?.is_shop_open ?? true,
          market_name:
            merchantData?.markets?.name ||
            profile.markets?.name ||
            "Muara Jawa",
        };

        const [resProducts, resOrders] = await Promise.all([
          supabase
            .from("products")
            .select("*")
            .eq("merchant_id", effectiveMerchant.id),
          supabase
            .from("orders")
            .select("*")
            .eq("market_id", effectiveMerchant.market_id)
            .order("created_at", { ascending: false }),
        ]);

        setMerchantProfile(effectiveMerchant);
        setProducts(resProducts.data || []);
        setOrders(resOrders.data || []);
        if (!effectiveMerchant.latitude || effectiveMerchant.latitude === 0)
          setActiveTab("location");
      } else {
        setMerchantProfile(null);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 3. 🔥 LISTENER ORDER REALTIME (PUSAT ALARM) 🔥
  useEffect(() => {
    if (!merchantProfile?.id) return;

    // Listener Update Status Toko
    const syncChannel = supabase
      .channel("merchant_sync")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "merchants",
          filter: `id=eq.${user?.id}`,
        },
        (payload) => {
          setMerchantProfile((prev: any) => ({
            ...prev,
            is_shop_open: payload.new.is_shop_open,
          }));
        },
      )
      .subscribe();

    // 🔥 LISTENER ORDER MASUK (ALARM TRIGGER) 🔥
    const orderChannel = supabase
      .channel("merchant_alarm_system")
      .on(
        "postgres_changes",
        {
          event: "INSERT", // Hanya dengarkan Order Baru
          schema: "public",
          table: "order_items", // Kita dengarkan order items karena ada merchant_id
          filter: `merchant_id=eq.${merchantProfile.id}`,
        },
        async (payload) => {
          console.log("ALARM: ORDER MASUK!", payload);
          triggerAlarm(payload.new);
          fetchBaseData(); // Refresh data order di background
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(syncChannel);
      supabase.removeChannel(orderChannel);
      stopAlarm(); // Matikan alarm jika user menutup tab/logout
    };
  }, [merchantProfile, user]);

  const handleToggleStatus = async () => {
    if (!merchantProfile || isUpdatingStatus) return;
    setIsUpdatingStatus(true);
    const newStatus = !merchantProfile.is_shop_open;
    try {
      await supabase
        .from("merchants")
        .update({ is_shop_open: newStatus })
        .eq("id", merchantProfile.id);
      setMerchantProfile((prev: any) => ({ ...prev, is_shop_open: newStatus }));
      showToast(newStatus ? "Toko BUKA" : "Toko TUTUP", "info");
    } catch (err) {
      showToast("Gagal merubah status", "error");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleAddProductShortcut = () => {
    setActiveTab("products");
    setTriggerAddProduct(true);
    setTimeout(() => setTriggerAddProduct(false), 500);
  };

  // 🔥 FUNGSI KONTROL ALARM 🔥
  const triggerAlarm = (orderData: any) => {
    setIncomingOrder(orderData);
    if (audioRef.current) {
      // Promise catch untuk mengatasi browser policy yg memblokir autoplay
      audioRef.current
        .play()
        .catch((e) => console.log("Audio Autoplay Blocked:", e));
    }
  };

  const stopAlarm = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIncomingOrder(null);
  };

  const handleProsesOrder = () => {
    stopAlarm();
    setActiveTab("orders"); // Pindah ke tab Order
  };

  useEffect(() => {
    fetchBaseData();
  }, [user]);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="animate-spin text-slate-900" size={32} />
      </div>
    );

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row font-sans text-left overflow-hidden">
      {/* 1. SIDEBAR DESKTOP */}
      <aside className="hidden md:flex w-64 h-screen fixed left-0 top-0 z-50 border-r border-slate-200 bg-white">
        <MerchantSidebar
          activeTab={activeTab}
          setActiveTab={(tab: any) => setActiveTab(tab)}
          merchantProfile={merchantProfile}
          onLocationClick={() => setActiveTab("location")}
          onLogout={logout}
          onToggleStatus={handleToggleStatus}
          onAddProduct={handleAddProductShortcut}
          orderCount={orders.length}
          productCount={products.length}
        />
      </aside>

      {/* 2. AREA KONTEN */}
      <div className="flex-1 flex flex-col min-w-0 md:ml-64 w-full md:w-[calc(100%-16rem)] h-screen overflow-hidden">
        {/* HEADER */}
        <header className="h-14 md:h-16 bg-white border-b border-slate-200 px-4 md:px-8 flex items-center justify-between sticky top-0 z-40 shrink-0">
          <div className="flex flex-col text-left truncate flex-1 mr-4">
            <h1 className="text-[11px] md:text-sm font-black uppercase tracking-tight text-slate-900 truncate leading-none">
              {merchantProfile.shop_name}
            </h1>
            <div className="flex items-center gap-1 mt-1 text-slate-400">
              <MapPin size={8} />
              <span className="text-[7px] md:text-[8px] font-bold uppercase tracking-wider truncate">
                {merchantProfile.market_name}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="flex flex-col items-end mr-1">
              <p className="text-[6px] md:text-[7px] font-black text-slate-400 uppercase leading-none">
                Layanan Chat
              </p>
              <p
                className={`text-[8px] md:text-[9px] font-black uppercase mt-0.5 flex items-center gap-0.5 ${merchantProfile.is_shop_open ? "text-green-600" : "text-red-500"}`}
              >
                <span
                  className={`w-1 h-1 ${merchantProfile.is_shop_open ? "bg-green-500 animate-pulse" : "bg-red-500"}`}
                ></span>
                {merchantProfile.is_shop_open ? "AKTIF" : "OFFLINE"}
              </p>
            </div>
            <div
              className={`w-8 h-8 md:w-9 md:h-9 bg-slate-900 text-white rounded-none flex items-center justify-center font-black text-xs uppercase border-b-2 ${merchantProfile.is_shop_open ? "border-green-500" : "border-red-500"}`}
            >
              {merchantProfile.shop_name.charAt(0)}
            </div>
          </div>
        </header>

        {/* MAIN CONTENT */}
        <main className="flex-1 overflow-y-auto no-scrollbar pb-24 md:pb-6 bg-slate-50/20">
          <div className="p-3 md:p-6 w-full">
            <div className="text-[10px] md:text-sm">
              {activeTab === "overview" && (
                <MerchantOverview
                  merchantProfile={merchantProfile}
                  stats={{ orders: orders.length, products: products.length }}
                />
              )}

              {activeTab === "products" && (
                <MerchantProducts
                  merchantProfile={merchantProfile}
                  autoOpenForm={triggerAddProduct}
                />
              )}

              {/* Pastikan file MerchantOrders.tsx sudah ada! */}
              {activeTab === "orders" && (
                <MerchantOrders merchantProfile={merchantProfile} />
              )}
              {activeTab === "messages" && <MerchantMessages />}
              {(activeTab === "wallet" || activeTab === "finance") && (
                <MerchantFinanceDashboard />
              )}
              {activeTab === "location" && (
                <div className="bg-white border border-slate-200 overflow-hidden">
                  <LocationPickerModal
                    merchantProfile={merchantProfile}
                    onClose={() => setActiveTab("overview")}
                    onUpdate={fetchBaseData}
                  />
                </div>
              )}
            </div>
          </div>
        </main>

        {/* BOTTOM NAV MOBILE */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white">
          <MerchantSidebar
            activeTab={activeTab}
            setActiveTab={(tab: any) => setActiveTab(tab)}
            merchantProfile={merchantProfile}
            onLocationClick={() => setActiveTab("location")}
            onLogout={logout}
            onToggleStatus={handleToggleStatus}
            onAddProduct={handleAddProductShortcut}
            orderCount={orders.length}
            productCount={products.length}
          />
        </div>
      </div>

      {/* 🔥🔥🔥 MODAL ALARM FULL SCREEN (POPUP ORDER MASUK) 🔥🔥🔥 */}
      {incomingOrder && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/95 backdrop-blur-md flex flex-col items-center justify-center p-6 animate-in zoom-in duration-300">
          <div className="bg-white w-full max-w-sm rounded-none border-4 border-red-500 shadow-2xl p-8 text-center relative overflow-hidden">
            {/* Efek Ping */}
            <div className="absolute top-4 right-4">
              <span className="relative flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500"></span>
              </span>
            </div>

            <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
              <BellRing size={48} className="text-red-600" />
            </div>

            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-2">
              Pesanan Masuk!
            </h2>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-8">
              Segera terima agar kurir bisa menjemput.
            </p>

            <div className="space-y-3">
              <button
                onClick={handleProsesOrder}
                className="w-full py-4 bg-teal-600 text-white font-black uppercase text-sm tracking-widest shadow-xl hover:bg-teal-700 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle size={18} /> PROSES SEKARANG
              </button>

              <button
                onClick={stopAlarm}
                className="w-full py-4 bg-slate-100 text-slate-500 font-bold uppercase text-xs tracking-widest hover:bg-slate-200 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Volume2 size={16} /> Matikan Suara Saja
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
