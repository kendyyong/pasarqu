import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { GoogleMap, useJsApiLoader, Marker } from "@react-google-maps/api";
import { supabase } from "../../lib/supabaseClient";
import {
  ArrowLeft,
  Loader2,
  MapPin,
  Headset,
  Bike, // ✅ Digunakan untuk ikon motor
  MessageCircle,
  ShieldCheck,
  Phone,
  CheckCircle2,
  AlertCircle,
  ShoppingBag,
  ReceiptText,
  Heart,
  ChevronRight,
} from "lucide-react";
import { OrderChatRoom } from "../../components/Chat/OrderChatRoom";
import { useToast } from "../../contexts/ToastContext";

const mapContainerStyle = {
  width: "100%",
  height: "280px",
  borderRadius: "0.75rem",
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
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [courierLoc, setCourierLoc] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
  });

  useEffect(() => {
    const fetchOrderData = async () => {
      if (!orderId) return;
      try {
        const { data, error } = await supabase
          .from("orders")
          .select(
            `
            *, 
            merchants:merchant_id(shop_name, id), 
            markets:market_id(latitude, longitude, name),
            couriers:courier_id(full_name, phone_number, vehicle_plate, current_lat, current_lng),
            profiles:customer_id(latitude, longitude)
          `,
          )
          .eq("id", orderId)
          .single();

        if (error) throw error;
        setOrder(data);

        if (data.couriers?.current_lat) {
          setCourierLoc({
            lat: data.couriers.current_lat,
            lng: data.couriers.current_lng,
          });
        }

        const { data: items } = await supabase
          .from("order_items")
          .select("*, products(name)")
          .eq("order_id", orderId);

        if (items) setOrderItems(items);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderData();
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
        (payload) => setOrder((prev: any) => ({ ...prev, ...payload.new })),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(orderChannel);
    };
  }, [orderId]);

  const handleConfirmReceived = async () => {
    if (
      !window.confirm(
        "Konfirmasi penerimaan barang? Dana akan diteruskan ke pedagang & kurir.",
      )
    )
      return;
    setActionLoading(true);
    try {
      const { error } = await supabase.rpc(
        "complete_order_and_disburse_funds",
        { p_order_id: orderId },
      );
      if (error) throw error;
      showToast("Pesanan Selesai!", "success");
    } catch (err: any) {
      showToast(err.message || "Gagal konfirmasi", "error");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading)
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center z-[100]">
        <Loader2 className="animate-spin text-teal-600" size={40} />
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* HEADER */}
      <header className="bg-white border-b-2 border-teal-600 sticky top-0 z-50 shadow-sm">
        <div className="max-w-[1200px] mx-auto px-4 h-16 flex items-center justify-between text-left">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-slate-100 transition-all"
            >
              <ArrowLeft size={24} className="text-slate-600" />
            </button>
            <div className="text-2xl font-black text-teal-600 tracking-tighter">
              PASARQU
            </div>
          </div>
          <div className="px-3 py-1 bg-teal-50 rounded border border-teal-100">
            <span className="text-[10px] font-black text-teal-600 uppercase tracking-widest leading-none">
              Tracking Live
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col md:flex-row items-stretch justify-center max-w-[1300px] mx-auto w-full md:p-6 gap-0 md:gap-6">
        {/* KOLOM KIRI (Desktop) */}
        <div className="hidden md:flex md:w-4/12 bg-slate-900 rounded-2xl p-10 flex-col justify-between text-white relative overflow-hidden shadow-xl text-left">
          <div className="relative z-10 space-y-6">
            <div className="w-14 h-14 bg-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/20">
              <Bike size={30} className="text-white" />
            </div>
            <h1 className="text-4xl font-black leading-tight uppercase tracking-tighter">
              Pesanan Anda <br /> Sedang Dalam <br /> Perjalanan.
            </h1>
            <p className="text-slate-400 font-medium leading-relaxed">
              Pantau posisi kurir secara real-time dan pastikan HP Anda aktif
              untuk memudahkan pengantaran.
            </p>
          </div>
          <div className="relative z-10 bg-teal-600/10 p-6 rounded-xl border border-teal-500/20">
            <p className="text-xs text-teal-500 font-bold uppercase tracking-widest mb-2">
              Estimasi Pengantaran
            </p>
            <p className="text-sm font-bold leading-relaxed">
              Kurir motor kami berkomitmen mengirimkan barang dalam kondisi
              segar & tepat waktu.
            </p>
          </div>
        </div>

        {/* KOLOM KANAN (Mobile Luas) */}
        <div className="flex-1 flex flex-col bg-white md:rounded-2xl shadow-xl overflow-y-auto no-scrollbar">
          <div className="p-2 md:p-8 space-y-6 pb-20">
            {/* MAPS SECTION */}
            <div className="relative h-[280px] w-full rounded-xl overflow-hidden border-2 border-slate-100 shadow-inner bg-slate-200">
              {isLoaded && (
                <GoogleMap
                  mapContainerStyle={{ width: "100%", height: "100%" }}
                  center={
                    courierLoc || {
                      lat: order?.markets?.latitude || -6.2,
                      lng: order?.markets?.longitude || 106.8,
                    }
                  }
                  zoom={15}
                  options={{ disableDefaultUI: true }}
                >
                  <Marker
                    position={{
                      lat: order?.markets?.latitude,
                      lng: order?.markets?.longitude,
                    }}
                    label="PASAR"
                  />
                  {courierLoc && (
                    <Marker
                      position={courierLoc}
                      icon={{
                        url: "https://cdn-icons-png.flaticon.com/512/713/713438.png",
                        scaledSize: new google.maps.Size(40, 40),
                      }}
                    />
                  )}
                </GoogleMap>
              )}
              <div className="absolute top-4 left-4 bg-slate-900 text-white px-3 py-1 rounded-md text-[8px] font-black uppercase tracking-widest shadow-lg">
                Radar Aktif
              </div>
            </div>

            {/* STATUS UTAMA - ✅ Sekarang Ikon Motor */}
            <div
              className={`p-6 rounded-xl shadow-sm text-left flex items-center justify-between ${order?.shipping_status === "COMPLETED" ? "bg-slate-50 border border-slate-200" : "bg-teal-600 text-white"}`}
            >
              <div>
                <p className="text-[10px] font-bold uppercase opacity-60 tracking-widest mb-1">
                  Status Saat Ini
                </p>
                <h3 className="text-xl font-black uppercase tracking-tight leading-none">
                  {order?.shipping_status?.replace(/_/g, " ") || "Processing"}
                </h3>
              </div>
              <div className="p-3 bg-white/20 rounded-lg">
                {/* ✅ Ikon diubah menjadi Bike (Motor) */}
                <Bike size={24} />
              </div>
            </div>

            {/* RINCIAN BARANG */}
            <div className="bg-white p-5 rounded-xl border-2 border-slate-100 space-y-4 text-left">
              <div className="flex items-center gap-2 border-b border-slate-50 pb-3">
                <ShoppingBag size={18} className="text-teal-600" />
                <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">
                  Barang Belanjaan
                </h4>
              </div>
              <div className="space-y-4">
                {orderItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center text-[11px]"
                  >
                    <div className="flex-1">
                      <p className="font-black text-slate-800 uppercase leading-tight">
                        {item.products?.name}
                      </p>
                      <p className="font-bold text-slate-400 mt-0.5">
                        {item.quantity} x Rp{" "}
                        {item.price_at_purchase.toLocaleString()}
                      </p>
                    </div>
                    <span className="font-black text-slate-900">
                      Rp{" "}
                      {(
                        item.price_at_purchase * item.quantity
                      ).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* RINCIAN BIAYA */}
            <div className="bg-white p-5 rounded-xl border-2 border-slate-100 space-y-3 text-left">
              <div className="flex items-center gap-2 border-b border-slate-50 pb-3">
                <ReceiptText size={18} className="text-teal-600" />
                <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">
                  Rincian Pembayaran
                </h4>
              </div>
              <div className="flex justify-between text-[11px] font-bold text-slate-500 uppercase">
                <span>Subtotal Barang</span>
                <span className="text-slate-900 font-black">
                  Rp{" "}
                  {(
                    order?.total_price -
                    order?.shipping_cost -
                    order?.service_fee
                  ).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-[11px] font-bold text-slate-500 uppercase">
                <span>Biaya Kurir</span>
                <span className="text-slate-900 font-black">
                  Rp {order?.shipping_cost?.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-[11px] font-bold text-slate-500 uppercase">
                <span>Biaya Pelayanan</span>
                <span className="text-teal-600 font-black">
                  Rp {order?.service_fee?.toLocaleString()}
                </span>
              </div>
              <div className="pt-3 border-t-2 border-dashed border-slate-100 flex justify-between items-end">
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Total Tagihan
                  </span>
                  <h3 className="text-3xl font-black text-orange-600 tracking-tighter leading-none mt-1">
                    Rp {order?.total_price?.toLocaleString()}
                  </h3>
                </div>
              </div>
            </div>

            {/* KONFIRMASI TERIMA */}
            {order?.shipping_status === "DELIVERED" && (
              <button
                onClick={handleConfirmReceived}
                disabled={actionLoading}
                className="w-full py-5 bg-teal-600 text-white rounded-xl font-black uppercase text-xs tracking-widest shadow-xl active:scale-95 flex items-center justify-center gap-3 transition-all"
              >
                {actionLoading ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <CheckCircle2 size={18} />
                )}{" "}
                PESANAN DITERIMA & SESUAI
              </button>
            )}

            {/* KOMUNIKASI */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-10">
              <button
                onClick={() => {
                  setChatType("merchant_customer");
                  setShowChat(true);
                }}
                className="w-full bg-slate-900 text-white p-5 rounded-xl flex items-center justify-between active:scale-95 transition-all"
              >
                <div className="flex items-center gap-3 text-left">
                  <Headset size={20} className="text-teal-400" />
                  <div>
                    <p className="text-[10px] font-black uppercase leading-none">
                      Chat Toko
                    </p>
                    <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">
                      Konfirmasi Pesanan
                    </p>
                  </div>
                </div>
                <ChevronRight size={16} />
              </button>

              {order?.courier_id && (
                <button
                  onClick={() => {
                    setChatType("courier_customer");
                    setShowChat(true);
                  }}
                  className="w-full bg-slate-100 text-slate-900 p-5 rounded-xl flex items-center justify-between border-2 border-slate-200 active:scale-95 transition-all"
                >
                  <div className="flex items-center gap-3 text-left">
                    <Bike size={20} className="text-orange-500" />
                    <div>
                      <p className="text-[10px] font-black uppercase leading-none">
                        Chat Kurir
                      </p>
                      <p className="text-[8px] font-bold text-slate-500 uppercase mt-1">
                        Tanya Posisi
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={16} />
                </button>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* CHAT OVERLAY */}
      {showChat && (
        <div className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-md flex items-end justify-center">
          <div className="w-full max-w-md h-[85vh] bg-white rounded-t-3xl flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10">
            <div className="p-6 border-b flex justify-between items-center bg-white text-left">
              <h3 className="font-black uppercase text-[10px] tracking-widest text-slate-900">
                Chat Log
              </h3>
              <button
                onClick={() => setShowChat(false)}
                className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center font-black"
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
                    ? order?.merchants?.shop_name
                    : order?.couriers?.full_name
                }
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
