import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
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
  Store,
  AlertTriangle,
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

  // 🚀 STATE CHAT
  const [chatTarget, setChatTarget] = useState<{
    type: "courier_customer" | "courier_merchant";
    name: string;
    receiverId: string;
  }>({ type: "courier_customer", name: "Pelanggan", receiverId: "" });

  const isCompleted = order?.status === "COMPLETED";
  const isCanceled = order?.status === "CANCELLED";

  // 🚀 GPS TRACKER REAL-TIME (SUDAH DI-TUNE UP)
  useEffect(() => {
    // 1. Pastikan GPS hanya menyala saat kurir sedang dalam perjalanan
    const isActiveDelivery =
      order?.status === "SHIPPING" ||
      order?.status === "DELIVERING" ||
      order?.shipping_status === "SHIPPING";

    if (isActiveDelivery && user?.id) {
      console.log("🛰️ GPS Tracker Diaktifkan...");

      const interval = setInterval(() => {
        if (!navigator.geolocation) {
          console.warn("Browser tidak mendukung GPS!");
          return;
        }

        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;

            // 🚀 FIX: Tembak koordinat ke tabel 'profiles' (Sesuai arsitektur PasarQu)
            const { error } = await supabase
              .from("profiles")
              .update({
                latitude: latitude,
                longitude: longitude,
              })
              .eq("id", user.id);

            if (error) {
              console.error("❌ Gagal update GPS ke server:", error.message);
            } else {
              console.log("📍 GPS Terkirim:", latitude, longitude);
            }
          },
          (error) => {
            console.error(
              "❌ GPS Error (Pastikan Izin Lokasi HP Nyala):",
              error.message,
            );
          },
          {
            enableHighAccuracy: true, // Paksa pakai GPS satelit
            maximumAge: 0,
            timeout: 10000,
          },
        );
      }, 5000); // ⏱️ Update lokasi setiap 5 detik

      setLocationInterval(interval);

      return () => {
        clearInterval(interval);
        console.log("🛑 GPS Tracker Dimatikan.");
      };
    }
  }, [order?.status, order?.shipping_status, user?.id]);

  // 🚀 LOGIKA UPDATE STATUS YANG BENAR
  const handleStatusUpdate = async () => {
    if (!order?.id) return;
    setLoading(true);

    try {
      let nextStatus = "";
      let toastMsg = "";

      // LOGIC 1: Jika masih PACKING, Kurir TIDAK BOLEH ambil!
      if (order.status === "PACKING") {
        showToast("TUNGGU TOKO SELESAI BUNGKUS DULU, BOS!", "error");
        setLoading(false);
        return;
      }

      // LOGIC 2: Dari Menjemput -> Sedang Mengantar
      if (order.status === "READY_TO_PICKUP" || order.status === "PICKING_UP") {
        nextStatus = "SHIPPING";
        toastMsg = "STATUS: MENUJU LOKASI PEMBELI 🛵💨";
      }
      // LOGIC 3: Dari Sedang Mengantar -> Selesai
      else if (order.status === "SHIPPING" || order.status === "DELIVERING") {
        nextStatus = "COMPLETED";
      }

      // EKSEKUSI PENYELESAIAN (FINAL STEP)
      if (nextStatus === "COMPLETED") {
        // Panggil fungsi RPC untuk menyelesaikan transaksi dan mencairkan uang
        const { error: rpcError } = await supabase.rpc(
          "complete_order_transaction",
          { p_order_id: order.id },
        );

        if (rpcError) throw rpcError;

        // 🛡️ DOUBLE CHECK: Pastikan status utama (status) dan shipping_status berubah!
        await supabase
          .from("orders")
          .update({
            status: "COMPLETED",
            shipping_status: "COMPLETED",
          })
          .eq("id", order.id);

        showToast("TUGAS SELESAI! SALDO CAIR! 💰", "success");
      }
      // EKSEKUSI PERPINDAHAN STATUS BIASA
      else if (nextStatus !== "") {
        const { error } = await supabase
          .from("orders")
          .update({
            status: nextStatus,
            shipping_status: nextStatus, // Samakan agar tidak ada miskomunikasi sistem
          })
          .eq("id", order.id);

        if (error) throw error;
        showToast(toastMsg, "success");
      }

      onFinished(); // Refresh data
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
    if (!receiverId) {
      showToast("ID TUJUAN TIDAK DITEMUKAN!", "error");
      return;
    }
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

      <div className="space-y-6 animate-in slide-in-from-bottom-4 text-left font-black uppercase tracking-tighter pb-4">
        <div
          className={`p-6 rounded-md flex justify-between items-center shadow-md transition-all border-l-4 ${isCompleted ? "bg-slate-200 border-slate-400" : isCanceled ? "bg-red-50 border-red-500" : "bg-white border-[#008080]"}`}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-md flex items-center justify-center shadow-inner bg-teal-50 text-[#008080]">
              {loading ? (
                <Loader2 className="animate-spin" size={24} />
              ) : (
                <Truck size={24} />
              )}
            </div>
            <div>
              <h2 className="text-[16px] leading-none text-slate-800">
                {isCompleted
                  ? "SELESAI"
                  : isCanceled
                    ? "DIBATALKAN"
                    : order.status?.replace(/_/g, " ")}
              </h2>
              <p className="text-[10px] text-slate-400 mt-1">
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
            className="w-12 h-12 rounded-full bg-[#008080] text-white shadow-md flex items-center justify-center active:scale-95"
          >
            <MessageCircle size={24} />
          </button>
        </div>

        <div className="bg-white p-5 rounded-md border border-slate-200 shadow-sm space-y-5">
          <div className="flex gap-4 p-4 bg-orange-50/50 rounded-md border border-orange-100">
            <div className="w-10 h-10 bg-orange-50 text-[#FF6600] rounded-md flex items-center justify-center shrink-0 border border-orange-100">
              <Store size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[9px] text-orange-400">TITIK JEMPUT (TOKO)</p>
              <h4 className="font-[1000] text-slate-800 text-[12px] truncate mt-1.5">
                {order.merchants?.shop_name || "TOKO MITRA"}
              </h4>
              <button
                onClick={() =>
                  openChat(
                    "courier_merchant",
                    order.merchants?.shop_name || "Toko",
                    order.merchants?.user_id || order.merchant_id,
                  )
                }
                className="mt-3 flex items-center justify-center w-full gap-2 py-3 bg-white border border-orange-200 text-[#FF6600] rounded-md text-[10px] font-black hover:bg-orange-50 transition-all"
              >
                <MessageSquare size={14} /> CHAT MERCHANT
              </button>
            </div>
          </div>

          <div className="flex gap-4 p-4 bg-slate-50 rounded-md border border-slate-100">
            <div className="w-10 h-10 bg-white text-[#008080] rounded-md flex items-center justify-center shrink-0 border border-slate-200">
              <MapPin size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[9px] text-slate-400">TITIK ANTAR (PEMBELI)</p>
              <h4 className="font-[1000] text-slate-900 text-[12px] truncate mt-1.5">
                {order.profiles?.full_name || "PEMBELI PASARQU"}
              </h4>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() =>
                    openChat(
                      "courier_customer",
                      order.profiles?.full_name || "Pelanggan",
                      order.customer_id,
                    )
                  }
                  className="flex-1 py-3 bg-[#008080] text-white rounded-md text-[10px] flex items-center justify-center gap-2 active:scale-95"
                >
                  <MessageSquare size={14} /> CHAT PEMBELI
                </button>
                <a
                  href={`tel:${order.profiles?.phone_number}`}
                  className="w-12 bg-white border border-slate-200 text-slate-600 rounded-md flex items-center justify-center active:scale-95"
                >
                  <Phone size={16} />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* AREA TOMBOL EKSEKUSI BAWAH */}
        {!isCompleted && !isCanceled && (
          <>
            {order.status === "PACKING" ? (
              <div className="w-full py-5 bg-slate-200 text-slate-500 rounded-md font-[1000] uppercase text-[12px] shadow-sm flex items-center justify-center gap-3">
                <Loader2 className="animate-spin" size={18} />
                MENUNGGU TOKO SELESAI BUNGKUS...
              </div>
            ) : (
              <button
                onClick={handleStatusUpdate}
                disabled={loading}
                className={`w-full py-5 text-white rounded-md font-[1000] uppercase text-[14px] shadow-md active:scale-95 flex items-center justify-center gap-3 transition-colors ${
                  order.status === "SHIPPING" || order.status === "DELIVERING"
                    ? "bg-[#008080] hover:bg-teal-700"
                    : "bg-[#FF6600] hover:bg-orange-600"
                }`}
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <CheckCircle size={20} strokeWidth={3} />
                )}
                {order.status === "SHIPPING" || order.status === "DELIVERING"
                  ? "KONFIRMASI BARANG TIBA!"
                  : "SAYA SUDAH AMBIL BARANG"}
              </button>
            )}
          </>
        )}
      </div>
    </>
  );
};

export default CourierActiveOrder;
