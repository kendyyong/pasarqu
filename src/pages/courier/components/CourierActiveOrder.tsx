import React, { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { useToast } from "../../../contexts/ToastContext";
import { useRegionalFinance } from "../../../hooks/useRegionalFinance";
import {
  MapPin,
  Phone,
  MessageSquare,
  MessageCircle,
  CheckCircle,
  Navigation,
  Loader2,
  Truck,
  Package,
  X,
  Lock,
  Store, // Ikon Toko
} from "lucide-react";

import { OrderChatRoom } from "../../../components/Chat/OrderChatRoom";

interface Props {
  order: any;
  onFinished: () => void;
}

export const CourierActiveOrder: React.FC<Props> = ({ order, onFinished }) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showChat, setShowChat] = useState(false);

  // State baru untuk menentukan siapa yang diajak chat
  const [chatTarget, setChatTarget] = useState<{
    type: "courier_customer" | "courier_merchant";
    name: string;
  }>({ type: "courier_customer", name: "Pelanggan" });

  const isCompleted =
    order?.status === "COMPLETED" || order?.shipping_status === "COMPLETED";

  // Fungsi buka chat yang lebih cerdas
  const openChat = (
    type: "courier_customer" | "courier_merchant",
    name: string,
  ) => {
    setChatTarget({ type, name });
    setShowChat(true);
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 pb-20 text-left">
      {/* MODAL CHAT - Disesuaikan dengan chatTarget */}
      {showChat && (
        <div className="fixed inset-0 z-[999] bg-slate-900/90 backdrop-blur-md flex items-end sm:items-center justify-center">
          <div className="w-full max-w-lg flex flex-col h-[85vh] bg-white rounded-t-[3rem] overflow-hidden shadow-2xl">
            <div className="p-4 flex justify-between items-center bg-slate-50 border-b border-slate-100">
              <div className="flex items-center gap-2 ml-4">
                <div
                  className={`w-2 h-2 rounded-full ${chatTarget.type === "courier_merchant" ? "bg-orange-500" : "bg-teal-500"}`}
                ></div>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                  {chatTarget.type.replace("_", " ")}
                </p>
              </div>
              <button
                onClick={() => setShowChat(false)}
                className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md text-slate-900 font-bold"
              >
                X
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <OrderChatRoom
                orderId={order.id}
                receiverName={chatTarget.name}
                chatType={chatTarget.type} // Pastikan komponen ChatRoom menerima prop ini
              />
            </div>
          </div>
        </div>
      )}

      {/* HEADER STATUS */}
      <div
        className={`p-8 rounded-[2.5rem] flex justify-between items-center shadow-2xl transition-all ${isCompleted ? "bg-slate-400" : "bg-slate-900"} text-white`}
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-teal-500 rounded-2xl flex items-center justify-center shadow-lg">
            <Truck size={24} />
          </div>
          <div>
            <h2 className="text-lg font-black uppercase italic leading-none">
              {isCompleted ? "SELESAI" : order.shipping_status}
            </h2>
            <p className="text-[10px] font-bold opacity-50 mt-1 uppercase">
              ID: {order.id.slice(0, 8)}
            </p>
          </div>
        </div>

        {/* TOMBOL QUICK CHAT (Default ke Pelanggan) */}
        <button
          onClick={() =>
            openChat(
              "courier_customer",
              order.profiles?.full_name || "Pelanggan",
            )
          }
          className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl transition-all ${isCompleted ? "bg-slate-300 text-slate-500" : "bg-yellow-400 text-slate-900 animate-bounce scale-110 border-4 border-white"}`}
        >
          <MessageCircle size={32} />
        </button>
      </div>

      {/* BODY AREA */}
      <div className="bg-white p-8 rounded-[3rem] border-2 border-slate-100 shadow-xl space-y-6">
        {/* BAGIAN TOKO (MERCHANT) */}
        <div className="flex gap-4 p-4 bg-orange-50/50 rounded-[2rem] border border-orange-100">
          <div className="w-10 h-10 bg-orange-500 text-white rounded-xl flex items-center justify-center shrink-0 shadow-sm">
            <Store size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[8px] font-black text-orange-400 uppercase tracking-widest leading-none">
              Titik Jemput
            </p>
            <h4 className="font-black text-slate-800 text-xs uppercase truncate mt-1">
              {order.merchants?.shop_name || "TOKO MITRA"}
            </h4>
            <button
              onClick={() =>
                openChat(
                  "courier_merchant",
                  order.merchants?.shop_name || "Toko",
                )
              }
              className="mt-3 flex items-center gap-2 px-4 py-2 bg-white border border-orange-200 text-orange-600 rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-orange-50 transition-all shadow-sm"
            >
              <MessageSquare size={12} /> Chat Merchant
            </button>
          </div>
        </div>

        {/* BAGIAN PELANGGAN */}
        <div className="flex gap-4 p-4">
          <div className="w-10 h-10 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center shrink-0 shadow-sm">
            <MapPin size={20} />
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">
              Titik Antar
            </p>
            <h4 className="font-black text-slate-900 text-sm uppercase mt-1">
              {order.profiles?.full_name || "PEMBELI PASARQU"}
            </h4>

            <div className="flex gap-2 mt-4">
              <button
                onClick={() =>
                  openChat(
                    "courier_customer",
                    order.profiles?.full_name || "Pelanggan",
                  )
                }
                className={`flex-1 py-4 rounded-2xl font-black text-[9px] uppercase flex items-center justify-center gap-2 transition-all shadow-lg ${isCompleted ? "bg-slate-100 text-slate-400 border-2 border-dashed border-slate-300" : "bg-slate-900 text-white active:scale-95 border-b-4 border-teal-600"}`}
              >
                {isCompleted ? <Lock size={14} /> : <MessageSquare size={14} />}
                {isCompleted ? "CHAT TERKUNCI" : "CHAT PELANGGAN"}
              </button>

              <a
                href={isCompleted ? "#" : `tel:${order.profiles?.phone_number}`}
                className="w-12 bg-slate-100 text-slate-600 rounded-2xl flex items-center justify-center shadow-inner"
              >
                <Phone size={16} />
              </a>
            </div>
          </div>
        </div>
      </div>

      {!isCompleted && (
        <button
          onClick={onFinished}
          className="w-full py-6 bg-teal-600 text-white rounded-[2rem] font-black uppercase text-sm tracking-widest shadow-2xl active:scale-95 flex items-center justify-center gap-3 border-b-4 border-teal-800"
        >
          <CheckCircle size={24} /> UPDATE STATUS TUGAS
        </button>
      )}
    </div>
  );
};
