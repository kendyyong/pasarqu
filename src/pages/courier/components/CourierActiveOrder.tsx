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
  Coins,
} from "lucide-react";

import { OrderChatRoom } from "../../../features/chat/OrderChatRoom";

const GOOGLE_MAPS_LIBRARIES: ("places" | "routes" | "geometry" | "drawing")[] =
  ["places", "routes", "geometry", "drawing"];

const DEFAULT_CENTER = { lat: -0.8327, lng: 117.2476 };

const ICONS = {
  courier: "https://cdn-icons-png.flaticon.com/512/10484/10484347.png",
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

  const { isLoaded } = useJsApiLoader({
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

  useEffect(() => {
    const isActiveDelivery = [
      "SHIPPING",
      "DELIVERING",
      "PICKING_UP",
      "READY_TO_PICKUP",
    ].includes(order?.status);
    if (isActiveDelivery && user?.id) {
      const interval = setInterval(() => {
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            const newPos = { lat: latitude, lng: longitude };
            setCurrentPos(newPos);
            if (isNavigatingMode && mapInstance) mapInstance.panTo(newPos);
            await supabase
              .from("profiles")
              .update({ latitude, longitude })
              .eq("id", user.id);
          },
          (error) => console.error(error),
          { enableHighAccuracy: true, timeout: 10000 },
        );
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [order?.status, user?.id, isNavigatingMode, mapInstance]);

  useEffect(() => {
    if (!isLoaded || !currentPos || !destLat || !destLng || destLat === 0)
      return;
    const directionsService = new window.google.maps.DirectionsService();
    directionsService.route(
      {
        origin: new window.google.maps.LatLng(currentPos.lat, currentPos.lng),
        destination: new window.google.maps.LatLng(destLat, destLng),
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (res, status) => {
        if (status === window.google.maps.DirectionsStatus.OK)
          setDirections(res);
      },
    );
  }, [isLoaded, currentPos, destLat, destLng]);

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
        const { error: rpcError } = await supabase.rpc(
          "complete_order_transaction",
          { p_order_id: order.id },
        );
        if (rpcError) throw rpcError;
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

  // 🚀 FUNGSI WRAPPER UNTUK FIX TYPESCRIPT VOID ERROR
  const handleOpenChat = (type: string, name: string, receiverId: string) => {
    setChatTarget({ type, name, receiverId });
    setShowChat(true);
  };

  return (
    <>
      {showChat &&
        createPortal(
          <div className="fixed inset-0 z-[999999] bg-white flex justify-center">
            <div className="w-full max-w-[480px] flex flex-col h-full">
              <div className="p-4 flex justify-between items-center bg-[#008080] text-white shrink-0">
                <h3 className="text-[14px] font-black uppercase">
                  {chatTarget.name}
                </h3>
                <button onClick={() => setShowChat(false)}>
                  <X size={24} />
                </button>
              </div>
              <div className="flex-1 relative overflow-hidden bg-slate-50">
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

      <div className="flex flex-col h-full overflow-y-auto no-scrollbar font-sans font-black uppercase tracking-tighter text-left bg-slate-50">
        {!isNavigatingMode && (
          <div className="shrink-0 bg-[#0F172A] p-4 flex items-center justify-between border-b border-white/5">
            <div>
              <p className="text-[9px] text-[#FF6600] font-bold tracking-[0.2em] mb-1">
                UPAH ANTAR
              </p>
              <h2 className="text-xl text-white font-[1000] flex items-center gap-2">
                <Coins size={18} className="text-[#FF6600]" />
                RP {(order?.shipping_cost || 0).toLocaleString()}
              </h2>
            </div>
            <div className="text-right">
              <p className="text-[9px] text-slate-400 font-bold tracking-[0.2em] mb-1">
                JARAK
              </p>
              <p className="text-white text-sm font-bold">
                {directions?.routes[0]?.legs[0]?.distance?.text || "..."}
              </p>
            </div>
          </div>
        )}

        <div
          className={`relative shrink-0 w-full transition-all duration-500 ${isNavigatingMode ? "fixed inset-0 z-[999] h-full" : "h-[450px] border-b-2 border-slate-200"}`}
        >
          {isLoaded ? (
            <GoogleMap
              mapContainerStyle={{ width: "100%", height: "100%" }}
              center={currentPos || { lat: destLat, lng: destLng }}
              zoom={isNavigatingMode ? 18 : 16}
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
              {currentPos && (
                <MarkerF
                  position={currentPos}
                  icon={{
                    url: ICONS.courier,
                    scaledSize: new window.google.maps.Size(54, 54),
                    anchor: new window.google.maps.Point(27, 27),
                  }}
                  zIndex={99}
                />
              )}
              {destLat !== 0 && (
                <MarkerF
                  position={{ lat: destLat, lng: destLng }}
                  icon={{
                    url: isPickingUp ? ICONS.store : ICONS.home,
                    scaledSize: new window.google.maps.Size(38, 38),
                    anchor: new window.google.maps.Point(19, 19),
                  }}
                />
              )}
            </GoogleMap>
          ) : (
            <div className="h-full w-full bg-slate-100 flex items-center justify-center animate-pulse">
              <Loader2 className="animate-spin text-[#008080]" />
            </div>
          )}

          {isNavigatingMode ? (
            <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 pt-12 pb-10">
              <div className="w-full flex justify-between items-start pointer-events-auto">
                <div className="bg-slate-900/90 backdrop-blur-xl px-4 py-2.5 rounded-2xl border border-white/10 shadow-2xl flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-teal-500/20 flex items-center justify-center">
                    <Navigation
                      size={16}
                      className="text-teal-400 fill-teal-400 animate-pulse"
                    />
                  </div>
                  <div>
                    <p className="text-[#008080] text-[8px] font-black tracking-widest leading-none mb-1">
                      NAVIGASI AKTIF
                    </p>
                    <p className="text-white text-[12px] font-black">
                      {isPickingUp ? "MENUJU TOKO" : "MENUJU PEMBELI"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsNavigatingMode(false)}
                  className="bg-red-500 text-white p-2.5 rounded-full border-2 border-white shadow-xl active:scale-90"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="w-full flex flex-col gap-3 pointer-events-auto">
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => mapInstance?.panTo(currentPos!)}
                    className="bg-white text-[#008080] p-3.5 rounded-full shadow-2xl active:scale-90 border border-slate-200"
                  >
                    <Crosshair size={22} />
                  </button>
                </div>
                <div className="bg-white/95 backdrop-blur-md p-3 rounded-[2rem] shadow-2xl border border-slate-200">
                  <ActionButton
                    onClick={handleStatusUpdate}
                    loading={loading}
                    status={order.status}
                  />
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsNavigatingMode(true)}
              className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-[#008080] text-white px-8 py-3 rounded-full text-[11px] shadow-2xl border-2 border-white flex items-center gap-2 active:scale-90 transition-all z-20"
            >
              <Navigation size={16} fill="white" /> MULAI NAVIGASI
            </button>
          )}
        </div>

        {!isNavigatingMode && (
          <div className="flex-1 p-4 space-y-4 bg-slate-50 pb-32">
            <div className="bg-white p-4 rounded-[1.5rem] border border-slate-200 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-teal-50 p-2.5 rounded-xl text-[#008080]">
                  <Truck size={22} />
                </div>
                <div>
                  <h3 className="text-[14px] font-black text-slate-800 leading-none">
                    {order.status?.replace(/_/g, " ")}
                  </h3>
                  <p className="text-[9px] text-slate-400 mt-1 font-bold">
                    ID: #{order.id?.slice(0, 8)}
                  </p>
                </div>
              </div>
              {/* 🚀 FIX TYPESCRIPT ERROR DI SINI */}
              <button
                onClick={() =>
                  handleOpenChat(
                    "courier_customer",
                    order.profiles?.full_name || "Pelanggan",
                    order.customer_id,
                  )
                }
                className="w-11 h-11 bg-[#008080] text-white rounded-full flex items-center justify-center shadow-lg"
              >
                <MessageCircle size={20} />
              </button>
            </div>

            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
              <div
                className={`p-5 flex gap-4 ${isPickingUp ? "bg-orange-50/40" : ""}`}
              >
                <Store size={20} className="text-[#FF6600]" />
                <div className="min-w-0 flex-1">
                  <p className="text-[8px] font-black text-orange-500">
                    TITIK JEMPUT (TOKO)
                  </p>
                  <h4 className="text-[13px] font-black text-slate-800 mt-1">
                    {order.merchants?.shop_name || "TOKO MITRA"}
                  </h4>
                  {/* 🚀 FIX TYPESCRIPT ERROR DI SINI */}
                  <button
                    onClick={() =>
                      handleOpenChat(
                        "courier_merchant",
                        order.merchants?.shop_name || "Toko",
                        order.merchants?.user_id || order.merchant_id,
                      )
                    }
                    className="mt-3 text-[10px] text-[#FF6600] flex items-center gap-1 font-black"
                  >
                    <MessageSquare size={12} /> HUBUNGI TOKO
                  </button>
                </div>
              </div>
              <div
                className={`p-5 flex gap-4 ${!isPickingUp ? "bg-teal-50/40" : ""}`}
              >
                <MapPin size={20} className="text-[#008080]" />
                <div className="min-w-0 flex-1">
                  <p className="text-[8px] font-black text-teal-600">
                    TITIK ANTAR (PEMBELI)
                  </p>
                  <h4 className="text-[13px] font-black text-slate-800 mt-1">
                    {order.profiles?.full_name || "PEMBELI PASARQU"}
                  </h4>
                  <div className="flex gap-2 mt-3">
                    {/* 🚀 FIX TYPESCRIPT ERROR DI SINI */}
                    <button
                      onClick={() =>
                        handleOpenChat(
                          "courier_customer",
                          order.profiles?.full_name || "Pelanggan",
                          order.customer_id,
                        )
                      }
                      className="flex-1 bg-[#008080] text-white py-2.5 rounded-xl text-[10px] font-black"
                    >
                      CHAT
                    </button>
                    <a
                      href={`tel:${order.profiles?.phone_number}`}
                      className="w-12 bg-white border-2 border-slate-200 text-slate-600 rounded-xl flex items-center justify-center shadow-sm"
                    >
                      <Phone size={16} />
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {!isCompleted && !isCanceled && (
              <div className="pt-2">
                {order.status === "PACKING" ? (
                  <div className="w-full py-5 bg-slate-200 text-slate-500 rounded-[1.5rem] text-center text-[11px] border-2 border-dashed border-slate-300">
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
    className={`w-full py-5 rounded-[1.5rem] text-white font-[1000] text-[13px] tracking-widest shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all ${status === "SHIPPING" || status === "DELIVERING" ? "bg-[#008080]" : "bg-[#FF6600]"}`}
  >
    {loading ? (
      <Loader2 className="animate-spin" />
    ) : (
      <CheckCircle size={22} strokeWidth={3} />
    )}
    {status === "SHIPPING" || status === "DELIVERING"
      ? "KONFIRMASI TIBA!"
      : "SAYA SUDAH AMBIL BARANG"}
  </button>
);

export default CourierActiveOrder;
