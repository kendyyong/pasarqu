import React, { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { useToast } from "../../../contexts/ToastContext";
import { useRegionalFinance } from "../../../hooks/useRegionalFinance";
import {
  MapPin,
  Phone,
  MessageSquare,
  CheckCircle,
  Navigation,
  Store,
  Loader2,
  Truck,
  Wallet,
  Info,
} from "lucide-react";

interface Props {
  order: any;
  onFinished: () => void;
}

export const CourierActiveOrder: React.FC<Props> = ({ order, onFinished }) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [marketKecamatan, setMarketKecamatan] = useState<string>("");

  // 1. Ambil info kecamatan pasar (Hanya untuk keperluan sistem mengambil data keuangan)
  useEffect(() => {
    const fetchMarketInfo = async () => {
      if (order?.market_id) {
        const { data } = await supabase
          .from("markets")
          .select("kecamatan")
          .eq("id", order.market_id)
          .single();
        if (data) setMarketKecamatan(data.kecamatan);
      }
    };
    fetchMarketInfo();
  }, [order]);

  // 2. Ambil Aturan Keuangan Kecamatan tersebut
  const { regionalSettings, loading: loadingFinance } =
    useRegionalFinance(marketKecamatan);

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
    window.open(`http://maps.google.com/?q=${lat},${lng}`, "_blank");
  };

  // 3. Kalkulasi Pendapatan Bersih Kurir
  const deliveryFee = 5000; // Contoh Ongkir
  const appFee = regionalSettings?.courier_app_fee ?? 1000;
  const netEarnings = deliveryFee - appFee;

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in slide-in-from-bottom-6 duration-500 text-left pb-24 px-4">
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
        <Truck className="absolute -right-10 -bottom-10 text-white/10 w-48 h-48 -rotate-12" />
      </div>

      {/* KARTU PENDAPATAN BERSIH */}
      <div className="bg-white p-6 rounded-[2.5rem] border-2 border-teal-50 shadow-sm overflow-hidden relative group">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
              <Wallet size={12} className="text-teal-600" /> Estimasi Pendapatan
            </h3>
            <p className="text-2xl font-black text-slate-800 tracking-tighter mt-1">
              Rp {netEarnings.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="space-y-2 border-t border-slate-50 pt-4">
          <div className="flex justify-between text-xs font-bold">
            <span className="text-slate-400">Ongkos Kirim</span>
            <span className="text-slate-700">
              Rp {deliveryFee.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between text-xs font-bold">
            <span className="text-slate-400">Biaya Aplikasi</span>{" "}
            {/* Berubah dari Potongan ke Biaya */}
            {loadingFinance ? (
              <Loader2 size={12} className="animate-spin text-teal-600" />
            ) : (
              <span className="text-orange-500">
                - Rp {appFee.toLocaleString()}
              </span>
            )}
          </div>
        </div>

        <div className="mt-4 p-3 bg-slate-50 rounded-xl flex items-start gap-2">
          <Info size={14} className="text-blue-500 shrink-0 mt-0.5" />
          <p className="text-[9px] text-slate-500 leading-relaxed font-medium">
            Pendapatan bersih Anda adalah total ongkos kirim dikurangi biaya
            penggunaan sistem aplikasi.
          </p>
        </div>
      </div>

      {/* TITIK TOKO */}
      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm text-left">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-[10px] font-black">
            1
          </div>
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Titik Toko
          </h3>
        </div>
        <div className="flex justify-between items-center text-left">
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
            className="p-3 bg-slate-900 text-white rounded-xl shadow-lg hover:bg-teal-600 ml-4 transition-all"
          >
            <Navigation size={18} />
          </button>
        </div>
      </div>

      {/* TITIK PEMBELI */}
      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm text-left">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center text-[10px] font-black">
            2
          </div>
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Titik Pembeli
          </h3>
        </div>
        <div className="space-y-6">
          <div className="flex justify-between items-center text-left">
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
              className="p-3 bg-teal-600 text-white rounded-xl shadow-lg hover:bg-teal-700 ml-4 transition-all"
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
              className="flex-1 py-3 bg-green-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-md"
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
        disabled={loading || loadingFinance}
        onClick={handleFinishOrder}
        className="w-full py-5 bg-teal-600 text-white rounded-[2rem] font-black uppercase text-xs tracking-[0.2em] shadow-2xl hover:bg-teal-700 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
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
