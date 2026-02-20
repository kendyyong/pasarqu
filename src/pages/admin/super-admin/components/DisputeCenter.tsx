import React, { useState, useEffect } from "react";
import { supabase } from "../../../../lib/supabaseClient";
import {
  ShieldAlert,
  Sparkles,
  Loader2,
  Send,
  BrainCircuit,
  Smile,
  Frown,
  AlertTriangle,
  RefreshCw,
  XCircle,
  Scale,
} from "lucide-react";
import { useToast } from "../../../../contexts/ToastContext";

export const DisputeCenter = () => {
  const { showToast } = useToast();
  const [complaints, setComplaints] = useState<any[]>([]);
  const [selectedDispute, setSelectedDispute] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiDraft, setAiDraft] = useState("");
  const [sentiment, setSentiment] = useState<{
    label: string;
    icon: any;
    color: string;
  } | null>(null);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      // 🚩 PERBAIKAN: Hanya mengambil data inti komplain agar kebal error relasi database
      const { data, error } = await supabase
        .from("complaints")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setComplaints(data || []);
    } catch (err: any) {
      showToast("ERROR DATABASE: " + err.message, "error");
      console.error("Detail Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const runAiAssistant = async (text: string) => {
    setAiAnalyzing(true);
    setAiDraft("");
    await new Promise((res) => setTimeout(res, 1200));

    const isAngry = text.toLowerCase().includes("marah") || text.includes("!!");

    if (isAngry) {
      setSentiment({
        label: "MARAH / KECEWA",
        icon: <Frown size={14} />,
        color: "bg-red-50 text-red-600 border-red-100",
      });
      setAiDraft(
        "HALO KAK, KAMI SANGAT MENYESAL ATAS KENDALA INI. TIM KAMI SUDAH MEMVALIDASI LAPORAN KAKAK DAN AKAN SEGERA MEMPROSES SOLUSI TERBAIK DALAM 1X24 JAM.",
      );
    } else {
      setSentiment({
        label: "NETRAL / BERTANYA",
        icon: <Smile size={14} />,
        color: "bg-blue-50 text-blue-600 border-blue-100",
      });
      setAiDraft(
        "HALO KAK, TERIMA KASIH SUDAH MENGHUBUNGI KAMI. MOHON LAMPIRKAN FOTO BUKTI TAMBAHAN AGAR KAMI BISA SEGERA MEMBANTU MENYELESAIKAN MASALAH INI.",
      );
    }
    setAiAnalyzing(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 animate-in fade-in duration-500 text-left font-black uppercase tracking-tighter">
      {/* 🚩 LIST KOMPLAIN (KIRI) */}
      <div className="lg:col-span-4 space-y-3">
        <div className="flex items-center justify-between bg-white p-3 rounded-md border border-slate-100 shadow-sm">
          <h3 className="text-[12px] font-black text-slate-800 flex items-center gap-2">
            <ShieldAlert className="text-red-500" size={18} /> TIKET MASUK
          </h3>
          <button
            onClick={() => fetchComplaints()}
            className="p-1 hover:rotate-180 transition-all text-slate-400 active:text-[#008080]"
          >
            <RefreshCw size={14} />
          </button>
        </div>

        <div className="space-y-2 max-h-[75vh] overflow-y-auto pr-1 no-scrollbar">
          {loading ? (
            <div className="py-20 text-center">
              <Loader2 className="animate-spin mx-auto text-[#008080]" />
            </div>
          ) : complaints.length === 0 ? (
            <div className="p-10 text-center bg-white rounded-md border-2 border-dashed border-slate-100 text-slate-300 text-[10px]">
              BELUM ADA KOMPLAIN MASUK
            </div>
          ) : (
            complaints.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  setSelectedDispute(item);
                  runAiAssistant(item.message);
                }}
                className={`p-4 rounded-md border transition-all cursor-pointer ${
                  selectedDispute?.id === item.id
                    ? "bg-white border-[#008080] shadow-md border-l-8"
                    : "bg-white border-slate-100 hover:border-teal-200 shadow-sm"
                }`}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[9px] text-slate-400 font-black">
                    {item.created_at
                      ? new Date(item.created_at).toLocaleDateString()
                      : "HARI INI"}
                  </span>
                  <div
                    className={`px-2 py-0.5 rounded text-[8px] text-white ${item.status === "open" ? "bg-red-500" : "bg-green-500"}`}
                  >
                    {item.status || "OPEN"}
                  </div>
                </div>
                <h4 className="font-black text-slate-800 text-[11px] mb-1 truncate">
                  {item.subject || "LAPORAN KENDALA"}
                </h4>
                <p className="text-[10px] text-slate-500 line-clamp-2 font-bold normal-case">
                  {item.message}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 🚩 PANEL ANALISIS (KANAN) */}
      <div className="lg:col-span-8">
        {selectedDispute ? (
          <div className="space-y-3">
            <div className="bg-white p-6 rounded-md border border-slate-100 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5 text-[#008080]">
                <Scale size={80} />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-slate-900 text-white rounded-md flex items-center justify-center font-black text-xl shadow-md">
                    P
                  </div>
                  <div>
                    <h3 className="font-black text-slate-800 text-[14px] leading-none">
                      PENGGUNA PASARQU
                    </h3>
                    <p className="text-[10px] text-[#008080] mt-1 tracking-widest font-black">
                      KODE: {selectedDispute.user_id?.slice(0, 8) || "ANONIM"}
                    </p>
                  </div>
                </div>

                {/* 🚩 TAMPILAN BUKTI FOTO (JIKA ADA) */}
                {selectedDispute.proof_url && (
                  <div className="mb-4">
                    <p className="text-[10px] text-slate-400 mb-2 font-black">
                      LAMPIRAN BUKTI:
                    </p>
                    <img
                      src={selectedDispute.proof_url}
                      alt="Bukti Komplain"
                      className="max-h-[150px] rounded-md border border-slate-200 object-cover shadow-sm"
                    />
                  </div>
                )}

                <div className="bg-slate-50 p-4 rounded-md border border-slate-100 border-l-4 border-l-[#FF6600]">
                  <p className="text-[12px] text-slate-700 leading-relaxed font-bold normal-case">
                    "{selectedDispute.message}"
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 rounded-md p-6 shadow-xl relative overflow-hidden border-b-4 border-b-[#008080]">
              <div className="absolute top-0 right-0 p-4 opacity-10 text-teal-400">
                <BrainCircuit size={60} />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-teal-500/20 rounded-md text-teal-400">
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <h3 className="text-[12px] font-black text-white tracking-widest">
                      AI DISPUTE ASSISTANT
                    </h3>
                    <p className="text-[9px] text-slate-400 font-bold uppercase">
                      ANALISIS EMOSI & REKOMENDASI SOLUSI
                    </p>
                  </div>
                </div>

                {aiAnalyzing ? (
                  <div className="flex items-center gap-4 py-6">
                    <Loader2 className="animate-spin text-teal-500" />
                    <p className="text-[10px] font-black text-white tracking-widest animate-pulse">
                      MEMINDAI SENTIMEN PELAPOR...
                    </p>
                  </div>
                ) : (
                  <div className="animate-in slide-in-from-bottom-2">
                    <div
                      className={`flex items-center gap-2 mb-5 px-3 py-1.5 rounded border w-fit font-black ${sentiment?.color}`}
                    >
                      {sentiment?.icon}
                      <span className="text-[9px] tracking-widest">
                        HASIL: {sentiment?.label}
                      </span>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[9px] font-black text-slate-500 tracking-widest">
                        DRAF SOLUSI (DAPAT DISESUAIKAN)
                      </label>
                      <textarea
                        value={aiDraft}
                        onChange={(e) => setAiDraft(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-md p-4 text-[12px] text-white font-bold focus:border-[#008080] outline-none transition-all normal-case min-h-[100px] resize-none shadow-inner uppercase"
                      />
                      <div className="flex justify-end gap-2 pt-2">
                        <button className="px-5 py-3 rounded-md border border-white/10 text-white font-black text-[10px] hover:bg-red-600 transition-all flex items-center gap-2 uppercase">
                          <XCircle size={14} /> TOLAK TIKET
                        </button>
                        <button className="px-6 py-3 rounded-md bg-[#008080] text-white font-black text-[10px] hover:bg-teal-700 transition-all shadow-md flex items-center gap-2 uppercase">
                          <Send size={14} /> KIRIM SOLUSI
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full min-h-[400px] flex flex-col items-center justify-center bg-white rounded-md border-2 border-dashed border-slate-100 shadow-inner">
            <AlertTriangle size={48} className="text-slate-100 mb-3" />
            <p className="text-[11px] font-black text-slate-400 tracking-widest uppercase">
              PILIH TIKET UNTUK MEMULAI ANALISIS AI
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
