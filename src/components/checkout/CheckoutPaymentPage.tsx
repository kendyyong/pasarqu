import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../contexts/AuthContext";
import { useMarket } from "../../contexts/MarketContext";
import { useToast } from "../../contexts/ToastContext";
import { useNavigate } from "react-router-dom";
import {
  X,
  MapPin,
  CreditCard,
  Truck,
  Loader2,
  AlertCircle,
  Store,
  ArrowRight,
} from "lucide-react";

// IMPORT FUNGSI TERBARU
import { calculateMultiPickupOngkir } from "../../utils/financeHelpers";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const CheckoutPaymentPage: React.FC<Props> = ({ isOpen, onClose }) => {
  const { user, profile } = useAuth();
  const { cart, clearCart, selectedMarket } = useMarket();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [distance, setDistance] = useState("0 km");
  const [regionalSettings, setRegionalSettings] = useState<any>(null);

  // 1. Ambil Pengaturan Keuangan Wilayah (Kecamatan)
  useEffect(() => {
    const fetchFinanceSettings = async () => {
      const marketData = selectedMarket as any;
      if (!marketData?.kecamatan) return;

      const { data } = await supabase
        .from("regional_finance_settings")
        .select("*")
        .eq("kecamatan", marketData.kecamatan)
        .single();

      if (data) setRegionalSettings(data);
    };

    if (isOpen) fetchFinanceSettings();
  }, [selectedMarket, isOpen]);

  // 2. Simulasi Jarak (Dalam aplikasi asli, ini hasil dari Google Maps Matrix)
  useEffect(() => {
    if (isOpen) setDistance("6.5 km");
  }, [isOpen]);

  if (!isOpen) return null;

  // --- LOGIKA PERHITUNGAN MULTI-PICKUP ---
  const merchantIds = cart.map((item) => item.merchant_id);
  const pricing = calculateMultiPickupOngkir(
    distance,
    merchantIds,
    regionalSettings,
  );

  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const totalBayar = subtotal + pricing.totalToBuyer;

  // --- FUNGSI PEMBAYARAN & SIMPAN DATA KE DB ---
  const handlePayment = async () => {
    if (!profile?.address) {
      showToast("Lengkapi alamat pengiriman di profil Anda", "error");
      return;
    }

    setLoading(true);
    try {
      // 1. Simpan Header Order dengan Detail Keuangan Multi-Toko
      const { data: newOrder, error: orderErr } = await supabase
        .from("orders")
        .insert({
          customer_id: user?.id,
          market_id: selectedMarket?.id,
          total_price: totalBayar,
          shipping_cost: pricing.baseShipping,
          service_fee: pricing.serviceFee,
          extra_pickup_fee: pricing.extraPickupFee,
          merchant_count: pricing.merchantCount,
          // DATA PENTING UNTUK LAPORAN KEUANGAN:
          courier_earning_total: pricing.courierEarning,
          app_earning_total: pricing.appEarning,
          address: profile.address,
          status: "PAID",
          shipping_status: "SEARCHING_COURIER",
        })
        .select()
        .single();

      if (orderErr) throw orderErr;

      // 2. Simpan Item Order
      const orderItems = cart.map((item) => ({
        order_id: newOrder.id,
        product_id: item.id,
        quantity: item.quantity,
        price_at_purchase: item.price,
        merchant_id: item.merchant_id,
      }));

      await supabase.from("order_items").insert(orderItems);

      showToast("Pembayaran Berhasil! Mencari Kurir...", "success");
      clearCart();
      onClose();
      navigate(`/track-order/${newOrder.id}`);
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-end justify-center">
      <div className="bg-[#f8fafc] w-full max-w-lg rounded-t-[3rem] shadow-2xl animate-in slide-in-from-bottom-full duration-500 max-h-[90vh] overflow-y-auto no-scrollbar">
        {/* HEADER */}
        <div className="sticky top-0 bg-white p-6 border-b border-slate-100 flex justify-between items-center z-10">
          <div>
            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter italic">
              Konfirmasi Pembayaran
            </h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
              Selesaikan pesanan Anda
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-red-500 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6 text-left">
          {/* ALAMAT PENGIRIMAN */}
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center">
                <MapPin size={18} />
              </div>
              <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">
                Alamat Pengiriman
              </h3>
            </div>
            <p className="text-xs font-bold text-slate-600 leading-relaxed">
              {profile?.address || "Alamat belum diatur"}
            </p>
          </div>

          {/* RINCIAN PESANAN */}
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                <Store size={16} className="text-teal-600" /> Ringkasan Toko
              </h3>
              <span className="px-3 py-1 bg-teal-50 text-teal-600 rounded-full text-[9px] font-black uppercase">
                {pricing.merchantCount} Toko Berbeda
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-[10px] font-bold uppercase">
                <span className="text-slate-400">Total Harga Barang</span>
                <span className="text-slate-800 font-black">
                  Rp {subtotal.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-[10px] font-bold uppercase">
                <span className="text-slate-400">
                  Ongkos Kirim ({distance})
                </span>
                <span className="text-slate-800 font-black">
                  Rp {pricing.baseShipping.toLocaleString()}
                </span>
              </div>

              {pricing.extraPickupFee > 0 && (
                <div className="flex justify-between text-[10px] font-bold uppercase">
                  <span className="text-teal-600">
                    Biaya Tambah {pricing.merchantCount - 1} Toko
                  </span>
                  <span className="text-teal-600 font-black">
                    + Rp {pricing.extraPickupFee.toLocaleString()}
                  </span>
                </div>
              )}

              <div className="flex justify-between text-[10px] font-bold uppercase">
                <span className="text-slate-400">Biaya Layanan Aplikasi</span>
                <span className="text-slate-800 font-black">
                  Rp {pricing.serviceFee.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="h-[1px] bg-slate-100 my-6 border-dashed border-t"></div>

            <div className="flex justify-between items-center">
              <span className="text-sm font-black uppercase italic text-slate-800">
                Total Pembayaran
              </span>
              <span className="text-2xl font-black text-teal-600 tracking-tighter">
                Rp {totalBayar.toLocaleString()}
              </span>
            </div>
          </div>

          {/* PERINGATAN JIKA LEBIH DARI LIMIT */}
          {pricing.merchantCount >
            (regionalSettings?.max_merchants_per_order || 3) && (
            <div className="p-4 bg-red-50 rounded-2xl flex items-start gap-3 border border-red-100">
              <AlertCircle size={18} className="text-red-500 shrink-0" />
              <p className="text-[10px] text-red-600 font-bold uppercase leading-relaxed">
                Perhatian: Maksimal belanja dalam satu pesanan di wilayah ini
                adalah {regionalSettings?.max_merchants_per_order || 3} toko
                berbeda. Silakan kurangi isi keranjang Anda.
              </p>
            </div>
          )}

          {/* TOMBOL BAYAR */}
          <button
            disabled={
              loading ||
              pricing.merchantCount >
                (regionalSettings?.max_merchants_per_order || 3)
            }
            onClick={handlePayment}
            className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black uppercase text-xs tracking-[0.3em] shadow-2xl flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-30 disabled:grayscale"
          >
            {loading ? (
              <Loader2 className="animate-spin" />
            ) : (
              <>
                <CreditCard size={20} /> BAYAR SEKARANG <ArrowRight size={20} />
              </>
            )}
          </button>

          <p className="text-[9px] text-center font-bold text-slate-400 uppercase tracking-widest pb-10">
            🛡️ Transaksi Anda dienkripsi & aman
          </p>
        </div>
      </div>
    </div>
  );
};
