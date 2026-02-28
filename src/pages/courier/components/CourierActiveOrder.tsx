import React, { useState, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { supabase } from "../../../lib/supabaseClient";
import { useAuth } from "../../../contexts/AuthContext";
import { useToast } from "../../../contexts/ToastContext";
import {
  useJsApiLoader,
  GoogleMap,
  MarkerF,
  DirectionsRenderer,
} from "@react-google-maps/api";
import {
  MapPin,
  Phone,
  MessageSquare,
  MessageCircle,
  CheckCircle,
  Loader2,
  Truck,
  X,
  Store,
  Navigation,
  Crosshair,
  Coins,
  Map as MapIcon,
} from "lucide-react";

import { OrderChatRoom } from "../../../features/chat/OrderChatRoom";

const GOOGLE_MAPS_LIBRARIES: ("places" | "routes" | "geometry" | "drawing")[] =
  ["places", "routes", "geometry", "drawing"];

// 🚀 KOORDINAT CADANGAN
const DEFAULT_CENTER = { lat: -0.8327, lng: 117.2476 };

const ICONS = {
  // 🚀 MENGGUNAKAN IKON CUSTOM DARI FOLDER PUBLIC BOS!
  courier: "/kurir.png",
  store: "https://cdn-icons-png.flaticon.com/512/1055/1055672.png",
  home: "https://cdn-icons-png.flaticon.com/512/1946/1946488.png",
};

interface Props {
  order: any;
  onFinished: () => void;
}

export const CourierActiveOrder: React.FC<Props> = ({ order, onFinished }) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showChat, setShowChat] = useState(false);

  const [isNavigatingMode, setIsNavigatingMode] = useState(false);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const [currentPos, setCurrentPos] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [directions, setDirections] = useState<any>(null);
  const [isTracking, setIsTracking] = useState(false);

  const [chatTarget, setChatTarget] = useState<{
    type: string;
    name: string;
    receiverId: string;
  }>({ type: "", name: "", receiverId: "" });

  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  const isCompleted = order?.status === "COMPLETED";
  const isCanceled = order?.status === "CANCELLED";
  const isPickingUp =
    order?.status === "READY_TO_PICKUP" || order?.status === "PICKING_UP";

  const storeLat = Number(
    order?.merchants?.latitude || order?.merchant?.latitude || 0,
  );
  const storeLng = Number(
    order?.merchants?.longitude || order?.merchant?.longitude || 0,
  );
  const buyerLat = Number(
    order?.delivery_lat || order?.profiles?.latitude || 0,
  );
  const buyerLng = Number(
    order?.delivery_lng || order?.profiles?.longitude || 0,
  );

  const destLat = isPickingUp ? storeLat : buyerLat;
  const destLng = isPickingUp ? storeLng : buyerLng;
  const destinationPos = { lat: destLat, lng: destLng };

  // 🚀 FUNGSI GPS
  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      showToast("Browser tidak mendukung GPS", "error");
      return;
    }

    setIsTracking(true);
    showToast("Mencari Sinyal Satelit...", "success");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const newPos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setCurrentPos(newPos);
        if (mapInstance && isNavigatingMode) mapInstance.panTo(newPos);
        if (user?.id)
          await supabase
            .from("profiles")
            .update({ latitude: newPos.lat, longitude: newPos.lng })
            .eq("id", user.id);
      },
      (error) => {
        console.warn("GPS Gagal:", error.message);
        showToast("GPS Gagal! Pastikan Izin Lokasi Menyala.", "error");
        setIsTracking(false);
      },
      { enableHighAccuracy: true },
    );
  }, [user?.id, mapInstance, isNavigatingMode, showToast]);

  useEffect(() => {
    let interval: any;
    if (isTracking) {
      interval = setInterval(() => {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const newPos = {
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
            };
            setCurrentPos(newPos);
            if (user?.id)
              supabase
                .from("profiles")
                .update({ latitude: newPos.lat, longitude: newPos.lng })
                .eq("id", user.id)
                .then();
          },
          () => setIsTracking(false),
          { enableHighAccuracy: true },
        );
      }, 5000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTracking, user?.id]);

  useEffect(() => {
    if (!isLoaded || !currentPos || destLat === 0) return;
    const directionsService = new window.google.maps.DirectionsService();
    directionsService.route(
      {
        origin: currentPos,
        destination: destinationPos,
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (res, status) => {
        if (status === "OK") setDirections(res);
      },
    );
  }, [isLoaded, currentPos, destLat, destLng, destinationPos]);

  const handleOpenExternalMaps = () => {
    if (destLat === 0)
      return showToast("Koordinat tujuan tidak valid!", "error");
    const url = currentPos
      ? `https://www.google.com/maps/dir/?api=1&origin=${currentPos.lat},${currentPos.lng}&destination=${destLat},${destLng}&travelmode=driving`
      : `https://www.google.com/maps/search/?api=1&query=${destLat},${destLng}`;
    window.open(url, "_blank");
  };

  const handleStatusUpdate = async () => {
    if (!order?.id) return;
    setLoading(true);
    try {
      let nextStatus = "";
      if (order.status === "READY_TO_PICKUP" || order.status === "PICKING_UP")
        nextStatus = "SHIPPING";
      else if (order.status === "SHIPPING" || order.status === "DELIVERING")
        nextStatus = "COMPLETED";

      if (nextStatus === "COMPLETED") {
        await supabase.rpc("complete_order_transaction", {
          p_order_id: order.id,
        });
      } else if (nextStatus !== "") {
        await supabase
          .from("orders")
          .update({ status: nextStatus, shipping_status: nextStatus })
          .eq("id", order.id);
      }
      onFinished();
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChat = (type: string, name: string, receiverId: string) => {
    setChatTarget({ type, name, receiverId });
    setShowChat(true);
  };

  const mapCenter = useMemo(() => {
    if (currentPos) return currentPos;
    if (destLat !== 0) return destinationPos;
    return DEFAULT_CENTER;
  }, [currentPos, destLat, destinationPos]);

  if (loadError)
    return (
      <div className="p-10 text-center font-black text-red-500">
        API MAPS ERROR! CEK KEY.
      </div>
    );

  return (
    <>
      {showChat &&
        createPortal(
          <div className="fixed inset-0 z-[999999] bg-white flex justify-center">
            <div className="w-full max-w-[480px] flex flex-col h-full bg-slate-50 font-sans">
              <div className="p-4 flex justify-between items-center bg-[#008080] text-white shrink-0 shadow-md">
                <h3 className="text-[14px] font-black uppercase">
                  {chatTarget.name}
                </h3>
                <button
                  onClick={() => setShowChat(false)}
                  className="bg-teal-700/50 p-2 rounded-full"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 relative overflow-hidden">
                <OrderChatRoom
                  orderId={order.id}
                  receiverId={chatTarget.receiverId}
                  receiverName={chatTarget.name}
                  chatType={chatTarget.type as any}
                />
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* 🚀 LAYOUT FLEXBOX AMAN (Hapus "absolute inset-0" yang bikin nabrak) */}
      <div className="flex flex-col h-full w-full font-sans font-black uppercase tracking-tighter text-left bg-slate-200 overflow-hidden rounded-b-2xl">
        {/* PANEL PENDAPATAN (Hilang Saat Navigasi) */}
        {!isNavigatingMode && (
          <div className="shrink-0 bg-[#0F172A] px-4 py-2.5 flex items-center justify-between z-10 shadow-sm border-b border-white/10">
            <div>
              <p className="text-[8px] text-[#FF6600] font-bold tracking-[0.2em] leading-none mb-0.5">
                UPAH ANTAR
              </p>
              <h2 className="text-lg text-white font-[1000] flex items-center gap-1.5 leading-none mt-1">
                <Coins size={16} className="text-[#FF6600]" />
                RP {(order?.shipping_cost || 0).toLocaleString()}
              </h2>
            </div>
            <div className="text-right">
              <p className="text-[8px] text-slate-400 font-bold tracking-[0.2em] leading-none mb-0.5">
                JARAK
              </p>
              <p className="text-white text-[13px] font-bold leading-none mt-1">
                {directions?.routes[0]?.legs[0]?.distance?.text || "..."}
              </p>
            </div>
          </div>
        )}

        {/* 🗺️ AREA PETA (Otomatis Mengisi Ruang dengan flex-1) */}
        <div className="relative flex-1 w-full bg-slate-200 z-0">
          {isLoaded ? (
            <GoogleMap
              mapContainerStyle={{ width: "100%", height: "100%" }}
              center={mapCenter}
              zoom={isNavigatingMode ? 18 : 15}
              onLoad={(m) => {
                setMapInstance(m);
                startTracking();
              }}
              options={{
                disableDefaultUI: true,
                gestureHandling: "greedy",
                styles: [
                  {
                    featureType: "poi",
                    elementType: "labels",
                    stylers: [{ visibility: "off" }],
                  },
                ],
              }}
            >
              {directions && (
                <DirectionsRenderer
                  directions={directions}
                  options={{
                    suppressMarkers: true,
                    polylineOptions: {
                      strokeColor: "#008080",
                      strokeWeight: 6,
                      strokeOpacity: 0.8,
                    },
                  }}
                />
              )}

              {/* 🚀 MARKER KURIR CUSTOM DARI PUBLIC FOLDER */}
              {currentPos && (
                <MarkerF
                  position={currentPos}
                  icon={{
                    url: ICONS.courier,
                    scaledSize: new window.google.maps.Size(48, 48),
                    anchor: new window.google.maps.Point(24, 24),
                  }}
                  zIndex={999}
                />
              )}

              {destLat !== 0 && (
                <MarkerF
                  position={destinationPos}
                  icon={{
                    url: isPickingUp ? ICONS.store : ICONS.home,
                    scaledSize: new window.google.maps.Size(38, 38),
                    anchor: new window.google.maps.Point(19, 19),
                  }}
                />
              )}
            </GoogleMap>
          ) : (
            <div className="h-full w-full flex flex-col items-center justify-center gap-2">
              <Loader2 className="animate-spin text-[#008080]" size={32} />
            </div>
          )}

          {/* TOMBOL "MULAI NAVIGASI" (Mode Standar) */}
          {!isNavigatingMode && (
            <button
              onClick={() => {
                setIsNavigatingMode(true);
                startTracking();
              }}
              className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-[#008080] text-white px-8 py-3.5 rounded-full text-[11px] font-[1000] tracking-widest shadow-[0_10px_30px_rgba(0,128,128,0.5)] border-2 border-white flex items-center gap-2 active:scale-95 transition-transform z-20"
            >
              <Navigation size={16} fill="white" /> MULAI NAVIGASI
            </button>
          )}

          {/* TOMBOL PINTASAN PETA (Kanan Bawah) */}
          <div
            className={`absolute right-3 z-10 flex flex-col gap-3 pointer-events-none transition-all ${isNavigatingMode ? "bottom-6" : "bottom-20"}`}
          >
            <button
              onClick={handleOpenExternalMaps}
              className="w-10 h-10 bg-white text-blue-600 rounded-full shadow-lg flex items-center justify-center pointer-events-auto active:scale-90 border border-slate-200"
            >
              <MapIcon size={18} />
            </button>
            <button
              onClick={() => {
                if (!isTracking) startTracking();
                else mapInstance?.panTo(currentPos || destinationPos);
              }}
              className={`w-10 h-10 rounded-full shadow-lg flex items-center justify-center pointer-events-auto active:scale-90 border-2 ${isNavigatingMode ? "bg-[#008080] text-white border-white" : "bg-white text-slate-600 border-slate-200"}`}
            >
              <Crosshair
                size={20}
                className={isTracking ? "animate-pulse" : ""}
              />
            </button>
          </div>

          {/* HEADER NAVIGASI AKTIF (Kiri Atas) */}
          {isNavigatingMode && (
            <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-start pointer-events-none">
              <div className="bg-slate-900/95 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/10 shadow-xl flex items-center gap-3">
                <Navigation
                  size={14}
                  className="text-teal-400 fill-teal-400 animate-pulse"
                />
                <div>
                  <p className="text-[#008080] text-[8px] font-black tracking-widest leading-none mb-1">
                    RADAR AKTIF
                  </p>
                  <p className="text-white text-[11px] font-black leading-none">
                    {isPickingUp ? "MENUJU TOKO" : "MENUJU PEMBELI"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 🚀 PANEL AKSI NAVIGASI AKTIF (Rapi & Tidak Nabrak Bottom Nav) */}
        {isNavigatingMode && (
          <div className="shrink-0 bg-white shadow-[0_-10px_20px_rgba(0,0,0,0.1)] z-20 rounded-t-3xl border-t border-slate-200 p-4 pb-5 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsNavigatingMode(false)}
                className="shrink-0 bg-red-50 text-red-600 px-3 py-4 rounded-2xl text-[9px] font-black active:scale-95 transition-all border border-red-100 leading-tight text-center shadow-sm"
              >
                TUTUP
                <br />
                NAVIGASI
              </button>
              <div className="flex-1">
                <ActionButton
                  onClick={handleStatusUpdate}
                  loading={loading}
                  status={order.status}
                />
              </div>
            </div>
          </div>
        )}

        {/* 📜 PANEL DETAIL STANDAR (Saat Navigasi Mati) */}
        {!isNavigatingMode && (
          <div className="shrink-0 bg-white shadow-[0_-10px_30px_rgba(0,0,0,0.1)] rounded-t-3xl flex flex-col z-20 p-4 pt-5 max-h-[50vh] overflow-y-auto no-scrollbar">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#008080] flex items-center justify-center">
                  <Truck size={20} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-[14px] font-[1000] leading-none text-slate-800">
                    {order.status?.replace(/_/g, " ")}
                  </h3>
                  <p className="text-[9px] text-slate-400 mt-1 font-bold">
                    ORD #{order.id?.slice(0, 8)}
                  </p>
                </div>
              </div>
              <button
                onClick={() =>
                  handleOpenChat(
                    "courier_customer",
                    order.profiles?.full_name,
                    order.customer_id,
                  )
                }
                className="w-10 h-10 bg-[#008080] text-white rounded-full flex items-center justify-center shadow-md active:scale-90"
              >
                <MessageCircle size={18} />
              </button>
            </div>

            {/* Timeline Rute */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 mb-4 relative">
              <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-slate-200"></div>

              {/* Toko */}
              <div
                className={`flex gap-3 relative z-10 mb-4 ${!isPickingUp ? "opacity-40 grayscale" : ""}`}
              >
                <div className="w-5 h-5 bg-[#FF6600] text-white rounded-full flex items-center justify-center shrink-0 border-2 border-slate-50 shadow-sm mt-0.5">
                  <Store size={10} />
                </div>
                <div className="flex-1 min-w-0 flex items-center justify-between">
                  <div>
                    <p className="text-[8px] font-black text-orange-500 uppercase tracking-widest leading-none mb-1">
                      JEMPUT
                    </p>
                    <h4 className="text-[12px] font-[1000] text-slate-800 truncate">
                      {order.merchants?.shop_name || "TOKO MITRA"}
                    </h4>
                  </div>
                  {isPickingUp && (
                    <button
                      onClick={() =>
                        handleOpenChat(
                          "courier_merchant",
                          order.merchants?.shop_name,
                          order.merchants?.user_id,
                        )
                      }
                      className="bg-orange-100 text-[#FF6600] p-2 rounded-lg active:scale-95"
                    >
                      <MessageSquare size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Pembeli */}
              <div
                className={`flex gap-3 relative z-10 ${isPickingUp ? "opacity-40 grayscale" : ""}`}
              >
                <div className="w-5 h-5 bg-[#008080] text-white rounded-full flex items-center justify-center shrink-0 border-2 border-slate-50 shadow-sm mt-0.5">
                  <MapPin size={10} />
                </div>
                <div className="flex-1 min-w-0 flex items-center justify-between">
                  <div>
                    <p className="text-[8px] font-black text-teal-600 uppercase tracking-widest leading-none mb-1">
                      ANTAR
                    </p>
                    <h4 className="text-[12px] font-[1000] text-slate-800 truncate">
                      {order.profiles?.full_name || "PEMBELI"}
                    </h4>
                  </div>
                  {!isPickingUp && (
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          handleOpenChat(
                            "courier_customer",
                            order.profiles?.full_name,
                            order.customer_id,
                          )
                        }
                        className="bg-teal-100 text-[#008080] p-2 rounded-lg active:scale-95"
                      >
                        <MessageSquare size={14} />
                      </button>
                      <a
                        href={`tel:${order.profiles?.phone_number}`}
                        className="bg-slate-200 text-slate-700 p-2 rounded-lg active:scale-95"
                      >
                        <Phone size={14} />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Tombol Aksi Bawah */}
            {!isCompleted && !isCanceled && (
              <div>
                {order.status === "PACKING" ? (
                  <div className="w-full py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-center text-[11px] border border-slate-200">
                    TOKO SEDANG MENGEMAS...
                  </div>
                ) : (
                  <ActionButton
                    onClick={handleStatusUpdate}
                    loading={loading}
                    status={order.status}
                  />
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

const ActionButton = ({ onClick, loading, status }: any) => (
  <button
    onClick={onClick}
    disabled={loading}
    className={`w-full py-4 rounded-[1rem] text-white font-[1000] text-[12px] tracking-widest shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all ${status === "SHIPPING" || status === "DELIVERING" ? "bg-[#008080] shadow-teal-900/20" : "bg-[#FF6600] shadow-orange-900/20"}`}
  >
    {loading ? (
      <Loader2 className="animate-spin" size={18} />
    ) : (
      <CheckCircle size={18} strokeWidth={3} />
    )}
    {status === "SHIPPING" || status === "DELIVERING"
      ? "KONFIRMASI TIBA!"
      : "BARANG SUDAH DIAMBIL"}
  </button>
);

export default CourierActiveOrder;
