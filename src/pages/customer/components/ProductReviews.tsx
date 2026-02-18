import React from "react";
import { Star, User } from "lucide-react";

interface Props {
  reviews: any[];
  soldCount: number; // ✅ Pintu ini yang membuat error jika tidak ada
}

export const ProductReviews: React.FC<Props> = ({ reviews, soldCount }) => {
  // Logika hitung rata-rata rating
  const averageRating =
    reviews.length > 0
      ? (
          reviews.reduce((acc, item) => acc + item.rating, 0) / reviews.length
        ).toFixed(1)
      : "0";

  return (
    <div className="mt-4 bg-white p-4 md:p-8 border-t border-slate-100">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-1 border-l-4 border-teal-600 pl-3">
            Ulasan Pembeli
          </h3>
          <div className="flex items-center gap-2 ml-4 mt-2">
            <p className="text-[10px] text-slate-400 font-bold uppercase">
              {reviews.length} Ulasan Terverifikasi
            </p>
            <span className="text-slate-200">|</span>
            <p className="text-[10px] text-teal-600 font-bold uppercase tracking-tight">
              {soldCount.toLocaleString()} Produk Terjual
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-slate-50 p-3 border border-slate-100 self-start md:self-center">
          <div className="text-right">
            <div className="flex items-center gap-1 justify-end text-orange-400">
              <Star size={16} fill="currentColor" />
              <span className="text-2xl font-black text-slate-800 leading-none">
                {averageRating}
              </span>
            </div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-1">
              Skor Produk
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6 text-left">
        {reviews.length > 0 ? (
          reviews.map((rev) => (
            <div
              key={rev.id}
              className="border-b border-slate-50 pb-6 last:border-none"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-slate-100 flex items-center justify-center text-slate-400 overflow-hidden border border-slate-200">
                  {rev.profiles?.avatar_url ? (
                    <img
                      src={rev.profiles.avatar_url}
                      className="w-full h-full object-cover"
                      alt="user"
                    />
                  ) : (
                    <User size={14} />
                  )}
                </div>
                <div>
                  <p className="text-[11px] font-black text-slate-800 uppercase leading-none">
                    {rev.profiles?.full_name ||
                      rev.profiles?.username ||
                      "Pembeli Pasarqu"}
                  </p>
                  <div className="flex items-center gap-0.5 mt-1 text-orange-400">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={10}
                        fill={i < rev.rating ? "currentColor" : "none"}
                        strokeWidth={2.5}
                      />
                    ))}
                  </div>
                </div>
                <span className="ml-auto text-[9px] font-bold text-slate-300 uppercase">
                  {new Date(rev.created_at).toLocaleDateString("id-ID")}
                </span>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed font-bold">
                {rev.comment}
              </p>
            </div>
          ))
        ) : (
          <div className="text-center py-10 border-2 border-dashed border-slate-100">
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
              Belum ada ulasan untuk produk ini
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
