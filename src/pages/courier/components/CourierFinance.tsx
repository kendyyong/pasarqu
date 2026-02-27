import React from "react";
import {
  Wallet,
  Plus,
  ArrowDownLeft,
  AlertCircle,
  TrendingUp,
  PackageCheck,
  Receipt,
} from "lucide-react";
import { formatRupiah } from "../../../utils/format";

interface Props {
  balance: number;
  minWithdrawal: number;
  transactions?: any[]; // 🚀 TAMBAHAN: Untuk menghitung riwayat hari ini
  onTopUp: () => void;
  onWithdraw: () => void;
}

export const CourierFinance: React.FC<Props> = ({
  balance,
  minWithdrawal,
  transactions = [], // Default kosong jika belum di-load
  onTopUp,
  onWithdraw,
}) => {
  // 🚀 ENGINE PENGHITUNG PENDAPATAN HARI INI
  const today = new Date().toLocaleDateString("id-ID");

  const todaysTransactions = transactions.filter((t: any) => {
    const tDate = new Date(t.created_at).toLocaleDateString("id-ID");
    // Hitung hanya transaksi masuk (income/deposit) hari ini
    return tDate === today && (t.type === "income" || t.type === "deposit");
  });

  const todaysEarnings = todaysTransactions.reduce(
    (sum, t) => sum + (t.amount || 0),
    0,
  );
  const todaysJobs = todaysTransactions.length;

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-500 text-left font-black uppercase tracking-tighter not-italic pb-24">
      {/* 🚀 KARTU SALDO UTAMA - Desain Bersih & Elegan */}
      <div className="bg-slate-900 rounded-2xl p-6 text-white relative overflow-hidden shadow-2xl border-b-4 border-[#008080]">
        {/* Latar Belakang Geometris Halus */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white rounded-full blur-3xl"></div>
          <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-[#008080] rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center backdrop-blur-sm border border-white/20">
              <Wallet size={16} className="text-[#008080]" />
            </div>
            <p className="text-[10px] text-slate-400 tracking-widest leading-none">
              SALDO DOMPET KURIR
            </p>
          </div>

          <h2 className="text-[36px] md:text-[44px] font-sans font-[1000] tracking-tighter mb-8 leading-none mt-4">
            {formatRupiah(balance)}
          </h2>

          <div className="flex gap-3">
            <button
              onClick={onTopUp}
              className="flex-1 py-4 bg-[#FF6600] hover:bg-orange-600 text-white rounded-xl font-[1000] text-[11px] tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-orange-900/50 active:scale-95 transition-all"
            >
              <Plus size={16} strokeWidth={3} /> ISI SALDO
            </button>
            <button
              onClick={onWithdraw}
              disabled={balance < minWithdrawal}
              className={`flex-1 py-4 rounded-xl font-[1000] text-[11px] tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 ${
                balance >= minWithdrawal
                  ? "bg-white text-slate-900 shadow-lg hover:bg-slate-100"
                  : "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
              }`}
            >
              <ArrowDownLeft size={16} strokeWidth={3} /> TARIK DANA
            </button>
          </div>
        </div>
      </div>

      {/* Peringatan Minimal Penarikan */}
      {balance < minWithdrawal && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-center gap-3 shadow-sm">
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

      {/* 🚀 KARTU SPEEDOMETER PENDAPATAN HARI INI */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <h3 className="text-[10px] text-slate-400 tracking-widest flex items-center gap-1 mb-1">
            <TrendingUp size={12} className="text-[#008080]" /> PERFORMA HARI
            INI
          </h3>
          <p className="text-[20px] font-sans font-[1000] text-[#008080] leading-none">
            {formatRupiah(todaysEarnings)}
          </p>
        </div>
        <div className="bg-teal-50 border border-teal-100 px-4 py-2 rounded-xl flex flex-col items-center justify-center">
          <PackageCheck size={18} className="text-[#FF6600] mb-1" />
          <span className="text-[14px] font-[1000] text-teal-800 leading-none">
            {todaysJobs}
          </span>
          <span className="text-[8px] font-bold text-teal-600 tracking-widest mt-0.5">
            TARIKAN
          </span>
        </div>
      </div>

      {/* 🚀 LIST RIWAYAT TRANSAKSI TERAKHIR */}
      <div className="space-y-4 pt-2">
        <h3 className="text-[13px] font-black text-slate-800 tracking-widest flex items-center gap-2 border-b border-slate-200 pb-3">
          <Receipt size={18} className="text-[#008080]" /> RIWAYAT SALDO
        </h3>

        {transactions.length === 0 ? (
          <div className="text-center py-10 bg-white border border-slate-200 rounded-2xl border-dashed">
            <p className="text-[11px] font-black text-slate-400 tracking-widest">
              BELUM ADA TRANSAKSI
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((t: any) => {
              const isIncome = t.type === "income" || t.type === "deposit";
              return (
                <div
                  key={t.id}
                  className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex justify-between items-center hover:border-teal-200 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center font-black text-[16px] shrink-0 ${isIncome ? "bg-teal-50 text-[#008080]" : "bg-red-50 text-red-500"}`}
                    >
                      {isIncome ? "+" : "-"}
                    </div>
                    <div>
                      <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-tight">
                        {t.description || "Transaksi"}
                      </h4>
                      <p className="text-[9px] text-slate-400 font-bold tracking-widest mt-0.5">
                        {new Date(t.created_at).toLocaleString("id-ID", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </p>
                    </div>
                  </div>
                  <div
                    className={`text-[13px] font-[1000] font-sans tracking-tighter ${isIncome ? "text-[#008080]" : "text-red-500"}`}
                  >
                    {isIncome ? "" : "-"} {formatRupiah(t.amount || 0)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
