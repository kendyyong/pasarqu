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
  ShieldCheck,
  UserPlus,
} from "lucide-react";

// IMPORT FUNGSI PERHITUNGAN MULTI-PICKUP
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

  // 2. Simulasi Jarak (Integrasi Google Maps API kedepannya)
  useEffect(() => {
    if (isOpen) setDistance("6.5 km");
  }, [isOpen]);

  if (!isOpen) return null;

  // --- LOGIKA PERHITUNGAN MULTI-PICKUP ---
  const merchantIds = Array.from(new Set(cart.map((item) => item.merchant_id)));
  const pricing = calculateMultiPickupOngkir(
    distance,
    merchantIds,
    regionalSettings,
  );

  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  // Variabel Final Pembayaran (Sinkron dengan tampilan bawah)
  const totalToPay = subtotal + pricing.totalToBuyer;

  // --- FUNGSI PEMBAYARAN & JALUR REGISTRASI ---
  const handlePayment = async () => {
    // A. JALUR PENCEGATAN LOGIN (Direct to Register Page)
    if (!user) {
      showToast("Daftar dulu yuk, biar pesananmu tersimpan aman!", "info");
      // PERBAIKAN JALUR: Melempar ke /register dengan parameter balik ke checkout
      navigate("/register?redirect=checkout");
      return;
    }

    // B. JALUR PENCEGATAN ALAMAT
    if (!profile?.address) {
      showToast("Ups! Alamat pengiriman belum lengkap.", "error");
      // Arahkan ke tab alamat di profil
      navigate("/profile?tab=address");
      return;
    }

    setLoading(true);
    try {
      // 1. Simpan Header Order
      const { data: newOrder, error: orderErr } = await supabase
        .from("orders")
        .insert({
          customer_id: user?.id,
          market_id: selectedMarket?.id,
          total_price: totalToPay,
          shipping_cost: pricing.baseShipping,
          service_fee: pricing.serviceFee,
          extra_pickup_fee: pricing.extraPickupFee,
          merchant_count: pricing.merchantCount,
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
        <div className="sticky top-0 bg-white p-6 border-b border-slate-100 flex justify-between items-center z-10 text-left">
          <div>
            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter italic leading-none">
              Konfirmasi Bayar
            </h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
              {user
                ? `Halo, ${profile?.name || "Pelanggan"}`
                : "Mode Belanja Tamu"}
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
          {/* REGISTER REMINDER */}
          {!user && (
            <div className="bg-orange-50 p-5 rounded-[2rem] border border-orange-100 flex items-center gap-4 animate-in fade-in duration-700">
              <div className="p-3 bg-orange-500 text-white rounded-2xl shadow-lg shadow-orange-200">
                <UserPlus size={20} />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-black text-orange-800 uppercase">
                  Belum punya akun?
                </p>
                <p className="text-[9px] font-bold text-orange-600 uppercase tracking-tighter">
                  Daftar Nama & Alamat untuk lanjut bayar
                </p>
              </div>
            </div>
          )}

          {/* ALAMAT PENGIRIMAN */}
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center">
                <MapPin size={18} />
              </div>
              <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">
                Tujuan Pengiriman
              </h3>
            </div>
            <p
              className={`text-xs font-bold leading-relaxed ${user ? "text-slate-600" : "text-slate-300 italic"}`}
            >
              {user
                ? profile?.address || "Alamat belum diatur di profil"
                : "Silakan daftar untuk mengatur lokasi pengiriman"}
            </p>
          </div>

          {/* RINGKASAN TAGIHAN */}
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">
                Detail Tagihan
              </h3>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 rounded-full">
                <Store size={12} className="text-slate-400" />
                <span className="text-[9px] font-black text-slate-500 uppercase">
                  {pricing.merchantCount} Toko
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-[10px] font-bold uppercase text-slate-400">
                <span>Harga Produk</span>
                <span className="text-slate-700">
                  Rp {subtotal.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-[10px] font-bold uppercase text-slate-400">
                <span>Ongkir ({distance})</span>
                <span className="text-slate-700">
                  Rp {pricing.baseShipping.toLocaleString()}
                </span>
              </div>
              {pricing.extraPickupFee > 0 && (
                <div className="flex justify-between text-[10px] font-bold uppercase text-teal-600 italic">
                  <span>Biaya {pricing.merchantCount - 1} Toko Tambahan</span>
                  <span className="font-black">
                    + Rp {pricing.extraPickupFee.toLocaleString()}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-[10px] font-bold uppercase text-slate-400">
                <span>Biaya Layanan Aplikasi</span>
                <span className="text-slate-700">
                  Rp {pricing.serviceFee.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-dashed border-slate-100 flex justify-between items-center">
              <span className="text-sm font-black uppercase italic text-slate-800">
                Total Pembayaran
              </span>
              <span className="text-2xl font-black text-teal-600 tracking-tighter italic leading-none">
                Rp {totalToPay.toLocaleString()}
              </span>
            </div>
          </div>

          {/* WARNING LIMIT TOKO */}
          {pricing.merchantCount >
            (regionalSettings?.max_merchants_per_order || 3) && (
            <div className="p-4 bg-red-50 rounded-2xl flex items-start gap-3 border border-red-100 animate-bounce">
              <AlertCircle size={18} className="text-red-500 shrink-0" />
              <p className="text-[9px] text-red-600 font-bold uppercase leading-relaxed">
                Maksimal {regionalSettings?.max_merchants_per_order || 3} toko
                per pesanan. Kurangi barang dari toko berbeda.
              </p>
            </div>
          )}

          {/* TOMBOL AKSI UTAMA */}
          <button
            disabled={
              loading ||
              pricing.merchantCount >
                (regionalSettings?.max_merchants_per_order || 3)
            }
            onClick={handlePayment}
            className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black uppercase text-xs tracking-[0.3em] shadow-[0_20px_40px_rgba(0,0,0,0.15)] flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-30 disabled:grayscale"
          >
            {loading ? (
              <Loader2 className="animate-spin" />
            ) : (
              <>
                <CreditCard size={20} />{" "}
                {user ? "BAYAR SEKARANG" : "DAFTAR & BAYAR"}{" "}
                <ArrowRight size={20} />
              </>
            )}
          </button>

          <div className="flex items-center justify-center gap-2 opacity-30 pb-10">
            <ShieldCheck size={14} className="text-slate-500" />
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
              Keamanan Terjamin Pasarqu 2026
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
