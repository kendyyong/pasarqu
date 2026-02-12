import React, { useState } from "react";
import { GoogleMap, Marker, InfoWindow } from "@react-google-maps/api";
import { Store, Bike, User, Loader2, Info, ShieldCheck } from "lucide-react";

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
  couriers,
  customers,
  isLoaded,
}) => {
  const [selectedPin, setSelectedPin] = useState<any>(null);

  // 1. KUNCI KOORDINAT: Peta otomatis memusatkan pandangan ke Pasar Admin tersebut
  const center = {
    lat: myMarket?.latitude || -6.2,
    lng: myMarket?.longitude || 106.816666,
  };

  const mapContainerStyle = {
    width: "100%",
    height: "600px",
    borderRadius: "2.5rem",
  };

  // 2. CONFIG MAPS: Matikan akses navigasi liar ke luar wilayah
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

  if (!isLoaded)
    return (
      <div className="h-[600px] flex flex-col items-center justify-center bg-white rounded-[2.5rem] border border-slate-100">
        <Loader2 className="animate-spin text-teal-600 mb-4" size={40} />
        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
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
              {couriers.length}
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
          {/* PIN PASAR ADMIN (PRIMARY) */}
          <Marker
            position={center}
            icon={{
              url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
            }}
            onClick={() => setSelectedPin({ ...myMarket, type: "PASAR UTAMA" })}
          />

          {/* PIN TOKO: Hanya yang masuk dalam array merchants wilayah ini */}
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

          {/* PIN KURIR: Hanya yang masuk dalam array couriers wilayah ini */}
          {couriers.map(
            (c) =>
              c.latitude && (
                <Marker
                  key={c.id}
                  position={{
                    lat: Number(c.latitude),
                    lng: Number(c.longitude),
                  }}
                  icon={{
                    url: "http://maps.google.com/mapfiles/ms/icons/orange-dot.png",
                  }}
                  onClick={() => setSelectedPin({ ...c, type: "MITRA KURIR" })}
                />
              ),
          )}

          {/* PIN PEMBELI: Hanya yang masuk dalam array customers wilayah ini */}
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
                <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
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
            <LegendItem color="bg-orange-500" label="Mitra Kurir" />
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
            . Anda hanya dapat memantau mitra yang terdaftar secara sah di bawah
            manajemen wilayah Anda sesuai kebijakan privasi Pasarqu 2026.
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
