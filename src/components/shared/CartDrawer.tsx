import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { CartItem } from "../../types";
import { useCartSelection } from "../../hooks/useCartSelection";
import { CartItemCard } from "./CartItemCard";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onUpdateQty: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
  onCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cart,
  onUpdateQty,
  onRemove,
  onCheckout,
}) => {
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);

  // Mengambil data dari hook selection
  const {
    selectedIds,
    toggleSelection,
    totalPrice,
    merchantCount,
    courierSurgeFee,
  } = useCartSelection(cart, isOpen);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted || !isOpen) return null;

  // Total sementara: Harga Produk + Ekstra Toko (N-1)
  // Catatan: courierSurgeFee harus sudah dihitung (N-1) di dalam hook useCartSelection
  const subTotalCart = totalPrice + courierSurgeFee;

  return (
    <div className="fixed inset-0 z-[9999] flex justify-end font-sans text-left">
      {/* OVERLAY */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* DRAWER CONTENT */}
      <div className="relative w-full md:w-[480px] h-full bg-[#f5f5f5] shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        {/* HEADER */}
        <div className="bg-teal-700 text-white px-4 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/10 rounded-full transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
            <h2 className="font-black uppercase text-sm tracking-widest">
              Keranjang Belanja
            </h2>
          </div>
        </div>

        {/* BODY - LIST ITEM */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3 pb-48">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-50">
              <p className="font-black uppercase text-xs tracking-widest">
                Keranjang Kosong
              </p>
            </div>
          ) : (
            cart.map((item) => (
              <CartItemCard
                key={item.id}
                item={item}
                isSelected={selectedIds.has(item.id)}
                onToggle={toggleSelection}
                onUpdateQty={onUpdateQty}
                onRemove={onRemove}
                onNavigate={(id) => {
                  onClose();
                  navigate(`/product/${id}`);
                }}
              />
            ))
          )}
        </div>

        {/* FOOTER - RINGKASAN BIAYA */}
        {cart.length > 0 && (
          <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-5 shadow-[0_-10px_20px_rgba(0,0,0,0.05)] z-20">
            <div className="space-y-2 mb-5">
              <div className="flex justify-between text-[11px] font-bold text-slate-500 uppercase tracking-tight">
                <span>Subtotal Produk</span>
                <span>Rp{totalPrice.toLocaleString()}</span>
              </div>

              {/* LOGIK REVISI: Tampilkan (N-1) dan hanya jika merchant > 1 */}
              {merchantCount > 1 && (
                <div className="flex justify-between text-[11px] font-black text-orange-600 uppercase tracking-tight">
                  <span>Ekstra Toko ({merchantCount - 1})</span>
                  <span>+ Rp{courierSurgeFee.toLocaleString()}</span>
                </div>
              )}
            </div>

            {/* TOTAL AKHIR & ACTION */}
            <div className="flex items-center justify-between border-t border-slate-100 pt-4">
              <div className="text-left">
                <p className="text-[9px] font-black text-slate-400 uppercase leading-none mb-1">
                  Total Sementara
                </p>
                <p className="text-2xl font-black text-slate-900 tracking-tighter">
                  Rp{subTotalCart.toLocaleString()}
                </p>
              </div>

              <button
                onClick={onCheckout}
                disabled={selectedIds.size === 0}
                className={`px-8 py-3 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center gap-2 transition-all shadow-lg active:scale-95 ${
                  selectedIds.size === 0
                    ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                    : "bg-teal-700 text-white hover:bg-teal-800"
                }`}
              >
                Checkout <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
