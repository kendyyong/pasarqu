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
  Upload,
  Info, // 🚀 Tambahan ikon Info untuk catatan
} from "lucide-react";
import { useToast } from "../../../../contexts/ToastContext";
import { useNavigate } from "react-router-dom";

export const ManageAds = () => {
  const [ads, setAds] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState<string | null>(null);
  const [aiIdea, setAiIdea] = useState("");
  const { showToast } = useToast();
  const navigate = useNavigate();

  // --- FETCH DATA IKLAN ---
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

  // --- FUNGSI TAMBAH MANUAL BARU ---
  const handleAddManual = async () => {
    try {
      const { error } = await supabase.from("ads").insert([
        {
          title: "IKLAN BARU",
          promo_tag: "PROMO",
          image_url:
            "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800",
          link_to: "/",
          sort_order: ads.length + 1,
          is_active: false,
        },
      ]);

      if (error) throw error;
      showToast("DRAF IKLAN DIBUAT", "success");
      fetchAds();
    } catch (err) {
      console.error(err);
      showToast("GAGAL MENAMBAH IKLAN", "error");
    }
  };

  // --- FUNGSI GENERATE AI ---
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

  // --- FUNGSI UPLOAD GAMBAR ---
  const handleImageUpload = async (id: string, file: File) => {
    if (!file) return;
    setIsUploading(id);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${id}-${Date.now()}.${fileExt}`;
      const filePath = `banners/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("ads")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("ads").getPublicUrl(filePath);

      await handleUpdate(id, { image_url: data.publicUrl });
      showToast("GAMBAR BERHASIL DIUNGGAH", "success");
    } catch (err: any) {
      console.error(err);
      showToast("GAGAL MENGUNGGAH GAMBAR", "error");
    } finally {
      setIsUploading(null);
    }
  };

  // --- FUNGSI UPDATE DATA ---
  const handleUpdate = async (id: string, updates: any) => {
    const { error } = await supabase.from("ads").update(updates).eq("id", id);
    if (!error) {
      showToast("TERSIMPAN", "success");
      fetchAds();
    }
  };

  // --- FUNGSI HAPUS ---
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
    <div className="p-4 md:p-6 font-black uppercase tracking-tighter text-left bg-slate-50">
      <div className="max-w-[1200px] mx-auto">
        {/* HEADER AREA */}
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
            onClick={handleAddManual}
            className="bg-slate-900 hover:bg-[#008080] text-white px-6 py-2.5 rounded-md font-black text-[11px] flex items-center gap-2 border-b-4 border-black/20 transition-all active:scale-95"
          >
            <Plus size={16} /> TAMBAH MANUAL
          </button>
        </div>

        {/* 🚀 CATATAN UKURAN GAMBAR (NEW) */}
        <div className="mb-4 bg-orange-50 border border-orange-200 p-4 rounded-md flex items-start gap-3">
          <Info size={20} className="text-[#FF6600] shrink-0 mt-0.5" />
          <div>
            <h4 className="text-[11px] text-[#FF6600] font-black tracking-widest">
              PANDUAN UKURAN GAMBAR IKLAN
            </h4>
            <p className="text-[10px] text-slate-600 font-bold mt-1 leading-relaxed">
              Untuk tampilan slider yang sempurna dan tidak terpotong di
              aplikasi, gunakan gambar dengan rasio melebar (Landscape){" "}
              <strong>2:1</strong>. <br />
              Ukuran resolusi terbaik yang direkomendasikan adalah:{" "}
              <span className="bg-white px-2 py-0.5 rounded text-[#008080] border border-slate-200">
                1200 x 600 Pixels
              </span>{" "}
              atau{" "}
              <span className="bg-white px-2 py-0.5 rounded text-[#008080] border border-slate-200">
                800 x 400 Pixels
              </span>
              .
            </p>
          </div>
        </div>

        {/* AI PANEL */}
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
              className="bg-white text-indigo-900 px-6 py-2.5 rounded-md font-black text-[10px] flex items-center gap-2 border-b-4 border-indigo-200 active:scale-95 transition-all"
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

        {/* LIST IKLAN */}
        {isLoading ? (
          <div className="py-20 text-center">
            <Loader2
              className="animate-spin text-[#008080] mx-auto"
              size={40}
            />
            <p className="mt-4 text-[10px] text-slate-400 font-black tracking-widest">
              MEMUAT DATA IKLAN...
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {ads.map((ad, index) => (
              <div
                key={ad.id}
                className={`bg-white p-4 rounded-md shadow-sm border flex flex-col xl:flex-row items-center gap-6 transition-all relative ${
                  ad.is_active
                    ? "border-[#008080]"
                    : "border-slate-200 opacity-70"
                }`}
              >
                {/* Lencana Urutan */}
                <div className="absolute -left-2 -top-2 bg-slate-900 text-white w-6 h-6 rounded flex items-center justify-center text-[10px] font-black shadow-md z-10">
                  {index + 1}
                </div>

                {/* PREVIEW GAMBAR - Menggunakan object-contain agar menyesuaikan frame tanpa dipotong */}
                <div className="relative w-full xl:w-[280px] h-[140px] rounded-md overflow-hidden bg-slate-200 shrink-0 border border-slate-300 group">
                  <img
                    src={ad.image_url}
                    className="w-full h-full object-contain"
                    alt="Preview Iklan"
                  />

                  {/* Overlay gradien untuk memperjelas teks preview */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-3 pointer-events-none">
                    <span className="text-[8px] font-black bg-[#FF6600] text-white px-1.5 py-0.5 rounded w-fit mb-1 shadow-sm">
                      {ad.promo_tag}
                    </span>
                    <h4 className="text-white font-black text-[11px] uppercase truncate drop-shadow-md">
                      {ad.title}
                    </h4>
                  </div>

                  {/* TOMBOL UPLOAD CEPAT DI ATAS GAMBAR */}
                  <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                    <label className="cursor-pointer bg-[#008080] hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-[10px] font-black flex items-center gap-2 shadow-xl transform transition-transform active:scale-95">
                      {isUploading === ad.id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Upload size={14} />
                      )}
                      {isUploading === ad.id ? "MENGUNGGAH..." : "GANTI GAMBAR"}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleImageUpload(ad.id, e.target.files[0]);
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>

                {/* FORM EDIT DATA */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1 w-full">
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase">
                      JUDUL
                    </label>
                    <input
                      className="w-full bg-slate-50 border border-slate-100 rounded-md px-3 py-2 text-[11px] font-black uppercase focus:outline-none focus:border-[#008080]"
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
                      TAG PROMO
                    </label>
                    <input
                      className="w-full bg-slate-50 border border-slate-100 rounded-md px-3 py-2 text-[11px] font-black uppercase focus:outline-none focus:border-[#008080]"
                      defaultValue={ad.promo_tag}
                      onBlur={(e) =>
                        handleUpdate(ad.id, {
                          promo_tag: e.target.value.toUpperCase(),
                        })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase flex items-center justify-between">
                      <span>IMAGE URL (MANUAL)</span>
                      <a
                        href={ad.image_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#008080] hover:underline"
                      >
                        LIHAT ASLI
                      </a>
                    </label>
                    <input
                      className="w-full bg-slate-50 border border-slate-100 rounded-md px-3 py-2 text-[11px] font-black focus:outline-none focus:border-[#008080]"
                      defaultValue={ad.image_url}
                      onBlur={(e) =>
                        handleUpdate(ad.id, { image_url: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase">
                      TARGET LINK (KLIK IKLAN)
                    </label>
                    <input
                      className="w-full bg-slate-50 border border-slate-100 rounded-md px-3 py-2 text-[11px] font-black focus:outline-none focus:border-[#008080]"
                      defaultValue={ad.link_to}
                      onBlur={(e) =>
                        handleUpdate(ad.id, { link_to: e.target.value })
                      }
                    />
                  </div>
                </div>

                {/* AKSI TOMBOL KANAN */}
                <div className="flex xl:flex-col gap-2 border-t xl:border-t-0 pt-4 xl:pt-0 xl:border-l pl-0 xl:pl-4 border-slate-100 justify-end w-full xl:w-auto">
                  <button
                    onClick={() =>
                      handleUpdate(ad.id, { is_active: !ad.is_active })
                    }
                    className={`px-4 xl:px-2 py-2 rounded-md font-black text-[10px] flex items-center gap-2 justify-center transition-all border ${
                      ad.is_active
                        ? "text-teal-700 bg-teal-50 hover:bg-teal-100 border-teal-200"
                        : "text-slate-500 bg-slate-100 hover:bg-slate-200 border-slate-200"
                    }`}
                  >
                    <CheckCircle2 size={16} />{" "}
                    {ad.is_active ? "AKTIF TAYANG" : "NONAKTIF"}
                  </button>
                  <button
                    onClick={() => handleDelete(ad.id)}
                    className="px-4 xl:px-2 py-2 rounded-md text-red-600 bg-red-50 hover:bg-red-100 font-black text-[10px] flex items-center gap-2 justify-center transition-all border border-red-200"
                  >
                    <Trash2 size={16} /> HAPUS IKLAN
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* FOOTER NOTICE */}
        <div className="mt-6 bg-slate-900 p-3 rounded-md text-center border-b-4 border-[#FF6600]">
          <p className="text-[9px] text-white/50 font-black tracking-widest uppercase">
            SINKRONISASI GLOBAL KE APLIKASI PASARQU AKTIF
          </p>
        </div>
      </div>
    </div>
  );
};
