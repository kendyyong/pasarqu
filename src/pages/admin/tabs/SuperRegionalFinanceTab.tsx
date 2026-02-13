import React, { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { useToast } from "../../../contexts/ToastContext";
import {
  Plus,
  Search,
  MapPin,
  Settings2,
  Save,
  Trash2,
  Loader2,
  LayoutGrid,
  Bike,
  Store,
} from "lucide-react";

export const SuperRegionalFinanceTab: React.FC = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    id: "",
    kecamatan: "",
    flat_distance_km: 5,
    flat_rate_amount: 5000,
    extra_fee_per_km: 2000,
    extra_pickup_fee_total: 3000,
    extra_pickup_fee_courier: 2000,
    extra_pickup_fee_app: 1000,
    max_merchants_per_order: 3,
  });

  // PERBAIKAN DI SINI: Membungkus error handling dengan kurung kurawal yang benar
  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("regional_finance_settings")
        .select("*")
        .order("kecamatan", { ascending: true });

      if (error) {
        showToast("Gagal memuat data", "error");
      } else {
        setSettings(data || []);
      }
    } catch (err) {
      showToast("Terjadi kesalahan sistem", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const payload = {
      kecamatan: formData.kecamatan,
      flat_distance_km: Number(formData.flat_distance_km),
      flat_rate_amount: Number(formData.flat_rate_amount),
      extra_fee_per_km: Number(formData.extra_fee_per_km),
      extra_pickup_fee_total: Number(formData.extra_pickup_fee_total),
      extra_pickup_fee_courier: Number(formData.extra_pickup_fee_courier),
      extra_pickup_fee_app: Number(formData.extra_pickup_fee_app),
      max_merchants_per_order: Number(formData.max_merchants_per_order),
    };

    const { error } = formData.id
      ? await supabase
          .from("regional_finance_settings")
          .update(payload)
          .eq("id", formData.id)
      : await supabase.from("regional_finance_settings").insert(payload);

    if (error) {
      showToast(error.message, "error");
    } else {
      showToast("Pengaturan Wilayah Berhasil Disimpan", "success");
      setShowForm(false);
      resetForm();
      fetchSettings();
    }
    setSaving(false);
  };

  const resetForm = () => {
    setFormData({
      id: "",
      kecamatan: "",
      flat_distance_km: 5,
      flat_rate_amount: 5000,
      extra_fee_per_km: 2000,
      extra_pickup_fee_total: 3000,
      extra_pickup_fee_courier: 2000,
      extra_pickup_fee_app: 1000,
      max_merchants_per_order: 3,
    });
  };

  const editData = (item: any) => {
    setFormData(item);
    setShowForm(true);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 text-left">
      {/* HEADER TAB */}
      <div className="flex justify-between items-center bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter">
            Pengaturan Keuangan Wilayah
          </h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
            Atur Ongkir & Biaya Layanan per Kecamatan
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="p-4 bg-slate-900 text-white rounded-2xl hover:bg-teal-600 transition-all shadow-xl active:scale-95"
        >
          <Plus size={20} />
        </button>
      </div>

      {showForm ? (
        <form
          onSubmit={handleSave}
          className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-2xl space-y-8 animate-in zoom-in-95"
        >
          <div className="flex justify-between items-center">
            <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs flex items-center gap-2">
              <Settings2 size={16} className="text-teal-600" /> Konfigurasi
              Tarif: {formData.kecamatan || "Baru"}
            </h3>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-slate-400 hover:text-slate-600 font-black text-[10px] uppercase"
            >
              Batal
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* ONGKIR DASAR */}
            <div className="space-y-4">
              <p className="text-[10px] font-black text-teal-600 uppercase tracking-widest">
                A. Ongkir Berbasis Jarak
              </p>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase">
                  Nama Kecamatan
                </label>
                <input
                  required
                  type="text"
                  value={formData.kecamatan}
                  onChange={(e) =>
                    setFormData({ ...formData, kecamatan: e.target.value })
                  }
                  className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold"
                  placeholder="Contoh: Balikpapan Selatan"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase">
                    Tarif Flat (Rp)
                  </label>
                  <input
                    type="number"
                    value={formData.flat_rate_amount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        flat_rate_amount: Number(e.target.value),
                      })
                    }
                    className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase">
                    Jarak Flat (Km)
                  </label>
                  <input
                    type="number"
                    value={formData.flat_distance_km}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        flat_distance_km: Number(e.target.value),
                      })
                    }
                    className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold"
                  />
                </div>
              </div>
            </div>

            {/* MULTI PICKUP */}
            <div className="space-y-4">
              <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest">
                B. Logika Multi-Toko (Pickup)
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase">
                    Biaya Per Toko (Rp)
                  </label>
                  <input
                    type="number"
                    value={formData.extra_pickup_fee_total}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        extra_pickup_fee_total: Number(e.target.value),
                      })
                    }
                    className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase">
                    Max Toko/Order
                  </label>
                  <input
                    type="number"
                    value={formData.max_merchants_per_order}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        max_merchants_per_order: Number(e.target.value),
                      })
                    }
                    className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase">
                    Jatah Kurir (Rp)
                  </label>
                  <input
                    type="number"
                    value={formData.extra_pickup_fee_courier}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        extra_pickup_fee_courier: Number(e.target.value),
                      })
                    }
                    className="w-full p-4 bg-teal-50 text-teal-700 rounded-2xl border-none font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase">
                    Jatah Aplikasi (Rp)
                  </label>
                  <input
                    type="number"
                    value={formData.extra_pickup_fee_app}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        extra_pickup_fee_app: Number(e.target.value),
                      })
                    }
                    className="w-full p-4 bg-orange-50 text-orange-700 rounded-2xl border-none font-bold"
                  />
                </div>
              </div>
            </div>
          </div>

          <button
            disabled={saving}
            type="submit"
            className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black uppercase text-xs tracking-[0.3em] flex items-center justify-center gap-3 shadow-2xl hover:bg-teal-600 transition-all"
          >
            {saving ? (
              <Loader2 className="animate-spin" />
            ) : (
              <>
                <Save size={18} /> Simpan Pengaturan Wilayah
              </>
            )}
          </button>
        </form>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full flex justify-center py-20">
              <Loader2 className="animate-spin text-teal-600" size={40} />
            </div>
          ) : (
            settings.map((item) => (
              <div
                key={item.id}
                className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-teal-50 group-hover:text-teal-600 transition-colors">
                    <MapPin size={24} />
                  </div>
                  <button
                    onClick={() => editData(item)}
                    className="p-2 text-slate-300 hover:text-slate-600"
                  >
                    <Settings2 size={18} />
                  </button>
                </div>
                <h3 className="font-black text-slate-800 uppercase tracking-tighter text-lg">
                  {item.kecamatan}
                </h3>
                <div className="mt-6 space-y-3">
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                    <span className="text-slate-400">Ongkir Dasar</span>
                    <span className="text-slate-800">
                      Rp {item.flat_rate_amount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                    <span className="text-slate-400">Biaya +Toko</span>
                    <span className="text-teal-600">
                      Rp {item.extra_pickup_fee_total.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                    <span className="text-slate-400">Max Toko</span>
                    <span className="text-slate-800">
                      {item.max_merchants_per_order} Toko
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
