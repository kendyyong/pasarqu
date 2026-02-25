import React, { useState, useEffect, useRef } from "react";
import {
  GoogleMap,
  MarkerF,
  InfoWindowF,
  CircleF,
} from "@react-google-maps/api";
import {
  SearchCode,
  ShoppingBag,
  MapPin,
  User,
  TrendingUp,
  Loader2,
  RefreshCcw,
  Activity,
  Layers,
  Store,
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

const pathOffice =
  "M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z";

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
  const [marketAdmin, setMarketAdmin] = useState<any>(null);

  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [stats, setStats] = useState({
    revenue: 0,
    total_orders: 0,
    active_users: 0,
  });
  const [loading, setLoading] = useState(true);

  const mapRef = useRef<google.maps.Map | null>(null);
  const [currentZoom, setCurrentZoom] = useState(5);
  const [maxDistanceKm, setMaxDistanceKm] = useState<number>(1);

  useEffect(() => {
    const fetchConfig = async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("max_distance_km")
        .eq("id", 1)
        .maybeSingle();

      if (data && data.max_distance_km) {
        setMaxDistanceKm(data.max_distance_km);
      }
    };
    fetchConfig();
  }, []);

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

  useEffect(() => {
    if (selectedMarker) {
      const fetchAdminProfile = async () => {
        setMarketAdmin(null);
        const { data } = await supabase
          .from("profiles")
          .select("name, phone_number")
          .eq("managed_market_id", selectedMarker.id)
          .limit(1)
          .maybeSingle();

        if (data) setMarketAdmin(data);
      };
      fetchAdminProfile();
    }
  }, [selectedMarker]);

  const makeSvgIcon = (svgPath: string, color: string, baseSize: number) => {
    if (!window.google) return undefined;
    const scaleFactor = currentZoom / 5;
    const dynamicSize = Math.min(
      baseSize * 3,
      Math.max(14, baseSize * scaleFactor),
    );

    const svgString = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${dynamicSize}" height="${dynamicSize}"><path fill="${color}" stroke="#ffffff" stroke-width="1" d="${svgPath}"/></svg>`;
    return {
      url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svgString)}`,
      scaledSize: new window.google.maps.Size(dynamicSize, dynamicSize),
      anchor: new window.google.maps.Point(dynamicSize / 2, dynamicSize / 2),
    };
  };

  const iconOffice = makeSvgIcon(pathOffice, "#FF6600", 22);

  return (
    <div className="space-y-4 md:space-y-6 animate-in fade-in duration-700 font-black uppercase tracking-tighter text-left pb-10">
      {/* 1. TOP STATS (BERSIH TOTAL) */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
        <StatCard
          title="TOTAL OMSET"
          value={formatRupiah(stats.revenue)}
          icon={<TrendingUp size={20} />}
          color="text-teal-600"
        />
        <StatCard
          title="TRANSAKSI"
          value={stats.total_orders.toLocaleString()}
          icon={<ShoppingBag size={20} />}
          color="text-orange-600"
        />
        <div className="col-span-2 md:col-span-1">
          <StatCard
            title="USER AKTIF"
            value={stats.active_users.toLocaleString()}
            icon={<User size={20} />}
            color="text-slate-900"
          />
        </div>
      </div>

      {/* 2. MAIN MONITORING */}
      <div className="flex flex-col lg:grid lg:grid-cols-12 gap-4 md:gap-6">
        {/* LEFT: PETA GIS */}
        <div className="lg:col-span-8 bg-white p-2 md:p-3 rounded-md border border-slate-200 relative flex flex-col h-[350px] md:h-[500px] lg:h-[650px]">
          <div className="absolute top-4 left-4 z-10 hidden md:flex items-center gap-2 bg-slate-900 text-white px-3 py-1.5 rounded-md border border-teal-500">
            <Layers size={14} className="text-teal-400" />
            <span className="text-[9px] tracking-widest">
              LIVE GIS MONITOR | ZONA: {maxDistanceKm}KM
            </span>
          </div>

          <div className="flex-1 rounded-md overflow-hidden bg-slate-100 relative border border-slate-100">
            {isLoaded ? (
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={centerDefault}
                zoom={currentZoom}
                options={{
                  disableDefaultUI: true,
                  zoomControl: true,
                  gestureHandling: "greedy",
                }}
                onLoad={(map) => {
                  mapRef.current = map;
                }}
                onZoomChanged={() => {
                  if (mapRef.current) {
                    const newZoom = mapRef.current.getZoom();
                    if (newZoom && newZoom !== currentZoom)
                      setCurrentZoom(newZoom);
                  }
                }}
              >
                {markets?.map((m) => {
                  const lat = parseFloat(m.lat || m.latitude || "0");
                  const lng = parseFloat(m.lng || m.longitude || "0");
                  if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0)
                    return null;
                  const position = { lat, lng };

                  return (
                    <React.Fragment key={`group-${m.id}`}>
                      <CircleF
                        center={position}
                        radius={maxDistanceKm * 1000}
                        options={{
                          fillColor: "#FF6600",
                          fillOpacity: 0.05,
                          strokeColor: "#FF6600",
                          strokeWeight: 1.5,
                          clickable: false,
                        }}
                      />
                      <MarkerF
                        position={position}
                        icon={iconOffice}
                        onClick={() => setSelectedMarker(m)}
                      />
                    </React.Fragment>
                  );
                })}

                {selectedMarker && (
                  <InfoWindowF
                    position={{
                      lat: parseFloat(
                        selectedMarker.lat || selectedMarker.latitude,
                      ),
                      lng: parseFloat(
                        selectedMarker.lng || selectedMarker.longitude,
                      ),
                    }}
                    onCloseClick={() => setSelectedMarker(null)}
                  >
                    <div className="p-2 min-w-[220px] font-sans uppercase text-left">
                      <div className="flex items-center gap-3 border-b border-slate-200 pb-3 mb-3">
                        <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-md flex items-center justify-center shrink-0 border border-orange-100">
                          <Store size={20} />
                        </div>
                        <div>
                          <p className="text-[14px] font-black text-slate-900 leading-none tracking-tight">
                            {selectedMarker.name}
                          </p>
                          <p className="text-[8px] font-bold text-slate-400 tracking-widest mt-1">
                            NODE PUSAT KONTROL LOKAL
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-start gap-2 bg-slate-50 p-2 rounded border border-slate-100">
                          <User
                            size={14}
                            className="text-[#008080] mt-0.5 shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="text-[8px] font-bold text-slate-400 tracking-widest leading-none">
                              ADMIN PENGELOLA
                            </p>
                            <p className="text-[11px] font-black text-slate-800 tracking-tight mt-1 truncate">
                              {marketAdmin
                                ? marketAdmin.name
                                : "BELUM DI-ASSIGN"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-2 bg-slate-50 p-2 rounded border border-slate-100">
                          <MapPin
                            size={14}
                            className="text-orange-500 mt-0.5 shrink-0"
                          />
                          <div>
                            <p className="text-[8px] font-bold text-slate-400 tracking-widest leading-none">
                              ZONA AMAN (RADIUS)
                            </p>
                            <p className="text-[11px] font-black text-slate-800 tracking-tight mt-1">
                              MAKS {maxDistanceKm} KM
                            </p>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => setAuditMarket(selectedMarker)}
                        className="w-full py-2.5 bg-slate-900 text-white text-[10px] font-black tracking-widest rounded flex items-center justify-center gap-1.5 hover:bg-[#008080] transition-colors active:scale-95"
                      >
                        <SearchCode size={14} /> AUDIT SYSTEM NODE
                      </button>
                    </div>
                  </InfoWindowF>
                )}
              </GoogleMap>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-[10px]">
                MENYAMBUNGKAN SATELIT...
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: LIVE FEED */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="bg-slate-900 rounded-md flex flex-col h-[450px] lg:h-[650px] overflow-hidden border border-white/5">
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

            <button className="m-4 p-3 bg-white/10 text-white rounded text-[9px] font-black hover:bg-white/20 transition-all border border-white/10">
              TAMPILKAN SEMUA LOG
            </button>
          </div>
        </div>
      </div>

      {/* 3. MOBILE NOTICE */}
      <div className="lg:hidden bg-orange-50 p-4 rounded-md border border-orange-100 flex items-center gap-3">
        <Activity size={18} className="text-[#FF6600]" />
        <p className="text-[9px] text-[#FF6600] font-black leading-tight">
          MODE MOBILE AKTIF: GESTUR DUA JARI UNTUK NAVIGASI PETA.
        </p>
      </div>
    </div>
  );
};

// --- SUB-COMPONENT STAT CARD (FIXED) ---
const StatCard = ({ title, value, icon, color }: any) => (
  <div
    className={`bg-white p-4 md:p-6 rounded-md border border-slate-200 flex items-center justify-between transition-all`}
  >
    <div className="min-w-0">
      <p className="text-[8px] md:text-[10px] text-slate-400 mb-1 tracking-widest">
        {title}
      </p>
      {/* Warna teks menyesuaikan kategori */}
      <h3 className={`text-sm md:text-xl font-black ${color} truncate`}>
        {value}
      </h3>
    </div>
    <div className="w-9 h-9 md:w-12 md:h-12 bg-slate-50 text-slate-400 rounded-md flex items-center justify-center shrink-0 ml-2 border border-slate-100">
      {icon}
    </div>
  </div>
);
