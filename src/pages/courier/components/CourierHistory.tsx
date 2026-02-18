// src/pages/courier/components/CourierHistory.tsx
import React from "react";
import { History, Plus, ArrowUpRight } from "lucide-react";
import { formatRupiah, formatDate } from "../../../utils/format";

interface Props {
  transactions: any[];
}

export const CourierHistory: React.FC<Props> = ({ transactions }) => {
  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4">
      <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">
        Riwayat
      </h1>
      <div className="bg-white rounded-[3rem] border border-slate-100 overflow-hidden shadow-sm">
        {transactions.length > 0 ? (
          transactions.map((log) => (
            <div
              key={log.id}
              className="p-6 flex justify-between items-center hover:bg-slate-50 border-b border-slate-50 last:border-0"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center ${log.type === "TOPUP" ? "bg-teal-50 text-teal-600" : "bg-orange-50 text-orange-600"}`}
                >
                  {log.type === "TOPUP" ? (
                    <Plus size={20} />
                  ) : (
                    <ArrowUpRight size={20} />
                  )}
                </div>
                <div>
                  <p className="text-xs font-black text-slate-800 uppercase">
                    {log.description}
                  </p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">
                    {formatDate(log.created_at)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p
                  className={`font-black text-sm ${log.type === "TOPUP" ? "text-teal-600" : "text-orange-600"}`}
                >
                  {log.type === "TOPUP" ? "+" : "-"} {formatRupiah(log.amount)}
                </p>
                <p className="text-[8px] font-bold text-slate-300 uppercase mt-1">
                  Sisa: {formatRupiah(log.balance_after)}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="py-24 text-center">
            <History className="mx-auto text-slate-200 mb-4" size={40} />
            <p className="text-xs font-bold text-slate-300 uppercase">
              Belum ada data
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
