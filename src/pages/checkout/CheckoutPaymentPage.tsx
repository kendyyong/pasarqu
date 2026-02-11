import React, { useState, useEffect } from "react";
import {
  X,
  MapPin,
  ChevronRight,
  Truck,
  Wallet,
  ShieldCheck,
  Info,
} from "lucide-react";
import { useMarket } from "../../contexts/MarketContext";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabaseClient";

interface CheckoutProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CheckoutPaymentPage: React.FC<CheckoutProps> = ({
  isOpen,
  onClose,
}) => {
  const { cart, selectedMarket } = useMarket();
  const { user } = useAuth();
  const [paymentMethod, setPaymentMethod] = useState("COD");

  // State tambahan untuk menampung data profile (alamat & hp)
  const [profile, setProfile] = useState<any>(null);

  // Ambil data profile lengkap dari database
  useEffect(() => {
    const fetchProfile = async () => {
      if (user?.id) {
        const { data } = await supabase
          .from("profiles")
          .select("phone_number, address, name")
          .eq("id", user.id)
          .single();
        if (data) setProfile(data);
      }
    };
    if (isOpen) fetchProfile();
  }, [user, isOpen]);

  // PERBAIKAN: Helper aman untuk struktur CartItem Bapak
  const getPrice = (item: any) => item.product?.price || item.price || 0;
  const getName = (item: any) =>
    item.product?.name || item.product_name || item.name || "Produk";
  const getImage = (item: any) =>
    item.product?.image_url || item.image_url || null;

  const subtotal = cart.reduce(
    (sum, item) => sum + getPrice(item) * item.quantity,
    0,
  );
  const shippingFee = 10000;
  const appFee = 2000;
  const total = subtotal + shippingFee + appFee;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center px-0 md:px-4 animate-in fade-in duration-300">
      {/* OVERLAY */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* MODAL CONTAINER */}
      <div className="relative w-full max-w-lg bg-[#f5f5f5] h-full md:h-[90vh] md:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col">
        {/* HEADER */}
        <div className="bg-white p-5 flex items-center justify-between border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-1 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X size={24} className="text-slate-600" />
            </button>
            <h1 className="font-black text-lg uppercase tracking-tight text-slate-800">
              Checkout
            </h1>
          </div>
          <div className="flex items-center gap-1.5 bg-teal-50 px-3 py-1.5 rounded-full border border-teal-100">
            <ShieldCheck size={16} className="text-teal-600" />
            <span className="text-[10px] font-black text-teal-700 uppercase tracking-tighter">
              Checkout Aman
            </span>
          </div>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pb-24">
          {/* SECTION 1: ALAMAT PENGIRIMAN */}
          <div className="bg-white p-4 flex gap-3 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 flex">
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className={`flex-1 ${i % 2 === 0 ? "bg-rose-500" : "bg-blue-500"} skew-x-[-45deg]`}
                />
              ))}
            </div>
            <MapPin className="text-rose-500 mt-1 shrink-0" size={20} />
            <div className="flex-1">
              <h3 className="text-sm font-bold text-slate-800 mb-1">
                Alamat Pengiriman
              </h3>
              {/* PERBAIKAN: Menggunakan data dari state profile */}
              <p className="text-xs font-bold text-slate-900">
                {profile?.name || user?.email?.split("@")[0]} |{" "}
                {profile?.phone_number || "HP belum diatur"}
              </p>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                {profile?.address ||
                  "Alamat belum diatur. Silakan lengkapi di profil."}
              </p>
            </div>
            <ChevronRight size={18} className="text-slate-300 self-center" />
          </div>

          {/* SECTION 2: DETAIL PRODUK */}
          <div className="bg-white p-4">
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="text-teal-600" size={16} />
              <span className="text-xs font-black uppercase text-slate-700">
                {selectedMarket?.name || "Pasarqu Indonesia"}
              </span>
            </div>

            {cart.map((item) => (
              <div key={item.id} className="flex gap-3 mb-4 last:mb-0">
                <div className="w-16 h-16 bg-slate-100 rounded-lg overflow-hidden border border-slate-50">
                  {getImage(item) ? (
                    <img
                      src={getImage(item)}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-200 text-slate-400 text-[8px]">
                      No Image
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="text-xs font-bold text-slate-800 line-clamp-1">
                    {getName(item)}
                  </h4>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs font-bold text-slate-900">
                      Rp {getPrice(item).toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold">
                      x{item.quantity}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* SECTION 3: OPSI PENGIRIMAN */}
          <div className="bg-teal-50/50 p-4 border-y border-teal-100/50 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Truck size={18} className="text-teal-600" />
              <div>
                <p className="text-xs font-bold text-slate-800 uppercase tracking-tighter">
                  Opsi Pengiriman
                </p>
                <p className="text-[10px] text-teal-600 font-bold uppercase">
                  Kurir Pasarqu (Reguler)
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1">
                <span className="text-xs font-black text-slate-900">
                  Rp {shippingFee.toLocaleString()}
                </span>
                <ChevronRight size={16} className="text-slate-400" />
              </div>
              <p className="text-[9px] text-slate-400">
                Estimasi Tiba: Hari Ini
              </p>
            </div>
          </div>

          {/* SECTION 4: METODE PEMBAYARAN */}
          <div className="bg-white p-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Wallet size={18} className="text-orange-500" />
              <span className="text-xs font-bold text-slate-700">
                Metode Pembayaran
              </span>
            </div>
            <div className="flex items-center gap-1 cursor-pointer">
              <span className="text-xs font-black text-slate-900 uppercase">
                {paymentMethod}
              </span>
              <ChevronRight size={18} className="text-slate-300" />
            </div>
          </div>

          {/* SECTION 5: RINCIAN PEMBAYARAN */}
          <div className="bg-white p-4 space-y-2.5">
            <div className="flex items-center gap-2 mb-1">
              <Info size={14} className="text-slate-400" />
              <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                Rincian Pembayaran
              </h3>
            </div>
            <div className="flex justify-between text-xs font-medium text-slate-500">
              <span>Subtotal untuk Produk</span>
              <span className="text-slate-900">
                Rp {subtotal.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-xs font-medium text-slate-500">
              <span>Total Ongkos Kirim</span>
              <span className="text-slate-900">
                Rp {shippingFee.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-xs font-medium text-slate-500">
              <span>Biaya Layanan</span>
              <span className="text-slate-900">
                Rp {appFee.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-slate-100">
              <span className="text-sm font-black text-slate-800">
                Total Pembayaran
              </span>
              <span className="text-lg font-black text-orange-500">
                Rp {total.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* BOTTOM ACTION BAR */}
        <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-100 p-4 flex items-center justify-between shrink-0 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
          <div className="text-right flex-1 px-4">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
              Total Pembayaran
            </p>
            <p className="text-lg font-black text-orange-600">
              Rp {total.toLocaleString()}
            </p>
          </div>
          <button className="bg-orange-500 hover:bg-orange-600 active:scale-95 transition-all text-white px-10 py-3.5 rounded-xl font-black text-sm uppercase tracking-widest shadow-xl shadow-orange-500/20">
            Buat Pesanan
          </button>
        </div>
      </div>
    </div>
  );
};
