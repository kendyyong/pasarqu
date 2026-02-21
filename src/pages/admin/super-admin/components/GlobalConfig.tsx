import React, { useEffect, useState } from "react";
import { supabase } from "../../../../lib/supabaseClient";
import {
  Save,
  Server,
  Smartphone,
  MapPin,
  MessageCircle,
  Loader2,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  Zap,
  Lock,
  Globe,
} from "lucide-react";
import { useToast } from "../../../../contexts/ToastContext";
import { createAuditLog } from "../../../../lib/auditHelper";
import { useConfig } from "../../../../contexts/ConfigContext";

export const GlobalConfig = () => {
  const { showToast } = useToast();
  const { refreshConfig } = useConfig();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // State untuk AI Auditor
  const [aiWarning, setAiWarning] = useState<string | null>(null);

  // ✅ 1. State Lengkap dengan penampung Midtrans
  const [formData, setFormData] = useState({
    max_distance_km: 0,
    min_app_version: "",
    is_maintenance: false,
    cs_whatsapp: "",
    midtrans_client_key: "",
    midtrans_server_key: "",
    midtrans_is_production: false,
  });

  const fetchSettings = async () => {
    setLoading(true);
    try {
      // ✅ 2. Gunakan select("*") agar kolom baru Midtrans ikut terbaca
      const { data, error } = await supabase
        .from("app_settings")
        .select("*")
        .eq("id", 1)
        .single();

      if (error) throw error;
      if (data) {
        setFormData({
          max_distance_km: data.max_distance_km || 0,
          min_app_version: data.min_app_version || "",
          is_maintenance: data.is_maintenance || false,
          cs_whatsapp: data.cs_whatsapp || "",
          midtrans_client_key: data.midtrans_client_key || "",
          midtrans_server_key: data.midtrans_server_key || "",
          midtrans_is_production: data.midtrans_is_production || false,
        });
      }
    } catch (err: any) {
      showToast("GAGAL MEMUAT PENGATURAN", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // AI AUDITOR LOGIC
  useEffect(() => {
    const runAiAudit = () => {
      if (formData.max_distance_km > 50) {
        setAiWarning("AI ALERT: RADIUS > 50KM BERISIKO BAGI KESEGARAN BARANG.");
      } else if (formData.is_maintenance) {
        setAiWarning("AI INFO: MODE PEMELIHARAAN AKTIF. AKSES PUBLIK DITUTUP.");
      } else if (formData.midtrans_is_production) {
        setAiWarning(
          "AI WARNING: MODE PRODUKSI AKTIF. TRANSAKSI MENGGUNAKAN UANG ASLI!",
        );
      } else {
        setAiWarning(null);
      }
    };
    runAiAudit();
  }, [formData]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("app_settings")
        .update(formData)
        .eq("id", 1);

      if (error) throw error;
      await refreshConfig();
      await createAuditLog(
        "UPDATE_GLOBAL_SETTINGS",
        "SYSTEM",
        `Mengubah sistem (Radius: ${formData.max_distance_km}KM, Maint: ${formData.is_maintenance}, Midtrans: ${formData.midtrans_is_production ? "LIVE" : "SANDBOX"})`,
      );

      showToast("KONFIGURASI BERHASIL DIPERBARUI", "success");
    } catch (err: any) {
      showToast("GAGAL MENYIMPAN", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4 font-black">
        <RefreshCw className="animate-spin text-[#008080]" size={40} />
        <p className="text-[10px] tracking-widest text-slate-400">
          SYNCING CORE SYSTEM...
        </p>
      </div>
    );

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-500 font-black uppercase tracking-tighter text-left pb-10">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b-4 border-slate-900 pb-4">
        <div>
          <h2 className="text-[20px] font-black text-slate-900 flex items-center gap-2">
            <ShieldCheck className="text-[#008080]" size={24} /> KONTROL UTAMA
            SISTEM
          </h2>
          <p className="text-[10px] text-slate-400 mt-1 tracking-widest font-bold">
            OPERASIONAL & PARAMETER KEAMANAN APLIKASI PASARQU.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-slate-900 text-white px-8 py-3 rounded-md font-black text-[11px] tracking-widest flex items-center gap-2 hover:bg-[#008080] transition-all border-b-4 border-black/20 disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="animate-spin" size={16} />
          ) : (
            <Save size={16} />
          )}
          SIMPAN KONFIGURASI
        </button>
      </div>

      {/* AI AUDITOR BANNER */}
      {aiWarning && (
        <div className="bg-slate-900 border-l-8 border-orange-500 p-4 rounded-md flex items-center gap-4 shadow-xl">
          <div className="w-10 h-10 bg-orange-500 rounded-md flex items-center justify-center text-white shrink-0 shadow-lg">
            <Sparkles size={20} />
          </div>
          <div>
            <p className="text-[9px] font-black text-orange-400 tracking-widest">
              AI SECURITY AUDITOR
            </p>
            <p className="text-[11px] font-black text-white">{aiWarning}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. JANGKAUAN LAYANAN */}
        <section className="bg-white p-6 rounded-md border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="absolute -top-2 -right-2 text-slate-50 group-hover:text-teal-50 transition-colors">
            <MapPin size={80} />
          </div>
          <h3 className="text-[12px] font-black mb-6 flex items-center gap-2 relative z-10 border-b border-slate-100 pb-3">
            <MapPin size={18} className="text-[#008080]" /> LOGISTIK & RADIUS
          </h3>

          <div className="space-y-4 relative z-10">
            <div className="space-y-1.5">
              <label className="text-[9px] text-slate-400 tracking-widest">
                RADIUS MAKSIMAL PENGIRIMAN (KM)
              </label>
              <input
                type="number"
                name="max_distance_km"
                value={formData.max_distance_km}
                onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-md px-4 py-3 font-black text-[13px] focus:border-[#008080] outline-none transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] text-slate-400 tracking-widest">
                WHATSAPP CS CENTER
              </label>
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-md px-4 focus-within:border-[#008080]">
                <MessageCircle size={16} className="text-green-600" />
                <input
                  type="text"
                  name="cs_whatsapp"
                  value={formData.cs_whatsapp}
                  onChange={handleChange}
                  className="w-full bg-transparent py-3 font-black text-[13px] outline-none"
                  placeholder="628..."
                />
              </div>
            </div>
          </div>
        </section>

        {/* ✅ 2. MIDTRANS GATEWAY (SEKSI BARU) */}
        <section className="bg-white p-6 rounded-md border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="absolute -top-2 -right-2 text-slate-50 group-hover:text-blue-50 transition-colors">
            <Zap size={80} />
          </div>
          <h3 className="text-[12px] font-black mb-6 flex items-center gap-2 relative z-10 border-b border-slate-100 pb-3">
            <Zap size={18} className="text-blue-600" /> MIDTRANS PAYMENT
          </h3>

          <div className="space-y-4 relative z-10">
            <div className="space-y-1.5">
              <label className="text-[9px] text-slate-400 tracking-widest">
                MIDTRANS CLIENT KEY (PUBLIC)
              </label>
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-md px-4 focus-within:border-blue-600">
                <Globe size={16} className="text-slate-400" />
                <input
                  type="text"
                  name="midtrans_client_key"
                  value={formData.midtrans_client_key}
                  onChange={handleChange}
                  className="w-full bg-transparent py-3 font-black text-[11px] outline-none"
                  placeholder="SB-Mid-client-..."
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] text-slate-400 tracking-widest">
                MIDTRANS SERVER KEY (SECRET)
              </label>
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-md px-4 focus-within:border-red-600">
                <Lock size={16} className="text-red-600" />
                <input
                  type="password" // Agar kunci rahasia tidak terlihat
                  name="midtrans_server_key"
                  value={formData.midtrans_server_key}
                  onChange={handleChange}
                  className="w-full bg-transparent py-3 font-black text-[11px] outline-none"
                  placeholder="SB-Mid-server-..."
                />
              </div>
            </div>

            <div
              className={`p-3 rounded-md border-2 transition-all flex items-center justify-between ${formData.midtrans_is_production ? "bg-blue-50 border-blue-200" : "bg-slate-50 border-slate-100"}`}
            >
              <div>
                <h4
                  className={`text-[10px] font-black ${formData.midtrans_is_production ? "text-blue-700" : "text-slate-600"}`}
                >
                  PRODUCTION MODE
                </h4>
                <p className="text-[8px] font-bold text-slate-400 tracking-widest">
                  OFF = SANDBOX (TESTING)
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="midtrans_is_production"
                  checked={formData.midtrans_is_production}
                  onChange={handleChange}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-slate-300 rounded-full peer peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"></div>
              </label>
            </div>
          </div>
        </section>

        {/* 3. PEMELIHARAAN SISTEM */}
        <section className="bg-white p-6 rounded-md border border-slate-200 shadow-sm relative overflow-hidden group md:col-span-2">
          <div className="absolute -top-2 -right-2 text-slate-50 group-hover:text-red-50 transition-colors">
            <Server size={80} />
          </div>
          <h3 className="text-[12px] font-black mb-6 flex items-center gap-2 relative z-10 border-b border-slate-100 pb-3">
            <Server size={18} className="text-red-600" /> STATUS APLIKASI
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
            <div className="space-y-1.5">
              <label className="text-[9px] text-slate-400 tracking-widest">
                VERSI MINIMUM (FORCE UPDATE)
              </label>
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-md px-4">
                <Smartphone size={16} className="text-slate-400" />
                <input
                  type="text"
                  name="min_app_version"
                  value={formData.min_app_version}
                  onChange={handleChange}
                  className="w-full bg-transparent py-3 font-black text-[13px] outline-none"
                  placeholder="1.0.0"
                />
              </div>
            </div>

            <div
              className={`p-4 rounded-md border-2 transition-all flex items-center justify-between ${formData.is_maintenance ? "bg-red-50 border-red-200" : "bg-slate-50 border-slate-100"}`}
            >
              <div>
                <h4
                  className={`text-[11px] font-black ${formData.is_maintenance ? "text-red-700" : "text-slate-600"}`}
                >
                  MAINTENANCE MODE
                </h4>
                <p className="text-[8px] font-bold text-slate-400 tracking-widest">
                  KUNCI AKSES GLOBAL
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="is_maintenance"
                  checked={formData.is_maintenance}
                  onChange={handleChange}
                  className="sr-only peer"
                />
                <div className="w-12 h-6 bg-slate-300 rounded-full peer peer-checked:bg-red-600 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
              </label>
            </div>
          </div>
        </section>
      </div>

      {/* FOOTER NOTICE */}
      <div className="bg-slate-900 p-4 rounded-md text-center border-b-4 border-[#008080] shadow-xl">
        <p className="text-[9px] text-white/50 font-black tracking-[0.2em]">
          PERUBAHAN PADA PANEL INI BERSIFAT INSTAN DAN MEMPENGARUHI SELURUH NODE
          PENGGUNA.
        </p>
      </div>
    </div>
  );
};

export default GlobalConfig;
