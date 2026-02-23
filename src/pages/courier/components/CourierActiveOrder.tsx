import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom"; // 🚀 IMPORT PORTAL DARI REACT
import { supabase } from "../../../lib/supabaseClient";
import { useAuth } from "../../../contexts/AuthContext";
import { useToast } from "../../../contexts/ToastContext";
import {
  MapPin,
  Phone,
  MessageSquare,
  MessageCircle,
  CheckCircle,
  Loader2,
  Truck,
  X,
  Lock,
  Store,
} from "lucide-react";

import { OrderChatRoom } from "../../../features/chat/OrderChatRoom";

interface Props {
  order: any;
  onFinished: () => void;
}

export const CourierActiveOrder: React.FC<Props> = ({ order, onFinished }) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [locationInterval, setLocationInterval] = useState<any>(null);

  const [chatTarget, setChatTarget] = useState<{
    type: "courier_customer" | "courier_merchant";
    name: string;
  }>({ type: "courier_customer", name: "Pelanggan" });

  const isCompleted =
    order?.status === "COMPLETED" || order?.shipping_status === "COMPLETED";

  // GPS TRACKER
  useEffect(() => {
    if (order?.shipping_status === "SHIPPING" && user?.id) {
      const interval = setInterval(() => {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            await supabase
              .from("couriers")
              .update({
                current_lat: latitude,
                current_lng: longitude,
              })
              .eq("id", user.id);
          },
          (error) => console.error("GPS Error:", error),
          { enableHighAccuracy: true, maximumAge: 0 },
        );
      }, 5000);

      setLocationInterval(interval);
      return () => clearInterval(interval);
    } else {
      if (locationInterval) clearInterval(locationInterval);
    }
  }, [order?.shipping_status, user?.id]);

  // UPDATE STATUS
  const handleStatusUpdate = async () => {
    setLoading(true);
    try {
      let nextStatus = "";
      let isFinalStep = false;

      if (
        order.shipping_status === "SEARCHING_COURIER" ||
        order.shipping_status === "PACKING"
      ) {
        nextStatus = "SHIPPING";
      } else if (
        order.shipping_status === "SHIPPING" ||
        order.shipping_status === "DELIVERING"
      ) {
        nextStatus = "COMPLETED";
        isFinalStep = true;
      } else {
        nextStatus = "SHIPPING";
      }

      if (isFinalStep) {
        const { error: rpcError } = await supabase.rpc(
          "complete_order_and_pay_courier",
          {
            p_order_id: order.id,
            p_courier_id: order.courier_id,
            p_amount: order.courier_earning_total || 0,
          },
        );

        if (rpcError) throw rpcError;
        if (locationInterval) clearInterval(locationInterval);
        showToast("Pesanan Selesai! Saldo masuk ke dompet Anda.", "success");
      } else {
        const { error } = await supabase
          .from("orders")
          .update({ shipping_status: nextStatus })
          .eq("id", order.id);

        if (error) throw error;
        showToast(
          `Status diperbarui: ${nextStatus.replace("_", " ")}`,
          "success",
        );
      }

      onFinished();
    } catch (err: any) {
      console.error("Update Error:", err);
      showToast(err.message || "Gagal update status", "error");
    } finally {
      setLoading(false);
    }
  };

  const openChat = (
    type: "courier_customer" | "courier_merchant",
    name: string,
  ) => {
    setChatTarget({ type, name });
    setShowChat(true);
  };

  return (
    <>
      {/* 🚀 FIX: Menggunakan createPortal agar menembus batasan layout dan scroll dari komponen parent */}
      {showChat &&
        createPortal(
          <div className="fixed inset-0 z-[999999] bg-white md:bg-slate-900/80 backdrop-blur-sm flex justify-center">
            <div className="w-full max-w-[480px] flex flex-col h-[100dvh] bg-white overflow-hidden shadow-2xl relative animate-in slide-in-from-bottom-8 duration-300">
              {/* HEADER CHAT */}
              <div className="p-4 flex justify-between items-center bg-[#008080] text-white shrink-0 pt-safe shadow-sm z-10">
                <div className="flex items-center gap-3 ml-2">
                  <div className="w-2 h-2 rounded-full bg-teal-300 animate-pulse"></div>
                  <div>
                    <h3 className="text-[14px] leading-none font-[1000] uppercase text-left">
                      {chatTarget.name}
                    </h3>
                    <p className="text-[9px] text-teal-200 tracking-widest mt-1 uppercase text-left">
                      {chatTarget.type.replace("_", " ")}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowChat(false)}
                  className="w-10 h-10 hover:bg-teal-700 rounded-full flex items-center justify-center transition-colors active:scale-90"
                >
                  <X size={24} strokeWidth={3} />
                </button>
              </div>

              {/* AREA KONTEN CHAT */}
              <div className="flex-1 w-full bg-slate-50 relative overflow-hidden flex flex-col">
                <OrderChatRoom
                  orderId={order.id}
                  receiverName={chatTarget.name}
                  chatType={chatTarget.type}
                />
              </div>
            </div>
          </div>,
          document.body, // Ditempelkan paksa ke body paling luar
        )}

      {/* KONTEN UTAMA RADAR */}
      <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 text-left font-black uppercase tracking-tighter not-italic pb-4">
        {/* HEADER STATUS */}
        <div
          className={`p-6 rounded-md flex justify-between items-center shadow-md transition-all border-l-4 ${isCompleted ? "bg-slate-200 border-slate-400 text-slate-500" : "bg-white border-[#008080] text-slate-800"}`}
        >
          <div className="flex items-center gap-4">
            <div
              className={`w-12 h-12 rounded-md flex items-center justify-center shadow-inner ${isCompleted ? "bg-slate-300 text-slate-400" : "bg-teal-50 text-[#008080]"}`}
            >
              {loading ? (
                <Loader2 className="animate-spin" size={24} />
              ) : (
                <Truck size={24} />
              )}
            </div>
            <div>
              <h2 className="text-[16px] font-[1000] uppercase leading-none">
                {isCompleted
                  ? "SELESAI"
                  : order.shipping_status?.replace(/_/g, " ")}
              </h2>
              <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest">
                ID: #{order.id.slice(0, 8)}
              </p>
            </div>
          </div>

          <button
            onClick={() =>
              openChat(
                "courier_customer",
                order.profiles?.full_name || "Pelanggan",
              )
            }
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-90 ${isCompleted ? "bg-slate-100 text-slate-400 cursor-not-allowed" : "bg-[#008080] text-white shadow-md hover:bg-teal-700"}`}
          >
            <MessageCircle size={24} />
          </button>
        </div>

        {/* BODY AREA */}
        <div className="bg-white p-5 rounded-md border border-slate-200 shadow-sm space-y-5">
          {/* BAGIAN TOKO */}
          <div className="flex gap-4 p-4 bg-orange-50/50 rounded-md border border-orange-100">
            <div className="w-10 h-10 bg-orange-50 text-[#FF6600] rounded-md flex items-center justify-center shrink-0 border border-orange-100 shadow-inner">
              <Store size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[9px] font-black text-orange-400 uppercase tracking-widest leading-none">
                TITIK JEMPUT (TOKO)
              </p>
              <h4 className="font-[1000] text-slate-800 text-[12px] uppercase truncate mt-1.5">
                {order.merchants?.shop_name || "TOKO MITRA"}
              </h4>
              <button
                onClick={() =>
                  openChat(
                    "courier_merchant",
                    order.merchants?.shop_name || "Toko",
                  )
                }
                className="mt-3 flex items-center justify-center w-full gap-2 py-3 bg-white border border-orange-200 text-[#FF6600] rounded-md text-[10px] font-black uppercase tracking-widest hover:bg-orange-50 transition-all shadow-sm active:scale-95"
              >
                <MessageSquare size={14} /> CHAT MERCHANT
              </button>
            </div>
          </div>

          {/* BAGIAN PELANGGAN */}
          <div className="flex gap-4 p-4 bg-slate-50 rounded-md border border-slate-100">
            <div className="w-10 h-10 bg-white text-[#008080] rounded-md flex items-center justify-center shrink-0 border border-slate-200 shadow-inner">
              <MapPin size={20} />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">
                TITIK ANTAR (PEMBELI)
              </p>
              <h4 className="font-[1000] text-slate-900 text-[12px] uppercase mt-1.5">
                {order.profiles?.full_name || "PEMBELI PASARQU"}
              </h4>

              <div className="flex gap-2 mt-3">
                <button
                  onClick={() =>
                    openChat(
                      "courier_customer",
                      order.profiles?.full_name || "Pelanggan",
                    )
                  }
                  className={`flex-1 py-3 rounded-md font-[1000] text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 ${isCompleted ? "bg-slate-200 text-slate-400 cursor-not-allowed" : "bg-[#008080] text-white shadow-md hover:bg-teal-700"}`}
                >
                  {isCompleted ? (
                    <Lock size={14} />
                  ) : (
                    <MessageSquare size={14} />
                  )}
                  {isCompleted ? "TERKUNCI" : "CHAT PEMBELI"}
                </button>

                <a
                  href={
                    isCompleted ? "#" : `tel:${order.profiles?.phone_number}`
                  }
                  className="w-12 shrink-0 bg-white border border-slate-200 text-slate-600 rounded-md flex items-center justify-center shadow-sm active:scale-90"
                >
                  <Phone size={16} />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* TOMBOL UPDATE STATUS */}
        {!isCompleted && (
          <button
            onClick={handleStatusUpdate}
            disabled={loading}
            className="w-full py-5 bg-[#FF6600] text-white rounded-md font-[1000] uppercase text-[12px] md:text-[14px] tracking-widest shadow-md active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50 disabled:bg-slate-300 transition-all"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <CheckCircle size={20} strokeWidth={3} />
            )}
            {order.shipping_status === "SHIPPING" ||
            order.shipping_status === "DELIVERING"
              ? "KONFIRMASI TIBA & CAIRKAN"
              : "AMBIL ORDER & MULAI JALAN"}
          </button>
        )}
      </div>
    </>
  );
};
