import React, { useState, useEffect } from "react";
import { supabase } from "../../../../lib/supabaseClient";
import { useAuth } from "../../../../contexts/AuthContext";
import { useToast } from "../../../../contexts/ToastContext";
import {
  MessageSquare,
  CheckCircle2,
  ShieldAlert,
  ChevronRight,
  BrainCircuit,
  Loader2,
  X,
  Scale,
  RefreshCw,
  XCircle,
  Truck,
  Store,
} from "lucide-react";

export const LocalResolutionTab = () => {
  const { profile } = useAuth();
  const { showToast } = useToast();
  const [filter, setFilter] = useState("open");
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCase, setSelectedCase] = useState<any>(null);

  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiRecommendation, setAiRecommendation] = useState<string | null>(null);

  const fetchComplaints = async () => {
    if (!profile?.managed_market_id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("complaints")
        .select(
          `
          *,
          orders!inner(
            id,
            total_price,
            market_id,
            merchant_id,
            courier_id
          ),
          profiles:user_id ( name ) 
        `,
        )
        .eq("orders.market_id", profile.managed_market_id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setComplaints(data || []);
    } catch (err: any) {
      showToast("GAGAL MEMUAT DATA: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [profile]);

  const analyzeWithAI = async (item: any) => {
    setAiAnalyzing(true);
    setAiRecommendation(null);
    try {
      await new Promise((res) => setTimeout(res, 2000));
      const issue = (item.reason || item.message || "").toLowerCase();
      let advice = "";

      if (issue.includes("busuk") || issue.includes("basi")) {
        advice =
          "SARAN AI: SETUJUI REFUND. MASALAH PADA KUALITAS BARANG, DISARANKAN PENALTI TOKO.";
      } else if (issue.includes("kurang") || issue.includes("hilang")) {
        advice =
          "SARAN AI: INVESTIGASI KURIR. JIKA BARANG HILANG DI JALAN, DISARANKAN PENALTI KURIR.";
      } else {
        advice =
          "SARAN AI: INVESTIGASI LANJUTAN. CEK BUKTI FOTO SEBELUM MENETAPKAN PENALTI.";
      }
      setAiRecommendation(advice);
    } catch (err) {
      showToast("AI SEDANG SIBUK", "error");
    } finally {
      setAiAnalyzing(false);
    }
  };

  // 🚩 FUNGSI RESOLUSI DENGAN LOGIKA PENALTI SALDO
  const handleResolve = async (
    id: string,
    resolution: "RESOLVED" | "REJECTED",
    target: "MERCHANT" | "COURIER" = "MERCHANT",
  ) => {
    try {
      // 1. Update status komplain
      const { error: updateError } = await supabase
        .from("complaints")
        .update({ status: resolution })
        .eq("id", id);

      if (updateError) throw updateError;

      // 2. Jika disetujui (Refund), jalankan pemotongan saldo otomatis
      if (resolution === "RESOLVED") {
        const targetId =
          target === "MERCHANT"
            ? selectedCase.orders.merchant_id
            : selectedCase.orders.courier_id;

        if (!targetId) {
          showToast(`GAGAL: ID ${target} TIDAK DITEMUKAN`, "error");
          return;
        }

        const { error: rpcError } = await supabase.rpc(
          "handle_penalty_refund",
          {
            p_target_id: targetId,
            p_amount: selectedCase.orders.total_price,
            p_complaint_id: id,
            p_reason: `PENALTI KOMPLAIN #${id.slice(0, 8)} (${target})`,
          },
        );

        if (rpcError) throw rpcError;
        showToast(
          `REFUND BERHASIL. SALDO ${target} TELAH DIPOTONG.`,
          "success",
        );
      } else {
        showToast(`KOMPLAIN DITOLAK. TIDAK ADA PEMOTONGAN SALDO.`, "info");
      }

      setSelectedCase(null);
      fetchComplaints();
    } catch (err: any) {
      showToast("PROSES GAGAL: " + err.message, "error");
    }
  };

  if (loading)
    return (
      <div className="py-20 text-center flex flex-col items-center gap-4">
        <Loader2 className="animate-spin text-[#008080]" size={40} />
        <p className="text-[12px] font-black uppercase text-slate-400 tracking-widest">
          MENGHUBUNGKAN KE PUSAT RESOLUSI...
        </p>
      </div>
    );

  return (
    <div className="space-y-6 animate-in fade-in duration-700 text-left font-black uppercase tracking-tighter">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-[16px] font-black text-slate-800 flex items-center gap-2">
            <ShieldAlert className="text-[#FF6600]" size={20} /> PUSAT RESOLUSI
            LOKAL
          </h3>
          <p className="text-[10px] font-bold text-slate-400 mt-1 tracking-widest normal-case">
            PENGAMBILAN KEPUTUSAN PENALTI TOKO ATAU KURIR.
          </p>
        </div>
        <div className="flex bg-white p-1 rounded-md border border-slate-200 shadow-sm">
          {["open", "RESOLVED", "REJECTED"].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-2 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${filter === s ? "bg-[#008080] text-white shadow-md" : "text-slate-400 hover:text-slate-600"}`}
            >
              {s === "open" ? "PENDING" : s}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LIST KIRI */}
        <div
          className={`space-y-3 ${selectedCase ? "lg:col-span-5" : "lg:col-span-12"}`}
        >
          {complaints.filter((c) => c.status === filter).length === 0 ? (
            <div className="bg-white p-16 rounded-md border-2 border-dashed border-slate-200 text-center shadow-sm">
              <CheckCircle2 className="text-slate-300 mx-auto mb-3" size={32} />
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                ANTREAN BERSIH
              </p>
            </div>
          ) : (
            complaints
              .filter((c) => c.status === filter)
              .map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    setSelectedCase(item);
                    setAiRecommendation(null);
                  }}
                  className={`bg-white p-4 rounded-md border transition-all cursor-pointer ${selectedCase?.id === item.id ? "border-[#008080] border-l-8 shadow-md" : "border-slate-200 shadow-sm hover:border-teal-200"}`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="px-2 py-0.5 bg-orange-50 text-[#FF6600] border border-orange-100 text-[9px] font-black rounded uppercase">
                      #{item.id.slice(0, 8)}
                    </span>
                    <div className="text-[10px] font-black text-slate-800">
                      RP {item.orders?.total_price?.toLocaleString()}
                    </div>
                  </div>
                  <h4 className="text-[12px] font-black text-slate-800 leading-tight uppercase truncate">
                    {item.subject || item.message}
                  </h4>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 mt-2">
                    <span className="text-slate-900 truncate max-w-[100px]">
                      {item.profiles?.name || "PELANGGAN"}
                    </span>
                    <ChevronRight size={12} className="text-slate-300" />
                    <span className="text-[#008080] truncate max-w-[100px]">
                      MITRA PASAR
                    </span>
                  </div>
                </div>
              ))
          )}
        </div>

        {/* DETAIL KANAN */}
        {selectedCase && (
          <div className="lg:col-span-7 animate-in slide-in-from-right-8 duration-500 sticky top-24">
            <div className="bg-white rounded-md p-6 border border-slate-200 shadow-xl space-y-6">
              <div className="flex justify-between items-center border-b pb-4">
                <div className="flex items-center gap-2">
                  <Scale size={20} className="text-slate-400" />
                  <h3 className="font-black text-slate-800 text-[14px]">
                    DETAIL KEPUTUSAN
                  </h3>
                </div>
                <X
                  onClick={() => setSelectedCase(null)}
                  className="cursor-pointer text-slate-400"
                />
              </div>

              <div className="bg-orange-50 p-4 border-l-4 border-[#FF6600]">
                <p className="text-[11px] font-bold text-slate-700 normal-case leading-relaxed">
                  "{selectedCase.message}"
                </p>
                {selectedCase.proof_url && (
                  <img
                    src={selectedCase.proof_url}
                    alt="Bukti"
                    className="mt-3 w-full max-h-[150px] object-cover rounded-md border border-orange-200"
                  />
                )}
              </div>

              {/* AI BOX */}
              <div className="bg-slate-900 rounded-md p-5 relative overflow-hidden">
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-teal-400">
                      <BrainCircuit size={18} />
                      <span className="text-[10px] font-black tracking-widest">
                        AI ASSISTANT
                      </span>
                    </div>
                    {!aiRecommendation && (
                      <button
                        onClick={() => analyzeWithAI(selectedCase)}
                        disabled={aiAnalyzing}
                        className="px-3 py-1.5 bg-[#008080] text-white rounded text-[9px] font-black"
                      >
                        {aiAnalyzing ? "PROSES..." : "ANALISIS"}
                      </button>
                    )}
                  </div>
                  {aiRecommendation && (
                    <p className="text-[11px] text-white font-black leading-relaxed bg-white/10 p-3 rounded">
                      {aiRecommendation}
                    </p>
                  )}
                </div>
              </div>

              {/* TOMBOL TINDAKAN */}
              {selectedCase.status === "open" && (
                <div className="space-y-4">
                  <p className="text-[10px] text-slate-400 tracking-widest">
                    PILIH PIHAK YANG BERTANGGUNG JAWAB (PENALTI):
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() =>
                        handleResolve(selectedCase.id, "RESOLVED", "MERCHANT")
                      }
                      className="py-4 bg-[#008080] text-white rounded-md font-black text-[10px] flex flex-col items-center gap-2 border-b-4 border-teal-800 active:translate-y-1 active:border-b-0"
                    >
                      <Store size={20} /> PENALTI TOKO
                    </button>
                    <button
                      onClick={() =>
                        handleResolve(selectedCase.id, "RESOLVED", "COURIER")
                      }
                      className="py-4 bg-[#FF6600] text-white rounded-md font-black text-[10px] flex flex-col items-center gap-2 border-b-4 border-orange-800 active:translate-y-1 active:border-b-0"
                    >
                      <Truck size={20} /> PENALTI KURIR
                    </button>
                  </div>
                  <button
                    onClick={() => handleResolve(selectedCase.id, "REJECTED")}
                    className="w-full py-3 bg-slate-100 text-slate-500 rounded-md font-black text-[10px] hover:bg-red-50 hover:text-red-600 transition-all uppercase"
                  >
                    Tolak Komplain (Tanpa Refund)
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
