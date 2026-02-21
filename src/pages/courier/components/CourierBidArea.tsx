import React, { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { useToast } from "../../../contexts/ToastContext";
import { calculateDistance, formatDistanceText } from "../../../utils/geo";
import {
  Radar,
  Zap,
  Bell,
  Package,
  Bike,
  Loader2,
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

  // 1. FUNGSI AMBIL DATA PESANAN (ANTI 400 ERROR DENGAN SELECT *)
  const fetchNearbyOrders = async () => {
    if (!isOnline || !currentCoords) return;

    try {
      // Step A: Ambil orderan mentah
      const { data: rawOrders, error } = await supabase
        .from("orders")
        .select("*")
        .eq("shipping_status", "SEARCHING_COURIER")
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (rawOrders && rawOrders.length > 0) {
        // Step B: Manual Join Data Menggunakan Select * (Aman dari kolom mismatch)
        const enrichedOrders = await Promise.all(
          rawOrders.map(async (order: any) => {
            let customerData = null;
            let merchantData = null;

            // Cari Customer di profiles (Gunakan * agar tidak error jika kolom beda nama)
            if (order.customer_id) {
              const { data: c } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", order.customer_id)
                .maybeSingle();
              customerData = c;
            }

            // Cari Merchant di profiles atau merchants
            if (order.merchant_id) {
              let { data: m } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", order.merchant_id)
                .maybeSingle();
              if (!m) {
                const { data: m2 } = await supabase
                  .from("merchants")
                  .select("*")
                  .eq("id", order.merchant_id)
                  .maybeSingle();
                m = m2;
              }
              merchantData = m;
            }

            return {
              ...order,
              profiles: customerData,
              merchants: merchantData,
            };
          }),
        );

        // Step C: Hitung Jarak dan Filter Radius
        const nearby = enrichedOrders
          .map((order: any) => {
            const dist = calculateDistance(
              currentCoords.lat,
              currentCoords.lng,
              order.merchants?.latitude || 0,
              order.merchants?.longitude || 0,
            );
            return { ...order, distance: dist };
          })
          .filter((order: any) => order.distance <= 15) // Radius 15KM
          .sort((a, b) => a.distance - b.distance);

        setOrders(nearby);
      } else {
        setOrders([]);
      }
      setLastSync(new Date().toLocaleTimeString());
    } catch (err: any) {
      console.error("Fetch Error:", err.message);
    }
  };

  // 2. REAL-TIME LISTENER
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
      onOrderAccepted();
    } catch (err: any) {
      showToast(err.message, "error");
      fetchNearbyOrders();
    } finally {
      setIsProcessing(null);
    }
  };

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in duration-500 text-left pb-20 font-black uppercase tracking-tighter">
      {/* STATUS RADAR VISUAL */}
      <div
        className={`p-10 rounded-xl mb-8 text-white relative overflow-hidden flex flex-col items-center justify-center transition-all duration-700 border-[6px] shadow-[15px_15px_0px_0px_rgba(0,0,0,0.2)] ${
          isOnline
            ? "bg-slate-900 border-[#008080]"
            : "bg-slate-800 border-slate-700"
        }`}
      >
        {isOnline ? (
          <>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#008080]/20 via-transparent to-transparent"></div>
            <div className="w-64 h-64 border-4 border-[#008080]/30 rounded-full animate-ping absolute"></div>
            <div className="w-40 h-40 border-4 border-[#008080]/40 rounded-full animate-ping delay-300 absolute"></div>
            <Radar
              size={64}
              className="mb-4 animate-pulse text-[#008080] relative z-10"
            />
            <h2 className="text-3xl leading-none text-center relative z-10">
              RADAR <span className="text-[#008080]">ON-DUTY</span>
            </h2>
            <div className="flex items-center gap-2 mt-4 bg-[#008080]/20 px-4 py-2 border-2 border-[#008080]/50 relative z-10">
              <div className="w-2 h-2 bg-[#008080] animate-pulse"></div>
              <p className="text-[10px] text-teal-400 tracking-widest">
                MEMANTAU PESANAN...
              </p>
            </div>
          </>
        ) : (
          <div className="py-4 text-center">
            <Zap size={40} className="mb-4 mx-auto opacity-20" />
            <h2 className="text-2xl opacity-40">SYSTEM OFFLINE</h2>
            <p className="text-[10px] opacity-40 mt-2 tracking-widest">
              AKTIFKAN STATUS DI SIDEBAR UNTUK MEMULAI
            </p>
          </div>
        )}
      </div>

      {/* HEADER LIST */}
      <div className="flex justify-between items-end mb-6 px-2 border-b-4 border-slate-900 pb-4">
        <div>
          <h3 className="text-xl text-slate-900 flex items-center gap-2">
            <Bell size={20} className="text-[#008080]" /> ANTRIAN TUGAS (
            {orders.length})
          </h3>
          <p className="text-[10px] text-slate-400 mt-1">SYNC: {lastSync}</p>
        </div>
        {isOnline && (
          <button
            onClick={fetchNearbyOrders}
            className="p-3 bg-white border-2 border-slate-200 hover:border-[#008080] hover:text-[#008080] hover:rotate-180 transition-all duration-500 shadow-sm"
          >
            <RefreshCw size={20} />
          </button>
        )}
      </div>

      {/* ORDERS LIST */}
      <div className="space-y-6">
        {orders.length === 0 ? (
          <div className="p-20 text-center border-4 border-dashed border-slate-300 bg-white flex flex-col items-center shadow-inner">
            <Package size={64} className="text-slate-300 mb-4" />
            <p className="text-[12px] text-slate-400 tracking-widest leading-relaxed max-w-[200px]">
              TIDAK ADA MUATAN DI SEKITAR AREA ANDA
            </p>
          </div>
        ) : (
          orders.map((order) => (
            <div
              key={order.id}
              className="bg-white p-6 border-4 border-slate-900 shadow-[10px_10px_0px_0px_rgba(0,0,0,0.1)] hover:border-[#008080] transition-colors group animate-in slide-in-from-bottom-6"
            >
              <div className="flex justify-between items-start mb-6 border-b-2 border-slate-100 pb-4">
                <div className="flex items-center gap-4 text-left">
                  <div className="w-14 h-14 bg-slate-900 text-white flex items-center justify-center border-b-4 border-[#008080] group-hover:scale-105 transition-transform">
                    <Package size={28} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-[16px] text-slate-900 truncate leading-none mb-2">
                      {order.merchants?.shop_name ||
                        order.merchants?.name ||
                        order.merchants?.full_name ||
                        "TOKO PASARQU"}
                    </h4>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-[#008080]"></div>
                      <p className="text-[10px] text-[#008080] tracking-widest">
                        JARAK: {formatDistanceText(order.distance)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-slate-900 text-white px-4 py-2 text-[14px] border-b-4 border-orange-500 shadow-sm">
                  RP {order.shipping_cost?.toLocaleString("id-ID") || 0}
                </div>
              </div>

              {/* RUTE AREA */}
              <div className="space-y-4 mb-8 bg-slate-50 p-5 border-2 border-slate-200 text-left">
                <div className="flex gap-4">
                  <div className="flex flex-col items-center pt-1">
                    <div className="w-3 h-3 bg-orange-500 border-2 border-slate-900"></div>
                    <div className="w-0.5 h-10 bg-slate-300 border-dashed border-l-2 my-1"></div>
                    <div className="w-3 h-3 bg-[#008080] border-2 border-slate-900"></div>
                  </div>
                  <div className="flex-1 space-y-5 min-w-0">
                    <div>
                      <p className="text-[9px] text-slate-400 tracking-widest mb-1">
                        TITIK JEMPUT (TOKO)
                      </p>
                      <p className="text-[12px] text-slate-800 truncate">
                        {order.merchants?.address || "ALAMAT TOKO BELUM DIATUR"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] text-[#008080] tracking-widest mb-1">
                        TUJUAN ANTAR (PELANGGAN)
                      </p>
                      <p className="text-[12px] text-slate-900 truncate">
                        {order.profiles?.full_name ||
                          order.profiles?.name ||
                          "PELANGGAN PASARQU"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <button
                disabled={!!isProcessing}
                onClick={() => handleAccept(order.id)}
                className="w-full py-5 bg-[#008080] border-4 border-slate-900 text-white text-[14px] tracking-widest hover:bg-slate-900 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 shadow-[5px_5px_0px_0px_rgba(0,0,0,0.2)]"
              >
                {isProcessing === order.id ? (
                  <Loader2 className="animate-spin" size={24} />
                ) : (
                  <>
                    <Bike size={24} /> AMBIL TUGAS SEKARANG
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
