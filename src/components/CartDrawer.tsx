import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom"; // <--- INI KUNCINYA
import {
  ArrowLeft,
  Trash2,
  Minus,
  Plus,
  ShoppingCart,
  Store,
  ArrowRight,
} from "lucide-react";
import { CartItem } from "../types";
import { useNavigate } from "react-router-dom";

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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // State untuk animasi mounting (agar portal aman)
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Default: Pilih semua saat dibuka
  useEffect(() => {
    if (isOpen && cart.length > 0) {
      const allIds = new Set(cart.map((item) => item.id));
      setSelectedIds(allIds);
    }
  }, [isOpen, cart.length]);

  // Hitung Total
  const totalPrice = cart.reduce((sum, item) => {
    if (selectedIds.has(item.id)) {
      return sum + item.price * item.quantity;
    }
    return sum;
  }, 0);

  const totalSelectedItems = cart.reduce((sum, item) => {
    if (selectedIds.has(item.id)) return sum + item.quantity;
    return sum;
  }, 0);

  // Checkbox Logic
  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === cart.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(cart.map((item) => item.id)));
  };

  // Jangan render apa-apa jika belum mounted atau tidak open
  if (!mounted || !isOpen) return null;

  // KONTEN KERANJANG
  const drawerContent = (
    // Z-INDEX 9999: SANGAT TINGGI AGAR DI ATAS SEGALANYA
    <div className="fixed inset-0 z-[9999] flex justify-end font-sans">
      {/* 1. OVERLAY GELAP */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* 2. PANEL KERANJANG */}
      <div className="relative w-full md:w-[480px] h-full bg-[#f5f5f5] shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        {/* --- HEADER KERANJANG --- */}
        <div className="bg-teal-700 text-white px-4 py-4 flex items-center justify-between shadow-md z-20 shrink-0 pt-safe-top">
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/10 rounded-full active:scale-90 transition-transform"
            >
              <ArrowLeft size={24} />
            </button>
            <h2 className="font-bold text-lg flex items-center gap-2">
              Keranjang{" "}
              <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                {cart.length}
              </span>
            </h2>
          </div>
        </div>

        {/* --- ISI KERANJANG --- */}
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
                className="px-6 py-2 bg-teal-600 text-white rounded-full font-bold text-sm shadow-lg hover:bg-teal-700 transition-colors"
              >
                Mulai Belanja
              </button>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden"
              >
                {/* Header Toko */}
                <div className="px-3 py-2 border-b border-slate-50 flex items-center gap-2 bg-slate-50/50">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(item.id)}
                    onChange={() => toggleSelection(item.id)}
                    className="w-4 h-4 accent-teal-600 rounded cursor-pointer"
                  />
                  <Store size={14} className="text-slate-500" />
                  <span className="text-xs font-bold text-slate-700">
                    Toko Official
                  </span>
                  <ArrowRight size={12} className="text-slate-400" />
                </div>

                <div className="p-3 flex gap-3">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(item.id)}
                      onChange={() => toggleSelection(item.id)}
                      className="w-4 h-4 accent-teal-600 rounded cursor-pointer"
                    />
                  </div>

                  <div
                    className="w-20 h-20 bg-slate-100 rounded-lg overflow-hidden shrink-0 border border-slate-100 relative cursor-pointer"
                    onClick={() => {
                      onClose();
                      navigate(`/product/${item.id}`);
                    }}
                  >
                    <img
                      src={item.image_url || item.product?.image_url}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 flex flex-col justify-between">
                    <div
                      onClick={() => {
                        onClose();
                        navigate(`/product/${item.id}`);
                      }}
                      className="cursor-pointer"
                    >
                      <h3 className="text-sm font-medium text-slate-800 line-clamp-2 leading-snug">
                        {item.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 border border-slate-200">
                          Default
                        </span>
                      </div>
                    </div>

                    <div className="flex items-end justify-between mt-2">
                      <span className="text-sm font-black text-teal-700">
                        Rp{item.price.toLocaleString()}
                      </span>

                      <div className="flex items-center border border-slate-200 rounded-md bg-white shadow-sm">
                        <button
                          onClick={() => onUpdateQty(item.id, -1)}
                          className="w-7 h-7 flex items-center justify-center text-slate-500 hover:bg-slate-50 border-r border-slate-200 disabled:opacity-50"
                          disabled={item.quantity <= 1}
                        >
                          <Minus size={12} strokeWidth={3} />
                        </button>
                        <span className="w-9 text-center text-xs font-bold text-slate-700">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => onUpdateQty(item.id, 1)}
                          className="w-7 h-7 flex items-center justify-center text-teal-600 hover:bg-teal-50 border-l border-slate-200"
                        >
                          <Plus size={12} strokeWidth={3} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="px-3 py-2 border-t border-slate-50 flex justify-end">
                  <button
                    onClick={() => onRemove(item.id)}
                    className="text-[10px] text-slate-400 hover:text-red-500 flex items-center gap-1"
                  >
                    <Trash2 size={12} /> Hapus
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* --- FOOTER --- */}
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
                  : "bg-orange-500 text-white shadow-lg shadow-orange-500/30 hover:bg-orange-600 active:scale-[0.98]"
              }`}
            >
              Checkout ({totalSelectedItems}) <ArrowRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  // GUNAKAN PORTAL UNTUK MELEMPAR DRAWER KE BODY (LUAR APP.TSX)
  return createPortal(drawerContent, document.body);
};
