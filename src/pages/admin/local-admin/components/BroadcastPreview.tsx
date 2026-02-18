import React from "react";

interface Props {
  marketName: string;
  title: string;
  message: string;
}

export const BroadcastPreview: React.FC<Props> = ({
  marketName,
  title,
  message,
}) => (
  <div className="bg-slate-900 w-full aspect-[9/18] rounded-[3.5rem] border-[8px] border-slate-800 p-6 relative overflow-hidden shadow-2xl ring-4 ring-slate-100">
    <div className="w-28 h-6 bg-slate-800 mx-auto rounded-b-3xl mb-10"></div>
    <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-5 border border-white/20">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-6 h-6 bg-teal-500 rounded-lg flex items-center justify-center text-[10px] font-black text-white">
          P
        </div>
        <span className="text-[9px] font-black text-white/80 uppercase">
          Pasarqu • {marketName}
        </span>
      </div>
      <h5 className="text-xs font-black text-white mb-1 truncate uppercase italic">
        {title || "Judul Muncul Di Sini"}
      </h5>
      <p className="text-[10px] text-slate-300 line-clamp-3 leading-relaxed">
        {message || "Isi pesan muncul di sini..."}
      </p>
    </div>
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-24 h-1.5 bg-white/20 rounded-full"></div>
  </div>
);
