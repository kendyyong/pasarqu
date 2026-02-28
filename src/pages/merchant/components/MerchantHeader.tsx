import React from "react";
import { Store, User, ShieldCheck } from "lucide-react";

interface Props {
  shopName: string;
  marketName: string;
  isOpen: boolean;
  avatarUrl?: string; // 🚀 Menerima foto profil dari database
}

export const MerchantHeader: React.FC<Props> = ({
  shopName,
  marketName,
  isOpen,
  avatarUrl,
}) => {
  return (
    <div className="flex items-center gap-3 md:gap-4 overflow-hidden w-full">
      {/* 🚀 AVATAR PRO: Foto Profil Toko */}
      <div className="shrink-0 relative">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={shopName}
            className="w-10 h-10 md:w-12 md:h-12 rounded-xl object-cover border border-slate-200 shadow-sm"
          />
        ) : (
          <div className="w-10 h-10 md:w-12 md:h-12 bg-slate-900 text-white rounded-xl flex items-center justify-center shadow-sm border border-slate-800">
            <span className="font-black text-lg md:text-xl">
              {shopName ? (
                shopName.charAt(0).toUpperCase()
              ) : (
                <Store size={20} />
              )}
            </span>
          </div>
        )}

        {/* Indikator Status (Kecil & Rapih) */}
        <span
          className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${isOpen ? "bg-teal-500" : "bg-red-500"}`}
        ></span>
      </div>

      <div className="flex flex-col min-w-0 flex-1 text-left">
        <div className="flex items-center gap-1.5">
          <h1 className="text-[13px] md:text-base font-[1000] text-slate-800 dark:text-white uppercase truncate tracking-tighter leading-none">
            {shopName || "MEMUAT..."}
          </h1>
          {isOpen && (
            <ShieldCheck size={12} className="text-[#008080] shrink-0" />
          )}
        </div>
        <p className="text-[9px] md:text-[10px] text-slate-400 font-bold uppercase tracking-widest truncate mt-0.5">
          {marketName || "CABANG LOKAL"}
        </p>
      </div>
    </div>
  );
};
