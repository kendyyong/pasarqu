import React, { useCallback, useRef, useState } from "react";
import { GoogleMap, MarkerF } from "@react-google-maps/api";
import { MapPin, Info, LocateFixed, Loader2 } from "lucide-react";
import { useToast } from "../../../contexts/ToastContext";

interface Props {
  isLoaded: boolean;
  deliveryCoords: { lat: number; lng: number };
  setDeliveryCoords: (coords: { lat: number; lng: number }) => void;
  manualAddress: string;
  setManualAddress: (val: string) => void;
  updateLogistics: (lat: number, lng: number) => void;
}

// 🚀 IKON CUSTOM RUMAH PEMBELI
const BUYER_ICON = "https://cdn-icons-png.flaticon.com/512/1946/1946488.png";

export const CheckoutAddress: React.FC<Props> = ({
  isLoaded,
  deliveryCoords,
  setDeliveryCoords,
  manualAddress,
  setManualAddress,
  updateLogistics,
}) => {
  const mapRef = useRef<google.maps.Map | null>(null);
  const { showToast } = useToast();
  const [isLocating, setIsLocating] = useState(false);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  // Saat peta diklik
  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      setDeliveryCoords({ lat, lng });
      updateLogistics(lat, lng);
    }
  };

  // Saat pin/marker selesai digeser
  const handleMarkerDragEnd = (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      setDeliveryCoords({ lat, lng });
      updateLogistics(lat, lng);
    }
  };

  // 🚀 FITUR PRO: AMBIL GPS LOKASI SAAT INI
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      showToast("GPS tidak didukung di perangkat ini.", "error");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        setDeliveryCoords({ lat, lng });

        // Pusatkan peta ke lokasi baru
        if (mapRef.current) {
          mapRef.current.panTo({ lat, lng });
          mapRef.current.setZoom(17);
        }

        // Hitung ulang ongkir berdasarkan lokasi GPS asli
        updateLogistics(lat, lng);
        setIsLocating(false);
        showToast("Lokasi akurat ditemukan!", "success");
      },
      (error) => {
        setIsLocating(false);
        showToast("Gagal mengambil GPS. Pastikan Izin Lokasi aktif.", "error");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  };

  return (
    <section className="bg-white p-5 rounded-md border border-slate-200 shadow-sm space-y-4 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <MapPin size={20} className="text-[#008080]" />
          <h2 className="text-[12px] text-slate-800 tracking-widest font-black uppercase">
            ALAMAT PENGIRIMAN
          </h2>
        </div>

        {/* 🚀 TOMBOL SAKTI GPS */}
        <button
          onClick={handleUseCurrentLocation}
          disabled={isLocating}
          className="flex items-center gap-2 bg-teal-50 text-[#008080] border border-teal-200 px-3 py-1.5 rounded-md text-[9px] font-black uppercase tracking-widest hover:bg-[#008080] hover:text-white transition-all active:scale-95 disabled:opacity-50"
        >
          {isLocating ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <LocateFixed size={12} />
          )}
          {isLocating ? "Melacak..." : "Gunakan GPS Saat Ini"}
        </button>
      </div>

      <div className="bg-orange-50 p-3 rounded-md border border-orange-200 flex items-start gap-3">
        <Info size={16} className="text-[#FF6600] shrink-0 mt-0.5" />
        <p className="text-[9px] font-black text-slate-600 uppercase leading-relaxed">
          Geser Pin di peta atau gunakan GPS untuk menentukan titik akurat rumah
          Anda. Ongkir akan otomatis menyesuaikan.
        </p>
      </div>

      {/* PETA GOOGLE MAPS */}
      <div className="relative w-full h-[280px] rounded-md overflow-hidden border-2 border-slate-200 shadow-inner">
        {!isLoaded ? (
          <div className="w-full h-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400 uppercase tracking-widest gap-2">
            <Loader2 size={16} className="animate-spin text-[#008080]" /> Memuat
            Peta...
          </div>
        ) : (
          <GoogleMap
            mapContainerStyle={{ width: "100%", height: "100%" }}
            center={deliveryCoords}
            zoom={16}
            onLoad={onMapLoad}
            onClick={handleMapClick}
            options={{
              disableDefaultUI: true,
              zoomControl: true,
              gestureHandling: "greedy", // Memudahkan scroll di mobile
            }}
          >
            <MarkerF
              position={deliveryCoords}
              draggable={true}
              onDragEnd={handleMarkerDragEnd}
              // 🚀 IKON CUSTOM DIPASANG DI SINI
              icon={{
                url: BUYER_ICON,
                scaledSize: new window.google.maps.Size(40, 40),
                anchor: new window.google.maps.Point(20, 40),
              }}
            />
          </GoogleMap>
        )}
      </div>

      {/* INPUT ALAMAT MANUAL */}
      <div>
        <label className="text-[9px] text-slate-400 font-black mb-2 block tracking-widest">
          DETAIL ALAMAT LENGKAP & PATOKAN (WAJIB)
        </label>
        <textarea
          value={manualAddress}
          onChange={(e) => setManualAddress(e.target.value)}
          placeholder="Cth: Jl. Sudirman No 10, Pagar Biru, Dekat Masjid..."
          className="w-full p-4 border-2 border-slate-200 rounded-md focus:border-[#008080] outline-none text-[12px] font-black uppercase text-slate-800 h-24 shadow-sm"
        />
      </div>
    </section>
  );
};
