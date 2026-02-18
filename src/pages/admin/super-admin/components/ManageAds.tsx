import React, { useEffect, useState } from "react";
import { supabase } from "../../../../lib/supabaseClient";
import {
  Plus,
  Trash2,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  Image as ImageIcon,
  Type,
  Tag,
  Link as LinkIcon,
  Sparkles,
  Wand2,
  RefreshCw,
} from "lucide-react";
import { useToast } from "../../../../contexts/ToastContext";
import { useNavigate } from "react-router-dom";

export const ManageAds = () => {
  const [ads, setAds] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiIdea, setAiIdea] = useState("");
  const { showToast } = useToast();
  const navigate = useNavigate();

  // 1. Ambil data Iklan
  const fetchAds = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("ads")
        .select("*")
        .order("sort_order", { ascending: true });

      if (error) throw error;
      setAds(data || []);
    } catch (err: any) {
      showToast("Gagal memuat iklan: " + err.message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAds();
  }, []);

  // --- FITUR AI: GENERATE KONTEN IKLAN ---
  const generateAdWithAI = async () => {
    if (!aiIdea)
      return showToast("Masukkan topik promo (misal: Diskon Beras)", "error");

    setIsGenerating(true);
    try {
      // Simulasi AI Berpikir (Bisa dihubungkan ke Gemini/OpenAI API)
      await new Promise((res) => setTimeout(res, 1500));

      const variations = [
        {
          title: `🔥 SERBU MURAH: ${aiIdea.toUpperCase()}`,
          tag: "DISKON GILA-GILAAN",
        },
        { title: `✨ Spesial Hari Ini: ${aiIdea}`, tag: "STOK TERBATAS" },
        { title: `📢 INFO PASAR: Promo ${aiIdea} Segar`, tag: "HARGA PETANI" },
        {
          title: `🚀 Cashback Melimpah Untuk ${aiIdea}`,
          tag: "KHUSUS HARI INI",
        },
      ];

      const result = variations[Math.floor(Math.random() * variations.length)];

      // Langsung buat iklan baru dengan hasil AI
      const newAd = {
        title: result.title,
        promo_tag: result.tag,
        image_url:
          "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800",
        link_to: "/",
        sort_order: ads.length + 1,
        is_active: true,
      };

      const { error } = await supabase.from("ads").insert([newAd]);
      if (error) throw error;

      showToast("AI berhasil membuat draf iklan!", "success");
      setAiIdea("");
      fetchAds();
    } catch (err: any) {
      showToast("AI Gagal bekerja: " + err.message, "error");
    } finally {
      setIsGenerating(false);
    }
  };

  // 2. Tambah Iklan Baru (Manual)
  const handleAdd = async () => {
    const newAd = {
      title: "Promo Baru Pasarqu",
      promo_tag: "DISKON TERBATAS",
      image_url:
        "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800",
      link_to: "/",
      sort_order: ads.length + 1,
      is_active: true,
    };

    const { error } = await supabase.from("ads").insert([newAd]);
    if (!error) {
      fetchAds();
      showToast("Iklan baru ditambahkan", "success");
    }
  };

  // 3. Update Data
  const handleUpdate = async (id: string, updates: any) => {
    const { error } = await supabase.from("ads").update(updates).eq("id", id);
    if (!error) {
      showToast("Iklan diperbarui", "success");
      fetchAds();
    }
  };

  // 4. Hapus Iklan
  const handleDelete = async (id: string) => {
    if (window.confirm("Hapus iklan ini?")) {
      const { error } = await supabase.from("ads").delete().eq("id", id);
      if (!error) {
        fetchAds();
        showToast("Iklan dihapus", "success");
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-10 font-sans text-left overflow-y-auto">
      <div className="max-w-[1100px] mx-auto pb-20">
        {/* HEADER AREA */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 text-slate-400 hover:text-teal-600 font-black text-[10px] uppercase tracking-[0.3em] mb-4 transition-all"
            >
              <ArrowLeft size={14} /> Kembali ke Aplikasi
            </button>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-500 rounded-2xl text-white shadow-lg shadow-orange-500/30">
                <ImageIcon size={28} />
              </div>
              <div>
                <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none">
                  Manajemen <span className="text-orange-500">Iklan</span>
                </h1>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">
                  Atur banner promosi depan
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={handleAdd}
            className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <Plus size={18} /> Tambah Manual
          </button>
        </div>

        {/* --- AI AD WRITER PANEL --- */}
        <div className="mb-12 bg-gradient-to-br from-indigo-600 to-violet-700 p-8 rounded-[3rem] shadow-xl shadow-indigo-200 relative overflow-hidden">
          <Sparkles className="absolute right-[-20px] top-[-20px] text-white/10 w-48 h-48 rotate-12" />

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-white/20 backdrop-blur-md rounded-xl text-white">
                <Wand2 size={20} />
              </div>
              <h3 className="font-black text-white uppercase tracking-widest text-xs">
                AI Smart Copywriter
              </h3>
            </div>

            <p className="text-indigo-100 text-[11px] font-bold uppercase mb-6 tracking-tight">
              Masukkan ide promo, AI akan membuatkan copywriting dan
              menambahkannya ke slide.
            </p>

            <div className="flex flex-col md:flex-row gap-3">
              <input
                type="text"
                placeholder="Contoh: Diskon Minyak Goreng 2 Liter..."
                className="flex-1 bg-white/10 border border-white/20 rounded-2xl px-6 py-4 text-white placeholder:text-indigo-200 font-bold text-sm outline-none focus:ring-2 ring-white/50 transition-all"
                value={aiIdea}
                onChange={(e) => setAiIdea(e.target.value)}
              />
              <button
                onClick={generateAdWithAI}
                disabled={isGenerating}
                className="bg-white text-indigo-700 px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-50 transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isGenerating ? (
                  <RefreshCw className="animate-spin" size={16} />
                ) : (
                  <Sparkles size={16} />
                )}
                Buat Iklan AI
              </button>
            </div>
          </div>
        </div>

        {/* CONTENT AREA */}
        {isLoading ? (
          <div className="flex flex-col items-center py-32 bg-white rounded-[3rem] border border-slate-100 shadow-sm">
            <Loader2 className="animate-spin text-orange-500 mb-4" size={48} />
            <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em]">
              Memuat Banner Iklan...
            </p>
          </div>
        ) : (
          <div className="grid gap-8">
            {ads.length === 0 && (
              <div className="bg-white p-20 rounded-[3rem] border-2 border-dashed border-slate-200 text-center text-slate-300 font-black uppercase text-xs tracking-widest">
                Belum ada iklan.
              </div>
            )}

            {ads.map((ad) => (
              <div
                key={ad.id}
                className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col xl:flex-row items-center gap-8 transition-all hover:shadow-xl group relative overflow-hidden"
              >
                {/* PREVIEW */}
                <div className="relative w-full xl:w-[320px] h-[160px] rounded-[1.5rem] overflow-hidden bg-slate-100 shrink-0 shadow-inner">
                  <img
                    src={ad.image_url}
                    className="w-full h-full object-cover"
                    alt="Preview"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-4">
                    <span className="text-[8px] font-black bg-orange-500 text-white px-2 py-1 rounded w-fit mb-1">
                      {ad.promo_tag}
                    </span>
                    <h4 className="text-white font-black text-xs uppercase leading-tight">
                      {ad.title}
                    </h4>
                  </div>
                </div>

                {/* FORM */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 flex-1 w-full">
                  <div className="space-y-1">
                    <label className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      <Type size={12} /> Judul
                    </label>
                    <input
                      type="text"
                      className="w-full bg-slate-50 border-none rounded-2xl px-5 py-3.5 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-orange-500 outline-none"
                      defaultValue={ad.title}
                      onBlur={(e) =>
                        handleUpdate(ad.id, { title: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      <Tag size={12} /> Tag
                    </label>
                    <input
                      type="text"
                      className="w-full bg-slate-50 border-none rounded-2xl px-5 py-3.5 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-orange-500 outline-none"
                      defaultValue={ad.promo_tag}
                      onBlur={(e) =>
                        handleUpdate(ad.id, { promo_tag: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      <ImageIcon size={12} /> Image URL
                    </label>
                    <input
                      type="text"
                      className="w-full bg-slate-50 border-none rounded-2xl px-5 py-3.5 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-orange-500 outline-none"
                      defaultValue={ad.image_url}
                      onBlur={(e) =>
                        handleUpdate(ad.id, { image_url: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      <LinkIcon size={12} /> Link
                    </label>
                    <input
                      type="text"
                      className="w-full bg-slate-50 border-none rounded-2xl px-5 py-3.5 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-orange-500 outline-none"
                      defaultValue={ad.link_to}
                      onBlur={(e) =>
                        handleUpdate(ad.id, { link_to: e.target.value })
                      }
                    />
                  </div>
                </div>

                {/* AKSI */}
                <div className="flex xl:flex-col gap-3 border-l xl:border-l-2 pl-6 border-slate-50">
                  <button
                    onClick={() =>
                      handleUpdate(ad.id, { is_active: !ad.is_active })
                    }
                    className={`p-4 rounded-2xl transition-all shadow-sm ${ad.is_active ? "text-teal-600 bg-teal-50" : "text-slate-300 bg-slate-100"}`}
                  >
                    <CheckCircle2 size={24} />
                  </button>
                  <button
                    onClick={() => handleDelete(ad.id)}
                    className="p-4 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all shadow-sm"
                  >
                    <Trash2 size={24} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
