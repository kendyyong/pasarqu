import React, { useEffect, useState } from "react";
import { supabase } from "../../../../lib/supabaseClient";
import {
  Save,
  Server,
  Smartphone,
  MapPin,
  MessageCircle,
  Loader2,
  ShieldCheck,
  RefreshCw,
  Zap,
  Lock,
  FileText,
  ShieldAlert,
  Bold,
  Italic,
  List,
  Heading,
} from "lucide-react";
import { useToast } from "../../../../contexts/ToastContext";
import { createAuditLog } from "../../../../lib/auditHelper";
import { useConfig } from "../../../../contexts/ConfigContext";

export const GlobalConfig = () => {
  const { showToast } = useToast();
  const { refreshConfig } = useConfig();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // STATE DATA
  const [formData, setFormData] = useState({
    max_distance_km: 0,
    min_app_version: "",
    is_maintenance: false,
    cs_whatsapp: "",
    midtrans_client_key: "",
    midtrans_server_key: "",
    midtrans_is_production: false,
    terms_conditions: "",
    privacy_policy: "",
  });

  const fetchSettings = async () => {
    setLoading(true);
    try {
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
          terms_conditions: data.terms_conditions || "",
          privacy_policy: data.privacy_policy || "",
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

  const handleSave = async () => {
    setSaving(true);
    try {
      // Filter payload agar hanya mengirim kolom database yang valid
      const payload = {
        max_distance_km: formData.max_distance_km,
        min_app_version: formData.min_app_version,
        is_maintenance: formData.is_maintenance,
        cs_whatsapp: formData.cs_whatsapp,
        midtrans_client_key: formData.midtrans_client_key,
        midtrans_server_key: formData.midtrans_server_key,
        midtrans_is_production: formData.midtrans_is_production,
        terms_conditions: formData.terms_conditions,
        privacy_policy: formData.privacy_policy,
      };

      const { error } = await supabase
        .from("app_settings")
        .update(payload)
        .eq("id", 1);

      if (error) throw error;

      await refreshConfig();
      await createAuditLog(
        "UPDATE_GLOBAL_SETTINGS",
        "SYSTEM",
        "Update Operasional & Dokumen Hukum",
      );

      showToast("KONFIGURASI BERHASIL DISIMPAN", "success");
    } catch (err: any) {
      console.error("Save error:", err);
      showToast(`GAGAL: ${err.message}`, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === "checkbox";

    setFormData((prev) => ({
      ...prev,
      [name]: isCheckbox ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const applyFormat = (
    field: "terms_conditions" | "privacy_policy",
    prefix: string,
    suffix: string,
  ) => {
    const textarea = document.getElementById(
      `editor-${field}`,
    ) as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = formData[field];
    const selectedText = text.substring(start, end);
    const newText =
      text.substring(0, start) +
      prefix +
      selectedText +
      suffix +
      text.substring(end);

    setFormData((prev) => ({ ...prev, [field]: newText }));

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 0);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4 font-black uppercase">
        <RefreshCw className="animate-spin text-[#008080]" size={40} />
        <p className="text-[10px] tracking-widest text-slate-400">
          SYNCING CORE SYSTEM...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-500 font-black uppercase tracking-tighter text-left pb-10">
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b-4 border-slate-900 pb-4">
        <div>
          <h2 className="text-[20px] font-black text-slate-900 flex items-center gap-2">
            <ShieldCheck className="text-[#008080]" size={24} /> KONTROL UTAMA
            SISTEM
          </h2>
          <p className="text-[10px] text-slate-400 mt-1 tracking-widest font-bold uppercase">
            OPERASIONAL, PEMBAYARAN & DOKUMEN HUKUM PASARQU.
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. LOGISTIK */}
        <section className="bg-white p-6 rounded-md border border-slate-200 shadow-sm uppercase">
          <h3 className="text-[12px] font-black mb-6 flex items-center gap-2 border-b border-slate-100 pb-3">
            <MapPin size={18} className="text-[#008080]" /> LOGISTIK & CS
          </h3>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[9px] text-slate-400 tracking-widest">
                RADIUS MAKS (KM)
              </label>
              <input
                type="number"
                name="max_distance_km"
                value={formData.max_distance_km}
                onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-md px-4 py-3 font-black text-[13px] outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] text-slate-400 tracking-widest">
                WHATSAPP CS
              </label>
              <input
                type="text"
                name="cs_whatsapp"
                value={formData.cs_whatsapp}
                onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-md px-4 py-3 font-black text-[13px] outline-none"
                placeholder="628..."
              />
            </div>
          </div>
        </section>

        {/* 2. MIDTRANS */}
        <section className="bg-white p-6 rounded-md border border-slate-200 shadow-sm uppercase">
          <h3 className="text-[12px] font-black mb-6 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Zap size={18} className="text-blue-600" /> MIDTRANS PAYMENT
          </h3>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[9px] text-slate-400 tracking-widest">
                CLIENT KEY
              </label>
              <input
                type="text"
                name="midtrans_client_key"
                value={formData.midtrans_client_key}
                onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-md px-4 py-3 font-black text-[11px] focus:border-blue-600 outline-none"
              />
            </div>
            <div className="space-y-1.5 text-left">
              <label className="text-[9px] text-slate-400 tracking-widest">
                SERVER KEY
              </label>
              <input
                type="password"
                name="midtrans_server_key"
                value={formData.midtrans_server_key}
                onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-md px-4 py-3 font-black text-[11px] focus:border-red-600 outline-none"
              />
            </div>
          </div>
        </section>

        {/* 3. EDITOR SYARAT & KETENTUAN */}
        <section className="bg-white rounded-md border border-slate-200 shadow-sm md:col-span-2 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <h3 className="text-[12px] font-black flex items-center gap-2 text-[#008080] uppercase">
              <FileText size={18} /> SYARAT & KETENTUAN
            </h3>
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-md p-1 shadow-sm">
              <button
                type="button"
                onClick={() => applyFormat("terms_conditions", "**", "**")}
                className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded transition-all"
              >
                <Bold size={14} />
              </button>
              <button
                type="button"
                onClick={() => applyFormat("terms_conditions", "_", "_")}
                className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded transition-all"
              >
                <Italic size={14} />
              </button>
              <div className="w-px h-4 bg-slate-200 mx-1"></div>
              <button
                type="button"
                onClick={() => applyFormat("terms_conditions", "\n### ", "")}
                className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded transition-all"
              >
                <Heading size={14} />
              </button>
              <button
                type="button"
                onClick={() => applyFormat("terms_conditions", "\n- ", "")}
                className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded transition-all"
              >
                <List size={14} />
              </button>
            </div>
          </div>
          <textarea
            id="editor-terms_conditions"
            name="terms_conditions"
            value={formData.terms_conditions}
            onChange={handleChange}
            className="w-full p-5 font-black text-[12px] min-h-[300px] outline-none focus:bg-teal-50/30 leading-relaxed text-slate-700 normal-case resize-y"
            placeholder="Ketik Syarat & Ketentuan di sini..."
          />
        </section>

        {/* 4. EDITOR KEBIJAKAN PRIVASI */}
        <section className="bg-white rounded-md border border-slate-200 shadow-sm md:col-span-2 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <h3 className="text-[12px] font-black flex items-center gap-2 text-orange-600 uppercase">
              <ShieldAlert size={18} /> KEBIJAKAN PRIVASI
            </h3>
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-md p-1 shadow-sm">
              <button
                type="button"
                onClick={() => applyFormat("privacy_policy", "**", "**")}
                className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded transition-all"
              >
                <Bold size={14} />
              </button>
              <button
                type="button"
                onClick={() => applyFormat("privacy_policy", "_", "_")}
                className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded transition-all"
              >
                <Italic size={14} />
              </button>
              <div className="w-px h-4 bg-slate-200 mx-1"></div>
              <button
                type="button"
                onClick={() => applyFormat("privacy_policy", "\n### ", "")}
                className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded transition-all"
              >
                <Heading size={14} />
              </button>
              <button
                type="button"
                onClick={() => applyFormat("privacy_policy", "\n- ", "")}
                className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded transition-all"
              >
                <List size={14} />
              </button>
            </div>
          </div>
          <textarea
            id="editor-privacy_policy"
            name="privacy_policy"
            value={formData.privacy_policy}
            onChange={handleChange}
            className="w-full p-5 font-black text-[12px] min-h-[300px] outline-none focus:bg-orange-50/30 leading-relaxed text-slate-700 normal-case resize-y"
            placeholder="Ketik Kebijakan Privasi di sini..."
          />
        </section>

        {/* 5. STATUS GLOBAL */}
        <section className="bg-white p-6 rounded-md border border-slate-200 shadow-sm md:col-span-2 uppercase">
          <h3 className="text-[12px] font-black mb-6 flex items-center gap-2 border-b border-slate-100 pb-3 text-red-600">
            <Server size={18} /> STATUS GLOBAL
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-[9px] text-slate-400 tracking-widest">
                MINIMUM APP VERSION
              </label>
              <input
                type="text"
                name="min_app_version"
                value={formData.min_app_version}
                onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-md px-4 py-3 font-black text-[13px] outline-none"
                placeholder="1.0.0"
              />
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
        <p className="text-[9px] text-white/50 font-black tracking-[0.2em] uppercase">
          PERUBAHAN PADA PANEL INI BERSIFAT INSTAN DAN MEMPENGARUHI SELURUH NODE
          PENGGUNA.
        </p>
      </div>
    </div>
  );
};

export default GlobalConfig;
