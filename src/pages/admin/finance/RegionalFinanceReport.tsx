import React, { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import {
  BarChart3,
  Download,
  TrendingUp,
  FileSpreadsheet,
  Loader2,
  RefreshCw,
  Award,
  Target,
  ArrowUpRight,
  TrendingDown,
  Calendar,
} from "lucide-react";
import { useToast } from "../../../contexts/ToastContext";

export const RegionalFinanceReport = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<any[]>([]);

  const fetchWeeklyReport = async () => {
    setLoading(true);
    try {
      // Memanggil fungsi RPC get_weekly_market_summary yang ada di database Supabase
      const { data, error } = await supabase.rpc("get_weekly_market_summary");

      if (error) throw error;
      setReports(data || []);
    } catch (err: any) {
      console.error("Report Error:", err.message);
      showToast("Gagal memuat laporan mingguan", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeeklyReport();
  }, []);

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 bg-white rounded-[3rem] border border-slate-100 shadow-sm">
        <Loader2 className="animate-spin text-indigo-600" size={40} />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
          Mengkalkulasi Laba Wilayah...
        </p>
      </div>
    );

  return (
    <div className="space-y-8 animate-in fade-in duration-700 text-left pb-20">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter leading-none mb-2">
            Weekly <span className="text-indigo-600">Performance</span>
          </h2>
          <div className="flex items-center gap-2">
            <Calendar size={12} className="text-slate-400" />
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              Laporan Analisis 7 Hari Terakhir
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchWeeklyReport}
            className="p-4 bg-white border border-slate-100 text-slate-400 hover:text-indigo-600 rounded-2xl transition-all shadow-sm active:scale-95"
          >
            <RefreshCw size={20} />
          </button>
          <button className="flex items-center gap-3 bg-slate-900 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200">
            <FileSpreadsheet size={18} /> Export Laporan
          </button>
        </div>
      </div>

      {/* RENDER CONTENT */}
      <div className="grid grid-cols-1 gap-8">
        {reports.length === 0 ? (
          <div className="p-32 text-center bg-white rounded-[4rem] border-2 border-dashed border-slate-100 font-black text-slate-300 uppercase text-xs tracking-[0.4em]">
            Belum ada aktivitas transaksi mingguan
          </div>
        ) : (
          reports.map((report, idx) => (
            <div
              key={idx}
              className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all duration-500 group relative overflow-hidden"
            >
              <div className="flex flex-col lg:flex-row justify-between gap-12 relative z-10">
                {/* LEFT: MAIN MARKET STATS */}
                <div className="flex-1">
                  <div className="flex items-center gap-5 mb-8">
                    <div className="w-14 h-14 bg-indigo-600 text-white rounded-[1.5rem] flex items-center justify-center font-black text-xl shadow-xl shadow-indigo-100 tracking-tighter">
                      {idx + 1 < 10 ? `0${idx + 1}` : idx + 1}
                    </div>
                    <div>
                      <h3 className="font-black text-slate-800 text-2xl uppercase tracking-tighter leading-none mb-1">
                        {report.market_name}
                      </h3>
                      <p className="text-[10px] text-indigo-500 font-black uppercase tracking-[0.2em]">
                        Penanggung Jawab:{" "}
                        {report.admin_name || "System Manager"}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="bg-slate-50/70 p-6 rounded-[2rem] border border-slate-100">
                      <p className="text-[8px] font-black text-slate-400 uppercase mb-2 tracking-widest">
                        Total Pesanan
                      </p>
                      <h4 className="text-2xl font-black text-slate-800 tracking-tighter">
                        {report.total_orders}
                      </h4>
                    </div>
                    <div className="bg-slate-50/70 p-6 rounded-[2rem] border border-slate-100">
                      <p className="text-[8px] font-black text-slate-400 uppercase mb-2 tracking-widest">
                        Total GTV
                      </p>
                      <h4 className="text-2xl font-black text-slate-800 tracking-tighter">
                        Rp {Number(report.total_gtv).toLocaleString("id-ID")}
                      </h4>
                    </div>
                    <div className="bg-emerald-50 text-emerald-700 p-6 rounded-[2rem] border border-emerald-100">
                      <p className="text-[8px] font-black text-emerald-400 uppercase mb-2 tracking-widest">
                        Laba Bersih
                      </p>
                      <h4 className="text-2xl font-black tracking-tighter">
                        Rp {Number(report.total_profit).toLocaleString("id-ID")}
                      </h4>
                    </div>
                    <div className="bg-slate-50/70 p-6 rounded-[2rem] border border-slate-100">
                      <p className="text-[8px] font-black text-slate-400 uppercase mb-2 tracking-widest">
                        Kurir Aktif
                      </p>
                      <h4 className="text-2xl font-black text-slate-800 tracking-tighter">
                        {report.active_couriers}
                      </h4>
                    </div>
                  </div>
                </div>

                {/* RIGHT: MVP HIGHLIGHT */}
                <div className="lg:w-96 bg-slate-900 rounded-[3rem] p-8 text-white relative overflow-hidden group/card shadow-2xl shadow-slate-200">
                  <div className="relative z-10 flex flex-col h-full justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-6">
                        <Award size={20} className="text-yellow-400" />
                        <p className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.3em]">
                          Weekly MVP
                        </p>
                      </div>
                      <h4 className="font-black text-xl uppercase tracking-tighter leading-tight mb-2 group-hover/card:text-indigo-400 transition-colors">
                        {report.top_courier_name || "Tidak Ada Data"}
                      </h4>
                      <div className="flex items-center gap-2">
                        <Target size={14} className="text-slate-500" />
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                          {report.top_courier_orders || 0} Pengiriman Selesai
                        </p>
                      </div>
                    </div>

                    <button className="mt-10 w-full py-4 bg-indigo-600 hover:bg-white hover:text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 shadow-lg shadow-indigo-900/40">
                      Berikan Bonus Cash
                    </button>
                  </div>
                  <BarChart3
                    className="absolute -right-8 -bottom-8 text-white/5 group-hover/card:scale-110 transition-transform duration-1000"
                    size={200}
                  />
                </div>
              </div>

              {/* DECORATIVE HOVER LINE */}
              <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RegionalFinanceReport;
