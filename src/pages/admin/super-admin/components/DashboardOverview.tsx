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
} from "lucide-react";
import { supabase } from "../../../../lib/supabaseClient";

// --- KONFIGURASI PETA ---
const mapContainerStyle = {
  width: "100%",
  height: "100%",
  borderRadius: "0.75rem",
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
  darkMode: boolean;
  theme: any;
  setAuditMarket: (market: any) => void;
}

export const DashboardOverview: React.FC<Props> = ({
  isLoaded,
  markets,
  setAuditMarket,
}) => {
  const [selectedMarker, setSelectedMarker] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [stats, setStats] = useState({
    revenue: 0,
    total_orders: 0,
    active_users: 0,
  });
  const [loading, setLoading] = useState(true);

  const mapOptions = {
    disableDefaultUI: false,
    zoomControl: true,
    gestureHandling: "greedy",
    styles: [
      { featureType: "poi", stylers: [{ visibility: "off" }] },
      { featureType: "transit", stylers: [{ visibility: "off" }] },
    ],
  };

  const fetchLiveData = async () => {
    setLoading(true);
    try {
      const { data: orders } = await supabase
        .from("orders")
        .select("*, profiles(name)")
        .order("created_at", { ascending: false })
        .limit(10);

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
      console.error("Gagal memuat live data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveData();
    const interval = setInterval(fetchLiveData, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-3 md:space-y-6 animate-in fade-in pb-10 font-black uppercase tracking-tighter">
      {/* 1. KARTU STATISTIK (GARIS TEPI & BORDER-B DIHAPUS) */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-6">
        <div className="bg-white p-3 md:p-6 rounded-xl md:rounded-[1.5rem] shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between">
          <div className="order-2 md:order-1">
            <p className="text-[8px] md:text-[10px] text-slate-400 mb-0.5 md:mb-1">
              TOTAL OMSET
            </p>
            <h3 className="text-sm md:text-2xl text-slate-800 italic leading-none">
              {formatRupiah(stats.revenue)}
            </h3>
          </div>
          <div className="w-8 h-8 md:w-12 md:h-12 bg-teal-50 text-[#008080] rounded-lg md:rounded-2xl flex items-center justify-center order-1 md:order-2 mb-2 md:mb-0">
            <TrendingUp size={16} className="md:w-6 md:h-6" />
          </div>
        </div>

        <div className="bg-white p-3 md:p-6 rounded-xl md:rounded-[1.5rem] shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between">
          <div className="order-2 md:order-1">
            <p className="text-[8px] md:text-[10px] text-slate-400 mb-0.5 md:mb-1">
              TOTAL TRANSAKSI
            </p>
            <h3 className="text-sm md:text-2xl text-slate-800 italic leading-none">
              {stats.total_orders}
            </h3>
          </div>
          <div className="w-8 h-8 md:w-12 md:h-12 bg-orange-50 text-[#FF6600] rounded-lg md:rounded-2xl flex items-center justify-center order-1 md:order-2 mb-2 md:mb-0">
            <ShoppingBag size={16} className="md:w-6 md:h-6" />
          </div>
        </div>

        <div className="col-span-2 md:col-span-1 bg-white p-3 md:p-6 rounded-xl md:rounded-[1.5rem] shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[8px] md:text-[10px] text-slate-400 mb-0.5 md:mb-1">
              USER TERDAFTAR
            </p>
            <h3 className="text-sm md:text-2xl text-slate-800 italic leading-none">
              {stats.active_users}
            </h3>
          </div>
          <div className="w-8 h-8 md:w-12 md:h-12 bg-slate-50 text-slate-800 rounded-lg md:rounded-2xl flex items-center justify-center">
            <User size={16} className="md:w-6 md:h-6" />
          </div>
        </div>
      </div>

      {/* 2. AREA PETA & LIVE FEED (GARIS TEPI DIHAPUS) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-6 lg:h-[600px]">
        {/* PETA */}
        <div className="lg:col-span-2 bg-white p-2 md:p-4 rounded-xl md:rounded-[2rem] shadow-sm relative overflow-hidden flex flex-col h-[350px] lg:h-full">
          <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-sm border border-slate-50">
            <h4 className="text-[8px] md:text-[10px] text-slate-800 flex items-center gap-2">
              <MapPin size={12} className="text-[#FF6600]" /> MONITORING
              REAL-TIME
            </h4>
          </div>

          <div className="flex-1 rounded-lg md:rounded-[1.5rem] overflow-hidden bg-slate-100 relative">
            {isLoaded ? (
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={centerDefault}
                zoom={5}
                options={mapOptions}
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
                      <h3 className="text-[10px] mb-2 text-slate-800 leading-tight">
                        {selectedMarker.name}
                      </h3>
                      <button
                        onClick={() => setAuditMarket(selectedMarker)}
                        className="w-full py-1.5 bg-[#008080] text-white text-[9px] rounded flex items-center justify-center gap-1"
                      >
                        <SearchCode size={10} /> Audit
                      </button>
                    </div>
                  </InfoWindow>
                )}
              </GoogleMap>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                <Loader2 className="animate-spin mr-2" /> Menghubungkan...
              </div>
            )}
          </div>
        </div>

        {/* FEED TRANSAKSI */}
        <div className="bg-white p-3 md:p-6 rounded-xl md:rounded-[2rem] shadow-sm flex flex-col h-[400px] lg:h-full overflow-hidden">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <h3 className="text-[10px] md:text-[12px] text-slate-800 flex items-center gap-2 leading-none">
              <RefreshCcw
                size={12}
                className={
                  loading ? "animate-spin text-[#008080]" : "text-slate-400"
                }
              />
              LIVE TRANSAKSI
            </h3>
            <span className="w-1.5 h-1.5 md:w-2 md:h-2 bg-green-500 rounded-full animate-ping"></span>
          </div>

          <div className="flex-1 overflow-y-auto pr-1 space-y-2 md:space-y-4 no-scrollbar">
            {recentOrders.length === 0 ? (
              <div className="text-center py-10 text-slate-300">
                <p className="text-[10px]">MENUNGGU...</p>
              </div>
            ) : (
              recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-all group"
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0 ${order.status === "COMPLETED" ? "bg-green-500" : "bg-orange-500"}`}
                  >
                    <ShoppingBag size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start leading-none">
                      <h4 className="text-[11px] md:text-[12px] text-slate-800 font-black font-sans">
                        {formatRupiah(order.total_price || 0)}
                      </h4>
                      <span className="text-[8px] text-slate-400 flex items-center gap-0.5">
                        <Clock size={8} />{" "}
                        {new Date(order.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="text-[9px] text-slate-500 mt-1 truncate uppercase">
                      {order.profiles?.name || "GUEST"}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
