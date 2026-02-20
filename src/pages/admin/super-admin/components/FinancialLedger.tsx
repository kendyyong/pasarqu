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
  Store,
  Bike,
  ShieldCheck,
  Receipt,
} from "lucide-react";

export const FinancialLedger = () => {
  const [stats, setStats] = useState({
    total_courier_balance: 0,
    total_revenue: 0, // Ini hak PasarQu
    total_merchant_share: 0, // Hak Toko
    total_courier_share: 0, // Hak Kurir
    total_pending_extra: 0, // Total Extra Toko
    pending_topups: 0,
    pending_withdrawals: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLedgerData = async () => {
    setLoading(true);
    try {
      // 1. Ambil data pesanan dengan kolom finansial mendetail
      const { data: orderData } = await supabase
        .from("orders")
        .select(
          `
          id, 
          created_at, 
          total_price, 
          merchant_earning_total, 
          courier_earning_pure,
          courier_earning_extra,
          courier_earning_total, 
          app_earning_total,
          profiles:customer_id(name)
        `,
        )
        .order("created_at", { ascending: false });

      // 2. Hitung Akumulasi Bagi Hasil
      let mShare = 0;
      let cShare = 0;
      let aShare = 0;
      let eShare = 0;

      orderData?.forEach((o) => {
        mShare += Number(o.merchant_earning_total || 0);
        cShare += Number(o.courier_earning_total || 0);
        aShare += Number(o.app_earning_total || 0);
        eShare += Number(o.courier_earning_extra || 0);
      });

      // 3. RPC - Saldo Kurir
      const { data: courierStats } = await supabase.rpc(
        "get_courier_balance_sum",
      );

      // 4. Antrean Reatime
      const { count: topupCount } = await supabase
        .from("topup_requests")
        .select("*", { count: "exact", head: true })
        .eq("status", "PENDING");

      const { count: withdrawCount } = await supabase
        .from("withdrawals")
        .select("*", { count: "exact", head: true })
        .eq("status", "PENDING");

      setRecentOrders(orderData || []);
      setStats({
        total_courier_balance: courierStats || 0,
        total_revenue: aShare,
        total_merchant_share: mShare,
        total_courier_share: cShare,
        total_pending_extra: eShare,
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
      <div className="flex flex-col items-center justify-center py-40 gap-4">
        <Loader2 className="animate-spin text-teal-600" size={40} />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
          Menyusun Buku Besar...
        </p>
      </div>
    );

  return (
    <div className="space-y-6 animate-in fade-in duration-700 text-left pb-20 font-black uppercase tracking-tighter">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tighter">
            FINANCIAL <span className="text-teal-600">GENERAL LEDGER</span>
          </h2>
          <p className="text-[10px] text-slate-400 font-bold tracking-widest mt-1">
            Audit Bagi Hasil & Arus Kas Real-time
          </p>
        </div>
        <button
          onClick={fetchLedgerData}
          className="p-3 bg-white rounded-2xl border border-slate-100 hover:rotate-180 transition-all duration-500 shadow-sm"
        >
          <RefreshCw size={18} className="text-slate-400" />
        </button>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatBox
          label="Hak Toko"
          amount={stats.total_merchant_share}
          icon={<Store />}
          color="text-blue-600"
        />
        <StatBox
          label="Hak Kurir"
          amount={stats.total_courier_share}
          icon={<Bike />}
          color="text-[#FF6600]"
        />
        <StatBox
          label="Hak PasarQu"
          amount={stats.total_revenue}
          icon={<ShieldCheck />}
          color="text-teal-600"
        />
        <StatBox
          label="Liability (Saldo)"
          amount={stats.total_courier_balance}
          icon={<Wallet />}
          color="text-white"
          isDark
        />
      </div>

      {/* TABLE AUDIT */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-white">
          <h3 className="text-[12px] font-black italic">
            Rincian Alokasi Dana per Pesanan
          </h3>
          <div className="flex gap-2">
            <span className="text-[9px] bg-orange-50 text-[#FF6600] px-3 py-1 rounded-lg border border-orange-100">
              Total Extra: Rp {stats.total_pending_extra.toLocaleString()}
            </span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="bg-slate-50 text-slate-400 text-[10px] tracking-widest border-b border-slate-100">
                <th className="p-4 text-left font-black">TRANSAKSI</th>
                <th className="p-4 text-right text-blue-600">TOKO</th>
                <th className="p-4 text-right text-[#FF6600]">JASA KURIR</th>
                <th className="p-4 text-right text-orange-800">EXTRA</th>
                <th className="p-4 text-right text-teal-600">PASARQU</th>
                <th className="p-4 text-right">TOTAL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {recentOrders.map((order) => (
                <tr
                  key={order.id}
                  className="hover:bg-slate-50 transition-all font-black"
                >
                  <td className="p-4">
                    <p className="text-[10px] font-sans text-slate-400 leading-none mb-1">
                      #{order.id.slice(0, 8)}
                    </p>
                    <p className="text-[10px] text-slate-900">
                      {order.profiles?.name || "CUSTOMER"}
                    </p>
                  </td>
                  <td className="p-4 text-right font-sans text-blue-600">
                    {(order.merchant_earning_total || 0).toLocaleString()}
                  </td>
                  <td className="p-4 text-right font-sans text-[#FF6600]">
                    {(order.courier_earning_pure || 0).toLocaleString()}
                  </td>
                  <td className="p-4 text-right font-sans text-orange-800 bg-orange-50/20">
                    {(order.courier_earning_extra || 0).toLocaleString()}
                  </td>
                  <td className="p-4 text-right font-sans text-teal-600">
                    {(order.app_earning_total || 0).toLocaleString()}
                  </td>
                  <td className="p-4 text-right font-sans">
                    {(order.total_price || 0).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* QUEUE AUDIT */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-4 text-red-500">
            <Receipt size={18} />
            <h3 className="text-[11px] font-black">
              Antrean Finance (Pending)
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <span className="text-[9px] text-slate-400 block mb-1">
                Top Up Kurir
              </span>
              <span className="text-lg font-black text-orange-600">
                {stats.pending_topups} REQ
              </span>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <span className="text-[9px] text-slate-400 block mb-1">
                Withdrawal
              </span>
              <span className="text-lg font-black text-red-600">
                {stats.pending_withdrawals} REQ
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatBox = ({ label, amount, icon, color, isDark }: any) => (
  <div
    className={`${isDark ? "bg-slate-900 text-white border-b-4 border-teal-500" : "bg-white text-slate-800 border border-slate-100 shadow-sm"} p-6 rounded-[2.2rem] transition-all`}
  >
    <div
      className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 ${isDark ? "bg-white/10" : "bg-slate-50"}`}
    >
      {React.cloneElement(icon, {
        size: 18,
        className: isDark ? "text-white" : color,
      })}
    </div>
    <p className="text-[9px] tracking-widest text-slate-400 uppercase">
      {label}
    </p>
    <h3 className="text-lg font-black italic mt-1 font-sans">
      Rp {amount.toLocaleString("id-ID")}
    </h3>
  </div>
);
