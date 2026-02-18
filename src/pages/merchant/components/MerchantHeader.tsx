import React from "react";
import { MapPin } from "lucide-react";

interface Props {
  shopName: string;
  marketName: string;
  isOpen: boolean;
}

export const MerchantHeader: React.FC<Props> = ({
  shopName,
  marketName,
  isOpen,
}) => {
  return (
    <header className="h-14 md:h-16 bg-white border-b border-slate-200 px-4 md:px-8 flex items-center justify-between sticky top-0 z-40 shrink-0">
      <div className="flex flex-col text-left truncate flex-1 mr-4">
        <h1 className="text-[11px] md:text-sm font-black uppercase tracking-tight text-slate-900 truncate leading-none">
          {shopName}
        </h1>
        <div className="flex items-center gap-1 mt-1 text-slate-400">
          <MapPin size={8} />
          <span className="text-[7px] md:text-[8px] font-bold uppercase tracking-wider truncate">
            {marketName}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <div className="flex flex-col items-end mr-1">
          <p className="text-[6px] md:text-[7px] font-black text-slate-400 uppercase leading-none">
            Status Toko
          </p>
          <p
            className={`text-[8px] md:text-[9px] font-black uppercase mt-0.5 flex items-center gap-0.5 ${isOpen ? "text-green-600" : "text-red-500"}`}
          >
            <span
              className={`w-1 h-1 ${isOpen ? "bg-green-500 animate-pulse" : "bg-red-500"}`}
            ></span>
            {isOpen ? "BUKA" : "TUTUP"}
          </p>
        </div>
        <div
          className={`w-8 h-8 md:w-9 md:h-9 bg-slate-900 text-white rounded-none flex items-center justify-center font-black text-xs uppercase border-b-2 ${isOpen ? "border-green-500" : "border-red-500"}`}
        >
          {shopName.charAt(0)}
        </div>
      </div>
    </header>
  );
};
