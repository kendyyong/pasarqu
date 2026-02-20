import React, { useState, useRef } from "react";
import { supabase } from "../../lib/supabaseClient";
import {
  ShieldAlert,
  Send,
  AlertCircle,
  Camera,
  X,
  ChevronDown,
  RefreshCw,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { useToast } from "../../contexts/ToastContext";
import { useAuth } from "../../contexts/AuthContext";

interface ComplaintFormProps {
  orderId?: string;
  onSuccess?: () => void;
}

export const ComplaintForm = ({ orderId, onSuccess }: ComplaintFormProps) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("MASALAH_TEKNIS");
  const [message, setMessage] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const categories = [
    { id: "MASALAH_PESANAN", label: "MASALAH PESANAN (RUSAK/SALAH)" },
    { id: "MASALAH_SALDO", label: "MASALAH SALDO / TOPUP" },
    { id: "MASALAH_KURIR", label: "KENDALA PENGIRIMAN (KURIR)" },
    { id: "MASALAH_TEKNIS", label: "MASALAH APLIKASI / AKUN" },
    { id: "LAINNYA", label: "LAIN-LAIN" },
  ];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user?.id}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("evidence")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("evidence").getPublicUrl(filePath);
      setImageUrl(data.publicUrl);
      showToast("FOTO BUKTI BERHASIL DIUNGGAH", "success");
    } catch (err: any) {
      showToast("GAGAL UNGGAH FOTO: " + err.message, "error");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message || !subject) {
      showToast("MOHON ISI SUBJEK DAN DETAIL LAPORAN", "error");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("complaints").insert([
        {
          user_id: user?.id,
          order_id: orderId || null,
          subject: subject.toUpperCase(),
          category: category,
          message: message,
          proof_url: imageUrl,
          status: "open",
        },
      ]);

      if (error) throw error;

      showToast("LAPORAN BERHASIL TERKIRIM KE ADMIN", "success");
      setSubject("");
      setMessage("");
      setImageUrl(null);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      showToast("GAGAL MENGIRIM LAPORAN: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-md border border-slate-200 shadow-xl overflow-hidden max-w-lg mx-auto animate-in fade-in zoom-in duration-300 font-black">
      {/* HEADER */}
      <div className="bg-[#008080] p-4 text-white flex items-center gap-3 border-b-4 border-[#FF6600]">
        <ShieldAlert size={24} className="shrink-0" />
        <div className="text-left">
          <h2 className="text-[14px] font-black uppercase tracking-tighter leading-none">
            PUSAT BANTUAN PASARQU
          </h2>
          <p className="text-[10px] font-black opacity-80 mt-1 uppercase tracking-widest text-teal-100">
            LAYANAN ADUAN WARGA & MITRA
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="p-5 space-y-4 font-black uppercase tracking-tighter text-left"
      >
        {orderId && (
          <div className="bg-orange-50 border border-orange-100 p-3 rounded-md flex items-center gap-3">
            <AlertCircle className="text-[#FF6600]" size={18} />
            <p className="text-[11px] text-[#FF6600] font-black uppercase">
              KOMPLAIN PESANAN: #{orderId.slice(0, 8)}
            </p>
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-[10px] text-slate-400 ml-1 tracking-widest font-black uppercase">
            KATEGORI KENDALA
          </label>
          <div className="relative">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 p-3 rounded-md text-[12px] font-black appearance-none outline-none focus:border-[#008080] shadow-sm uppercase"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
            <ChevronDown
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              size={16}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] text-slate-400 ml-1 tracking-widest font-black uppercase">
            JUDUL LAPORAN
          </label>
          <input
            type="text"
            placeholder="CONTOH: BARANG RUSAK"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 p-3 rounded-md text-[12px] font-black outline-none focus:border-[#008080] shadow-sm uppercase"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] text-slate-400 ml-1 tracking-widest font-black uppercase">
            DETAIL MASALAH
          </label>
          <textarea
            rows={3}
            placeholder="CERITAKAN KENDALA ANDA DI SINI..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 p-3 rounded-md text-[12px] font-black outline-none focus:border-[#008080] shadow-sm min-h-[80px] resize-none uppercase"
          />
        </div>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          className="hidden"
          accept="image/*"
        />

        <div
          onClick={() => fileInputRef.current?.click()}
          className={`p-4 border-2 border-dashed rounded-md text-center transition-all cursor-pointer group flex flex-col items-center justify-center ${
            imageUrl
              ? "border-[#008080] bg-teal-50"
              : "border-slate-100 hover:border-[#008080]/30"
          }`}
        >
          {uploading ? (
            <Loader2 className="animate-spin text-[#008080] mb-2" size={24} />
          ) : imageUrl ? (
            <CheckCircle2 className="text-[#008080] mb-2" size={24} />
          ) : (
            <Camera
              className="text-slate-300 group-hover:text-[#008080] mb-2"
              size={24}
            />
          )}
          <p className="text-[9px] text-slate-400 font-black tracking-widest uppercase">
            {uploading
              ? "SEDANG MENGUNGGAH..."
              : imageUrl
                ? "FOTO BERHASIL DILAMPIRKAN"
                : "LAMPIRKAN BUKTI FOTO (OPSIONAL)"}
          </p>

          {imageUrl && (
            <div className="mt-2 w-full h-24 bg-white rounded-md border border-teal-100 overflow-hidden relative">
              <img
                src={imageUrl}
                alt="Bukti"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setImageUrl(null);
                }}
                className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-md shadow-lg"
              >
                <X size={12} />
              </button>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || uploading}
          className="w-full bg-[#008080] text-white py-4 rounded-md font-black text-[12px] shadow-lg flex items-center justify-center gap-2 hover:bg-slate-900 active:scale-95 transition-all mt-2 disabled:opacity-50 uppercase"
        >
          {loading ? (
            <RefreshCw className="animate-spin" size={18} />
          ) : (
            <Send size={18} />
          )}
          KIRIM LAPORAN SEKARANG
        </button>
      </form>

      <div className="bg-slate-50 p-3 border-t border-slate-100 text-center">
        <p className="text-[9px] text-slate-400 font-black tracking-widest uppercase leading-none">
          PASARQU CUSTOMER PROTECTION SYSTEM
        </p>
      </div>
    </div>
  );
};
