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
} from "lucide-react"; // <-- Sudah diperbaiki ke lucide-react
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
      // Menggunakan tanda seru (!) untuk menspesifikasikan kolom relasi agar tidak ambigu
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

  const handleAction = async (
    requestId: string,
    courierId: string,
    amount: number,
    action: "APPROVE" | "REJECT",
  ) => {
    setProcessingId(requestId);
    try {
      if (action === "APPROVE") {
        const { data: profile } = await supabase
          .from("profiles")
          .select("wallet_balance")
          .eq("id", courierId)
          .single();
        const currentBalance = Number(profile?.wallet_balance || 0);

        if (currentBalance < amount) {
          throw new Error("Saldo kurir tidak mencukupi untuk penarikan ini.");
        }

        const newBalance = currentBalance - amount;

        // 1. Update Saldo Kurir
        await supabase
          .from("profiles")
          .update({ wallet_balance: newBalance })
          .eq("id", courierId);

        // 2. Update Status Request Penarikan
        await supabase
          .from("withdrawals")
          .update({
            status: "COMPLETED",
            processed_at: new Date().toISOString(),
          })
          .eq("id", requestId);

        // 3. Catat di Mutasi Wallet
        await supabase.from("wallet_logs").insert([
          {
            profile_id: courierId,
            type: "WITHDRAW",
            amount: amount,
            balance_after: newBalance,
            description: `Penarikan saldo disetujui`,
          },
        ]);

        await createAuditLog(
          "WITHDRAW_APPROVED",
          "FINANCE",
          `Approve penarikan Rp ${amount.toLocaleString()} untuk kurir ID: ${courierId}`,
        );
        showToast("Penarikan disetujui!", "success");
      } else {
        // Jika REJECTED
        await supabase
          .from("withdrawals")
          .update({ status: "REJECTED" })
          .eq("id", requestId);
        showToast("Penarikan ditolak", "info");
      }
      fetchWithdrawals();
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 text-left pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">
            Withdrawal <span className="text-emerald-600">Center</span>
          </h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-widest">
            Validasi penarikan dana mitra
          </p>
        </div>

        <div className="flex bg-white p-1 rounded-2xl border border-slate-100 shadow-sm">
          {["PENDING", "COMPLETED", "REJECTED"].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-6 py-2.5 rounded-xl font-black text-[9px] tracking-widest transition-all ${
                filter === status
                  ? "bg-slate-900 text-white shadow-lg"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              {status}
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
              Tidak ada data {filter.toLowerCase()}
            </div>
          ) : (
            requests.map((req) => (
              <div
                key={req.id}
                className="bg-white p-8 rounded-[2.5rem] border border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-6 hover:shadow-xl transition-all group"
              >
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                    <Banknote size={28} />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-800 text-lg">
                      Rp {Number(req.amount).toLocaleString("id-ID")}
                    </h4>
                    <div className="flex items-center gap-3 mt-1">
                      <p className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-1">
                        <User size={12} /> {req.profiles?.name || "Unknown"}
                      </p>
                      <p className="text-[10px] font-bold text-slate-300 flex items-center gap-1">
                        <Clock size={12} />{" "}
                        {new Date(req.created_at).toLocaleDateString("id-ID")}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-5 rounded-2xl flex-1 max-w-md border border-slate-100 group-hover:bg-emerald-50/30 transition-colors">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">
                    Tujuan Transfer:
                  </p>
                  <p className="text-[11px] font-black text-slate-700 uppercase leading-tight">
                    {req.bank_name} - {req.account_number} <br />
                    <span className="text-emerald-600 tracking-wide">
                      A/N {req.account_name}
                    </span>
                  </p>
                </div>

                {filter === "PENDING" && (
                  <div className="flex gap-3">
                    <button
                      onClick={() =>
                        handleAction(
                          req.id,
                          req.profile_id,
                          req.amount,
                          "REJECT",
                        )
                      }
                      className="p-4 bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-sm"
                    >
                      <XCircle size={20} />
                    </button>
                    <button
                      onClick={() =>
                        handleAction(
                          req.id,
                          req.profile_id,
                          req.amount,
                          "APPROVE",
                        )
                      }
                      disabled={processingId === req.id}
                      className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 transition-all flex items-center gap-2 shadow-lg shadow-slate-200"
                    >
                      {processingId === req.id ? (
                        <RefreshCw className="animate-spin" size={16} />
                      ) : (
                        <CheckCircle2 size={16} />
                      )}
                      Setujui
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
