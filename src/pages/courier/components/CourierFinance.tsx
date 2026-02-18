// src/pages/courier/components/CourierFinance.tsx
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
    <div className="space-y-6 animate-in slide-in-from-bottom-4">
      <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">
        Dompet Saya
      </h1>
      <div className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl">
        <div className="relative z-10">
          <p className="text-[10px] font-black uppercase opacity-60 mb-2">
            Gaji Bersih
          </p>
          <h2 className="text-5xl font-black tracking-tighter mb-10 italic">
            {formatRupiah(balance)}
          </h2>
          <div className="flex gap-3">
            <button
              onClick={onTopUp}
              className="py-4 px-8 bg-white/10 hover:bg-white/20 text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest flex gap-2"
            >
              <Plus size={16} /> Top Up
            </button>
            <button
              onClick={onWithdraw}
              className={`py-4 px-8 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest flex gap-2 ${balance >= minWithdrawal ? "bg-teal-500 text-slate-900" : "bg-slate-800 text-slate-500"}`}
            >
              <ArrowDownLeft size={16} /> Tarik Dana
            </button>
          </div>
        </div>
        <Wallet className="absolute -bottom-10 -right-10 text-white/5 w-80 h-80 rotate-[-15deg]" />
      </div>
      {balance < minWithdrawal && (
        <p className="text-xs font-bold text-slate-400 uppercase italic flex items-center gap-2 px-6">
          <AlertCircle size={14} className="text-orange-500" /> Min WD{" "}
          {formatRupiah(minWithdrawal)}
        </p>
      )}
    </div>
  );
};
