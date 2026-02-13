import React, { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { useToast } from "../../../contexts/ToastContext";
import {
  Plus,
  Settings2,
  Save,
  MapPin,
  Loader2,
  Store,
  Bike,
} from "lucide-react";

export const SuperRegionalFinanceTab: React.FC = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);

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

  const fetchSettings = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("regional_finance_settings")
      .select("*")
      .order("kecamatan");
    if (data) setSettings(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = formData.id
      ? await supabase
          .from("regional_finance_settings")
          .update(formData)
          .eq("id", formData.id)
      : await supabase.from("regional_finance_settings").insert([formData]);

    if (!error) {
      showToast("Data Keuangan Berhasil Disimpan", "success");
      setShowForm(false);
      fetchSettings();
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6 text-left">
      <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
        <h2 className="text-xl font-black text-slate-800 uppercase italic">
          Finansial Wilayah
        </h2>
        <button
          onClick={() => {
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
            setShowForm(true);
          }}
          className="p-3 bg-slate-900 text-white rounded-xl hover:bg-teal-600 transition-all"
        >
          <Plus size={20} />
        </button>
      </div>

      {showForm ? (
        <form
          onSubmit={handleSave}
          className="bg-white p-8 rounded-[2.5rem] shadow-2xl border border-slate-100 space-y-6 animate-in zoom-in-95"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <p className="text-[10px] font-black text-teal-600 uppercase tracking-widest">
                Aturan Dasar
              </p>
              <input
                required
                placeholder="Nama Kecamatan"
                value={formData.kecamatan}
                onChange={(e) =>
                  setFormData({ ...formData, kecamatan: e.target.value })
                }
                className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold"
              />
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="number"
                  placeholder="Tarif Dasar"
                  value={formData.flat_rate_amount}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      flat_rate_amount: Number(e.target.value),
                    })
                  }
                  className="p-4 bg-slate-50 rounded-2xl border-none font-bold"
                />
                <input
                  type="number"
                  placeholder="Jarak Dasar (km)"
                  value={formData.flat_distance_km}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      flat_distance_km: Number(e.target.value),
                    })
                  }
                  className="p-4 bg-slate-50 rounded-2xl border-none font-bold"
                />
              </div>
            </div>
            <div className="space-y-4">
              <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest">
                Aturan Multi-Toko
              </p>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="number"
                  placeholder="Biaya +Toko"
                  value={formData.extra_pickup_fee_total}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      extra_pickup_fee_total: Number(e.target.value),
                    })
                  }
                  className="p-4 bg-slate-50 rounded-2xl border-none font-bold"
                />
                <input
                  type="number"
                  placeholder="Max Toko"
                  value={formData.max_merchants_per_order}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      max_merchants_per_order: Number(e.target.value),
                    })
                  }
                  className="p-4 bg-slate-50 rounded-2xl border-none font-bold"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="number"
                  placeholder="Jatah Kurir"
                  value={formData.extra_pickup_fee_courier}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      extra_pickup_fee_courier: Number(e.target.value),
                    })
                  }
                  className="p-4 bg-teal-50 text-teal-700 rounded-2xl border-none font-bold"
                />
                <input
                  type="number"
                  placeholder="Jatah App"
                  value={formData.extra_pickup_fee_app}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      extra_pickup_fee_app: Number(e.target.value),
                    })
                  }
                  className="p-4 bg-orange-50 text-orange-700 rounded-2xl border-none font-bold"
                />
              </div>
            </div>
          </div>
          <button
            type="submit"
            className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-teal-600 transition-all"
          >
            {saving ? (
              <Loader2 className="animate-spin mx-auto" />
            ) : (
              "Simpan Konfigurasi"
            )}
          </button>
        </form>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {settings.map((s) => (
            <div
              key={s.id}
              className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex justify-between items-center"
            >
              <div>
                <h4 className="font-black text-slate-800 uppercase">
                  {s.kecamatan}
                </h4>
                <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">
                  Base: Rp{s.flat_rate_amount.toLocaleString()} | Multi: Rp
                  {s.extra_pickup_fee_total.toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setFormData(s) || setShowForm(true)}
                className="p-2 text-slate-400 hover:text-teal-600"
              >
                <Settings2 size={18} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
