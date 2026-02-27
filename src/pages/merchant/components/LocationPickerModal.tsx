import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  GoogleMap,
  useJsApiLoader,
  MarkerF,
  CircleF,
  StandaloneSearchBox,
} from "@react-google-maps/api";
import {
  MapPin,
  Loader2,
  Navigation,
  CheckCircle,
  Info,
  ArrowLeft,
  Store,
  Search,
  Crosshair,
} from "lucide-react";
import { supabase } from "../../../lib/supabaseClient";
import { useToast } from "../../../contexts/ToastContext";

const GOOGLE_MAPS_LIBRARIES: ("places" | "routes" | "geometry" | "drawing")[] =
  ["places", "routes", "geometry", "drawing"];

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

  const [maxDistanceKm, setMaxDistanceKm] = useState<number>(1);

  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [loading, setLoading] = useState(false);
  const [marketCenter, setMarketCenter] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [marketName, setMarketName] = useState("");
  const [isWithinRange, setIsWithinRange] = useState(true);

  // 🚀 Titik awal: Gunakan koordinat merchant jika ada, jika tidak, biarkan 0 dulu.
  const [position, setPosition] = useState({
    lat: parseFloat(merchantProfile?.latitude || "0"),
    lng: parseFloat(merchantProfile?.longitude || "0"),
  });

  const searchBoxRef = useRef<google.maps.places.SearchBox | null>(null);

  useEffect(() => {
    const fetchData = async () => {
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

      if (!merchantProfile?.market_id) return;

      const { data, error } = await supabase
        .from("markets")
        .select("*")
        .eq("id", merchantProfile.market_id)
        .maybeSingle();

      if (error) return;

      if (data) {
        const centerLat = parseFloat(data.lat || data.latitude || "0");
        const centerLng = parseFloat(data.lng || data.longitude || "0");

        if (
          !isNaN(centerLat) &&
          !isNaN(centerLng) &&
          centerLat !== 0 &&
          centerLng !== 0
        ) {
          const center = { lat: centerLat, lng: centerLng };
          setMarketCenter(center);
          setMarketName(data.name ? data.name.toUpperCase() : "PASAR");

          // 🚀 LOGIKA AUTO-CENTER PINTAR:
          // Jika toko belum pernah set lokasi (koordinat = 0), lempar kamera dan pin ke PUSAT PASAR.
          if (position.lat === 0 || position.lng === 0) {
            setPosition(center);
            setIsWithinRange(true);
          } else if (window.google) {
            // Jika toko sudah punya lokasi, hitung jaraknya dari pusat pasar
            const distance =
              google.maps.geometry.spherical.computeDistanceBetween(
                new google.maps.LatLng(position.lat, position.lng),
                new google.maps.LatLng(center.lat, center.lng),
              );
            setIsWithinRange(distance <= currentMaxDist * 1000);
          }
        }
      }
    };

    if (isLoaded) fetchData();
  }, [merchantProfile, isLoaded]); // ❌ Hapus position dari dependensi agar tidak infinite loop

  // Efek samping: Pan kamera ke posisi saat ini setelah map diload
  useEffect(() => {
    if (map && position.lat !== 0) {
      map.panTo(position);
    }
  }, [map, position]);

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
  );

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

  const onPlacesChanged = () => {
    const places = searchBoxRef.current?.getPlaces();
    if (places && places.length > 0) {
      const location = places[0].geometry?.location;
      if (location) {
        const newPos = { lat: location.lat(), lng: location.lng() };
        setPosition(newPos);
        map?.panTo(newPos);
        map?.setZoom(17);
        if (marketCenter) checkDistance(newPos, marketCenter);
      }
    }
  };

  const handleSaveLocation = async () => {
    if (!isWithinRange) {
      showToast(
        `TITIK TERLALU JAUH! MAKSIMAL ${maxDistanceKm}KM DARI PUSAT PASAR!`,
        "error",
      );
      return;
    }

    // Validasi agar tidak nge-save koordinat laut 0,0
    if (position.lat === 0 && position.lng === 0) {
      showToast("Titik lokasi belum valid, mohon geser peta!", "error");
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

      showToast("KOORDINAT BERHASIL DISIMPAN!", "success");
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
      map?.setZoom(16); // Zoom in lebih dekat ke pasar
      setPosition(marketCenter); // Otomatis pindahkan pin ke pasar
      setIsWithinRange(true);
      showToast(`MENUJU PUSAT ${marketName}`, "success");
    } else {
      showToast("Titik Koordinat Pasar Belum Diatur Admin!", "error");
    }
  };

  const getMyLocation = () => {
    if (navigator.geolocation) {
      showToast("Mencari sinyal GPS...", "info");
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const newPos = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          };
          setPosition(newPos);
          if (marketCenter) checkDistance(newPos, marketCenter);
          map?.panTo(newPos);
          map?.setZoom(18);
        },
        () =>
          showToast("Gagal akses GPS, mohon izinkan browser Anda.", "error"),
        { enableHighAccuracy: true, timeout: 5000 },
      );
    }
  };

  return (
    <div className="w-full bg-slate-50 min-h-screen animate-in fade-in duration-500 font-sans font-black uppercase tracking-tighter text-left pb-20">
      <div className="bg-slate-900 border-b-4 border-[#008080] p-4 md:p-6 sticky top-0 z-50 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center text-slate-400 hover:bg-slate-800 hover:text-white rounded-md transition-all border border-slate-700"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-xl text-white leading-none flex items-center gap-2">
              <Crosshair className="text-[#008080]" size={20} /> RADAR LOKASI
            </h2>
            <p className="text-[10px] text-slate-400 mt-1">
              WILAYAH OPERASI:{" "}
              <span className="text-[#FF6600]">
                {marketName || "MEMERIKSA..."}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div
            className={`hidden md:flex items-center gap-2 px-4 py-2 rounded-md border-2 ${
              isWithinRange
                ? "bg-teal-900/30 border-[#008080] text-[#008080]"
                : "bg-red-900/30 border-red-500 text-red-500"
            }`}
          >
            <span className="flex h-2 w-2 relative">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isWithinRange ? "bg-[#008080]" : "bg-red-500"}`}
              ></span>
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${isWithinRange ? "bg-[#008080]" : "bg-red-500"}`}
              ></span>
            </span>
            <span className="text-[10px]">
              {isWithinRange ? "ZONA AMAN (VALID)" : "DILUAR JANGKAUAN"}
            </span>
          </div>

          <button
            disabled={loading || !isWithinRange || position.lat === 0}
            onClick={handleSaveLocation}
            className={`px-8 py-3.5 rounded-md text-[12px] transition-all flex items-center justify-center gap-2 shadow-lg ${
              isWithinRange && position.lat !== 0
                ? "bg-[#008080] text-white hover:bg-teal-700 active:scale-95"
                : "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
            }`}
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <CheckCircle size={16} />
            )}
            KUNCI KOORDINAT
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto md:p-6 space-y-4 mt-4">
        <div className="flex flex-col lg:flex-row gap-4 px-4 md:px-0">
          <div className="bg-slate-900 p-4 rounded-xl shadow-sm flex items-center gap-4 shrink-0 border-l-4 border-[#FF6600]">
            <div className="w-10 h-10 bg-white/10 rounded-md flex items-center justify-center text-[#FF6600]">
              <MapPin size={20} />
            </div>
            <div>
              <p className="text-[9px] text-slate-400 mb-1">
                TITIK TOKO ANDA (LAT, LNG)
              </p>
              <p className="text-[14px] text-white font-mono leading-none tracking-widest">
                {position.lat.toFixed(5)}, {position.lng.toFixed(5)}
              </p>
            </div>
          </div>

          {isLoaded && (
            <div className="flex-1 bg-white p-2 rounded-xl border-2 border-slate-200 shadow-sm flex items-center">
              <div className="pl-3 pr-2 text-slate-400">
                <Search size={18} />
              </div>
              <StandaloneSearchBox
                onLoad={(ref) => (searchBoxRef.current = ref)}
                onPlacesChanged={onPlacesChanged}
              >
                <input
                  type="text"
                  placeholder="Ketik alamat atau nama jalan untuk mencari cepat..."
                  className="w-full bg-transparent border-none outline-none py-2 text-[12px] text-slate-800 placeholder:text-slate-400"
                  style={{ minWidth: "300px" }}
                />
              </StandaloneSearchBox>
            </div>
          )}
        </div>

        <div className="bg-white border-2 border-slate-200 rounded-xl overflow-hidden shadow-xl relative mx-4 md:mx-0">
          {isLoaded ? (
            <GoogleMap
              mapContainerStyle={CONTAINER_STYLE}
              center={
                position.lat === 0 ? { lat: -1.242, lng: 116.852 } : position
              }
              zoom={15}
              onClick={onMapClick}
              onLoad={(m) => setMap(m)}
              options={MAP_OPTIONS}
            >
              {position.lat !== 0 && (
                <MarkerF
                  position={position}
                  draggable={true}
                  onDragEnd={(e) => {
                    if (e.latLng) {
                      const newPos = {
                        lat: e.latLng.lat(),
                        lng: e.latLng.lng(),
                      };
                      setPosition(newPos);
                      if (marketCenter) checkDistance(newPos, marketCenter);
                    }
                  }}
                  icon={{
                    url: "https://cdn-icons-png.flaticon.com/512/1055/1055672.png", // Ikon Toko Oranye
                    scaledSize: new window.google.maps.Size(40, 40),
                    anchor: new window.google.maps.Point(20, 40),
                  }}
                />
              )}

              {marketCenter && (
                <>
                  <CircleF
                    center={marketCenter}
                    radius={maxDistanceKm * 1000}
                    options={{
                      fillColor: isWithinRange ? "#008080" : "#ef4444",
                      fillOpacity: 0.1,
                      strokeColor: isWithinRange ? "#008080" : "#ef4444",
                      strokeWeight: 2,
                    }}
                  />
                  {/* 🚀 FIX: LABEL KOTAK HITAM DIUBAH JADI PUTIH BERSIH */}
                  <MarkerF
                    position={marketCenter}
                    icon={{
                      path: window.google.maps.SymbolPath.CIRCLE,
                      scale: 0, // Sembunyikan titik aslinya, karena kita cuma mau nampilin tulisan
                    }}
                    label={{
                      text: "📍 PUSAT PASAR",
                      className:
                        "text-[11px] font-[1000] text-[#008080] mt-8 bg-white px-3 py-1.5 rounded-lg border-2 border-[#008080] shadow-xl tracking-widest",
                    }}
                  />
                </>
              )}
            </GoogleMap>
          ) : (
            <div className="h-[500px] flex flex-col items-center justify-center bg-slate-50 gap-4">
              <Loader2 className="animate-spin text-[#008080]" size={40} />
              <span className="text-[10px] text-slate-400 tracking-widest">
                MENYINKRONKAN SATELIT...
              </span>
            </div>
          )}

          <div className="absolute bottom-6 right-6 flex flex-col gap-3">
            <button
              onClick={goToMarketCenter}
              title="Kembali ke Pusat Pasar"
              className="p-4 bg-[#FF6600] text-white rounded-xl shadow-lg border-2 border-white hover:bg-orange-600 transition-all active:scale-90 flex items-center justify-center"
            >
              <Store size={20} />
            </button>
            <button
              onClick={getMyLocation}
              title="Lacak GPS HP Saya"
              className="p-4 bg-white text-[#008080] rounded-xl shadow-lg border-2 border-slate-200 hover:border-[#008080] transition-all active:scale-90 flex items-center justify-center"
            >
              <Navigation size={20} />
            </button>
          </div>
        </div>

        <div className="mx-4 md:mx-0 p-6 bg-slate-900 border-l-4 border-[#008080] rounded-xl flex items-start gap-4 shadow-md">
          <div className="w-10 h-10 bg-white/10 text-white rounded-md flex items-center justify-center shrink-0">
            <Info size={20} />
          </div>
          <div>
            <h4 className="text-[12px] text-white">
              INSTRUKSI PENEMPATAN RADAR TOKO
            </h4>
            <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed tracking-wider normal-case font-semibold">
              Geser ikon toko (Atau cari di kolom pencarian) dan letakkan tepat
              di atas lokasi lapak Anda. Gunakan tombol{" "}
              <b className="text-[#FF6600]">Toko Oranye</b> di kanan bawah untuk
              mengembalikan peta ke tengah pasar jika Anda tersesat.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
