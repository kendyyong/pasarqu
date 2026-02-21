import React, { useMemo } from "react";
import { BellRing, CheckCircle, Volume2 } from "lucide-react";

interface Props {
  incomingOrder: any;
  onProcess: () => void;
  onMute: () => void;
}

export const MerchantAlarmModal: React.FC<Props> = ({
  incomingOrder,
  onProcess,
  onMute,
}) => {
  // ✅ ANTI-CACHE BYPASS: Tambahkan timestamp agar browser mengira ini file baru terus
  // Ini akan menyelesaikan masalah net::ERR_CACHE_OPERATION_NOT_SUPPORTED
  const audioUrl = useMemo(() => {
    return `https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3?nocache=${Date.now()}`;
  }, []);

  if (!incomingOrder) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-900/95 backdrop-blur-md flex flex-col items-center justify-center p-6 animate-in zoom-in duration-300">
      {/* ✅ AUDIO PLAYER TERSEMBUNYI */}
      {/* Otomatis berbunyi (autoPlay) dan mengulang (loop) selama modal ini tampil */}
      <audio src={audioUrl} autoPlay loop className="hidden" />

      <div className="bg-white w-full max-w-sm rounded-none border-4 border-red-500 shadow-2xl p-8 text-center relative overflow-hidden">
        {/* Ping Effect */}
        <div className="absolute top-4 right-4">
          <span className="relative flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500"></span>
          </span>
        </div>

        <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
          <BellRing size={48} className="text-red-600" />
        </div>

        <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-2">
          Pesanan Masuk!
        </h2>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-8">
          Segera terima agar kurir bisa menjemput.
        </p>

        <div className="space-y-3">
          <button
            onClick={onProcess}
            className="w-full py-4 bg-teal-600 text-white font-black uppercase text-sm tracking-widest shadow-xl hover:bg-teal-700 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <CheckCircle size={18} /> PROSES SEKARANG
          </button>

          <button
            onClick={onMute}
            className="w-full py-4 bg-slate-100 text-slate-500 font-bold uppercase text-xs tracking-widest hover:bg-slate-200 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Volume2 size={16} /> Matikan Suara Saja
          </button>
        </div>
      </div>
    </div>
  );
};
