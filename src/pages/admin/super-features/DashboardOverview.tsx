import React, { useState, useEffect } from "react";
import { GoogleMap, Marker, InfoWindow } from "@react-google-maps/api";
import {
  SearchCode,
  ShoppingBag,
  Clock,
  ArrowUpRight,
  MapPin,
  User,
  TrendingUp,
  Loader2,
  RefreshCcw,
} from "lucide-react";
import { supabase } from "../../../lib/supabaseClient";

// --- KONFIGURASI PETA ---
const mapContainerStyle = {
  width: "100%",
  height: "100%",
  borderRadius: "1.5rem",
};
const centerDefault = { lat: -0.7893, lng: 113.9213 }; // Tengah Indonesia
const mapOptions = {
  disableDefaultUI: true,
  zoomControl: true,
  styles: [
    { featureType: "poi", stylers: [{ visibility: "off" }] }, // Hilangkan POI Google
    { featureType: "transit", stylers: [{ visibility: "off" }] },
  ],
};

// --- HELPER RUPIAH ---
const formatRupiah = (num: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(num);
};

// --- KOMPONEN UTAMA ---
interface Props {
  isLoaded: boolean;
  markets: any[];
  darkMode: boolean; // Kita abaikan karena sekarang pakai Shopee Style (Light)
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

  // 1. Fetch Data Live
  const fetchLiveData = async () => {
    setLoading(true);
    try {
      // A. Ambil 10 Order Terakhir
      const { data: orders } = await supabase
        .from("orders")
        .select("*, profiles(name)") // Pastikan relasi profiles ada
        .order("created_at", { ascending: false })
        .limit(10);

      if (orders) setRecentOrders(orders);

      // B. Ambil Statistik Ringkas (Bisa diganti RPC untuk performa)
      // Ini contoh fetch manual sederhana
      const { count: orderCount } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true });
      const { count: userCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      // Simulasi Revenue (Idealnya pakai RPC sum)
      setStats({
        revenue: 150000000, // Placeholder angka cantik, ganti dengan real data jika sudah ada RPC
        total_orders: orderCount || 0,
        active_users: userCount || 0,
      });
    } catch (err) {
      console.error("Gagal memuat live data", err);
    } finally {
      setLoading(false);
    }
  };

  // Auto Refresh setiap 30 detik agar terasa "LIVE"
  useEffect(() => {
    fetchLiveData();
    const interval = setInterval(fetchLiveData, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in pb-20">
      {/* 1. KARTU STATISTIK ATAS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Revenue */}
        <div className="bg-white p-6 rounded-[1.5rem] shadow-sm border border-slate-100 flex items-center justify-between group hover:shadow-md transition-all">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
              Total Omset
            </p>
            <h3 className="text-2xl font-black text-slate-800">
              {formatRupiah(stats.revenue)}
            </h3>
            <span className="text-[10px] font-bold text-green-500 flex items-center gap-1 mt-1">
              <TrendingUp size={12} /> +12% dari kemarin
            </span>
          </div>
          <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center shadow-sm">
            <ArrowUpRight size={24} />
          </div>
        </div>

        {/* Card 2: Total Order */}
        <div className="bg-white p-6 rounded-[1.5rem] shadow-sm border border-slate-100 flex items-center justify-between group hover:shadow-md transition-all">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
              Total Transaksi
            </p>
            <h3 className="text-2xl font-black text-slate-800">
              {stats.total_orders}
            </h3>
            <span className="text-[10px] font-bold text-slate-400 mt-1">
              Order masuk sistem
            </span>
          </div>
          <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center shadow-sm">
            <ShoppingBag size={24} />
          </div>
        </div>

        {/* Card 3: Active Users */}
        <div className="bg-white p-6 rounded-[1.5rem] shadow-sm border border-slate-100 flex items-center justify-between group hover:shadow-md transition-all">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
              User Terdaftar
            </p>
            <h3 className="text-2xl font-black text-slate-800">
              {stats.active_users}
            </h3>
            <span className="text-[10px] font-bold text-blue-500 mt-1 flex items-center gap-1">
              <User size={12} /> Data Pengguna
            </span>
          </div>
          <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center shadow-sm">
            <User size={24} />
          </div>
        </div>
      </div>

      {/* 2. AREA UTAMA: PETA & LIVE FEED */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
        {/* A. PETA SEBARAN (2/3 Layar) */}
        <div className="lg:col-span-2 bg-white p-4 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col relative overflow-hidden">
          <div className="absolute top-6 left-6 z-10 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-xl shadow-sm border border-slate-100">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
              <MapPin size={14} className="text-red-500" /> Live Monitoring
            </h4>
          </div>

          <div className="flex-1 rounded-[1.5rem] overflow-hidden bg-slate-100 relative">
            {isLoaded ? (
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={centerDefault}
                zoom={5}
                options={mapOptions}
              >
                {markets.map((m) => (
                  <Marker
                    key={m.id}
                    position={{ lat: m.lat, lng: m.lng }}
                    onClick={() => setSelectedMarker(m)}
                  />
                ))}
                {selectedMarker && (
                  <InfoWindow
                    position={{
                      lat: selectedMarker.lat,
                      lng: selectedMarker.lng,
                    }}
                    onCloseClick={() => setSelectedMarker(null)}
                  >
                    <div className="p-2 min-w-[150px]">
                      <h3 className="font-black text-xs uppercase mb-2 text-slate-800">
                        {selectedMarker.name}
                      </h3>
                      <button
                        onClick={() => setAuditMarket(selectedMarker)}
                        className="w-full py-2 bg-slate-900 text-white text-[10px] font-bold uppercase rounded-lg hover:bg-teal-600 transition-colors flex items-center justify-center gap-1"
                      >
                        <SearchCode size={12} /> Audit
                      </button>
                    </div>
                  </InfoWindow>
                )}
              </GoogleMap>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 font-bold text-xs">
                Memuat Peta...
              </div>
            )}
          </div>
        </div>

        {/* B. LIVE TRANSACTION FEED (1/3 Layar) */}
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col h-full overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest flex items-center gap-2">
                <RefreshCcw
                  size={14}
                  className={
                    loading ? "animate-spin text-teal-600" : "text-slate-400"
                  }
                />
                Live Orders
              </h3>
              <p className="text-[10px] text-slate-400 font-bold mt-1">
                Transaksi Real-time
              </p>
            </div>
            <span className="w-2 h-2 bg-green-500 rounded-full animate-ping"></span>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 space-y-4 no-scrollbar">
            {recentOrders.length === 0 ? (
              <div className="text-center py-20 text-slate-300">
                <ShoppingBag size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-[10px] font-bold uppercase">
                  Belum ada order masuk
                </p>
              </div>
            ) : (
              recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-start gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-white hover:shadow-md transition-all group"
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm ${
                      order.status === "COMPLETED"
                        ? "bg-green-500"
                        : order.status === "CANCELLED"
                          ? "bg-red-500"
                          : "bg-orange-500"
                    }`}
                  >
                    <ShoppingBag size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h4 className="font-black text-xs text-slate-800 truncate pr-2">
                        {formatRupiah(order.total_price || 0)}
                      </h4>
                      <span className="text-[9px] font-bold text-slate-400 whitespace-nowrap flex items-center gap-1">
                        <Clock size={10} /> Baru saja
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1 truncate">
                      Oleh:{" "}
                      <span className="font-bold text-slate-700">
                        {order.profiles?.name || "User"}
                      </span>
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                          order.status === "PENDING"
                            ? "bg-yellow-100 text-yellow-700"
                            : order.status === "COMPLETED"
                              ? "bg-green-100 text-green-700"
                              : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>
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
