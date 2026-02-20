import React, { useEffect, useState } from "react";
import { supabase } from "../../../../lib/supabaseClient";
import {
  Activity,
  Wallet,
  ShieldCheck,
  RefreshCw,
  Loader2,
  CheckCircle2,
} from "lucide-react";

export const FinanceDashboard = ({ theme }: { theme: any }) => {
  const [stats, setStats] = useState({
    total_courier_balance: 0,
    total_revenue: 0,
    total_merchant_share: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Mengambil data ringkasan order
      const { data: orders } = await supabase.from("orders").select(`*`);
      let mShare = 0,
        aShare = 0;
      orders?.forEach((o) => {
        mShare += Number(o.merchant_earning_total || 0);
        aShare += Number(o.app_earning_total || 0);
      });

      // Mengambil total saldo kurir melalui RPC
      const { data: cBal } = await supabase.rpc("get_courier_balance_sum");

      setStats({
        total_courier_balance: cBal || 0,
        total_revenue: aShare,
        total_merchant_share: mShare,
      });
    } catch (err) {
      console.error("Dashboard Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4">
        <Loader2 className="animate-spin text-[#008080]" size={40} />
        <p className="text-[12px] font-black uppercase tracking-widest text-slate-400">
          LOADING SUMMARY...
        </p>
      </div>
    );

  return (
    <div className="space-y-4 animate-in fade-in duration-500 font-black uppercase tracking-tighter text-left">
      {/* HEADER SECTION (BERSIH TANPA BLOK MERAH) */}
      <div className="flex justify-between items-center bg-white p-5 rounded-[1.5rem] border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-teal-50 rounded-2xl flex items-center justify-center text-[#008080]">
            <Activity size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 leading-none">
              FINANCE DASHBOARD
            </h2>
            <p className="text-[10px] text-slate-400 mt-1 tracking-[0.2em]">
              STATUS ENGINE KEUANGAN PORTABEL
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-2 bg-green-50 text-green-600 px-4 py-2 rounded-xl text-[10px] font-black mr-2">
            <CheckCircle2 size={14} /> SYSTEM ACTIVE
          </div>
          <button
            onClick={fetchData}
            className="p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-all active:scale-90"
          >
            <RefreshCw size={18} className="text-slate-600" />
          </button>
        </div>
      </div>

      {/* STAT CARDS (UKURAN TEKS 12 & NO ITALIC) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card Saldo Kurir */}
        <div className="bg-[#0f172a] p-8 rounded-[2rem] text-white relative overflow-hidden shadow-xl border-b-4 border-[#008080]">
          <p className="text-[10px] tracking-widest opacity-60 mb-2">
            SALDO KURIR (LIABILITY)
          </p>
          <h3 className="text-3xl font-black text-[#008080]">
            RP {stats.total_courier_balance.toLocaleString("id-ID")}
          </h3>
          <Wallet
            className="absolute right-[-10px] bottom-[-10px] opacity-10"
            size={110}
          />
        </div>

        {/* Card Profit PasarQu */}
        <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden border-b-4 border-slate-900">
          <p className="text-[10px] tracking-widest text-slate-400 mb-2">
            PROFIT PASARQU
          </p>
          <h3 className="text-3xl font-black text-slate-900">
            RP {stats.total_revenue.toLocaleString("id-ID")}
          </h3>
          <ShieldCheck
            className="absolute right-[-10px] bottom-[-10px] text-slate-50 opacity-50"
            size={110}
          />
        </div>

        {/* Card Hak Toko & Extra */}
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 flex flex-col justify-center space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-slate-400">HAK TOKO (GROSS)</span>
            <span className="text-[12px] text-blue-600 font-black">
              RP {stats.total_merchant_share.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between items-center border-t border-slate-50 pt-3">
            <span className="text-[10px] text-slate-400">ENGINE STATUS</span>
            <span className="text-[10px] text-green-600 font-black flex items-center gap-1">
              <CheckCircle2 size={12} /> CORE ACTIVE
            </span>
          </div>
        </div>
      </div>

      {/* FOOTER INFO */}
      <div className="bg-slate-100/50 p-4 rounded-2xl border border-dashed border-slate-200 text-center">
        <p className="text-[10px] text-slate-400 font-bold tracking-widest">
          DATA DI ATAS ADALAH RINGKASAN REAL-TIME SISTEM. UNTUK RINCIAN
          TRANSAKSI, SILAKAN BUKA MENU{" "}
          <span className="text-slate-900">BUKU BESAR</span>.
        </p>
      </div>
    </div>
  );
};
