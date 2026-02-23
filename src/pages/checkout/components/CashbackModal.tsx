import React from "react";
import { Gift } from "lucide-react";

interface Props {
  show: boolean;
  amount: number;
  onClaim: () => void;
}

export const CashbackModal: React.FC<Props> = ({ show, amount, onClaim }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[1000] bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in">
      <div className="bg-white w-full max-w-sm rounded-md overflow-hidden shadow-2xl border-t-[12px] border-[#FF6600]">
        <div className="bg-orange-50 p-8 flex flex-col items-center text-center">
          <div className="w-24 h-24 bg-[#FF6600] rounded-md flex items-center justify-center text-white mb-6 rotate-3 shadow-lg">
            <Gift size={52} />
          </div>
          <h2 className="text-[18px] font-[1000] text-slate-800 uppercase tracking-widest leading-none">
            BONUS TUNAI!
          </h2>
          <p className="text-[12px] text-slate-400 font-black uppercase mt-3">
            HADIAH KHUSUS AMBIL SENDIRI
          </p>
        </div>
        <div className="p-8 text-center">
          <span className="text-[12px] font-black text-[#008080] uppercase">
            SALDO DITERIMA
          </span>
          <h3 className="text-[48px] font-[1000] text-[#008080] font-sans leading-none mt-2 mb-4">
            RP {amount.toLocaleString()}
          </h3>
          <p className="text-[12px] font-black text-slate-400 uppercase leading-tight mb-8">
            SALDO MASUK OTOMATIS SETELAH BARANG DIAMBIL DI LAPAK.
          </p>
          <button
            onClick={onClaim}
            className="w-full py-5 bg-slate-900 text-white rounded-md font-[1000] text-[14px] uppercase active:scale-95 shadow-xl"
          >
            KLAIM & LANJUT
          </button>
        </div>
      </div>
    </div>
  );
};
