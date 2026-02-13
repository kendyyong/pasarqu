import React, { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabaseClient";
import {
  Wallet,
  ArrowUpRight,
  History,
  Loader2,
  CheckCircle2,
  Clock,
  TrendingUp,
  Download,
} from "lucide-react";
import { useToast } from "../../../contexts/ToastContext";

interface Props {
  merchantProfile: any;
}

export const MerchantWallet: React.FC<Props> = ({ merchantProfile }) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState({ available: 0, pending: 0 });
  const [transactions, setTransactions] = useState<any[]>([]);

  const fetchWalletData = async () => {
    if (!merchantProfile?.id) return;
    setLoading(true);
    try {
      // 1. HITUNG SALDO SECARA REAL-TIME DARI TABEL ORDERS
      const { data: orders, error: oError } = await supabase
        .from("orders")
        .select("total_amount, status")
        .eq("merchant_id", merchantProfile.id);

      if (oError) throw oError;

      // Logika Saldo: COMPLETED = Cair, Selain itu (kecuali CANCEL) = Tertahan
      const available = orders
        ?.filter((o) => o.status === "completed" || o.status === "COMPLETED")
        .reduce((sum, o) => sum + (o.total_amount || 0), 0);

      const pending = orders
        ?.filter(
          (o) =>
            !["completed", "COMPLETED", "cancelled", "CANCELLED"].includes(
              o.status,
            ),
        )
        .reduce((sum, o) => sum + (o.total_amount || 0), 0);

      setBalance({ available: available || 0, pending: pending || 0 });

      // 2. AMBIL 10 TRANSAKSI TERAKHIR
      const { data: history, error: hError } = await supabase
        .from("orders")
        .select("*")
        .eq("merchant_id", merchantProfile.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (hError) throw hError;
      setTransactions(history || []);
    } catch (err: any) {
      showToast("Gagal memuat saldo: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletData();
  }, [merchantProfile]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 text-left">
      {/* 1. KARTU SALDO UTAMA */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Saldo Bisa Ditarik */}
        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-slate-900/20 group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/20 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-teal-500/40 transition-colors"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                <Wallet className="text-teal-400" size={20} />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                Saldo Tersedia
              </p>
            </div>
            <h2 className="text-4xl font-black tracking-tighter mb-8">
              Rp {balance.available.toLocaleString()}
            </h2>
            <button
              onClick={() =>
                showToast("Fitur penarikan sedang disiapkan Admin", "info")
              }
              className="w-full py-4 bg-teal-500 hover:bg-teal-400 text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20"
            >
              <ArrowUpRight size={16} /> Tarik Dana Sekarang
            </button>
          </div>
        </div>

        {/* Dana Tertahan */}
        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
                <Clock className="text-orange-500" size={20} />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                Dalam Proses
              </p>
            </div>
            <h3 className="text-3xl font-black text-slate-800 tracking-tighter">
              Rp {balance.pending.toLocaleString()}
            </h3>
            <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase tracking-tight leading-relaxed">
              Otomatis cair setelah kurir menyelesaikan pengantaran barang ke
              pelanggan.
            </p>
          </div>
          <div className="mt-6 p-4 bg-slate-50 rounded-2xl flex items-center gap-3">
            <TrendingUp className="text-teal-600" size={18} />
            <span className="text-[10px] font-black text-teal-700 uppercase tracking-widest leading-none">
              Aktivitas Toko Stabil
            </span>
          </div>
        </div>
      </div>

      {/* 2. TABEL RIWAYAT PENDAPATAN */}
      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
              <History size={20} />
            </div>
            <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">
              Riwayat Penjualan
            </h4>
          </div>
          <button className="p-2 text-slate-400 hover:text-teal-600 transition-colors">
            <Download size={20} />
          </button>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-20 flex justify-center">
              <Loader2 className="animate-spin text-teal-600" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="py-20 text-center text-slate-400 font-bold uppercase text-[10px] tracking-widest">
              Belum ada transaksi masuk
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50/50 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  <th className="px-8 py-5 text-left">Tanggal</th>
                  <th className="px-8 py-5 text-left">Invoice</th>
                  <th className="px-8 py-5 text-left">Status</th>
                  <th className="px-8 py-5 text-right">Pendapatan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {transactions.map((t) => (
                  <tr
                    key={t.id}
                    className="group hover:bg-teal-50/20 transition-colors"
                  >
                    <td className="px-8 py-6 text-[11px] font-bold text-slate-500 whitespace-nowrap">
                      {new Date(t.created_at).toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-8 py-6 text-[11px] font-black text-slate-800 uppercase tracking-tighter">
                      INV-{t.id.substring(0, 8)}
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        {["completed", "COMPLETED"].includes(t.status) ? (
                          <CheckCircle2 size={14} className="text-teal-500" />
                        ) : (
                          <Clock size={14} className="text-orange-400" />
                        )}
                        <span
                          className={`text-[9px] font-black uppercase tracking-widest ${["completed", "COMPLETED"].includes(t.status) ? "text-teal-600" : "text-orange-500"}`}
                        >
                          {["completed", "COMPLETED"].includes(t.status)
                            ? "Tercairkan"
                            : "Diproses"}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right text-xs font-black text-slate-900 whitespace-nowrap">
                      + Rp {t.total_amount?.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
