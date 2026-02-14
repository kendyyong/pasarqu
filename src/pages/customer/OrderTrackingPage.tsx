import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
  Phone, // <--- SUDAH SAYA TAMBAHKAN DI SINI JURAGAN
} from "lucide-react";
import { OrderChatRoom } from "../../components/Chat/OrderChatRoom";

export const OrderTrackingPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [chatType, setChatType] = useState<
    "merchant_customer" | "courier_customer"
  >("merchant_customer");

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
            couriers:courier_id(full_name, phone_number, vehicle_plate)
          `,
          )
          .eq("id", orderId)
          .single();

        if (error) throw error;
        if (data) setOrder(data);
      } catch (err) {
        console.error("Tracking fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();

    const channel = supabase
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

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

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
    <div className="fixed inset-0 bg-white z-[80] overflow-y-auto pb-32 font-sans text-left">
      {/* 1. TOMBOL KUNING MELAYANG (CS TOKO) */}
      {!showChat && (
        <button
          onClick={() => openChat("merchant_customer")}
          style={{ zIndex: 9999, position: "fixed" }}
          className="bottom-10 right-6 w-16 h-16 bg-yellow-400 text-slate-900 rounded-full shadow-[0_10px_40px_rgba(234,179,8,0.6)] flex items-center justify-center animate-bounce border-4 border-white active:scale-90 transition-all"
        >
          <MessageCircle size={30} strokeWidth={2.5} />
        </button>
      )}

      {/* 2. MODAL CHAT FULL SCREEN */}
      {showChat && (
        <div className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-md flex items-end justify-center">
          <div className="w-full max-w-md h-[85vh] bg-white rounded-t-[3rem] flex flex-col shadow-2xl animate-in slide-in-from-bottom-10">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${chatType === "merchant_customer" ? "bg-slate-900" : "bg-orange-500"} animate-pulse`}
                ></div>
                <h3 className="font-black uppercase text-[10px] tracking-widest text-slate-500">
                  Chat{" "}
                  {chatType === "merchant_customer"
                    ? "Layanan Toko"
                    : "Koordinasi Kurir"}
                </h3>
              </div>
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
        {/* STATUS CARD */}
        <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white text-center shadow-xl relative overflow-hidden">
          <Truck
            size={48}
            className="mx-auto text-teal-400 mb-4 animate-pulse"
          />
          <h3 className="text-xl font-black uppercase italic tracking-tight">
            {order?.shipping_status?.replace(/_/g, " ") || "Menarik Data..."}
          </h3>
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-10 -mt-10"></div>
        </div>

        {/* KARTU INFO KURIR + PLAT NOMOR */}
        {order?.courier_id && (
          <div className="bg-white p-6 rounded-[2.5rem] border-2 border-slate-100 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-4 text-left">
              <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 font-black text-xl border border-slate-200 shadow-inner">
                <Bike size={28} />
              </div>
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <h4 className="font-black text-slate-800 uppercase text-xs leading-none">
                    {order.couriers?.full_name}
                  </h4>
                  <ShieldCheck size={12} className="text-blue-500" />
                </div>
                {/* VISUAL PLAT NOMOR MOTOR */}
                <div className="inline-block bg-slate-900 text-white px-3 py-1 rounded-md border-2 border-slate-700 shadow-sm">
                  <p className="text-[10px] font-black tracking-widest uppercase italic leading-none">
                    {order.couriers?.vehicle_plate || "TANPA PLAT"}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <a
                href={`tel:${order.couriers?.phone_number}`}
                className="p-4 bg-slate-50 text-slate-600 rounded-2xl border border-slate-100 active:scale-90 transition-all"
              >
                <Phone size={18} />
              </a>
            </div>
          </div>
        )}

        {/* MENU LAYANAN */}
        <div className="space-y-3">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 leading-none">
            Hubungi Bantuan
          </p>
          <button
            onClick={() => openChat("merchant_customer")}
            className="w-full bg-white p-6 rounded-[2rem] border-2 border-slate-100 flex items-center justify-between shadow-sm active:scale-95 transition-all"
          >
            <div className="flex items-center gap-4 text-left">
              <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-slate-200">
                <Headset size={24} />
              </div>
              <div>
                <h4 className="font-black text-slate-800 uppercase text-xs leading-none">
                  Chat Toko
                </h4>
                <p className="text-[9px] font-bold text-teal-600 uppercase mt-1.5 leading-none">
                  Layanan CS Standby
                </p>
              </div>
            </div>
            <ChevronRight size={18} className="text-slate-200" />
          </button>

          {order?.courier_id && (
            <button
              onClick={() => openChat("courier_customer")}
              className="w-full bg-white p-6 rounded-[2rem] border-2 border-slate-100 flex items-center justify-between shadow-sm active:scale-95 transition-all"
            >
              <div className="flex items-center gap-4 text-left">
                <div className="w-12 h-12 bg-orange-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-orange-100">
                  <Bike size={24} />
                </div>
                <div>
                  <h4 className="font-black text-slate-800 uppercase text-xs leading-none">
                    Chat Kurir
                  </h4>
                  <p className="text-[9px] font-bold text-orange-600 uppercase mt-1.5 leading-none italic">
                    Bicara dengan Driver
                  </p>
                </div>
              </div>
              <ChevronRight size={18} className="text-slate-200" />
            </button>
          )}
        </div>

        {/* ALAMAT */}
        <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex gap-4 text-left">
          <MapPin size={20} className="text-red-500 shrink-0" />
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
              Alamat Pengiriman
            </p>
            <p className="text-xs font-bold text-slate-700 leading-relaxed mt-1">
              {order?.address || "Memuat alamat..."}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};
