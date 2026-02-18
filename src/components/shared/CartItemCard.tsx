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
  <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
    <div className="px-3 py-2 border-b border-slate-50 flex items-center gap-2 bg-slate-50/50">
      <input
        type="checkbox"
        checked={isSelected}
        onChange={() => onToggle(item.id)}
        className="w-4 h-4 accent-teal-600 rounded cursor-pointer"
      />
      <Store size={14} className="text-slate-500" />
      <span className="text-xs font-bold text-slate-700">Toko Official</span>
      <ArrowRight size={12} className="text-slate-400" />
    </div>
    <div className="p-3 flex gap-3">
      <div
        className="w-20 h-20 bg-slate-100 rounded-lg overflow-hidden shrink-0 border border-slate-100 cursor-pointer"
        onClick={() => onNavigate(item.id)}
      >
        <img
          src={item.image_url || item.product?.image_url}
          alt={item.name}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="flex-1 flex flex-col justify-between">
        <h3
          className="text-sm font-medium text-slate-800 line-clamp-2 leading-snug cursor-pointer"
          onClick={() => onNavigate(item.id)}
        >
          {item.name}
        </h3>
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
);
