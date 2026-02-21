import React, { useState, useCallback, useEffect } from "react";
import {
  GoogleMap,
  useJsApiLoader,
  MarkerF,
  CircleF,
} from "@react-google-maps/api";
import {
  MapPin,
  Loader2,
  Navigation,
  CheckCircle,
  Info,
  AlertTriangle,
  ArrowLeft,
  Store,
} from "lucide-react";
import { supabase } from "../../../lib/supabaseClient";
import { useToast } from "../../../contexts/ToastContext";

// --- GLOBAL CONFIG ---
const LIBRARIES: ("geometry" | "drawing" | "places" | "visualization")[] = [
  "geometry",
];

const MAP_OPTIONS: google.maps.MapOptions = {
  disableDefaultUI: true,
  zoomControl: true,
  styles: [
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
  ],
};

const CONTAINER_STYLE = { width: "100%", height: "500px" };

interface Props {
  merchantProfile: any;
  onClose: () => void;
  onUpdate: () => void;
}

export const LocationPickerModal: React.FC<Props> = ({
  merchantProfile,
  onClose,
  onUpdate,
}) => {
  const { showToast } = useToast();

  // ✅ STATE UNTUK RADIUS (Default 1KM)
  const [maxDistanceKm, setMaxDistanceKm] = useState<number>(1);

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
    libraries: LIBRARIES,
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [loading, setLoading] = useState(false);
  const [marketCenter, setMarketCenter] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [marketName, setMarketName] = useState("");
  const [isWithinRange, setIsWithinRange] = useState(true);

  const [position, setPosition] = useState({
    lat: parseFloat(merchantProfile?.latitude || "-1.242"),
    lng: parseFloat(merchantProfile?.longitude || "116.852"),
  });

  // 1. AMBIL DATA PASAR DAN SETTING DARI SUPABASE
  useEffect(() => {
    const fetchData = async () => {
      // ✅ A. Tarik setting radius dari Super Admin
      let currentMaxDist = 1;
      const { data: settings } = await supabase
        .from("app_settings")
        .select("max_distance_km")
        .eq("id", 1)
        .maybeSingle();

      if (settings?.max_distance_km) {
        currentMaxDist = settings.max_distance_km;
        setMaxDistanceKm(currentMaxDist);
      }

      // ✅ B. Tarik data lokasi pasar
      if (!merchantProfile?.market_id) return;

      const { data, error } = await supabase
        .from("markets")
        .select("*")
        .eq("id", merchantProfile.market_id)
        .maybeSingle();

      if (error) {
        console.error("Gagal load data pasar:", error);
        return;
      }

      if (data) {
        const lat = parseFloat(data.lat || data.latitude || "0");
        const lng = parseFloat(data.lng || data.longitude || "0");

        if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
          const center = { lat, lng };
          setMarketCenter(center);
          setMarketName(data.name ? data.name.toUpperCase() : "PASAR");

          if (window.google) {
            const distance =
              google.maps.geometry.spherical.computeDistanceBetween(
                new google.maps.LatLng(position.lat, position.lng),
                new google.maps.LatLng(center.lat, center.lng),
              );
            // Cek menggunakan radius yang baru ditarik
            setIsWithinRange(distance <= currentMaxDist * 1000);
          }
        }
      }
    };

    if (isLoaded) fetchData();
  }, [merchantProfile, isLoaded]);

  // 2. LOGIKA HITUNG JARAK KETIKA DIGESER
  const checkDistance = useCallback(
    (
      currentPos: { lat: number; lng: number },
      center: { lat: number; lng: number },
    ) => {
      if (!center || !window.google) return;
      const distance = google.maps.geometry.spherical.computeDistanceBetween(
        new google.maps.LatLng(currentPos.lat, currentPos.lng),
        new google.maps.LatLng(center.lat, center.lng),
      );
      setIsWithinRange(distance <= maxDistanceKm * 1000);
    },
    [maxDistanceKm],
  ); // Bergantung pada maxDistanceKm terbaru

  const onMapClick = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (e.latLng) {
        const newPos = { lat: e.latLng.lat(), lng: e.latLng.lng() };
        setPosition(newPos);
        if (marketCenter) checkDistance(newPos, marketCenter);
      }
    },
    [marketCenter, checkDistance],
  );

  const handleSaveLocation = async () => {
    if (!isWithinRange) {
      showToast(
        `TITIK TERLALU JAUH! MAKSIMAL ${maxDistanceKm}KM DARI PASAR!`,
        "error",
      );
      return;
    }
    setLoading(true);
    try {
      await Promise.all([
        supabase
          .from("profiles")
          .update({ latitude: position.lat, longitude: position.lng })
          .eq("id", merchantProfile.id),
        supabase
          .from("merchants")
          .update({ latitude: position.lat, longitude: position.lng })
          .eq("id", merchantProfile.id),
      ]);

      showToast("LOKASI BERHASIL DISIMPAN!", "success");
      onUpdate();
      onClose();
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const goToMarketCenter = () => {
    if (marketCenter && marketCenter.lat !== 0) {
      map?.panTo(marketCenter);
      map?.setZoom(15);
      showToast(`MENUJU PUSAT ${marketName}`, "success");
    } else {
      showToast("Titik Koordinat Pasar Belum Diatur Admin!", "error");
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
          if (marketCenter) checkDistance(newPos, marketCenter);
          map?.panTo(newPos);
        },
        () => showToast("Gagal akses GPS", "error"),
      );
    }
  };

  return (
    <div className="w-full bg-slate-50 min-h-screen animate-in fade-in duration-500 font-sans text-left pb-20">
      {/* HEADER ELEGAN */}
      <div className="bg-white border-b border-slate-200 p-4 md:p-6 sticky top-0 z-50 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center text-slate-400 hover:bg-slate-100 rounded-xl transition-all"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h2 className="text-[16px] font-bold text-slate-800 uppercase leading-none">
              Presisi Lokasi Toko
            </h2>
            <p className="text-[10px] font-semibold text-[#008080] uppercase tracking-widest mt-1">
              Wilayah: {marketName || "MEMERIKSA DATA PASAR..."}
            </p>
          </div>
        </div>

        <button
          disabled={loading || !isWithinRange}
          onClick={handleSaveLocation}
          className={`px-8 py-3 rounded-xl font-bold text-[12px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg ${
            isWithinRange
              ? "bg-[#008080] text-white shadow-teal-900/10 hover:bg-slate-800 active:scale-95"
              : "bg-slate-200 text-slate-400 cursor-not-allowed"
          }`}
        >
          {loading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <CheckCircle size={16} />
          )}
          Simpan Lokasi
        </button>
      </div>

      <div className="max-w-6xl mx-auto md:p-6">
        <div className="bg-white border border-slate-200 md:rounded-[2rem] overflow-hidden shadow-xl relative">
          {isLoaded ? (
            <GoogleMap
              mapContainerStyle={CONTAINER_STYLE}
              center={position}
              zoom={15}
              onClick={onMapClick}
              onLoad={(m) => setMap(m)}
              options={MAP_OPTIONS}
            >
              {/* MARKER MERCHANT */}
              <MarkerF
                position={position}
                draggable={true}
                onDragEnd={(e) => {
                  if (e.latLng) {
                    const newPos = { lat: e.latLng.lat(), lng: e.latLng.lng() };
                    setPosition(newPos);
                    if (marketCenter) checkDistance(newPos, marketCenter);
                  }
                }}
              />

              {/* RADIUS & PUSAT PASAR */}
              {marketCenter && (
                <>
                  <CircleF
                    center={marketCenter}
                    radius={maxDistanceKm * 1000}
                    options={{
                      fillColor: isWithinRange ? "#008080" : "#ef4444",
                      fillOpacity: 0.1,
                      strokeColor: isWithinRange ? "#008080" : "#ef4444",
                      strokeWeight: 1,
                    }}
                  />
                  <MarkerF
                    position={marketCenter}
                    icon="http://maps.google.com/mapfiles/ms/icons/orange-dot.png"
                    label={{
                      text: "PUSAT PASAR",
                      className:
                        "text-[9px] font-black text-orange-600 mt-8 bg-white/90 px-1.5 py-0.5 rounded border border-orange-200",
                    }}
                  />
                </>
              )}
            </GoogleMap>
          ) : (
            <div className="h-[500px] flex flex-col items-center justify-center bg-slate-50 gap-3">
              <Loader2 className="animate-spin text-[#008080]" size={32} />
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">
                Sinkronisasi Radar...
              </span>
            </div>
          )}

          {/* FLOATING ACTION BUTTONS */}
          <div className="absolute bottom-6 right-6 flex flex-col gap-3">
            <button
              onClick={goToMarketCenter}
              title="Arahkan ke Pusat Pasar"
              className="p-4 bg-orange-600 text-white rounded-2xl shadow-2xl hover:bg-slate-900 transition-all active:scale-90 flex items-center justify-center"
            >
              <Store size={22} />
            </button>
            <button
              onClick={getMyLocation}
              title="Cari Lokasi Saya"
              className="p-4 bg-white text-[#008080] rounded-2xl shadow-2xl border border-slate-100 hover:bg-[#008080] hover:text-white transition-all active:scale-90 flex items-center justify-center"
            >
              <Navigation size={22} />
            </button>
          </div>

          {/* FLOATING STATUS INFO */}
          <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10 w-[90%] max-w-sm px-4">
            <div
              className={`p-4 rounded-2xl border shadow-2xl backdrop-blur-md flex items-center gap-4 transition-all ${
                !marketCenter
                  ? "bg-slate-800/90 border-slate-700"
                  : isWithinRange
                    ? "bg-white/90 border-teal-100"
                    : "bg-red-50/90 border-red-200"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  !marketCenter
                    ? "bg-slate-700 text-white"
                    : isWithinRange
                      ? "bg-teal-50 text-[#008080]"
                      : "bg-red-100 text-red-600"
                }`}
              >
                {!marketCenter ? (
                  <AlertTriangle size={20} />
                ) : isWithinRange ? (
                  <MapPin size={20} />
                ) : (
                  <AlertTriangle size={20} />
                )}
              </div>
              <div className="text-left">
                <h4
                  className={`text-[12px] font-bold uppercase tracking-tight ${
                    !marketCenter
                      ? "text-white"
                      : isWithinRange
                        ? "text-slate-800"
                        : "text-red-700"
                  }`}
                >
                  {!marketCenter
                    ? "Pusat Belum Diset"
                    : isWithinRange
                      ? "Area Sesuai"
                      : "Terlalu Jauh"}
                </h4>
                <p
                  className={`text-[10px] font-medium uppercase mt-1 leading-none ${!marketCenter ? "text-slate-300" : "text-slate-500"}`}
                >
                  {!marketCenter
                    ? "Hubungi Admin Lokal"
                    : isWithinRange
                      ? `Radius Aman ${marketName}`
                      : `Maks ${maxDistanceKm}KM Dari Pusat Pasar`}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 p-6 bg-white border border-slate-200 rounded-[1.5rem] flex items-start gap-4 shadow-sm">
          <div className="w-10 h-10 bg-orange-50 text-orange-500 rounded-xl flex items-center justify-center shrink-0">
            <Info size={20} />
          </div>
          <div className="text-left">
            <h4 className="text-[12px] font-bold text-slate-800 uppercase tracking-tight">
              Ketentuan Lokasi
            </h4>
            <p className="text-[12px] text-slate-500 mt-1 leading-relaxed">
              Titik map ini digunakan kurir untuk menjemput pesanan. Pastikan
              lokasi toko berada di area pasar yang terdaftar. Tekan ikon{" "}
              <span className="text-orange-600 font-bold underline">
                Toko Orange
              </span>{" "}
              untuk melihat batas wilayah operasi pasar Anda.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
