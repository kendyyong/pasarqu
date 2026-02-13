import React, { useState, useCallback } from "react";
import { GoogleMap, useJsApiLoader, Marker } from "@react-google-maps/api";
import { X, MapPin, Loader2, Navigation, CheckCircle } from "lucide-react";
import { supabase } from "../../../lib/supabaseClient";
import { useToast } from "../../../contexts/ToastContext";

interface Props {
  merchantProfile: any; // Bisa profile toko, kurir, atau pembeli
  onClose: () => void;
  onUpdate: () => void;
}

const containerStyle = {
  width: "100%",
  height: "400px",
};

// Default Center (Misal: Balikpapan)
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
    lat: merchantProfile?.latitude || defaultCenter.lat,
    lng: merchantProfile?.longitude || defaultCenter.lng,
  });

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
      // LOGIKA: Deteksi tabel berdasarkan role user
      const tableName = merchantProfile?.shop_name ? "merchants" : "profiles";

      const { error } = await supabase
        .from(tableName)
        .update({
          latitude: position.lat,
          longitude: position.lng,
          // Update timestamp jika perlu
          updated_at: new Date().toISOString(),
        })
        .eq("id", merchantProfile.id);

      if (error) throw error;

      showToast("Lokasi Berhasil Dipasang!", "success");
      onUpdate();
      onClose();
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const getMyLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const newPos = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setPosition(newPos);
        map?.panTo(newPos);
      });
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-2xl rounded-[3rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-500">
        {/* HEADER */}
        <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-white">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center">
              <MapPin size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">
                Pasang Titik Presisi
              </h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Geser peta untuk menentukan lokasi
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-3 hover:bg-slate-50 rounded-full text-slate-400 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* MAP AREA */}
        <div className="relative">
          {isLoaded ? (
            <GoogleMap
              mapContainerStyle={containerStyle}
              center={position}
              zoom={15}
              onClick={onMapClick}
              onLoad={(map) => setMap(map)}
              options={{
                disableDefaultUI: true,
                zoomControl: true,
                styles: mapStyle, // Gaya peta bersih di bawah
              }}
            >
              <Marker
                position={position}
                draggable={true}
                onDragEnd={(e) => {
                  if (e.latLng)
                    setPosition({ lat: e.latLng.lat(), lng: e.latLng.lng() });
                }}
              />
            </GoogleMap>
          ) : (
            <div className="h-[400px] flex items-center justify-center bg-slate-50">
              <Loader2 className="animate-spin text-teal-600" size={40} />
            </div>
          )}

          {/* MY LOCATION BUTTON */}
          <button
            onClick={getMyLocation}
            className="absolute bottom-6 right-6 p-4 bg-white text-slate-700 rounded-2xl shadow-xl border border-slate-100 hover:text-teal-600 transition-all active:scale-90"
          >
            <Navigation size={20} />
          </button>
        </div>

        {/* FOOTER INFO */}
        <div className="p-8 bg-slate-50/50 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="space-y-1 text-center md:text-left">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
              Koordinat Terpilih
            </p>
            <p className="text-xs font-mono font-bold text-teal-600">
              {position.lat.toFixed(6)}, {position.lng.toFixed(6)}
            </p>
          </div>

          <button
            disabled={loading}
            onClick={handleSaveLocation}
            className="w-full md:w-auto px-10 py-5 bg-slate-900 text-white rounded-[2rem] font-black uppercase text-xs tracking-[0.2em] shadow-xl hover:bg-teal-600 transition-all flex items-center justify-center gap-3 active:scale-95"
          >
            {loading ? (
              <Loader2 className="animate-spin" />
            ) : (
              <>
                <CheckCircle size={18} /> Simpan Lokasi
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// GAYA PETA MODERN (Clean & Professional)
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
