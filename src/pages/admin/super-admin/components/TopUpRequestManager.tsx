import React, { useEffect, useState } from "react";
import { supabase } from "../../../../lib/supabaseClient";
import {
  Coins,
  CheckCircle2,
  XCircle,
  Loader2,
  User,
  ShieldCheck,
  RefreshCw,
  Search,
  Wallet,
  X,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { useToast } from "../../../../contexts/ToastContext";
import { createAuditLog } from "../../../../lib/auditHelper";

export const TopUpRequestManager = () => {
  const { showToast } = useToast();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("PENDING");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [rejectingItem, setRejectingItem] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState("");

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("topup_requests")
        .select(
          `*, courier:profiles!courier_id(name, wallet_balance, email), admin:profiles!admin_local_id(name)`,
        )
        .eq("status", filter)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (err: any) {
      showToast("Gagal memuat data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  const generateAIReason = (type: "DATA" | "FUNDS") => {
    const reasons = {
      DATA: "Terdapat ketidaksesuaian data identitas kurir atau admin penyetor dalam verifikasi wilayah.",
      FUNDS:
        "Dana tunai belum diterima secara fisik atau nominal tidak sesuai dengan mutasi fisik.",
    };
    setRejectReason(reasons[type]);
  };

  const handleAction = async (req: any, action: "APPROVED" | "REJECTED") => {
    setProcessingId(req.id);
    try {
      if (action === "APPROVED") {
        const amountNum = Number(req.amount);
        const currentBalance = Number(req.courier.wallet_balance || 0);
        const newBalance = currentBalance + amountNum;

        await supabase
          .from("profiles")
          .update({ wallet_balance: newBalance, status: "ACTIVE" })
          .eq("id", req.courier_id);

        await supabase.from("wallet_logs").insert([
          {
            profile_id: req.courier_id,
            type: "TOPUP",
            amount: amountNum,
            balance_after: newBalance,
            description: `Top up via Admin Lokal (${req.admin?.name || "Sistem"})`,
          },
        ]);

        await supabase.from("transactions").insert([
          {
            type: "KURIR_TOPUP",
            debit: amountNum,
            credit: 0,
            account_code: "1001-KAS",
            description: `Top Up Saldo Kurir: ${req.courier.name} (via Admin ${req.admin?.name || "Sistem"})`,
          },
        ]);

        await createAuditLog(
          "APPROVE_TOPUP",
          "FINANCE",
          `Menyetujui top up Rp ${amountNum.toLocaleString()} untuk ${req.courier.name}`,
        );
      }

      await supabase
        .from("topup_requests")
        .update({
          status: action,
          processed_at: new Date().toISOString(),
          admin_note: action === "REJECTED" ? rejectReason : null,
        })
        .eq("id", req.id);

      showToast(
        action === "APPROVED"
          ? "Saldo aktif & tercatat di Ledger!"
          : "Permintaan ditolak",
        "success",
      );
      setRejectingItem(null);
      setRejectReason("");
      fetchRequests();
    } catch (err: any) {
      showToast("Gagal memproses", "error");
    } finally {
      setProcessingId(null);
    }
  };

  const filteredRequests = requests.filter((r) =>
    r.courier?.name?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="space-y-4 animate-in fade-in duration-500 text-left pb-10 font-black uppercase tracking-tighter">
      {/* HEADER & ANALYTICS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-white p-3 rounded-md border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#FF6600] text-white rounded-md flex items-center justify-center">
            <TrendingUp size={20} />
          </div>
          <div>
            <h2 className="text-[18px] font-black text-slate-900 leading-none">
              TOPUP <span className="text-[#008080]">DASHBOARD</span>
            </h2>
            <p className="text-[10px] text-slate-400 font-bold tracking-widest mt-1">
              TOTAL {filter}: RP{" "}
              {filteredRequests
                .reduce((acc, curr) => acc + (curr.amount || 0), 0)
                .toLocaleString()}
            </p>
          </div>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-md border border-slate-100 w-full md:w-auto overflow-x-auto no-scrollbar">
          {["PENDING", "APPROVED", "REJECTED"].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-2 rounded-md font-black text-[10px] transition-all whitespace-nowrap ${filter === s ? "bg-[#008080] text-white shadow-md" : "text-slate-400"}`}
            >
              {s === "PENDING" ? "ANTRIAN" : s}
            </button>
          ))}
        </div>
      </div>

      {/* SEARCH BAR */}
      <div className="relative w-full">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          size={14}
        />
        <input
          type="text"
          placeholder="CARI NAMA KURIR..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white border border-slate-200 py-3 pl-9 pr-4 rounded-md text-[11px] font-black outline-none focus:border-[#008080] shadow-sm"
        />
      </div>

      {/* LIST DATA */}
      {loading ? (
        <div className="py-20 text-center">
          <Loader2 className="animate-spin mx-auto text-[#008080]" size={40} />
        </div>
      ) : (
        <div className="space-y-2">
          {filteredRequests.length === 0 ? (
            <div className="p-20 text-center bg-white rounded-md border-2 border-dashed border-slate-100 text-slate-300 text-[12px]">
              DATA KOSONG
            </div>
          ) : (
            filteredRequests.map((req) => (
              <div
                key={req.id}
                className="bg-white p-4 rounded-md border border-slate-100 flex flex-col lg:flex-row items-center justify-between gap-4 border-l-4 border-l-[#008080] shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-4 lg:w-1/3">
                  <div className="w-12 h-12 bg-teal-50 text-[#008080] rounded-md flex items-center justify-center shrink-0">
                    <Wallet size={24} />
                  </div>
                  <div>
                    <h4 className="text-[16px] font-black text-slate-900 leading-none">
                      RP {req.amount.toLocaleString("id-ID")}
                    </h4>
                    <div className="mt-1 space-y-0.5">
                      <p className="text-[10px] text-slate-400 font-black flex items-center gap-1 uppercase">
                        <User size={10} /> {req.courier?.name}
                      </p>
                      <p className="text-[9px] text-[#FF6600] font-black flex items-center gap-1 uppercase">
                        <ShieldCheck size={10} /> PENYETOR: {req.admin?.name}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-md border border-slate-100 flex-1 w-full lg:max-w-xs text-center lg:text-left">
                  <p className="text-[8px] text-slate-400 font-black mb-1 uppercase tracking-widest">
                    SALDO WALLET:
                  </p>
                  <p className="text-[14px] font-black text-slate-800 tracking-tight">
                    RP{" "}
                    {Number(req.courier?.wallet_balance || 0).toLocaleString(
                      "id-ID",
                    )}
                  </p>
                </div>

                <div className="flex gap-2 w-full lg:w-auto">
                  {filter === "PENDING" ? (
                    <>
                      <button
                        onClick={() => setRejectingItem(req)}
                        className="p-3 bg-red-50 text-red-500 rounded-md border border-red-100 hover:bg-red-500 hover:text-white transition-all"
                      >
                        <XCircle size={18} />
                      </button>
                      <button
                        onClick={() => handleAction(req, "APPROVED")}
                        disabled={processingId === req.id}
                        className="flex-1 lg:px-6 py-3 bg-[#008080] text-white rounded-md font-black text-[12px] flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all"
                      >
                        {processingId === req.id ? (
                          <RefreshCw className="animate-spin" size={16} />
                        ) : (
                          <CheckCircle2 size={16} />
                        )}
                        APPROVE & ISI SALDO
                      </button>
                    </>
                  ) : (
                    <div
                      className={`px-4 py-2 rounded-md text-[10px] font-black ${filter === "APPROVED" ? "bg-teal-50 text-[#008080]" : "bg-red-50 text-red-500"}`}
                    >
                      STATUS: {filter}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* FOOTER WARNING (TEKS 12) */}
      <div className="p-4 bg-[#008080] rounded-md text-white flex items-center gap-4 border-l-8 border-l-[#FF6600] shadow-md">
        <ShieldCheck size={32} className="shrink-0" />
        <p className="text-[12px] font-black leading-tight normal-case">
          Pastikan dana tunai dari Admin Lokal telah diterima sebelum melakukan
          Approval. Saldo yang sudah bertambah tidak dapat dibatalkan secara
          otomatis.
        </p>
      </div>

      {/* MODAL REJECT */}
      {rejectingItem && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-md shadow-2xl border-t-8 border-red-500 p-5">
            <h3 className="text-[12px] font-black mb-4 uppercase">
              TOLAK TOPUP KURIR
            </h3>
            <div className="flex gap-1 mb-3">
              <button
                onClick={() => generateAIReason("DATA")}
                className="flex-1 text-[9px] bg-slate-50 p-2 rounded-md border border-slate-200 font-black uppercase hover:bg-red-500 hover:text-white transition-all"
              >
                <Sparkles size={10} className="inline mr-1" /> AI DATA
              </button>
              <button
                onClick={() => generateAIReason("FUNDS")}
                className="flex-1 text-[9px] bg-slate-50 p-2 rounded-md border border-slate-200 font-black uppercase hover:bg-red-500 hover:text-white transition-all"
              >
                <Sparkles size={10} className="inline mr-1" /> AI DANA
              </button>
            </div>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full bg-slate-50 border p-3 rounded-md text-[12px] font-bold min-h-[80px] mb-4 outline-none focus:border-red-500 normal-case"
              placeholder="Tulis alasan..."
            />
            <div className="flex gap-2">
              <button
                onClick={() => setRejectingItem(null)}
                className="flex-1 py-3 bg-slate-100 rounded-md text-[11px] font-black"
              >
                BATAL
              </button>
              <button
                onClick={() => handleAction(rejectingItem, "REJECTED")}
                className="flex-1 py-3 bg-red-600 text-white rounded-md text-[11px] font-black"
              >
                KONFIRMASI TOLAK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
