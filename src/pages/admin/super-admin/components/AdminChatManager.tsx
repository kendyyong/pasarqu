import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../../../../lib/supabaseClient";
import { useAuth } from "../../../../contexts/AuthContext";
import { useToast } from "../../../../contexts/ToastContext";
import {
  Send,
  MessageSquare,
  Loader2,
  Clock,
  RefreshCw,
  Sparkles,
  BrainCircuit,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

// 🧠 KNOWLEDGE BASE PASARQU (Untuk Otak AI)
const PASARQU_KNOWLEDGE = {
  shipping:
    "Pengiriman jam 06.00-10.00 WIB pagi. Pesanan lewat jam 09.00 dikirim besok.",
  refund:
    "Komplain barang busuk maksimal 2 jam setelah diterima melalui pusat resolusi.",
  badges:
    "Regular (Biasa), Verified (Terverifikasi), Star (Penjual Jempolan), Official (Resmi).",
  target:
    "Mendigitalisasi pasar tradisional Indonesia agar bisa bersaing dengan ritel modern.",
};

export const AdminChatManager = () => {
  const { user } = useAuth() as any;
  const { showToast } = useToast();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages();
    const channel = supabase
      .channel("admin-chat-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages" },
        () => {
          fetchMessages();
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from("chat_messages")
        .select(`id, message, sender_id, created_at, profiles ( full_name )`)
        .order("created_at", { ascending: true });
      if (error) throw error;
      setMessages(data || []);
    } catch (err) {
      showToast("Gagal memuat pesan", "error");
    } finally {
      setLoading(false);
    }
  };

  // 🚀 FUNGSI ANALISIS AI (Simulasi Logika AI Pasarqu)
  const analyzeWithAI = (msg: string) => {
    setIsAnalyzing(true);
    setAiAnalysis(null);

    // Simulasi Berpikir AI (Bisa dihubungkan ke API Gemini/OpenAI nantinya)
    setTimeout(() => {
      let analysis = {
        category: "PERTANYAAN UMUM",
        sentiment: "NETRAL",
        suggestion: "Berikan jawaban sesuai prosedur standar.",
        urgency: "LOW",
      };

      const lowerMsg = msg.toLowerCase();
      if (
        lowerMsg.includes("busuk") ||
        lowerMsg.includes("kecewa") ||
        lowerMsg.includes("lambat")
      ) {
        analysis = {
          category: "KOMPLAIN LAYANAN",
          sentiment: "NEGATIF",
          suggestion:
            "Segera minta foto bukti barang dan arahkan ke refund 2 jam sesuai aturan Pasarqu.",
          urgency: "HIGH",
        };
      } else if (
        lowerMsg.includes("kirim") ||
        lowerMsg.includes("jam berapa")
      ) {
        analysis = {
          category: "LOGISTIK",
          sentiment: "BERTANYA",
          suggestion: `Infokan pengiriman jam 06.00-10.00 WIB. Saat ini status kurir sedang sibuk.`,
          urgency: "MEDIUM",
        };
      }

      setAiAnalysis(analysis);
      setIsAnalyzing(false);
    }, 1500);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;
    try {
      await supabase
        .from("chat_messages")
        .insert([{ sender_id: user.id, message: newMessage.trim() }]);
      setNewMessage("");
    } catch (err) {
      showToast("Gagal membalas", "error");
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-180px)] gap-4 font-black uppercase tracking-tighter">
      {/* AREA CHAT (KIRI) */}
      <div className="flex-1 flex flex-col bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#008080] text-white rounded-xl flex items-center justify-center">
              <MessageSquare size={20} />
            </div>
            <div className="text-left leading-none">
              <h2 className="text-sm">Pusat Pesan</h2>
              <p className="text-[9px] text-slate-400 mt-1">REALTIME CHAT</p>
            </div>
          </div>
          <button onClick={fetchMessages} className="p-2 text-slate-400">
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar bg-slate-50/30">
          {messages.map((msg) => {
            const isMe = msg.sender_id === user?.id;
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
              >
                <div
                  onClick={() => !isMe && analyzeWithAI(msg.message)}
                  className={`max-w-[80%] p-4 rounded-2xl cursor-pointer border transition-all ${
                    isMe
                      ? "bg-[#008080] text-white border-[#008080] rounded-tr-none"
                      : "bg-white text-slate-800 border-slate-200 rounded-tl-none hover:border-teal-400"
                  }`}
                >
                  <p className="text-[11px] font-bold normal-case leading-relaxed">
                    {msg.message}
                  </p>
                  <div
                    className={`flex items-center gap-1 mt-2 text-[8px] font-black ${isMe ? "text-teal-200" : "text-slate-400"}`}
                  >
                    <Clock size={10} />{" "}
                    {new Date(msg.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {!isMe && (
                      <span className="ml-2 text-teal-600 flex items-center gap-1">
                        <Sparkles size={10} /> SCAN AI
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={scrollRef} />
        </div>

        <form
          onSubmit={handleSendMessage}
          className="p-5 bg-white border-t border-slate-100 flex items-center gap-3"
        >
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Tulis balasan..."
            className="flex-1 bg-slate-50 border-none rounded-xl px-5 py-4 text-xs font-bold outline-none normal-case"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="p-4 bg-slate-900 text-white rounded-xl hover:bg-[#008080] transition-all"
          >
            <Send size={20} />
          </button>
        </form>
      </div>

      {/* AREA AI ANALYSIS (KANAN) */}
      <div className="w-full lg:w-80 bg-slate-900 rounded-[2rem] p-6 text-white flex flex-col gap-6 shadow-2xl">
        <div className="flex items-center gap-3 border-b border-white/10 pb-4">
          <div className="p-2 bg-teal-500 rounded-lg animate-pulse">
            <BrainCircuit size={20} />
          </div>
          <h3 className="text-xs font-black tracking-widest text-teal-400">
            PASARQU AI INSIGHTS
          </h3>
        </div>

        {isAnalyzing ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
            <Loader2 className="animate-spin text-teal-400" size={32} />
            <p className="text-[10px] font-bold tracking-[0.3em] text-slate-400">
              SEDANG MENGANALISA MASALAH...
            </p>
          </div>
        ) : aiAnalysis ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div>
              <p className="text-[8px] text-slate-500 mb-2">
                KATEGORI MASALAH:
              </p>
              <span
                className={`px-3 py-1 rounded-full text-[9px] font-black ${aiAnalysis.urgency === "HIGH" ? "bg-red-500 text-white" : "bg-teal-500/20 text-teal-400"}`}
              >
                {aiAnalysis.category}
              </span>
            </div>

            <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
              <p className="text-[8px] text-slate-500 mb-2">SARAN SOLUSI AI:</p>
              <p className="text-[11px] font-bold normal-case text-slate-200 leading-relaxed italic">
                "{aiAnalysis.suggestion}"
              </p>
            </div>

            <div className="flex items-center gap-3 p-4 bg-teal-500/10 rounded-2xl border border-teal-500/20">
              <AlertCircle size={20} className="text-teal-400 shrink-0" />
              <p className="text-[9px] font-black text-teal-100">
                AI MENYARANKAN BALASAN RAMAH UNTUK MENJAGA REPUTASI TOKO.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center opacity-30 gap-4">
            <Sparkles size={40} />
            <p className="text-[10px] font-bold leading-relaxed">
              KLIK PADA SALAH SATU PESAN PELANGGAN UNTUK MEMULAI ANALISIS AI
            </p>
          </div>
        )}

        <div className="mt-auto pt-4 border-t border-white/10">
          <div className="flex items-center justify-between text-[8px] font-black text-slate-500">
            <span>PASARQU AI CORE V1.0</span>
            <CheckCircle2 size={12} className="text-teal-500" />
          </div>
        </div>
      </div>
    </div>
  );
};
