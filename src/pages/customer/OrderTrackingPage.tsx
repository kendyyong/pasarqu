import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { GoogleMap, useJsApiLoader, MarkerF } from "@react-google-maps/api";
import { supabase } from "../../lib/supabaseClient";
import {
  ArrowLeft,
  Loader2,
  Bike,
  ShoppingBag,
  ChevronRight,
  Package,
  Store,
  CheckCircle2,
  Clock,
  Wallet,
  MapPin,
  Download, // ✅ Tambah Ikon Download
} from "lucide-react";
import { OrderChatRoom } from "../../features/chat/OrderChatRoom";

const mapContainerStyle = { width: "100%", height: "100%" };

export const OrderTrackingPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [market, setMarket] = useState<any>(null);
  const [courier, setCourier] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [chatType, setChatType] = useState<
    "merchant_customer" | "courier_customer"
  >("merchant_customer");
  const [selectedMerchantId, setSelectedMerchantId] = useState<string | null>(
    null,
  );
  const [orderItems, setOrderItems] = useState<any[]>([]);

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
  });

  const steps = [
    { label: "DIBAYAR", key: "PAID", icon: Wallet },
    { label: "DIKEMAS", key: "PACKING", icon: Package },
    { label: "DIKIRIM", key: "SHIPPING", icon: Bike },
    { label: "SELESAI", key: "COMPLETED", icon: CheckCircle2 },
  ];

  const getCurrentStep = () => {
    if (!order) return -1;
    if (order.shipping_status === "COMPLETED") return 3;
    if (order.shipping_status === "SHIPPING") return 2;
    if (order.shipping_status === "PACKING") return 1;
    if (order.status === "PAID") return 0;
    return -1;
  };

  useEffect(() => {
    const fetchFullData = async () => {
      if (!orderId) return;
      try {
        setLoading(true);
        const { data: orderData } = await supabase
          .from("orders")
          .select("*")
          .eq("id", orderId)
          .maybeSingle();

        if (!orderData) return setOrder(null);
        setOrder(orderData);

        const { data: rawItems } = await supabase
          .from("order_items")
          .select("*")
          .eq("order_id", orderId);

        if (rawItems) {
          const productIds = rawItems.map((i) => i.product_id);
          const { data: productsData } = await supabase
            .from("products")
            .select("id, name")
            .in("id", productIds);
          setOrderItems(
            rawItems.map((item) => ({
              ...item,
              display_name:
                productsData?.find((p) => p.id === item.product_id)?.name ||
                "PRODUK PASAR",
            })),
          );
        }

        if (orderData.market_id) {
          const { data: mData } = await supabase
            .from("markets")
            .select("*")
            .eq("id", orderData.market_id)
            .maybeSingle();
          setMarket(mData);
        }
        if (orderData.courier_id) {
          const { data: cData } = await supabase
            .from("couriers")
            .select("*")
            .eq("id", orderData.courier_id)
            .maybeSingle();
          setCourier(cData);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchFullData();

    const channel = supabase
      .channel(`order-${orderId}`)
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

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  // ✅ FUNGSI CETAK NOTA (Mengarahkan ke halaman Invoice yang sudah ada)
  const handleDownloadInvoice = () => {
    window.open(`/invoice/${orderId}`, "_blank");
  };

  if (loading)
    return (
      <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-[100] gap-4 font-black">
        <Loader2 className="animate-spin text-teal-600" size={32} />
        <p className="text-[12px] tracking-widest uppercase text-slate-400">
          SINGKRONISASI DATA...
        </p>
      </div>
    );

  if (!order)
    return (
      <div className="p-10 text-center font-black uppercase text-[12px]">
        PESANAN TIDAK DITEMUKAN
      </div>
    );

  return (
    <div className="h-screen bg-slate-50 flex flex-col font-sans text-left uppercase overflow-hidden tracking-tighter">
      <header className="bg-white border-b border-slate-100 sticky top-0 z-50 shrink-0 h-12 flex items-center px-4 shadow-sm">
        <div className="w-full max-w-6xl mx-auto flex items-center justify-between font-black">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/")}
              className="p-1 hover:bg-slate-100 rounded-lg text-slate-400"
            >
              <ArrowLeft size={22} />
            </button>
            <div className="text-xl leading-none">
              <span className="text-teal-600">PASAR</span>
              <span className="text-[#FF6600]">QU</span>
            </div>
          </div>
          <div className="text-[12px] text-teal-600 border border-teal-100 px-2 py-0.5 rounded bg-teal-50 uppercase">
            RADAR AKTIF
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col md:flex-row overflow-hidden w-full max-w-6xl mx-auto font-black uppercase">
        {/* PETA */}
        <div className="w-full md:w-5/12 h-[220px] md:h-full relative p-2 md:p-4 shrink-0">
          <div className="w-full h-full bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden relative">
            {isLoaded ? (
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={
                  courier?.current_lat
                    ? { lat: courier.current_lat, lng: courier.current_lng }
                    : {
                        lat: order.delivery_lat || -6.2,
                        lng: order.delivery_lng || 106.8,
                      }
                }
                zoom={15}
                options={{ disableDefaultUI: true, gestureHandling: "greedy" }}
              >
                {order.delivery_lat && (
                  <MarkerF
                    position={{
                      lat: order.delivery_lat,
                      lng: order.delivery_lng,
                    }}
                    label="RUMAH"
                  />
                )}
                {courier?.current_lat && (
                  <MarkerF
                    position={{
                      lat: courier.current_lat,
                      lng: courier.current_lng,
                    }}
                    icon={{
                      url: "https://cdn-icons-png.flaticon.com/512/713/713438.png",
                      scaledSize: new google.maps.Size(40, 40),
                    }}
                  />
                )}
              </GoogleMap>
            ) : (
              <div className="w-full h-full bg-slate-100 flex items-center justify-center text-[12px]">
                MEMUAT PETA...
              </div>
            )}
          </div>
        </div>

        {/* DETAIL */}
        <div className="w-full md:w-7/12 flex flex-col overflow-y-auto p-2 space-y-2 pb-24 no-scrollbar">
          {/* TIMELINE */}
          <section className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm font-black">
            <div className="flex items-center gap-2 mb-4 border-b border-slate-50 pb-2 uppercase">
              <Clock size={16} className="text-teal-600" />
              <h4 className="text-[10px] text-slate-400 tracking-widest uppercase">
                STATUS PESANAN #{orderId?.slice(0, 8)}
              </h4>
            </div>
            <div className="flex justify-between items-center relative px-2">
              <div className="absolute top-[18px] left-8 right-8 h-[2px] bg-slate-100 -z-0" />
              {steps.map((step, idx) => {
                const isActive = idx <= getCurrentStep();
                return (
                  <div
                    key={idx}
                    className="relative z-10 flex flex-col items-center w-1/4"
                  >
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all ${isActive ? "bg-teal-600 border-teal-600 text-white shadow-md" : "bg-white border-slate-100 text-slate-200"}`}
                    >
                      <step.icon size={16} />
                    </div>
                    <span
                      className={`text-[12px] mt-2 font-black leading-none ${isActive ? "text-teal-600" : "text-slate-300"}`}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ✅ TOMBOL DOWNLOAD NOTA (Hanya muncul jika Selesai) */}
          {order.shipping_status === "COMPLETED" && (
            <button
              onClick={handleDownloadInvoice}
              className="w-full bg-white border-2 border-teal-600 text-teal-600 p-4 rounded-2xl flex items-center justify-center gap-3 shadow-sm active:scale-95 transition-all font-black"
            >
              <Download size={20} />
              <span className="text-[12px] tracking-widest uppercase">
                DOWNLOAD NOTA BELANJA
              </span>
            </button>
          )}

          {/* INFO ALAMAT */}
          <section className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm font-black uppercase">
            <div className="flex items-center gap-2 mb-2">
              <MapPin size={14} className="text-red-500" />
              <h4 className="text-[10px] text-slate-400 tracking-widest uppercase">
                ALAMAT PENGIRIMAN
              </h4>
            </div>
            <p className="text-[12px] text-slate-800 leading-tight font-sans lowercase">
              {order.address}
            </p>
          </section>

          {/* DAFTAR BELANJA */}
          <section className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-3 font-black uppercase">
            <div className="flex items-center gap-2 border-b border-slate-50 pb-2">
              <ShoppingBag size={14} className="text-teal-600" />
              <h4 className="text-[10px] text-slate-400 tracking-widest uppercase">
                DAFTAR BELANJA
              </h4>
            </div>
            <div className="space-y-2 uppercase">
              {orderItems.map((item, idx) => (
                <div
                  key={idx}
                  className="flex justify-between text-[12px] font-black"
                >
                  <span className="text-slate-700 truncate pr-4">
                    {item.display_name} x{item.quantity}
                  </span>
                  <span className="font-sans flex-shrink-0 text-slate-900">
                    {(item.quantity * item.price_at_purchase).toLocaleString()}
                  </span>
                </div>
              ))}
              <div className="pt-2 border-t border-dashed border-slate-200 flex justify-between items-center">
                <span className="text-[12px] text-slate-400">
                  TOTAL TAGIHAN
                </span>
                <span className="text-[18px] text-[#FF6600] font-sans">
                  RP {order.total_price.toLocaleString()}
                </span>
              </div>
            </div>
          </section>

          {/* TOMBOL CHAT (Hanya jika belum selesai) */}
          {order?.courier_id && order.shipping_status !== "COMPLETED" && (
            <button
              onClick={() => {
                setChatType("courier_customer");
                setShowChat(true);
              }}
              className="w-full bg-slate-900 text-white p-4 rounded-2xl flex items-center justify-between shadow-xl active:scale-95 transition-all font-black uppercase"
            >
              <div className="flex items-center gap-3">
                <Bike size={20} className="text-[#FF6600]" />
                <span className="text-[12px] tracking-widest">
                  HUBUNGI KURIR
                </span>
              </div>
              <ChevronRight size={18} className="text-slate-500" />
            </button>
          )}
        </div>
      </main>

      {/* CHAT OVERLAY */}
      {showChat && (
        <div className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-md flex items-center justify-center p-2 font-black uppercase">
          <div className="w-full max-w-md h-[85vh] bg-white rounded-[2rem] flex flex-col shadow-2xl overflow-hidden border-4 border-white">
            <div className="p-4 border-b flex justify-between items-center bg-white shrink-0">
              <div className="flex flex-col">
                <h3 className="text-[12px] text-teal-600 font-black">
                  OBROLAN LIVE
                </h3>
                <p className="text-[12px] text-slate-800">
                  {chatType === "courier_customer" ? "KURIR" : "TOKO"}
                </p>
              </div>
              <button
                onClick={() => setShowChat(false)}
                className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center font-black"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-hidden bg-slate-50 uppercase">
              <OrderChatRoom
                orderId={orderId!}
                chatType={chatType}
                merchantId={selectedMerchantId}
                receiverName={
                  chatType === "merchant_customer"
                    ? "PEDAGANG"
                    : courier?.full_name
                }
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
