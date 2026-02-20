import React, { useEffect, useState } from "react";
import { supabase } from "../../../../lib/supabaseClient";
import {
  TrendingUp,
  Wallet,
  Download,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Receipt,
  ArrowRight,
  Smartphone,
} from "lucide-react";

interface FinanceProps {
  theme: any;
  viewType?: "summary" | "detail";
}

export const FinanceManager: React.FC<FinanceProps> = ({
  theme,
  viewType = "summary",
}) => {
  const [stats, setStats] = useState({
    total_courier_balance: 0,
    total_revenue: 0,
    total_merchant_share: 0,
    total_courier_share: 0,
    total_extra_kurir: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: orders } = await supabase
        .from("orders")
        .select(`*, profiles:customer_id(name)`)
        .order("created_at", { ascending: false });

      let mShare = 0,
        cShare = 0,
        aShare = 0,
        eShare = 0;
      orders?.forEach((o) => {
        mShare += Number(o.merchant_earning_total || 0);
        cShare += Number(o.courier_earning_pure || 0);
        eShare += Number(o.courier_earning_extra || 0);
        aShare += Number(o.app_earning_total || 0);
      });

      const { data: courierStats } = await supabase.rpc(
        "get_courier_balance_sum",
      );

      setRecentOrders(orders || []);
      setStats({
        total_courier_balance: courierStats || 0,
        total_revenue: aShare,
        total_merchant_share: mShare,
        total_courier_share: cShare + eShare,
        total_extra_kurir: eShare,
      });
    } catch (err) {
      console.error("Error fetching finance data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center py-20 md:py-40 gap-4">
        <Loader2 className="animate-spin text-teal-600" size={40} />
        <p className="text-[12px] font-black uppercase tracking-tighter text-slate-400 italic">
          Sinkronisasi Mobile...
        </p>
      </div>
    );

  return (
    <div className="space-y-4 animate-in fade-in duration-500 text-left pb-24 md:pb-20 font-black uppercase tracking-tighter px-2 md:px-0">
      {/* HEADER SECTION - RESPONSIVE STACK */}
      <div className="flex flex-row justify-between items-end gap-2">
        <div>
          <h2 className="text-[20px] md:text-[24px] leading-none font-black text-slate-900 tracking-tighter flex items-center gap-2">
            {viewType === "summary" ? "FINANCE DASHBOARD" : "GENERAL LEDGER"}
            <Smartphone size={16} className="md:hidden text-slate-400" />
          </h2>
          <p className="text-[10px] md:text-[12px] text-teal-600 mt-1 italic leading-none">
            {viewType === "summary"
              ? "MONITORING OMSET PORTABEL"
              : "AUDIT BUKU BESAR"}
          </p>
        </div>
        <button
          onClick={fetchData}
          className="p-2 bg-white rounded-xl border border-slate-200 shadow-sm active:scale-90 transition-all"
        >
          <RefreshCw size={16} className="text-slate-600" />
        </button>
      </div>

      {/* STATS CARDS - AUTO GRID (1 kolom di HP, 3 di Desktop) */}
      {viewType === "summary" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Card Saldo Kurir */}
          <div className="bg-[#0f172a] p-5 md:p-6 rounded-[1.5rem] md:rounded-[2rem] text-white relative overflow-hidden shadow-lg border-b-4 border-teal-500">
            <p className="text-[10px] md:text-[12px] opacity-60 mb-1">
              TOTAL SALDO KURIR
            </p>
            <h3 className="text-[24px] md:text-[28px] font-black italic tracking-tighter text-teal-400">
              RP {stats.total_courier_balance.toLocaleString("id-ID")}
            </h3>
            <Wallet
              className="absolute right-[-10px] bottom-[-10px] opacity-10"
              size={80}
            />
          </div>

          {/* Card Profit */}
          <div className="bg-white p-5 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden border-b-4 border-slate-900">
            <p className="text-[10px] md:text-[12px] text-slate-400 mb-1">
              PROFIT PASARQU
            </p>
            <h3 className="text-[24px] md:text-[28px] font-black italic tracking-tighter text-slate-900">
              RP {stats.total_revenue.toLocaleString("id-ID")}
            </h3>
            <ShieldCheck
              className="absolute right-[-10px] bottom-[-10px] text-slate-50 opacity-50"
              size={80}
            />
          </div>

          {/* Card Merchant & Extra */}
          <div className="bg-slate-50 p-5 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border border-slate-200 flex flex-col justify-center space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[10px] md:text-[12px] text-slate-500">
                HAK MERCHANT
              </span>
              <span className="text-[11px] md:text-[12px] text-blue-600 font-black font-sans">
                RP {stats.total_merchant_share.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center border-t border-slate-200 pt-2">
              <span className="text-[10px] md:text-[12px] text-slate-500">
                EXTRA KURIR
              </span>
              <span className="text-[11px] md:text-[12px] text-[#FF6600] font-black font-sans">
                RP {stats.total_extra_kurir.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TRANSACTION LIST/TABLE - SCROLLABLE FOR MOBILE */}
      <div className="bg-white rounded-[1.5rem] md:rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 md:p-5 border-b border-slate-100 flex justify-between items-center bg-white">
          <div className="flex items-center gap-2">
            <Receipt size={16} className="text-teal-600" />
            <h3 className="text-[11px] md:text-[12px] font-black italic uppercase tracking-tighter">
              {viewType === "summary"
                ? "TRANSAKSI TERKINI"
                : "LIST SELURUH TRANSAKSI"}
            </h3>
          </div>
          <button className="bg-slate-900 text-white px-3 py-1.5 md:px-4 md:py-2 rounded-xl text-[9px] md:text-[10px] flex items-center gap-2 hover:bg-teal-600 transition-all font-black tracking-widest">
            <Download size={12} />{" "}
            <span className="hidden md:inline">EXPORT DATA</span>
          </button>
        </div>

        {/* MOBILE VIEW LIST (Hanya muncul di Layar Kecil) */}
        <div className="block md:hidden divide-y divide-slate-50">
          {(viewType === "summary"
            ? recentOrders.slice(0, 8)
            : recentOrders
          ).map((o) => (
            <div
              key={o.id}
              className="p-4 active:bg-slate-50 flex justify-between items-center"
            >
              <div className="flex flex-col gap-1">
                <span className="text-[9px] text-slate-400 font-sans tracking-tight">
                  #{o.id.slice(0, 8)}
                </span>
                <span className="text-[12px] text-slate-900 font-black truncate max-w-[150px]">
                  {o.profiles?.name || "GUEST"}
                </span>
                <span className="text-[10px] text-teal-600 font-black">
                  PQ: {o.app_earning_total.toLocaleString()}
                </span>
              </div>
              <div className="text-right">
                <p className="text-[12px] font-black text-slate-900 tracking-tighter">
                  RP {o.total_price.toLocaleString()}
                </p>
                <span className="text-[9px] bg-slate-100 px-2 py-0.5 rounded-md text-slate-500 font-black">
                  DETAILED
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* DESKTOP VIEW TABLE (Hanya muncul di Layar Besar) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="bg-slate-50 text-slate-500 border-b border-slate-100 font-black">
                <th className="p-4 text-left">ORDER/CUSTOMER</th>
                <th className="p-4 text-right text-blue-600 italic">
                  MERCHANT
                </th>
                <th className="p-4 text-right text-[#FF6600] italic">KURIR</th>
                <th className="p-4 text-right text-teal-600 italic">PASARQU</th>
                <th className="p-4 text-right">TOTAL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {(viewType === "summary"
                ? recentOrders.slice(0, 10)
                : recentOrders
              ).map((o) => (
                <tr
                  key={o.id}
                  className="hover:bg-teal-50/30 transition-all group italic"
                >
                  <td className="p-4">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-400 font-sans tracking-normal font-bold">
                        #{o.id.slice(0, 8)}
                      </span>
                      <span className="text-[12px] text-slate-900 font-black group-hover:text-teal-700 transition-colors tracking-tighter">
                        {o.profiles?.name || "GUEST USER"}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 text-right font-sans font-bold text-slate-700">
                    {(o.merchant_earning_total || 0).toLocaleString()}
                  </td>
                  <td className="p-4 text-right font-sans font-bold text-slate-700">
                    {(o.courier_earning_pure || 0).toLocaleString()}
                  </td>
                  <td className="p-4 text-right font-sans font-black text-teal-600">
                    {(o.app_earning_total || 0).toLocaleString()}
                  </td>
                  <td className="p-4 text-right font-sans font-black text-slate-900 bg-slate-50/50 group-hover:bg-teal-100">
                    {(o.total_price || 0).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {viewType === "summary" && (
          <div className="p-4 bg-slate-50 text-center border-t border-slate-100">
            <button className="text-[11px] md:text-[12px] font-black text-slate-400 hover:text-teal-600 transition-all flex items-center justify-center gap-2 mx-auto uppercase tracking-tighter">
              BUKA FULL LEDGER <ArrowRight size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
