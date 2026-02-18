import React, { useState } from "react";
import {
  Megaphone,
  Send,
  Users,
  Loader2,
  Sparkles,
  Zap,
  AlertCircle,
} from "lucide-react";
import { supabase } from "../../../../lib/supabaseClient";
import { useToast } from "../../../../contexts/ToastContext";

// ✅ PERBAIKAN 1: Jalur import disesuaikan ke folder pusat src/hooks/
import { useBroadcastAI } from "../../../../hooks/useBroadcastAI";
import { BroadcastPreview } from "./BroadcastPreview";

interface Props {
  marketId: string;
  marketName: string;
  customerCount: number;
}

export const LocalBroadcastTab: React.FC<Props> = ({
  marketId,
  marketName,
  customerCount,
}) => {
  const { showToast } = useToast();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  // Menggunakan Hook AI
  const { aiPrompt, setAiPrompt, isGenerating, generateWithAI } =
    useBroadcastAI(marketName);

  // Fungsi Kirim Broadcast
  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message)
      return showToast("Judul dan pesan harus diisi!", "error");

    setIsSending(true);
    try {
      const { error } = await supabase.from("notifications").insert([
        {
          market_id: marketId,
          title: title,
          content: message,
          type: "BROADCAST",
          sender_role: "LOCAL_ADMIN",
        },
      ]);

      if (error) throw error;

      showToast(
        `Berhasil mengirim broadcast ke ${customerCount} pelanggan!`,
        "success",
      );
      setTitle("");
      setMessage("");
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 text-left pb-20">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter italic flex items-center gap-2">
            <Megaphone className="text-teal-500" /> Broadcast{" "}
            <span className="text-teal-500">Center</span>
          </h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
            Teknologi Siaran Wilayah {marketName}
          </p>
        </div>
        <div className="bg-teal-600 px-6 py-3 rounded-2xl shadow-xl shadow-teal-500/20 flex items-center gap-3 border-b-4 border-teal-800">
          <Users size={18} className="text-teal-200" />
          <span className="text-xs font-black text-white uppercase tracking-widest">
            {customerCount} Warga Terhubung
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* PANEL KIRI */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles size={20} className="text-indigo-300 animate-pulse" />
                <h4 className="text-sm font-black uppercase tracking-widest">
                  AI Copywriter Assistant
                </h4>
              </div>
              <div className="flex flex-col md:flex-row gap-3">
                <input
                  type="text"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Contoh: buat promo sayur pagi hari..."
                  className="flex-1 bg-white/10 border border-white/20 rounded-2xl px-6 py-4 text-xs font-bold placeholder:text-white/40 outline-none focus:bg-white/20 transition-all"
                />
                <button
                  // ✅ PERBAIKAN 2: Menambahkan tipe data string pada parameter (t: string, m: string)
                  onClick={() =>
                    generateWithAI((t: string, m: string) => {
                      setTitle(t);
                      setMessage(m);
                    })
                  }
                  disabled={isGenerating}
                  className="bg-white text-indigo-600 px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-50 active:scale-95 transition-all shadow-lg"
                >
                  {isGenerating ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <Zap size={16} />
                  )}
                  Bantu Buatkan
                </button>
              </div>
            </div>
          </div>

          <form
            onSubmit={handleBroadcast}
            className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-6"
          >
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-4 tracking-widest">
                Judul Notifikasi
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Masukkan judul yang menarik..."
                className="w-full bg-slate-50 border-2 border-transparent rounded-[1.5rem] px-8 py-5 font-black text-slate-700 focus:border-teal-500 focus:bg-white outline-none transition-all italic text-lg"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-4 tracking-widest">
                Isi Pesan Siaran
              </label>
              <textarea
                rows={6}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tuliskan detail pengumuman Anda..."
                className="w-full bg-slate-50 border-2 border-transparent rounded-[2rem] px-8 py-6 font-bold text-slate-700 focus:border-teal-500 focus:bg-white outline-none transition-all resize-none leading-relaxed"
              />
            </div>

            <button
              disabled={isSending || isGenerating}
              className="w-full py-6 bg-slate-900 text-white rounded-[2.5rem] font-black uppercase text-sm tracking-[0.3em] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-4 disabled:opacity-50"
            >
              {isSending ? (
                <Loader2 className="animate-spin" />
              ) : (
                <>
                  <Send size={20} /> PUBLIKASIKAN KE WARGA
                </>
              )}
            </button>
          </form>
        </div>

        {/* PANEL KANAN */}
        <div className="lg:col-span-4 space-y-6">
          <div className="sticky top-24">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-4">
              Live Preview
            </p>

            <BroadcastPreview
              marketName={marketName}
              title={title}
              message={message}
            />

            <div className="mt-8 p-6 bg-amber-50 rounded-[2rem] border border-amber-100 flex gap-4 items-center shadow-sm">
              <AlertCircle className="text-amber-500 shrink-0" size={24} />
              <p className="text-[9px] font-bold text-amber-700 uppercase leading-relaxed tracking-wide">
                Pesan akan terkirim secara{" "}
                <span className="underline">Real-Time</span>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
