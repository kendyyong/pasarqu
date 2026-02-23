import React, { useCallback, useRef } from "react";
import { GoogleMap, MarkerF } from "@react-google-maps/api";
import { MapPin, Info } from "lucide-react";

interface Props {
  isLoaded: boolean;
  deliveryCoords: { lat: number; lng: number };
  setDeliveryCoords: (coords: { lat: number; lng: number }) => void;
  manualAddress: string;
  setManualAddress: (val: string) => void;
  updateLogistics: (lat: number, lng: number) => void;
}

export const CheckoutAddress: React.FC<Props> = ({
  isLoaded,
  deliveryCoords,
  setDeliveryCoords,
  manualAddress,
  setManualAddress,
  updateLogistics,
}) => {
  const mapRef = useRef<google.maps.Map | null>(null);

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

  return (
    <section className="bg-white p-5 rounded-md border border-slate-200 shadow-sm space-y-4 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-center gap-2">
        <MapPin size={20} className="text-[#008080]" />
        <h2 className="text-[12px] text-slate-800 tracking-widest font-black uppercase">
          ALAMAT PENGIRIMAN
        </h2>
      </div>

      <div className="bg-orange-50 p-3 rounded-md border border-orange-200 flex items-start gap-3">
        <Info size={16} className="text-[#FF6600] shrink-0 mt-0.5" />
        <p className="text-[9px] font-black text-slate-600 uppercase leading-relaxed">
          Geser Pin Merah di peta untuk menentukan titik akurat rumah Anda.
          Ongkir akan otomatis menyesuaikan jarak.
        </p>
      </div>

      {/* PETA GOOGLE MAPS */}
      <div className="relative w-full h-[280px] rounded-md overflow-hidden border-2 border-slate-200 shadow-inner">
        {!isLoaded ? (
          <div className="w-full h-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Memuat Peta...
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
            />
          </GoogleMap>
        )}
      </div>

      {/* INPUT ALAMAT MANUAL */}
      <div>
        <label className="text-[9px] text-slate-400 font-black mb-2 block tracking-widest">
          DETAIL ALAMAT LENGKAP & PATOKAN
        </label>
        <textarea
          value={manualAddress}
          onChange={(e) => setManualAddress(e.target.value)}
          placeholder="Cth: Jl. Sudirman No 10, Pagar Biru..."
          className="w-full p-4 border-2 border-slate-200 rounded-md focus:border-[#008080] outline-none text-[12px] font-black uppercase text-slate-800 h-24 shadow-sm"
        />
      </div>
    </section>
  );
};
