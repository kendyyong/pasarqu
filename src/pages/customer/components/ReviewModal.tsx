import React, { useState } from "react";
import { Star, X, MessageSquare, Loader2 } from "lucide-react";
import { supabase } from "../../../lib/supabaseClient";
import { useToast } from "../../../contexts/ToastContext";
import { useAuth } from "../../../contexts/AuthContext";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  product: {
    id: string;
    name: string;
    image_url?: string;
  } | null;
  onSuccess?: () => void;
}

export const ReviewModal: React.FC<Props> = ({
  isOpen,
  onClose,
  product,
  onSuccess,
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !product) return null;

  const handleSubmit = async () => {
    if (!comment.trim()) {
      showToast("Tuliskan sedikit ulasan Anda, Juragan", "error");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("product_reviews").insert([
        {
          product_id: product.id,
          user_id: user?.id,
          rating: rating,
          comment: comment.trim(),
        },
      ]);

      if (error) throw error;

      showToast("Ulasan berhasil dikirim!", "success");
      setComment("");
      setRating(5);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      showToast("Gagal mengirim ulasan", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Overlay Gelap */}
      <div
        className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Konten Modal */}
      <div className="relative bg-white w-full max-w-md shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header Modal */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="font-black text-slate-800 uppercase tracking-tighter text-sm">
              Beri Ulasan Produk
            </h3>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
              Bagikan pengalaman Anda
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-200 text-slate-400 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* Info Produk Singkat */}
          <div className="flex items-center gap-4 bg-slate-50 p-3 border border-slate-100">
            <div className="w-12 h-12 bg-white border border-slate-200 shrink-0 overflow-hidden">
              <img
                src={product.image_url || "https://placehold.co/100"}
                className="w-full h-full object-cover"
                alt={product.name}
              />
            </div>
            <p className="text-[11px] font-black text-slate-700 uppercase leading-tight line-clamp-2">
              {product.name}
            </p>
          </div>

          {/* Pemilihan Rating Bintang */}
          <div className="text-center">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">
              Kualitas Produk
            </p>
            <div className="flex justify-center gap-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className="transition-all active:scale-75 hover:scale-110"
                >
                  <Star
                    size={36}
                    className={`${
                      star <= rating
                        ? "text-orange-400 fill-orange-400"
                        : "text-slate-200"
                    } transition-colors`}
                    strokeWidth={1.5}
                  />
                </button>
              ))}
            </div>
            <p className="text-[10px] font-black text-orange-500 uppercase mt-3 tracking-widest">
              {rating === 5
                ? "Sempurna!"
                : rating === 4
                  ? "Sangat Baik"
                  : rating === 3
                    ? "Cukup"
                    : rating === 2
                      ? "Buruk"
                      : "Sangat Buruk"}
            </p>
          </div>

          {/* Form Input Komentar */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 pl-1">
              <MessageSquare size={12} /> Tulis Ulasan
            </label>
            <textarea
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Ceritakan kepuasan Anda belanja di Pasarqu..."
              className="w-full bg-slate-50 border border-slate-200 p-4 text-sm font-bold focus:ring-2 ring-teal-500/20 focus:border-teal-600 outline-none resize-none transition-all placeholder:text-slate-300"
            />
          </div>

          {/* Tombol Aksi */}
          <div className="flex flex-col gap-2 pt-2">
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full bg-teal-600 text-white py-4 font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-teal-600/20 hover:bg-teal-700 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
            >
              {submitting ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  Mengirim...
                </>
              ) : (
                "Kirim Ulasan Sekarang"
              )}
            </button>
            <button
              onClick={onClose}
              disabled={submitting}
              className="w-full py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors"
            >
              Nanti Saja
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
