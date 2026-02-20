import React, { useEffect, useState } from "react";
import { supabase } from "../../../../lib/supabaseClient";
import {
  Banknote,
  XCircle,
  Loader2,
  User,
  RefreshCw,
  Zap,
  ArrowRightLeft,
  ShieldCheck,
  X,
  Sparkles,
} from "lucide-react";
import { useToast } from "../../../../contexts/ToastContext";

export const WithdrawalManager = () => {
  const { showToast } = useToast();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("PENDING");
  const [processingId, setProcessingId] = useState<string | null>(null);

  const [rejectingItem, setRejectingItem] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState("");

  const fetchWithdrawals = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("withdrawals")
        .select(`*, profiles!profile_id (name, wallet_balance, email)`)
        .eq("status", filter)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (err: any) {
      showToast("Gagal memuat pengajuan", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWithdrawals();
  }, [filter]);

  const generateAIReason = (type: "DATA" | "SECURITY") => {
    const reasons = {
      DATA: "NOMOR REKENING ATAU NAMA PEMILIK TIDAK VALID/SESUAI.",
      SECURITY: "TERDETEKSI AKTIVITAS MENCURIGAKAN PADA AKUN MITRA.",
    };
    setRejectReason(reasons[type as keyof typeof reasons]);
  };

  const handleAction = async (req: any, action: "APPROVE" | "REJECT") => {
    setProcessingId(req.id);
    try {
      if (action === "APPROVE") {
        const { error: midtransErr } = await supabase.functions.invoke(
          "midtrans-payout",
          {
            body: {
              withdrawalId: req.id,
              amount: req.amount,
              bankName: req.bank_name,
              accountNumber: req.account_number,
              accountName: req.account_name,
            },
          },
        );
        if (midtransErr) throw midtransErr;

        await supabase
          .from("withdrawals")
          .update({
            status: "COMPLETED",
            processed_at: new Date().toISOString(),
            admin_note: "Otomatis via Midtrans Iris",
          })
          .eq("id", req.id);

        showToast("DANA BERHASIL DIKIRIM!", "success");
      } else {
        await supabase.rpc("increment_wallet", {
          user_id: req.profile_id,
          amount: req.amount,
        });
        await supabase
          .from("withdrawals")
          .update({ status: "REJECTED", admin_note: rejectReason })
          .eq("id", req.id);
        showToast("Penarikan ditolak.", "info");
        setRejectingItem(null);
      }
      fetchWithdrawals();
    } catch (err: any) {
      showToast("Proses Gagal", "error");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-3 animate-in fade-in duration-500 text-left pb-10 font-black uppercase tracking-tighter">
      {/* 🚩 HEADER & NAVIGATION (Sudut Tegas) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-white p-3 rounded-md border border-slate-100 shadow-sm">
        <h2 className="text-[18px] font-black text-slate-900 flex items-center gap-2">
          <Zap className="text-[#FF6600] fill-[#FF6600]" size={20} /> PENCAIRAN{" "}
          <span className="text-[#008080]">DANA</span>
        </h2>
        <div className="flex bg-slate-100 p-1 rounded-md border border-slate-100 w-full md:w-auto overflow-x-auto no-scrollbar">
          {["PENDING", "COMPLETED", "REJECTED"].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`flex-1 md:flex-none px-4 py-2 rounded-md font-black text-[10px] transition-all whitespace-nowrap ${filter === s ? "bg-[#008080] text-white shadow-md" : "text-slate-400"}`}
            >
              {s === "PENDING" ? "ANTRIAN" : s}
            </button>
          ))}
        </div>
      </div>

      {/* 🚩 LIST DATA (Struktur Card Baru - Pasti Muncul) */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-20 text-center">
            <Loader2
              className="animate-spin mx-auto text-[#008080]"
              size={40}
            />
          </div>
        ) : requests.length === 0 ? (
          <div className="p-20 text-center bg-white rounded-md border-2 border-dashed border-slate-100 text-slate-300 text-[12px]">
            TIDAK ADA ANTRIAN
          </div>
        ) : (
          requests.map((req) => (
            <div
              key={req.id}
              className="bg-white rounded-md border border-slate-100 flex flex-col transition-all border-l-4 border-l-[#008080] shadow-sm hover:shadow-md"
            >
              {/* BAGIAN ATAS: INFORMASI */}
              <div className="p-4 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                {/* Nominal & User */}
                <div className="flex items-center gap-3 w-full md:w-auto">
                  <div className="w-10 h-10 bg-teal-50 text-[#008080] rounded-md flex items-center justify-center shrink-0">
                    <Banknote size={20} />
                  </div>
                  <div>
                    <h4 className="text-[16px] font-black text-slate-900 leading-none">
                      RP {Number(req.amount).toLocaleString()}
                    </h4>
                    <p className="text-[10px] text-slate-400 mt-1 truncate">
                      <User size={10} className="inline mr-1" />{" "}
                      {req.profiles?.name}
                    </p>
                  </div>
                </div>

                {/* Info Rekening */}
                <div className="bg-slate-50 p-2.5 rounded-md border border-slate-100 flex items-center gap-3 w-full md:flex-1 md:max-w-md">
                  <ArrowRightLeft
                    className="text-slate-300 shrink-0"
                    size={16}
                  />
                  <div className="truncate text-[12px]">
                    <p className="font-black text-slate-800 uppercase leading-none mb-1">
                      {req.bank_name} - {req.account_number}
                    </p>
                    <p className="font-black text-[#008080] uppercase leading-none">
                      A/N {req.account_name}
                    </p>
                  </div>
                </div>

                {/* Status jika bukan pending */}
                {filter !== "PENDING" && (
                  <div
                    className={`px-4 py-2 rounded-md text-[10px] font-black shrink-0 ${filter === "COMPLETED" ? "bg-teal-50 text-[#008080] border border-teal-100" : "bg-red-50 text-red-500 border border-red-100"}`}
                  >
                    STATUS: {filter}
                  </div>
                )}
              </div>

              {/* 🚩 BAGIAN BAWAH: TOMBOL AKSI (Hanya muncul jika PENDING) */}
              {filter === "PENDING" && (
                <div className="p-3 bg-slate-50 border-t border-slate-100 flex gap-2 justify-end">
                  <button
                    onClick={() => setRejectingItem(req)}
                    className="px-4 py-2.5 bg-white text-red-500 rounded-md border border-red-200 hover:bg-red-500 hover:text-white transition-all shadow-sm flex items-center justify-center"
                  >
                    <XCircle size={18} />
                  </button>
                  <button
                    onClick={() => handleAction(req, "APPROVE")}
                    disabled={processingId === req.id}
                    className="w-full md:w-auto md:px-8 py-2.5 bg-[#008080] text-white rounded-md font-black text-[12px] flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all"
                  >
                    {processingId === req.id ? (
                      <RefreshCw className="animate-spin" size={16} />
                    ) : (
                      <Zap
                        size={16}
                        fill="yellow"
                        className="text-yellow-400"
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

      {/* 🚩 FOOTER WARNING (UKURAN 12) */}
      <div className="p-4 bg-[#008080] rounded-md text-white flex items-center gap-4 border-l-8 border-l-[#FF6600] shadow-md">
        <ShieldCheck size={32} className="shrink-0" />
        <p className="text-[12px] font-black leading-tight normal-case">
          Tombol AUTO SEND akan memicu transfer real-time via Midtrans Iris.
          Pastikan saldo operasional mencukupi.
        </p>
      </div>

      {/* MODAL REJECT */}
      {rejectingItem && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-md shadow-2xl border-t-8 border-red-500 p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-[12px] font-black">ALASAN PENOLAKAN</h3>
              <button onClick={() => setRejectingItem(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="flex gap-1 mb-3">
              <button
                onClick={() => generateAIReason("DATA")}
                className="flex-1 text-[9px] bg-slate-50 p-2 rounded-md border border-slate-200 font-black uppercase hover:bg-[#008080] hover:text-white transition-colors"
              >
                <Sparkles size={10} className="inline mr-1" /> AI DATA
              </button>
              <button
                onClick={() => generateAIReason("SECURITY")}
                className="flex-1 text-[9px] bg-slate-50 p-2 rounded-md border border-slate-200 font-black uppercase hover:bg-[#008080] hover:text-white transition-colors"
              >
                <Sparkles size={10} className="inline mr-1" /> AI SECURITY
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
                className="flex-1 py-3 bg-slate-100 rounded-md text-[11px] font-black hover:bg-slate-200"
              >
                BATAL
              </button>
              <button
                onClick={() => handleAction(rejectingItem, "REJECT")}
                className="flex-1 py-3 bg-red-600 text-white rounded-md text-[11px] font-black hover:bg-red-700"
              >
                KONFIRMASI
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
