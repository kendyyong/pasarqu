import React, { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { useToast } from "../../../contexts/ToastContext";
import { calculateDistance, formatDistanceText } from "../../../utils/geo";
import {
  Radar,
  Zap,
  Bell,
  Navigation,
  Package,
  Bike,
  Loader2,
  MapPin,
} from "lucide-react";

interface Props {
  isOnline: boolean;
  currentCoords: { lat: number; lng: number } | null;
  onOrderAccepted: () => void; // Prop baru untuk memberitahu parent ada order aktif
}

export const CourierBidArea: React.FC<Props> = ({
  isOnline,
  currentCoords,
  onOrderAccepted,
}) => {
  const { showToast } = useToast();
  const [orders, setOrders] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const fetchNearbyOrders = async () => {
    if (!isOnline || !currentCoords) return;

    const { data } = await supabase
      .from("orders")
      .select(
        `
          id, total_amount, status, created_at,
          profiles:buyer_id (name, phone_number, address, latitude, longitude),
          merchants:merchant_id (shop_name, address, latitude, longitude)
      `,
      )
      .eq("status", "READY_FOR_PICKUP")
      .order("created_at", { ascending: false });

    if (data) {
      const nearby = data
        .map((order: any) => {
          const dist = calculateDistance(
            currentCoords.lat,
            currentCoords.lng,
            order.merchants?.latitude || 0,
            order.merchants?.longitude || 0,
          );
          return { ...order, distance: dist };
        })
        .filter((order: any) => order.distance <= 10); // Filter radius 10KM

      setOrders(nearby);
    }
  };

  useEffect(() => {
    let interval: any;
    if (isOnline) {
      fetchNearbyOrders();
      interval = setInterval(fetchNearbyOrders, 5000);
    } else {
      setOrders([]);
    }
    return () => clearInterval(interval);
  }, [isOnline, currentCoords]);

  const handleAccept = async (orderId: string) => {
    if (!window.confirm("Ambil orderan ini?")) return;
    setIsProcessing(orderId);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { error } = await supabase
        .from("orders")
        .update({
          status: "ON_DELIVERY",
          courier_id: user?.id,
        })
        .eq("id", orderId);

      if (error) throw error;

      showToast("Orderan berhasil diambil! Membuka navigasi...", "success");
      onOrderAccepted(); // Memicu parent untuk ganti ke tampilan CourierActiveOrder
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setIsProcessing(null);
    }
  };

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in duration-500 text-left">
      {/* STATUS RADAR */}
      <div
        className={`p-10 rounded-[2.5rem] mb-8 text-white relative overflow-hidden flex flex-col items-center justify-center transition-all duration-700 ${isOnline ? "bg-teal-600 shadow-2xl shadow-teal-100" : "bg-slate-800"}`}
      >
        {isOnline ? (
          <>
            <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center animate-ping absolute opacity-10"></div>
            <Radar size={60} className="mb-4 animate-pulse text-teal-200" />
            <h2 className="text-2xl font-black uppercase tracking-tight text-center">
              Mencari Order...
            </h2>
            <p className="text-[10px] text-teal-100 uppercase tracking-widest mt-2 font-bold">
              Radar Aktif 10KM dari posisi Anda
            </p>
          </>
        ) : (
          <>
            <Zap size={40} className="mb-4 opacity-20" />
            <h2 className="text-xl font-black uppercase opacity-40 text-center">
              Status Offline
            </h2>
            <p className="text-[10px] opacity-30 uppercase mt-1 tracking-widest font-bold">
              Aktifkan mode kerja untuk mulai bid
            </p>
          </>
        )}
      </div>

      <div className="flex justify-between items-center mb-6 px-2">
        <h3 className="font-black text-slate-800 uppercase flex items-center gap-2 text-xs tracking-widest">
          <Bell size={14} className="text-teal-600" /> Orderan Masuk (
          {orders.length})
        </h3>
        {isOnline && (
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">
              Real-time
            </span>
          </div>
        )}
      </div>

      {orders.length === 0 ? (
        <div className="p-20 text-center rounded-[3rem] border-2 border-dashed border-slate-200 bg-white/50">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Belum ada pesanan di sekitar Anda
          </p>
        </div>
      ) : (
        <div className="space-y-4 pb-24">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 hover:border-teal-300 transition-all group"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center shadow-sm">
                    <Package size={24} />
                  </div>
                  <div>
                    <h4 className="font-black text-sm text-slate-800 uppercase tracking-tight">
                      {order.merchants?.shop_name}
                    </h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">
                      Jarak: {formatDistanceText(order.distance)}
                    </p>
                  </div>
                </div>
                <div className="bg-teal-50 text-teal-700 px-4 py-1.5 rounded-full text-[10px] font-black shadow-sm">
                  Rp{order.total_amount?.toLocaleString()}
                </div>
              </div>

              <div className="space-y-3 mb-6 bg-slate-50 p-4 rounded-2xl">
                <div className="flex gap-3">
                  <MapPin size={14} className="text-slate-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[9px] font-black text-slate-400 uppercase leading-none">
                      Ambil di Toko:
                    </p>
                    <p className="text-[11px] text-slate-600 font-bold truncate mt-1">
                      {order.merchants?.address}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Navigation size={14} className="text-teal-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[9px] font-black text-teal-600 uppercase leading-none">
                      Antar ke User:
                    </p>
                    <p className="text-[11px] text-slate-800 font-black truncate mt-1">
                      {order.profiles?.name}
                    </p>
                  </div>
                </div>
              </div>

              <button
                disabled={!!isProcessing}
                onClick={() => handleAccept(order.id)}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-teal-600 transition-all shadow-xl flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
              >
                {isProcessing === order.id ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <>
                    <Bike size={18} /> Ambil Sekarang
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
