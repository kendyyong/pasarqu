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
  RefreshCw,
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
  const [lastSync, setLastSync] = useState<string>(
    new Date().toLocaleTimeString(),
  );

  // 1. FUNGSI AMBIL DATA PESANAN SEKITAR
  const fetchNearbyOrders = async () => {
    if (!isOnline || !currentCoords) return;

    try {
      const { data, error } = await supabase
        .from("orders")
        .select(
          `
          id, total_price, shipping_cost, status, shipping_status, created_at,
          profiles:customer_id (full_name, phone_number, address, latitude, longitude),
          merchants:merchant_id (shop_name, address, latitude, longitude)
        `,
        )
        .eq("shipping_status", "SEARCHING_COURIER")
        .order("created_at", { ascending: false });

      if (error) throw error;

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
          .filter((order: any) => order.distance <= 15) // Radius ditingkatkan ke 15KM
          .sort((a, b) => a.distance - b.distance); // Urutkan dari yang terdekat

        setOrders(nearby);
        setLastSync(new Date().toLocaleTimeString());
      }
    } catch (err: any) {
      console.error("Fetch Error:", err.message);
    }
  };

  // 2. REAL-TIME LISTENER & INITIAL FETCH
  useEffect(() => {
    if (isOnline) {
      fetchNearbyOrders();

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
              // Efek Suara Notifikasi
              const audio = new Audio(
                "https://assets.mixkit.co/active_storage/sfx/2505/2505-preview.mp3",
              );
              audio.play().catch(() => {});
              showToast("ORDERAN BARU TERDETEKSI!", "success");
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

  // 3. FUNGSI TERIMA PESANAN (LOCK SYSTEM)
  const handleAccept = async (orderId: string) => {
    if (!window.confirm("Ambil tugas pengantaran ini?")) return;
    setIsProcessing(orderId);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Sesi berakhir, silakan login ulang");

      // Update dengan Double Check: Pastikan masih SEARCHING_COURIER agar tidak balapan
      const { data, error } = await supabase
        .from("orders")
        .update({
          shipping_status: "COURIER_ASSIGNED",
          status: "PAID",
          courier_id: user.id,
          assigned_at: new Date().toISOString(),
        })
        .eq("id", orderId)
        .eq("shipping_status", "SEARCHING_COURIER")
        .select();

      if (error || !data || data.length === 0) {
        throw new Error("Maaf, order ini sudah diambil driver lain!");
      }

      showToast("Orderan Terkunci! Segera jemput ke toko.", "success");
      onOrderAccepted(); // Beritahu Parent untuk pindah ke mode Active Order
    } catch (err: any) {
      showToast(err.message, "error");
      fetchNearbyOrders();
    } finally {
      setIsProcessing(null);
    }
  };

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in duration-500 text-left pb-20">
      {/* STATUS RADAR VISUAL */}
      <div
        className={`p-10 rounded-[3rem] mb-8 text-white relative overflow-hidden flex flex-col items-center justify-center transition-all duration-700 shadow-2xl ${
          isOnline
            ? "bg-slate-900 shadow-teal-900/40 border border-teal-500/20"
            : "bg-slate-800"
        }`}
      >
        {isOnline ? (
          <>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-teal-500/10 via-transparent to-transparent"></div>
            <div className="w-64 h-64 border border-teal-500/10 rounded-full animate-ping absolute"></div>
            <div className="w-40 h-40 border border-teal-500/20 rounded-full animate-ping delay-300 absolute"></div>
            <Radar
              size={64}
              className="mb-4 animate-pulse text-teal-400 relative z-10"
            />
            <h2 className="text-2xl font-black uppercase tracking-tighter text-center relative z-10 italic">
              RADAR <span className="text-teal-500">ON-DUTY</span>
            </h2>
            <div className="flex items-center gap-2 mt-2 bg-teal-500/10 px-4 py-1.5 rounded-full border border-teal-500/20 relative z-10">
              <div className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-pulse"></div>
              <p className="text-[9px] text-teal-400 uppercase tracking-widest font-black">
                Memantau Pesanan...
              </p>
            </div>
          </>
        ) : (
          <div className="py-4 text-center">
            <Zap size={40} className="mb-4 mx-auto opacity-20" />
            <h2 className="text-xl font-black uppercase opacity-40 italic">
              System Offline
            </h2>
            <p className="text-[10px] opacity-30 uppercase mt-1 tracking-widest font-bold">
              Aktifkan status di sidebar untuk mulai menerima order
            </p>
          </div>
        )}
      </div>

      {/* HEADER LIST */}
      <div className="flex justify-between items-end mb-6 px-4">
        <div>
          <h3 className="font-black text-slate-800 uppercase flex items-center gap-2 text-xs tracking-widest">
            <Bell size={14} className="text-teal-600" /> Nearby Orders (
            {orders.length})
          </h3>
          <p className="text-[8px] text-slate-400 font-bold uppercase mt-1">
            Sync: {lastSync}
          </p>
        </div>
        {isOnline && (
          <button
            onClick={fetchNearbyOrders}
            className="p-2 bg-white rounded-xl shadow-sm hover:rotate-180 transition-all duration-500 border border-slate-100"
          >
            <RefreshCw size={14} className="text-slate-400" />
          </button>
        )}
      </div>

      {/* ORDERS LIST */}
      <div className="space-y-4">
        {orders.length === 0 ? (
          <div className="p-20 text-center rounded-[3.5rem] border-2 border-dashed border-slate-200 bg-white/30 flex flex-col items-center">
            <Package size={48} className="text-slate-200 mb-4" />
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] leading-relaxed max-w-[200px]">
              Belum ada muatan di sekitar pangkalan Anda
            </p>
          </div>
        ) : (
          orders.map((order) => (
            <div
              key={order.id}
              className="bg-white p-7 rounded-[2.5rem] shadow-xl shadow-slate-200/40 border border-slate-50 hover:border-teal-500 transition-all group animate-in slide-in-from-bottom-6"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4 text-left">
                  <div className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                    <Package size={28} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-black text-sm text-slate-800 uppercase tracking-tighter truncate leading-none mb-1">
                      {order.merchants?.shop_name}
                    </h4>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 bg-teal-500 rounded-full"></div>
                      <p className="text-[10px] text-teal-600 font-black uppercase tracking-tight">
                        {formatDistanceText(order.distance)} dari Anda
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-teal-50 text-teal-600 px-4 py-2 rounded-2xl text-[14px] font-black shadow-sm">
                  Rp{order.shipping_cost?.toLocaleString("id-ID")}
                </div>
              </div>

              {/* RUTE AREA */}
              <div className="space-y-4 mb-8 bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100 text-left">
                <div className="flex gap-4">
                  <div className="flex flex-col items-center pt-1">
                    <div className="w-2.5 h-2.5 bg-orange-500 rounded-full"></div>
                    <div className="w-0.5 h-8 bg-slate-200 border-dashed border-l"></div>
                    <div className="w-2.5 h-2.5 bg-teal-600 rounded-full"></div>
                  </div>
                  <div className="flex-1 space-y-4 min-w-0">
                    <div>
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                        Penjemputan
                      </p>
                      <p className="text-[11px] text-slate-600 font-bold truncate leading-relaxed">
                        {order.merchants?.address}
                      </p>
                    </div>
                    <div>
                      <p className="text-[8px] font-black text-teal-600 uppercase tracking-widest">
                        Tujuan Antar
                      </p>
                      <p className="text-[11px] text-slate-800 font-black truncate leading-relaxed">
                        {order.profiles?.full_name || "Pelanggan Pasarqu"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <button
                disabled={!!isProcessing}
                onClick={() => handleAccept(order.id)}
                className="w-full py-5 bg-slate-900 text-white rounded-[1.8rem] font-black uppercase text-xs tracking-[0.2em] hover:bg-teal-600 transition-all shadow-2xl flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
              >
                {isProcessing === order.id ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <>
                    <Bike size={20} /> AMBIL TUGAS SEKARANG
                  </>
                )}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
