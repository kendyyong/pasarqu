import React, { useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { useToast } from "../../../contexts/ToastContext";
import {
  MapPin,
  Phone,
  MessageSquare,
  CheckCircle,
  Navigation,
  Store,
  Loader2,
  Truck,
} from "lucide-react";

interface Props {
  order: any;
  onFinished: () => void;
}

export const CourierActiveOrder: React.FC<Props> = ({ order, onFinished }) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleFinishOrder = async () => {
    if (!window.confirm("Konfirmasi pesanan telah sampai di tujuan?")) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: "COMPLETED" })
        .eq("id", order.id);

      if (error) throw error;
      showToast("Tugas Selesai! Cuan masuk ke dompet.", "success");
      onFinished();
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const openGoogleMaps = (lat: number, lng: number) => {
    window.open(`https://www.google.com/maps?q=${lat},${lng}`, "_blank");
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in slide-in-from-bottom-6 duration-500 text-left pb-24">
      {/* STATUS HEADER */}
      <div className="bg-teal-600 p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
            <Truck size={28} />
          </div>
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight">
              Pesanan Aktif
            </h2>
            <p className="text-[10px] font-bold text-teal-100 uppercase tracking-widest">
              Antarkan barang ke tujuan
            </p>
          </div>
        </div>
      </div>

      {/* STEP 1: PENGAMBILAN */}
      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-[10px] font-black">
            1
          </div>
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Titik Toko
          </h3>
        </div>
        <div className="flex justify-between items-center">
          <div className="flex items-start gap-4 overflow-hidden">
            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-teal-600 shrink-0">
              <Store size={24} />
            </div>
            <div className="min-w-0">
              <h4 className="font-black text-slate-800 uppercase text-sm truncate">
                {order.merchants?.shop_name}
              </h4>
              <p className="text-[11px] text-slate-500 line-clamp-2 leading-tight">
                {order.merchants?.address}
              </p>
            </div>
          </div>
          <button
            onClick={() =>
              openGoogleMaps(
                order.merchants?.latitude,
                order.merchants?.longitude,
              )
            }
            className="p-3 bg-slate-900 text-white rounded-xl shadow-lg hover:bg-teal-600 transition-all ml-4"
          >
            <Navigation size={18} />
          </button>
        </div>
      </div>

      {/* STEP 2: PENGANTARAN */}
      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center text-[10px] font-black">
            2
          </div>
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Titik Pembeli
          </h3>
        </div>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex items-start gap-4 overflow-hidden">
              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-orange-500 shrink-0">
                <MapPin size={24} />
              </div>
              <div className="min-w-0">
                <h4 className="font-black text-slate-800 uppercase text-sm truncate">
                  {order.profiles?.name}
                </h4>
                <p className="text-[11px] text-slate-500 line-clamp-2 leading-tight">
                  {order.profiles?.address}
                </p>
              </div>
            </div>
            <button
              onClick={() =>
                openGoogleMaps(
                  order.profiles?.latitude,
                  order.profiles?.longitude,
                )
              }
              className="p-3 bg-teal-600 text-white rounded-xl shadow-lg hover:bg-teal-700 transition-all ml-4"
            >
              <Navigation size={18} />
            </button>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() =>
                window.open(
                  `https://wa.me/${order.profiles?.phone_number}`,
                  "_blank",
                )
              }
              className="flex-1 py-3 bg-green-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-md hover:bg-green-600 transition-all"
            >
              <MessageSquare size={14} /> WhatsApp
            </button>
            <button
              onClick={() =>
                window.open(`tel:${order.profiles?.phone_number}`, "_blank")
              }
              className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2"
            >
              <Phone size={14} /> Telepon
            </button>
          </div>
        </div>
      </div>

      {/* FINISH BUTTON */}
      <button
        disabled={loading}
        onClick={handleFinishOrder}
        className="w-full py-5 bg-teal-600 text-white rounded-[2rem] font-black uppercase text-xs tracking-[0.2em] shadow-2xl shadow-teal-200 hover:bg-teal-700 active:scale-95 transition-all flex items-center justify-center gap-3"
      >
        {loading ? (
          <Loader2 className="animate-spin" />
        ) : (
          <>
            <CheckCircle size={20} /> Konfirmasi Pesanan Sampai
          </>
        )}
      </button>
    </div>
  );
};
