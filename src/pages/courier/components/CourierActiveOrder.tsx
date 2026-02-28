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

// 🚀 KOORDINAT CADANGAN (Mencegah Blank Putih)
const DEFAULT_CENTER = { lat: -0.8327, lng: 117.2476 };

const ICONS = {
  courier: "/kurir.png", // 🚀 IKON CUSTOM DARI FOLDER PUBLIC
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

  // 🚀 FUNGSI GPS PINTAR
  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      showToast("Browser tidak mendukung GPS", "error");
      return;
    }

    setIsNavigatingMode(true);
    showToast("Mencari Sinyal Satelit...", "success");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const newPos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setCurrentPos(newPos);
        if (mapInstance) mapInstance.panTo(newPos);
        if (user?.id)
          await supabase
            .from("profiles")
            .update({ latitude: newPos.lat, longitude: newPos.lng })
            .eq("id", user.id);
      },
      (error) => {
        console.warn("GPS Gagal:", error.message);
        if (!currentPos && destLat !== 0)
          setCurrentPos({ lat: destLat + 0.001, lng: destLng + 0.001 });
      },
      { enableHighAccuracy: true },
    );
  }, [user?.id, mapInstance, destLat, destLng, currentPos, showToast]);

  // INTERVAL GPS (Hanya menyala saat Navigasi Aktif)
  useEffect(() => {
    let interval: any;
    if (isNavigatingMode) {
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
          () => setIsNavigatingMode(false),
          { enableHighAccuracy: true },
        );
      }, 5000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isNavigatingMode, user?.id]);

  // ENGINE RUTE
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

  // BUKA GOOGLE MAPS EKSTERNAL
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
        setIsNavigatingMode(false);
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

      {/* WADAH UTAMA: Lebar penuh, bisa discroll jika content panjang */}
      <div className="w-full flex flex-col font-sans font-black uppercase tracking-tighter text-left bg-slate-50">
        {/* PANEL PENDAPATAN (Hanya di Mode Standar) */}
        {!isNavigatingMode && (
          <div className="shrink-0 bg-[#0F172A] px-4 py-3 flex items-center justify-between shadow-md z-10 border-b-2 border-slate-800">
            <div>
              <p className="text-[8px] text-[#FF6600] font-bold tracking-[0.2em] leading-none mb-1">
                UPAH ANTAR
              </p>
              <h2 className="text-[18px] text-white font-[1000] flex items-center gap-1.5 leading-none">
                <Coins size={18} className="text-[#FF6600]" />
                RP {(order?.shipping_cost || 0).toLocaleString()}
              </h2>
            </div>
            <div className="text-right">
              <p className="text-[8px] text-slate-400 font-bold tracking-[0.2em] leading-none mb-1">
                JARAK
              </p>
              <p className="text-white text-[14px] font-bold leading-none">
                {directions?.routes[0]?.legs[0]?.distance?.text || "..."}
              </p>
            </div>
          </div>
        )}

        {/* 🗺️ AREA PETA (MODE STANDAR & NAVIGASI) */}
        <div
          className={
            isNavigatingMode
              ? "fixed inset-0 z-[200] bg-slate-200"
              : "relative w-full h-[350px] shrink-0 bg-slate-200 border-b border-slate-200 shadow-inner"
          }
        >
          {isLoaded ? (
            <GoogleMap
              mapContainerStyle={{ width: "100%", height: "100%" }}
              center={mapCenter}
              zoom={isNavigatingMode ? 18 : 15}
              onLoad={(m) => setMapInstance(m)}
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

              {/* MARKER KURIR CUSTOM */}
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
                    scaledSize: new window.google.maps.Size(35, 35),
                    anchor: new window.google.maps.Point(17, 17),
                  }}
                />
              )}
            </GoogleMap>
          ) : (
            <div className="h-full w-full flex flex-col items-center justify-center gap-2">
              <Loader2 className="animate-spin text-[#008080]" size={32} />
              <p className="text-[10px] text-slate-500 font-bold">
                Menyiapkan Satelit...
              </p>
            </div>
          )}

          {/* 🚀 TOMBOL "MULAI NAVIGASI" (Mode Standar - Melayang di tengah bawah peta) */}
          {!isNavigatingMode && (
            <button
              onClick={startTracking}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-[#008080] text-white px-8 py-3.5 rounded-full text-[12px] font-[1000] tracking-widest shadow-[0_10px_30px_rgba(0,128,128,0.5)] border-2 border-white flex items-center gap-2 active:scale-95 transition-transform z-20"
            >
              <Navigation size={16} fill="white" /> MULAI NAVIGASI
            </button>
          )}

          {/* UI KHUSUS SAAT NAVIGASI FULLSCREEN AKTIF */}
          {isNavigatingMode && (
            <>
              {/* Header "Radar Aktif" */}
              <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-10 pointer-events-none">
                <div className="bg-slate-900/95 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10 shadow-2xl flex items-center gap-3 pointer-events-auto">
                  <div className="w-8 h-8 rounded-full bg-teal-500/20 flex items-center justify-center">
                    <Navigation
                      size={16}
                      className="text-teal-400 fill-teal-400 animate-pulse"
                    />
                  </div>
                  <div>
                    <p className="text-[#008080] text-[8px] font-black tracking-widest leading-none mb-1">
                      RADAR AKTIF
                    </p>
                    <p className="text-white text-[12px] font-[1000] leading-none">
                      {isPickingUp ? "MENUJU TOKO" : "MENUJU PEMBELI"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Tombol Pintasan Peta Kanan */}
              <div className="absolute right-4 bottom-[140px] flex flex-col gap-3 z-10">
                <button
                  onClick={handleOpenExternalMaps}
                  className="w-12 h-12 bg-white text-blue-600 rounded-full shadow-2xl flex items-center justify-center active:scale-90 border border-slate-200"
                >
                  <MapIcon size={20} />
                </button>
                <button
                  onClick={() =>
                    mapInstance?.panTo(currentPos || destinationPos)
                  }
                  className="w-12 h-12 bg-[#008080] text-white rounded-full shadow-2xl flex items-center justify-center active:scale-90 border-2 border-white"
                >
                  <Crosshair size={22} className="animate-pulse" />
                </button>
              </div>

              {/* Panel Aksi Bawah (Melayang Rapi) */}
              <div className="absolute bottom-6 left-4 right-4 bg-white/95 backdrop-blur-xl p-4 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.25)] border border-slate-100 flex flex-col gap-3 z-20">
                <div className="flex gap-3">
                  <button
                    onClick={() => setIsNavigatingMode(false)}
                    className="flex-1 bg-red-50 text-red-600 py-4 rounded-[1.5rem] text-[11px] font-black active:scale-95 transition-all border border-red-100"
                  >
                    TUTUP RADAR
                  </button>
                  <div className="flex-[2]">
                    {/* INLINE ACTION BUTTON UNTUK HINDARI ERROR TS */}
                    <button
                      onClick={handleStatusUpdate}
                      disabled={loading}
                      className={`w-full py-4 rounded-[1.5rem] text-white font-[1000] text-[12px] tracking-widest shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-all ${order.status === "SHIPPING" || order.status === "DELIVERING" ? "bg-[#008080] shadow-teal-900/30" : "bg-[#FF6600] shadow-orange-900/30"}`}
                    >
                      {loading ? (
                        <Loader2 className="animate-spin" size={18} />
                      ) : (
                        <CheckCircle size={18} strokeWidth={3} />
                      )}
                      {order.status === "SHIPPING" ||
                      order.status === "DELIVERING"
                        ? "KONFIRMASI TIBA"
                        : "BARANG DIAMBIL"}
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* 📜 PANEL DETAIL STANDAR (Ditampilkan berjejer di bawah peta) */}
        {!isNavigatingMode && (
          <div className="p-4 space-y-4 pb-10">
            <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-50 text-[#008080] flex items-center justify-center">
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
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm relative">
              <div className="absolute left-7 top-10 bottom-10 w-0.5 bg-slate-200"></div>

              {/* Toko */}
              <div
                className={`flex gap-3 relative z-10 mb-5 ${!isPickingUp ? "opacity-40 grayscale" : ""}`}
              >
                <div className="w-6 h-6 bg-[#FF6600] text-white rounded-full flex items-center justify-center shrink-0 border-2 border-white shadow-sm mt-0.5">
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
                      className="bg-orange-100 text-[#FF6600] p-2 rounded-xl active:scale-95"
                    >
                      <MessageSquare size={16} />
                    </button>
                  )}
                </div>
              </div>

              {/* Pembeli */}
              <div
                className={`flex gap-3 relative z-10 ${isPickingUp ? "opacity-40 grayscale" : ""}`}
              >
                <div className="w-6 h-6 bg-[#008080] text-white rounded-full flex items-center justify-center shrink-0 border-2 border-white shadow-sm mt-0.5">
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
                        className="bg-teal-100 text-[#008080] p-2 rounded-xl active:scale-95"
                      >
                        <MessageSquare size={16} />
                      </button>
                      <a
                        href={`tel:${order.profiles?.phone_number}`}
                        className="bg-slate-100 text-slate-700 p-2 rounded-xl active:scale-95"
                      >
                        <Phone size={16} />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Tombol Aksi Utama */}
            {!isCompleted && !isCanceled && (
              <div>
                {order.status === "PACKING" ? (
                  <div className="w-full py-4 bg-slate-200 text-slate-500 rounded-2xl font-black text-center text-[11px] shadow-inner">
                    TOKO SEDANG MENGEMAS...
                  </div>
                ) : (
                  <button
                    onClick={handleStatusUpdate}
                    disabled={loading}
                    className={`w-full py-5 rounded-[1.5rem] text-white font-[1000] text-[13px] tracking-widest shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-all ${order.status === "SHIPPING" || order.status === "DELIVERING" ? "bg-[#008080] shadow-teal-900/30" : "bg-[#FF6600] shadow-orange-900/30"}`}
                  >
                    {loading ? (
                      <Loader2 className="animate-spin" size={18} />
                    ) : (
                      <CheckCircle size={20} strokeWidth={3} />
                    )}
                    {order.status === "SHIPPING" ||
                    order.status === "DELIVERING"
                      ? "KONFIRMASI TIBA!"
                      : "BARANG SUDAH DIAMBIL"}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default CourierActiveOrder;
