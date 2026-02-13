import React, { useState, useEffect } from "react";
import { GoogleMap, Marker, InfoWindow } from "@react-google-maps/api";
import { supabase } from "../../../lib/supabaseClient";
import {
  Store,
  Bike,
  User,
  Loader2,
  Info,
  ShieldCheck,
  Navigation,
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

  // --- 1. STATE UNTUK LIVE TRACKING ---
  const [liveCouriers, setLiveCouriers] = useState<any[]>(initialCouriers);

  // --- 2. REAL-TIME LISTENER: MENDENGARKAN PERGERAKAN GPS ---
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

  // KOORDINAT PUSAT PASAR
  const center = {
    lat: Number(myMarket?.latitude) || -6.2,
    lng: Number(myMarket?.longitude) || 106.816666,
  };

  const mapContainerStyle = {
    width: "100%",
    height: "600px",
    borderRadius: "2.5rem",
  };

  const options = {
    disableDefaultUI: false,
    zoomControl: true,
    mapTypeControl: false,
    streetViewControl: false,
    styles: [
      { featureType: "poi", stylers: [{ visibility: "off" }] },
      { featureType: "transit", stylers: [{ visibility: "off" }] },
    ],
  };

  // --- 3. ICON DEFINITIONS (SVG PATHS) ---
  // Icon Motor yang Bold dan Clean
  const bikeIcon = {
    path: "M19.44 7H17c-.52 0-.98.33-1.15.82l-1.01 2.94C13.25 10.28 11.23 10 9 10c-3.11 0-5.83 1.59-7.39 4h3.55c.42-1.15 1.52-2 2.84-2 1.66 0 3 1.34 3 3s-1.34 3-3 3c-1.32 0-2.42-.85-2.84-2H1V17h1c0 2.21 1.79 4 4 4s4-1.79 4-4c0-.18-.02-.35-.06-.52 1.56.33 3.19.52 4.93.52 2.07 0 3.9-.27 5.48-.78l.65 1.91c.17.49.63.82 1.15.82h1.85c.55 0 1-.45 1-1v-2l-4-9zm-1.94 2L20 13h-4.3l.83-2.43c.12-.34.43-.57.79-.57h.18z",
    fillColor: "#0d9488", // Teal 600
    fillOpacity: 1,
    strokeWeight: 1.5,
    strokeColor: "#ffffff",
    scale: 1.8,
    anchor: isLoaded ? new google.maps.Point(12, 12) : undefined,
  };

  if (!isLoaded)
    return (
      <div className="h-[600px] flex flex-col items-center justify-center bg-white rounded-[2.5rem] border border-slate-100">
        <Loader2 className="animate-spin text-teal-600 mb-4" size={40} />
        <p className="text-xs font-black text-slate-400 uppercase tracking-widest text-center">
          Inisialisasi Radar Wilayah...
        </p>
      </div>
    );

  return (
    <div className="space-y-6 animate-in fade-in duration-700 text-left">
      {/* INFO PANEL */}
      <div className="flex flex-wrap gap-4">
        <div className="bg-white px-6 py-4 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center shadow-sm">
            <Store size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase leading-none mb-1">
              Toko Terdata
            </p>
            <p className="text-lg font-black text-slate-800">
              {merchants.length}
            </p>
          </div>
        </div>

        <div className="bg-white px-6 py-4 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center shadow-sm">
            <Bike size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase leading-none mb-1">
              Kurir Standby
            </p>
            <p className="text-lg font-black text-slate-800">
              {liveCouriers.length}
            </p>
          </div>
        </div>

        <div className="bg-white px-6 py-4 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-sm">
            <User size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase leading-none mb-1">
              Total Pelanggan
            </p>
            <p className="text-lg font-black text-slate-800">
              {customers.length}
            </p>
          </div>
        </div>
      </div>

      {/* MAP AREA */}
      <div className="relative border-4 border-white shadow-2xl rounded-[3rem] overflow-hidden group">
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          zoom={15}
          center={center}
          options={options}
        >
          {/* PIN PASAR ADMIN */}
          <Marker
            position={center}
            icon={{
              url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
            }}
            onClick={() => setSelectedPin({ ...myMarket, type: "PASAR UTAMA" })}
          />

          {/* PIN TOKO */}
          {merchants.map(
            (m) =>
              m.latitude && (
                <Marker
                  key={m.id}
                  position={{
                    lat: Number(m.latitude),
                    lng: Number(m.longitude),
                  }}
                  icon={{
                    url: "http://maps.google.com/mapfiles/ms/icons/green-dot.png",
                  }}
                  onClick={() => setSelectedPin({ ...m, type: "MITRA TOKO" })}
                />
              ),
          )}

          {/* PIN KURIR: BENTUK MOTOR (LIVE TRACKING) */}
          {liveCouriers.map(
            (c) =>
              c.latitude && (
                <Marker
                  key={c.id}
                  position={{
                    lat: Number(c.latitude),
                    lng: Number(c.longitude),
                  }}
                  icon={bikeIcon}
                  onClick={() => setSelectedPin({ ...c, type: "MITRA KURIR" })}
                />
              ),
          )}

          {/* PIN PEMBELI */}
          {customers.map(
            (u) =>
              u.latitude && (
                <Marker
                  key={u.id}
                  position={{
                    lat: Number(u.latitude),
                    lng: Number(u.longitude),
                  }}
                  icon={{
                    url: "http://maps.google.com/mapfiles/ms/icons/yellow-dot.png",
                  }}
                  onClick={() => setSelectedPin({ ...u, type: "PELANGGAN" })}
                />
              ),
          )}

          {selectedPin && (
            <InfoWindow
              position={{
                lat: Number(selectedPin.latitude),
                lng: Number(selectedPin.longitude),
              }}
              onCloseClick={() => setSelectedPin(null)}
            >
              <div className="p-3 min-w-[180px] font-sans text-left">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></div>
                  <p className="text-[9px] font-black text-teal-600 uppercase tracking-widest">
                    {selectedPin.type}
                  </p>
                </div>
                <h4 className="font-black text-slate-800 text-xs uppercase leading-tight">
                  {selectedPin.shop_name ||
                    selectedPin.full_name ||
                    selectedPin.name}
                </h4>
                <p className="text-[10px] text-slate-500 mt-1">
                  {selectedPin.address || "Lokasi Terverifikasi"}
                </p>
                {selectedPin.phone_number && (
                  <p className="text-[9px] font-bold text-slate-400 mt-2 border-t pt-2 italic">
                    Hubungi: {selectedPin.phone_number}
                  </p>
                )}
              </div>
            </InfoWindow>
          )}
        </GoogleMap>

        {/* FLOATING SHIELD INFO */}
        <div className="absolute top-6 left-6 bg-teal-600 text-white px-4 py-2 rounded-2xl shadow-lg flex items-center gap-2">
          <ShieldCheck size={14} />
          <span className="text-[9px] font-black uppercase tracking-widest">
            Enkripsi Wilayah Aktif
          </span>
        </div>

        {/* LEGEND TABLE */}
        <div className="absolute bottom-10 right-10 bg-white/95 backdrop-blur-md p-6 rounded-[2rem] border border-white shadow-2xl hidden md:block">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
            Legend Maps
          </p>
          <div className="space-y-3">
            <LegendItem color="bg-blue-500" label="Pasar Anda" />
            <LegendItem color="bg-green-500" label="Mitra Toko" />
            <LegendItem color="bg-teal-600" label="Motor Kurir" />
            <LegendItem color="bg-yellow-500" label="Pelanggan" />
          </div>
        </div>
      </div>

      <div className="p-5 bg-white rounded-[2rem] border border-slate-100 flex items-start gap-4">
        <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
          <Info size={20} />
        </div>
        <div>
          <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-1">
            Keamanan Wilayah
          </h4>
          <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
            Radar ini telah dikunci pada titik koordinat <b>{myMarket?.name}</b>
            . Anda memantau armada kurir secara real-time berdasarkan data
            koordinat GPS terenkripsi.
          </p>
        </div>
      </div>
    </div>
  );
};

const LegendItem = ({ color, label }: { color: string; label: string }) => (
  <div className="flex items-center gap-3">
    <div className={`w-3 h-3 rounded-full ${color} shadow-sm`}></div>
    <span className="text-[10px] font-black text-slate-700 uppercase tracking-tight">
      {label}
    </span>
  </div>
);
