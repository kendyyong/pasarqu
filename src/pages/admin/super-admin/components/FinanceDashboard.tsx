import React, { useEffect, useState } from "react";
import { supabase } from "../../../../lib/supabaseClient";
import {
  Activity,
  Wallet,
  ShieldCheck,
  RefreshCw,
  Loader2,
  CheckCircle2,
  TrendingUp,
  ArrowUpRight,
  Store,
} from "lucide-react";
import { useToast } from "../../../../contexts/ToastContext";

// 🚩 TAMBAHKAN INI: Agar TypeScript tidak error saat menerima properti 'theme'
interface FinanceDashboardProps {
  theme?: any;
}

export const FinanceDashboard: React.FC<FinanceDashboardProps> = ({
  theme,
}) => {
  const { showToast } = useToast();
  const [stats, setStats] = useState({
    total_courier_balance: 0,
    total_revenue: 0,
    total_merchant_share: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Mengambil data ringkasan order
      const { data: orders, error: orderError } = await supabase
        .from("orders")
        .select(`merchant_earning_total, app_earning_total`);

      if (orderError) throw orderError;

      let mShare = 0;
      let aShare = 0;
      orders?.forEach((o) => {
        mShare += Number(o.merchant_earning_total || 0);
        aShare += Number(o.app_earning_total || 0);
      });

      // 2. Mengambil total saldo kurir melalui RPC
      // Pastikan fungsi 'get_courier_balance_sum' sudah dibuat di SQL Editor Supabase
      const { data: cBal, error: rpcError } = await supabase.rpc(
        "get_courier_balance_sum",
      );

      setStats({
        total_courier_balance: cBal || 0,
        total_revenue: aShare,
        total_merchant_share: mShare,
      });
    } catch (err: any) {
      showToast("GAGAL MEMUAT DATA: " + err.message, "error");
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
          MENYINKRONKAN KAS NEGARA...
        </p>
      </div>
    );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-black uppercase tracking-tighter text-left">
      {/* HEADER SECTION */}
      <div className="flex justify-between items-center bg-white p-6 rounded-md border border-slate-200 shadow-sm border-b-4 border-[#008080]">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-slate-900 rounded-md flex items-center justify-center text-white shadow-lg">
            <Activity size={24} />
          </div>
          <div>
            <h2 className="text-[18px] font-black text-slate-900 leading-none">
              FINANCE DASHBOARD
            </h2>
            <p className="text-[10px] text-slate-400 mt-1 tracking-widest">
              MONITORING ARUS KAS REAL-TIME EKOSISTEM
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 bg-teal-50 text-[#008080] px-4 py-2 rounded-md text-[10px] font-black border border-teal-100">
            <ShieldCheck size={14} /> SYSTEM ENCRYPTED
          </div>
          <button
            onClick={fetchData}
            className="p-3 bg-slate-50 border border-slate-200 rounded-md hover:bg-slate-100 transition-all active:scale-90"
          >
            <RefreshCw size={18} className="text-slate-600" />
          </button>
        </div>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card Saldo Kurir (Liability) */}
        <div className="bg-[#0f172a] p-8 rounded-md text-white relative overflow-hidden shadow-xl border-b-4 border-[#FF6600]">
          <div className="relative z-10">
            <p className="text-[10px] tracking-widest opacity-60 mb-2 font-black flex items-center gap-2">
              <TrendingUp size={12} className="text-[#FF6600]" /> SALDO KURIR
              (LIABILITY)
            </p>
            <h3 className="text-3xl font-black text-white tracking-tighter">
              RP {stats.total_courier_balance.toLocaleString("id-ID")}
            </h3>
            <p className="text-[9px] mt-4 text-orange-400 font-black">
              DANA MENGENDAP YANG HARUS DIBAYARKAN
            </p>
          </div>
          <Wallet
            className="absolute right-[-20px] bottom-[-20px] opacity-10 text-white"
            size={140}
          />
        </div>

        {/* Card Profit PasarQu (Revenue) */}
        <div className="bg-white p-8 rounded-md border border-slate-200 shadow-sm relative overflow-hidden border-b-4 border-[#008080]">
          <div className="relative z-10">
            <p className="text-[10px] tracking-widest text-slate-400 mb-2 font-black flex items-center gap-2">
              <ArrowUpRight size={14} className="text-[#008080]" /> PROFIT
              PASARQU
            </p>
            <h3 className="text-3xl font-black text-slate-900 tracking-tighter">
              RP {stats.total_revenue.toLocaleString("id-ID")}
            </h3>
            <p className="text-[9px] mt-4 text-[#008080] font-black">
              BERSIH DARI BIAYA LAYANAN & BAGI HASIL
            </p>
          </div>
          <ShieldCheck
            className="absolute right-[-20px] bottom-[-20px] text-[#008080] opacity-5"
            size={140}
          />
        </div>

        {/* Card Hak Toko & Status */}
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-md border border-slate-200 shadow-sm flex flex-col justify-center">
            <p className="text-[10px] text-slate-400 font-black mb-1">
              TOTAL HAK TOKO (GROSS)
            </p>
            <div className="flex items-center gap-2">
              <Store size={16} className="text-blue-600" />
              <span className="text-[18px] text-slate-900 font-black">
                RP {stats.total_merchant_share.toLocaleString("id-ID")}
              </span>
            </div>
          </div>

          <div className="bg-slate-50 p-6 rounded-md border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-slate-400 font-black">
                CORE ENGINE STATUS
              </p>
              <p className="text-[12px] text-green-600 font-black flex items-center gap-1 mt-1">
                <CheckCircle2 size={14} /> ACTIVE & SYNCED
              </p>
            </div>
            <div className="w-10 h-10 bg-white rounded-md border border-slate-200 flex items-center justify-center">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER INFO */}
      <div className="bg-slate-900 p-6 rounded-md border-b-4 border-[#008080] shadow-2xl">
        <p className="text-[10px] text-white/60 font-black tracking-widest leading-relaxed">
          DATA DI ATAS ADALAH RINGKASAN REAL-TIME DARI SELURUH TRANSAKSI
          PASARQU. SEGALA BENTUK DISPREPANSI HARUS DISESUAIKAN MELALUI MENU{" "}
          <span className="text-white underline decoration-[#008080] cursor-pointer">
            AUDIT BUKU BESAR
          </span>
          .
        </p>
      </div>
    </div>
  );
};
