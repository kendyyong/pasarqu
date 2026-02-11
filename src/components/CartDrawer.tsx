import React, { useEffect, useState } from "react";
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { CartItem } from "../types";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onUpdateQty: (id: string, qty: number) => void;
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
  const [isAnimating, setIsAnimating] = useState(false);

  // Helper aman untuk mengambil data produk
  const getPrice = (item: any) => item.product?.price || item.price || 0;
  const getName = (item: any) =>
    item.product?.name || item.product_name || item.name || "Produk";
  const getImage = (item: any) =>
    item.product?.image_url || item.image_url || null;

  const totalAmount = cart.reduce(
    (sum, item) => sum + getPrice(item) * item.quantity,
    0,
  );

  useEffect(() => {
    if (isOpen) setIsAnimating(true);
    else setTimeout(() => setIsAnimating(false), 300);
  }, [isOpen]);

  // Handler untuk input ketik manual
  const handleInputChange = (id: string, value: string) => {
    // Hanya izinkan angka
    const cleanValue = value.replace(/[^0-9]/g, "");
    const numValue = Number(cleanValue);

    // Jika input kosong, biarkan kosong sementara (agar user bisa hapus semua angka dulu)
    if (cleanValue === "") {
      onUpdateQty(id, 0); // Di context akan terfilter/tetap 0
      return;
    }

    onUpdateQty(id, numValue);
  };

  if (!isOpen && !isAnimating) return null;

  return (
    <div
      className={`fixed inset-0 z-[2000] flex items-center justify-center px-4 transition-all duration-300 ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
    >
      {/* OVERLAY */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* POPUP CARD */}
      <div
        className={`relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] transition-all duration-300 ease-out transform ${isOpen ? "translate-y-0 opacity-100 scale-100" : "translate-y-[100%] opacity-0 scale-95"}`}
      >
        {/* HEADER */}
        <div className="bg-teal-600 p-6 flex justify-between items-center text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <ShoppingBag size={20} />
            </div>
            <div>
              <h2 className="font-black text-lg uppercase tracking-wide">
                Keranjang
              </h2>
              <p className="text-[10px] text-teal-100 font-medium">
                {cart.length} Item terpilih
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-black/10 hover:bg-black/20 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* ISI KERANJANG */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center py-10">
              <ShoppingBag size={40} className="text-slate-300 mb-4" />
              <p className="font-black text-slate-400 text-lg">
                Keranjang Kosong
              </p>
              <button
                onClick={onClose}
                className="mt-4 px-6 py-3 bg-teal-600 text-white rounded-xl font-bold text-xs uppercase shadow-lg"
              >
                Cari Produk
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex gap-4 animate-in slide-in-from-bottom-2 duration-500"
                >
                  {/* Gambar Produk */}
                  <div className="w-20 h-20 bg-slate-100 rounded-xl overflow-hidden shrink-0">
                    {getImage(item) ? (
                      <img
                        src={getImage(item)}
                        alt={getName(item)}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <ShoppingBag size={20} />
                      </div>
                    )}
                  </div>

                  {/* Detail Produk */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-sm text-slate-800 line-clamp-1">
                        {getName(item)}
                      </h3>
                      <p className="text-teal-600 font-black text-xs mt-1">
                        Rp {getPrice(item).toLocaleString()}
                      </p>
                    </div>

                    {/* KONTROL KUANTITAS (BISA DIKETIK) */}
                    <div className="flex justify-between items-end mt-2">
                      <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 border border-slate-200">
                        {/* Tombol Kurang */}
                        <button
                          type="button"
                          onClick={() =>
                            item.quantity > 1
                              ? onUpdateQty(item.id, item.quantity - 1)
                              : onRemove(item.id)
                          }
                          className="w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow-sm text-slate-600 active:scale-90 transition-all"
                        >
                          {item.quantity <= 1 ? (
                            <Trash2 size={14} className="text-red-500" />
                          ) : (
                            <Minus size={14} />
                          )}
                        </button>

                        {/* INPUT KOLOM JUMLAH (BISA DIKETIK) */}
                        <input
                          type="text"
                          inputMode="numeric"
                          value={item.quantity === 0 ? "" : item.quantity}
                          onChange={(e) =>
                            handleInputChange(item.id, e.target.value)
                          }
                          onBlur={() => {
                            // Jika saat klik luar kolom isinya kosong/0, hapus item atau set ke 1
                            if (item.quantity === 0) onRemove(item.id);
                          }}
                          className="w-12 h-8 bg-transparent text-center font-black text-sm text-slate-800 outline-none focus:ring-1 focus:ring-teal-500 rounded-md transition-all"
                        />

                        {/* Tombol Tambah */}
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateQty(item.id, item.quantity + 1)
                          }
                          className="w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow-sm text-slate-600 active:scale-90 transition-all"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* FOOTER */}
        {cart.length > 0 && (
          <div className="p-6 bg-white border-t border-slate-100 shrink-0">
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Total Pembayaran
              </span>
              <span className="text-xl font-black text-slate-900">
                Rp {totalAmount.toLocaleString()}
              </span>
            </div>
            <button
              onClick={onCheckout}
              className="w-full py-4 bg-orange-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-orange-500/20 active:scale-95 transition-all hover:bg-orange-600"
            >
              Checkout Sekarang <ArrowRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
