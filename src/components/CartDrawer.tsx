import React from 'react';
import { X, Trash2, Plus, Minus, ShoppingCart, ChevronRight, ArrowRight, Ticket } from 'lucide-react'; // Ikon Ticket sudah ditambahkan di sini
import { CartItem } from '../types';

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
  onCheckout
}) => {
  if (!isOpen) return null;

  const totalHarga = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="fixed inset-0 z-[3000] flex items-end justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300 p-0 md:p-4">
      {/* TINGGI OTOMATIS: Menggunakan h-auto agar mengecil jika barang sedikit */}
      <div className="bg-[#f8fafc] w-full max-w-[500px] h-auto max-h-[85vh] flex flex-col rounded-t-[2.5rem] md:rounded-[2.5rem] shadow-2xl animate-in slide-in-from-bottom duration-400 overflow-hidden border-t border-white/20">
        
        {/* HEADER KERANJANG */}
        <div className="bg-teal-600 p-5 flex justify-between items-center shrink-0 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <ShoppingCart size={18} />
            </div>
            <div className="text-left">
              <h2 className="text-sm font-black uppercase tracking-widest">Keranjang</h2>
              <p className="text-[10px] font-bold opacity-80 uppercase tracking-tighter">
                {cart.length} Item Pasarqu
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-all">
            <X size={18} />
          </button>
        </div>

        {/* LIST PRODUK */}
        <div className="overflow-y-auto p-4 space-y-3 no-scrollbar bg-white/50">
          {cart.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <div className="p-6 bg-slate-50 rounded-full text-teal-100 mb-4">
                <ShoppingCart size={48} strokeWidth={1.5}/>
              </div>
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">Belum ada barang</p>
              <button 
                onClick={onClose}
                className="mt-4 text-[10px] font-black text-teal-600 uppercase underline"
              >
                Mulai Belanja
              </button>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="bg-white p-3 flex gap-3 shadow-sm rounded-2xl relative border border-slate-100">
                {/* Gambar Produk */}
                <div className="w-16 h-16 bg-slate-100 rounded-xl overflow-hidden shrink-0">
                  <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                </div>

                {/* Info & Kontrol */}
                <div className="flex-1 flex flex-col text-left">
                  <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-tight line-clamp-1">{item.name}</h4>
                  
                  <div className="mt-auto flex justify-between items-end">
                    <span className="text-xs font-black text-orange-600">
                      Rp{item.price.toLocaleString()}
                    </span>
                    
                    {/* Kontrol Jumlah Slim */}
                    <div className="flex items-center bg-slate-50 border border-slate-100 rounded-lg p-0.5">
                      <button 
                        onClick={() => onUpdateQty(item.id, -1)}
                        className="p-1 hover:bg-white rounded text-slate-400"
                      >
                        <Minus size={10} strokeWidth={4} />
                      </button>
                      <span className="w-6 text-center text-[11px] font-black text-slate-800">
                        {item.quantity}
                      </span>
                      <button 
                        onClick={() => onUpdateQty(item.id, 1)}
                        className="p-1 hover:bg-white rounded text-teal-600"
                      >
                        <Plus size={10} strokeWidth={4} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Tombol Hapus */}
                <button 
                  onClick={() => onRemove(item.id)}
                  className="absolute top-2 right-2 text-slate-200 hover:text-rose-500 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* FOOTER CHECKOUT */}
        {cart.length > 0 && (
          <div className="bg-white border-t border-slate-100 p-5 shrink-0">
            {/* Voucher Mini Row */}
            <div className="flex items-center justify-between mb-4 text-left bg-teal-50/50 p-2 rounded-xl border border-teal-100/50 cursor-pointer hover:bg-teal-50 transition-colors">
               <div className="flex items-center gap-2 text-[9px] font-black uppercase text-teal-700">
                  <Ticket size={14}/> Voucher Pasarqu
               </div>
               <ChevronRight size={14} className="text-teal-400"/>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="text-left">
                <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest">Total</p>
                <p className="text-lg font-black text-orange-600 leading-none">
                  Rp{totalHarga.toLocaleString()}
                </p>
              </div>
              <button 
                onClick={onCheckout}
                className="flex-1 bg-orange-600 text-white py-3.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-orange-100 active:scale-95 transition-all flex items-center justify-center gap-2"
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