import React, { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import {
  Save,
  Server,
  Smartphone,
  DollarSign,
  MapPin,
  MessageCircle,
  AlertTriangle,
  Loader2,
  Image as ImageIcon,
  Upload,
  Palette,
  LayoutTemplate,
  Sparkles,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { useToast } from "../../../contexts/ToastContext";
import { createAuditLog } from "../../../lib/auditHelper";
import { useConfig } from "../../../contexts/ConfigContext";

export const GlobalConfig = () => {
  const { showToast } = useToast();
  const { refreshConfig } = useConfig();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // State untuk AI Auditor
  const [aiWarning, setAiWarning] = useState<string | null>(null);

  // State untuk menyimpan nilai form
  const [formData, setFormData] = useState({
    // --- BRANDING ---
    app_name: "Pasarqu",
    logo_url: "",
    primary_color: "#059669",

    // --- SYSTEM ---
    platform_fee: 0,
    tax_percent: 0,
    max_distance_km: 0,
    min_withdraw: 0,
    min_app_version: "",
    is_maintenance: false,
    cs_whatsapp: "",
    min_wallet_limit: 0, // <--- Field Baru untuk Auto-Freeze
  });

  // 1. Ambil Data Saat Ini
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
          app_name: data.app_name || "Pasarqu",
          logo_url: data.logo_url || "",
          primary_color: data.primary_color || "#059669",
          platform_fee: data.platform_fee || 0,
          tax_percent: data.tax_percent || 0,
          max_distance_km: data.max_distance_km || 0,
          min_withdraw: data.min_withdraw || 0,
          min_app_version: data.min_app_version || "",
          is_maintenance: data.is_maintenance || false,
          cs_whatsapp: data.cs_whatsapp || "",
          min_wallet_limit: data.min_wallet_limit || 0, // <--- Load data limit
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

  // --- LOGIKA AI AUDITOR (GUARDRAIL) ---
  useEffect(() => {
    const runAiAudit = () => {
      if (formData.platform_fee > 50000) {
        setAiWarning(
          "AI Alert: Platform fee terdeteksi sangat tinggi (di atas Rp 50.000). Ini bisa menurunkan minat transaksi.",
        );
      } else if (formData.min_wallet_limit > 50000) {
        setAiWarning(
          "AI Alert: Limit Auto-Freeze terlalu tinggi. Kurir dengan saldo Rp 50.000 masih akan diblokir, ini bisa menghambat operasional.",
        );
      } else if (formData.tax_percent > 20) {
        setAiWarning(
          "AI Alert: Persentase pajak di atas 20% mungkin melanggar regulasi standar atau memberatkan user.",
        );
      } else if (formData.max_distance_km > 50) {
        setAiWarning(
          "AI Alert: Radius pengiriman di atas 50KM sangat berisiko untuk kurir motor dan kesegaran barang.",
        );
      } else if (formData.is_maintenance) {
        setAiWarning(
          "AI Info: Mode Perbaikan sedang aktif. Semua pengguna tidak akan bisa mengakses aplikasi.",
        );
      } else {
        setAiWarning(null);
      }
    };
    runAiAudit();
  }, [formData]);

  // 2. Handle Upload Logo
  const handleLogoUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) return;

      const file = event.target.files[0];
      const fileExt = file.name.split(".").pop();
      const fileName = `app-logo-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("app-assets")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("app-assets")
        .getPublicUrl(filePath);

      setFormData((prev) => ({ ...prev, logo_url: data.publicUrl }));
      showToast(
        "Logo berhasil diupload (Klik Simpan untuk menerapkan)",
        "success",
      );
    } catch (error: any) {
      showToast("Gagal upload gambar: " + error.message, "error");
    } finally {
      setUploading(false);
    }
  };

  // 3. Simpan Perubahan
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
        `Mengubah pengaturan aplikasi (App: ${formData.app_name}, Limit Freeze: Rp ${formData.min_wallet_limit})`,
      );

      showToast("Pengaturan Global berhasil diperbarui!", "success");
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
    <div className="space-y-6 max-w-4xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500 text-left">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter">
            Konfigurasi Sistem
          </h2>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
            Branding & Variabel Global Aplikasi
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || uploading}
          className="bg-teal-600 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-teal-700 active:scale-95 transition-all shadow-lg shadow-teal-600/20 disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="animate-spin" size={16} />
          ) : (
            <Save size={16} />
          )}
          Simpan Perubahan
        </button>
      </div>

      {/* --- AI AUDITOR BANNER --- */}
      {aiWarning && (
        <div className="bg-amber-50 border border-amber-100 p-4 rounded-[1.5rem] flex items-center gap-4 animate-in zoom-in-95 duration-300">
          <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-amber-500/20">
            <Sparkles size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black text-amber-800 uppercase tracking-widest mb-0.5">
              AI Security Auditor
            </p>
            <p className="text-xs font-bold text-amber-600 leading-relaxed">
              {aiWarning}
            </p>
          </div>
        </div>
      )}

      {/* 1. BRANDING & IDENTITAS */}
      <section className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-md transition-all">
        <div className="absolute top-0 right-0 p-6 text-slate-100 group-hover:text-pink-50 transition-colors">
          <LayoutTemplate size={64} />
        </div>
        <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest mb-6 flex items-center gap-2 relative z-10">
          <Palette size={18} className="text-pink-500" /> Branding & Identitas
        </h3>

        <div className="flex flex-col md:flex-row gap-8 items-center relative z-10">
          <div className="text-center">
            <div className="relative w-32 h-32 mx-auto bg-slate-50 rounded-full border-4 border-dashed border-slate-200 flex items-center justify-center overflow-hidden group/img cursor-pointer">
              {formData.logo_url ? (
                <img
                  src={formData.logo_url}
                  alt="Logo"
                  className="w-full h-full object-contain p-2"
                />
              ) : (
                <ImageIcon className="text-slate-300" size={32} />
              )}
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity">
                <Upload className="text-white" size={20} />
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </div>
            {uploading && (
              <p className="text-[10px] text-orange-500 font-bold mt-2 animate-pulse">
                Mengupload...
              </p>
            )}
            <p className="text-[9px] text-slate-400 mt-2 font-medium">
              Klik untuk ganti logo
            </p>
          </div>

          <div className="flex-1 w-full space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Nama Aplikasi
              </label>
              <input
                type="text"
                name="app_name"
                value={formData.app_name}
                onChange={handleChange}
                className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 font-bold text-slate-700 focus:ring-2 focus:ring-pink-500 transition-all outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Warna Utama (Hex)
              </label>
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg shadow-sm border border-slate-200"
                  style={{ backgroundColor: formData.primary_color }}
                ></div>
                <input
                  type="text"
                  name="primary_color"
                  value={formData.primary_color}
                  onChange={handleChange}
                  className="flex-1 bg-slate-50 border-none rounded-xl px-4 py-3 font-bold text-slate-700 focus:ring-2 focus:ring-pink-500 transition-all outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. KEUANGAN & TRANSAKSI */}
      <section className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-md transition-all">
        <div className="absolute top-0 right-0 p-6 text-slate-100 group-hover:text-teal-50 transition-colors">
          <DollarSign size={64} />
        </div>
        <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest mb-6 flex items-center gap-2 relative z-10">
          <DollarSign size={18} className="text-teal-600" /> Keuangan &
          Transaksi
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Platform Fee (Rp)
            </label>
            <input
              type="number"
              name="platform_fee"
              value={formData.platform_fee}
              onChange={handleChange}
              className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 font-bold text-slate-700 focus:ring-2 focus:ring-teal-500 transition-all outline-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Pajak / Tax (%)
            </label>
            <input
              type="number"
              name="tax_percent"
              value={formData.tax_percent}
              onChange={handleChange}
              className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 font-bold text-slate-700 focus:ring-2 focus:ring-teal-500 transition-all outline-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Min. Withdraw (Rp)
            </label>
            <input
              type="number"
              name="min_withdraw"
              value={formData.min_withdraw}
              onChange={handleChange}
              className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 font-bold text-slate-700 focus:ring-2 focus:ring-teal-500 transition-all outline-none"
            />
          </div>
          {/* INPUT BARU: AUTO-FREEZE LIMIT */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-red-500 uppercase tracking-widest">
              Auto-Freeze (Rp)
            </label>
            <input
              type="number"
              name="min_wallet_limit"
              value={formData.min_wallet_limit}
              onChange={handleChange}
              className="w-full bg-red-50 border-none rounded-xl px-4 py-3 font-black text-red-700 focus:ring-2 focus:ring-red-500 transition-all outline-none"
            />
          </div>
        </div>
      </section>

      {/* 3. OPERASIONAL */}
      <section className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-md transition-all">
        <div className="absolute top-0 right-0 p-6 text-slate-100 group-hover:text-blue-50 transition-colors">
          <MapPin size={64} />
        </div>
        <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest mb-6 flex items-center gap-2 relative z-10">
          <MapPin size={18} className="text-blue-500" /> Operasional & Layanan
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Max Radius (KM)
            </label>
            <input
              type="number"
              name="max_distance_km"
              value={formData.max_distance_km}
              onChange={handleChange}
              className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 transition-all outline-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              WhatsApp CS
            </label>
            <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-4 border border-transparent focus-within:ring-2 focus-within:ring-blue-500 transition-all">
              <MessageCircle size={16} className="text-green-500" />
              <input
                type="text"
                name="cs_whatsapp"
                value={formData.cs_whatsapp}
                onChange={handleChange}
                className="w-full bg-transparent border-none py-3 font-bold text-slate-700 outline-none"
                placeholder="628..."
              />
            </div>
          </div>
        </div>
      </section>

      {/* 4. SYSTEM CONTROL */}
      <section className="bg-white p-8 rounded-[2rem] shadow-sm border border-red-100 relative overflow-hidden group hover:shadow-md transition-all text-left">
        <div className="absolute top-0 right-0 p-6 text-slate-100 group-hover:text-red-50 transition-colors">
          <Server size={64} />
        </div>
        <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest mb-6 flex items-center gap-2 relative z-10">
          <Server size={18} className="text-red-500" /> System Control (Danger
          Zone)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10 items-center">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Min. App Version
            </label>
            <div className="flex items-center gap-2">
              <Smartphone size={16} className="text-slate-400" />
              <input
                type="text"
                name="min_app_version"
                value={formData.min_app_version}
                onChange={handleChange}
                className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 font-bold text-slate-700 focus:ring-2 focus:ring-red-500 transition-all outline-none"
                placeholder="1.0.0"
              />
            </div>
          </div>

          <div className="bg-red-50 p-4 rounded-2xl border border-red-100">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-black text-red-600 text-sm uppercase flex items-center gap-2">
                  <AlertTriangle size={16} /> Maintenance Mode
                </h4>
                <p className="text-[10px] text-red-400 mt-1 font-bold">
                  Matikan akses aplikasi sementara
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
                <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-red-600"></div>
              </label>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default GlobalConfig;
