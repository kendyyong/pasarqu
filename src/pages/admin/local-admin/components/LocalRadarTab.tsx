import React, { useState, useEffect, useRef } from "react";
import {
  GoogleMap,
  MarkerF,
  InfoWindowF,
  CircleF,
} from "@react-google-maps/api";
import { supabase } from "../../../../lib/supabaseClient";
import {
  Store,
  Bike,
  User,
  Loader2,
  Info,
  ShieldCheck,
  Radio,
  MapPin,
} from "lucide-react";

interface Props {
  myMarket: any;
  merchants: any[];
  couriers: any[];
  customers: any[];
  isLoaded: boolean;
}

export const LocalRadarTab: React.FC<Props> = ({
  myMarket,
  merchants,
  couriers: initialCouriers,
  customers,
  isLoaded,
}) => {
  const [selectedPin, setSelectedPin] = useState<any>(null);
  const [liveCouriers, setLiveCouriers] = useState<any[]>(initialCouriers);
  const mapRef = useRef<google.maps.Map | null>(null);

  const [mapCenter, setMapCenter] = useState({ lat: -6.2, lng: 106.816666 });
  const [currentZoom, setCurrentZoom] = useState(15);

  // ✅ STATE BARU: Untuk menyimpan radius dari Super Admin
  const [maxDistanceKm, setMaxDistanceKm] = useState<number>(1);

  // 1. TARIK KONFIGURASI RADIUS DARI DATABASE SUPER ADMIN
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

  // 2. SET PUSAT PASAR
  useEffect(() => {
    if (myMarket) {
      const lat = parseFloat(myMarket.lat || myMarket.latitude || "0");
      const lng = parseFloat(myMarket.lng || myMarket.longitude || "0");

      if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
        const newCenter = { lat, lng };
        setMapCenter(newCenter);

        if (mapRef.current) {
          mapRef.current.panTo(newCenter);
          mapRef.current.setZoom(14); // Zoom sedikit dijauhkan agar lingkaran terlihat
          setCurrentZoom(14);
        }
      }
    }
  }, [myMarket]);

  // 3. TRACKING KURIR REALTIME
  useEffect(() => {
    if (!myMarket?.id) return;
    setLiveCouriers(initialCouriers);
    const channel = supabase
      .channel("local_radar_tracking")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `role=eq.COURIER`,
        },
        (payload) => {
          setLiveCouriers((prev) =>
            prev.map((c) =>
              c.id === payload.new.id
                ? {
                    ...c,
                    latitude: payload.new.latitude,
                    longitude: payload.new.longitude,
                  }
                : c,
            ),
          );
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [myMarket?.id, initialCouriers]);

  const mapContainerStyle = { width: "100%", height: "450px" };

  const options = {
    disableDefaultUI: false,
    zoomControl: true,
    mapTypeControl: false,
    streetViewControl: false,
    gestureHandling: "greedy",
    styles: [
      { featureType: "poi", stylers: [{ visibility: "off" }] },
      { featureType: "transit", stylers: [{ visibility: "off" }] },
    ],
  };

  if (!isLoaded || !window.google) {
    return (
      <div className="h-[450px] flex flex-col items-center justify-center bg-slate-50 rounded-2xl border border-slate-200 shadow-sm uppercase font-black tracking-widest text-[12px]">
        <Loader2 className="animate-spin text-[#008080] mb-4" size={48} />
        SINKRONISASI NODE...
      </div>
    );
  }

  const makeSvgIcon = (svgPath: string, color: string, baseSize: number) => {
    const scaleFactor = currentZoom / 15;
    const dynamicSize = Math.min(
      baseSize * 1.5,
      Math.max(12, baseSize * scaleFactor),
    );

    const svgString = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${dynamicSize}" height="${dynamicSize}"><path fill="${color}" stroke="#ffffff" stroke-width="1" d="${svgPath}"/></svg>`;
    return {
      url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svgString)}`,
      scaledSize: new window.google.maps.Size(dynamicSize, dynamicSize),
      anchor: new window.google.maps.Point(dynamicSize / 2, dynamicSize / 2),
    };
  };

  const pathOffice =
    "M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z";
  const pathStore =
    "M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z";
  const pathBike =
    "M19.44 7H17c-.52 0-.98.33-1.15.82l-1.01 2.94C13.25 10.28 11.23 10 9 10c-3.11 0-5.83 1.59-7.39 4h3.55c.42-1.15 1.52-2 2.84-2 1.66 0 3 1.34 3 3s-1.34 3-3 3c-1.32 0-2.42-.85-2.84-2H1V17h1c0 2.21 1.79 4 4 4s4-1.79 4-4c0-.18-.02-.35-.06-.52 1.56.33 3.19.52 4.93.52 2.07 0 3.9-.27 5.48-.78l.65 1.91c.17.49.63.82 1.15.82h1.85c.55 0 1-.45 1-1v-2l-4-9zm-1.94 2L20 13h-4.3l.83-2.43c.12-.34.43-.57.79-.57h.18z";
  const pathUser =
    "M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z";

  const iconOffice = makeSvgIcon(pathOffice, "#FF6600", 42);
  const iconStore = makeSvgIcon(pathStore, "#22c55e", 32);
  const iconBike = makeSvgIcon(pathBike, "#3b82f6", 36);
  const iconUser = makeSvgIcon(pathUser, "#eab308", 28);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 text-left font-sans pb-20">
      {/* 🟢 TOP ANALYTICS PANEL */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard
          label="Mitra Toko"
          value={merchants.length}
          icon={<Store size={20} />}
          color="text-[#008080]"
          bg="bg-teal-50"
        />
        <StatCard
          label="Unit Kurir"
          value={liveCouriers.length}
          icon={<Bike size={20} />}
          color="text-orange-600"
          bg="bg-orange-50"
        />
        <StatCard
          label="Warga (Customer)"
          value={customers.length}
          icon={<User size={20} />}
          color="text-blue-600"
          bg="bg-blue-50"
        />
      </div>

      {/* 🔵 MAP AREA */}
      <div className="relative border border-slate-200 shadow-sm rounded-2xl overflow-hidden bg-slate-50">
        {/* BADGE INFO KIRI ATAS */}
        <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 pointer-events-none">
          <div className="bg-[#008080]/90 backdrop-blur-sm text-white px-3 py-2 rounded-xl shadow-lg flex items-center gap-2 border border-teal-700/50">
            <ShieldCheck size={16} />{" "}
            <span className="text-[10px] font-black uppercase tracking-widest">
              Encrypted Radar
            </span>
          </div>
          <div className="bg-slate-900/90 backdrop-blur-sm text-white px-3 py-2 rounded-xl shadow-lg flex items-center gap-2 border border-slate-700/50">
            <Radio size={16} className="animate-pulse text-orange-500" />
            <span className="text-[10px] font-black uppercase tracking-widest">
              Node: {myMarket?.name || "LOKAL"}
            </span>
          </div>
        </div>

        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          zoom={currentZoom}
          center={mapCenter}
          options={options}
          onLoad={(map) => {
            mapRef.current = map;
          }}
          onZoomChanged={() => {
            if (mapRef.current) {
              const newZoom = mapRef.current.getZoom();
              if (newZoom && newZoom !== currentZoom) setCurrentZoom(newZoom);
            }
          }}
        >
          {/* ✅ LINGKARAN RADIUS OPERASIONAL PASAR */}
          {myMarket && (
            <CircleF
              center={mapCenter}
              radius={maxDistanceKm * 1000} // Convert KM ke Meter
              options={{
                fillColor: "#008080",
                fillOpacity: 0.1,
                strokeColor: "#008080",
                strokeWeight: 1,
                clickable: false, // Supaya pin di dalam lingkaran tetap bisa diklik
              }}
            />
          )}

          {/* 📍 PIN PASAR NODE */}
          <MarkerF
            position={mapCenter}
            icon={iconOffice}
            onClick={() => setSelectedPin({ ...myMarket, type: "PASAR UTAMA" })}
          />

          {/* 📍 PIN MITRA TOKO */}
          {merchants.map((m) => {
            const lat = parseFloat(m.lat || m.latitude || "0");
            const lng = parseFloat(m.lng || m.longitude || "0");
            if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) return null;
            return (
              <MarkerF
                key={m.id}
                position={{ lat, lng }}
                icon={iconStore}
                onClick={() => setSelectedPin({ ...m, type: "MITRA TOKO" })}
              />
            );
          })}

          {/* 📍 PIN KURIR LIVE */}
          {liveCouriers.map((c) => {
            const lat = parseFloat(c.lat || c.latitude || "0");
            const lng = parseFloat(c.lng || c.longitude || "0");
            if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) return null;
            return (
              <MarkerF
                key={c.id}
                position={{ lat, lng }}
                icon={iconBike}
                onClick={() => setSelectedPin({ ...c, type: "MITRA KURIR" })}
              />
            );
          })}

          {/* 📍 PIN PELANGGAN */}
          {customers.map((u) => {
            const lat = parseFloat(u.lat || u.latitude || "0");
            const lng = parseFloat(u.lng || u.longitude || "0");
            if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) return null;
            return (
              <MarkerF
                key={u.id}
                position={{ lat, lng }}
                icon={iconUser}
                onClick={() => setSelectedPin({ ...u, type: "PELANGGAN" })}
              />
            );
          })}

          {/* 💬 INFO WINDOW */}
          {selectedPin && (
            <InfoWindowF
              position={{
                lat: parseFloat(
                  selectedPin.lat || selectedPin.latitude || mapCenter.lat,
                ),
                lng: parseFloat(
                  selectedPin.lng || selectedPin.longitude || mapCenter.lng,
                ),
              }}
              onCloseClick={() => setSelectedPin(null)}
            >
              <div className="p-3 min-w-[200px] text-left font-sans">
                <p className="text-[10px] font-bold text-[#008080] uppercase tracking-widest mb-1.5">
                  {selectedPin.type}
                </p>
                <h4 className="text-[14px] font-black text-slate-800 leading-tight uppercase">
                  {selectedPin.shop_name ||
                    selectedPin.full_name ||
                    selectedPin.name}
                </h4>
              </div>
            </InfoWindowF>
          )}
        </GoogleMap>
      </div>

      {/* 🟠 LEGEND PETA */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
        <LegendCard color="bg-orange-500" label="Pusat Kontrol" />
        <LegendCard color="bg-green-500" label="Mitra Toko" />
        <LegendCard color="bg-blue-500" label="Unit Kurir" />
        <LegendCard color="bg-yellow-500" label="Warga" />
      </div>

      {/* ⚙️ DEBUG & SECURITY FOOTER */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 mt-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-50 text-orange-500 rounded-xl flex items-center justify-center shrink-0">
            <Info size={20} />
          </div>
          <div>
            <h4 className="text-[12px] font-bold text-slate-800 uppercase tracking-tight">
              Koneksi Radar
            </h4>
            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest mt-0.5">
              Zona Aman:{" "}
              <span className="text-[#008080] font-bold">
                Maks {maxDistanceKm} KM
              </span>
            </p>
          </div>
        </div>

        <div className="bg-slate-50 p-3 rounded-xl flex items-center gap-2 border border-slate-100">
          <MapPin size={16} className="text-orange-500" />
          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
            GPS:{" "}
            <span className="text-[#008080]">
              {mapCenter.lat.toFixed(5)}, {mapCenter.lng.toFixed(5)}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
};

// HELPER COMPONENTS
const StatCard = ({ label, value, icon, color, bg }: any) => {
  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center gap-4 hover:shadow-md transition-all group">
      <div
        className={`w-12 h-12 ${bg} ${color} rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
          {label}
        </p>
        <p className="text-2xl font-black text-slate-800 tracking-tighter leading-none">
          {value}
        </p>
      </div>
    </div>
  );
};

const LegendCard = ({ color, label }: { color: string; label: string }) => (
  <div className="bg-white px-4 py-3 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
    <div className={`w-4 h-4 rounded-md ${color} shadow-sm`}></div>
    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-widest">
      {label}
    </span>
  </div>
);
