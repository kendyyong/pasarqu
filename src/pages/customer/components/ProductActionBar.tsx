import React from "react";
// ✅ Perbaikan: Nama modul yang benar adalah lucide-react
import { Home, MessageCircle, Loader2, ShoppingCart } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Props {
  isOutOfStock: boolean;
  qty: number;
  stock: number;
  onQtyChange: (q: number) => void;
  onAddToCart: () => void;
  onContactSeller: () => void;
  chatLoading: boolean;
  onBuyNow: () => void;
}

export const ProductActionBar: React.FC<Props> = ({
  isOutOfStock,
  qty,
  stock,
  onQtyChange,
  onAddToCart,
  onContactSeller,
  chatLoading,
  onBuyNow,
}) => {
  const navigate = useNavigate();

  return (
    <div className="md:hidden fixed bottom-0 z-[60] w-full bg-white border-t border-slate-100 flex items-center shadow-[0_-5px_20px_rgba(0,0,0,0.05)] h-16">
      {/* Tombol Beranda */}
      <button
        onClick={() => navigate("/")}
        className="w-16 flex flex-col items-center justify-center text-slate-500 h-full border-r border-slate-50 active:bg-slate-50 transition-colors"
      >
        <Home size={20} />
        <span className="text-[8px] mt-0.5 font-bold uppercase tracking-widest">
          Home
        </span>
      </button>

      {/* Tombol Chat */}
      <button
        onClick={onContactSeller}
        disabled={chatLoading}
        className="flex-1 flex flex-col items-center justify-center text-slate-500 h-full border-r border-slate-50 active:bg-slate-50 transition-colors"
      >
        {chatLoading ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          <MessageCircle size={20} />
        )}
        <span className="text-[8px] mt-0.5 font-bold uppercase tracking-widest">
          Chat
        </span>
      </button>

      {/* Tombol Keranjang */}
      <button
        disabled={isOutOfStock}
        onClick={onAddToCart}
        className={`flex-1 flex flex-col items-center justify-center h-full border-r border-slate-50 transition-colors ${
          isOutOfStock
            ? "text-slate-300 bg-slate-50"
            : "text-teal-600 bg-teal-50/30 active:bg-teal-100"
        }`}
      >
        <ShoppingCart size={20} />
        <span className="text-[8px] mt-0.5 font-bold uppercase tracking-widest">
          Keranjang
        </span>
      </button>

      {/* Tombol Beli */}
      <button
        disabled={isOutOfStock}
        onClick={onBuyNow}
        className={`flex-[2.5] h-full font-black uppercase text-[11px] tracking-widest transition-all active:brightness-95 ${
          isOutOfStock
            ? "bg-slate-400 text-white cursor-not-allowed"
            : "bg-teal-600 text-white hover:bg-teal-700"
        }`}
      >
        {isOutOfStock ? "STOK HABIS" : "BELI SEKARANG"}
      </button>
    </div>
  );
};
