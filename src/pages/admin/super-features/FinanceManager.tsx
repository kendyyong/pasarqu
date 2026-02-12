import React, { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import {
  Wallet,
  ArrowUpRight,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Filter,
  Loader2,
  AlertCircle,
  Banknote,
} from "lucide-react";
import { useToast } from "../../../contexts/ToastContext";
import { createAuditLog } from "../../../lib/auditHelper"; // <--- Import Helper Audit

// Format Rupiah Helper
const formatRupiah = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};

export const FinanceManager = ({ finance, theme }: any) => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<"pending" | "history">("pending");
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // State untuk Modal Proses
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [processNote, setProcessNote] = useState("");
  const [processing, setProcessing] = useState(false);

  // 1. Fetch Data
  const fetchWithdrawals = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("withdrawals")
        .select("*, profiles(name, email, role)")
        .order("created_at", { ascending: false });

      if (activeTab === "pending") {
        query = query.eq("status", "PENDING");
      } else {
        query = query.neq("status", "PENDING");
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

  // 2. Handle Approve/Reject
  const handleProcess = async (status: "APPROVED" | "REJECTED") => {
    if (!selectedItem) return;
    setProcessing(true);

    try {
      const { error } = await supabase
        .from("withdrawals")
        .update({
          status: status,
          admin_note: processNote,
          updated_at: new Date(),
        })
        .eq("id", selectedItem.id);

      if (error) throw error;

      // --- OTOMATIS CATAT KE CCTV (AUDIT LOGS) ---
      await createAuditLog(
        status === "APPROVED" ? "APPROVE_WITHDRAWAL" : "REJECT_WITHDRAWAL",
        "FINANCE",
        `${status === "APPROVED" ? "Menyetujui" : "Menolak"} penarikan dana sebesar ${formatRupiah(selectedItem.amount)} untuk mitra ${selectedItem.profiles?.name || "Tanpa Nama"}`,
      );

      showToast(
        status === "APPROVED" ? "Penarikan Disetujui" : "Penarikan Ditolak",
        status === "APPROVED" ? "success" : "error",
      );

      setSelectedItem(null);
      setProcessNote("");
      fetchWithdrawals(); // Refresh data
    } catch (err: any) {
      showToast("Gagal memproses: " + err.message, "error");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20 text-left">
      {/* HEADER STATISTIK */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[1.5rem] border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center">
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

        <div className="bg-white p-6 rounded-[1.5rem] border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center">
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

        <div className="bg-white p-6 rounded-[1.5rem] border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center">
            <CheckCircle size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Sukses Cair
            </p>
            <h3 className="text-xl font-black text-slate-800">--</h3>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden min-h-[500px]">
        {/* TAB NAVIGASI */}
        <div className="flex items-center px-8 pt-6 border-b border-slate-100">
          <button
            onClick={() => setActiveTab("pending")}
            className={`pb-4 px-4 text-xs font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === "pending" ? "border-orange-500 text-orange-500" : "border-transparent text-slate-400 hover:text-slate-600"}`}
          >
            Permintaan Baru
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`pb-4 px-4 text-xs font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === "history" ? "border-teal-500 text-teal-600" : "border-transparent text-slate-400 hover:text-slate-600"}`}
          >
            Riwayat Transaksi
          </button>
        </div>

        {/* TOOLBAR FILTER */}
        <div className="p-6 flex items-center justify-between">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-3 text-slate-400"
            />
            <input
              type="text"
              placeholder="Cari nama atau rekening..."
              className="pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-xs font-bold w-64 focus:ring-2 focus:ring-teal-500 outline-none"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-100 transition-all">
            <Filter size={16} /> Filter
          </button>
        </div>

        {/* TABEL DATA */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="animate-spin text-teal-600 mb-4" size={32} />
            <p className="text-xs font-bold text-slate-400">
              Memuat Data Keuangan...
            </p>
          </div>
        ) : withdrawals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4">
              <Banknote size={32} />
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Tidak ada data transaksi
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                  <th className="px-6 py-4">Mitra / User</th>
                  <th className="px-6 py-4">Bank Tujuan</th>
                  <th className="px-6 py-4">Nominal</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Tanggal</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="text-xs font-bold text-slate-700 divide-y divide-slate-100">
                {withdrawals.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-slate-800">
                          {item.profiles?.name || "Tanpa Nama"}
                        </span>
                        <span className="text-[10px] text-teal-600 uppercase">
                          {item.profiles?.role || "USER"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="uppercase font-black">
                          {item.bank_name}
                        </span>
                        <span className="text-slate-500 font-mono">
                          {item.account_number}
                        </span>
                        <span className="text-[10px] text-slate-400 uppercase">
                          {item.account_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-black text-slate-800">
                      {formatRupiah(item.amount)}
                    </td>
                    <td className="px-6 py-4">
                      {item.status === "PENDING" && (
                        <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-[10px] font-black uppercase">
                          Menunggu
                        </span>
                      )}
                      {item.status === "APPROVED" && (
                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-[10px] font-black uppercase">
                          Sukses
                        </span>
                      )}
                      {item.status === "REJECTED" && (
                        <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-[10px] font-black uppercase">
                          Ditolak
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {new Date(item.created_at).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {item.status === "PENDING" ? (
                        <button
                          onClick={() => setSelectedItem(item)}
                          className="bg-teal-600 text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-teal-700 transition-all shadow-sm"
                        >
                          Proses
                        </button>
                      ) : (
                        <button className="text-slate-300 cursor-not-allowed text-[10px] font-black uppercase">
                          Detail
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

      {/* MODAL PROSES TRANSAKSI */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-[2rem] w-full max-w-md p-8 shadow-2xl relative">
            <button
              onClick={() => setSelectedItem(null)}
              className="absolute top-6 right-6 text-slate-300 hover:text-slate-600"
            >
              <XCircle size={24} />
            </button>

            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tighter mb-1">
              Konfirmasi Transfer
            </h3>
            <p className="text-xs text-slate-500 font-bold mb-6">
              Pastikan Anda sudah mentransfer dana secara manual.
            </p>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3 mb-6">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Bank Tujuan</span>
                <span className="font-black uppercase">
                  {selectedItem.bank_name}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">No. Rekening</span>
                <span className="font-mono font-bold">
                  {selectedItem.account_number}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Atas Nama</span>
                <span className="font-black uppercase">
                  {selectedItem.account_name}
                </span>
              </div>
              <div className="border-t border-slate-200 pt-3 flex justify-between text-sm">
                <span className="text-slate-500 font-bold">Total Transfer</span>
                <span className="font-black text-teal-600">
                  {formatRupiah(selectedItem.amount)}
                </span>
              </div>
            </div>

            <div className="space-y-2 mb-6 text-left">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Catatan Admin (Opsional)
              </label>
              <textarea
                className="w-full bg-slate-50 border-none rounded-xl p-4 text-xs font-bold focus:ring-2 focus:ring-teal-500 outline-none"
                rows={3}
                placeholder="Contoh: Transfer via BCA ref 12345..."
                value={processNote}
                onChange={(e) => setProcessNote(e.target.value)}
              ></textarea>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleProcess("REJECTED")}
                disabled={processing}
                className="py-3 rounded-xl border border-red-100 text-red-500 font-black text-xs uppercase tracking-widest hover:bg-red-50 transition-all disabled:opacity-50"
              >
                Tolak
              </button>
              <button
                onClick={() => handleProcess("APPROVED")}
                disabled={processing}
                className="py-3 rounded-xl bg-teal-600 text-white font-black text-xs uppercase tracking-widest hover:bg-teal-700 transition-all shadow-lg shadow-teal-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {processing && <Loader2 className="animate-spin" size={14} />}
                Setujui & Selesai
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
