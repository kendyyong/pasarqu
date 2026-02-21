import React, { useState } from "react";
import {
  Megaphone,
  Send,
  Users,
  Loader2,
  Sparkles,
  Zap,
  AlertCircle,
  Info,
} from "lucide-react";
import { supabase } from "../../../../lib/supabaseClient";
import { useToast } from "../../../../contexts/ToastContext";
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

  // MENGGUNAKAN HOOK AI
  const { aiPrompt, setAiPrompt, isGenerating, generateWithAI } =
    useBroadcastAI(marketName);

  // FUNGSI KIRIM BROADCAST
  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message) {
      return showToast("JUDUL DAN PESAN HARUS DIISI!", "error");
    }

    if (
      !window.confirm(
        `KIRIM SIARAN INI KE ${customerCount} WARGA DI ${marketName}?`,
      )
    )
      return;

    setIsSending(true);
    try {
      const { error } = await supabase.from("notifications").insert([
        {
          market_id: marketId,
          title: title.toUpperCase(),
          content: message,
          type: "BROADCAST",
          sender_role: "LOCAL_ADMIN",
        },
      ]);

      if (error) throw error;

      showToast(
        `BERHASIL MENGIRIM BROADCAST KE ${customerCount} PELANGGAN!`,
        "success",
      );
      setTitle("");
      setMessage("");
    } catch (err: any) {
      showToast("GAGAL: " + err.message, "error");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-500 font-black uppercase tracking-tighter text-left pb-20">
      {/* 🛠️ HEADER TOOLBAR - INDUSTRIAL STYLE */}
      <div className="bg-slate-900 p-4 rounded-xl flex flex-col md:flex-row justify-between items-center gap-4 border-b-4 border-[#008080] shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#008080] rounded-lg flex items-center justify-center text-white shadow-lg">
            <Megaphone size={20} />
          </div>
          <div>
            <h2 className="text-white text-[12px] leading-none">
              COMMAND CENTER SIARAN
            </h2>
            <p className="text-[#008080] text-[10px] mt-1 tracking-widest">
              NODE: {marketName}
            </p>
          </div>
        </div>

        <div className="bg-slate-800 px-4 py-2 rounded-lg border border-slate-700 flex items-center gap-3">
          <Users size={16} className="text-[#FF6600]" />
          <span className="text-[#FF6600] text-[12px]">
            {customerCount} PENERIMA TERHUBUNG
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* PANEL KIRI: EDITOR & AI */}
        <div className="lg:col-span-8 space-y-4">
          {/* AI COPYWRITER PANEL - INDIGO INDUSTRIAL */}
          <div className="bg-indigo-900 p-6 rounded-xl border-b-4 border-indigo-700 shadow-xl relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles size={18} className="text-indigo-400" />
                <h4 className="text-white text-[11px] tracking-widest">
                  AI COPYWRITER ASSISTANT
                </h4>
              </div>
              <div className="flex flex-col md:flex-row gap-2">
                <input
                  type="text"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="CONTOH: BUAT PROMO DISKON SAYUR PAGI..."
                  className="flex-1 bg-slate-900/50 border-2 border-indigo-500/30 rounded-lg px-4 py-3 text-[12px] text-white placeholder:text-indigo-300/30 outline-none focus:border-indigo-400 transition-all"
                />
                <button
                  onClick={() =>
                    generateWithAI((t: string, m: string) => {
                      setTitle(t);
                      setMessage(m);
                    })
                  }
                  disabled={isGenerating}
                  className="bg-white text-indigo-900 px-6 py-3 rounded-lg font-black text-[11px] tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-100 active:scale-95 transition-all shadow-lg disabled:bg-slate-400"
                >
                  {isGenerating ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <Zap size={16} />
                  )}
                  BANTU BUATKAN
                </button>
              </div>
            </div>
          </div>

          {/* MAIN FORM */}
          <form
            onSubmit={handleBroadcast}
            className="bg-white p-6 rounded-xl border-2 border-slate-200 shadow-sm space-y-5"
          >
            <div className="space-y-2">
              <label className="text-[10px] text-slate-400 ml-1 tracking-widest">
                JUDUL NOTIFIKASI (TAMPIL DI STATUS BAR)
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="MASUKKAN JUDUL PESAN..."
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-lg px-4 py-4 text-[14px] font-black text-slate-800 outline-none focus:border-[#008080] transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] text-slate-400 ml-1 tracking-widest">
                KONTEN PESAN SIARAN
              </label>
              <textarea
                rows={6}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="TULISKAN DETAIL INFORMASI UNTUK WARGA..."
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-lg px-4 py-4 text-[12px] font-bold text-slate-700 outline-none focus:border-[#008080] transition-all resize-none leading-relaxed normal-case"
              />
            </div>

            <button
              disabled={isSending || isGenerating}
              className="w-full py-5 bg-slate-900 text-white rounded-lg font-black text-[12px] tracking-[0.2em] shadow-xl hover:bg-[#008080] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:bg-slate-300"
            >
              {isSending ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  <Send size={18} /> PUBLIKASIKAN KE WARGA
                </>
              )}
            </button>
          </form>
        </div>

        {/* PANEL KANAN: PREVIEW */}
        <div className="lg:col-span-4 space-y-4">
          <div className="sticky top-24">
            <div className="flex items-center gap-2 mb-3 ml-2">
              <Info size={14} className="text-[#008080]" />
              <p className="text-[10px] text-slate-400 tracking-widest">
                LIVE PREVIEW DEVICE
              </p>
            </div>

            <BroadcastPreview
              marketName={marketName}
              title={title}
              message={message}
            />

            <div className="mt-6 p-4 bg-orange-50 border-2 border-orange-100 rounded-xl flex gap-3 items-start shadow-sm">
              <AlertCircle
                className="text-[#FF6600] shrink-0 mt-0.5"
                size={20}
              />
              <p className="text-[10px] text-orange-900 leading-tight font-black">
                PENGIRIMAN REAL-TIME: PESAN AKAN LANGSUNG MUNCUL PADA PERANGKAT
                PENERIMA TANPA DELAY. PASTIKAN DATA VALID.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ⚙️ FOOTER STATUS */}
      <div className="p-4 bg-slate-50 border-2 border-slate-200 rounded-xl flex items-center gap-4">
        <div className="w-2 h-2 rounded-full bg-green-500 animate-ping"></div>
        <p className="text-[12px] text-slate-600 font-black">
          SISTEM SIARAN AKTIF: MENGGUNAKAN PROTOKOL PUSH NOTIFICATION NODE MUARA
          JAWA.
        </p>
      </div>
    </div>
  );
};
