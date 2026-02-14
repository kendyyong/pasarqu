import React, { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabaseClient";
import {
  ShieldAlert,
  MessageSquare,
  Sparkles,
  User,
  Loader2,
  Send,
  BrainCircuit,
  Smile,
  Frown,
  AlertTriangle,
} from "lucide-react";
import { useToast } from "../../../contexts/ToastContext";

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
    const { data, error } = await supabase
      .from("complaints")
      .select("*, profiles(name, avatar_url)")
      .order("created_at", { ascending: false });

    if (!error) setComplaints(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  // FITUR AI: ANALISIS SENTIMEN & SOLUSI
  const runAiAssistant = async (text: string) => {
    setAiAnalyzing(true);
    setAiDraft("");

    // Simulasi Berpikir AI
    await new Promise((res) => setTimeout(res, 1500));

    // Logika Mock AI (Nanti bisa disambung ke API Gemini/OpenAI)
    const isAngry = text.toLowerCase().includes("marah") || text.includes("!!");

    if (isAngry) {
      setSentiment({
        label: "Marah / Kecewa",
        icon: <Frown />,
        color: "text-red-500",
      });
      setAiDraft(
        "Halo Kak, kami sangat menyesal atas kendala ini. Tim kami sudah memvalidasi laporan Kakak dan akan segera memproses pengembalian dana/barang dalam 1x24 jam.",
      );
    } else {
      setSentiment({
        label: "Netral / Bertanya",
        icon: <Smile />,
        color: "text-blue-500",
      });
      setAiDraft(
        "Halo Kak, terima kasih sudah menghubungi kami. Terkait kendala Kakak, mohon lampirkan foto bukti agar kami bisa segera membantu menyelesaikan masalah ini ya.",
      );
    }

    setAiAnalyzing(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500 text-left">
      {/* LIST KOMPLAIN (KIRI) */}
      <div className="lg:col-span-4 space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
            <ShieldAlert className="text-red-500" size={18} /> Antrian Tiket
          </h3>
          <span className="bg-slate-100 px-2 py-1 rounded-lg text-[10px] font-black text-slate-500">
            {complaints.length} TOTAL
          </span>
        </div>

        <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2 no-scrollbar">
          {loading ? (
            <div className="py-20 text-center">
              <Loader2 className="animate-spin mx-auto text-teal-600" />
            </div>
          ) : (
            complaints.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  setSelectedDispute(item);
                  runAiAssistant(item.message);
                }}
                className={`p-4 rounded-[1.5rem] border transition-all cursor-pointer ${selectedDispute?.id === item.id ? "bg-white border-teal-500 shadow-xl shadow-teal-600/10 scale-[1.02]" : "bg-white border-slate-100 hover:border-teal-200"}`}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">
                    {new Date(item.created_at).toLocaleDateString()}
                  </span>
                  <div
                    className={`w-2 h-2 rounded-full ${item.status === "open" ? "bg-red-500" : "bg-green-500"}`}
                  ></div>
                </div>
                <h4 className="font-black text-slate-800 text-xs mb-1 line-clamp-1">
                  {item.subject || "Laporan Masalah"}
                </h4>
                <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">
                  {item.message}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* CHAT & AI PANEL (KANAN) */}
      <div className="lg:col-span-8">
        {selectedDispute ? (
          <div className="space-y-6">
            {/* Laporan Asli */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 text-slate-50 opacity-10">
                <MessageSquare size={100} />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black uppercase shadow-lg shadow-slate-900/20">
                    {selectedDispute.profiles?.name?.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-black text-slate-800 uppercase tracking-tight text-base">
                      {selectedDispute.profiles?.name}
                    </h3>
                    <p className="text-[10px] text-teal-600 font-bold uppercase tracking-widest">
                      Pelapor Terverifikasi
                    </p>
                  </div>
                </div>
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                  <p className="text-sm text-slate-700 leading-relaxed font-medium">
                    "{selectedDispute.message}"
                  </p>
                </div>
              </div>
            </div>

            {/* AI DISPUTE ASSISTANT BOX */}
            <div className="bg-slate-900 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-20">
                <BrainCircuit size={80} className="text-teal-400" />
              </div>

              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-teal-500/20 rounded-xl text-teal-400">
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-widest">
                      AI Dispute Assistant
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">
                      Analisis Masalah & Solusi Otomatis
                    </p>
                  </div>
                </div>

                {aiAnalyzing ? (
                  <div className="flex items-center gap-4 py-8">
                    <Loader2 className="animate-spin text-teal-500" />
                    <p className="text-xs font-bold text-white uppercase tracking-widest animate-pulse">
                      AI Sedang Membaca Emosi Pelapor...
                    </p>
                  </div>
                ) : (
                  <div className="animate-in slide-in-from-bottom-4">
                    {/* Sentimen */}
                    <div
                      className={`flex items-center gap-2 mb-6 px-4 py-2 rounded-xl bg-white/5 border border-white/10 w-fit ${sentiment?.color}`}
                    >
                      {sentiment?.icon}
                      <span className="text-[10px] font-black uppercase tracking-widest">
                        Sentimen: {sentiment?.label}
                      </span>
                    </div>

                    {/* Draf Jawaban AI */}
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                        Saran Jawaban AI (Bisa Diedit)
                      </label>
                      <textarea
                        value={aiDraft}
                        onChange={(e) => setAiDraft(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-sm text-white font-medium focus:ring-2 ring-teal-500 outline-none transition-all"
                        rows={4}
                      />
                      <div className="flex justify-end gap-3 pt-4">
                        <button className="px-6 py-4 rounded-2xl border border-white/10 text-white font-black text-xs uppercase hover:bg-white/5 transition-all">
                          Tolak Tiket
                        </button>
                        <button className="px-8 py-4 rounded-2xl bg-teal-600 text-white font-black text-xs uppercase hover:bg-teal-700 transition-all shadow-lg shadow-teal-600/30 flex items-center gap-2">
                          <Send size={16} /> Kirim Solusi
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full min-h-[500px] flex flex-col items-center justify-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
            <ShieldAlert size={64} className="text-slate-100 mb-4" />
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
              Pilih tiket komplain untuk dianalisis AI
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
