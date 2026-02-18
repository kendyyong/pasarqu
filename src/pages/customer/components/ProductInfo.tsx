import React from "react";
import { Star, Package } from "lucide-react";

interface Props {
  name: string;
  price: number;
  unit: string;
  stock: number;
  isOutOfStock: boolean;
  soldCount: number;
  rating: number; // ✅ Pintu rating dibuka di sini
}

export const ProductInfo: React.FC<Props> = ({
  name,
  price,
  unit,
  stock,
  isOutOfStock,
  soldCount,
  rating,
}) => {
  return (
    <div className="space-y-6 text-left">
      <div>
        <div className="flex justify-between items-start gap-4">
          <h1 className="text-xl md:text-2xl text-slate-800 font-black uppercase tracking-tighter flex-1 leading-tight">
            {name}
          </h1>
          <div
            className={`flex flex-col items-end shrink-0 ${
              isOutOfStock || stock < 5 ? "text-red-600" : "text-teal-600"
            }`}
          >
            <Package size={24} />
            <span className="text-[10px] font-black uppercase mt-1 tracking-widest">
              {isOutOfStock ? "Habis" : `Sisa ${stock}`}
            </span>
          </div>
        </div>

        {/* STATS AREA: Data 100% Real */}
        <div className="flex items-center gap-3 mt-4 text-slate-500">
          <div className="flex items-center gap-1 text-teal-600 border-r border-slate-200 pr-3">
            <span className="text-sm font-black">
              {rating > 0 ? rating : "-"}
            </span>
            <Star size={12} fill={rating > 0 ? "currentColor" : "none"} />
          </div>
          <div className="text-[11px] font-bold uppercase tracking-tight border-r border-slate-200 pr-3">
            Rating Asli
          </div>
          <div className="text-[11px] font-bold uppercase tracking-tight text-slate-800">
            {soldCount > 0 ? (
              <span className="flex gap-1">
                {soldCount.toLocaleString()}{" "}
                <span className="text-slate-400">Terjual</span>
              </span>
            ) : (
              "Belum Terjual"
            )}
          </div>
        </div>
      </div>

      {/* HARGA AREA */}
      <div className="bg-slate-50 p-4 md:p-6 flex items-center gap-3 border border-slate-100">
        <span className="text-teal-600 text-3xl md:text-4xl font-black tracking-tighter">
          Rp {price.toLocaleString()}
        </span>
        <span className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">
          per {unit || "Unit"}
        </span>
      </div>
    </div>
  );
};
