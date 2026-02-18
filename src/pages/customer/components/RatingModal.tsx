import React, { useState } from "react";
import { Star, X, MessageSquare, Loader2, Heart } from "lucide-react";
import { supabase } from "../../lib/supabaseClient"; // Jalur diperbaiki
import { useToast } from "../../contexts/ToastContext"; // Jalur diperbaiki

interface Props {
  order: any;
  onClose: () => void;
  onSuccess: () => void;
}

export const RatingModal: React.FC<Props> = ({ order, onClose, onSuccess }) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [ratingMerchant, setRatingMerchant] = useState(5);
  const [ratingCourier, setRatingCourier] = useState(5);
  const [comment, setComment] = useState("");

  const handleSubmit = async () => {
    if (!order) return;

    setLoading(true);
    try {
      const { error } = await supabase.from("reviews").insert([
        {
          order_id: order.id,
          customer_id: order.customer_id,
          merchant_id: order.merchant_id,
          courier_id: order.courier_id,
          market_id: order.market_id,
          rating_merchant: ratingMerchant,
          rating_courier: ratingCourier,
          comment: comment,
        },
      ]);

      if (error) throw error;

      // Update tabel orders agar tidak bisa di-review dua kali (opsional tapi pro)
      await supabase
        .from("orders")
        .update({ has_review: true })
        .eq("id", order.id);

      showToast("Terima kasih! Rating Anda sangat berharga.", "success");
      onSuccess();
      onClose();
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const StarRating = ({ value, onChange, label }: any) => (
    <div className="space-y-3 text-center">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
        {label}
      </p>
      <div className="flex justify-center gap-2">
        {[1, 2, 3, 4, 5].map((s) => (
          <button
            key={s}
            onClick={() => onChange(s)}
            className={`transition-all duration-300 transform active:scale-75 ${s <= value ? "text-orange-400 scale-110" : "text-slate-200"}`}
          >
            <Star
              size={32}
              fill={s <= value ? "currentColor" : "none"}
              strokeWidth={2.5}
            />
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-t-[3rem] md:rounded-[3rem] p-8 shadow-2xl animate-in slide-in-from-bottom-10 duration-500 overflow-hidden relative">
        {/* CLOSE BUTTON */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 bg-slate-50 rounded-full text-slate-400 hover:text-red-500 transition-colors"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center">
            <Heart size={24} fill="currentColor" />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter leading-none">
              Kepuasan Anda
            </h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
              Feedback Wilayah Pasarqu
            </p>
          </div>
        </div>

        <div className="space-y-8">
          <StarRating
            label={`Rating untuk Toko`}
            value={ratingMerchant}
            onChange={setRatingMerchant}
          />

          <div className="flex items-center gap-4">
            <div className="h-[1px] bg-slate-100 flex-1"></div>
            <div className="w-2 h-2 rounded-full bg-slate-100"></div>
            <div className="h-[1px] bg-slate-100 flex-1"></div>
          </div>

          <StarRating
            label={`Rating untuk Kurir`}
            value={ratingCourier}
            onChange={setRatingCourier}
          />

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">
              Bagikan Pengalaman Anda
            </label>
            <div className="relative">
              <MessageSquare
                className="absolute left-5 top-5 text-slate-300"
                size={20}
              />
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Tulis alasan Anda di sini..."
                className="w-full bg-slate-50 border-none rounded-[2.5rem] pl-14 pr-6 py-5 font-medium text-slate-700 focus:ring-2 focus:ring-teal-500 outline-none resize-none h-32 text-sm shadow-inner"
              />
            </div>
          </div>

          <button
            disabled={loading}
            onClick={handleSubmit}
            className="w-full py-5 bg-teal-600 text-white rounded-[2rem] font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-teal-600/20 hover:bg-teal-700 active:scale-95 transition-all flex items-center justify-center gap-3"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              "Kirim Penilaian"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
