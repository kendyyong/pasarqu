import React, { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import {
  Coins,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  User,
  ShieldCheck,
  RefreshCw,
  Search,
  ArrowUpRight,
  Wallet,
} from "lucide-react";
import { useToast } from "../../../contexts/ToastContext";
import { createAuditLog } from "../../../lib/auditHelper";

export const TopUpRequestManager = () => {
  const { showToast } = useToast();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchRequests = async () => {
    setLoading(true);
    try {
      // PERBAIKAN RELASI: Menggunakan alias spesifik agar Supabase tidak bingung
      const { data, error } = await supabase
        .from("topup_requests")
        .select(
          `
          *,
          courier:profiles!courier_id(name, wallet_balance, email),
          admin:profiles!admin_local_id(name)
        `,
        )
        .eq("status", "PENDING")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (err: any) {
      showToast("Gagal memuat antrean: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleAction = async (req: any, action: "APPROVED" | "REJECTED") => {
    setProcessingId(req.id);
    try {
      if (action === "APPROVED") {
        const amountNum = Number(req.amount);
        const currentBalance = Number(req.courier.wallet_balance || 0);
        const newBalance = currentBalance + amountNum;

        // 1. Update Saldo Kurir & Aktifkan status jika melewati threshold
        const { error: upError } = await supabase
          .from("profiles")
          .update({
            wallet_balance: newBalance,
            // Status otomatis ACTIVE jika saldo bertambah
            status: "ACTIVE",
          })
          .eq("id", req.courier_id);

        if (upError) throw upError;

        // 2. Catat di Riwayat Mutasi (wallet_logs)
        await supabase.from("wallet_logs").insert([
          {
            profile_id: req.courier_id,
            type: "TOPUP",
            amount: amountNum,
            balance_after: newBalance,
            description: `Top up via Admin Lokal (${req.admin?.name || "Sistem"})`,
          },
        ]);

        await createAuditLog(
          "APPROVE_TOPUP",
          "FINANCE",
          `Menyetujui top up Rp ${amountNum.toLocaleString()} untuk ${req.courier.name}`,
        );
      }

      // 3. Update Status Request (Berlaku untuk Approve maupun Reject)
      const { error: statusError } = await supabase
        .from("topup_requests")
        .update({
          status: action,
          processed_at: new Date().toISOString(),
        })
        .eq("id", req.id);

      if (statusError) throw statusError;

      showToast(
        action === "APPROVED"
          ? "Saldo telah diaktifkan!"
          : "Permintaan ditolak",
        "success",
      );
      fetchRequests();
    } catch (err: any) {
      showToast("Gagal memproses: " + err.message, "error");
    } finally {
      setProcessingId(null);
    }
  };

  const filteredRequests = requests.filter((r) =>
    r.courier?.name?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700 text-left pb-20">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">
            Top Up <span className="text-teal-600">Queue</span>
          </h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-widest">
            Konfirmasi setoran tunai dari Admin Lokal
          </p>
        </div>

        <div className="relative">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            size={16}
          />
          <input
            type="text"
            placeholder="Cari nama kurir..."
            className="bg-white border-none rounded-2xl pl-12 pr-6 py-3.5 text-xs font-bold shadow-sm focus:ring-2 ring-teal-500 w-full md:w-64 outline-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <Loader2 className="animate-spin mx-auto text-teal-600" size={40} />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredRequests.length === 0 ? (
            <div className="p-20 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100 font-bold text-slate-300 uppercase text-xs tracking-[0.3em]">
              Antrean Bersih / Tidak Ada Permintaan
            </div>
          ) : (
            filteredRequests.map((req) => (
              <div
                key={req.id}
                className="bg-white p-8 rounded-[2.5rem] border border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-8 hover:shadow-xl transition-all border-l-[12px] border-l-teal-500"
              >
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-teal-50 rounded-[1.5rem] flex items-center justify-center text-teal-600">
                    <Coins size={32} />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-800 text-xl leading-none mb-2">
                      Rp {req.amount.toLocaleString("id-ID")}
                    </h4>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <User size={12} className="text-slate-400" />
                        <p className="text-[11px] font-black text-slate-700 uppercase tracking-tight">
                          Kurir: {req.courier?.name}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <ShieldCheck size={12} className="text-teal-500" />
                        <p className="text-[10px] font-bold text-teal-600 uppercase tracking-widest">
                          Admin Penyetor: {req.admin?.name}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* INFO SALDO SAAT INI */}
                <div className="bg-slate-50 px-6 py-4 rounded-2xl border border-slate-100 text-center lg:text-left">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">
                    Saldo Kurir Sekarang
                  </p>
                  <p className="text-sm font-black text-slate-800 tracking-tighter">
                    Rp{" "}
                    {Number(req.courier?.wallet_balance || 0).toLocaleString(
                      "id-ID",
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleAction(req, "REJECTED")}
                    disabled={processingId === req.id}
                    className="p-4 bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-sm group/btn"
                  >
                    <XCircle size={22} />
                  </button>
                  <button
                    onClick={() => handleAction(req, "APPROVED")}
                    disabled={processingId === req.id}
                    className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-teal-600 shadow-xl transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
                  >
                    {processingId === req.id ? (
                      <RefreshCw className="animate-spin" size={16} />
                    ) : (
                      <CheckCircle2 size={16} />
                    )}
                    Approve & Tambah Saldo
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
