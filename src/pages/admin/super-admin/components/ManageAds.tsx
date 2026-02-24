import React, { useEffect, useState, useRef } from "react";
import { supabase } from "../../../../lib/supabaseClient";
import {
  Plus,
  Trash2,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  Image as ImageIcon,
  Wand2,
  RefreshCw,
  Upload,
  Info,
  Sparkles,
  Maximize,
  Move,
  Calendar,
  Save,
  MapPin, // 🚀 Ikon untuk target lokasi
  Globe, // 🚀 Ikon untuk target global
} from "lucide-react";
import { useToast } from "../../../../contexts/ToastContext";
import { useNavigate } from "react-router-dom";

// ============================================================================
// SUB-KOMPONEN: KARTU IKLAN (AD ITEM) - Mengelola Drag, Upload & Tanggal
// ============================================================================
const AdItem = ({ ad, markets, onUpdate, onDelete, showToast }: any) => {
  // State untuk Preview & Upload Manual
  const [localFile, setLocalFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState(ad.image_url);
  const [isUploading, setIsUploading] = useState(false);

  // State untuk Fitur Drag Posisi Gambar
  const [pos, setPos] = useState({
    x: ad.image_pos_x ?? 50,
    y: ad.image_pos_y ?? 50,
  });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Fungsi Pilih File (Hanya Preview, Belum Upload)
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLocalFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  // Fungsi Eksekusi Upload (Tombol Simpan Gambar)
  const executeUpload = async () => {
    if (!localFile) return;
    setIsUploading(true);
    try {
      const fileExt = localFile.name.split(".").pop();
      const fileName = `${ad.id}-${Date.now()}.${fileExt}`;
      const filePath = `banners/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("ads")
        .upload(filePath, localFile);
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("ads").getPublicUrl(filePath);

      await onUpdate(ad.id, { image_url: data.publicUrl });
      setLocalFile(null); // Reset file lokal karena sudah online
      showToast("GAMBAR BERHASIL DIUNGGAH", "success");
    } catch (err: any) {
      showToast("GAGAL MENGUNGGAH", "error");
    } finally {
      setIsUploading(false);
    }
  };

  // --- LOGIKA DRAG (MOUSE & TOUCH) ---
  const startDrag = (clientX: number, clientY: number) => {
    if (ad.image_fit !== "cover" && !localFile) return; // Drag hanya berguna di mode cover
    setIsDragging(true);
    dragRef.current = { x: clientX, y: clientY };
  };

  const doDrag = (clientX: number, clientY: number) => {
    if (!isDragging) return;
    const dx = clientX - dragRef.current.x;
    const dy = clientY - dragRef.current.y;
    dragRef.current = { x: clientX, y: clientY };

    setPos((prev: any) => ({
      x: Math.max(0, Math.min(100, prev.x - dx * 0.3)), // 0.3 = Sensitivitas geser
      y: Math.max(0, Math.min(100, prev.y - dy * 0.3)),
    }));
  };

  const stopDrag = () => {
    if (isDragging) {
      setIsDragging(false);
      onUpdate(ad.id, { image_pos_x: pos.x, image_pos_y: pos.y }); // Simpan posisi ke DB
    }
  };

  const fitClass =
    ad.image_fit === "contain"
      ? "object-contain"
      : ad.image_fit === "fill"
        ? "object-fill"
        : "object-cover";

  return (
    <div
      className={`bg-white p-5 rounded-2xl shadow-sm border-2 flex flex-col xl:flex-row gap-6 transition-all relative ${ad.is_active ? "border-[#008080]" : "border-slate-200 opacity-75"}`}
    >
      {/* 1. AREA PREVIEW GAMBAR & DRAG */}
      <div className="flex flex-col gap-3 w-full xl:w-[320px] shrink-0">
        <div
          ref={containerRef}
          className="relative w-full h-[160px] rounded-xl overflow-hidden bg-slate-100 border-2 border-slate-200 group cursor-grab active:cursor-grabbing select-none shadow-inner"
          onMouseDown={(e) => startDrag(e.clientX, e.clientY)}
          onMouseMove={(e) => doDrag(e.clientX, e.clientY)}
          onMouseUp={stopDrag}
          onMouseLeave={stopDrag}
          onTouchStart={(e) =>
            startDrag(e.touches[0].clientX, e.touches[0].clientY)
          }
          onTouchMove={(e) =>
            doDrag(e.touches[0].clientX, e.touches[0].clientY)
          }
          onTouchEnd={stopDrag}
        >
          <img
            src={previewUrl}
            className={`w-full h-full ${fitClass} bg-slate-200 pointer-events-none`}
            style={{ objectPosition: `${pos.x}% ${pos.y}%` }}
            alt="Preview"
          />

          {/* OVERLAY TEKS IKLAN */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-4 pointer-events-none">
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="text-[9px] font-[1000] bg-[#FF6600] text-white px-2 py-1 rounded-md shadow-sm tracking-widest uppercase">
                {ad.promo_tag}
              </span>
              {/* 🚀 INDIKATOR LOKAL / GLOBAL DI PREVIEW */}
              {ad.market_id ? (
                <span className="text-[8px] font-[1000] bg-[#008080] text-white px-1.5 py-1 rounded-md shadow-sm flex items-center gap-1">
                  <MapPin size={10} /> LOKAL
                </span>
              ) : (
                <span className="text-[8px] font-[1000] bg-indigo-600 text-white px-1.5 py-1 rounded-md shadow-sm flex items-center gap-1">
                  <Globe size={10} /> GLOBAL
                </span>
              )}
            </div>
            <h4 className="text-white font-[1000] text-[13px] uppercase truncate drop-shadow-md tracking-tight">
              {ad.title}
            </h4>
          </div>

          {/* INDIKATOR DRAG */}
          {ad.image_fit === "cover" && (
            <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md text-white px-2 py-1 rounded-md text-[8px] font-[1000] flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <Move size={10} /> GESER UNTUK POSISI
            </div>
          )}
        </div>

        {/* TOMBOL PILIH FILE & UPLOAD EKSPLISIT */}
        <div className="flex flex-col gap-2">
          <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-3 rounded-xl text-[10px] font-[1000] flex items-center justify-center gap-2 transition-all tracking-widest border-2 border-slate-200 active:scale-95">
            <ImageIcon size={14} strokeWidth={3} /> PILIH GAMBAR BARU
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />
          </label>

          {localFile && (
            <button
              onClick={executeUpload}
              disabled={isUploading}
              className="bg-[#FF6600] hover:bg-[#e65c00] text-white px-4 py-3 rounded-xl text-[10px] font-[1000] flex items-center justify-center gap-2 transition-all tracking-widest shadow-lg shadow-orange-500/30 active:scale-95"
            >
              {isUploading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Upload size={16} strokeWidth={3} />
              )}
              {isUploading ? "MENGUNGGAH..." : "UPLOAD SEKARANG"}
            </button>
          )}
        </div>
      </div>

      {/* 2. FORM EDIT DATA & DURASI */}
      <div className="flex-1 w-full space-y-4">
        {/* 🚀 DROPDOWN TARGET LOKASI (HYPER-LOCAL ADS) */}
        <div className="p-3 bg-indigo-50 border-2 border-indigo-100 rounded-xl">
          <label className="text-[10px] font-[1000] text-indigo-700 uppercase tracking-widest flex items-center gap-1.5 mb-2">
            <MapPin size={14} strokeWidth={3} /> TARGET AUDIENS (AREA TAYANG)
          </label>
          <select
            className="w-full bg-white border-2 border-indigo-200 text-indigo-900 rounded-lg px-4 py-2.5 text-[11px] font-[1000] uppercase focus:border-indigo-500 transition-all outline-none appearance-none cursor-pointer shadow-sm"
            defaultValue={ad.market_id || ""}
            onChange={(e) =>
              onUpdate(ad.id, {
                market_id: e.target.value === "" ? null : e.target.value,
              })
            }
          >
            <option value="">🌍 SEMUA PASAR (TAMPIL GLOBAL)</option>
            {markets?.map((m: any) => (
              <option key={m.id} value={m.id}>
                📍 HANYA UNTUK AREA: {m.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-[1000] text-slate-400 uppercase tracking-widest">
              JUDUL IKLAN
            </label>
            <input
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-[12px] font-[1000] uppercase focus:border-[#008080] focus:bg-white transition-all outline-none"
              defaultValue={ad.title}
              onBlur={(e) =>
                onUpdate(ad.id, { title: e.target.value.toUpperCase() })
              }
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-[1000] text-slate-400 uppercase tracking-widest">
              LABEL PROMO
            </label>
            <input
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-[12px] font-[1000] uppercase focus:border-[#008080] focus:bg-white transition-all outline-none"
              defaultValue={ad.promo_tag}
              onBlur={(e) =>
                onUpdate(ad.id, { promo_tag: e.target.value.toUpperCase() })
              }
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-[1000] text-slate-400 uppercase tracking-widest">
              TARGET LINK KLIK
            </label>
            <input
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-[12px] font-[1000] lowercase focus:border-[#008080] focus:bg-white transition-all outline-none"
              defaultValue={ad.link_to}
              placeholder="/contoh-link"
              onBlur={(e) => onUpdate(ad.id, { link_to: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-[1000] text-slate-400 uppercase tracking-widest">
              MODE TAMPILAN
            </label>
            <select
              className="w-full bg-slate-50 border-2 border-slate-100 text-slate-700 rounded-xl px-4 py-3 text-[12px] font-[1000] uppercase focus:border-[#008080] transition-all outline-none appearance-none"
              defaultValue={ad.image_fit || "cover"}
              onChange={(e) => onUpdate(ad.id, { image_fit: e.target.value })}
            >
              <option value="cover">PENUH (BISA DIGESER)</option>
              <option value="contain">PAS KOTAK (ADA CELAH)</option>
              <option value="fill">DIPAKSA PENUH (TERTARIK)</option>
            </select>
          </div>
        </div>

        {/* SETTING DURASI WAKTU TAYANG */}
        <div className="p-4 bg-teal-50 border-2 border-teal-100 rounded-xl space-y-3">
          <label className="text-[10px] font-[1000] text-[#008080] uppercase tracking-widest flex items-center gap-1.5">
            <Calendar size={14} strokeWidth={3} /> DURASI TAYANG IKLAN
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-teal-700 uppercase">
                MULAI TAYANG
              </label>
              <input
                type="datetime-local"
                className="w-full bg-white border-2 border-teal-200 rounded-lg px-3 py-2 text-[11px] font-bold outline-none focus:border-[#008080]"
                defaultValue={ad.start_date ? ad.start_date.slice(0, 16) : ""}
                onBlur={(e) =>
                  onUpdate(ad.id, { start_date: e.target.value || null })
                }
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-teal-700 uppercase">
                BERAKHIR PADA
              </label>
              <input
                type="datetime-local"
                className="w-full bg-white border-2 border-teal-200 rounded-lg px-3 py-2 text-[11px] font-bold outline-none focus:border-[#008080]"
                defaultValue={ad.end_date ? ad.end_date.slice(0, 16) : ""}
                onBlur={(e) =>
                  onUpdate(ad.id, { end_date: e.target.value || null })
                }
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. AKSI TOMBOL KANAN */}
      <div className="flex xl:flex-col gap-3 border-t-2 xl:border-t-0 pt-5 xl:pt-0 xl:border-l-2 pl-0 xl:pl-5 border-slate-100 justify-center w-full xl:w-[140px] shrink-0">
        <button
          onClick={() => onUpdate(ad.id, { is_active: !ad.is_active })}
          className={`w-full py-3.5 rounded-xl font-[1000] text-[10px] tracking-widest flex flex-col items-center justify-center gap-1.5 transition-all border-2 active:scale-95 ${ad.is_active ? "text-[#008080] bg-teal-50 border-teal-200 shadow-sm" : "text-slate-400 bg-slate-50 border-slate-200"}`}
        >
          <CheckCircle2 size={20} strokeWidth={3} />{" "}
          {ad.is_active ? "TAYANG" : "NONAKTIF"}
        </button>
        <button
          onClick={() => onDelete(ad.id)}
          className="w-full py-3.5 rounded-xl text-red-500 bg-red-50 hover:bg-red-500 hover:text-white font-[1000] text-[10px] tracking-widest flex flex-col items-center justify-center gap-1.5 transition-all border-2 border-red-100 active:scale-95"
        >
          <Trash2 size={20} strokeWidth={3} /> HAPUS
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT: MANAGE ADS
// ============================================================================
export const ManageAds = () => {
  const [ads, setAds] = useState<any[]>([]);
  const [markets, setMarkets] = useState<any[]>([]); // 🚀 State List Pasar
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiIdea, setAiIdea] = useState("");
  const { showToast } = useToast();
  const navigate = useNavigate();

  // 🚀 FETCH ADS + FETCH MARKETS
  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const { data: adsData, error: adsError } = await supabase
        .from("ads")
        .select("*")
        .order("sort_order", { ascending: true });
      if (adsError) throw adsError;
      setAds(adsData || []);

      const { data: marketData } = await supabase
        .from("markets")
        .select("id, name")
        .order("name");
      if (marketData) setMarkets(marketData);
    } catch (err: any) {
      showToast("GAGAL MEMUAT DATA", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

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
          image_fit: "cover",
          image_pos_x: 50,
          image_pos_y: 50,
          market_id: null, // 🚀 Default Global
        },
      ]);
      if (error) throw error;
      showToast("DRAF IKLAN DIBUAT", "success");
      fetchInitialData();
    } catch (err) {
      showToast("GAGAL MENAMBAH IKLAN", "error");
    }
  };

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
          image_fit: "cover",
          image_pos_x: 50,
          image_pos_y: 50,
          market_id: null, // 🚀 Default Global
        },
      ]);
      if (error) throw error;
      showToast("AI BERHASIL MEMBUAT IKLAN", "success");
      setAiIdea("");
      fetchInitialData();
    } catch (err: any) {
      showToast("AI GAGAL", "error");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUpdate = async (id: string, updates: any) => {
    const { error } = await supabase.from("ads").update(updates).eq("id", id);
    if (!error) {
      showToast("PERUBAHAN TERSIMPAN", "success");
      setAds((prev) =>
        prev.map((ad) => (ad.id === id ? { ...ad, ...updates } : ad)),
      );
    } else {
      showToast("GAGAL MENYIMPAN", "error");
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("HAPUS IKLAN INI?")) {
      const { error } = await supabase.from("ads").delete().eq("id", id);
      if (!error) {
        setAds((prev) => prev.filter((ad) => ad.id !== id));
        showToast("IKLAN DIHAPUS", "success");
      }
    }
  };

  return (
    <div className="p-4 md:p-6 font-[1000] uppercase tracking-tighter text-left bg-slate-50 min-h-screen">
      <div className="max-w-[1200px] mx-auto">
        {/* HEADER AREA */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 border-b-4 border-[#008080] pb-4">
          <div>
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 text-slate-400 hover:text-[#008080] text-[10px] tracking-widest mb-2 transition-all active:scale-95"
            >
              <ArrowLeft size={14} strokeWidth={3} /> KEMBALI
            </button>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-slate-900 rounded-xl text-white shadow-lg">
                <ImageIcon size={24} strokeWidth={2.5} />
              </div>
              <h1 className="text-2xl font-[1000] text-slate-900 leading-none tracking-tight">
                MANAJEMEN <span className="text-[#FF6600]">IKLAN</span>
              </h1>
            </div>
          </div>
          <button
            onClick={handleAddManual}
            className="bg-slate-900 hover:bg-[#008080] text-white px-6 py-3.5 rounded-xl font-[1000] text-[12px] flex items-center gap-2 shadow-lg transition-all active:scale-95 tracking-widest"
          >
            <Plus size={18} strokeWidth={3} /> TAMBAH MANUAL
          </button>
        </div>

        {/* 🚀 CATATAN PANDUAN BARU */}
        <div className="mb-6 bg-indigo-50 border-2 border-indigo-200 p-4 rounded-xl flex items-start gap-3 shadow-sm">
          <Globe
            size={24}
            strokeWidth={2.5}
            className="text-indigo-600 shrink-0 mt-0.5"
          />
          <div>
            <h4 className="text-[12px] text-indigo-700 font-[1000] tracking-widest mb-1.5">
              FITUR HYPER-LOCAL ADS AKTIF
            </h4>
            <p className="text-[10px] text-slate-600 font-bold leading-relaxed tracking-wider">
              Gunakan kotak{" "}
              <strong className="text-indigo-700">"TARGET AUDIENS"</strong>{" "}
              warna ungu di bawah untuk memilih di Pasar mana iklan ini akan
              muncul. Biarkan "Semua Pasar" untuk iklan Global.
            </p>
          </div>
        </div>

        {/* AI PANEL */}
        <div className="mb-8 bg-indigo-900 p-5 md:p-6 rounded-2xl shadow-xl relative overflow-hidden border-b-4 border-indigo-500">
          <div className="relative z-10 flex flex-col md:flex-row gap-4 items-center">
            <div className="flex items-center gap-2 shrink-0">
              <Wand2 className="text-indigo-400" size={20} strokeWidth={3} />
              <h3 className="font-[1000] text-white text-[12px] tracking-widest">
                AI COPYWRITER
              </h3>
            </div>
            <input
              type="text"
              placeholder="CONTOH: PROMO SEMBAKO MURAH..."
              className="flex-1 w-full bg-white/10 border-2 border-white/20 rounded-xl px-5 py-3.5 text-white placeholder:text-indigo-300 font-[1000] text-[12px] outline-none focus:border-indigo-400 transition-all"
              value={aiIdea}
              onChange={(e) => setAiIdea(e.target.value)}
            />
            <button
              onClick={generateAdWithAI}
              disabled={isGenerating}
              className="w-full md:w-auto bg-white text-indigo-900 px-8 py-3.5 rounded-xl font-[1000] text-[11px] flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all tracking-widest"
            >
              {isGenerating ? (
                <RefreshCw className="animate-spin" size={16} strokeWidth={3} />
              ) : (
                <Sparkles size={16} strokeWidth={3} />
              )}{" "}
              GENERATE
            </button>
          </div>
        </div>

        {/* LIST IKLAN */}
        {isLoading ? (
          <div className="py-24 text-center flex flex-col items-center justify-center">
            <Loader2
              className="animate-spin text-[#008080] mb-4"
              size={48}
              strokeWidth={3}
            />
            <p className="text-[12px] text-slate-400 font-[1000] tracking-[0.3em]">
              MENARIK DATA IKLAN & PASAR...
            </p>
          </div>
        ) : (
          <div className="grid gap-5">
            {ads.map((ad, index) => (
              <AdItem
                key={ad.id}
                ad={{ ...ad, index }}
                markets={markets} // 🚀 Passing data markets ke komponen Item
                onUpdate={handleUpdate}
                onDelete={handleDelete}
                showToast={showToast}
              />
            ))}
          </div>
        )}

        <div className="mt-8 bg-slate-900 p-4 rounded-xl text-center border-b-4 border-[#FF6600] shadow-lg">
          <p className="text-[10px] text-white/70 font-[1000] tracking-[0.4em] uppercase">
            SINKRONISASI GLOBAL KE APLIKASI PASARQU AKTIF
          </p>
        </div>
      </div>
    </div>
  );
};
