import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { useJsApiLoader } from "@react-google-maps/api";
import {
  Loader2,
  Bell,
  Map as MapIcon,
  ShoppingCart,
  Volume2,
  VolumeX,
  Package,
  X,
  ArrowUpRight,
  Star,
  AlertCircle,
  Megaphone,
  ShoppingBag,
  ArrowLeft,
  LayoutGrid,
} from "lucide-react";

// --- IMPORT KOMPONEN MODULAR ---
import { LocalSidebar } from "./components/LocalSidebar";
import { PartnerDetailModal } from "./components/PartnerDetailModal";

// --- IMPORT TABS ---
import { LocalOverviewTab } from "./tabs/LocalOverviewTab";
import { LocalProductsTab } from "./tabs/LocalProductsTab";
import { LocalUsersTab } from "./tabs/LocalUsersTab";
import { LocalRadarTab } from "./tabs/LocalRadarTab";
import { LocalFinanceTab } from "./tabs/LocalFinanceTab";
import { LocalRatingsTab } from "./tabs/LocalRatingsTab";
import { LocalResolutionTab } from "./tabs/LocalResolutionTab";
import { LocalBroadcastTab } from "./tabs/LocalBroadcastTab";
import { LocalOrdersTab } from "./tabs/LocalOrdersTab";

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

const libraries: "places"[] = ["places"];

// Interface untuk menangani properti onBack dari App.tsx
interface Props {
  onBack?: () => void | Promise<void>;
}

export const LocalAdminDashboard: React.FC<Props> = ({ onBack }) => {
  const { profile, logout } = useAuth();
  const { showToast } = useToast();

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
    libraries,
  });

  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [isLoading, setIsLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(false);

  // Audio & Notification State
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [newOrderPopup, setNewOrderPopup] = useState<any>(null);

  // DATA STATE
  const [myMarket, setMyMarket] = useState<any>(null);
  const [myMerchants, setMyMerchants] = useState<any[]>([]);
  const [myCouriers, setMyCouriers] = useState<any[]>([]);
  const [myCustomers, setMyCustomers] = useState<any[]>([]);
  const [pendingProducts, setPendingProducts] = useState<any[]>([]);
  const [liveOrdersCount, setLiveOrdersCount] = useState(0);

  const [detailModal, setDetailModal] = useState<{
    isOpen: boolean;
    user: any;
  }>({ isOpen: false, user: null });

  const fetchData = async () => {
    if (!profile?.managed_market_id) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const targetMarketId = profile.managed_market_id;
      const [marketRes, usersRes, prodRes, orderCountRes] = await Promise.all([
        supabase.from("markets").select("*").eq("id", targetMarketId).single(),
        supabase
          .from("profiles")
          .select("*")
          .eq("managed_market_id", targetMarketId),
        supabase
          .from("products")
          .select("*, merchants(name, shop_name)")
          .eq("market_id", targetMarketId)
          .eq("status", "PENDING"),
        supabase
          .from("orders")
          .select("id", { count: "exact", head: true })
          .eq("market_id", targetMarketId)
          .eq("status", "PENDING"),
      ]);

      if (marketRes.data) setMyMarket(marketRes.data);
      if (usersRes.data) {
        setMyMerchants(usersRes.data.filter((p) => p.role === "MERCHANT"));
        setMyCouriers(usersRes.data.filter((p) => p.role === "COURIER"));
        setMyCustomers(usersRes.data.filter((p) => p.role === "CUSTOMER"));
      }
      setPendingProducts(prodRes.data || []);
      setLiveOrdersCount(orderCountRes.count || 0);
    } catch (error: any) {
      showToast("Gagal memuat data wilayah", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // --- LOGIKA REAL-TIME NOTIFICATION ---
  useEffect(() => {
    if (!profile?.managed_market_id) return;

    audioRef.current = new Audio("/sounds/kaching.mp3");

    const ordersSubscription = supabase
      .channel("live_orders_wilayah")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "orders",
          filter: `market_id=eq.${profile.managed_market_id}`,
        },
        async (payload) => {
          setLiveOrdersCount((prev) => prev + 1);

          const { data: orderDetail } = await supabase
            .from("orders")
            .select("*, profiles(full_name)")
            .eq("id", payload.new.id)
            .single();

          if (orderDetail) {
            setNewOrderPopup(orderDetail);
            setTimeout(() => setNewOrderPopup(null), 8000);
          }

          if (!isMuted && audioRef.current) {
            audioRef.current.play().catch(() => console.log("Audio blocked"));
          }
          showToast(`📦 PESANAN BARU MASUK!`, "success");
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ordersSubscription);
    };
  }, [profile?.managed_market_id, isMuted]);

  useEffect(() => {
    if (profile) fetchData();
  }, [profile]);

  if (isLoading)
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <Loader2 className="animate-spin text-teal-600" size={40} />
      </div>
    );

  return (
    <div className="min-h-screen bg-[#f8fafc] flex font-sans text-left transition-all duration-500 overflow-hidden">
      {/* 1. NOTIFICATION POPUP */}
      {newOrderPopup && (
        <div className="fixed bottom-10 right-10 z-[100] w-80 bg-white rounded-[2.5rem] shadow-2xl border border-teal-100 p-6 animate-in slide-in-from-right-full duration-500">
          <button
            onClick={() => setNewOrderPopup(null)}
            className="absolute top-6 right-6 text-slate-300 hover:text-slate-500"
          >
            <X size={18} />
          </button>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-teal-500 text-white rounded-2xl flex items-center justify-center animate-bounce shadow-lg shadow-teal-200">
              <Package size={22} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black text-teal-600 uppercase tracking-[0.2em]">
                Order Baru
              </p>
              <h4 className="text-sm font-black text-slate-800 uppercase truncate">
                {newOrderPopup.profiles?.full_name}
              </h4>
            </div>
          </div>
          <button
            onClick={() => {
              setActiveTab("orders");
              setNewOrderPopup(null);
            }}
            className="w-full bg-slate-900 text-white py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-teal-600 transition-all"
          >
            Buka Monitoring <ArrowUpRight size={14} />
          </button>
        </div>
      )}

      {/* 2. SIDEBAR */}
      <LocalSidebar
        marketName={myMarket?.name}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pendingMerchants={myMerchants.filter((m) => !m.is_verified).length}
        pendingCouriers={myCouriers.filter((c) => !c.is_verified).length}
        pendingProducts={pendingProducts.length}
        onLogout={logout}
      />

      {/* 3. MAIN CONTENT AREA */}
      <div className="flex-1 ml-72 flex flex-col min-h-screen">
        {/* HEADER PRO RAMPING */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-10 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2.5 bg-slate-50 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-xl transition-all border border-slate-100 active:scale-90"
              >
                <ArrowLeft size={18} />
              </button>
            )}
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-teal-500 rounded-full animate-pulse"></div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
                Control Wilayah{" "}
                <span className="text-teal-600">{myMarket?.name}</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-5">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`p-2.5 rounded-xl transition-all ${isMuted ? "text-slate-300" : "text-teal-600 bg-teal-50 hover:bg-teal-100"}`}
            >
              {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>

            <div className="relative p-2.5 bg-slate-50 rounded-xl text-slate-400">
              <Bell size={20} />
              {liveOrdersCount > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-orange-500 rounded-full border-2 border-white"></span>
              )}
            </div>

            <div className="h-8 w-[1px] bg-slate-100 mx-2"></div>

            <div className="flex items-center gap-3 bg-slate-50 pl-4 pr-1.5 py-1.5 rounded-2xl border border-slate-100">
              <span className="text-[10px] font-black text-slate-700 uppercase tracking-tight">
                {profile?.full_name?.split(" ")[0]}
              </span>
              <div className="w-8 h-8 bg-teal-600 text-white rounded-xl flex items-center justify-center font-black text-xs shadow-sm uppercase">
                {profile?.full_name?.charAt(0)}
              </div>
            </div>
          </div>
        </header>

        <main className="p-10 max-w-7xl mx-auto w-full">
          {/* TAB NAVIGATION & TITLE */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-3">
                {activeTab === "overview"
                  ? "Dashboard"
                  : activeTab.replace("_", " ")}
              </h1>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-teal-600 text-white text-[9px] font-black rounded-lg uppercase tracking-widest shadow-lg shadow-teal-100">
                  Live
                </span>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                  Sinkronisasi Satelit Aktif
                </p>
              </div>
            </div>

            {/* QUICK ACTIONS BAR (PENGGANTI BANYAK TOMBOL) */}
            <div className="flex bg-white p-2 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-x-auto no-scrollbar">
              <QuickActionBtn
                active={activeTab === "orders"}
                icon={<ShoppingBag size={18} />}
                label="Orders"
                onClick={() => setActiveTab("orders")}
              />
              <QuickActionBtn
                active={activeTab === "radar"}
                icon={<MapIcon size={18} />}
                label="Radar"
                onClick={() => setActiveTab("radar")}
              />
              <QuickActionBtn
                active={activeTab === "broadcast"}
                icon={<Megaphone size={18} />}
                label="Promo"
                onClick={() => setActiveTab("broadcast")}
              />
              <QuickActionBtn
                active={activeTab === "ratings"}
                icon={<Star size={18} />}
                label="QC"
                onClick={() => setActiveTab("ratings")}
              />
              <QuickActionBtn
                active={activeTab === "resolution"}
                icon={<AlertCircle size={18} />}
                label="Kasus"
                onClick={() => setActiveTab("resolution")}
                color="hover:text-red-500"
              />
            </div>
          </div>

          {/* MAIN DYNAMIC CONTENT */}
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            {activeTab === "orders" && (
              <LocalOrdersTab marketId={profile?.managed_market_id || ""} />
            )}

            {activeTab === "radar" && (
              <LocalRadarTab
                isLoaded={isLoaded}
                myMarket={myMarket}
                merchants={myMerchants}
                couriers={myCouriers}
                customers={myCustomers}
              />
            )}

            {activeTab === "overview" && (
              <LocalOverviewTab
                stats={{
                  pendingProducts: pendingProducts.length,
                  merchants: myMerchants.length,
                  couriers: myCouriers.length,
                  adminShare: 0,
                }}
              />
            )}

            {activeTab === "finance" && (
              <LocalFinanceTab merchants={myMerchants} couriers={myCouriers} />
            )}

            {activeTab === "ratings" && (
              <LocalRatingsTab merchants={myMerchants} couriers={myCouriers} />
            )}

            {activeTab === "resolution" && <LocalResolutionTab />}

            {activeTab === "broadcast" && (
              <LocalBroadcastTab
                marketId={profile?.managed_market_id || ""}
                marketName={myMarket?.name || "Wilayah"}
                customerCount={myCustomers.length}
              />
            )}

            {(activeTab === "merchants" ||
              activeTab === "couriers" ||
              activeTab === "customers") && (
              <LocalUsersTab
                type={activeTab}
                data={
                  activeTab === "merchants"
                    ? myMerchants
                    : activeTab === "couriers"
                      ? myCouriers
                      : myCustomers
                }
                onViewDetail={(u) => setDetailModal({ isOpen: true, user: u })}
              />
            )}

            {activeTab === "products" && (
              <LocalProductsTab
                products={pendingProducts}
                onAction={() => fetchData()}
              />
            )}
          </div>
        </main>
      </div>

      {/* --- MODALS --- */}
      <PartnerDetailModal
        user={detailModal.user}
        onClose={() => setDetailModal({ isOpen: false, user: null })}
        onApprove={() => fetchData()}
        onDeactivate={() => fetchData()}
      />
    </div>
  );
};

// --- SUB KOMPONEN QUICK ACTION ---
const QuickActionBtn = ({
  active,
  icon,
  label,
  onClick,
  color = "hover:text-teal-600",
}: any) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-5 py-2.5 rounded-[1.5rem] transition-all group shrink-0 ${active ? "bg-slate-900 text-white shadow-lg" : `text-slate-400 ${color}`}`}
  >
    {icon}
    <span
      className={`text-[10px] font-black uppercase tracking-widest ${active ? "block" : "hidden group-hover:block"}`}
    >
      {label}
    </span>
  </button>
);
