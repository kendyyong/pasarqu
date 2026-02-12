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
} from "lucide-react";
import { useToast } from "../../../contexts/ToastContext";
import { createAuditLog } from "../../../lib/auditHelper"; // <--- Import Helper Audit

export const GlobalConfig = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // State untuk menyimpan nilai form
  const [formData, setFormData] = useState({
    platform_fee: 0,
    tax_percent: 0,
    max_distance_km: 0,
    min_withdraw: 0,
    min_app_version: "",
    is_maintenance: false,
    cs_whatsapp: "",
  });

  // 1. Ambil Data Saat Ini
  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("app_settings")
        .select("*")
        .eq("id", 1) // Kita hanya pakai ID 1
        .single();

      if (error) throw error;
      if (data) {
        setFormData({
          platform_fee: data.platform_fee,
          tax_percent: data.tax_percent,
          max_distance_km: data.max_distance_km,
          min_withdraw: data.min_withdraw,
          min_app_version: data.min_app_version,
          is_maintenance: data.is_maintenance,
          cs_whatsapp: data.cs_whatsapp,
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

  // 2. Simpan Perubahan
  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("app_settings")
        .update(formData)
        .eq("id", 1);

      if (error) throw error;

      // --- OTOMATIS CATAT KE CCTV (AUDIT LOGS) ---
      await createAuditLog(
        "UPDATE_GLOBAL_SETTINGS",
        "SYSTEM",
        `Mengubah pengaturan aplikasi (Fee: ${formData.platform_fee}, Maintenance: ${formData.is_maintenance}, Versi: ${formData.min_app_version})`,
      );

      showToast("Pengaturan Global berhasil diperbarui!", "success");
    } catch (err: any) {
      showToast("Gagal menyimpan: " + err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  // Helper Input Change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  if (loading)
    return (
      <div className="flex justify-center py-20 text-left">
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
            Variabel Global Aplikasi Pasarqu
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
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

      {/* 1. PENGATURAN KEUANGAN */}
      <section className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-md transition-all">
        <div className="absolute top-0 right-0 p-6 text-slate-100 group-hover:text-teal-50 transition-colors">
          <DollarSign size={64} />
        </div>
        <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest mb-6 flex items-center gap-2 relative z-10">
          <DollarSign size={18} className="text-teal-600" /> Keuangan &
          Transaksi
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
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
            <p className="text-[9px] text-slate-400">
              Biaya admin per transaksi user.
            </p>
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
            <p className="text-[9px] text-slate-400">
              Persentase pajak per order.
            </p>
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
            <p className="text-[9px] text-slate-400">
              Batas minimal tarik saldo mitra.
            </p>
          </div>
        </div>
      </section>

      {/* 2. PENGATURAN OPERASIONAL */}
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
            <p className="text-[9px] text-slate-400">
              Jarak maksimal kurir bisa ambil order.
            </p>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              WhatsApp Customer Service
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

      {/* 3. PENGATURAN SISTEM (DANGER ZONE) */}
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
            <p className="text-[9px] text-slate-400">
              User dengan versi di bawah ini wajib update.
            </p>
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
