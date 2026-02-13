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
  onOrderAccepted: () => void;
}

export const CourierBidArea: React.FC<Props> = ({
  isOnline,
  currentCoords,
  onOrderAccepted,
}) => {
  const { showToast } = useToast();
  const [orders, setOrders] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  // 1. FUNGSI AMBIL DATA PESANAN SEKITAR
  const fetchNearbyOrders = async () => {
    if (!isOnline || !currentCoords) return;

    const { data, error } = await supabase
      .from("orders")
      .select(
        `
          id, total_price, shipping_cost, status, shipping_status, created_at,
          profiles:customer_id (full_name, phone_number, address, latitude, longitude),
          merchants:merchant_id (shop_name, address, latitude, longitude)
        `,
      )
      // Mencari pesanan yang sedang butuh kurir
      .eq("shipping_status", "SEARCHING_COURIER")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetch orders:", error.message);
      return;
    }

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
        .filter((order: any) => order.distance <= 10); // Radius 10KM

      setOrders(nearby);
    }
  };

  // 2. REAL-TIME LISTENER & INITIAL FETCH
  useEffect(() => {
    if (isOnline) {
      fetchNearbyOrders();

      // Subscribe ke perubahan tabel orders secara real-time
      const channel = supabase
        .channel("courier_radar_channel")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "orders",
            filter: "shipping_status=eq.SEARCHING_COURIER",
          },
          (payload) => {
            if (payload.eventType === "INSERT") {
              // Mainkan Suara Notifikasi
              const audio = new Audio(
                "https://assets.mixkit.co/active_storage/sfx/2505/2505-preview.mp3",
              );
              audio.play().catch(() => {});
              showToast("ADA ORDERAN BARU DI SEKITARMU!", "success");
            }
            fetchNearbyOrders();
          },
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } else {
      setOrders([]);
    }
  }, [isOnline, currentCoords]);

  // 3. FUNGSI AMBIL ORDER (ACCEPT BID)
  const handleAccept = async (orderId: string) => {
    if (!window.confirm("Ambil orderan ini sekarang?")) return;
    setIsProcessing(orderId);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Update status pesanan: Kunci kurir dan ubah status pengiriman
      const { error } = await supabase
        .from("orders")
        .update({
          shipping_status: "COURIER_ASSIGNED",
          status: "PAID", // Tetap PAID karena sudah dibayar di checkout
          courier_id: user?.id,
        })
        .eq("id", orderId)
        .eq("shipping_status", "SEARCHING_COURIER"); // Safety check agar tidak balapan

      if (error) throw new Error("Maaf, order ini sudah diambil driver lain.");

      showToast(
        "Orderan berhasil diambil! Silakan jemput barang ke Toko.",
        "success",
      );
      onOrderAccepted(); // Callback untuk refresh UI Parent (CourierDashboard)
    } catch (err: any) {
      showToast(err.message, "error");
      fetchNearbyOrders(); // Refresh list jika gagal
    } finally {
      setIsProcessing(null);
    }
  };

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in duration-500 text-left">
      {/* STATUS RADAR VISUAL */}
      <div
        className={`p-10 rounded-[2.5rem] mb-8 text-white relative overflow-hidden flex flex-col items-center justify-center transition-all duration-700 shadow-2xl ${
          isOnline
            ? "bg-slate-900 shadow-teal-900/20 border border-teal-500/20"
            : "bg-slate-800"
        }`}
      >
        {isOnline ? (
          <>
            <div className="w-48 h-48 border border-teal-500/20 rounded-full animate-ping absolute"></div>
            <div className="w-32 h-32 border border-teal-500/40 rounded-full animate-ping delay-150 absolute"></div>
            <Radar
              size={60}
              className="mb-4 animate-pulse text-teal-400 relative z-10"
            />
            <h2 className="text-2xl font-black uppercase tracking-tight text-center relative z-10">
              RADAR AKTIF
            </h2>
            <p className="text-[10px] text-teal-400 uppercase tracking-[0.3em] mt-2 font-black relative z-10 animate-pulse">
              Memindai Pesanan Wilayah...
            </p>
          </>
        ) : (
          <>
            <Zap size={40} className="mb-4 opacity-20" />
            <h2 className="text-xl font-black uppercase opacity-40 text-center">
              Driver Offline
            </h2>
            <p className="text-[10px] opacity-30 uppercase mt-1 tracking-widest font-bold">
              Aktifkan tombol Online untuk mulai bekerja
            </p>
          </>
        )}
      </div>

      {/* HEADER LIST */}
      <div className="flex justify-between items-center mb-6 px-2">
        <h3 className="font-black text-slate-800 uppercase flex items-center gap-2 text-xs tracking-widest">
          <Bell size={14} className="text-teal-600" /> Orderan Tersedia (
          {orders.length})
        </h3>
        {isOnline && (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-green-50 rounded-full">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-[8px] font-black text-green-600 uppercase tracking-tighter">
              Live Feed
            </span>
          </div>
        )}
      </div>

      {/* ORDERS LIST */}
      {orders.length === 0 ? (
        <div className="p-20 text-center rounded-[3rem] border-2 border-dashed border-slate-200 bg-white/50 flex flex-col items-center">
          <Package size={40} className="text-slate-200 mb-4" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed max-w-[150px]">
            Belum ada pesanan masuk di radius Anda
          </p>
        </div>
      ) : (
        <div className="space-y-4 pb-24">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white p-7 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 hover:border-teal-500 transition-all group animate-in slide-in-from-bottom-4"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-orange-50 text-orange-600 rounded-[1.2rem] flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                    <Package size={28} />
                  </div>
                  <div>
                    <h4 className="font-black text-sm text-slate-800 uppercase tracking-tight">
                      {order.merchants?.shop_name}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <MapPin size={10} className="text-teal-600" />
                      <p className="text-[10px] text-teal-600 font-black uppercase tracking-wide">
                        {formatDistanceText(order.distance)} dari lokasi Anda
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-slate-900 text-white px-5 py-2 rounded-2xl text-[12px] font-black shadow-lg">
                  Rp{order.total_price?.toLocaleString()}
                </div>
              </div>

              <div className="space-y-4 mb-8 bg-slate-50 p-5 rounded-[1.5rem] border border-slate-100">
                <div className="flex gap-3">
                  <MapPin
                    size={16}
                    className="text-slate-400 shrink-0 mt-0.5"
                  />
                  <div className="min-w-0">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                      Titik Jemput:
                    </p>
                    <p className="text-[11px] text-slate-600 font-bold mt-1 leading-relaxed">
                      {order.merchants?.address}
                    </p>
                  </div>
                </div>
                <div className="h-[1px] w-full bg-slate-200 border-dashed border-t"></div>
                <div className="flex gap-3">
                  <Navigation
                    size={16}
                    className="text-teal-500 shrink-0 mt-0.5"
                  />
                  <div className="min-w-0">
                    <p className="text-[9px] font-black text-teal-600 uppercase tracking-widest">
                      Tujuan Antar:
                    </p>
                    <p className="text-[11px] text-slate-800 font-black mt-1 leading-relaxed">
                      {order.profiles?.full_name || "Pelanggan Pasarqu"}
                    </p>
                  </div>
                </div>
              </div>

              <button
                disabled={!!isProcessing}
                onClick={() => handleAccept(order.id)}
                className="w-full py-5 bg-teal-600 text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] hover:bg-slate-900 transition-all shadow-xl shadow-teal-100 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
              >
                {isProcessing === order.id ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <>
                    <Bike size={20} /> TERIMA PESANAN
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
