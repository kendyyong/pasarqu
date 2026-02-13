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
  Loader2,
  Truck,
  Wallet,
  Info,
  Package,
  X,
} from "lucide-react";

// PERBAIKAN: Jalur import disesuaikan (naik 3 tingkat ke src, lalu masuk ke components)
import { OrderChatRoom } from "../../../components/Chat/OrderChatRoom";

interface Props {
  order: any;
  onFinished: () => void;
}

export const CourierActiveOrder: React.FC<Props> = ({ order, onFinished }) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [marketKecamatan, setMarketKecamatan] = useState<string>("");
  const [showChat, setShowChat] = useState(false); // State untuk kontrol chat room

  // 1. Ambil info kecamatan pasar untuk menentukan tarif aplikasi
  useEffect(() => {
    const fetchMarketInfo = async () => {
      if (order?.merchant_id) {
        const { data: merchantData } = await supabase
          .from("merchants")
          .select("markets(kecamatan)")
          .eq("id", order.merchant_id)
          .single();

        if (merchantData?.markets) {
          setMarketKecamatan((merchantData.markets as any).kecamatan);
        }
      }
    };
    fetchMarketInfo();
  }, [order]);

  // 2. Ambil Aturan Keuangan Wilayah
  const { regionalSettings, loading: loadingFinance } =
    useRegionalFinance(marketKecamatan);

  // 3. Fungsi Navigasi (Membuka Aplikasi Google Maps Asli)
  const openGoogleMaps = (lat: number, lng: number) => {
    if (!lat || !lng)
      return showToast("Koordinat lokasi tidak ditemukan", "error");
    const url = `http://maps.google.com/?q=${lat},${lng}&travelmode=driving`;
    window.open(url, "_blank");
  };

  // 4. Update Status Tugas
  const handleUpdateStatus = async () => {
    const currentShippingStatus = order.shipping_status;
    let nextShippingStatus = "";
    let nextGeneralStatus = "PAID";
    let confirmMsg = "";

    if (currentShippingStatus === "COURIER_ASSIGNED") {
      nextShippingStatus = "PICKING_UP";
      confirmMsg = "Konfirmasi Anda sudah tiba di Toko?";
    } else if (currentShippingStatus === "PICKING_UP") {
      nextShippingStatus = "DELIVERING";
      confirmMsg = "Konfirmasi barang sudah Anda terima dan siap antar?";
    } else if (currentShippingStatus === "DELIVERING") {
      nextShippingStatus = "COMPLETED";
      nextGeneralStatus = "COMPLETED";
      confirmMsg = "Konfirmasi pesanan telah diserahkan ke pembeli?";
    }

    if (!window.confirm(confirmMsg)) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("orders")
        .update({
          shipping_status: nextShippingStatus,
          status: nextGeneralStatus,
          ...(nextShippingStatus === "COMPLETED"
            ? { completed_at: new Date().toISOString() }
            : {}),
        })
        .eq("id", order.id);

      if (error) throw error;

      showToast("Status perjalanan diperbarui!", "success");

      if (nextShippingStatus === "COMPLETED") {
        onFinished();
      }
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const shippingStatus = order.shipping_status;
  const isAtStore =
    shippingStatus === "COURIER_ASSIGNED" || shippingStatus === "PICKING_UP";

  const deliveryFee = order.shipping_cost ?? 0;
  const appFee = regionalSettings?.courier_app_fee ?? 1000;
  const netEarnings = deliveryFee - appFee;

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in slide-in-from-bottom-6 duration-500 text-left pb-24 px-4 relative">
      {/* OVERLAY CHAT ROOM */}
      {showChat && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-lg animate-in slide-in-from-bottom-10 duration-300">
            <div className="flex justify-end mb-2">
              <button
                onClick={() => setShowChat(false)}
                className="bg-white p-2 rounded-full shadow-lg text-slate-800"
              >
                <X size={20} />
              </button>
            </div>
            <OrderChatRoom
              orderId={order.id}
              receiverName={order.profiles?.full_name || "Pembeli"}
            />
          </div>
        </div>
      )}

      {/* STATUS HEADER PRO */}
      <div
        className={`p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden transition-colors duration-500 ${isAtStore ? "bg-orange-500" : "bg-teal-600"}`}
      >
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
            {isAtStore ? <Package size={28} /> : <Truck size={28} />}
          </div>
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight leading-none">
              {shippingStatus === "COURIER_ASSIGNED" && "Menuju Toko"}
              {shippingStatus === "PICKING_UP" && "Proses Muat"}
              {shippingStatus === "DELIVERING" && "Sedang Antar"}
            </h2>
            <p className="text-[10px] font-bold text-white/80 uppercase tracking-widest mt-1">
              Order ID: #{order.id.substring(0, 8)}
            </p>
          </div>
        </div>
        <div className="absolute -right-10 -bottom-10 text-white/10 w-48 h-48 -rotate-12">
          {isAtStore ? <Package size={190} /> : <Truck size={190} />}
        </div>
      </div>

      {/* ESTIMASI EARNINGS */}
      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-1">
              <Wallet size={12} className="text-teal-600" /> Pendapatan Bersih
            </h3>
            <p className="text-2xl font-black text-slate-800 tracking-tighter mt-1">
              Rp{" "}
              {netEarnings > 0
                ? netEarnings.toLocaleString()
                : deliveryFee.toLocaleString()}
            </p>
          </div>
          <div className="text-right">
            <span className="text-[8px] font-black bg-teal-50 text-teal-600 px-2 py-1 rounded-lg uppercase">
              Cair Instan
            </span>
          </div>
        </div>
        <div className="p-3 bg-slate-50 rounded-2xl flex items-center gap-2">
          <Info size={14} className="text-blue-500 shrink-0" />
          <p className="text-[9px] text-slate-500 font-medium leading-relaxed uppercase">
            Potongan aplikasi Rp {appFee.toLocaleString()} saat tugas selesai.
          </p>
        </div>
      </div>

      {/* RUTE STEPPER */}
      <div className="bg-white rounded-[3rem] p-8 border border-slate-100 shadow-sm relative overflow-hidden">
        <div className="flex gap-6 relative">
          <div className="flex flex-col items-center gap-2">
            <div
              className={`w-5 h-5 rounded-full border-4 ${isAtStore ? "border-orange-500 bg-white shadow-lg" : "border-slate-100 bg-slate-100"}`}
            ></div>
            <div className="w-[2px] h-32 border-l-2 border-dashed border-slate-100"></div>
            <div
              className={`w-5 h-5 rounded-full border-4 ${shippingStatus === "DELIVERING" ? "border-teal-500 bg-white shadow-lg" : "border-slate-100 bg-slate-100"}`}
            ></div>
          </div>

          <div className="flex-1 space-y-12">
            {/* Step 1: Merchant */}
            <div
              className={`transition-all duration-500 ${!isAtStore ? "opacity-30 scale-95" : "opacity-100"}`}
            >
              <div className="flex justify-between items-start">
                <div className="min-w-0 pr-4 text-left">
                  <p className="text-[9px] font-black text-orange-500 uppercase tracking-widest mb-1">
                    Titik A: Pick-up Toko
                  </p>
                  <h4 className="font-black text-slate-800 text-sm uppercase truncate">
                    {order.merchants?.shop_name}
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-snug mt-1">
                    {order.merchants?.address}
                  </p>
                </div>
                <button
                  onClick={() =>
                    openGoogleMaps(
                      order.merchants?.latitude,
                      order.merchants?.longitude,
                    )
                  }
                  className="p-3 bg-slate-900 text-white rounded-xl shadow-lg active:scale-90 transition-transform"
                >
                  <Navigation size={18} />
                </button>
              </div>
            </div>

            {/* Step 2: Customer */}
            <div
              className={`transition-all duration-500 ${shippingStatus !== "DELIVERING" ? "opacity-30 scale-95" : "opacity-100"}`}
            >
              <div className="flex justify-between items-start">
                <div className="min-w-0 pr-4 text-left">
                  <p className="text-[9px] font-black text-teal-600 uppercase tracking-widest mb-1">
                    Titik B: Antar Pembeli
                  </p>
                  <h4 className="font-black text-slate-800 text-sm uppercase truncate">
                    {order.profiles?.full_name || "Pelanggan"}
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-snug mt-1">
                    {order.profiles?.address || order.address}
                  </p>
                </div>
                <button
                  onClick={() =>
                    openGoogleMaps(
                      order.profiles?.latitude,
                      order.profiles?.longitude,
                    )
                  }
                  className="p-3 bg-teal-600 text-white rounded-xl shadow-lg active:scale-90 transition-transform"
                >
                  <Navigation size={18} />
                </button>
              </div>

              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => setShowChat(true)}
                  className="flex-1 py-3 bg-teal-500 text-white rounded-xl font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-md hover:bg-teal-600 transition-all"
                >
                  <MessageSquare size={14} /> Chat Internal
                </button>
                <button
                  onClick={() =>
                    window.open(`tel:${order.profiles?.phone_number}`)
                  }
                  className="p-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-all"
                >
                  <Phone size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ACTION BUTTON UTAMA */}
      <button
        disabled={loading || loadingFinance}
        onClick={handleUpdateStatus}
        className={`w-full py-6 rounded-[2rem] font-black uppercase text-xs tracking-[0.2em] shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50 ${isAtStore ? "bg-orange-500 shadow-orange-200" : "bg-teal-600 shadow-teal-200"} text-white`}
      >
        {loading ? (
          <Loader2 className="animate-spin" />
        ) : (
          <>
            <CheckCircle size={20} />
            {shippingStatus === "COURIER_ASSIGNED" && "SAYA SUDAH DI TOKO"}
            {shippingStatus === "PICKING_UP" && "BARANG SUDAH SAYA TERIMA"}
            {shippingStatus === "DELIVERING" && "PESANAN SUDAH SAMPAI"}
          </>
        )}
      </button>

      <p className="text-[9px] font-bold text-center text-slate-400 uppercase tracking-[0.2em]">
        {shippingStatus === "DELIVERING"
          ? "Pastikan barang diterima langsung oleh pembeli"
          : "Update status saat Anda berpindah lokasi"}
      </p>
    </div>
  );
};
