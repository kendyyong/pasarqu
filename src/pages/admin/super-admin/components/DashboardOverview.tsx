import React, { useState, useEffect } from "react";
import { GoogleMap, Marker, InfoWindow } from "@react-google-maps/api";
import {
  SearchCode,
  ShoppingBag,
  Clock,
  MapPin,
  User,
  TrendingUp,
  Loader2,
  RefreshCcw,
  Activity,
  Layers,
} from "lucide-react";
import { supabase } from "../../../../lib/supabaseClient";
import { useToast } from "../../../../contexts/ToastContext";

// --- CONFIG ---
const mapContainerStyle = {
  width: "100%",
  height: "100%",
  borderRadius: "0.375rem",
};
const centerDefault = { lat: -0.7893, lng: 113.9213 };

const formatRupiah = (num: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(num);
};

interface Props {
  isLoaded: boolean;
  markets: any[];
  darkMode?: boolean;
  theme?: any;
  setAuditMarket: (market: any) => void;
}

export const DashboardOverview: React.FC<Props> = ({
  isLoaded,
  markets,
  setAuditMarket,
}) => {
  const { showToast } = useToast();
  const [selectedMarker, setSelectedMarker] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [stats, setStats] = useState({
    revenue: 0,
    total_orders: 0,
    active_users: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchLiveData = async () => {
    setLoading(true);
    try {
      const { data: orders } = await supabase
        .from("orders")
        .select("*, profiles(name)")
        .order("created_at", { ascending: false })
        .limit(8);

      if (orders) setRecentOrders(orders);

      const { count: orderCount } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true });
      const { count: userCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      setStats({
        revenue: 150000000,
        total_orders: orderCount || 0,
        active_users: userCount || 0,
      });
    } catch (err) {
      showToast("GAGAL SYNC DATA", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveData();
    const interval = setInterval(fetchLiveData, 45000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-4 md:space-y-6 animate-in fade-in duration-700 font-black uppercase tracking-tighter text-left pb-10">
      {/* 1. TOP STATS - HYBRID GRID (2 Cols on Mobile, 3 Cols on Desktop) */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
        <StatCard
          title="TOTAL OMSET"
          value={formatRupiah(stats.revenue)}
          icon={<TrendingUp size={20} />}
          border="border-teal-600"
        />
        <StatCard
          title="TRANSAKSI"
          value={stats.total_orders.toLocaleString()}
          icon={<ShoppingBag size={20} />}
          border="border-orange-600"
        />
        <div className="col-span-2 md:col-span-1">
          <StatCard
            title="USER AKTIF"
            value={stats.active_users.toLocaleString()}
            icon={<User size={20} />}
            border="border-slate-900"
          />
        </div>
      </div>

      {/* 2. MAIN MONITORING - HYBRID LAYOUT (Stacking on Mobile) */}
      <div className="flex flex-col lg:grid lg:grid-cols-12 gap-4 md:gap-6">
        {/* LEFT: PETA GIS (Full width on Mobile, 8 Cols on Desktop) */}
        <div className="lg:col-span-8 bg-white p-2 md:p-3 rounded-md border border-slate-200 shadow-sm relative flex flex-col h-[350px] md:h-[500px] lg:h-[650px]">
          <div className="absolute top-4 left-4 z-10 hidden md:flex items-center gap-2 bg-slate-900 text-white px-3 py-1.5 rounded-md shadow-xl border-b-2 border-teal-500">
            <Layers size={14} className="text-teal-400" />
            <span className="text-[9px] tracking-widest">LIVE GIS MONITOR</span>
          </div>

          <div className="flex-1 rounded-md overflow-hidden bg-slate-100 relative border border-slate-100">
            {isLoaded ? (
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={centerDefault}
                zoom={5}
                options={{
                  disableDefaultUI: true,
                  zoomControl: true,
                  gestureHandling: "greedy",
                }}
              >
                {markets?.map((m) => (
                  <Marker
                    key={m.id}
                    position={{
                      lat: parseFloat(m.lat),
                      lng: parseFloat(m.lng),
                    }}
                    onClick={() => setSelectedMarker(m)}
                  />
                ))}
                {selectedMarker && (
                  <InfoWindow
                    position={{
                      lat: parseFloat(selectedMarker.lat),
                      lng: parseFloat(selectedMarker.lng),
                    }}
                    onCloseClick={() => setSelectedMarker(null)}
                  >
                    <div className="p-1 min-w-[120px] font-black uppercase text-left">
                      <p className="text-[10px] mb-2 text-slate-900 border-b pb-1">
                        {selectedMarker.name}
                      </p>
                      <button
                        onClick={() => setAuditMarket(selectedMarker)}
                        className="w-full py-1.5 bg-slate-900 text-white text-[9px] rounded flex items-center justify-center gap-1"
                      >
                        <SearchCode size={12} /> AUDIT
                      </button>
                    </div>
                  </InfoWindow>
                )}
              </GoogleMap>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-[10px]">
                MENYAMBUNGKAN SATELIT...
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: LIVE FEED (Full width on Mobile, 4 Cols on Desktop) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="bg-slate-900 rounded-md shadow-xl flex flex-col h-[450px] lg:h-[650px] overflow-hidden border-b-8 border-teal-600">
            <div className="p-4 flex items-center justify-between border-b border-white/10">
              <div className="flex items-center gap-2">
                <RefreshCcw
                  size={14}
                  className={`text-teal-400 ${loading ? "animate-spin" : ""}`}
                />
                <h3 className="text-[11px] text-white tracking-widest">
                  LIVE ORDERS
                </h3>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-ping"></div>
                <span className="text-[8px] text-white/50">REALTIME</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="p-3 bg-white/5 border border-white/5 rounded-md flex items-center gap-3 hover:bg-white/10 transition-all group"
                >
                  <div
                    className={`w-9 h-9 rounded flex items-center justify-center text-white shrink-0 ${order.status === "COMPLETED" ? "bg-teal-600" : "bg-[#FF6600]"}`}
                  >
                    <ShoppingBag size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <span className="text-[12px] text-white font-black">
                        {formatRupiah(order.total_price)}
                      </span>
                      <span className="text-[8px] text-white/30">
                        {new Date(order.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="text-[9px] text-teal-400 truncate mt-0.5">
                      {order.profiles?.name || "PELANGGAN"}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <button className="m-4 p-3 bg-white/10 text-white rounded text-[9px] font-black hover:bg-white/20 transition-all">
              TAMPILKAN SEMUA LOG
            </button>
          </div>
        </div>
      </div>

      {/* 3. MOBILE NOTICE - Only visible on small screens */}
      <div className="lg:hidden bg-orange-50 p-4 rounded-md border border-orange-100 flex items-center gap-3">
        <Activity size={18} className="text-[#FF6600]" />
        <p className="text-[9px] text-[#FF6600] font-black leading-tight">
          MODE MOBILE AKTIF: GESTUR DUA JARI UNTUK NAVIGASI PETA.
        </p>
      </div>
    </div>
  );
};

// --- SUB-COMPONENT STAT CARD ---
const StatCard = ({ title, value, icon, border }: any) => (
  <div
    className={`bg-white p-4 md:p-6 rounded-md border border-slate-200 shadow-sm flex items-center justify-between border-b-4 ${border} hover:shadow-md transition-all`}
  >
    <div className="min-w-0">
      <p className="text-[8px] md:text-[10px] text-slate-400 mb-1 tracking-widest">
        {title}
      </p>
      <h3 className="text-sm md:text-xl text-slate-900 truncate">{value}</h3>
    </div>
    <div className="w-9 h-9 md:w-12 md:h-12 bg-slate-50 text-slate-400 rounded-md flex items-center justify-center shrink-0 ml-2">
      {icon}
    </div>
  </div>
);
