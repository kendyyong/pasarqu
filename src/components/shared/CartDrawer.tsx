import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, ShoppingCart, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { CartItem } from "../../types";

// --- IMPORT LOGIC & SUB-COMPONENT ---
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

  // Menggunakan Logic Hook (Step 1)
  const {
    selectedIds,
    toggleSelection,
    toggleSelectAll,
    totalPrice,
    totalSelectedItems,
  } = useCartSelection(cart, isOpen);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted || !isOpen) return null;

  const drawerContent = (
    <div className="fixed inset-0 z-[9999] flex justify-end font-sans">
      {/* OVERLAY */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* PANEL CONTAINER */}
      <div className="relative w-full md:w-[480px] h-full bg-[#f5f5f5] shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        {/* HEADER */}
        <div className="bg-teal-700 text-white px-4 py-4 flex items-center justify-between shadow-md shrink-0 pt-safe-top">
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/10 rounded-full active:scale-90 transition-transform"
            >
              <ArrowLeft size={24} />
            </button>
            <h2 className="font-bold text-lg">
              Keranjang{" "}
              <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                {cart.length}
              </span>
            </h2>
          </div>
        </div>

        {/* LIST ITEM (BODY) */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3 pb-32">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4 -mt-10">
              <div className="w-24 h-24 bg-slate-200 rounded-full flex items-center justify-center mb-2 animate-bounce">
                <ShoppingCart size={40} className="text-slate-400" />
              </div>
              <p className="font-bold text-slate-600">Keranjang kosong</p>
              <button
                onClick={() => {
                  onClose();
                  navigate("/");
                }}
                className="px-6 py-2 bg-teal-600 text-white rounded-full font-bold text-sm shadow-lg hover:bg-teal-700"
              >
                Mulai Belanja
              </button>
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

        {/* FOOTER (SUMMARY & CHECKOUT) */}
        {cart.length > 0 && (
          <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-100 p-3 shadow-[0_-5px_20px_rgba(0,0,0,0.05)] z-20 pb-safe">
            <div className="flex items-center justify-between mb-3">
              <div
                className="flex items-center gap-2 cursor-pointer select-none"
                onClick={toggleSelectAll}
              >
                <input
                  type="checkbox"
                  checked={selectedIds.size === cart.length && cart.length > 0}
                  readOnly
                  className="w-4 h-4 accent-teal-600 rounded"
                />
                <span className="text-xs text-slate-500 font-medium">
                  Semua
                </span>
              </div>

              <div className="text-right flex items-center gap-2">
                <span className="text-xs text-slate-400">Total:</span>
                <span className="text-lg font-black text-orange-500">
                  Rp{totalPrice.toLocaleString()}
                </span>
              </div>
            </div>

            <button
              onClick={onCheckout}
              disabled={selectedIds.size === 0}
              className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                selectedIds.size === 0
                  ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                  : "bg-orange-500 text-white shadow-lg hover:bg-orange-600 active:scale-[0.98]"
              }`}
            >
              Checkout ({totalSelectedItems}) <ArrowRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(drawerContent, document.body);
};
