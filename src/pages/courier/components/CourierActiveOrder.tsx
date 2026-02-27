import React, { useState, useEffect } from "react";
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
  ExternalLink,
} from "lucide-react";

import { OrderChatRoom } from "../../../features/chat/OrderChatRoom";

const GOOGLE_MAPS_LIBRARIES: ("places" | "routes" | "geometry" | "drawing")[] =
  ["places", "routes", "geometry", "drawing"];

// 🚀 IKON MOTOR ORANYE SUPER JELAS (Diupdate!)
const ICONS = {
  // Ikon kurir motor warna Oranye dengan kotak Box di belakang
  courier: "https://cdn-icons-png.flaticon.com/512/5696/5696184.png",
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

  // 🚀 STATE NAVIGASI FULLSCREEN
  const [isNavigatingMode, setIsNavigatingMode] = useState(false);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);

  const [currentPos, setCurrentPos] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [directions, setDirections] = useState<any>(null);

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  const [chatTarget, setChatTarget] = useState<{
    type: "courier_customer" | "courier_merchant";
    name: string;
    receiverId: string;
  }>({ type: "courier_customer", name: "Pelanggan", receiverId: "" });

  const isCompleted = order?.status === "COMPLETED";
  const isCanceled = order?.status === "CANCELLED";
  const isPickingUp =
    order?.status === "READY_TO_PICKUP" || order?.status === "PICKING_UP";

  const storeLat = order?.merchants?.latitude || order?.merchant?.latitude;
  const storeLng = order?.merchants?.longitude || order?.merchant?.longitude;
  const buyerLat =
    order?.delivery_lat || order?.profiles?.latitude || order?.latitude;
  const buyerLng =
    order?.delivery_lng || order?.profiles?.longitude || order?.longitude;

  const destLat = isPickingUp ? storeLat : buyerLat;
  const destLng = isPickingUp ? storeLng : buyerLng;

  // 1. ENGINE GPS TRACKER
  useEffect(() => {
    const isActiveDelivery =
      order?.status === "SHIPPING" ||
      order?.status === "DELIVERING" ||
      order?.status === "PICKING_UP" ||
      order?.status === "READY_TO_PICKUP";

    if (isActiveDelivery && user?.id) {
      const interval = setInterval(() => {
        if (!navigator.geolocation) return;

        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            setCurrentPos({ lat: latitude, lng: longitude });

            // Jika dalam mode navigasi, otomatis pusatkan peta ke motor
            if (isNavigatingMode && mapInstance) {
              mapInstance.panTo({ lat: latitude, lng: longitude });
            }

            await supabase
              .from("profiles")
              .update({ latitude, longitude })
              .eq("id", user.id);
          },
          (error) => console.error("GPS Error:", error),
          { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 },
        );
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [order?.status, user?.id, isNavigatingMode, mapInstance]);

  // 2. ENGINE PENCARI RUTE (DIRECTIONS)
  useEffect(() => {
    if (!isLoaded || !currentPos || !destLat || !destLng) return;
    const directionsService = new window.google.maps.DirectionsService();

    directionsService.route(
      {
        origin: new window.google.maps.LatLng(currentPos.lat, currentPos.lng),
        destination: new window.google.maps.LatLng(destLat, destLng),
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (res, status) => {
        if (status === window.google.maps.DirectionsStatus.OK) {
          setDirections(res);
        }
      },
    );
  }, [isLoaded, currentPos, destLat, destLng]);

  // 3. FUNGSI LEMPAR KE APLIKASI NATIVE (OPSIONAL JIKA KURIR MAU)
  const handleOpenExternalMaps = () => {
    if (!destLat || !destLng)
      return showToast("Koordinat belum lengkap!", "error");

    let url = `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}&travelmode=driving`;
    if (currentPos?.lat && currentPos?.lng) {
      url = `https://www.google.com/maps/dir/?api=1&origin=${currentPos.lat},${currentPos.lng}&destination=${destLat},${destLng}&travelmode=driving`;
    }
    window.location.href = url;
  };

  const handleStatusUpdate = async () => {
    if (!order?.id) return;
    setLoading(true);

    try {
      let nextStatus = "";
      let toastMsg = "";

      if (order.status === "PACKING") {
        showToast("TUNGGU TOKO SELESAI BUNGKUS!", "error");
        setLoading(false);
        return;
      }
      if (order.status === "READY_TO_PICKUP" || order.status === "PICKING_UP") {
        nextStatus = "SHIPPING";
        toastMsg = "STATUS: MENUJU LOKASI PEMBELI 🛵💨";
      } else if (order.status === "SHIPPING" || order.status === "DELIVERING") {
        nextStatus = "COMPLETED";
      }

      if (nextStatus === "COMPLETED") {
        const { error: rpcError } = await supabase.rpc(
          "complete_order_transaction",
          { p_order_id: order.id },
        );
        if (rpcError) throw rpcError;
        await supabase
          .from("orders")
          .update({ status: "COMPLETED", shipping_status: "COMPLETED" })
          .eq("id", order.id);
        showToast("TUGAS SELESAI! SALDO CAIR! 💰", "success");
        setIsNavigatingMode(false); // Keluar navigasi saat selesai
      } else if (nextStatus !== "") {
        const { error } = await supabase
          .from("orders")
          .update({ status: nextStatus, shipping_status: nextStatus })
          .eq("id", order.id);
        if (error) throw error;
        showToast(toastMsg, "success");
      }
      onFinished();
    } catch (err: any) {
      showToast(err.message || "Gagal update status", "error");
    } finally {
      setLoading(false);
    }
  };

  const openChat = (
    type: "courier_customer" | "courier_merchant",
    name: string,
    receiverId: string,
  ) => {
    if (!receiverId) return showToast("ID TUJUAN TIDAK DITEMUKAN!", "error");
    setChatTarget({ type, name, receiverId });
    setShowChat(true);
  };

  // KOMPONEN TOMBOL AKSI (Bisa dipanggil di 2 tempat berbeda)
  const ActionButton = () => (
    <>
      {order.status === "PACKING" ? (
        <div className="w-full py-4 bg-slate-200 text-slate-500 rounded-xl font-[1000] uppercase text-[11px] shadow-inner flex items-center justify-center gap-2">
          <Loader2 className="animate-spin" size={16} /> MENUNGGU BUNGKUSAN
          TOKO...
        </div>
      ) : (
        <button
          onClick={handleStatusUpdate}
          disabled={loading}
          className={`w-full py-4 text-white rounded-xl font-[1000] uppercase text-[13px] shadow-xl active:scale-95 flex items-center justify-center gap-2 transition-all ${
            order.status === "SHIPPING" || order.status === "DELIVERING"
              ? "bg-[#008080] hover:bg-teal-700 shadow-teal-900/30"
              : "bg-[#FF6600] hover:bg-orange-600 shadow-orange-900/30"
          }`}
        >
          {loading ? (
            <Loader2 className="animate-spin" size={18} />
          ) : (
            <CheckCircle size={18} strokeWidth={3} />
          )}
          {order.status === "SHIPPING" || order.status === "DELIVERING"
            ? "KONFIRMASI TIBA!"
            : "SAYA SUDAH AMBIL BARANG"}
        </button>
      )}
    </>
  );

  return (
    <>
      {showChat &&
        createPortal(
          <div className="fixed inset-0 z-[999999] bg-white md:bg-slate-900/80 backdrop-blur-sm flex justify-center">
            <div className="w-full max-w-[480px] flex flex-col h-[100dvh] bg-white overflow-hidden shadow-2xl animate-in slide-in-from-bottom-8">
              <div className="p-4 flex justify-between items-center bg-[#008080] text-white shrink-0 shadow-sm">
                <div className="flex items-center gap-3 ml-2">
                  <div className="w-2 h-2 rounded-full bg-teal-300 animate-pulse"></div>
                  <div>
                    <h3 className="text-[14px] leading-none font-black uppercase">
                      {chatTarget.name}
                    </h3>
                  </div>
                </div>
                <button
                  onClick={() => setShowChat(false)}
                  className="w-10 h-10 hover:bg-teal-700 rounded-full flex items-center justify-center transition-all"
                >
                  <X size={24} strokeWidth={3} />
                </button>
              </div>
              <div className="flex-1 w-full bg-slate-50 relative overflow-hidden flex flex-col">
                <OrderChatRoom
                  orderId={order.id}
                  receiverId={chatTarget.receiverId}
                  receiverName={chatTarget.name}
                  chatType={chatTarget.type}
                />
              </div>
            </div>
          </div>,
          document.body,
        )}

      <div className="space-y-4 animate-in slide-in-from-bottom-4 text-left font-black uppercase tracking-tighter pb-4">
        {/* 🗺️ VISUAL PETA (Bisa Mode Mini atau Mode Fullscreen) */}
        <div
          className={
            isNavigatingMode
              ? "fixed inset-0 z-[9999] bg-slate-100 flex flex-col animate-in zoom-in-95 duration-300"
              : "h-[250px] w-full bg-slate-200 rounded-xl overflow-hidden relative shadow-md border-2 border-white transition-all duration-300"
          }
        >
          {/* HEADER OVERLAY SAAT NAVIGASI FULLSCREEN */}
          {isNavigatingMode && (
            <div className="absolute top-0 left-0 w-full p-4 z-10 pointer-events-none flex justify-between items-start pt-safe-top">
              <div className="bg-slate-900/90 backdrop-blur-md px-4 py-2.5 rounded-2xl pointer-events-auto border border-white/10 shadow-2xl flex flex-col gap-1">
                <h3 className="text-[#008080] text-[10px] font-black tracking-widest flex items-center gap-1">
                  <div className="w-2 h-2 bg-teal-500 rounded-full animate-ping"></div>{" "}
                  NAVIGASI AKTIF
                </h3>
                <p className="text-white text-[13px] font-bold">
                  Menuju:{" "}
                  {isPickingUp
                    ? order.merchants?.shop_name || "Toko"
                    : order.profiles?.full_name || "Pembeli"}
                </p>
              </div>
              <button
                onClick={() => setIsNavigatingMode(false)}
                className="bg-red-500 text-white p-3 rounded-full pointer-events-auto shadow-lg active:scale-90 border-2 border-white"
              >
                <X size={20} strokeWidth={4} />
              </button>
            </div>
          )}

          {isLoaded ? (
            <GoogleMap
              mapContainerStyle={{ width: "100%", height: "100%" }}
              center={
                currentPos || {
                  lat: destLat || -0.8327,
                  lng: destLng || 117.2476,
                }
              }
              zoom={isNavigatingMode ? 18 : 15}
              onLoad={(map) => setMapInstance(map)}
              options={{
                disableDefaultUI: true,
                gestureHandling: "greedy",
                zoomControl: isNavigatingMode,
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

              {/* 🚀 MOTOR ORANYE (DIPERBESAR JADI 64x64 BIAR GAGAH!) */}
              {currentPos && (
                <MarkerF
                  position={currentPos}
                  icon={{
                    url: ICONS.courier,
                    scaledSize: new window.google.maps.Size(64, 64),
                    anchor: new window.google.maps.Point(32, 32),
                  }}
                  zIndex={999}
                />
              )}

              {destLat && (
                <MarkerF
                  position={{ lat: destLat, lng: destLng }}
                  icon={{
                    url: isPickingUp ? ICONS.store : ICONS.home,
                    scaledSize: new window.google.maps.Size(35, 35),
                  }}
                />
              )}
            </GoogleMap>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100">
              <Loader2 className="animate-spin text-[#008080] mb-2" size={24} />
            </div>
          )}

          {/* TOMBOL OVERLAY BAWAH PETA */}
          {!isNavigatingMode ? (
            <button
              onClick={() => setIsNavigatingMode(true)}
              className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-5 py-2.5 rounded-full text-[10px] font-[1000] tracking-widest shadow-xl flex items-center gap-2 active:scale-95 transition-all border-2 border-slate-700 hover:bg-slate-800"
            >
              <Navigation size={14} className="text-[#008080]" /> MULAI NAVIGASI
            </button>
          ) : (
            <>
              <button
                onClick={() =>
                  mapInstance?.panTo(
                    currentPos || { lat: destLat, lng: destLng },
                  )
                }
                className="absolute right-4 bottom-32 bg-white text-slate-800 p-3 rounded-full shadow-2xl border border-slate-200 active:scale-90"
              >
                <Crosshair size={24} className="text-[#008080]" />
              </button>

              <button
                onClick={handleOpenExternalMaps}
                className="absolute left-4 bottom-32 bg-slate-900 text-white p-3 rounded-full shadow-2xl border border-slate-700 active:scale-90"
              >
                <ExternalLink size={20} className="text-slate-300" />
              </button>

              <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-slate-900/90 to-transparent pb-8 pt-10">
                <ActionButton />
              </div>
            </>
          )}
        </div>

        {/* BAGIAN BAWAH SEMBUNYI SAAT FULLSCREEN */}
        {!isNavigatingMode && (
          <>
            <div
              className={`p-4 rounded-xl flex justify-between items-center shadow-sm transition-all border-l-4 ${isCompleted ? "bg-slate-200 border-slate-400" : isCanceled ? "bg-red-50 border-red-500" : "bg-white border-[#008080]"}`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-md flex items-center justify-center shadow-inner bg-teal-50 text-[#008080]">
                  {loading ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    <Truck size={20} />
                  )}
                </div>
                <div>
                  <h2 className="text-[14px] leading-none text-slate-800">
                    {isCompleted
                      ? "SELESAI"
                      : isCanceled
                        ? "DIBATALKAN"
                        : order.status?.replace(/_/g, " ")}
                  </h2>
                  <p className="text-[9px] text-slate-400 mt-1">
                    ID: #{order.id?.slice(0, 8)}
                  </p>
                </div>
              </div>
              <button
                onClick={() =>
                  openChat(
                    "courier_customer",
                    order.profiles?.full_name || "Pelanggan",
                    order.customer_id,
                  )
                }
                className="w-10 h-10 rounded-full bg-[#008080] text-white shadow-md flex items-center justify-center active:scale-95"
              >
                <MessageCircle size={18} />
              </button>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <div
                className={`flex gap-3 p-3 rounded-lg border ${isPickingUp ? "bg-orange-50 border-orange-200" : "bg-slate-50 border-slate-100"}`}
              >
                <div className="w-8 h-8 bg-white text-[#FF6600] rounded-md flex items-center justify-center shrink-0 border border-slate-200 shadow-sm">
                  <Store size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[8px] text-orange-500">
                    TITIK JEMPUT (TOKO)
                  </p>
                  <h4 className="font-[1000] text-slate-800 text-[11px] truncate mt-1">
                    {order.merchants?.shop_name ||
                      order.merchant?.shop_name ||
                      "TOKO MITRA"}
                  </h4>
                  <button
                    onClick={() =>
                      openChat(
                        "courier_merchant",
                        order.merchants?.shop_name ||
                          order.merchant?.shop_name ||
                          "Toko",
                        order.merchants?.user_id ||
                          order.merchant?.user_id ||
                          order.merchant_id,
                      )
                    }
                    className="mt-2 flex items-center justify-center w-full gap-2 py-2 bg-white border border-orange-200 text-[#FF6600] rounded-md text-[9px] font-black hover:bg-orange-100 transition-all"
                  >
                    <MessageSquare size={12} /> CHAT MERCHANT
                  </button>
                </div>
              </div>

              <div
                className={`flex gap-3 p-3 rounded-lg border ${!isPickingUp && !isCompleted ? "bg-teal-50 border-teal-200" : "bg-slate-50 border-slate-100"}`}
              >
                <div className="w-8 h-8 bg-white text-[#008080] rounded-md flex items-center justify-center shrink-0 border border-slate-200 shadow-sm">
                  <MapPin size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[8px] text-teal-600">
                    TITIK ANTAR (PEMBELI)
                  </p>
                  <h4 className="font-[1000] text-slate-900 text-[11px] truncate mt-1">
                    {order.profiles?.full_name || "PEMBELI PASARQU"}
                  </h4>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() =>
                        openChat(
                          "courier_customer",
                          order.profiles?.full_name || "Pelanggan",
                          order.customer_id,
                        )
                      }
                      className="flex-1 py-2 bg-[#008080] text-white rounded-md text-[9px] flex items-center justify-center gap-2 active:scale-95"
                    >
                      <MessageSquare size={12} /> CHAT
                    </button>
                    <a
                      href={`tel:${order.profiles?.phone_number}`}
                      className="w-10 bg-white border border-slate-200 text-slate-600 rounded-md flex items-center justify-center active:scale-95 shadow-sm"
                    >
                      <Phone size={14} />
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {!isCompleted && !isCanceled && <ActionButton />}
          </>
        )}
      </div>
    </>
  );
};

export default CourierActiveOrder;
