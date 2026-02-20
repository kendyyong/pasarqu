import React from "react";
import { Trash2, Minus, Plus, Store, ArrowRight } from "lucide-react";
import { CartItem } from "../../types";

interface Props {
  item: CartItem;
  isSelected: boolean;
  onToggle: (id: string) => void;
  onUpdateQty: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
  onNavigate: (id: string) => void;
}

export const CartItemCard: React.FC<Props> = ({
  item,
  isSelected,
  onToggle,
  onUpdateQty,
  onRemove,
  onNavigate,
}) => (
  <div className="bg-white border-2 border-slate-100 overflow-hidden transition-all hover:border-teal-500/30">
    {/* HEADER TOKO */}
    <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggle(item.id)}
          className="w-4 h-4 accent-teal-600 rounded cursor-pointer"
        />
        <Store size={14} className="text-teal-600" />
        <span className="text-[10px] font-black text-slate-800 uppercase tracking-tighter">
          {item.merchant_name || "TOKO PASARQU"}
        </span>
      </div>
      <button
        onClick={() => onNavigate(item.id)}
        className="text-[9px] font-black text-slate-400 hover:text-teal-600 uppercase flex items-center gap-1"
      >
        Detail <ArrowRight size={10} />
      </button>
    </div>

    {/* BODY KONTEN */}
    <div className="p-3 flex gap-4">
      {/* GAMBAR PRODUK */}
      <div
        className="w-16 h-16 bg-slate-50 border border-slate-100 overflow-hidden shrink-0 cursor-pointer"
        onClick={() => onNavigate(item.id)}
      >
        <img
          src={item.image_url || item.product?.image_url}
          alt={item.name}
          className="w-full h-full object-cover"
        />
      </div>

      {/* INFORMASI PRODUK */}
      <div className="flex-1 flex flex-col justify-between">
        <h3
          className="text-[11px] font-black text-slate-900 uppercase leading-tight line-clamp-2 cursor-pointer tracking-tight"
          onClick={() => onNavigate(item.id)}
        >
          {item.name}
        </h3>

        <div className="flex items-center justify-between mt-2">
          <span className="text-xs font-black text-orange-600">
            RP {item.price.toLocaleString()}
          </span>

          {/* KONTROL QUANTITY */}
          <div className="flex items-center border-2 border-slate-900 bg-white">
            <button
              onClick={() => onUpdateQty(item.id, -1)}
              className="w-6 h-6 flex items-center justify-center text-slate-900 hover:bg-slate-100 disabled:opacity-30"
              disabled={item.quantity <= 1}
            >
              <Minus size={10} strokeWidth={4} />
            </button>
            <span className="w-8 text-center text-[10px] font-black text-slate-900 border-x-2 border-slate-900">
              {item.quantity}
            </span>
            <button
              onClick={() => onUpdateQty(item.id, 1)}
              className="w-6 h-6 flex items-center justify-center text-teal-600 hover:bg-teal-50"
            >
              <Plus size={10} strokeWidth={4} />
            </button>
          </div>
        </div>
      </div>
    </div>

    {/* FOOTER ACTIONS */}
    <div className="px-3 py-1.5 border-t border-slate-50 flex justify-end">
      <button
        onClick={() => onRemove(item.id)}
        className="text-[9px] font-black text-slate-400 hover:text-red-600 uppercase flex items-center gap-1 transition-colors"
      >
        <Trash2 size={11} /> Hapus Barang
      </button>
    </div>
  </div>
);
