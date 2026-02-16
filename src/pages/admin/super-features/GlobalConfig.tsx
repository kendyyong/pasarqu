import React, { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import {
  Save,
  Server,
  Smartphone,
  MapPin,
  MessageCircle,
  AlertTriangle,
  Loader2,
  Sparkles,
} from "lucide-react";
import { useToast } from "../../../contexts/ToastContext";
import { createAuditLog } from "../../../lib/auditHelper";
import { useConfig } from "../../../contexts/ConfigContext";

export const GlobalConfig = () => {
  const { showToast } = useToast();
  const { refreshConfig } = useConfig();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // State untuk AI Auditor
  const [aiWarning, setAiWarning] = useState<string | null>(null);

  // State Bersih (Hanya Operasional & System)
  const [formData, setFormData] = useState({
    max_distance_km: 0,
    min_app_version: "",
    is_maintenance: false,
    cs_whatsapp: "",
  });

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("app_settings")
        .select("max_distance_km, min_app_version, is_maintenance, cs_whatsapp")
        .eq("id", 1)
        .single();

      if (error) throw error;
      if (data) {
        setFormData({
          max_distance_km: data.max_distance_km || 0,
          min_app_version: data.min_app_version || "",
          is_maintenance: data.is_maintenance || false,
          cs_whatsapp: data.cs_whatsapp || "",
        });
      }
    } catch (err: any) {
      showToast("Gagal memuat pengaturan: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // --- LOGIKA AI AUDITOR (GUARDRAIL OPERASIONAL) ---
  useEffect(() => {
    const runAiAudit = () => {
      if (formData.max_distance_km > 50) {
        setAiWarning(
          "AI Alert: Radius > 50KM berisiko bagi kurir motor & kesegaran barang.",
        );
      } else if (formData.is_maintenance) {
        setAiWarning(
          "AI Info: Mode Perbaikan sedang aktif. Seluruh akses aplikasi ditutup.",
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
        `Mengubah operasional sistem (Radius: ${formData.max_distance_km}KM, Maintenance: ${formData.is_maintenance})`,
      );

      showToast("Pengaturan sistem diperbarui!", "success");
    } catch (err: any) {
      showToast("Gagal menyimpan: " + err.message, "error");
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
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-teal-600" size={32} />
      </div>
    );

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500 text-left text-slate-800">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-black uppercase tracking-tighter">
            Kontrol Utama Sistem
          </h2>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
            Operasional & Keamanan Aplikasi
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-slate-900 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-teal-600 active:scale-95 transition-all shadow-lg shadow-slate-200 disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="animate-spin" size={16} />
          ) : (
            <Save size={16} />
          )}
          Simpan Perubahan
        </button>
      </div>

      {/* AI AUDITOR BANNER */}
      {aiWarning && (
        <div className="bg-amber-50 border border-amber-100 p-4 rounded-[1.5rem] flex items-center gap-4">
          <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-white shrink-0">
            <Sparkles size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black text-amber-800 uppercase tracking-widest">
              AI Security Auditor
            </p>
            <p className="text-xs font-bold text-amber-600">{aiWarning}</p>
          </div>
        </div>
      )}

      {/* 1. OPERASIONAL */}
      <section className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-md transition-all">
        <div className="absolute top-0 right-0 p-6 text-slate-50 group-hover:text-blue-50 transition-colors">
          <MapPin size={64} />
        </div>
        <h3 className="text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2 relative z-10">
          <MapPin size={18} className="text-blue-500" /> Jangkauan & Layanan
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Radius Maksimal (KM)
            </label>
            <input
              type="number"
              name="max_distance_km"
              value={formData.max_distance_km}
              onChange={handleChange}
              className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 font-bold focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              WhatsApp Center
            </label>
            <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-4 focus-within:ring-2 focus-within:ring-blue-500">
              <MessageCircle size={16} className="text-green-500" />
              <input
                type="text"
                name="cs_whatsapp"
                value={formData.cs_whatsapp}
                onChange={handleChange}
                className="w-full bg-transparent border-none py-3 font-bold outline-none"
                placeholder="628..."
              />
            </div>
          </div>
        </div>
      </section>

      {/* 2. KONTROL APLIKASI */}
      <section className="bg-white p-8 rounded-[2rem] shadow-sm border border-red-100 relative overflow-hidden group hover:shadow-md transition-all">
        <div className="absolute top-0 right-0 p-6 text-slate-50 group-hover:text-red-50 transition-colors">
          <Server size={64} />
        </div>
        <h3 className="text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2 relative z-10">
          <Server size={18} className="text-red-500" /> Pemeliharaan Sistem
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10 items-center">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Versi Aplikasi Minimum
            </label>
            <div className="flex items-center gap-2">
              <Smartphone size={16} className="text-slate-400" />
              <input
                type="text"
                name="min_app_version"
                value={formData.min_app_version}
                onChange={handleChange}
                className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 font-bold focus:ring-2 focus:ring-red-500 outline-none"
                placeholder="1.0.0"
              />
            </div>
          </div>

          <div className="bg-red-50 p-6 rounded-2xl border border-red-100 flex items-center justify-between">
            <div>
              <h4 className="font-black text-red-600 text-sm uppercase flex items-center gap-2">
                <AlertTriangle size={16} /> Maintenance Mode
              </h4>
              <p className="text-[10px] text-red-400 font-bold mt-1">
                Kunci aplikasi untuk semua user
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
              <div className="w-14 h-7 bg-slate-200 rounded-full peer peer-checked:bg-red-600 after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:after:translate-x-full"></div>
            </label>
          </div>
        </div>
      </section>
    </div>
  );
};

export default GlobalConfig;
