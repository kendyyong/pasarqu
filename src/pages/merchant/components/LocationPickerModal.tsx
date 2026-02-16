import React, { useState, useCallback, useEffect } from "react";
import { GoogleMap, useJsApiLoader, MarkerF } from "@react-google-maps/api";
import { MapPin, Loader2, Navigation, CheckCircle, Info } from "lucide-react";
import { supabase } from "../../../lib/supabaseClient";
import { useToast } from "../../../contexts/ToastContext";

interface Props {
  merchantProfile: any;
  onClose: () => void;
  onUpdate: () => void;
}

const containerStyle = {
  width: "100%",
  height: "450px", // Tinggi disesuaikan untuk mode halaman penuh
};

// Default Center (Indonesia)
const defaultCenter = {
  lat: -1.242,
  lng: 116.852,
};

export const LocationPickerModal: React.FC<Props> = ({
  merchantProfile,
  onClose,
  onUpdate,
}) => {
  const { showToast } = useToast();
  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [loading, setLoading] = useState(false);

  const [position, setPosition] = useState({
    lat: Number(merchantProfile?.latitude) || defaultCenter.lat,
    lng: Number(merchantProfile?.longitude) || defaultCenter.lng,
  });

  useEffect(() => {
    if (merchantProfile?.latitude && merchantProfile?.longitude) {
      setPosition({
        lat: Number(merchantProfile.latitude),
        lng: Number(merchantProfile.longitude),
      });
    }
  }, [merchantProfile]);

  const onMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      setPosition({
        lat: e.latLng.lat(),
        lng: e.latLng.lng(),
      });
    }
  }, []);

  const handleSaveLocation = async () => {
    setLoading(true);
    try {
      // Update data di kedua tabel agar sinkron total
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          latitude: position.lat,
          longitude: position.lng,
        })
        .eq("id", merchantProfile.id);

      if (profileError) throw profileError;

      if (merchantProfile?.shop_name) {
        await supabase
          .from("merchants")
          .update({
            latitude: position.lat,
            longitude: position.lng,
          })
          .eq("id", merchantProfile.id);
      }

      showToast("Titik Map Toko Berhasil Disimpan!", "success");
      onUpdate();
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const getMyLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const newPos = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          };
          setPosition(newPos);
          map?.panTo(newPos);
        },
        () => {
          showToast("Gagal akses GPS. Berikan izin lokasi.", "error");
        },
      );
    }
  };

  return (
    <div className="w-full bg-white border border-slate-200 rounded-none animate-in fade-in duration-500 overflow-hidden">
      {/* HEADER INTERNAL */}
      <div className="p-4 md:p-6 border-b border-slate-200 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-900 text-white rounded-none flex items-center justify-center">
            <MapPin size={20} />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tighter leading-none">
              Titik Presisi Map Toko
            </h3>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
              Geser pin merah tepat di atas lokasi lapak Anda
            </p>
          </div>
        </div>

        {/* INFO GPS */}
        <div className="flex items-center gap-2 bg-white px-4 py-2 border border-slate-200">
          <Info size={14} className="text-teal-600" />
          <p className="text-[9px] font-black text-slate-600 uppercase">
            Koordinat: {position.lat.toFixed(6)}, {position.lng.toFixed(6)}
          </p>
        </div>
      </div>

      {/* MAP AREA */}
      <div className="relative">
        {isLoaded ? (
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={position}
            zoom={17}
            onClick={onMapClick}
            onLoad={(map) => setMap(map)}
            options={{
              disableDefaultUI: true,
              zoomControl: true,
              styles: mapStyle,
            }}
          >
            <MarkerF
              key={`marker-${position.lat}-${position.lng}`}
              position={position}
              draggable={true}
              onDragEnd={(e) => {
                if (e.latLng)
                  setPosition({ lat: e.latLng.lat(), lng: e.latLng.lng() });
              }}
            />
          </GoogleMap>
        ) : (
          <div className="h-[400px] flex flex-col items-center justify-center bg-slate-50 gap-3">
            <Loader2 className="animate-spin text-slate-900" size={32} />
            <span className="text-[10px] font-black uppercase text-slate-400">
              Memuat Radar...
            </span>
          </div>
        )}

        {/* FLOATING ACTION BUTTONS */}
        <button
          onClick={getMyLocation}
          className="absolute bottom-6 right-6 p-4 bg-white text-slate-900 rounded-none shadow-xl border border-slate-200 hover:bg-teal-600 hover:text-white transition-all active:scale-95 z-10"
        >
          <Navigation size={20} />
        </button>
      </div>

      {/* FOOTER ACTION */}
      <div className="p-4 md:p-6 border-t border-slate-200 bg-white flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-start gap-2 max-w-sm">
          <AlertCircleIcon
            size={16}
            className="text-orange-500 mt-0.5 shrink-0"
          />
          <p className="text-[9px] font-bold text-slate-400 uppercase leading-relaxed text-left">
            Akurasi titik map sangat penting untuk kurir menemukan toko Anda.
            Pastikan titik berada tepat di depan pintu toko.
          </p>
        </div>

        <button
          disabled={loading}
          onClick={handleSaveLocation}
          className="w-full md:w-auto px-10 py-4 bg-slate-900 text-white rounded-none font-black uppercase text-[10px] tracking-[0.2em] shadow-lg hover:bg-teal-600 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="animate-spin" size={16} />
          ) : (
            <>
              <CheckCircle size={18} /> Simpan Koordinat
            </>
          )}
        </button>
      </div>
    </div>
  );
};

// Sub-komponen ikon kecil
const AlertCircleIcon = ({ size, className }: any) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const mapStyle = [
  {
    featureType: "poi",
    elementType: "labels",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "transit",
    elementType: "labels.icon",
    stylers: [{ visibility: "off" }],
  },
];
