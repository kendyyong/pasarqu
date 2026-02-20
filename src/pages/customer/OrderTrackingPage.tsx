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
  CheckCircle2,
  Clock,
  Wallet,
  MapPin,
  Download,
  ShieldAlert,
  HeadphonesIcon,
  X,
} from "lucide-react";
import { OrderChatRoom } from "../../features/chat/OrderChatRoom";
import { ComplaintTrigger } from "../../components/shared/ComplaintTrigger";
import { ComplaintForm } from "../../components/shared/ComplaintForm"; // 🚩 Tambah Import

const mapContainerStyle = { width: "100%", height: "100%" };

export const OrderTrackingPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [courier, setCourier] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false); // 🚩 State untuk Modal Bantuan
  const [chatType, setChatType] = useState<
    "merchant_customer" | "courier_customer"
  >("merchant_customer");
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
  }, [orderId]);

  const handleDownloadInvoice = () => {
    window.open(`/invoice/${orderId}`, "_blank");
  };

  if (loading)
    return (
      <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-[100] gap-4 font-black">
        <Loader2 className="animate-spin text-[#008080]" size={32} />
        <p className="text-[12px] tracking-widest uppercase text-slate-400 font-black">
          SINGKRONISASI RADAR...
        </p>
      </div>
    );

  return (
    <div className="h-screen bg-slate-50 flex flex-col font-black text-left uppercase overflow-hidden tracking-tighter">
      <header className="bg-white border-b border-slate-100 sticky top-0 z-50 shrink-0 h-14 flex items-center px-4 shadow-sm">
        <div className="w-full max-w-6xl mx-auto flex items-center justify-between font-black">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/")}
              className="p-2 hover:bg-slate-100 rounded-md text-slate-400"
            >
              <ArrowLeft size={22} />
            </button>
            <div className="text-xl leading-none font-black">
              <span className="text-[#008080]">PASAR</span>
              <span className="text-[#FF6600]">QU</span>
            </div>
          </div>
          <div className="text-[10px] text-[#008080] border-2 border-[#008080] px-2 py-1 rounded-md bg-teal-50 font-black animate-pulse">
            LIVE TRACKING
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col md:flex-row overflow-hidden w-full max-w-6xl mx-auto">
        {/* PETA */}
        <div className="w-full md:w-[45%] h-[160px] md:h-auto md:max-h-[350px] relative p-2 md:p-4 shrink-0 mx-auto">
          <div className="w-full h-full bg-white rounded-md border-2 border-slate-100 shadow-sm overflow-hidden relative">
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
                    label="TUJUAN"
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
              <div className="w-full h-full bg-slate-50 flex items-center justify-center text-[10px] font-black">
                MEMUAT RADAR...
              </div>
            )}
          </div>
        </div>

        {/* DETAIL */}
        <div className="flex-1 flex flex-col overflow-y-auto p-2 space-y-2 pb-24 no-scrollbar">
          {/* TIMELINE */}
          <section className="bg-white p-4 rounded-md border border-slate-100 shadow-sm">
            <div className="flex justify-between items-center relative px-2 py-2">
              <div className="absolute top-[18px] left-8 right-8 h-[2px] bg-slate-100 -z-0" />
              {steps.map((step, idx) => {
                const isActive = idx <= getCurrentStep();
                return (
                  <div
                    key={idx}
                    className="relative z-10 flex flex-col items-center w-1/4"
                  >
                    <div
                      className={`w-8 h-8 rounded-md flex items-center justify-center border-2 transition-all ${isActive ? "bg-[#008080] border-[#008080] text-white shadow-md" : "bg-white border-slate-100 text-slate-200"}`}
                    >
                      <step.icon size={14} />
                    </div>
                    <span
                      className={`text-[9px] mt-2 font-black leading-none ${isActive ? "text-[#008080]" : "text-slate-300"}`}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ITEM BELANJA */}
          <section className="bg-white p-4 rounded-md border border-slate-100 shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-50 pb-2 mb-3 font-black">
              <ShoppingBag size={14} className="text-[#008080]" />
              <h4 className="text-[10px] text-slate-400 tracking-widest uppercase">
                RINGKASAN BELANJA
              </h4>
            </div>
            <div className="space-y-2 font-black">
              {orderItems.map((item, idx) => (
                <div
                  key={idx}
                  className="flex justify-between text-[11px] font-black"
                >
                  <span className="text-slate-700 truncate pr-4">
                    {item.display_name} X{item.quantity}
                  </span>
                  <span className="text-slate-900 font-black">
                    {(item.quantity * item.price_at_purchase).toLocaleString()}
                  </span>
                </div>
              ))}
              <div className="pt-2 border-t border-dashed border-slate-200 flex justify-between items-center">
                <span className="text-[11px] text-slate-400 font-black uppercase">
                  TOTAL TAGIHAN
                </span>
                <span className="text-[18px] text-[#FF6600] font-black tracking-tighter">
                  RP {order.total_price.toLocaleString()}
                </span>
              </div>
            </div>
          </section>

          {/* 🚩 PUSAT RESOLUSI */}
          <section className="bg-white p-4 rounded-md border border-slate-100 shadow-sm border-l-8 border-l-[#FF6600] space-y-3 font-black">
            <div className="flex items-center gap-2">
              <ShieldAlert size={16} className="text-[#FF6600]" />
              <h4 className="text-[10px] text-slate-400 tracking-widest uppercase">
                PUSAT RESOLUSI
              </h4>
            </div>

            <ComplaintTrigger
              orderId={orderId!}
              orderStatus={order.shipping_status || order.status}
            />

            <p className="text-[10px] text-slate-400 normal-case font-bold leading-tight">
              GUNAKAN LAYANAN INI JIKA PESANAN RUSAK ATAU KURIR BERMASALAH
              SEBELUM MENYELESAIKAN PESANAN.
            </p>
          </section>

          {/* 🚩 TOMBOL BANTUAN (DIPERBAIKI: Membuka Modal, Bukan Beranda) */}
          <button
            onClick={() => setShowSupportModal(true)}
            className="w-full bg-slate-100 text-slate-600 p-4 rounded-md flex items-center justify-center gap-2 font-black text-[12px] uppercase shadow-sm active:scale-95 transition-all"
          >
            <HeadphonesIcon size={18} /> BANTUAN
          </button>

          {/* TOMBOL CHAT & DOWNLOAD (DINAMIS) */}
          <div className="grid grid-cols-2 gap-2 font-black">
            {order?.courier_id && order.shipping_status !== "COMPLETED" && (
              <button
                onClick={() => {
                  setChatType("courier_customer");
                  setShowChat(true);
                }}
                className="bg-slate-900 text-white p-3 rounded-md flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all font-black text-[11px]"
              >
                <Bike size={16} className="text-[#FF6600]" /> CHAT KURIR
              </button>
            )}
            {order.shipping_status === "COMPLETED" && (
              <button
                onClick={handleDownloadInvoice}
                className="bg-white border-2 border-[#008080] text-[#008080] p-3 rounded-md flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all font-black text-[11px]"
              >
                <Download size={16} /> DOWNLOAD NOTA
              </button>
            )}
          </div>
        </div>
      </main>

      {/* 🚩 MODAL BANTUAN UMUM */}
      {showSupportModal && (
        <div className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 font-black">
          <div className="relative w-full max-w-lg animate-in zoom-in duration-300">
            <button
              onClick={() => setShowSupportModal(false)}
              className="absolute -top-10 right-0 flex items-center gap-2 text-white font-black text-[11px] uppercase"
            >
              <X size={18} /> TUTUP
            </button>
            <ComplaintForm
              orderId={orderId}
              onSuccess={() =>
                setTimeout(() => setShowSupportModal(false), 2000)
              }
            />
          </div>
        </div>
      )}

      {/* CHAT OVERLAY */}
      {showChat && (
        <div className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 font-black">
          <div className="w-full max-w-md h-[80vh] bg-white rounded-md flex flex-col shadow-2xl overflow-hidden border-2 border-slate-100">
            <div className="p-4 border-b flex justify-between items-center bg-white font-black">
              <div className="text-left">
                <h3 className="text-[10px] text-[#008080] font-black tracking-widest">
                  OBROLAN LIVE
                </h3>
                <p className="text-[14px] font-black text-slate-800 leading-none mt-1 uppercase">
                  KONTAK KURIR
                </p>
              </div>
              <button
                onClick={() => setShowChat(false)}
                className="w-10 h-10 bg-slate-50 rounded-md font-black"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 bg-slate-50 font-black">
              <OrderChatRoom
                orderId={orderId!}
                chatType={chatType}
                receiverName={"KURIR PASARQU"}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
