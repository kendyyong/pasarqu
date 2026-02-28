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

const BUYER_ICON = "/buyer.png";

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

  // FUNGSI SAKTI: Update kordinat DAN pemicu hitung ongkir
  const syncLocation = (lat: number, lng: number) => {
    setDeliveryCoords({ lat, lng });
    updateLogistics(lat, lng);
  };

  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      syncLocation(e.latLng.lat(), e.latLng.lng());
    }
  };

  const handleMarkerDragEnd = (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      syncLocation(e.latLng.lat(), e.latLng.lng());
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      showToast("GPS TIDAK DIDUKUNG.", "error");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        syncLocation(lat, lng);
        if (mapRef.current) {
          mapRef.current.panTo({ lat, lng });
          mapRef.current.setZoom(17);
        }
        setIsLocating(false);
        showToast("LOKASI DITEMUKAN!", "success");
      },
      () => {
        setIsLocating(false);
        showToast("GAGAL GPS. AKTIFKAN IZIN LOKASI.", "error");
      },
      { enableHighAccuracy: true },
    );
  };

  return (
    <section className="bg-white p-5 rounded-md border border-slate-200 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <MapPin size={20} className="text-[#008080]" />
          <h2 className="text-[12px] text-slate-800 font-black uppercase tracking-widest">
            ALAMAT PENGIRIMAN
          </h2>
        </div>
        <button
          type="button"
          onClick={handleUseCurrentLocation}
          disabled={isLocating}
          className="flex items-center gap-2 bg-teal-50 text-[#008080] border border-teal-200 px-3 py-1.5 rounded-md text-[9px] font-black uppercase tracking-widest active:scale-95 disabled:opacity-50"
        >
          {isLocating ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <LocateFixed size={12} />
          )}
          {isLocating ? "MELACAK..." : "GUNAKAN GPS SAAT INI"}
        </button>
      </div>

      <div className="bg-orange-50 p-3 rounded-md border border-orange-200 flex items-start gap-3">
        <Info size={16} className="text-[#FF6600] shrink-0 mt-0.5" />
        <p className="text-[9px] font-black text-slate-600 uppercase leading-relaxed">
          Geser Pin atau klik peta untuk menentukan titik akurat. Ongkir akan
          otomatis menyesuaikan jarak.
        </p>
      </div>

      <div className="relative w-full h-[280px] rounded-md overflow-hidden border-2 border-slate-200 shadow-inner">
        {!isLoaded ? (
          <div className="w-full h-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400 uppercase tracking-widest gap-2">
            <Loader2 size={16} className="animate-spin text-[#008080]" /> MEMUAT
            PETA...
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
              gestureHandling: "greedy",
            }}
          >
            <MarkerF
              position={deliveryCoords}
              draggable={true}
              onDragEnd={handleMarkerDragEnd}
              icon={
                window.google
                  ? {
                      url: BUYER_ICON,
                      scaledSize: new window.google.maps.Size(40, 40),
                      anchor: new window.google.maps.Point(20, 40),
                    }
                  : undefined
              }
            />
          </GoogleMap>
        )}
      </div>

      <div>
        <label className="text-[9px] text-slate-400 font-black mb-2 block tracking-widest uppercase">
          DETAIL ALAMAT LENGKAP & PATOKAN
        </label>
        <textarea
          value={manualAddress}
          onChange={(e) => setManualAddress(e.target.value)}
          placeholder="CTH: JL. SUDIRMAN NO 10, PAGAR BIRU..."
          className="w-full p-4 border-2 border-slate-200 rounded-md focus:border-[#008080] outline-none text-[12px] font-black uppercase text-slate-800 h-24"
        />
      </div>
    </section>
  );
};

export default CheckoutAddress;
