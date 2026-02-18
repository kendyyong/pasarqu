import React, { useEffect, useState } from "react";
import { supabase } from "../../../../lib/supabaseClient";
import {
  Bell,
  Send,
  Users,
  MapPin,
  Smartphone,
  MessageSquare,
  Clock,
  CheckCircle2,
  Loader2,
  Sparkles,
  RefreshCw,
  Copy,
} from "lucide-react";
import { useToast } from "../../../../contexts/ToastContext";
import { createAuditLog } from "../../../../lib/auditHelper";

export const NotificationManager = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false); // State untuk AI
  const [markets, setMarkets] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);

  // State Form
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    target_role: "ALL",
    target_market_id: "",
  });

  const [aiTopic, setAiTopic] = useState(""); // Input perintah AI

  // 1. Fetch Data Awal
  const fetchData = async () => {
    try {
      const { data: mData } = await supabase.from("markets").select("id, name");
      setMarkets(mData || []);

      const { data: hData } = await supabase
        .from("broadcasts")
        .select("*, markets(name)")
        .order("created_at", { ascending: false })
        .limit(10);
      setHistory(hData || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- FITUR AI MAGIC WRITER ---
  const generateAIMessage = async () => {
    if (!aiTopic) {
      showToast("Tuliskan topik atau perintah untuk AI!", "error");
      return;
    }

    setGenerating(true);
    try {
      /**
       * SIMULASI LOGIKA AI (Bisa dihubungkan ke Edge Function Supabase / OpenAI API)
       * Di sini saya buatkan template generator cerdas berdasarkan kata kunci
       */
      await new Promise((res) => setTimeout(res, 1500)); // Delay efek berpikir

      const templates = [
        `📢 *INFO PASARQU*\n\nHallo Juragan! ${aiTopic}.\n\nJangan sampai ketinggalan ya, yuk cek aplikasinya sekarang! 🚀`,
        `🔥 *PROMO TERBARU*\n\nAda kabar gembira: ${aiTopic}. Belanja makin hemat cuma di PasarQu!\n\nKlik di sini: [LinkAplikasi] ✅`,
        `👋 *HALO MITRA PASARQU*\n\nAdmin ingin menginfokan bahwa ${aiTopic}.\n\nTetap semangat dan jaga kesehatan ya! 🙏`,
      ];

      const result = templates[Math.floor(Math.random() * templates.length)];

      setFormData({
        ...formData,
        title: "Update Terbaru PasarQu",
        message: result,
      });

      showToast("Pesan AI berhasil dibuat!", "success");
    } catch (err) {
      showToast("Gagal memanggil AI", "error");
    } finally {
      setGenerating(false);
    }
  };

  // 2. Kirim Broadcast
  const handleSend = async () => {
    if (!formData.title || !formData.message) {
      showToast("Judul dan Pesan wajib diisi!", "error");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        title: formData.title,
        message: formData.message,
        target_role: formData.target_role,
        target_market_id: formData.target_market_id || null,
        status: "SENT",
      };

      const { error } = await supabase.from("broadcasts").insert([payload]);
      if (error) throw error;

      await createAuditLog(
        "SEND_BROADCAST",
        "MARKETING",
        `Mengirim broadcast "${formData.title}" kepada target ${formData.target_role}`,
      );

      showToast("Notifikasi berhasil dikirim!", "success");
      setFormData({
        title: "",
        message: "",
        target_role: "ALL",
        target_market_id: "",
      });
      fetchData();
    } catch (err: any) {
      showToast("Gagal mengirim: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in pb-20 text-left">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter">
            Broadcast Center
          </h2>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
            Kirim Notifikasi & WA massal dengan bantuan AI
          </p>
        </div>
      </div>

      {/* --- PANEL AI HELPER --- */}
      <div className="bg-gradient-to-r from-teal-600 to-teal-800 p-8 rounded-[2.5rem] shadow-xl shadow-teal-600/20 relative overflow-hidden">
        <Sparkles className="absolute right-[-20px] top-[-20px] text-white/10 w-40 h-40 rotate-12" />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-white/20 backdrop-blur-md rounded-lg flex items-center justify-center text-white">
              <Sparkles size={18} />
            </div>
            <h3 className="font-black text-white uppercase tracking-widest text-xs">
              AI Magic Writer
            </h3>
          </div>

          <div className="flex flex-col md:flex-row gap-3">
            <input
              type="text"
              className="flex-1 bg-white/10 border border-white/20 rounded-2xl px-6 py-3 text-white placeholder:text-teal-200 outline-none focus:ring-2 focus:ring-white/50 font-bold text-sm"
              placeholder="Contoh: Promo diskon ayam potong khusus besok pagi..."
              value={aiTopic}
              onChange={(e) => setAiTopic(e.target.value)}
            />
            <button
              onClick={generateAIMessage}
              disabled={generating}
              className="bg-white text-teal-700 px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-teal-50 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {generating ? (
                <RefreshCw className="animate-spin" size={16} />
              ) : (
                <Sparkles size={16} />
              )}
              Generate Pesan
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
            <div className="space-y-6">
              {/* Target Audience */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                    <Users size={12} /> Target User
                  </label>
                  <select
                    className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
                    value={formData.target_role}
                    onChange={(e) =>
                      setFormData({ ...formData, target_role: e.target.value })
                    }
                  >
                    <option value="ALL">Semua Pengguna</option>
                    <option value="BUYER">Hanya Pembeli</option>
                    <option value="SELLER">Hanya Mitra Toko</option>
                    <option value="COURIER">Hanya Mitra Kurir</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                    <MapPin size={12} /> Target Wilayah
                  </label>
                  <select
                    className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
                    value={formData.target_market_id}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        target_market_id: e.target.value,
                      })
                    }
                  >
                    <option value="">Global (Seluruh Indonesia)</option>
                    {markets.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Konten Pesan */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                  <Bell size={12} /> Judul Notifikasi
                </label>
                <input
                  type="text"
                  className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="Judul otomatis dari AI..."
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                  <MessageSquare size={12} /> Isi Pesan (Format WhatsApp)
                </label>
                <textarea
                  rows={6}
                  className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="Hasil generate AI akan muncul di sini..."
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  onClick={handleSend}
                  disabled={loading}
                  className="bg-teal-600 text-white px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-teal-700 flex items-center gap-2 shadow-lg shadow-teal-600/20 active:scale-95 transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <Send size={16} />
                  )}
                  Kirim Broadcast
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* KOLOM KANAN: PREVIEW HP (Live WhatsApp Preview) */}
        <div className="lg:col-span-1">
          <div className="sticky top-24">
            <div className="bg-slate-900 rounded-[3rem] p-4 shadow-2xl border-4 border-slate-800 max-w-[300px] mx-auto relative">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-800 rounded-b-2xl z-20"></div>

              <div className="bg-[#e5ddd5] rounded-[2.5rem] h-[550px] overflow-hidden relative flex flex-col pt-10">
                {/* Header WA Mockup */}
                <div className="bg-[#075e54] p-3 flex items-center gap-2">
                  <div className="w-8 h-8 bg-slate-300 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-[10px] font-bold text-white leading-none">
                      PasarQu Admin
                    </p>
                    <p className="text-[8px] text-teal-100">Online</p>
                  </div>
                </div>

                {/* Bubble Chat */}
                <div className="p-4">
                  <div className="bg-white p-3 rounded-xl rounded-tl-none shadow-sm relative animate-in fade-in slide-in-from-left-4 duration-500">
                    <p className="text-[11px] text-slate-800 whitespace-pre-wrap leading-relaxed">
                      {formData.message ||
                        "Halo! Hasil draf pesan AI Anda akan tampil cantik di sini dengan format WhatsApp..."}
                    </p>
                    <p className="text-right text-[8px] text-slate-400 mt-1">
                      12:00 ✅✅
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="text-center mt-6">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Live WhatsApp Preview
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
