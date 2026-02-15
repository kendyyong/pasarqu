import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { GoogleMap, useJsApiLoader, Marker } from "@react-google-maps/api";
import { supabase } from "../../lib/supabaseClient";
import {
  ArrowLeft,
  MessageSquare,
  X,
  Loader2,
  Truck,
  MapPin,
  Headset,
  Bike,
  Store,
  MessageCircle,
  ChevronRight,
  ShieldCheck,
  Phone,
  Info,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { OrderChatRoom } from "../../components/Chat/OrderChatRoom";
import { useToast } from "../../contexts/ToastContext";

const mapContainerStyle = {
  width: "100%",
  height: "200px",
  borderRadius: "2rem",
};

export const OrderTrackingPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatType, setChatType] = useState<
    "merchant_customer" | "courier_customer"
  >("merchant_customer");

  // State untuk data kurir real-time (koordinat)
  const [courierLoc, setCourierLoc] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
  });

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) return;
      try {
        const { data, error } = await supabase
          .from("orders")
          .select(
            `
            *, 
            merchants:merchant_id(shop_name), 
            markets:market_id(latitude, longitude, name),
            couriers:courier_id(full_name, phone_number, vehicle_plate, current_lat, current_lng),
            profiles:customer_id(latitude, longitude)
          `,
          )
          .eq("id", orderId)
          .single();

        if (error) throw error;
        if (data) {
          setOrder(data);
          if (data.couriers?.current_lat) {
            setCourierLoc({
              lat: data.couriers.current_lat,
              lng: data.couriers.current_lng,
            });
          }
        }
      } catch (err) {
        console.error("Tracking fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();

    // 1. Langganan Perubahan Status Order
    const orderChannel = supabase
      .channel(`order_updates_${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          setOrder((prev: any) => ({ ...prev, ...payload.new }));
        },
      )
      .subscribe();

    // 2. Langganan Pergerakan Kurir (GPS Real-time)
    const courierChannel = supabase
      .channel(`courier_loc_${orderId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles" },
        (payload) => {
          if (order?.courier_id === payload.new.id) {
            setCourierLoc({
              lat: payload.new.current_lat,
              lng: payload.new.current_lng,
            });
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(orderChannel);
      supabase.removeChannel(courierChannel);
    };
  }, [orderId, order?.courier_id]);

  // --- FUNGSI KONFIRMASI PEMBELI (PENERIMAAN BARANG & SPLIT DANA) ---
  const handleConfirmReceived = async () => {
    if (
      !window.confirm(
        "Apakah barang sudah Anda terima dengan benar? Konfirmasi ini akan langsung meneruskan dana ke Pedagang & Kurir.",
      )
    )
      return;

    setActionLoading(true);
    try {
      // 🚀 Memanggil RPC SQL yang kita buat sebelumnya
      const { error } = await supabase.rpc(
        "complete_order_and_disburse_funds",
        {
          p_order_id: orderId,
        },
      );

      if (error) throw error;

      showToast(
        "Terima kasih! Pesanan Selesai. Dana telah dibagikan.",
        "success",
      );
    } catch (err: any) {
      showToast(err.message || "Gagal konfirmasi pesanan", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const openChat = (type: "merchant_customer" | "courier_customer") => {
    setChatType(type);
    setShowChat(true);
  };

  if (loading)
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center z-[100]">
        <Loader2 className="animate-spin text-teal-600" size={40} />
      </div>
    );

  return (
    <div className="fixed inset-0 bg-white z-[80] overflow-y-auto pb-32 font-sans text-left no-scrollbar">
      {/* TOMBOL CHAT MELAYANG */}
      {!showChat && (
        <button
          onClick={() => openChat("merchant_customer")}
          className="fixed bottom-10 right-6 w-16 h-16 bg-yellow-400 text-slate-900 rounded-full shadow-[0_10px_40px_rgba(234,179,8,0.6)] flex items-center justify-center animate-bounce border-4 border-white z-[9999]"
        >
          <MessageCircle size={30} strokeWidth={2.5} />
        </button>
      )}

      {/* MODAL CHAT */}
      {showChat && (
        <div className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-md flex items-end justify-center">
          <div className="w-full max-w-md h-[85vh] bg-white rounded-t-[3rem] flex flex-col shadow-2xl">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50">
              <h3 className="font-black uppercase text-[10px] tracking-widest text-slate-500 italic">
                Chat{" "}
                {chatType === "merchant_customer"
                  ? "Layanan Toko"
                  : "Koordinasi Kurir"}
              </h3>
              <button
                onClick={() => setShowChat(false)}
                className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md font-black"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <OrderChatRoom
                orderId={orderId!}
                chatType={chatType}
                receiverName={
                  chatType === "merchant_customer"
                    ? order?.merchants?.shop_name || "Toko"
                    : order?.couriers?.full_name || "Kurir"
                }
              />
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <header className="p-6 border-b bg-white flex items-center gap-4 sticky top-0 z-10 shadow-sm">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-slate-50 rounded-full transition-all"
        >
          <ArrowLeft size={20} className="text-slate-600" />
        </button>
        <div>
          <h2 className="font-black uppercase italic text-slate-800 leading-none">
            Status Pesanan
          </h2>
          <p className="text-[9px] font-bold text-slate-400 uppercase mt-1 tracking-widest">
            #{orderId?.slice(0, 8)}
          </p>
        </div>
      </header>

      <main className="p-6 space-y-6 max-w-lg mx-auto">
        {/* PETA REAL-TIME */}
        <div className="h-[250px] w-full rounded-[2.5rem] overflow-hidden border-4 border-slate-100 shadow-inner bg-slate-100 relative">
          {isLoaded && (
            <GoogleMap
              mapContainerStyle={{ width: "100%", height: "100%" }}
              center={
                courierLoc || {
                  lat: order?.markets?.latitude || -1.242,
                  lng: order?.markets?.longitude || 116.852,
                }
              }
              zoom={14}
              options={{ disableDefaultUI: true }}
            >
              <Marker
                position={{
                  lat: order?.markets?.latitude,
                  lng: order?.markets?.longitude,
                }}
              />
              <Marker
                position={{
                  lat: order?.profiles?.latitude,
                  lng: order?.profiles?.longitude,
                }}
                icon={{
                  url: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
                }}
              />
              {courierLoc && (
                <Marker
                  position={courierLoc}
                  icon={{
                    url: "https://maps.google.com/mapfiles/ms/icons/cycling.png",
                  }}
                />
              )}
            </GoogleMap>
          )}
          <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[8px] font-black uppercase shadow-sm border border-slate-200">
            Live Radar Active
          </div>
        </div>

        {/* TOMBOL KONFIRMASI PEMBELI (Escrow Trigger) */}
        {order?.shipping_status === "DELIVERED" ||
        order?.shipping_status === "COMPLETED" ? (
          <div className="animate-in slide-in-from-top-4 duration-500">
            <div
              className={`p-8 rounded-[2.5rem] border-2 shadow-xl space-y-6 ${order?.shipping_status === "COMPLETED" ? "bg-slate-50 border-slate-100" : "bg-teal-50 border-teal-100"}`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`p-3 rounded-2xl ${order?.shipping_status === "COMPLETED" ? "bg-slate-200 text-slate-400" : "bg-white text-teal-600 shadow-sm"}`}
                >
                  <ShieldCheck size={28} />
                </div>
                <div>
                  <h3
                    className={`font-black uppercase text-sm italic ${order?.shipping_status === "COMPLETED" ? "text-slate-400" : "text-teal-900"}`}
                  >
                    {order?.shipping_status === "COMPLETED"
                      ? "Transaksi Selesai"
                      : "Pesanan Sudah Tiba!"}
                  </h3>
                  <p
                    className={`text-[10px] font-bold uppercase mt-1 leading-relaxed ${order?.shipping_status === "COMPLETED" ? "text-slate-400" : "text-teal-600"}`}
                  >
                    {order?.shipping_status === "COMPLETED"
                      ? "Dana telah dikirimkan ke pedagang & kurir. Terima kasih telah berbelanja!"
                      : "Silakan periksa barang belanjaan Anda. Jika sudah sesuai, klik tombol di bawah untuk membayar pedagang & kurir."}
                  </p>
                </div>
              </div>

              {order?.shipping_status !== "COMPLETED" && (
                <div className="space-y-3">
                  <button
                    onClick={handleConfirmReceived}
                    disabled={actionLoading}
                    className="w-full py-6 bg-teal-600 text-white rounded-[2rem] font-black uppercase text-xs tracking-[0.2em] shadow-2xl shadow-teal-500/30 active:scale-95 transition-all flex items-center justify-center gap-3 border-b-4 border-teal-800"
                  >
                    {actionLoading ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <CheckCircle2 size={20} />
                    )}
                    PESANAN DITERIMA & SESUAI
                  </button>
                  <button className="w-full py-3 text-red-500 font-black uppercase text-[9px] tracking-widest flex items-center justify-center gap-2 italic">
                    <AlertCircle size={14} /> Laporkan Masalah Barang
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* STATUS CARD (Saat masih dijalan) */
          <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white text-center shadow-xl relative overflow-hidden">
            <Truck
              size={40}
              className="mx-auto text-teal-400 mb-4 animate-pulse"
            />
            <h3 className="text-lg font-black uppercase italic tracking-tight">
              {order?.shipping_status?.replace(/_/g, " ") || "Menarik Data..."}
            </h3>
            <p className="text-[10px] text-white/50 font-bold uppercase mt-2 italic tracking-widest">
              Kurir sedang meluncur ke lokasi
            </p>
          </div>
        )}

        {/* INFO KURIR */}
        {order?.courier_id && (
          <div className="bg-white p-6 rounded-[2.5rem] border-2 border-slate-100 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-4 text-left">
              <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 border border-slate-200 shadow-inner">
                <Bike size={28} />
              </div>
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <h4 className="font-black text-slate-800 uppercase text-xs leading-none">
                    {order.couriers?.full_name}
                  </h4>
                  <ShieldCheck size={12} className="text-blue-500" />
                </div>
                <div className="inline-block bg-slate-900 text-white px-3 py-1 rounded-md border-2 border-slate-700 shadow-sm">
                  <p className="text-[10px] font-black tracking-widest uppercase italic leading-none">
                    {order.couriers?.vehicle_plate || "TANPA PLAT"}
                  </p>
                </div>
              </div>
            </div>
            <a
              href={`tel:${order.couriers?.phone_number}`}
              className="p-4 bg-slate-50 text-slate-600 rounded-2xl border border-slate-100 active:scale-90 transition-all"
            >
              <Phone size={18} />
            </a>
          </div>
        )}

        {/* ALAMAT */}
        <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex gap-4 text-left">
          <MapPin size={20} className="text-red-500 shrink-0" />
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">
              Alamat Pengiriman
            </p>
            <p className="text-xs font-bold text-slate-700 leading-relaxed mt-2">
              {order?.address || "Memuat alamat..."}
            </p>
          </div>
        </div>

        {/* TOMBOL CHAT */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => openChat("merchant_customer")}
            className="bg-white p-5 rounded-[2rem] border-2 border-slate-100 flex flex-col items-center gap-2 active:scale-95 transition-all"
          >
            <Headset size={20} className="text-slate-900" />
            <span className="text-[9px] font-black uppercase">Chat Toko</span>
          </button>
          {order?.courier_id && (
            <button
              onClick={() => openChat("courier_customer")}
              className="bg-white p-5 rounded-[2rem] border-2 border-slate-100 flex flex-col items-center gap-2 active:scale-95 transition-all"
            >
              <Bike size={20} className="text-orange-500" />
              <span className="text-[9px] font-black uppercase">
                Chat Kurir
              </span>
            </button>
          )}
        </div>
      </main>
    </div>
  );
};
