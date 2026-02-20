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
  LayoutGrid,
  Zap,
} from "lucide-react";
import { useToast } from "../../../../contexts/ToastContext";

export const NotificationManager = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [markets, setMarkets] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);

  // State Form
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    target_role: "ALL",
    target_market_id: "",
  });

  const [aiTopic, setAiTopic] = useState("");

  const fetchData = async () => {
    try {
      const { data: mData } = await supabase.from("markets").select("id, name");
      setMarkets(mData || []);

      const { data: hData } = await supabase
        .from("broadcasts")
        .select("*, markets(name)")
        .order("created_at", { ascending: false })
        .limit(5);
      setHistory(hData || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const generateAIMessage = async () => {
    if (!aiTopic) return showToast("TULIS TOPIK DULU, PAK!", "error");
    setGenerating(true);
    try {
      await new Promise((res) => setTimeout(res, 1200));
      const templates = [
        `📢 *INFO PASARQU*\n\nHALLO JURAGAN! ${aiTopic.toUpperCase()}.\n\nYUK CEK APLIKASINYA SEKARANG! 🚀`,
        `🔥 *PROMO TERBARU*\n\nKABAR GEMBIRA: ${aiTopic.toUpperCase()}. BELANJA MAKIN HEMAT DI PASARQU!\n\nCEK DI SINI: [LINK] ✅`,
      ];
      const result = templates[Math.floor(Math.random() * templates.length)];
      setFormData({
        ...formData,
        title: "UPDATE TERBARU PASARQU",
        message: result,
      });
      showToast("PESAN AI BERHASIL DIBUAT!", "success");
    } catch (err) {
      showToast("AI GAGAL", "error");
    } finally {
      setGenerating(false);
    }
  };

  const handleSend = async () => {
    if (!formData.title || !formData.message)
      return showToast("JUDUL & PESAN WAJIB DIISI!", "error");
    setLoading(true);
    try {
      const { error } = await supabase.from("broadcasts").insert([
        {
          title: formData.title.toUpperCase(),
          message: formData.message,
          target_role: formData.target_role,
          target_market_id: formData.target_market_id || null,
          status: "SENT",
        },
      ]);
      if (error) throw error;
      showToast("NOTIFIKASI BERHASIL DISIARKAN!", "success");
      setFormData({
        title: "",
        message: "",
        target_role: "ALL",
        target_market_id: "",
      });
      fetchData();
    } catch (err: any) {
      showToast("GAGAL: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6 font-black uppercase tracking-tighter text-left bg-slate-50">
      {/* HEADER AREA */}
      <div className="flex items-center justify-between border-b-4 border-[#008080] pb-4">
        <div>
          <h2 className="text-[18px] font-black text-slate-900 flex items-center gap-2">
            <Bell className="text-[#FF6600]" size={22} /> BROADCAST CENTER
          </h2>
          <p className="text-[10px] text-slate-400 mt-1 tracking-widest font-bold">
            SIARKAN PESAN MASSAL KE EKOSISTEM PASARQU
          </p>
        </div>
        <div className="bg-slate-900 text-white px-3 py-1.5 rounded-md text-[9px] font-black flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping"></div>{" "}
          SERVER READY
        </div>
      </div>

      {/* AI MAGIC WRITER PANEL - SUDUT TEGAS */}
      <div className="bg-slate-900 p-6 rounded-md shadow-xl relative overflow-hidden border-b-4 border-[#008080]">
        <Sparkles className="absolute right-[-10px] top-[-10px] text-white/5 w-32 h-32 rotate-12" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4 text-[#008080]">
            <Zap size={18} />
            <h3 className="font-black text-white text-[11px] tracking-widest">
              AI MAGIC WRITER
            </h3>
          </div>
          <div className="flex flex-col md:flex-row gap-3">
            <input
              type="text"
              className="flex-1 bg-white/10 border border-white/20 rounded-md px-4 py-2.5 text-white placeholder:text-slate-500 font-black text-[12px] outline-none focus:bg-white/20 transition-all uppercase"
              placeholder="CONTOH: DISKON DAGING SAPI KHUSUS HARI INI..."
              value={aiTopic}
              onChange={(e) => setAiTopic(e.target.value)}
            />
            <button
              onClick={generateAIMessage}
              disabled={generating}
              className="bg-[#008080] text-white px-6 py-2.5 rounded-md font-black text-[10px] tracking-widest hover:bg-teal-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 border-b-4 border-teal-900"
            >
              {generating ? (
                <RefreshCw className="animate-spin" size={14} />
              ) : (
                <Sparkles size={14} />
              )}
              GENERATE PESAN
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* FORM BROADCAST (KIRI) */}
        <div className="lg:col-span-8 bg-white p-6 rounded-md border border-slate-200 shadow-sm space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-400 tracking-widest ml-1 flex items-center gap-1">
                <Users size={12} /> TARGET AUDIENS
              </label>
              <select
                className="w-full bg-slate-50 border border-slate-200 rounded-md px-4 py-2.5 text-[12px] font-black text-slate-700 outline-none focus:border-[#008080]"
                value={formData.target_role}
                onChange={(e) =>
                  setFormData({ ...formData, target_role: e.target.value })
                }
              >
                <option value="ALL">SEMUA PENGGUNA</option>
                <option value="BUYER">KHUSUS PEMBELI</option>
                <option value="SELLER">MITRA TOKO</option>
                <option value="COURIER">MITRA KURIR</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-400 tracking-widest ml-1 flex items-center gap-1">
                <MapPin size={12} /> WILAYAH SPESIFIK
              </label>
              <select
                className="w-full bg-slate-50 border border-slate-200 rounded-md px-4 py-2.5 text-[12px] font-black text-slate-700 outline-none focus:border-[#008080]"
                value={formData.target_market_id}
                onChange={(e) =>
                  setFormData({ ...formData, target_market_id: e.target.value })
                }
              >
                <option value="">SELURUH INDONESIA (GLOBAL)</option>
                {markets.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-slate-400 tracking-widest ml-1 flex items-center gap-1">
              <Bell size={12} /> JUDUL NOTIFIKASI
            </label>
            <input
              type="text"
              className="w-full bg-slate-50 border border-slate-200 rounded-md px-4 py-2.5 text-[12px] font-black text-slate-800 outline-none focus:border-[#008080] uppercase"
              placeholder="JUDUL PESAN..."
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-slate-400 tracking-widest ml-1 flex items-center gap-1">
              <MessageSquare size={12} /> ISI PESAN (SUPPORT WHATSAPP FORMAT)
            </label>
            <textarea
              rows={5}
              className="w-full bg-slate-50 border border-slate-200 rounded-md px-4 py-3 text-[12px] font-bold text-slate-700 outline-none focus:border-[#008080]"
              placeholder="KONTEN PESAN..."
              value={formData.message}
              onChange={(e) =>
                setFormData({ ...formData, message: e.target.value })
              }
            />
          </div>

          <button
            onClick={handleSend}
            disabled={loading}
            className="w-full py-4 bg-slate-900 text-white rounded-md font-black text-[12px] tracking-widest hover:bg-[#008080] transition-all flex items-center justify-center gap-2 shadow-lg border-b-4 border-black/20 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <Send size={18} />
            )}
            SIARKAN SEKARANG
          </button>
        </div>

        {/* PREVIEW HP (KANAN) - LEBIH RAPAT */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-900 rounded-md p-4 shadow-2xl border-b-[10px] border-[#008080] relative">
            <div className="bg-[#e5ddd5] rounded-md h-[400px] overflow-hidden relative flex flex-col">
              <div className="bg-[#075e54] p-3 flex items-center gap-2 border-b border-black/10">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white text-[10px]">
                  PQ
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-black text-white leading-none">
                    PASARQU ADMIN
                  </p>
                  <p className="text-[8px] text-teal-200 font-bold uppercase">
                    ONLINE
                  </p>
                </div>
              </div>
              <div className="p-4">
                <div className="bg-white p-3 rounded-md rounded-tl-none shadow-md relative border-l-4 border-teal-500">
                  <p className="text-[11px] text-slate-800 whitespace-pre-wrap leading-relaxed font-bold normal-case">
                    {formData.message ||
                      "HASIL PRATINJAU PESAN AKAN MUNCUL DI SINI..."}
                  </p>
                  <p className="text-right text-[8px] text-slate-400 mt-1 font-black">
                    12:00 ✅✅
                  </p>
                </div>
              </div>
            </div>
            <div className="text-center mt-3">
              <p className="text-[9px] font-black text-teal-500 tracking-widest uppercase">
                LIVE PREVIEW
              </p>
            </div>
          </div>

          {/* HISTORY SINGKAT */}
          <div className="bg-white border border-slate-200 rounded-md overflow-hidden">
            <div className="p-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h4 className="text-[9px] font-black text-slate-400 tracking-widest">
                LOG TERAKHIR
              </h4>
              <Clock size={12} className="text-slate-300" />
            </div>
            <div className="divide-y divide-slate-100">
              {history.map((h) => (
                <div
                  key={h.id}
                  className="p-3 hover:bg-slate-50 transition-all"
                >
                  <p className="text-[10px] font-black text-slate-800 truncate">
                    {h.title}
                  </p>
                  <p className="text-[8px] text-slate-400 font-bold uppercase">
                    {h.target_role} •{" "}
                    {new Date(h.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
