import React, { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import {
  Wallet,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Filter,
  Loader2,
  Banknote,
  TrendingUp,
  ArrowUpRight,
} from "lucide-react";
import { useToast } from "../../../contexts/ToastContext";
import { createAuditLog } from "../../../lib/auditHelper";

const formatRupiah = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};

// --- DATA MOCK UNTUK GRAFIK (Nanti bisa dihubungkan ke DB) ---
const chartData = [
  { day: "Sen", value: 45 },
  { day: "Sel", value: 52 },
  { day: "Rab", value: 38 },
  { day: "Kam", value: 65 },
  { day: "Jum", value: 48 },
  { day: "Sab", value: 80 },
  { day: "Min", value: 70 },
];

export const FinanceManager = ({ finance, activeTab }: any) => {
  const { showToast } = useToast();
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [processNote, setProcessNote] = useState("");
  const [processing, setProcessing] = useState(false);

  const fetchWithdrawals = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("withdrawals")
        .select(`*, profiles!withdrawals_profile_id_fkey (name, email, role)`)
        .order("created_at", { ascending: false });

      if (activeTab === "pending") {
        query = query.eq("status", "PENDING");
      }

      const { data, error } = await query;
      if (error) throw error;
      setWithdrawals(data || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWithdrawals();
  }, [activeTab]);

  const handleProcess = async (status: "APPROVED" | "REJECTED") => {
    if (!selectedItem) return;
    setProcessing(true);
    try {
      const { error } = await supabase
        .from("withdrawals")
        .update({ status, admin_note: processNote, updated_at: new Date() })
        .eq("id", selectedItem.id);

      if (error) throw error;

      await createAuditLog(
        status === "APPROVED" ? "APPROVE_WITHDRAWAL" : "REJECT_WITHDRAWAL",
        "FINANCE",
        `${status === "APPROVED" ? "Menyetujui" : "Menolak"} penarikan ${formatRupiah(selectedItem.amount)}`,
      );

      showToast("Berhasil diproses", "success");
      setSelectedItem(null);
      fetchWithdrawals();
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20 text-left">
      {/* 1. TOP STATS (Sama untuk kedua tab) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center">
            <Wallet size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Total Revenue
            </p>
            <h3 className="text-xl font-black text-slate-800">
              {formatRupiah(finance?.revenue || 0)}
            </h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Menunggu Cair
            </p>
            <h3 className="text-xl font-black text-slate-800">
              {formatRupiah(
                withdrawals.reduce(
                  (sum, item) =>
                    item.status === "PENDING" ? sum + item.amount : sum,
                  0,
                ),
              )}
            </h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Growth
            </p>
            <h3 className="text-xl font-black text-blue-600">+12.5%</h3>
          </div>
        </div>
      </div>

      {/* 2. KONDISIONAL KONTEN */}
      {activeTab === "finance" ? (
        // --- TAMPILAN FINANCE SUMMARY (CHART) ---
        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="font-black text-slate-800 uppercase tracking-tighter text-lg">
                Tren Pendapatan
              </h3>
              <p className="text-xs text-slate-400 font-bold">
                Statistik 7 hari terakhir
              </p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-teal-50 text-teal-600 rounded-xl text-[10px] font-black uppercase">
              <ArrowUpRight size={14} /> Berjalan Baik
            </div>
          </div>

          {/* SIMPLE SVG BAR CHART */}
          <div className="flex items-end justify-between h-64 gap-2 md:gap-4 px-2">
            {chartData.map((data, i) => (
              <div
                key={i}
                className="flex-1 flex flex-col items-center gap-4 group"
              >
                <div className="relative w-full flex items-end justify-center h-full">
                  {/* Tooltip */}
                  <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-all bg-slate-800 text-white text-[9px] font-black px-2 py-1 rounded-md pointer-events-none mb-2">
                    {data.value}%
                  </div>
                  {/* Bar */}
                  <div
                    className="w-full max-w-[40px] bg-slate-100 group-hover:bg-teal-500 rounded-t-xl transition-all duration-500 ease-out"
                    style={{ height: `${data.value}%` }}
                  ></div>
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase">
                  {data.day}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        // --- TAMPILAN LAPORAN PROFIT (TABLE) ---
        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-8 border-b border-slate-50 flex justify-between items-center">
            <h3 className="font-black text-slate-800 uppercase tracking-tight">
              Riwayat Transaksi
            </h3>
            <div className="flex gap-2">
              <div className="relative">
                <Search
                  size={14}
                  className="absolute left-3 top-2.5 text-slate-300"
                />
                <input
                  type="text"
                  placeholder="Cari..."
                  className="pl-9 pr-4 py-2 bg-slate-50 rounded-xl text-[10px] font-bold outline-none ring-teal-500 focus:ring-2 w-40"
                />
              </div>
            </div>
          </div>

          {loading ? (
            <div className="py-20 text-center">
              <Loader2 className="animate-spin mx-auto text-teal-600" />
              <p className="text-[10px] font-black text-slate-400 uppercase mt-2">
                Sinkronisasi...
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-[9px] font-black uppercase tracking-widest border-b border-slate-100">
                    <th className="px-8 py-4">Mitra</th>
                    <th className="px-8 py-4">Nominal</th>
                    <th className="px-8 py-4">Status</th>
                    <th className="px-8 py-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="text-[11px] font-bold text-slate-700 divide-y divide-slate-50">
                  {withdrawals.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50">
                      <td className="px-8 py-5">
                        <p className="text-slate-800">
                          {item.profiles?.name || "User"}
                        </p>
                        <p className="text-[9px] text-teal-600 uppercase">
                          {item.profiles?.role}
                        </p>
                      </td>
                      <td className="px-8 py-5 font-black">
                        {formatRupiah(item.amount)}
                      </td>
                      <td className="px-8 py-5">
                        <span
                          className={`px-2 py-1 rounded text-[9px] font-black uppercase ${item.status === "PENDING" ? "bg-orange-50 text-orange-600" : "bg-green-50 text-green-600"}`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        {item.status === "PENDING" && (
                          <button
                            onClick={() => setSelectedItem(item)}
                            className="bg-slate-900 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase hover:bg-teal-600"
                          >
                            Proses
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MODAL PROSES (Tetap Sama) */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md p-10 shadow-2xl animate-in zoom-in-95">
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter mb-6">
              Konfirmasi Cair
            </h3>
            <div className="bg-slate-50 p-6 rounded-2xl mb-8 space-y-2 border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase">
                Tujuan Transfer
              </p>
              <p className="text-sm font-black text-slate-800 uppercase">
                {selectedItem.bank_name} - {selectedItem.account_number}
              </p>
              <p className="text-lg font-black text-teal-600 pt-2 border-t border-slate-200 mt-2">
                {formatRupiah(selectedItem.amount)}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleProcess("REJECTED")}
                className="py-4 font-black text-[10px] uppercase text-red-500 hover:bg-red-50 rounded-2xl"
              >
                Tolak
              </button>
              <button
                onClick={() => handleProcess("APPROVED")}
                className="py-4 bg-teal-600 text-white font-black text-[10px] uppercase rounded-2xl shadow-lg shadow-teal-600/20"
              >
                Setujui
              </button>
            </div>
            <button
              onClick={() => setSelectedItem(null)}
              className="w-full mt-6 text-[9px] font-black text-slate-300 uppercase hover:text-slate-500"
            >
              Batal
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
