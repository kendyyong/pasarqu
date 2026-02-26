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
  Move,
  Calendar,
  MapPin,
  Globe,
  Monitor,
  Smartphone,
  Sparkles,
  Crosshair,
} from "lucide-react";
import { useToast } from "../../../../contexts/ToastContext";
import { useNavigate } from "react-router-dom";

// ============================================================================
// SUB-KOMPONEN: KARTU IKLAN (AD ITEM) - DENGAN SIMULATOR DESKTOP 3:1
// ============================================================================
const AdItem = ({ ad, markets, onUpdate, onDelete, showToast }: any) => {
  const [localFile, setLocalFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState(ad.image_url);
  const [isUploading, setIsUploading] = useState(false);
  const [viewMode, setViewMode] = useState<"MOBILE" | "DESKTOP">("MOBILE"); // 🚀 State Simulator

  const [pos, setPos] = useState({
    x: ad.image_pos_x ?? 50,
    y: ad.image_pos_y ?? 50,
  });

  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ x: 0, y: 0 });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLocalFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

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
      setLocalFile(null);
      showToast("GAMBAR BERHASIL DIUNGGAH", "success");
    } catch (err: any) {
      showToast("GAGAL MENGUNGGAH", "error");
    } finally {
      setIsUploading(false);
    }
  };

  const startDrag = (clientX: number, clientY: number) => {
    if (ad.image_fit !== "cover") return;
    setIsDragging(true);
    dragRef.current = { x: clientX, y: clientY };
  };

  const doDrag = (clientX: number, clientY: number) => {
    if (!isDragging) return;
    const dx = clientX - dragRef.current.x;
    const dy = clientY - dragRef.current.y;
    dragRef.current = { x: clientX, y: clientY };

    setPos((prev: any) => ({
      x: Math.max(0, Math.min(100, prev.x - dx * 0.2)), // Sensitivitas disesuaikan
      y: Math.max(0, Math.min(100, prev.y - dy * 0.2)),
    }));
  };

  const stopDrag = () => {
    if (isDragging) {
      setIsDragging(false);
      onUpdate(ad.id, { image_pos_x: pos.x, image_pos_y: pos.y });
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
      className={`bg-white p-6 rounded-[2rem] shadow-sm border-2 flex flex-col gap-6 transition-all relative ${ad.is_active ? "border-[#008080]" : "border-slate-100 opacity-80"}`}
    >
      {/* --- BAGIAN ATAS: SIMULATOR VIEW MODE --- */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* 1. AREA PREVIEW DENGAN TOGGLE RASIO */}
        <div className="w-full lg:w-[450px] space-y-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-[1000] text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Crosshair size={14} /> Simulator Tampilan
            </span>
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setViewMode("MOBILE")}
                className={`p-2 rounded-lg transition-all ${viewMode === "MOBILE" ? "bg-white text-[#008080] shadow-sm" : "text-slate-400"}`}
                title="Mode HP (2:1)"
              >
                <Smartphone size={16} />
              </button>
              <button
                onClick={() => setViewMode("DESKTOP")}
                className={`p-2 rounded-lg transition-all ${viewMode === "DESKTOP" ? "bg-white text-[#008080] shadow-sm" : "text-slate-400"}`}
                title="Mode Desktop (3:1)"
              >
                <Monitor size={16} />
              </button>
            </div>
          </div>

          <div
            className={`relative w-full overflow-hidden bg-slate-900 border-4 border-white shadow-xl transition-all duration-500 ease-in-out select-none group cursor-grab active:cursor-grabbing ${viewMode === "MOBILE" ? "aspect-[2/1] rounded-[1.5rem]" : "aspect-[3/1] rounded-xl"}`}
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
              className={`w-full h-full ${fitClass} pointer-events-none transition-opacity duration-300`}
              style={{ objectPosition: `${pos.x}% ${pos.y}%` }}
              alt="Preview"
            />

            {/* Overlay Info */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent p-4 flex flex-col justify-end pointer-events-none">
              <p className="text-[8px] text-white/50 font-black tracking-[0.2em] mb-1">
                PREVIEW {viewMode}
              </p>
              <h4 className="text-white font-black text-xs uppercase truncate">
                {ad.title || "TANPA JUDUL"}
              </h4>
            </div>

            {/* Focal Point Indicator */}
            <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
              <div
                className="absolute w-6 h-6 border-2 border-white/50 rounded-full -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
                style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
              >
                <div className="w-1 h-1 bg-white rounded-full"></div>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <label className="flex-1 cursor-pointer bg-slate-900 hover:bg-slate-800 text-white px-4 py-3 rounded-xl text-[10px] font-[1000] flex items-center justify-center gap-2 transition-all tracking-widest active:scale-95">
              <ImageIcon size={14} /> GANTI GAMBAR
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
                className="bg-[#FF6600] text-white px-6 py-3 rounded-xl text-[10px] font-[1000] animate-pulse"
              >
                {isUploading ? (
                  <Loader2 className="animate-spin" size={14} />
                ) : (
                  <Upload size={14} />
                )}
              </button>
            )}
          </div>
        </div>

        {/* 2. FORM DATA IKLAN */}
        <div className="flex-1 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 bg-indigo-50 border-2 border-indigo-100 rounded-2xl md:col-span-2">
              <label className="text-[9px] font-[1000] text-indigo-700 uppercase tracking-widest flex items-center gap-2 mb-2">
                <MapPin size={12} /> Target Wilayah Tayang
              </label>
              <select
                className="w-full bg-white border-none text-indigo-900 rounded-lg px-3 py-2 text-[11px] font-[1000] uppercase outline-none"
                defaultValue={ad.market_id || ""}
                onChange={(e) =>
                  onUpdate(ad.id, {
                    market_id: e.target.value === "" ? null : e.target.value,
                  })
                }
              >
                <option value="">🌍 GLOBAL (SEMUA PASAR)</option>
                {markets?.map((m: any) => (
                  <option key={m.id} value={m.id}>
                    📍 {m.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Judul Utama
              </label>
              <input
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-[12px] font-black uppercase outline-none focus:border-[#008080]"
                defaultValue={ad.title}
                onBlur={(e) =>
                  onUpdate(ad.id, { title: e.target.value.toUpperCase() })
                }
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Label Tag
              </label>
              <input
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-[12px] font-black uppercase outline-none focus:border-[#008080]"
                defaultValue={ad.promo_tag}
                onBlur={(e) =>
                  onUpdate(ad.id, { promo_tag: e.target.value.toUpperCase() })
                }
              />
            </div>
          </div>

          <div className="p-4 bg-teal-50/50 border-2 border-teal-100 rounded-2xl">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[8px] font-black text-teal-600 uppercase">
                  Mulai Tayang
                </label>
                <input
                  type="datetime-local"
                  className="w-full bg-white rounded-lg px-2 py-2 text-[10px] font-bold outline-none border border-teal-100"
                  defaultValue={ad.start_date?.slice(0, 16)}
                  onBlur={(e) =>
                    onUpdate(ad.id, { start_date: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1">
                <label className="text-[8px] font-black text-teal-600 uppercase">
                  Selesai Tayang
                </label>
                <input
                  type="datetime-local"
                  className="w-full bg-white rounded-lg px-2 py-2 text-[10px] font-bold outline-none border border-teal-100"
                  defaultValue={ad.end_date?.slice(0, 16)}
                  onBlur={(e) => onUpdate(ad.id, { end_date: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 3. AKSI CEPAT */}
        <div className="w-full lg:w-[120px] flex lg:flex-col gap-2">
          <button
            onClick={() => onUpdate(ad.id, { is_active: !ad.is_active })}
            className={`flex-1 lg:h-24 rounded-2xl font-black text-[10px] flex flex-col items-center justify-center gap-2 border-2 transition-all ${ad.is_active ? "bg-teal-50 border-teal-200 text-[#008080]" : "bg-slate-50 border-slate-100 text-slate-400"}`}
          >
            <CheckCircle2 size={24} /> {ad.is_active ? "TAYANG" : "OFF"}
          </button>
          <button
            onClick={() => onDelete(ad.id)}
            className="p-4 lg:flex-1 rounded-2xl bg-red-50 text-red-500 border-2 border-red-100 hover:bg-red-500 hover:text-white transition-all flex flex-col items-center justify-center gap-2 font-black text-[10px]"
          >
            <Trash2 size={24} /> HAPUS
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT: MANAGE ADS
// ============================================================================
export const ManageAds = () => {
  const [ads, setAds] = useState<any[]>([]);
  const [markets, setMarkets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiIdea, setAiIdea] = useState("");
  const { showToast } = useToast();
  const navigate = useNavigate();

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data: adsData } = await supabase
        .from("ads")
        .select("*")
        .order("sort_order", { ascending: true });
      const { data: marketData } = await supabase
        .from("markets")
        .select("id, name")
        .order("name");
      setAds(adsData || []);
      setMarkets(marketData || []);
    } catch (err) {
      showToast("GAGAL LOAD DATA", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdate = async (id: string, updates: any) => {
    const { error } = await supabase.from("ads").update(updates).eq("id", id);
    if (!error) {
      showToast("DATA DISIMPAN", "success");
      setAds((prev) =>
        prev.map((a) => (a.id === id ? { ...a, ...updates } : a)),
      );
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("HAPUS IKLAN?")) {
      const { error } = await supabase.from("ads").delete().eq("id", id);
      if (!error) {
        setAds((prev) => prev.filter((a) => a.id !== id));
        showToast("BERHASIL DIHAPUS", "success");
      }
    }
  };

  const handleAddManual = async () => {
    const { error } = await supabase
      .from("ads")
      .insert([
        {
          title: "IKLAN BARU",
          image_url:
            "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800",
          is_active: false,
          image_fit: "cover",
          image_pos_x: 50,
          image_pos_y: 50,
        },
      ]);
    if (!error) {
      fetchData();
      showToast("DRAF DIBUAT", "success");
    }
  };

  return (
    <div className="p-4 md:p-10 font-black uppercase tracking-tighter text-left bg-[#F8FAFC] min-h-screen">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b-4 border-slate-900 pb-8">
          <div>
            <button
              onClick={() => navigate(-1)}
              className="text-[10px] text-slate-400 mb-2 flex items-center gap-1"
            >
              <ArrowLeft size={12} /> KEMBALI
            </button>
            <h1 className="text-4xl text-slate-900 leading-none tracking-tight">
              ADS <span className="text-[#008080]">COMMAND CENTER</span>
            </h1>
          </div>
          <button
            onClick={handleAddManual}
            className="bg-slate-900 text-white px-8 py-4 rounded-2xl text-xs font-black shadow-xl hover:bg-[#008080] transition-all active:scale-95 tracking-widest"
          >
            + TAMBAH IKLAN BARU
          </button>
        </div>

        {/* AI PANEL */}
        <div className="bg-indigo-900 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row gap-4 items-center">
            <Sparkles className="text-indigo-400 shrink-0" size={32} />
            <input
              type="text"
              placeholder="APA TOPIK PROMO ANDA? (MISAL: DISKON SAYUR)"
              className="flex-1 w-full bg-white/10 border-2 border-white/20 rounded-2xl px-6 py-4 text-white placeholder:text-indigo-300 font-black outline-none"
              value={aiIdea}
              onChange={(e) => setAiIdea(e.target.value)}
            />
            <button className="w-full md:w-auto bg-white text-indigo-900 px-10 py-4 rounded-2xl font-black text-xs hover:scale-105 transition-all shadow-xl">
              GENERATE COPY
            </button>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
        </div>

        {/* LIST */}
        <div className="grid gap-8">
          {isLoading ? (
            <div className="py-20 text-center">
              <Loader2
                className="animate-spin mx-auto text-slate-300"
                size={48}
              />
            </div>
          ) : (
            ads.map((ad) => (
              <AdItem
                key={ad.id}
                ad={ad}
                markets={markets}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
                showToast={showToast}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};
