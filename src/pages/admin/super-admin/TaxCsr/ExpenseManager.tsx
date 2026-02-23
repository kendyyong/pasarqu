import React, { useState } from "react";
import {
  ArrowDownRight,
  FileText,
  Clock,
  CheckCircle2,
  X,
  Save,
  Loader2,
} from "lucide-react";
import { supabase } from "../../../../lib/supabaseClient";
import { useToast } from "../../../../contexts/ToastContext";

interface ExpenseManagerProps {
  adminExpenses: any[];
  setAdminExpenses: React.Dispatch<React.SetStateAction<any[]>>;
}

export const ExpenseManager: React.FC<ExpenseManagerProps> = ({
  adminExpenses,
  setAdminExpenses,
}) => {
  const { showToast } = useToast();

  // --- STATE LOKAL UNTUK MODAL ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmittingExpense, setIsSubmittingExpense] = useState(false);
  const [newExpense, setNewExpense] = useState({
    type: "CSR",
    amount: "",
    note: "",
  });

  // --- FUNGSI FORMATTER ---
  const formatRp = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateString));
  };

  // --- FUNGSI SIMPAN PENGELUARAN ---
  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpense.amount || !newExpense.note) {
      showToast("Nominal dan keterangan wajib diisi!", "error");
      return;
    }

    setIsSubmittingExpense(true);
    try {
      const { data, error } = await supabase
        .from("admin_withdrawals")
        .insert([
          {
            type: newExpense.type,
            amount: Number(newExpense.amount),
            note: newExpense.note,
            status: "COMPLETED",
          },
        ])
        .select()
        .single();

      if (error) throw error;

      // Update state di komponen induk (TaxAndCSRConfig)
      setAdminExpenses([data, ...adminExpenses]);
      setIsModalOpen(false);
      setNewExpense({ type: "CSR", amount: "", note: "" });
      showToast("Pengeluaran berhasil dicatat!", "success");
    } catch (error) {
      console.error("Gagal mencatat pengeluaran:", error);
      showToast("Gagal mencatat pengeluaran ke database.", "error");
    } finally {
      setIsSubmittingExpense(false);
    }
  };

  return (
    <>
      {/* SEKSI TABEL RIWAYAT PENGELUARAN */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mt-6">
        <div className="flex justify-between items-end border-b border-slate-100 pb-4 mb-4">
          <div>
            <h3 className="text-[14px] font-black uppercase text-[#008080] flex items-center gap-2">
              <FileText size={18} /> Laporan Pengeluaran & Penarikan
            </h3>
            <p className="text-[11px] text-slate-500 font-medium mt-1">
              Catatan historis penarikan profit, dana CSR, perawatan, dan dana
              darurat.
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="hidden md:flex bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest items-center gap-2 transition-all"
          >
            <ArrowDownRight size={14} /> Catat Pengeluaran Baru
          </button>
        </div>

        {/* Tabel Data */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-wider">
                <th className="p-4 rounded-tl-xl">Tanggal</th>
                <th className="p-4">Tipe Dana</th>
                <th className="p-4">Keterangan</th>
                <th className="p-4 text-right">Nominal</th>
                <th className="p-4 rounded-tr-xl">Status</th>
              </tr>
            </thead>
            <tbody>
              {adminExpenses.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="p-8 text-center text-slate-400 text-[12px] font-bold uppercase"
                  >
                    Belum ada riwayat pengeluaran atau penarikan dana.
                  </td>
                </tr>
              ) : (
                adminExpenses.map((expense) => (
                  <tr
                    key={expense.id}
                    className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="p-4 text-[11px] font-medium text-slate-600 flex items-center gap-2">
                      <Clock size={12} className="text-slate-400" />
                      {formatDate(expense.created_at)}
                    </td>
                    <td className="p-4">
                      <span
                        className={`text-[10px] font-black px-2 py-1 rounded uppercase tracking-wider ${
                          expense.type === "CSR"
                            ? "bg-pink-100 text-pink-600"
                            : expense.type === "MAINTENANCE"
                              ? "bg-blue-100 text-blue-600"
                              : expense.type === "EMERGENCY"
                                ? "bg-orange-100 text-orange-600"
                                : expense.type === "TAX"
                                  ? "bg-red-100 text-red-600"
                                  : "bg-[#008080]/10 text-[#008080]"
                        }`}
                      >
                        {expense.type.replace("_", " ")}
                      </span>
                    </td>
                    <td className="p-4 text-[12px] font-bold text-slate-800">
                      {expense.note}
                    </td>
                    <td className="p-4 text-right text-[13px] font-black text-red-600">
                      - {formatRp(expense.amount)}
                    </td>
                    <td className="p-4">
                      {expense.status === "COMPLETED" ? (
                        <div className="flex items-center justify-end md:justify-start gap-1 text-teal-600 text-[10px] font-black uppercase tracking-wider">
                          <CheckCircle2 size={14} /> Berhasil
                        </div>
                      ) : (
                        <div className="flex items-center justify-end md:justify-start gap-1 text-orange-500 text-[10px] font-black uppercase tracking-wider">
                          <Clock size={14} /> Diproses
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Tombol Mobile */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full mt-4 md:hidden bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
        >
          <ArrowDownRight size={14} /> Catat Pengeluaran Baru
        </button>
      </div>

      {/* MODAL INPUT PENGELUARAN */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50">
              <h3 className="text-[14px] font-black uppercase text-[#008080]">
                Catat Pengeluaran Baru
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-red-500 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="p-5 space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
                  Tipe Dana
                </label>
                <select
                  value={newExpense.type}
                  onChange={(e) =>
                    setNewExpense({ ...newExpense, type: e.target.value })
                  }
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-[12px] font-bold focus:outline-none focus:border-[#008080] focus:ring-1 focus:ring-[#008080]"
                >
                  <option value="CSR">CSR (Bantuan Sosial)</option>
                  <option value="MAINTENANCE">Perawatan Sistem</option>
                  <option value="EMERGENCY">Dana Darurat</option>
                  <option value="TAX">Pembayaran Pajak</option>
                  <option value="PROFIT_TAKE">Pencairan Profit Owner</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
                  Nominal (Rp)
                </label>
                <input
                  type="number"
                  required
                  placeholder="Contoh: 1500000"
                  value={newExpense.amount}
                  onChange={(e) =>
                    setNewExpense({ ...newExpense, amount: e.target.value })
                  }
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-[12px] font-bold focus:outline-none focus:border-[#008080] focus:ring-1 focus:ring-[#008080]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
                  Keterangan / Tujuan
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Contoh: Pembayaran sewa server AWS bulan ini"
                  value={newExpense.note}
                  onChange={(e) =>
                    setNewExpense({ ...newExpense, note: e.target.value })
                  }
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-[12px] font-bold focus:outline-none focus:border-[#008080] focus:ring-1 focus:ring-[#008080] resize-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmittingExpense}
                  className={`w-full py-3 rounded-xl text-[11px] font-black uppercase tracking-widest text-white flex justify-center items-center gap-2 transition-all ${
                    isSubmittingExpense
                      ? "bg-slate-400 cursor-not-allowed"
                      : "bg-[#008080] hover:bg-teal-700 active:scale-95"
                  }`}
                >
                  {isSubmittingExpense ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Save size={16} />
                  )}
                  {isSubmittingExpense ? "MENYIMPAN..." : "SIMPAN PENGELUARAN"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
