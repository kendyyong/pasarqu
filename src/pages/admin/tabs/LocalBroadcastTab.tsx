import React, { useState } from "react";
import {
  Megaphone,
  Send,
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Smartphone,
  Sparkles,
  RefreshCw,
  Zap,
} from "lucide-react";
import { supabase } from "../../../lib/supabaseClient";
import { useToast } from "../../../contexts/ToastContext";

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

  // AI States
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");

  // --- FITUR AI COPYWRITER ---
  const generateWithAI = async () => {
    if (!aiPrompt) return showToast("Masukkan topik promo dulu, Gan!", "info");

    setIsGenerating(true);
    try {
      // Simulasi AI Engine (Dapat dihubungkan ke OpenAI/Gemini API)
      await new Promise((res) => setTimeout(res, 2000));

      const promptsMap: { [key: string]: { t: string; m: string } } = {
        diskon: {
          t: "🔥 DISKON SERBU PASAR!",
          m: `Halo warga ${marketName}! Khusus hari ini ada harga miring untuk sayur dan daging segar. Stok terbatas, yuk checkout sekarang sebelum kehabisan!`,
        },
        hujan: {
          t: "🌧️ MAGER KELUAR KARENA HUJAN?",
          m: `Tenang! Kurir Pasarqu siap antar belanjaan dapurmu sampai depan pintu. Tetap nyaman di rumah, biar kami yang belanja ke pasar.`,
        },
        pagi: {
          t: "🌅 SEMANGAT PAGI, BUNDA!",
          m: `Bahan masakan baru saja tiba di pasar! Masih segar-segar banget. Pesan sekarang, langsung kami kirim buat menu makan siang spesial keluarga.`,
        },
      };

      // Logika pemilihan prompt (fallback ke default jika tidak ada keyword)
      const key =
        Object.keys(promptsMap).find((k) =>
          aiPrompt.toLowerCase().includes(k),
        ) || "pagi";
      const result = promptsMap[key];

      setTitle(result.t);
      setMessage(result.m);
      showToast("AI berhasil membuatkan pesan untukmu!", "success");
      setAiPrompt("");
    } catch (err) {
      showToast("AI sedang lelah, coba ketik manual ya.", "error");
    } finally {
      setIsGenerating(false);
    }
  };

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
        {/* PANEL KIRI: AI ASSISTANT & FORM */}
        <div className="lg:col-span-8 space-y-6">
          {/* AI ASSISTANT BOX */}
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
                  onClick={generateWithAI}
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
              <p className="text-[8px] font-bold text-indigo-200 uppercase mt-4 italic tracking-widest opacity-60">
                Tips: Masukkan kata kunci seperti 'hujan', 'diskon', atau 'stok
                baru'
              </p>
            </div>
            <Sparkles
              className="absolute right-[-20px] top-[-20px] text-white/5"
              size={180}
            />
          </div>

          {/* FORM INPUT */}
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

        {/* PANEL KANAN: PREVIEW HP */}
        <div className="lg:col-span-4 space-y-6">
          <div className="sticky top-24">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-4">
              Live Preview
            </p>
            <div className="bg-slate-900 w-full aspect-[9/18] rounded-[3.5rem] border-[8px] border-slate-800 p-6 relative overflow-hidden shadow-2xl ring-4 ring-slate-100">
              {/* Notch */}
              <div className="w-28 h-6 bg-slate-800 mx-auto rounded-b-3xl mb-10"></div>

              {/* Mock Notification Card */}
              <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-5 border border-white/20 animate-in slide-in-from-top-10 duration-1000">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-6 h-6 bg-teal-500 rounded-lg flex items-center justify-center text-[10px] font-black text-white shadow-lg shadow-teal-500/40">
                    P
                  </div>
                  <span className="text-[9px] font-black text-white/80 uppercase tracking-tighter">
                    Pasarqu • {marketName}
                  </span>
                </div>
                <h5 className="text-xs font-black text-white mb-1 truncate leading-none uppercase italic">
                  {title || "Judul Muncul Di Sini"}
                </h5>
                <p className="text-[10px] text-slate-300 line-clamp-3 leading-relaxed font-medium">
                  {message ||
                    "Isi pesan yang Anda tulis akan muncul di layar kunci handphone pembeli..."}
                </p>
              </div>

              {/* Home Indicator */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-24 h-1.5 bg-white/20 rounded-full"></div>
            </div>

            <div className="mt-8 p-6 bg-amber-50 rounded-[2rem] border border-amber-100 flex gap-4 items-center shadow-sm">
              <AlertCircle className="text-amber-500 shrink-0" size={24} />
              <p className="text-[9px] font-bold text-amber-700 uppercase leading-relaxed tracking-wide">
                Pesan akan terkirim secara{" "}
                <span className="underline">Real-Time</span>. Pastikan informasi
                sudah benar sebelum menekan tombol kirim.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
