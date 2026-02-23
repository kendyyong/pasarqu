import React from "react";
import { Wallet, Plus, ArrowDownLeft, AlertCircle } from "lucide-react";
import { formatRupiah } from "../../../utils/format";

interface Props {
  balance: number;
  minWithdrawal: number;
  onTopUp: () => void;
  onWithdraw: () => void;
}

export const CourierFinance: React.FC<Props> = ({
  balance,
  minWithdrawal,
  onTopUp,
  onWithdraw,
}) => {
  return (
    <div className="w-full space-y-6 animate-in fade-in duration-500 text-left font-black uppercase tracking-tighter not-italic text-[12px]">
      {/* 🚀 KARTU SALDO UTAMA - Desain Bersih & Elegan */}
      <div className="bg-slate-900 rounded-xl p-6 text-white relative overflow-hidden shadow-lg border-t-4 border-[#008080]">
        {/* Latar Belakang Geometris Halus */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white rounded-full blur-3xl"></div>
          <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-[#008080] rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Wallet size={16} className="text-[#008080]" />
            <p className="text-[10px] text-slate-400 tracking-widest leading-none">
              SALDO DOMPET KURIR
            </p>
          </div>

          <h2 className="text-[32px] md:text-[40px] font-sans font-[1000] tracking-tighter mb-8 leading-none">
            {formatRupiah(balance)}
          </h2>

          <div className="flex gap-3">
            <button
              onClick={onTopUp}
              className="flex-1 py-3.5 bg-[#FF6600] text-white rounded-md font-[1000] text-[11px] tracking-widest flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all"
            >
              <Plus size={16} strokeWidth={3} /> ISI SALDO
            </button>
            <button
              onClick={onWithdraw}
              disabled={balance < minWithdrawal}
              className={`flex-1 py-3.5 rounded-md font-[1000] text-[11px] tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 ${
                balance >= minWithdrawal
                  ? "bg-white text-slate-900 shadow-md hover:bg-slate-100"
                  : "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
              }`}
            >
              <ArrowDownLeft size={16} strokeWidth={3} /> TARIK DANA
            </button>
          </div>
        </div>
      </div>

      {/* Peringatan Minimal Penarikan (Hanya Muncul Jika Saldo Kurang) */}
      {balance < minWithdrawal && (
        <div className="bg-orange-50 border border-orange-200 rounded-md p-4 flex items-center gap-3 animate-in slide-in-from-top-2">
          <AlertCircle size={20} className="text-[#FF6600] shrink-0" />
          <p className="text-[10px] text-orange-800 tracking-widest leading-relaxed">
            SALDO ANDA BELUM MENCAPAI BATAS MINIMAL PENARIKAN (
            <span className="font-sans font-[1000] text-[#FF6600]">
              {formatRupiah(minWithdrawal)}
            </span>
            ).
          </p>
        </div>
      )}
    </div>
  );
};
