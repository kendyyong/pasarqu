import React, { useEffect, useState } from "react";
import { supabase } from "../../../../lib/supabaseClient";
import {
  BookOpen,
  TrendingUp,
  Wallet,
  ArrowDownRight,
  ArrowUpRight,
  Download,
  PieChart,
  Loader2,
  RefreshCw,
} from "lucide-react";

export const FinancialLedger = () => {
  const [stats, setStats] = useState({
    total_courier_balance: 0,
    total_revenue: 0,
    total_withdrawals: 0,
    pending_topups: 0,
    pending_withdrawals: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchLedgerData = async () => {
    setLoading(true);
    try {
      // 1. Hitung Uang Mengendap (Liability) via RPC
      const { data: courierStats } = await supabase.rpc(
        "get_courier_balance_sum",
      );

      // 2. Hitung Profit (Revenue dari logs tipe ORDER_PAYMENT)
      const { data: revenueData } = await supabase
        .from("wallet_logs")
        .select("amount")
        .eq("type", "ORDER_PAYMENT");

      // 3. Hitung Total Withdrawal yang sudah sukses (Cash Out)
      const { data: withdrawData } = await supabase
        .from("wallet_logs")
        .select("amount")
        .eq("type", "WITHDRAW");

      // 4. Hitung Antrean Real-time
      const { count: topupCount } = await supabase
        .from("topup_requests")
        .select("*", { count: "exact", head: true })
        .eq("status", "PENDING");

      const { count: withdrawCount } = await supabase
        .from("withdrawals")
        .select("*", { count: "exact", head: true })
        .eq("status", "PENDING");

      const totalRevenue =
        revenueData?.reduce((acc, curr) => acc + Number(curr.amount), 0) || 0;
      const totalWithdraw =
        withdrawData?.reduce((acc, curr) => acc + Number(curr.amount), 0) || 0;

      setStats({
        total_courier_balance: courierStats || 0,
        total_revenue: totalRevenue,
        total_withdrawals: totalWithdraw,
        pending_topups: topupCount || 0,
        pending_withdrawals: withdrawCount || 0,
      });
    } catch (err) {
      console.error("Ledger Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedgerData();
  }, []);

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="animate-spin text-teal-600" size={40} />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
          Menyusun Buku Besar...
        </p>
      </div>
    );

  return (
    <div className="space-y-8 animate-in fade-in duration-700 text-left pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">
            Financial <span className="text-teal-600">General Ledger</span>
          </h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
            Laporan Buku Besar & Arus Kas Real-time
          </p>
        </div>
        <button
          onClick={fetchLedgerData}
          className="p-3 bg-white rounded-2xl border border-slate-100 hover:bg-slate-50 transition-all shadow-sm"
        >
          <RefreshCw size={18} className="text-slate-400" />
        </button>
      </div>

      {/* RINGKASAN BUKU BESAR */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* KOTAK 1: TOTAL SALDO MENGENDAP */}
        <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-[10px] font-black text-teal-400 uppercase tracking-[0.2em] mb-4">
              Total Saldo Kurir
            </p>
            <h3 className="text-3xl font-black italic">
              Rp {stats.total_courier_balance.toLocaleString("id-ID")}
            </h3>
            <p className="text-[9px] text-slate-400 mt-4 font-bold uppercase">
              Uang Titipan (Kewajiban Perusahaan)
            </p>
          </div>
          <Wallet
            className="absolute -right-4 -bottom-4 text-white/5 group-hover:scale-110 transition-transform"
            size={140}
          />
        </div>

        {/* KOTAK 2: TOTAL PROFIT APLIKASI */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">
              Profit Biaya Aplikasi
            </p>
            <h3 className="text-3xl font-black text-teal-600 italic">
              Rp {stats.total_revenue.toLocaleString("id-ID")}
            </h3>
            <p className="text-[9px] text-slate-400 mt-4 font-bold uppercase">
              Pendapatan Bersih (Hak Perusahaan)
            </p>
          </div>
          <TrendingUp
            className="absolute -right-4 -bottom-4 text-teal-50 group-hover:scale-110 transition-transform"
            size={140}
          />
        </div>

        {/* KOTAK 3: AKTIVITAS HARI INI */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">
            Quick Audit
          </p>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-slate-500 uppercase">
                Top Up Menunggu
              </span>
              <span className="bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-[10px] font-black">
                {stats.pending_topups} REQ
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-slate-500 uppercase">
                Tarik Saldo Pending
              </span>
              <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-[10px] font-black">
                {stats.pending_withdrawals} REQ
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* VISUALISASI ALUR KEUANGAN */}

      <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center">
              <PieChart size={20} />
            </div>
            <h3 className="font-black text-slate-800 uppercase tracking-tighter">
              Analisis Arus Kas
            </h3>
          </div>
          <button className="flex items-center gap-2 bg-slate-100 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all">
            <Download size={14} /> Export CSV
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-6">
            <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">
              Pemasukan (Cash In)
            </h4>
            <div className="p-6 bg-teal-50/50 rounded-3xl border border-teal-100 border-dashed">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[9px] font-black text-teal-600 uppercase mb-1">
                    Akumulasi Dana Masuk (Topup)
                  </p>
                  <h5 className="text-xl font-black text-slate-800">
                    Rp{" "}
                    {(
                      stats.total_courier_balance + stats.total_withdrawals
                    ).toLocaleString("id-ID")}
                  </h5>
                </div>
                <ArrowUpRight className="text-teal-500" />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">
              Pengeluaran (Cash Out)
            </h4>
            <div className="p-6 bg-red-50/50 rounded-3xl border border-red-100 border-dashed">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[9px] font-black text-red-600 uppercase mb-1">
                    Pencairan Wallet Sukses
                  </p>
                  <h5 className="text-xl font-black text-slate-800">
                    Rp {stats.total_withdrawals.toLocaleString("id-ID")}
                  </h5>
                </div>
                <ArrowDownRight className="text-red-500" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
