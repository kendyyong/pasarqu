import React, { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { useToast } from "../../../contexts/ToastContext";
import { calculateDistance, formatDistanceText } from "../../../utils/geo";
import {
  Radar,
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

  const fetchNearbyOrders = async () => {
    if (!isOnline || !currentCoords) return;
    try {
      // 🚀 FIX: Tarik SEMUA data merchant termasuk Alamat (address)
      const { data, error } = await supabase
        .from("orders")
        .select(
          `
            *, 
            merchants:merchant_id (id, shop_name, name, address, latitude, longitude), 
            profiles:customer_id (full_name, name)
        `,
        )
        .eq("shipping_status", "SEARCHING_COURIER")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const nearby = (data || [])
        .map((o: any) => ({
          ...o,
          distance: calculateDistance(
            currentCoords.lat,
            currentCoords.lng,
            o.merchants?.latitude || 0,
            o.merchants?.longitude || 0,
          ),
        }))
        .filter((o) => o.distance <= 25)
        .sort((a, b) => a.distance - b.distance);

      setOrders(nearby);
    } catch (err: any) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (isOnline) fetchNearbyOrders();
  }, [isOnline, currentCoords]);

  return (
    <div className="w-full space-y-4 font-black uppercase tracking-tighter text-left">
      {orders.map((o) => (
        <div
          key={o.id}
          className="bg-white p-5 rounded-xl border-2 border-slate-100 shadow-sm relative overflow-hidden"
        >
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#008080]"></div>
          <div className="flex justify-between items-start mb-4">
            <div>
              <h4 className="text-[14px] text-slate-900 leading-none mb-1">
                {o.merchants?.shop_name || "TOKO MITRA"}
              </h4>
              <p className="text-[10px] text-[#008080]">
                JARAK: {formatDistanceText(o.distance)}
              </p>
            </div>
            <div className="bg-orange-50 px-3 py-1.5 rounded-lg text-[#FF6600] font-sans font-black">
              RP {o.shipping_cost?.toLocaleString()}
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl space-y-4 mb-5 border border-slate-100">
            <div className="flex gap-3">
              <div className="w-2 h-2 rounded-full bg-[#FF6600] mt-1"></div>
              <div className="min-w-0 flex-1">
                <p className="text-[8px] text-slate-400 mb-0.5">
                  TITIK JEMPUT (TOKO)
                </p>
                {/* 🚀 FIX: Tampilkan Alamat Asli Toko */}
                <p className="text-[11px] text-slate-800 font-bold truncate">
                  {o.merchants?.address || "LOKASI TOKO BELUM DISET DI PROFIL"}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-2 h-2 rounded-full bg-[#008080] mt-1"></div>
              <div className="min-w-0 flex-1">
                <p className="text-[8px] text-[#008080] mb-0.5">
                  TUJUAN ANTAR (PELANGGAN)
                </p>
                <p className="text-[11px] text-slate-900 font-bold truncate">
                  {o.profiles?.full_name || "PELANGGAN"}
                </p>
              </div>
            </div>
          </div>

          <button
            disabled={!!isProcessing}
            onClick={() => onOrderAccepted()}
            className="w-full py-4 bg-slate-900 text-white rounded-xl text-[12px] flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
          >
            <Bike size={20} /> AMBIL TUGAS SEKARANG
          </button>
        </div>
      ))}
    </div>
  );
};
