import React from "react";
import { ShieldCheck, MapPin, Loader2, MessageCircle } from "lucide-react";

interface Props {
  merchant: any;
  onGoToShop: () => void;
  onContactSeller: () => void;
  chatLoading: boolean;
}

export const MerchantCard: React.FC<Props> = ({
  merchant,
  onGoToShop,
  onContactSeller,
  chatLoading,
}) => {
  return (
    <div className="mt-4 bg-white p-4 md:p-6 md:shadow-sm md:rounded-sm flex items-center gap-5 border-y md:border border-slate-100">
      <div className="relative shrink-0">
        <img
          src={merchant?.avatar_url || "https://via.placeholder.com/100"}
          className="w-16 h-16 rounded-full border border-slate-100 object-cover"
          alt="Merchant"
        />
        {merchant?.is_verified && (
          <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5">
            <ShieldCheck size={18} className="text-teal-600" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm md:text-base font-black text-slate-800 uppercase">
          {merchant?.shop_name || "Toko Pasarqu"}
        </h4>
        <p className="text-[10px] text-slate-400 flex items-center gap-1">
          <MapPin size={10} /> {merchant?.city || "Area Pasar"}
        </p>
        <div className="flex gap-2 mt-3">
          <button
            onClick={onGoToShop}
            className="px-4 py-1.5 border border-teal-600 text-teal-600 text-[10px] font-black uppercase hover:bg-teal-50 transition-all"
          >
            Lihat Toko
          </button>
          <button
            onClick={onContactSeller}
            disabled={chatLoading}
            className="px-4 py-1.5 border border-slate-200 text-slate-500 text-[10px] font-black uppercase hover:bg-slate-50 flex items-center gap-2"
          >
            {chatLoading ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <MessageCircle size={12} />
            )}
            Chat Penjual
          </button>
        </div>
      </div>
    </div>
  );
};
