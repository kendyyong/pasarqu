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
      showToast("GAGAL MEMUAT IKLAN", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAds();
  }, []);

  const generateAdWithAI = async () => {
    if (!aiIdea) return showToast("MASUKKAN TOPIK PROMO", "error");
    setIsGenerating(true);
    try {
      await new Promise((res) => setTimeout(res, 1000));
      const variations = [
        { title: `🔥 SERBU: ${aiIdea.toUpperCase()}`, tag: "DISKON BESAR" },
        { title: `✨ SPESIAL: ${aiIdea.toUpperCase()}`, tag: "TERBATAS" },
      ];
      const result = variations[Math.floor(Math.random() * variations.length)];

      const { error } = await supabase.from("ads").insert([
        {
          title: result.title,
          promo_tag: result.tag,
          image_url:
            "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800",
          link_to: "/",
          sort_order: ads.length + 1,
          is_active: true,
        },
      ]);

      if (error) throw error;
      showToast("AI BERHASIL MEMBUAT IKLAN", "success");
      setAiIdea("");
      fetchAds();
    } catch (err: any) {
      showToast("AI GAGAL", "error");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUpdate = async (id: string, updates: any) => {
    const { error } = await supabase.from("ads").update(updates).eq("id", id);
    if (!error) {
      showToast("TERSIMPAM", "success");
      fetchAds();
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("HAPUS IKLAN?")) {
      const { error } = await supabase.from("ads").delete().eq("id", id);
      if (!error) {
        fetchAds();
        showToast("DIHAPUS", "success");
      }
    }
  };

  return (
    // 🚩 PERBAIKAN: Menghapus min-h-screen dan pb-20 agar tidak terlalu banyak ruang kosong di bawah
    <div className="p-4 md:p-6 font-black uppercase tracking-tighter text-left bg-slate-50">
      <div className="max-w-[1200px] mx-auto">
        {/* HEADER AREA - Dibuat lebih rapat (mb-6) */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 border-b-4 border-[#008080] pb-4">
          <div>
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 text-slate-400 hover:text-[#008080] text-[9px] tracking-widest mb-2 transition-all"
            >
              <ArrowLeft size={12} /> KEMBALI
            </button>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-900 rounded-md text-white shadow-md">
                <ImageIcon size={20} />
              </div>
              <h1 className="text-xl font-black text-slate-900 leading-none">
                MANAJEMEN <span className="text-[#FF6600]">IKLAN</span>
              </h1>
            </div>
          </div>
          <button
            onClick={() => {}}
            className="bg-slate-900 hover:bg-[#008080] text-white px-6 py-2.5 rounded-md font-black text-[11px] flex items-center gap-2 border-b-4 border-black/20"
          >
            <Plus size={16} /> TAMBAH MANUAL
          </button>
        </div>

        {/* AI PANEL - Lebih tipis (p-5 & mb-6) */}
        <div className="mb-6 bg-indigo-900 p-5 rounded-md shadow-lg relative overflow-hidden border-b-4 border-indigo-500">
          <div className="relative z-10 flex flex-col md:flex-row gap-4 items-center">
            <div className="flex items-center gap-2 shrink-0">
              <Wand2 className="text-indigo-400" size={18} />
              <h3 className="font-black text-white text-[10px]">
                AI COPYWRITER
              </h3>
            </div>
            <input
              type="text"
              placeholder="IDE PROMO..."
              className="flex-1 bg-white/10 border border-white/20 rounded-md px-4 py-2.5 text-white placeholder:text-indigo-300 font-black text-[11px] outline-none"
              value={aiIdea}
              onChange={(e) => setAiIdea(e.target.value)}
            />
            <button
              onClick={generateAdWithAI}
              disabled={isGenerating}
              className="bg-white text-indigo-900 px-6 py-2.5 rounded-md font-black text-[10px] flex items-center gap-2 border-b-4 border-indigo-200"
            >
              {isGenerating ? (
                <RefreshCw className="animate-spin" size={14} />
              ) : (
                <Sparkles size={14} />
              )}
              GENERATE
            </button>
          </div>
        </div>

        {/* LIST IKLAN - Jarak antar item lebih rapat (gap-4) */}
        {isLoading ? (
          <div className="py-20 text-center">
            <Loader2 className="animate-spin text-[#008080] mx-auto" />
          </div>
        ) : (
          <div className="grid gap-4">
            {ads.map((ad) => (
              <div
                key={ad.id}
                className="bg-white p-4 rounded-md shadow-sm border border-slate-200 flex flex-col xl:flex-row items-center gap-6 hover:border-[#008080] transition-all"
              >
                {/* PREVIEW */}
                <div className="relative w-full xl:w-[280px] h-[140px] rounded-md overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                  <img
                    src={ad.image_url}
                    className="w-full h-full object-cover"
                    alt=""
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-3">
                    <span className="text-[8px] font-black bg-[#FF6600] text-white px-1.5 py-0.5 rounded w-fit mb-1">
                      {ad.promo_tag}
                    </span>
                    <h4 className="text-white font-black text-[11px] uppercase truncate">
                      {ad.title}
                    </h4>
                  </div>
                </div>

                {/* FORM */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1 w-full">
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase">
                      JUDUL
                    </label>
                    <input
                      className="w-full bg-slate-50 border border-slate-100 rounded-md px-3 py-2 text-[11px] font-black uppercase"
                      defaultValue={ad.title}
                      onBlur={(e) =>
                        handleUpdate(ad.id, {
                          title: e.target.value.toUpperCase(),
                        })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase">
                      TAG
                    </label>
                    <input
                      className="w-full bg-slate-50 border border-slate-100 rounded-md px-3 py-2 text-[11px] font-black uppercase"
                      defaultValue={ad.promo_tag}
                      onBlur={(e) =>
                        handleUpdate(ad.id, {
                          promo_tag: e.target.value.toUpperCase(),
                        })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase">
                      IMAGE URL
                    </label>
                    <input
                      className="w-full bg-slate-50 border border-slate-100 rounded-md px-3 py-2 text-[11px] font-black"
                      defaultValue={ad.image_url}
                      onBlur={(e) =>
                        handleUpdate(ad.id, { image_url: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase">
                      TARGET LINK
                    </label>
                    <input
                      className="w-full bg-slate-50 border border-slate-100 rounded-md px-3 py-2 text-[11px] font-black"
                      defaultValue={ad.link_to}
                      onBlur={(e) =>
                        handleUpdate(ad.id, { link_to: e.target.value })
                      }
                    />
                  </div>
                </div>

                {/* AKSI */}
                <div className="flex xl:flex-col gap-2 border-l xl:border-l pl-4 border-slate-100">
                  <button
                    onClick={() =>
                      handleUpdate(ad.id, { is_active: !ad.is_active })
                    }
                    className={`p-2 rounded-md ${ad.is_active ? "text-teal-600 bg-teal-50" : "text-slate-300 bg-slate-50"}`}
                  >
                    <CheckCircle2 size={20} />
                  </button>
                  <button
                    onClick={() => handleDelete(ad.id)}
                    className="p-2 text-slate-300 hover:text-red-600"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* FOOTER NOTICE - Dibuat lebih tipis (mt-6) */}
        <div className="mt-6 bg-slate-900 p-3 rounded-md text-center border-b-4 border-[#FF6600]">
          <p className="text-[9px] text-white/50 font-black tracking-widest uppercase">
            SINKRONISASI GLOBAL AKTIF
          </p>
        </div>
      </div>
    </div>
  );
};
