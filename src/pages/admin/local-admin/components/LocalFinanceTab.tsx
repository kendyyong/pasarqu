import React, { useState, useEffect } from "react";
import { supabase } from "../../../../lib/supabaseClient";
import { useAuth } from "../../../../contexts/AuthContext";
import {
  TrendingUp,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Download,
  Filter,
  Loader2,
  RefreshCw,
  ShoppingBag,
  Coins,
} from "lucide-react";

interface Props {
  merchants: any[];
  couriers: any[];
}

export const LocalFinanceTab: React.FC<Props> = ({ merchants, couriers }) => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [financeStats, setFinanceStats] = useState({
    totalOmzet: 0,
    totalServiceFee: 0,
    totalOrders: 0,
    courierEarnings: 0,
  });
  const [topSellers, setTopSellers] = useState<any[]>([]);

  const fetchFinanceData = async () => {
    if (!profile?.managed_market_id) return;
    setLoading(true);
    try {
      const marketId = profile.managed_market_id;

      // 1. Ambil Ringkasan Order di Wilayah Ini
      const { data: orders, error: orderErr } = await supabase
        .from("orders")
        .select("total_price, service_fee, courier_earning_total")
        .eq("market_id", marketId)
        .eq("status", "COMPLETED");

      if (orderErr) throw orderErr;

      // 2. Ambil Penjualan per Merchant untuk Ranking
      const { data: sellerStats, error: sellerErr } = await supabase
        .from("order_items")
        .select(
          `
          merchant_id,
          quantity,
          price_at_purchase,
          merchants!inner(shop_name, id)
        `,
        )
        .eq("merchants.market_id", marketId);

      if (sellerErr) throw sellerErr;

      // Kalkulasi Ringkasan
      const summary = orders.reduce(
        (acc, curr) => ({
          omzet: acc.omzet + Number(curr.total_price),
          fees: acc.fees + Number(curr.service_fee),
          courier: acc.courier + Number(curr.courier_earning_total),
          count: acc.count + 1,
        }),
        { omzet: 0, fees: 0, courier: 0, count: 0 },
      );

      setFinanceStats({
        totalOmzet: summary.omzet,
        totalServiceFee: summary.fees,
        totalOrders: summary.count,
        courierEarnings: summary.courier,
      });

      // Proses Ranking Merchant (Grup berdasarkan ID)
      const groupedSellers: any = {};
      sellerStats.forEach((item: any) => {
        const id = item.merchant_id;
        if (!groupedSellers[id]) {
          groupedSellers[id] = {
            name: item.merchants.shop_name,
            total: 0,
            count: 0,
          };
        }
        groupedSellers[id].total += item.quantity * item.price_at_purchase;
        groupedSellers[id].count += 1;
      });

      const sortedSellers = Object.values(groupedSellers)
        .sort((a: any, b: any) => b.total - a.total)
        .slice(0, 5);

      setTopSellers(sortedSellers);
    } catch (err) {
      console.error("Local Finance Load Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinanceData();
  }, [profile]);

  if (loading)
    return (
      <div className="py-20 flex flex-col items-center gap-4">
        <Loader2 className="animate-spin text-teal-500" size={40} />
        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
          Menyusun Laporan Wilayah...
        </p>
      </div>
    );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 text-left">
      {/* 1. HEADER ANALITIK */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter italic">
            Market Financial Control
          </h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
            Data Transaksi Real-time: {profile?.managed_market_id?.slice(0, 8)}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchFinanceData}
            className="p-2.5 bg-white border border-slate-200 rounded-xl hover:rotate-180 transition-all duration-500"
          >
            <RefreshCw size={16} className="text-slate-400" />
          </button>
          <button className="px-4 py-2.5 bg-teal-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-teal-600/20 hover:bg-teal-700 transition-all active:scale-95">
            <Download size={14} /> Export Report
          </button>
        </div>
      </div>

      {/* 2. STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <FinanceCard
          label="Omzet Pasar"
          value={`Rp ${financeStats.totalOmzet.toLocaleString()}`}
          icon={<TrendingUp className="text-blue-500" />}
          sub="Total Transaksi Produk"
          color="teal"
        />
        <FinanceCard
          label="Biaya Layanan (Platform)"
          value={`Rp ${financeStats.totalServiceFee.toLocaleString()}`}
          icon={<Coins className="text-teal-500" />}
          sub="Revenue Bersih Aplikasi"
          color="teal"
        />
        <FinanceCard
          label="Volume Order"
          value={`${financeStats.totalOrders} Transaksi`}
          icon={<ShoppingBag className="text-orange-500" />}
          sub="Total Pesanan Berhasil"
          color="orange"
        />
      </div>

      {/* 3. PERFORMANCE AREA */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* TOP MERCHANTS */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <h5 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 mb-8 italic">
            <TrendingUp size={16} className="text-teal-600" /> Top Sales
            Merchants
          </h5>
          <div className="space-y-6">
            {topSellers.map((m: any, i) => (
              <div key={i} className="flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center font-black text-slate-400 group-hover:bg-teal-50 group-hover:text-teal-600 transition-colors">
                    {i + 1}
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-800 uppercase tracking-tight">
                      {m.name}
                    </p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase">
                      {m.count} Pesanan Terlayani
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-slate-800 tracking-tighter">
                    Rp {m.total.toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
            {topSellers.length === 0 && (
              <div className="py-10 text-center text-slate-300 font-bold uppercase text-[10px]">
                Belum ada data penjualan
              </div>
            )}
          </div>
        </div>

        {/* DISTRIBUTION INFO */}
        <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white relative overflow-hidden shadow-2xl">
          <h5 className="text-xs font-black uppercase tracking-widest flex items-center gap-2 mb-10 text-teal-400 italic">
            <Wallet size={16} /> Logistic Payout Distribution
          </h5>
          <div className="space-y-8 relative z-10">
            <div className="flex justify-between items-end border-b border-white/5 pb-4">
              <div>
                <p className="text-[10px] font-bold text-white/40 uppercase">
                  Gaji Kurir Terbayar
                </p>
                <h4 className="text-2xl font-black text-white italic">
                  Rp {financeStats.courierEarnings.toLocaleString()}
                </h4>
              </div>
              <div className="p-3 bg-white/5 rounded-xl">
                <ArrowUpRight className="text-teal-400" size={20} />
              </div>
            </div>
            <div className="flex justify-between items-end border-b border-white/5 pb-4">
              <div>
                <p className="text-[10px] font-bold text-white/40 uppercase">
                  Target Revenue Wilayah
                </p>
                <h4 className="text-2xl font-black text-white italic">
                  Rp 50.000.000
                </h4>
              </div>
              <p className="text-[10px] font-black text-teal-400 uppercase italic">
                Monthly
              </p>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-white/30">
                <span>Platform Achievement</span>
                <span>
                  {Math.round((financeStats.totalOmzet / 50000000) * 100)}%
                </span>
              </div>
              <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-teal-500 transition-all duration-1000"
                  style={{
                    width: `${Math.min((financeStats.totalOmzet / 50000000) * 100, 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>
          <Wallet
            size={200}
            className="absolute right-[-40px] bottom-[-40px] text-white/[0.02] rotate-12"
          />
        </div>
      </div>
    </div>
  );
};

const FinanceCard = ({ label, value, icon, sub, color }: any) => (
  <div className="bg-white p-7 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group hover:scale-[1.02] transition-all">
    <div
      className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full blur-3xl opacity-10 bg-${color}-500`}
    ></div>
    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mb-6 group-hover:rotate-12 transition-all">
      {icon}
    </div>
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
      {label}
    </p>
    <h4 className="text-2xl font-black text-slate-900 tracking-tighter italic">
      {value}
    </h4>
    <p className="text-[8px] font-bold text-slate-300 uppercase mt-4">{sub}</p>
  </div>
);
