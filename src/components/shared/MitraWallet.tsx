import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";
import {
  Wallet,
  ArrowDownCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Landmark,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useToast } from "../../contexts/ToastContext";

export const MitraWallet = ({ profileId, balance, onRefresh }: any) => {
  const { showToast } = useToast();
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [form, setForm] = useState({
    amount: "",
    bank_name: "",
    account_number: "",
    account_name: "",
  });

  const fetchHistory = async () => {
    if (!profileId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("withdrawals")
        .select("*")
        .eq("profile_id", profileId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (data) setWithdrawals(data);
    } catch (err: any) {
      console.error("Gagal fetch history:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [profileId]);

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseInt(form.amount);

    if (amountNum > balance) {
      showToast("Saldo tidak mencukupi!", "error");
      return;
    }
    if (amountNum < 50000) {
      showToast("Minimal penarikan adalah Rp 50.000", "error");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("withdrawals").insert([
        {
          profile_id: profileId,
          amount: amountNum,
          bank_name: form.bank_name,
          account_number: form.account_number,
          account_name: form.account_name,
          status: "PENDING",
        },
      ]);

      if (error) throw error;

      showToast("Pengajuan penarikan berhasil dikirim!", "success");
      setShowModal(false);
      setForm({
        amount: "",
        bank_name: "",
        account_number: "",
        account_name: "",
      });
      fetchHistory();
      if (onRefresh) onRefresh();
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 text-left animate-in fade-in duration-500">
      {/* CARD SALDO UTAMA */}
      <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-xl shadow-slate-200">
        <div className="relative z-10">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-2">
            Saldo Tersedia
          </p>
          <h2 className="text-4xl font-black tracking-tighter mb-8">
            Rp {balance?.toLocaleString()}
          </h2>

          <button
            onClick={() => setShowModal(true)}
            className="bg-teal-500 hover:bg-teal-400 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-teal-900/20"
          >
            <ArrowDownCircle size={18} /> Tarik Dana
          </button>
        </div>
        <Wallet className="absolute -right-6 -bottom-6 text-white/5 w-40 h-40 -rotate-12" />
      </div>

      {/* RIWAYAT PENARIKAN */}
      <div>
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
          <Clock size={14} /> Riwayat Penarikan
        </h3>
        <div className="space-y-3">
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="animate-spin text-teal-600" />
            </div>
          ) : withdrawals.length === 0 ? (
            <div className="bg-white p-10 rounded-3xl border border-dashed border-slate-200 text-center text-slate-400 text-[10px] font-black uppercase tracking-widest">
              Belum ada riwayat pencairan
            </div>
          ) : (
            withdrawals.map((w) => (
              <div
                key={w.id}
                className="bg-white p-4 rounded-2xl border border-slate-100 flex justify-between items-center group"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      w.status === "APPROVED"
                        ? "bg-green-50 text-green-600"
                        : w.status === "REJECTED"
                          ? "bg-red-50 text-red-600"
                          : "bg-orange-50 text-orange-600"
                    }`}
                  >
                    <Landmark size={20} />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-800 text-sm">
                      Rp {w.amount.toLocaleString()}
                    </h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">
                      {w.bank_name} •{" "}
                      {new Date(w.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`text-[9px] font-black px-2 py-1 rounded-lg uppercase ${
                      w.status === "APPROVED"
                        ? "bg-green-100 text-green-700"
                        : w.status === "REJECTED"
                          ? "bg-red-100 text-red-700"
                          : "bg-orange-100 text-orange-700"
                    }`}
                  >
                    {w.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* MODAL PENARIKAN */}
      {showModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl animate-in zoom-in-95">
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter mb-6">
              Tarik Dana Ke Rekening
            </h3>

            <form onSubmit={handleWithdraw} className="space-y-4 text-left">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2">
                  Nominal (Min. Rp 50.000)
                </label>
                <input
                  required
                  type="number"
                  placeholder="Contoh: 100000"
                  className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 font-bold text-slate-700 focus:ring-2 focus:ring-teal-500 outline-none"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-2">
                    Nama Bank
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="BCA / Mandiri / BRI"
                    className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 font-bold text-slate-700 focus:ring-2 focus:ring-teal-500 outline-none"
                    value={form.bank_name}
                    onChange={(e) =>
                      setForm({ ...form, bank_name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-2">
                    No. Rekening
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="12345678"
                    className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 font-bold text-slate-700 focus:ring-2 focus:ring-teal-500 outline-none"
                    value={form.account_number}
                    onChange={(e) =>
                      setForm({ ...form, account_number: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2">
                  Nama Pemilik Rekening
                </label>
                <input
                  required
                  type="text"
                  placeholder="Sesuai Buku Tabungan"
                  className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 font-bold text-slate-700 focus:ring-2 focus:ring-teal-500 outline-none"
                  value={form.account_name}
                  onChange={(e) =>
                    setForm({ ...form, account_name: e.target.value })
                  }
                />
              </div>

              <div className="bg-blue-50 p-4 rounded-2xl flex gap-3 mt-4">
                <AlertCircle className="text-blue-500 shrink-0" size={18} />
                <p className="text-[9px] text-blue-700 font-bold leading-relaxed uppercase">
                  Proses transfer akan dilakukan secara manual oleh Admin dalam
                  1x24 jam kerja.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="py-4 text-slate-400 font-black uppercase text-[10px] tracking-widest"
                >
                  Batal
                </button>
                <button
                  disabled={submitting}
                  type="submit"
                  className="py-4 bg-teal-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-teal-600/20 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    "Kirim Pengajuan"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
