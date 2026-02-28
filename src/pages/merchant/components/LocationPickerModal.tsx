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

const CONTAINER_STYLE = { width: "100%", height: "100%", minHeight: "450px" };

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

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [loading, setLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  const [mapCenter, setMapCenter] = useState({ lat: -0.82477, lng: 117.24538 });
  const [markerPos, setMarkerPos] = useState({ lat: 0, lng: 0 });

  const [marketCenter, setMarketCenter] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [marketName, setMarketName] = useState("MEMERIKSA...");
  const [isWithinRange, setIsWithinRange] = useState(true);

  const searchBoxRef = useRef<google.maps.places.SearchBox | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchTrueLocation = async () => {
      if (!merchantProfile) return;

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const userId = session?.user?.id || merchantProfile.id;

        let currentMaxDist = 1;
        const { data: settings } = await supabase
          .from("app_settings")
          .select("max_distance_km")
          .eq("id", 1)
          .maybeSingle();
        if (settings?.max_distance_km) {
          currentMaxDist = settings.max_distance_km;
          if (isMounted) setMaxDistanceKm(currentMaxDist);
        }

        const marketId =
          merchantProfile?.market_id || merchantProfile?.markets?.id;
        let mCenter = { lat: -0.82477, lng: 117.24538 };
        let mName = "PASAR LOKAL";

        if (marketId) {
          const { data: marketData } = await supabase
            .from("markets")
            .select("*")
            .eq("id", marketId)
            .maybeSingle();
          if (marketData) {
            mCenter = {
              lat: Number(marketData.latitude || marketData.lat || mCenter.lat),
              lng: Number(
                marketData.longitude || marketData.lng || mCenter.lng,
              ),
            };
            mName = marketData.name ? marketData.name.toUpperCase() : "PASAR";
          }
        }

        if (isMounted) {
          setMarketCenter(mCenter);
          setMarketName(mName);
        }

        const localKey = `store_pos_${userId}`;
        const localData = localStorage.getItem(localKey);
        let sLat = 0;
        let sLng = 0;

        if (localData) {
          const parsed = JSON.parse(localData);
          sLat = Number(parsed.lat);
          sLng = Number(parsed.lng);
        }

        const { data: storeData } = await supabase
          .from("merchants")
          .select("*")
          .eq("id", userId)
          .maybeSingle();
        if (storeData) {
          const dbLat = Number(storeData.latitude || storeData.lat || 0);
          const dbLng = Number(storeData.longitude || storeData.lng || 0);
          if (dbLat !== 0 && dbLng !== 0 && !isNaN(dbLat)) {
            sLat = dbLat;
            sLng = dbLng;
          }
        }

        if (isMounted) {
          if (sLat !== 0 && sLng !== 0 && !isNaN(sLat)) {
            const actualPos = { lat: sLat, lng: sLng };
            setMarkerPos(actualPos);
            setMapCenter(actualPos);
          } else {
            setMarkerPos(mCenter);
            setMapCenter(mCenter);
          }
          setIsInitializing(false);
        }
      } catch (error) {
        console.error("Gagal inisialisasi:", error);
        if (isMounted) setIsInitializing(false);
      }
    };

    fetchTrueLocation();
    return () => {
      isMounted = false;
    };
  }, [merchantProfile]);

  useEffect(() => {
    if (isLoaded && window.google && marketCenter && markerPos.lat !== 0) {
      const distance = google.maps.geometry.spherical.computeDistanceBetween(
        new google.maps.LatLng(markerPos.lat, markerPos.lng),
        new google.maps.LatLng(marketCenter.lat, marketCenter.lng),
      );
      setIsWithinRange(distance <= maxDistanceKm * 1000);
    }
  }, [markerPos, marketCenter, maxDistanceKm, isLoaded]);

  const onMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      setMarkerPos({ lat: e.latLng.lat(), lng: e.latLng.lng() });
    }
  }, []);

  const onPlacesChanged = () => {
    const places = searchBoxRef.current?.getPlaces();
    if (places && places.length > 0) {
      const location = places[0].geometry?.location;
      if (location) {
        const newPos = { lat: location.lat(), lng: location.lng() };
        setMarkerPos(newPos);
        map?.panTo(newPos);
        map?.setZoom(18);
      }
    }
  };

  const handleSaveLocation = async () => {
    if (!isWithinRange) {
      showToast(`TITIK TERLALU JAUH! MAKSIMAL ${maxDistanceKm}KM!`, "error");
      return;
    }

    if (markerPos.lat === 0 && markerPos.lng === 0) {
      showToast("Titik lokasi belum valid, mohon geser peta!", "error");
      return;
    }

    setLoading(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const userId = session?.user?.id || merchantProfile.id;

      await Promise.all([
        supabase
          .from("profiles")
          .update({ latitude: markerPos.lat, longitude: markerPos.lng })
          .eq("id", userId),
        supabase
          .from("merchants")
          .update({ latitude: markerPos.lat, longitude: markerPos.lng })
          .eq("id", userId),
      ]);

      localStorage.setItem(`store_pos_${userId}`, JSON.stringify(markerPos));

      showToast("KOORDINAT TERSIMPAN! ✅", "success");
      onUpdate();
      setTimeout(() => {
        onClose();
      }, 800);
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
      showToast(`MENUJU PUSAT PASAR`, "success");
    }
  };

  const getMyLocation = () => {
    if (navigator.geolocation) {
      showToast("Mencari GPS...", "info");
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const newPos = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          };
          setMarkerPos(newPos);
          map?.panTo(newPos);
          map?.setZoom(18);
        },
        () => showToast("Gagal akses GPS.", "error"),
        { enableHighAccuracy: true, timeout: 5000 },
      );
    }
  };

  return (
    <div className="w-full bg-slate-50 min-h-screen animate-in fade-in duration-500 font-sans uppercase tracking-tight text-left pb-24 md:pb-10 flex flex-col">
      {/* 🚀 TOP BAR: Dibuat lebih padat dan rapi */}
      <div className="bg-slate-900 border-b-4 border-[#008080] p-4 sticky top-0 z-50 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onClose}
            className="w-9 h-9 shrink-0 flex items-center justify-center text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-all border border-slate-700"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="truncate">
            <h2 className="text-[14px] md:text-base font-[1000] text-white leading-none flex items-center gap-1.5 truncate">
              <Crosshair className="text-[#008080] shrink-0" size={16} /> RADAR
            </h2>
            <p className="text-[9px] text-slate-400 mt-1 truncate">
              AREA:{" "}
              <span className="text-[#FF6600] font-bold">{marketName}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-2">
          {!isInitializing && (
            <div
              className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${isWithinRange ? "bg-teal-900/30 border-[#008080] text-[#008080]" : "bg-red-900/30 border-red-500 text-red-500"}`}
            >
              <span
                className={`w-2 h-2 rounded-full ${isWithinRange ? "bg-[#008080]" : "bg-red-500"}`}
              ></span>
              <span className="text-[9px] font-bold">
                {isWithinRange ? "VALID" : "DILUAR JANGKAUAN"}
              </span>
            </div>
          )}

          <button
            disabled={
              loading || isInitializing || !isWithinRange || markerPos.lat === 0
            }
            onClick={handleSaveLocation}
            className={`px-4 md:px-6 py-2 md:py-2.5 rounded-lg text-[10px] md:text-[11px] font-[1000] transition-all flex items-center justify-center gap-1.5 shadow-md ${isWithinRange && markerPos.lat !== 0 && !isInitializing ? "bg-[#008080] text-white hover:bg-teal-700 active:scale-95" : "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"}`}
          >
            {loading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <CheckCircle size={14} />
            )}{" "}
            KUNCI
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col w-full max-w-5xl mx-auto md:p-4 gap-3 md:gap-4 p-3 relative">
        <div className="flex flex-col md:flex-row gap-3">
          {/* KOTAK KOORDINAT */}
          <div className="bg-slate-900 p-3 rounded-xl shadow-sm flex items-center gap-3 shrink-0 border-l-4 border-[#FF6600]">
            <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center text-[#FF6600] shrink-0">
              <MapPin size={16} />
            </div>
            <div className="min-w-0">
              <p className="text-[8px] text-slate-400 mb-0.5">
                TITIK LAPAK (LAT, LNG)
              </p>
              <p className="text-[12px] text-white font-mono font-bold tracking-wider truncate">
                {isInitializing
                  ? "SINKRONISASI..."
                  : `${markerPos.lat.toFixed(5)}, ${markerPos.lng.toFixed(5)}`}
              </p>
            </div>
          </div>

          {/* 🚀 KOTAK PENCARIAN (Bebas dari style paksaan, tidak akan overflow) */}
          {!isInitializing && isLoaded && (
            <div className="flex-1 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-sm flex items-center min-w-0">
              <Search size={16} className="text-slate-400 shrink-0 mr-2" />
              <StandaloneSearchBox
                onLoad={(ref) => (searchBoxRef.current = ref)}
                onPlacesChanged={onPlacesChanged}
              >
                {/* HAPUS MIN-WIDTH, GUNAKAN W-FULL DAN TRUNCATE */}
                <input
                  type="text"
                  placeholder="Cari jalan / patokan..."
                  className="w-full bg-transparent border-none outline-none text-[11px] font-bold text-slate-800 placeholder:text-slate-400 truncate"
                />
              </StandaloneSearchBox>
            </div>
          )}
        </div>

        {/* AREA PETA */}
        <div className="flex-1 bg-slate-100 border border-slate-200 rounded-xl overflow-hidden shadow-inner relative min-h-[400px]">
          {isInitializing || !isLoaded ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <Loader2 className="animate-spin text-[#008080]" size={32} />
              <span className="text-[10px] font-bold text-slate-500 tracking-widest">
                MEMBACA SATELIT...
              </span>
            </div>
          ) : (
            <GoogleMap
              mapContainerStyle={CONTAINER_STYLE}
              center={mapCenter}
              zoom={markerPos.lat === marketCenter?.lat ? 15 : 18}
              onClick={onMapClick}
              onLoad={(m) => setMap(m)}
              options={MAP_OPTIONS}
            >
              {markerPos.lat !== 0 && (
                <MarkerF
                  position={markerPos}
                  draggable={true}
                  onDragEnd={(e) => {
                    if (e.latLng)
                      setMarkerPos({
                        lat: e.latLng.lat(),
                        lng: e.latLng.lng(),
                      });
                  }}
                  icon={{
                    url: "https://cdn-icons-png.flaticon.com/512/1055/1055672.png",
                    scaledSize: new window.google.maps.Size(36, 36),
                    anchor: new window.google.maps.Point(18, 36),
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
                  <MarkerF
                    position={marketCenter}
                    icon={{
                      path: window.google.maps.SymbolPath.CIRCLE,
                      scale: 0,
                    }}
                    label={{
                      text: "📍 PUSAT PASAR",
                      className:
                        "text-[9px] font-[1000] text-[#008080] mt-6 bg-white/90 backdrop-blur px-2 py-1 rounded border border-[#008080] shadow-sm tracking-widest",
                    }}
                  />
                </>
              )}
            </GoogleMap>
          )}

          {/* TOMBOL MENGAMBANG DI DALAM PETA */}
          {!isInitializing && (
            <div className="absolute bottom-4 right-4 flex flex-col gap-2">
              <button
                onClick={goToMarketCenter}
                className="w-10 h-10 bg-[#FF6600] text-white rounded-full shadow-lg border-2 border-white hover:bg-orange-600 transition-all active:scale-90 flex items-center justify-center"
              >
                <Store size={18} />
              </button>
              <button
                onClick={getMyLocation}
                className="w-10 h-10 bg-white text-[#008080] rounded-full shadow-lg border-2 border-slate-200 hover:border-[#008080] transition-all active:scale-90 flex items-center justify-center"
              >
                <Navigation size={18} />
              </button>
            </div>
          )}
        </div>

        {/* INFO BOX BAWAH */}
        <div className="bg-slate-900 border-l-4 border-[#008080] rounded-xl p-3 flex items-start gap-3 shadow-md shrink-0">
          <div className="w-8 h-8 bg-white/10 text-white rounded-lg flex items-center justify-center shrink-0">
            <Info size={16} />
          </div>
          <div>
            <h4 className="text-[10px] font-bold text-white mb-0.5">
              INSTRUKSI PENEMPATAN
            </h4>
            <p className="text-[9px] text-slate-400 leading-snug normal-case font-medium">
              Geser ikon toko atau gunakan pencarian untuk meletakkan pin tepat
              di lapak Anda. Gunakan tombol melayang di kanan bawah peta untuk
              panduan arah.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
