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
} from "lucide-react";

import { OrderChatRoom } from "../../../features/chat/OrderChatRoom";

const GOOGLE_MAPS_LIBRARIES: ("places" | "routes" | "geometry" | "drawing")[] =
  ["places", "routes", "geometry", "drawing"];

// 🚀 IKON CUSTOM SUPER PRO (Helm + Motor + Keranjang)
const ICONS = {
  courier: "https://cdn-icons-png.flaticon.com/512/4819/4819129.png", // 🛵🪖🧺 Ikon Motor + Keranjang
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

  // 🚀 LOGIKA SAPU JAGAT: CARI KOORDINAT SAMPAI DAPAT
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
  }, [order?.status, user?.id]);

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

  // 3. TOMBOL ARAHKAN KE GOOGLE MAPS HP
  const handleOpenGoogleMaps = () => {
    if (!destLat || !destLng) {
      showToast(
        isPickingUp
          ? "Lokasi Toko Belum Disetting!"
          : "Lokasi Pembeli Belum Disetting!",
        "error",
      );
      return;
    }

    let url = `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}&travelmode=driving`;

    if (currentPos?.lat && currentPos?.lng) {
      url = `https://www.google.com/maps/dir/?api=1&origin=${currentPos.lat},${currentPos.lng}&destination=${destLat},${destLng}&travelmode=driving`;
    }

    window.open(url, "_blank");
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

  return (
    <>
      {showChat &&
        createPortal(
          <div className="fixed inset-0 z-[999999] bg-white md:bg-slate-900/80 backdrop-blur-sm flex justify-center">
            <div className="w-full max-w-[480px] flex flex-col h-[100dvh] bg-white overflow-hidden shadow-2xl relative animate-in slide-in-from-bottom-8">
              <div className="p-4 flex justify-between items-center bg-[#008080] text-white shrink-0 shadow-sm">
                <div className="flex items-center gap-3 ml-2">
                  <div className="w-2 h-2 rounded-full bg-teal-300 animate-pulse"></div>
                  <div>
                    <h3 className="text-[14px] leading-none font-black uppercase">
                      {chatTarget.name}
                    </h3>
                    <p className="text-[9px] text-teal-200 tracking-widest mt-1 uppercase">
                      Sinyal Terhubung
                    </p>
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
        {/* 🗺️ VISUAL PETA PRO */}
        <div className="h-[250px] w-full bg-slate-200 rounded-xl overflow-hidden relative shadow-md border-2 border-white">
          {isLoaded ? (
            <GoogleMap
              mapContainerStyle={{ width: "100%", height: "100%" }}
              center={
                currentPos || {
                  lat: destLat || -0.8327,
                  lng: destLng || 117.2476,
                }
              }
              zoom={15}
              options={{ disableDefaultUI: true, gestureHandling: "greedy" }}
            >
              {directions && (
                <DirectionsRenderer
                  directions={directions}
                  options={{
                    suppressMarkers: true,
                    polylineOptions: {
                      strokeColor: "#008080",
                      strokeWeight: 5,
                      strokeOpacity: 0.8,
                    },
                  }}
                />
              )}

              {/* 🛵 POSISI KURIR (DIPERBESAR AGAR HELM & KERANJANG KELIHATAN) */}
              {currentPos && (
                <MarkerF
                  position={currentPos}
                  icon={{
                    url: ICONS.courier,
                    scaledSize: new window.google.maps.Size(55, 55), // Diperbesar ke 55px
                    anchor: new window.google.maps.Point(27.5, 27.5),
                  }}
                  zIndex={999}
                />
              )}

              {/* 🏠/🏢 POSISI TUJUAN */}
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
              <Loader2 className="animate-spin text-slate-400 mb-2" size={24} />
              <span className="text-[10px] text-slate-400">
                MEMUAT RADAR...
              </span>
            </div>
          )}

          <button
            onClick={handleOpenGoogleMaps}
            className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-5 py-2.5 rounded-full text-[10px] font-[1000] tracking-widest shadow-xl flex items-center gap-2 active:scale-95 transition-all border-2 border-slate-700"
          >
            <Navigation size={14} className="text-[#008080]" /> ARAHKAN RUTE
          </button>
        </div>

        {/* STATUS BAR */}
        <div
          className={`p-4 rounded-xl flex justify-between items-center shadow-sm border-l-4 ${isCompleted ? "bg-slate-200 border-slate-400" : isCanceled ? "bg-red-50 border-red-500" : "bg-white border-[#008080]"}`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md flex items-center justify-center bg-teal-50 text-[#008080]">
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <Truck size={20} />
              )}
            </div>
            <div>
              <h2 className="text-[14px] leading-none">
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

        {/* INFO LOKASI */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div
            className={`flex gap-3 p-3 rounded-lg border ${isPickingUp ? "bg-orange-50 border-orange-200" : "bg-slate-50 border-slate-100"}`}
          >
            <div className="w-8 h-8 bg-white text-[#FF6600] rounded-md flex items-center justify-center shrink-0 border border-slate-200">
              <Store size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[8px] text-orange-500">TITIK JEMPUT (TOKO)</p>
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
                className="mt-2 flex items-center justify-center w-full gap-2 py-2 bg-white border border-orange-200 text-[#FF6600] rounded-md text-[9px] font-black active:scale-95"
              >
                <MessageSquare size={12} /> CHAT MERCHANT
              </button>
            </div>
          </div>

          <div
            className={`flex gap-3 p-3 rounded-lg border ${!isPickingUp && !isCompleted ? "bg-teal-50 border-teal-200" : "bg-slate-50 border-slate-100"}`}
          >
            <div className="w-8 h-8 bg-white text-[#008080] rounded-md flex items-center justify-center shrink-0 border border-slate-200">
              <MapPin size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[8px] text-teal-600">TITIK ANTAR (PEMBELI)</p>
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

        {/* TOMBOL AKSI */}
        {!isCompleted && !isCanceled && (
          <>
            {order.status === "PACKING" ? (
              <div className="w-full py-4 bg-slate-200 text-slate-500 rounded-xl font-[1000] uppercase text-[11px] flex items-center justify-center gap-2">
                <Loader2 className="animate-spin" size={16} /> MENUNGGU TOKO...
              </div>
            ) : (
              <button
                onClick={handleStatusUpdate}
                disabled={loading}
                className={`w-full py-4 text-white rounded-xl font-[1000] uppercase text-[13px] shadow-xl active:scale-95 flex items-center justify-center gap-2 transition-all ${order.status === "SHIPPING" || order.status === "DELIVERING" ? "bg-[#008080]" : "bg-[#FF6600]"}`}
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <CheckCircle size={18} strokeWidth={3} />
                )}
                {order.status === "SHIPPING" || order.status === "DELIVERING"
                  ? "KONFIRMASI TIBA!"
                  : "AMBIL BARANG"}
              </button>
            )}
          </>
        )}
      </div>
    </>
  );
};

export default CourierActiveOrder;
