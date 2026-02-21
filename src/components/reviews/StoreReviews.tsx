import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";
import { Star, MessageSquare, User, Loader2 } from "lucide-react";

interface StoreReviewsProps {
  merchantId: string;
}

export const StoreReviews: React.FC<StoreReviewsProps> = ({ merchantId }) => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    average: 0,
    total: 0,
    ratingCounts: [0, 0, 0, 0, 0], // [bintang 1, bintang 2, ..., bintang 5]
  });

  useEffect(() => {
    const fetchReviews = async () => {
      if (!merchantId) return;
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("reviews")
          .select(
            `
            id, 
            rating, 
            comment, 
            created_at,
            customer_id,
            profiles:customer_id (full_name)
          `,
          )
          .eq("merchant_id", merchantId)
          .order("created_at", { ascending: false });

        if (error) throw error;

        if (data && data.length > 0) {
          setReviews(data);

          // Hitung rata-rata dan distribusi bintang
          let totalStars = 0;
          const counts = [0, 0, 0, 0, 0];

          data.forEach((rev) => {
            totalStars += rev.rating;
            counts[rev.rating - 1] += 1;
          });

          setStats({
            average: totalStars / data.length,
            total: data.length,
            ratingCounts: counts,
          });
        }
      } catch (err) {
        console.error("Gagal memuat ulasan:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [merchantId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-white rounded-[2rem] border border-slate-100 shadow-sm mt-4">
        <Loader2 className="animate-spin text-[#008080] mb-2" size={24} />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
          Memuat Ulasan...
        </p>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-10 bg-white rounded-[2rem] border border-dashed border-slate-200 mt-4 text-center">
        <MessageSquare className="text-slate-200 mb-3" size={40} />
        <h3 className="text-[14px] font-black text-slate-800 uppercase tracking-tighter">
          Belum Ada Ulasan
        </h3>
        <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">
          Jadilah yang pertama menilai toko ini!
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm mt-4 overflow-hidden font-sans text-left">
      {/* HEADER STATISTIK BINTANG */}
      <div className="p-6 md:p-8 border-b border-slate-100 flex flex-col md:flex-row gap-6 items-center md:items-start bg-slate-50/50">
        {/* Rata-rata Besar */}
        <div className="flex flex-col items-center justify-center shrink-0">
          <h2 className="text-5xl font-black text-slate-900 tracking-tighter leading-none">
            {stats.average.toFixed(1)}
          </h2>
          <div className="flex items-center gap-1 my-2 text-yellow-400">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                size={16}
                fill={
                  star <= Math.round(stats.average) ? "currentColor" : "none"
                }
                className={
                  star <= Math.round(stats.average)
                    ? "text-yellow-400"
                    : "text-slate-200"
                }
              />
            ))}
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            {stats.total} Ulasan
          </p>
        </div>

        {/* Bar Distribusi Bintang */}
        <div className="flex-1 w-full space-y-1.5">
          {[5, 4, 3, 2, 1].map((star, idx) => {
            const count = stats.ratingCounts[star - 1];
            const percentage =
              stats.total > 0 ? (count / stats.total) * 100 : 0;

            return (
              <div
                key={star}
                className="flex items-center gap-3 text-[10px] font-black uppercase text-slate-500"
              >
                <span className="w-4 flex items-center gap-1">
                  {star}{" "}
                  <Star
                    size={10}
                    fill="currentColor"
                    className="text-yellow-400 mb-0.5"
                  />
                </span>
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-400 rounded-full"
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
                <span className="w-6 text-right text-slate-400">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* DAFTAR ULASAN */}
      <div className="divide-y divide-slate-50">
        {reviews.map((review) => (
          <div
            key={review.id}
            className="p-6 hover:bg-slate-50/50 transition-colors"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-teal-50 text-[#008080] rounded-full flex items-center justify-center shrink-0">
                  <User size={18} />
                </div>
                <div>
                  <h4 className="text-[12px] font-black text-slate-800 uppercase leading-none">
                    {review.profiles?.full_name || "Pelanggan Pasarqu"}
                  </h4>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                    {new Date(review.created_at).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
              <div className="flex text-yellow-400">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={12}
                    fill={star <= review.rating ? "currentColor" : "none"}
                    className={
                      star <= review.rating
                        ? "text-yellow-400"
                        : "text-slate-200"
                    }
                  />
                ))}
              </div>
            </div>

            {review.comment && (
              <p className="text-[12px] font-bold text-slate-600 leading-relaxed mt-2 pl-13">
                "{review.comment}"
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
