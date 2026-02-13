import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import {
  ArrowLeft,
  MapPin,
  Navigation,
  Phone,
  MessageSquare,
  Box,
  Truck,
  CheckCircle2,
  Loader2,
  Clock,
  MessageCircle,
  X,
} from "lucide-react";
import { useToast } from "../../contexts/ToastContext";
import { OrderChatRoom } from "../../components/Chat/OrderChatRoom"; // Import Komponen Chat

export const OrderTrackingPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showChat, setShowChat] = useState(false); // State untuk buka/tutup chat

  const fetchOrderDetails = async () => {
    const { data, error } = await supabase
      .from("orders")
      .select(
        `
        *,
        couriers:courier_id (full_name, phone_number, avatar_url),
        merchants:merchant_id (shop_name, address)
      `,
      )
      .eq("id", orderId)
      .single();

    if (error) {
      showToast("Gagal memuat detail pesanan", "error");
    } else {
      setOrder(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrderDetails();

    // --- REAL-TIME LISTENER: Pantau Perubahan Status ---
    const channel = supabase
      .channel(`tracking_${orderId}`)
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
          showToast("Status pesanan diperbarui!", "info");
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <Loader2 className="animate-spin text-teal-600" size={40} />
      </div>
    );

  const status = order?.shipping_status;

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans text-left pb-24">
      {/* HEADER BAR */}
      <header className="bg-white p-6 border-b border-slate-100 flex items-center gap-4 sticky top-0 z-50">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-slate-50 rounded-full transition-all"
        >
          <ArrowLeft size={20} className="text-slate-600" />
        </button>
        <div>
          <h2 className="text-lg font-black text-slate-800 uppercase tracking-tighter leading-none">
            Lacak Pesanan
          </h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase mt-1 tracking-widest">
            ID: #{orderId?.substring(0, 8)}
          </p>
        </div>
      </header>

      <main className="p-6 space-y-6 max-w-2xl mx-auto">
        {/* RADAR ANIMATION CARD */}
        <div className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl">
          <div className="relative z-10 flex flex-col items-center text-center">
            {status === "SEARCHING_COURIER" ? (
              <>
                <div className="w-24 h-24 border border-teal-500/30 rounded-full animate-ping absolute"></div>
                <Box size={48} className="text-teal-400 mb-4 animate-bounce" />
                <h3 className="text-xl font-black uppercase tracking-tight">
                  Mencari Kurir...
                </h3>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-2">
                  Menghubungkan ke driver terdekat
                </p>
              </>
            ) : status === "COMPLETED" ? (
              <>
                <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 size={48} className="text-green-400" />
                </div>
                <h3 className="text-xl font-black uppercase tracking-tight">
                  Pesanan Sampai!
                </h3>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-2">
                  Diterima pada{" "}
                  {new Date(order.completed_at).toLocaleTimeString()}
                </p>
              </>
            ) : (
              <>
                <Truck size={48} className="text-teal-400 mb-4 animate-pulse" />
                <h3 className="text-xl font-black uppercase tracking-tight">
                  {status === "COURIER_ASSIGNED" && "Kurir Menuju Toko"}
                  {status === "PICKING_UP" && "Barang Sedang Dimuat"}
                  {status === "DELIVERING" && "Kurir Menuju Rumahmu"}
                </h3>
                <div className="flex items-center gap-2 mt-3 bg-white/10 px-4 py-2 rounded-full">
                  <Clock size={14} className="text-teal-400" />
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    Estimasi: 15-20 Menit
                  </span>
                </div>
              </>
            )}
          </div>
          <div className="absolute top-[-20px] right-[-20px] w-40 h-40 bg-teal-600/10 rounded-full blur-3xl"></div>
        </div>

        {/* COURIER INFO CARD */}
        {order.couriers && (
          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center font-black text-slate-400 overflow-hidden shadow-inner">
                {order.couriers.avatar_url ? (
                  <img
                    src={order.couriers.avatar_url}
                    alt="Courier"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  order.couriers.full_name.charAt(0)
                )}
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">
                  Kurir Anda
                </p>
                <h4 className="text-sm font-black text-slate-800 uppercase">
                  {order.couriers.full_name}
                </h4>
                <div className="flex items-center gap-1 mt-1">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-[9px] font-bold text-green-600 uppercase tracking-tighter">
                    Sedang Bertugas
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <a
                href={`tel:${order.couriers.phone_number}`}
                className="p-4 bg-slate-50 text-slate-600 rounded-2xl hover:bg-slate-100 transition-all active:scale-90"
              >
                <Phone size={18} />
              </a>
              <button
                onClick={() => setShowChat(!showChat)}
                className={`p-4 rounded-2xl transition-all active:scale-90 ${showChat ? "bg-slate-900 text-white" : "bg-teal-50 text-teal-600"}`}
              >
                {showChat ? <X size={18} /> : <MessageCircle size={18} />}
              </button>
            </div>
          </div>
        )}

        {/* CHAT SECTION (HIDDEN BY DEFAULT) */}
        {showChat && order.couriers && (
          <div className="animate-in slide-in-from-top-4 duration-300">
            <OrderChatRoom
              orderId={orderId!}
              receiverName={order.couriers.full_name}
            />
          </div>
        )}

        {/* STEPPER STATUS (VISUAL) */}
        {!showChat && (
          <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm animate-in fade-in duration-500">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8">
              Riwayat Perjalanan
            </h3>
            <div className="space-y-8 relative">
              <TrackingStep
                title="Pesanan Dibuat"
                time={new Date(order.created_at).toLocaleTimeString()}
                active={true}
                completed={true}
              />
              <TrackingStep
                title="Mencari Kurir"
                active={status === "SEARCHING_COURIER"}
                completed={status !== "SEARCHING_COURIER"}
              />
              <TrackingStep
                title="Pengambilan di Toko"
                active={
                  status === "COURIER_ASSIGNED" || status === "PICKING_UP"
                }
                completed={status === "DELIVERING" || status === "COMPLETED"}
              />
              <TrackingStep
                title="Sedang Diantar"
                active={status === "DELIVERING"}
                completed={status === "COMPLETED"}
              />
              <TrackingStep
                title="Pesanan Selesai"
                active={status === "COMPLETED"}
                completed={status === "COMPLETED"}
                isLast
              />
            </div>
          </div>
        )}

        {/* ADDRESS INFO */}
        <div className="bg-slate-50 p-6 rounded-[2.5rem] space-y-4">
          <div className="flex gap-4">
            <MapPin size={20} className="text-orange-500 shrink-0" />
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                Tujuan Pengiriman
              </p>
              <p className="text-xs font-bold text-slate-700 leading-relaxed mt-1">
                {order.address}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

// SUB-KOMPONEN STEPPER
const TrackingStep = ({ title, time, active, completed, isLast }: any) => (
  <div className="flex gap-4 relative">
    {!isLast && (
      <div
        className={`absolute left-2.5 top-6 w-[2px] h-10 ${completed ? "bg-teal-500" : "bg-slate-100"}`}
      ></div>
    )}
    <div
      className={`w-5 h-5 rounded-full border-4 z-10 ${
        active
          ? "border-teal-500 bg-white shadow-lg animate-pulse"
          : completed
            ? "bg-teal-500 border-teal-500"
            : "bg-slate-200 border-white"
      }`}
    ></div>
    <div className="flex-1 flex justify-between items-start">
      <p
        className={`text-xs font-black uppercase tracking-tight ${active ? "text-teal-600" : completed ? "text-slate-700" : "text-slate-300"}`}
      >
        {title}
      </p>
      {time && (
        <span className="text-[9px] font-bold text-slate-400">{time}</span>
      )}
    </div>
  </div>
);
