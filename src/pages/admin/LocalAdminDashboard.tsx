import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { useJsApiLoader } from "@react-google-maps/api";
import { useNavigate } from "react-router-dom";
import {
  Loader2,
  Bell,
  Map as MapIcon,
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
  BellRing,
  AlertTriangle,
  BarChart3,
  Radio,
  ClipboardCheck,
} from "lucide-react";

import { LocalSidebar } from "./components/LocalSidebar";
import { PartnerDetailModal } from "./components/PartnerDetailModal";
import { LocalOverviewTab } from "./tabs/LocalOverviewTab";
import { LocalProductsTab } from "./tabs/LocalProductsTab";
import { LocalUsersTab } from "./tabs/LocalUsersTab";
import { LocalRadarTab } from "./tabs/LocalRadarTab";
import { LocalFinanceTab } from "./tabs/LocalFinanceTab";
import { LocalRatingsTab } from "./tabs/LocalRatingsTab";
import { LocalResolutionTab } from "./tabs/LocalResolutionTab";
import { LocalBroadcastTab } from "./tabs/LocalBroadcastTab";
import { LocalOrdersTab } from "./tabs/LocalOrdersTab";
import { LocalCourierMonitor } from "./tabs/LocalCourierMonitor"; // <--- SUDAH SINKRON

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

interface Props {
  onBack?: () => void | Promise<void>;
}

export const LocalAdminDashboard: React.FC<Props> = ({ onBack }) => {
  const { profile, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
    libraries,
  });

  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [isLoading, setIsLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(false);

  const [isAlarmActive, setIsAlarmActive] = useState(false);
  const alarmAudio = useRef<HTMLAudioElement | null>(null);

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
          .select("*, merchants(shop_name, name)")
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
      console.error("Fetch Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const triggerAlarm = () => {
    if (isMuted) return;
    setIsAlarmActive(true);
    if (alarmAudio.current) {
      alarmAudio.current.loop = true;
      alarmAudio.current
        .play()
        .catch(() => console.log("Izin audio browser diperlukan."));
    }
  };

  const stopAlarm = () => {
    setIsAlarmActive(false);
    if (alarmAudio.current) {
      alarmAudio.current.pause();
      alarmAudio.current.currentTime = 0;
    }
  };

  useEffect(() => {
    alarmAudio.current = new Audio(
      "https://actions.google.com/sounds/v1/alarms/beep_short.ogg",
    );
    if (!profile?.managed_market_id) return;
    const productSub = supabase
      .channel("engine_wilayah")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "products",
          filter: `market_id=eq.${profile.managed_market_id}`,
        },
        () => {
          fetchData();
          triggerAlarm();
          showToast("🚨 ADA PRODUK BARU MASUK!", "error");
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(productSub);
      stopAlarm();
    };
  }, [profile?.managed_market_id, isMuted]);

  useEffect(() => {
    if (profile) fetchData();
  }, [profile]);

  if (isLoading)
    return (
      <div className="h-screen flex items-center justify-center bg-white antialiased">
        <Loader2 className="animate-spin text-teal-600" size={40} />
      </div>
    );

  return (
    <div
      className={`min-h-screen flex font-sans text-left antialiased tracking-tight transition-all duration-500 overflow-hidden ${isAlarmActive ? "bg-red-50" : "bg-[#f8fafc]"}`}
    >
      <style>{`
        body { -webkit-font-smoothing: antialiased; text-rendering: optimizeLegibility; }
        .glass-header { background: rgba(255, 255, 255, 0.8); backdrop-filter: blur(20px); }
      `}</style>

      {isAlarmActive && (
        <div className="fixed inset-0 z-[999] bg-red-600/10 animate-pulse pointer-events-none border-[15px] border-red-500/30"></div>
      )}

      <LocalSidebar
        marketName={myMarket?.name || "Wilayah"}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pendingMerchants={
          myMerchants.filter((m) => m.status === "PENDING").length
        }
        pendingCouriers={
          myCouriers.filter((c) => c.status === "PENDING").length
        }
        pendingProducts={pendingProducts.length}
        onLogout={logout}
      />

      <div className="flex-1 ml-72 flex flex-col min-h-screen relative">
        <header
          className={`h-20 flex items-center justify-between px-10 sticky top-0 z-40 glass-header border-b border-slate-100 transition-colors ${isAlarmActive ? "bg-red-600 text-white border-none" : ""}`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-2.5 h-2.5 rounded-full ${isAlarmActive ? "bg-white animate-ping" : "bg-teal-500 animate-pulse"}`}
            ></div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">
              Sistem:{" "}
              <span
                className={
                  isAlarmActive ? "text-white underline" : "text-teal-600"
                }
              >
                {isAlarmActive ? "ALARM AKTIF" : "NORMAL"}
              </span>
            </span>
          </div>

          <div className="flex items-center gap-5">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`p-2.5 rounded-xl ${isAlarmActive ? "bg-white/20" : "bg-slate-100 text-slate-500"}`}
            >
              {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            <div
              className={`px-4 py-1.5 rounded-2xl border font-black text-[10px] uppercase ${isAlarmActive ? "bg-white/10 border-white/20" : "bg-slate-50 border-slate-100"}`}
            >
              {profile?.full_name}
            </div>
          </div>
        </header>

        <main className="p-10 max-w-7xl mx-auto w-full">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div className="text-left text-slate-800">
              <h1 className="text-4xl font-black uppercase tracking-tighter leading-none mb-3 italic">
                {activeTab === "overview"
                  ? "Ringkasan"
                  : activeTab.replace("_", " ")}
              </h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                Sinkronisasi Data Wilayah
              </p>
            </div>

            <div className="flex bg-white p-2 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-x-auto no-scrollbar">
              <button
                onClick={() => navigate("/admin-wilayah/verifikasi-produk")}
                className="flex items-center gap-2 px-5 py-2.5 rounded-[1.5rem] transition-all group shrink-0 text-orange-500 hover:bg-orange-50"
              >
                <ClipboardCheck size={18} />
                <span className="text-[10px] font-black uppercase tracking-widest">
                  Verifikasi
                </span>
                {pendingProducts.length > 0 && (
                  <span className="bg-orange-500 text-white text-[8px] px-1.5 py-0.5 rounded-full animate-bounce">
                    {pendingProducts.length}
                  </span>
                )}
              </button>

              <div className="w-[1px] h-8 bg-slate-100 mx-2 self-center"></div>

              <QuickActionBtn
                active={activeTab === "orders"}
                icon={<ShoppingBag size={18} />}
                label="Orders"
                onClick={() => setActiveTab("orders")}
              />
              <QuickActionBtn
                active={activeTab === "radar"}
                icon={<Radio size={18} />}
                label="Radar"
                onClick={() => setActiveTab("radar")}
              />
              <QuickActionBtn
                active={activeTab === "broadcast"}
                icon={<Megaphone size={18} />}
                label="Siaran"
                onClick={() => setActiveTab("broadcast")}
              />
              <QuickActionBtn
                active={activeTab === "ratings"}
                icon={<Star size={18} />}
                label="Rating"
                onClick={() => setActiveTab("ratings")}
              />
              <QuickActionBtn
                active={activeTab === "resolution"}
                icon={<AlertCircle size={18} />}
                label="Bantuan"
                onClick={() => setActiveTab("resolution")}
                color="hover:text-red-500"
              />
            </div>
          </div>

          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
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
            {activeTab === "products" && (
              <LocalProductsTab
                products={pendingProducts}
                onAction={() => {
                  fetchData();
                  stopAlarm();
                }}
              />
            )}
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

            {activeTab === "couriers" && <LocalCourierMonitor />}

            {(activeTab === "merchants" || activeTab === "customers") && (
              <LocalUsersTab
                type={activeTab}
                data={activeTab === "merchants" ? myMerchants : myCustomers}
                onViewDetail={(u) => setDetailModal({ isOpen: true, user: u })}
                onRefresh={fetchData}
              />
            )}

            {isAlarmActive && (
              <div className="mt-10 p-16 bg-white rounded-[3rem] border border-red-100 shadow-2xl text-center">
                <AlertTriangle
                  size={60}
                  className="mx-auto text-red-500 mb-6 animate-bounce"
                />
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic">
                  Ada Produk Menunggu!
                </h3>
                <button
                  onClick={() => {
                    stopAlarm();
                    navigate("/admin-wilayah/verifikasi-produk");
                  }}
                  className="mt-8 px-10 py-4 bg-red-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-red-700 transition-all"
                >
                  Buka Halaman Verifikasi
                </button>
              </div>
            )}
          </div>
        </main>
      </div>

      <PartnerDetailModal
        user={detailModal.user}
        onClose={() => setDetailModal({ isOpen: false, user: null })}
        onApprove={() => fetchData()}
        onDeactivate={() => fetchData()}
        onActivate={() => fetchData()}
      />
    </div>
  );
};

const QuickActionBtn = ({
  active,
  icon,
  label,
  onClick,
  color = "hover:text-teal-600",
}: any) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-5 py-2.5 rounded-[1.5rem] transition-all group shrink-0 ${active ? "bg-slate-900 text-white shadow-lg shadow-slate-900/20" : `text-slate-400 ${color}`}`}
  >
    {icon}{" "}
    <span
      className={`text-[10px] font-black uppercase tracking-widest ${active ? "block" : "hidden group-hover:block"}`}
    >
      {label}
    </span>
  </button>
);
