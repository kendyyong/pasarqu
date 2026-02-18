import React from "react";

interface Props {
  category: string;
  city: string;
  stock: number;
  description: string;
}

// ✅ Menggunakan Named Export agar sinkron dengan ProductDetail.tsx
export const ProductDescription: React.FC<Props> = ({
  category,
  city,
  stock,
  description,
}) => {
  return (
    <div className="mt-4 bg-white p-4 md:p-8 md:shadow-sm md:rounded-sm">
      {/* Judul Seksi */}
      <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-6 border-l-4 border-teal-600 pl-3">
        Rincian & Spesifikasi
      </h3>

      {/* Grid Informasi */}
      <div className="grid md:grid-cols-2 gap-y-4 mb-10 text-left">
        <div className="flex text-[11px] md:text-xs">
          <span className="w-28 text-slate-400 font-bold uppercase tracking-tighter shrink-0">
            Kategori
          </span>
          <span className="text-teal-600 font-black uppercase tracking-tight">
            {category || "Pasar Lokal"}
          </span>
        </div>

        <div className="flex text-[11px] md:text-xs">
          <span className="w-28 text-slate-400 font-bold uppercase tracking-tighter shrink-0">
            Wilayah
          </span>
          <span className="text-slate-800 font-bold uppercase tracking-tight">
            {city || "Lokal"}
          </span>
        </div>

        <div className="flex text-[11px] md:text-xs">
          <span className="w-28 text-slate-400 font-bold uppercase tracking-tighter shrink-0">
            Stok
          </span>
          <span className="font-black uppercase text-slate-800 tracking-tight">
            {stock} Unit
          </span>
        </div>
      </div>

      {/* Area Deskripsi */}
      <div className="border-t border-slate-50 pt-8 text-left">
        <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line text-justify font-medium">
          {description || "Penjual belum melengkapi deskripsi produk ini."}
        </p>
      </div>
    </div>
  );
};
