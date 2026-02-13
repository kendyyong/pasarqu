import React from "react";
import { useMarket } from "../../contexts/MarketContext";
import { calculateMultiPickupOngkir } from "../../utils/financeHelpers";
import { ShoppingBag, Truck, Store, ArrowRight } from "lucide-react";

interface Props {
  distance: string;
  regionalSettings: any;
  onCheckout: () => void;
}

export const CheckoutSummary: React.FC<Props> = ({
  distance,
  regionalSettings,
  onCheckout,
}) => {
  const { cart } = useMarket();

  // 1. Hitung Subtotal Barang
  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  // 2. Deteksi Toko untuk Hitung Ongkir Multi-Pickup
  const merchantIds = cart.map((item) => item.merchant_id);
  const pricing = calculateMultiPickupOngkir(
    distance,
    merchantIds,
    regionalSettings,
  );

  // 3. Total Akhir
  const totalBayar = subtotal + pricing.totalToBuyer;

  if (cart.length === 0) return null;

  return (
    <div className="bg-white border-t border-slate-100 p-6 md:p-8 space-y-4 shadow-[0_-10px_40px_rgba(0,0,0,0.04)] animate-in slide-in-from-bottom-full duration-500 text-left">
      {/* RINCIAN SINGKAT */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
          <div className="flex items-center gap-2">
            <ShoppingBag size={12} />
            <span>Subtotal ({cart.length} Item)</span>
          </div>
          <span className="text-slate-700">Rp {subtotal.toLocaleString()}</span>
        </div>

        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
          <div className="flex items-center gap-2">
            <Truck size={12} />
            <span>Ongkos Kirim ({distance})</span>
          </div>
          <span className="text-slate-700">
            Rp {pricing.baseShipping.toLocaleString()}
          </span>
        </div>

        {pricing.extraPickupFee > 0 && (
          <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-teal-600 animate-pulse">
            <div className="flex items-center gap-2">
              <Store size={12} />
              <span>Biaya +{pricing.merchantCount - 1} Toko</span>
            </div>
            <span>+ Rp {pricing.extraPickupFee.toLocaleString()}</span>
          </div>
        )}
      </div>

      {/* TOTAL & ACTION */}
      <div className="flex items-center gap-6 pt-2">
        <div className="flex-1 text-left">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">
            Total Bayar
          </p>
          <h3 className="text-2xl font-black text-slate-900 tracking-tighter leading-none">
            Rp {totalBayar.toLocaleString()}
          </h3>
        </div>

        <button
          onClick={onCheckout}
          disabled={pricing.merchantCount > 3}
          className={`px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] flex items-center gap-3 transition-all active:scale-95 shadow-xl ${
            pricing.merchantCount > 3
              ? "bg-slate-100 text-slate-400 cursor-not-allowed"
              : "bg-teal-600 text-white shadow-teal-200 hover:bg-slate-900 hover:shadow-slate-200"
          }`}
        >
          {pricing.merchantCount > 3 ? (
            "Max 3 Toko"
          ) : (
            <>
              Checkout <ArrowRight size={16} />
            </>
          )}
        </button>
      </div>

      {/* VALIDASI LIMIT TOKO */}
      {pricing.merchantCount > 3 && (
        <p className="text-[8px] font-bold text-red-500 uppercase text-center tracking-widest">
          ⚠️ Hapus barang dari toko lain. Maksimal 3 toko per order.
        </p>
      )}
    </div>
  );
};
