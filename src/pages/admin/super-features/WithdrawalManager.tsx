import React, { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import {
  Banknote,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  User,
  RefreshCw,
  Zap,
  ArrowRightLeft,
  ShieldCheck,
} from "lucide-react";
import { useToast } from "../../../contexts/ToastContext";
import { createAuditLog } from "../../../lib/auditHelper";

export const WithdrawalManager = () => {
  const { showToast } = useToast();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("PENDING");
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchWithdrawals = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("withdrawals")
        .select(
          `
          *,
          profiles!profile_id (
            name,
            wallet_balance,
            email
          )
        `,
        )
        .eq("status", filter)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (err: any) {
      showToast("Gagal memuat pengajuan: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWithdrawals();
  }, [filter]);

  // --- LOGIKA UTAMA: EKSEKUSI PEMBAYARAN OTOMATIS (MIDTRANS IRIS) ---
  const handleAction = async (req: any, action: "APPROVE" | "REJECT") => {
    setProcessingId(req.id);
    try {
      if (action === "APPROVE") {
        showToast("Menghubungkan ke API Midtrans...", "info");

        // 1. PANGGIL EDGE FUNCTION (Server-side Midtrans Integration)
        // Juragan perlu membuat edge function 'midtrans-payout' untuk keamanan API Key
        const { data: midtransRes, error: midtransErr } =
          await supabase.functions.invoke("midtrans-payout", {
            body: {
              withdrawalId: req.id,
              amount: req.amount,
              bankName: req.bank_name,
              accountNumber: req.account_number,
              accountName: req.account_name,
            },
          });

        if (midtransErr) throw midtransErr;

        // 2. UPDATE DATABASE (Status Sukses)
        await supabase
          .from("withdrawals")
          .update({
            status: "COMPLETED",
            processed_at: new Date().toISOString(),
            admin_note: "Otomatis via Midtrans Iris",
          })
          .eq("id", req.id);

        // 3. JURNAL TRANSAKSI KAS UTAMA
        await supabase.from("transactions").insert([
          {
            type: "PAYOUT_DISBURSEMENT",
            credit: req.amount,
            debit: 0,
            account_code: "1001-KAS",
            description: `Auto-Payout Midtrans #${req.id.slice(0, 8)}`,
          },
        ]);

        await createAuditLog(
          "WITHDRAW_AUTO_APPROVED",
          "FINANCE",
          `Auto-send Rp ${req.amount.toLocaleString()} to ${req.account_name}`,
        );
        showToast("DANA BERHASIL DIKIRIM OTOMATIS!", "success");
      } else {
        // --- LOGIKA TOLAK (KEMBALIKAN SALDO) ---
        const reason = window.prompt(
          "Alasan penolakan (dana akan dikembalikan ke dompet user):",
        );
        if (reason === null) return;

        // 1. Kembalikan saldo ke user via RPC agar aman
        const { error: refundErr } = await supabase.rpc("increment_wallet", {
          user_id: req.profile_id,
          amount: req.amount,
        });

        if (refundErr) throw refundErr;

        // 2. Update status request
        await supabase
          .from("withdrawals")
          .update({
            status: "REJECTED",
            admin_note: reason,
          })
          .eq("id", req.id);

        showToast("Penarikan ditolak, saldo dikembalikan.", "info");
      }
      fetchWithdrawals();
    } catch (err: any) {
      showToast("Gagal: " + err.message, "error");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 text-left pb-20">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter italic flex items-center gap-2">
            <Zap className="text-yellow-500 fill-yellow-500" /> Auto{" "}
            <span className="text-emerald-600">Disbursement</span>
          </h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-widest leading-none">
            Powered by Midtrans Iris • Real-time Payment Engine
          </p>
        </div>

        <div className="flex bg-white p-1 rounded-2xl border border-slate-100 shadow-sm">
          {["PENDING", "COMPLETED", "REJECTED"].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-6 py-2.5 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all ${
                filter === status
                  ? "bg-slate-900 text-white shadow-lg"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              {status === "PENDING" ? "Antrian Cair" : status}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <Loader2
            className="animate-spin mx-auto text-emerald-600"
            size={40}
          />
        </div>
      ) : (
        <div className="space-y-4">
          {requests.length === 0 ? (
            <div className="p-20 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100 text-slate-300 font-bold uppercase text-xs tracking-widest">
              Tidak ada antrian pencairan dana
            </div>
          ) : (
            requests.map((req) => (
              <div
                key={req.id}
                className="bg-white p-8 rounded-[2.5rem] border border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-8 hover:shadow-xl transition-all group relative overflow-hidden"
              >
                <div className="flex items-center gap-6 lg:w-1/3">
                  <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shadow-inner group-hover:scale-110 transition-transform">
                    <Banknote size={28} />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-800 text-lg leading-none">
                      Rp {Number(req.amount).toLocaleString("id-ID")}
                    </h4>
                    <p className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-1 mt-2">
                      <User size={12} /> {req.profiles?.name || "Unknown"}
                    </p>
                  </div>
                </div>

                <div className="bg-slate-50 p-6 rounded-[2rem] flex-1 border border-slate-100 flex items-center gap-5">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 border border-slate-200">
                    <ArrowRightLeft size={18} />
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">
                      Target Rekening Mitra:
                    </p>
                    <p className="text-xs font-black text-slate-800 uppercase">
                      {req.bank_name} - {req.account_number}
                    </p>
                    <p className="text-[10px] font-bold text-emerald-600 uppercase">
                      A/N {req.account_name}
                    </p>
                  </div>
                </div>

                {filter === "PENDING" && (
                  <div className="flex gap-3 lg:w-1/4 justify-end">
                    <button
                      onClick={() => handleAction(req, "REJECT")}
                      className="p-4 bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-sm"
                    >
                      <XCircle size={20} />
                    </button>
                    <button
                      onClick={() => handleAction(req, "APPROVE")}
                      disabled={processingId === req.id}
                      className="flex-1 py-5 bg-slate-900 text-white rounded-[1.8rem] font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-emerald-600 transition-all flex items-center justify-center gap-3 border-b-4 border-slate-700"
                    >
                      {processingId === req.id ? (
                        <RefreshCw className="animate-spin" size={16} />
                      ) : (
                        <Zap
                          className="text-yellow-400 fill-yellow-400"
                          size={16}
                        />
                      )}
                      AUTO SEND
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* FOOTER INFO */}
      <div className="p-8 bg-emerald-600 rounded-[3rem] text-white flex items-center gap-6 shadow-2xl relative overflow-hidden">
        <ShieldCheck
          className="text-white/20 absolute right-[-20px] bottom-[-20px]"
          size={150}
        />
        <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center shrink-0 border border-white/10">
          <Zap size={32} />
        </div>
        <div>
          <h4 className="text-sm font-black uppercase tracking-[0.2em] mb-1 italic">
            Sistem Pencairan Mandiri
          </h4>
          <p className="text-[10px] text-emerald-100 font-bold leading-relaxed uppercase max-w-2xl">
            Tombol "AUTO SEND" akan memerintahkan Midtrans untuk mengirim uang
            dari saldo akun Juragan langsung ke rekening mitra. Pastikan saldo
            Midtrans Iris Juragan mencukupi.
          </p>
        </div>
      </div>
    </div>
  );
};
