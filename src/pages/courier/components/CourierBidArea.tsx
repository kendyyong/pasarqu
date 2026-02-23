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
  const [lastSync, setLastSync] = useState<string>(
    new Date().toLocaleTimeString(),
  );

  // 1. FUNGSI AMBIL DATA PESANAN
  const fetchNearbyOrders = async () => {
    if (!isOnline || !currentCoords) return;

    try {
      const { data: rawOrders, error } = await supabase
        .from("orders")
        .select("*")
        .eq("shipping_status", "SEARCHING_COURIER")
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (rawOrders && rawOrders.length > 0) {
        const enrichedOrders = await Promise.all(
          rawOrders.map(async (order: any) => {
            let customerData = null;
            let merchantData = null;

            if (order.customer_id) {
              const { data: c } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", order.customer_id)
                .maybeSingle();
              customerData = c;
            }

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

  // 3. FUNGSI TERIMA PESANAN (LOCK SYSTEM) - FIX ERROR 400
  const handleAccept = async (orderId: string) => {
    if (!window.confirm("Ambil tugas pengantaran ini?")) return;
    setIsProcessing(orderId);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Sesi berakhir, silakan login ulang");

      // 🚀 PERBAIKAN: Hanya update kolom yang PASTI ADA di tabel orders
      // Menghilangkan status: "PAID" dan assigned_at yang memicu Error 400 Bad Request
      const updatePayload = {
        shipping_status: "COURIER_ASSIGNED",
        courier_id: user.id,
      };

      const { data, error } = await supabase
        .from("orders")
        .update(updatePayload)
        .eq("id", orderId)
        .eq("shipping_status", "SEARCHING_COURIER")
        .select();

      if (error) {
        console.error("Supabase Error 400 Details:", error);
        throw new Error(
          "Gagal mengambil order. Mungkin sudah diambil orang lain atau sistem sibuk.",
        );
      }

      if (!data || data.length === 0) {
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
    <div className="w-full animate-in fade-in duration-500 text-left font-black uppercase tracking-tighter">
      {/* STATUS RADAR VISUAL */}
      <div
        className={`p-6 md:p-8 rounded-md mb-8 text-white relative overflow-hidden flex flex-col items-center justify-center transition-all duration-700 shadow-md ${
          isOnline
            ? "bg-slate-900 border-t-4 border-[#008080]"
            : "bg-slate-800 border-t-4 border-slate-600"
        }`}
      >
        {isOnline ? (
          <>
            <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
              <div className="w-48 h-48 border border-white rounded-full animate-ping absolute"></div>
              <div className="w-32 h-32 border border-white rounded-full animate-ping delay-300 absolute"></div>
            </div>

            <Radar
              size={56}
              className="mb-4 animate-pulse text-[#008080] relative z-10"
            />
            <h2 className="text-[28px] leading-none text-center relative z-10">
              RADAR <span className="text-[#008080]">ON-DUTY</span>
            </h2>
            <div className="flex items-center gap-2 mt-4 bg-[#008080]/20 px-4 py-2 border border-[#008080]/50 rounded-md relative z-10 shadow-inner">
              <div className="w-2 h-2 rounded-full bg-[#008080] animate-pulse"></div>
              <p className="text-[10px] text-teal-400 tracking-widest leading-none">
                MEMANTAU PESANAN...
              </p>
            </div>
          </>
        ) : (
          <div className="py-6 text-center">
            <Zap size={48} className="mb-4 mx-auto text-slate-600" />
            <h2 className="text-[24px] text-slate-500">SYSTEM OFFLINE</h2>
            <p className="text-[10px] text-slate-500 mt-2 tracking-widest">
              AKTIFKAN TOMBOL ONLINE DI ATAS
            </p>
          </div>
        )}
      </div>

      {/* HEADER LIST ANTRIAN */}
      <div className="flex justify-between items-end mb-4 border-b-2 border-slate-200 pb-3 px-1">
        <div>
          <h3 className="text-[14px] text-slate-800 flex items-center gap-2 tracking-widest font-[1000]">
            <Bell size={18} className="text-[#008080]" /> ANTRIAN TUGAS (
            {orders.length})
          </h3>
          <p className="text-[9px] text-slate-400 mt-1.5 tracking-widest">
            SYNC: {lastSync}
          </p>
        </div>
        {isOnline && (
          <button
            onClick={fetchNearbyOrders}
            className="p-2.5 bg-white border border-slate-200 rounded-md hover:border-[#008080] hover:text-[#008080] active:scale-95 transition-all shadow-sm flex items-center justify-center text-slate-500"
          >
            <RefreshCw size={18} />
          </button>
        )}
      </div>

      {/* ORDERS LIST */}
      <div className="space-y-4">
        {orders.length === 0 ? (
          <div className="py-16 text-center border-2 border-dashed border-slate-300 bg-slate-50 rounded-md flex flex-col items-center shadow-inner">
            <Package size={48} className="text-slate-300 mb-4" />
            <p className="text-[11px] text-slate-400 tracking-widest leading-relaxed max-w-[200px]">
              TIDAK ADA MUATAN DI SEKITAR AREA ANDA
            </p>
          </div>
        ) : (
          orders.map((order) => (
            <div
              key={order.id}
              className="bg-white p-5 rounded-md border border-slate-200 shadow-sm hover:border-[#008080] transition-colors group animate-in slide-in-from-bottom-4 relative overflow-hidden"
            >
              {/* Garis Aksen Kiri */}
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#008080]"></div>

              <div className="flex justify-between items-start mb-5 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3 text-left">
                  <div className="w-12 h-12 bg-slate-50 rounded-md text-[#008080] flex items-center justify-center border border-slate-100 shadow-inner group-hover:bg-[#008080] group-hover:text-white transition-colors shrink-0">
                    <Package size={24} />
                  </div>
                  <div className="min-w-0 pr-2">
                    <h4 className="text-[14px] text-slate-900 truncate leading-none mb-1.5 font-[1000]">
                      {order.merchants?.shop_name ||
                        order.merchants?.name ||
                        order.merchants?.full_name ||
                        "TOKO PASARQU"}
                    </h4>
                    <div className="flex items-center gap-1.5">
                      <MapPin size={10} className="text-[#008080]" />
                      <p className="text-[10px] text-slate-500 tracking-widest">
                        JARAK:{" "}
                        <span className="text-[#008080]">
                          {formatDistanceText(order.distance)}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-orange-50 text-[#FF6600] px-3 py-2 rounded-md text-[14px] font-sans font-[1000] border border-orange-100 shadow-sm shrink-0 leading-none">
                  RP {order.shipping_cost?.toLocaleString("id-ID") || 0}
                </div>
              </div>

              {/* RUTE AREA */}
              <div className="space-y-3 mb-6 bg-slate-50 p-4 rounded-md border border-slate-100 text-left">
                <div className="flex gap-4">
                  <div className="flex flex-col items-center pt-1.5 shrink-0">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#FF6600] ring-2 ring-orange-200"></div>
                    <div className="w-0.5 h-8 bg-slate-300 border-dashed border-l-2 my-1"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-[#008080] ring-2 ring-teal-200"></div>
                  </div>
                  <div className="flex-1 space-y-4 min-w-0">
                    <div>
                      <p className="text-[9px] text-slate-400 tracking-widest mb-1 leading-none">
                        TITIK JEMPUT (TOKO)
                      </p>
                      <p className="text-[12px] text-slate-800 truncate leading-tight">
                        {order.merchants?.address || "ALAMAT TOKO BELUM DIATUR"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] text-[#008080] tracking-widest mb-1 leading-none">
                        TUJUAN ANTAR (PELANGGAN)
                      </p>
                      <p className="text-[12px] text-slate-900 truncate leading-tight">
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
                className="w-full py-4 bg-slate-900 rounded-md text-white text-[12px] tracking-widest hover:bg-[#008080] transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 shadow-sm"
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
