import React, { useState, useEffect } from "react";
import { useMarket } from "../../contexts/MarketContext";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { supabase } from "../../lib/supabaseClient";
import {
  ChevronLeft,
  MapPin,
  ChevronRight,
  Bike,
  Store,
  Wallet,
  CreditCard,
  Loader2,
  CheckCircle2,
  Ticket,
  AlertCircle,
  Clock,
  ShieldCheck,
} from "lucide-react";

interface CheckoutPaymentPageProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CheckoutPaymentPage = ({
  isOpen,
  onClose,
}: CheckoutPaymentPageProps) => {
  const { cart, clearCart } = useMarket();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [shippingMethod, setShippingMethod] = useState<"COURIER" | "PICKUP">(
    "COURIER",
  );
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [fees, setFees] = useState({ to_customer: 0, to_merchant: 0 });
  const [merchantBalance, setMerchantBalance] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      if (cart.length > 0 && isOpen) {
        // Ambil Biaya Pasar
        const { data: market } = await supabase
          .from("markets")
          .select("fee_to_customer, fee_to_merchant")
          .eq("id", cart[0].market_id)
          .single();

        if (market)
          setFees({
            to_customer: market.fee_to_customer,
            to_merchant: market.fee_to_merchant,
          });

        // Cek Deposit Merchant
        const { data: merchant } = await supabase
          .from("merchants")
          .select("deposit_balance")
          .eq("id", cart[0].merchant_id)
          .single();

        setMerchantBalance(merchant?.deposit_balance || 0);
      }
    };
    fetchData();
  }, [isOpen, cart]);

  if (!isOpen) return null;

  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const deliveryFee = shippingMethod === "COURIER" ? 5000 : 0;
  const totalToPay = subtotal + deliveryFee + fees.to_customer;

  const handleProcessOrder = async () => {
    if (shippingMethod === "PICKUP" && merchantBalance < fees.to_merchant) {
      showToast(
        "Toko tidak menerima Ambil Sendiri saat ini (Saldo Deposit Habis).",
        "error",
      );
      return;
    }

    setIsSubmitting(true);
    try {
      // PROSES SIMPAN ORDER
      // Trik: Gunakan objek dengan nama kolom yang sudah dipastikan di database
      const orderData = {
        customer_id: user?.id,
        merchant_id: cart[0].merchant_id,
        market_id: cart[0].market_id,
        total_amount: totalToPay,
        shipping_method: shippingMethod,
        payment_method: paymentMethod,
        fee_customer: fees.to_customer,
        fee_merchant: fees.to_merchant,
        status: "PENDING",
      };

      const { error: orderError } = await supabase
        .from("orders")
        .insert([orderData]); // Masukkan sebagai array

      if (orderError) {
        // Jika masih error kolom, kemungkinan cache API. Kita tampilkan error aslinya.
        throw orderError;
      }

      // Jika ambil sendiri, potong saldo merchant
      if (shippingMethod === "PICKUP") {
        await supabase.rpc("deduct_merchant_balance", {
          m_id: cart[0].merchant_id,
          amount: fees.to_merchant,
        });
      }

      setIsSuccess(true);
      clearCart();
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 2500);
    } catch (err: any) {
      console.error("Detail Error Checkout:", err);
      showToast(`Gagal: ${err.message}`, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[999] bg-[#f5f5f5] flex flex-col animate-in slide-in-from-right duration-300">
      {/* HEADER */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-[70px] flex items-center gap-4">
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-50 rounded-full transition-all"
          >
            <ChevronLeft size={28} className="text-teal-600" />
          </button>
          <div className="h-8 w-[1px] bg-slate-200 mx-2 hidden md:block" />
          <h2 className="text-xl font-black text-slate-800 tracking-tight uppercase text-left">
            Checkout Pesanan
          </h2>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar">
        <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
          {isSuccess ? (
            <div className="bg-white rounded-[2rem] shadow-xl p-12 text-center max-w-2xl mx-auto animate-in zoom-in-95">
              <div className="w-24 h-24 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                <CheckCircle2 size={54} />
              </div>
              <h3 className="text-3xl font-black text-slate-800 mb-4 tracking-tight">
                Pesanan Berhasil!
              </h3>
              <p className="text-slate-500 font-medium mb-8">
                Data Anda telah diteruskan ke pedagang dan kurir Pasarqu.
              </p>
              <button
                onClick={onClose}
                className="px-8 py-4 bg-teal-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-teal-700 transition-all shadow-lg shadow-teal-600/20"
              >
                Kembali Belanja
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* KOLOM KIRI */}
              <div className="lg:col-span-2 space-y-4">
                {/* ALAMAT */}
                <section className="bg-white rounded-3xl p-6 shadow-sm relative overflow-hidden text-left border border-slate-100">
                  <div className="absolute top-0 left-0 w-full h-[4px] bg-[repeating-linear-gradient(45deg,#0d9488,#0d9488_10px,#ffffff_10px,#ffffff_20px,#f59e0b_20px,#f59e0b_30px,#ffffff_30px,#ffffff_40px)]"></div>
                  <div className="flex items-start gap-4 mt-2">
                    <div className="p-3 bg-teal-50 text-teal-600 rounded-2xl">
                      <MapPin size={24} />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-black text-teal-600 uppercase tracking-widest mb-1">
                        Alamat Pengiriman
                      </p>
                      <p className="text-base font-bold text-slate-800 mb-1">
                        {user?.email || "User Pasarqu"}
                      </p>
                      <p className="text-sm text-slate-500 leading-relaxed italic">
                        Lokasi pengiriman disesuaikan dengan titik koordinat
                        pasar saat ini.
                      </p>
                    </div>
                    <button className="text-teal-600 text-sm font-black uppercase tracking-wider hover:underline">
                      Ubah
                    </button>
                  </div>
                </section>

                {/* PRODUK */}
                <section className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                  <div className="p-6 border-b border-slate-50 flex items-center gap-2">
                    <Store className="text-slate-400" size={20} />
                    <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest">
                      Rincian Produk
                    </h3>
                  </div>
                  <div className="divide-y divide-slate-50">
                    {cart.map((item) => (
                      <div
                        key={item.id}
                        className="p-6 flex gap-6 hover:bg-slate-50/50 transition-colors"
                      >
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-24 h-24 rounded-2xl object-cover bg-slate-100 border border-slate-200"
                        />
                        <div className="flex-1 text-left flex flex-col justify-center">
                          <p className="text-lg font-black text-slate-800 mb-1 line-clamp-1">
                            {item.name}
                          </p>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                            Kualitas Pilihan
                          </p>
                          <div className="flex justify-between items-end">
                            <p className="text-xl font-black text-teal-600">
                              Rp {item.price.toLocaleString()}
                            </p>
                            <p className="text-sm font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-lg">
                              x {item.quantity}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              {/* KOLOM KANAN */}
              <div className="space-y-4">
                <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 text-left">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">
                    Metode Pengiriman
                  </h3>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <button
                      onClick={() => setShippingMethod("COURIER")}
                      className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${shippingMethod === "COURIER" ? "border-teal-500 bg-teal-50 text-teal-700 shadow-md shadow-teal-500/10" : "border-slate-50 bg-slate-50 text-slate-400 hover:border-slate-200"}`}
                    >
                      <Bike size={24} />
                      <span className="text-[10px] font-black uppercase">
                        Kurir
                      </span>
                    </button>
                    <button
                      disabled={merchantBalance < fees.to_merchant}
                      onClick={() => setShippingMethod("PICKUP")}
                      className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${shippingMethod === "PICKUP" ? "border-teal-500 bg-teal-50 text-teal-700 shadow-md shadow-teal-500/10" : "border-slate-50 bg-slate-50 text-slate-400 hover:border-slate-200"} ${merchantBalance < fees.to_merchant ? "opacity-30 cursor-not-allowed" : ""}`}
                    >
                      <Store size={24} />
                      <span className="text-[10px] font-black uppercase">
                        Ambil Sendiri
                      </span>
                    </button>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                      <Clock size={16} className="text-teal-600" /> Estimasi
                    </div>
                    <span className="text-xs font-black text-slate-800 tracking-tighter uppercase">
                      HARI INI (30-60 MNT)
                    </span>
                  </div>
                </section>

                <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-4 text-left">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                    Ringkasan Biaya
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm font-bold text-slate-500">
                      <span>Total Produk</span>
                      <span>Rp {subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold text-slate-500">
                      <span>Ongkos Kirim</span>
                      <span>Rp {deliveryFee.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold text-slate-500">
                      <span>Biaya Penanganan</span>
                      <span>Rp {fees.to_customer.toLocaleString()}</span>
                    </div>
                    <div className="pt-4 border-t border-dashed border-slate-200 flex justify-between items-center">
                      <span className="text-sm font-black text-slate-800 uppercase tracking-widest">
                        Total Bayar
                      </span>
                      <span className="text-2xl font-black text-orange-600 tracking-tighter">
                        Rp {totalToPay.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <div className="flex items-center gap-2 mb-4 p-3 bg-teal-50 rounded-xl text-teal-700 border border-teal-100">
                      <Wallet size={18} />
                      <span className="text-xs font-black uppercase">
                        Bayar Tunai (COD)
                      </span>
                    </div>
                    <button
                      onClick={handleProcessOrder}
                      disabled={isSubmitting || cart.length === 0}
                      className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl hover:bg-slate-800 active:scale-95 transition-all flex justify-center items-center gap-3"
                    >
                      {isSubmitting ? (
                        <Loader2 className="animate-spin" />
                      ) : (
                        "Buat Pesanan Sekarang"
                      )}
                    </button>
                  </div>
                </section>

                <div className="flex flex-col items-center gap-2 opacity-30 pt-4">
                  <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">
                    <ShieldCheck size={18} /> Proteksi Pasarqu 2026
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* MOBILE STICKY BAR */}
      {!isSuccess && (
        <div className="lg:hidden bg-white border-t border-slate-100 p-5 flex items-center justify-between z-30 shadow-[0_-10px_20px_rgba(0,0,0,0.05)]">
          <div className="text-left">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
              Total
            </p>
            <p className="text-xl font-black text-orange-600">
              Rp {totalToPay.toLocaleString()}
            </p>
          </div>
          <button
            onClick={handleProcessOrder}
            disabled={isSubmitting}
            className="bg-teal-600 text-white font-black uppercase text-xs tracking-widest px-8 py-4 rounded-2xl shadow-lg shadow-teal-600/20 active:scale-95"
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin" />
            ) : (
              "Buat Pesanan"
            )}
          </button>
        </div>
      )}
    </div>
  );
};
