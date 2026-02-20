import React, { useState, useEffect, useRef } from "react";
import { GoogleMap, Marker, InfoWindow } from "@react-google-maps/api";
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

  useEffect(() => {
    if (myMarket) {
      const lat = parseFloat(myMarket.lat || myMarket.latitude);
      const lng = parseFloat(myMarket.lng || myMarket.longitude);

      if (!isNaN(lat) && !isNaN(lng)) {
        const newCenter = { lat, lng };
        setMapCenter(newCenter);

        if (mapRef.current) {
          mapRef.current.panTo(newCenter);
          mapRef.current.setZoom(15);
        }
      }
    }
  }, [myMarket]);

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
      <div className="h-[450px] flex flex-col items-center justify-center bg-white rounded-md border-2 border-slate-100 shadow-inner uppercase font-black tracking-widest text-[12px]">
        <Loader2 className="animate-spin text-[#008080] mb-4" size={48} />
        SINKRONISASI NODE SUPER ADMIN...
      </div>
    );
  }

  // 🚀 LINK ICON HTTPS KLASIK GOOGLE MAPS (DIJAMIN 1000% MUNCUL & ANTI BLOKIR)
  // Format string murni tanpa embel-embel object.
  const pinOffice = "https://maps.google.com/mapfiles/ms/icons/orange-dot.png";
  const pinStore = "https://maps.google.com/mapfiles/ms/icons/green-dot.png";
  const pinBike = "https://maps.google.com/mapfiles/ms/icons/blue-dot.png";
  const pinUser = "https://maps.google.com/mapfiles/ms/icons/yellow-dot.png";

  return (
    <div className="space-y-4 animate-in fade-in duration-500 text-left font-black uppercase tracking-tighter pb-20">
      {/* 🟢 TOP ANALYTICS PANEL */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <StatCard
          label="TOKO"
          value={merchants.length}
          icon={<Store size={18} />}
          color="text-[#008080]"
          bg="bg-teal-50"
        />
        <StatCard
          label="KURIR"
          value={liveCouriers.length}
          icon={<Bike size={18} />}
          color="text-[#FF6600]"
          bg="bg-orange-50"
        />
        <StatCard
          label="WARGA"
          value={customers.length}
          icon={<User size={18} />}
          color="text-blue-600"
          bg="bg-blue-50"
        />
      </div>

      {/* 🔵 MAP AREA */}
      <div className="relative border-2 border-slate-200 shadow-md rounded-md overflow-hidden bg-slate-100">
        {/* BADGE INFO KIRI ATAS */}
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5 pointer-events-none">
          <div className="bg-[#008080] text-white px-3 py-1.5 rounded-md shadow-lg flex items-center gap-2 border-b-2 border-black/20 text-[9px]">
            <ShieldCheck size={14} /> ENCRYPTED RADAR
          </div>
          <div className="bg-slate-900 text-white px-3 py-1.5 rounded-md shadow-lg flex items-center gap-2 border-b-2 border-[#FF6600] text-[9px]">
            <Radio size={14} className="animate-pulse text-[#FF6600]" />
            NODE: {myMarket?.name || "LOCAL"}
          </div>
        </div>

        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          zoom={15}
          center={mapCenter}
          options={options}
          onLoad={(map) => {
            mapRef.current = map;
          }}
        >
          {/* 📍 PIN PASAR NODE (ORANYE) */}
          <Marker
            position={mapCenter}
            icon={pinOffice}
            onClick={() =>
              setSelectedPin({ ...myMarket, type: "PASAR UTAMA (SUPER ADMIN)" })
            }
          />

          {/* 📍 PIN MITRA TOKO (HIJAU) */}
          {merchants.map((m) => {
            const lat = parseFloat(m.lat || m.latitude);
            const lng = parseFloat(m.lng || m.longitude);
            if (isNaN(lat) || isNaN(lng)) return null;
            return (
              <Marker
                key={m.id}
                position={{ lat, lng }}
                icon={pinStore}
                onClick={() => setSelectedPin({ ...m, type: "MITRA TOKO" })}
              />
            );
          })}

          {/* 📍 PIN KURIR LIVE (BIRU) */}
          {liveCouriers.map((c) => {
            const lat = parseFloat(c.lat || c.latitude);
            const lng = parseFloat(c.lng || c.longitude);
            if (isNaN(lat) || isNaN(lng)) return null;
            return (
              <Marker
                key={c.id}
                position={{ lat, lng }}
                icon={pinBike}
                onClick={() => setSelectedPin({ ...c, type: "MITRA KURIR" })}
              />
            );
          })}

          {/* 📍 PIN PELANGGAN (KUNING) */}
          {customers.map((u) => {
            const lat = parseFloat(u.lat || u.latitude);
            const lng = parseFloat(u.lng || u.longitude);
            if (isNaN(lat) || isNaN(lng)) return null;
            return (
              <Marker
                key={u.id}
                position={{ lat, lng }}
                icon={pinUser}
                onClick={() => setSelectedPin({ ...u, type: "PELANGGAN" })}
              />
            );
          })}

          {/* 💬 INFO WINDOW (MUNCUL SAAT PIN DIKLIK) */}
          {selectedPin && (
            <InfoWindow
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
              <div className="p-2 min-w-[180px] font-black uppercase text-left">
                <p className="text-[9px] text-[#008080] mb-1">
                  {selectedPin.type}
                </p>
                <h4 className="text-[12px] text-slate-900 leading-tight">
                  {selectedPin.shop_name ||
                    selectedPin.full_name ||
                    selectedPin.name}
                </h4>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </div>

      {/* 🟠 LEGEND PETA */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4">
        <LegendCard color="bg-[#FF6600]" label="PUSAT KONTROL" />
        <LegendCard color="bg-[#22c55e]" label="MITRA TOKO" />
        <LegendCard color="bg-[#3b82f6]" label="UNIT KURIR" />
        <LegendCard color="bg-[#eab308]" label="WARGA" />
      </div>

      {/* ⚙️ DEBUG & SECURITY FOOTER */}
      <div className="p-3 bg-white rounded-md border-l-4 border-[#FF6600] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 mt-4">
        <div className="flex items-center gap-3">
          <Info size={18} className="text-[#FF6600] shrink-0" />
          <p className="text-[9px] text-slate-500 leading-tight font-black uppercase">
            RADAR MENGACU PADA NODE:{" "}
            <span className="text-[#008080]">
              {myMarket?.name || "TIDAK DIKETAHUI"}
            </span>
          </p>
        </div>

        <div className="bg-slate-100 p-2 rounded-md flex items-center gap-2 border border-slate-200">
          <MapPin size={12} className="text-[#FF6600]" />
          <span className="text-[9px] font-black text-slate-600">
            TARGET GPS:{" "}
            <span className="text-[#008080]">
              {mapCenter.lat.toFixed(6)}, {mapCenter.lng.toFixed(6)}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
};

// HELPER COMPONENTS
const StatCard = ({ label, value, icon, color, bg }: any) => {
  const borderClass =
    color === "text-[#008080]"
      ? "border-[#008080]"
      : color === "text-[#FF6600]"
        ? "border-[#FF6600]"
        : "border-blue-600";
  return (
    <div
      className={`bg-white p-3 rounded-md border border-slate-200 shadow-sm flex items-center gap-3 border-b-4 ${borderClass}`}
    >
      <div
        className={`w-9 h-9 ${bg} ${color} rounded-md flex items-center justify-center shadow-inner shrink-0`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[8px] font-black text-slate-400 mb-1">{label}</p>
        <p className="text-[16px] font-black text-slate-900 truncate">
          {value}
        </p>
      </div>
    </div>
  );
};

const LegendCard = ({ color, label }: { color: string; label: string }) => (
  <div className="bg-white p-3 rounded-md border border-slate-200 shadow-sm flex items-center gap-3">
    <div className={`w-3.5 h-3.5 rounded-sm ${color} shadow-inner`}></div>
    <span className="text-[10px] font-black text-slate-700 tracking-tight">
      {label}
    </span>
  </div>
);
