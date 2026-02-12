import React, { useState, useEffect } from "react";
import { Coins, Loader2 } from "lucide-react";
import { supabase } from "../../../lib/supabaseClient";
import { useToast } from "../../../contexts/ToastContext";

interface Props {
  marketId: string;
  onClose: () => void;
}

export const ShippingRateModal: React.FC<Props> = ({ marketId, onClose }) => {
  const { showToast } = useToast();
  const [rates, setRates] = useState([
    { min_km: 0, max_km: 5, price: 5000 },
    { min_km: 6, max_km: 7, price: 7000 },
    { min_km: 8, max_km: 10, price: 10000 },
  ]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load Data saat Modal Dibuka
  useEffect(() => {
    const loadRates = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("market_shipping_rates")
        .select("*")
        .eq("market_id", marketId)
        .order("min_km", { ascending: true });

      if (data && data.length > 0) {
        // Mapping data DB ke State
        const formatted = data.map((r) => ({
          min_km: r.min_km,
          max_km: r.max_km,
          price: r.price,
        }));
        // Merge dengan default jika kurang dari 3 baris (opsional)
        const merged = [...rates];
        formatted.forEach((item, index) => {
          if (index < 3) merged[index] = item;
          else merged.push(item);
        });
        setRates(merged);
      }
      setLoading(false);
    };
    loadRates();
  }, [marketId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // 1. Reset tarif lama
      await supabase
        .from("market_shipping_rates")
        .delete()
        .eq("market_id", marketId);

      // 2. Simpan tarif baru
      const toInsert = rates.map((r) => ({
        market_id: marketId,
        min_km: r.min_km,
        max_km: r.max_km,
        price: r.price,
      }));

      const { error } = await supabase
        .from("market_shipping_rates")
        .insert(toInsert);
      if (error) throw error;

      showToast("Tarif Ongkir Berhasil Disimpan!", "success");
      onClose();
    } catch (e: any) {
      showToast(e.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const updateRate = (index: number, field: string, value: number) => {
    const newRates = [...rates];
    (newRates[index] as any)[field] = value;
    setRates(newRates);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-lg p-8 rounded-[3rem] shadow-2xl">
        <h2 className="text-xl font-black uppercase mb-6 text-slate-800 flex items-center gap-2">
          <Coins size={24} className="text-orange-500" /> Atur Tarif Ongkir
        </h2>

        {loading ? (
          <div className="py-10 text-center">
            <Loader2 className="animate-spin mx-auto text-teal-600" />
          </div>
        ) : (
          <div className="space-y-4">
            {rates.map((rate, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 p-4 border border-slate-200 rounded-2xl bg-slate-50 hover:bg-white transition-all"
              >
                <div className="flex-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">
                    Jarak (KM)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={rate.min_km}
                      onChange={(e) =>
                        updateRate(idx, "min_km", Number(e.target.value))
                      }
                      className="w-12 bg-transparent font-black text-slate-700 border-b border-slate-300 text-center outline-none focus:border-orange-500"
                    />
                    <span className="text-slate-400 font-bold">-</span>
                    <input
                      type="number"
                      value={rate.max_km}
                      onChange={(e) =>
                        updateRate(idx, "max_km", Number(e.target.value))
                      }
                      className="w-12 bg-transparent font-black text-slate-700 border-b border-slate-300 text-center outline-none focus:border-orange-500"
                    />
                    <span className="text-xs font-bold text-slate-500 ml-1">
                      KM
                    </span>
                  </div>
                </div>
                <div className="flex-1 border-l pl-4 border-slate-200">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">
                    Harga (Rp)
                  </label>
                  <input
                    type="number"
                    value={rate.price}
                    onChange={(e) =>
                      updateRate(idx, "price", Number(e.target.value))
                    }
                    className="w-full bg-transparent font-black text-lg text-emerald-600 outline-none placeholder:text-slate-300"
                    placeholder="0"
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-3 mt-8">
          <button
            onClick={onClose}
            className="flex-1 py-4 text-slate-400 font-bold text-xs uppercase hover:bg-slate-100 rounded-xl transition-all"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-4 bg-orange-500 text-white font-black text-xs uppercase rounded-xl hover:scale-105 transition-all shadow-lg shadow-orange-500/30 flex justify-center"
          >
            {saving ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              "Simpan Tarif"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
