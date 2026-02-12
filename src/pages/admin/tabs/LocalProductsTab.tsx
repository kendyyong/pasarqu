import React from "react";
import { CheckCircle, XCircle, Store, CheckCircle2 } from "lucide-react";

interface Props {
  products: any[];
  onAction: (id: string, action: "APPROVED" | "REJECTED") => void;
}

export const LocalProductsTab: React.FC<Props> = ({ products, onAction }) => {
  if (products.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-10 text-center border border-dashed border-slate-200 animate-in fade-in">
        <CheckCircle2 size={48} className="mx-auto text-slate-200 mb-4" />
        <p className="text-slate-400 font-bold text-sm">
          Semua produk aman terkendali.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
      {products.map((product) => (
        <div
          key={product.id}
          className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col md:flex-row gap-6 items-start hover:shadow-md transition-all"
        >
          <img
            src={product.image_url || "https://via.placeholder.com/100"}
            className="w-24 h-24 rounded-2xl object-cover bg-slate-100 shadow-sm"
            alt="Product"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Store size={12} className="text-slate-400" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {product.merchants?.shop_name ||
                  product.merchants?.name ||
                  "Toko Tanpa Nama"}
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">
              {product.name}
            </h3>
            <p className="text-teal-600 font-black text-xl">
              Rp {product.price.toLocaleString()}
            </p>
            <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed bg-slate-50 p-2 rounded-lg">
              {product.description || "Tidak ada deskripsi"}
            </p>
          </div>
          <div className="flex md:flex-col gap-2 w-full md:w-auto mt-2 md:mt-0">
            <button
              onClick={() => onAction(product.id, "APPROVED")}
              className="w-full px-6 py-3 bg-teal-600 text-white rounded-xl text-xs font-bold hover:bg-teal-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-teal-600/20"
            >
              <CheckCircle size={16} /> Setujui
            </button>
            <button
              onClick={() => onAction(product.id, "REJECTED")}
              className="w-full px-6 py-3 bg-red-50 text-red-600 rounded-xl text-xs font-bold hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
            >
              <XCircle size={16} /> Tolak
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
