import React, { useState, useEffect } from "react";
import { supabase } from "../../../../lib/supabaseClient";
import {
  MapPin,
  Truck,
  Zap,
  Save,
  Calculator,
  Umbrella,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Coins,
  BadgePercent,
  RefreshCw,
  Percent,
  Store,
} from "lucide-react";

export const ShippingConfig: React.FC<any> = ({ theme }) => {
  const [rates, setRates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  // State Simulator
  const [simDist, setSimDist] = useState(5);
  const [simStops, setSimStops] = useState(1);
  const [simSurge, setSimSurge] = useState(false);
  const [selectedRate, setSelectedRate] = useState<any>(null);

  const fetchLogisticsData = async () => {
    setLoading(true);
    try {
      const { data: marketData } = await supabase
        .from("markets")
        .select("district")
        .not("district", "is", null);

      const uniqueDistricts = Array.from(
        new Set(marketData?.map((m) => m.district) || []),
      );

      const { data: rateData } = await supabase
        .from("shipping_rates")
        .select("*");

      const mergedData = uniqueDistricts
        .map((distName) => {
          const existingRate = rateData?.find(
            (r) => r.district_name === distName,
          );

          return (
            existingRate || {
              id: `temp_${distName}`,
              district_name: distName,
              base_fare: 8000,
              base_distance_km: 3,
              price_per_km: 2000,
              app_fee_percent: 20,
              buyer_service_fee: 2000,
              seller_admin_fee_percent: 5,
              multi_stop_fee: 2000, // Beban Extra Toko (Hak Kurir)
              multi_stop_courier_share: 2000,
              multi_stop_app_share: 1000, // Beban Extra Toko (Hak App)
              surge_fee: 0,
              is_new: true,
            }
          );
        })
        .sort((a, b) => a.district_name.localeCompare(b.district_name));

      setRates(mergedData);
      if (!selectedRate && mergedData.length > 0)
        setSelectedRate(mergedData[0]);
    } catch (err) {
      console.error("Error fetching logistics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogisticsData();
  }, []);

  const handleUpdate = (districtName: string, field: string, value: any) => {
    setRates((prev) =>
      prev.map((r) => {
        if (r.district_name === districtName) {
          const updated = { ...r, [field]: value };
          if (selectedRate?.district_name === districtName)
            setSelectedRate(updated);
          return updated;
        }
        return r;
      }),
    );
  };

  const saveToDb = async (rate: any) => {
    setSaving(rate.district_name);
    try {
      const dataToSave = {
        district_name: rate.district_name,
        base_fare: Number(rate.base_fare),
        base_distance_km: Number(rate.base_distance_km),
        price_per_km: Number(rate.price_per_km),
        app_fee_percent: Number(rate.app_fee_percent),
        buyer_service_fee: Number(rate.buyer_service_fee),
        seller_admin_fee_percent: Number(rate.seller_admin_fee_percent),
        multi_stop_fee: Number(rate.multi_stop_fee),
        multi_stop_courier_share: Number(rate.multi_stop_courier_share),
        multi_stop_app_share: Number(rate.multi_stop_app_share),
        surge_fee: Number(rate.surge_fee),
      };

      const { data: existing } = await supabase
        .from("shipping_rates")
        .select("id")
        .eq("district_name", rate.district_name)
        .maybeSingle();

      let error;
      if (existing) {
        const { error: updErr } = await supabase
          .from("shipping_rates")
          .update(dataToSave)
          .eq("id", existing.id);
        error = updErr;
      } else {
        const { error: insErr } = await supabase
          .from("shipping_rates")
          .insert([dataToSave]);
        error = insErr;
      }

      if (error) throw error;
      alert(`✅ Konfigurasi ${rate.district_name} berhasil disimpan!`);
      fetchLogisticsData();
    } catch (err: any) {
      alert("Gagal menyimpan: " + err.message);
    } finally {
      setSaving(null);
    }
  };

  const calculateSimulation = () => {
    if (!selectedRate)
      return {
        total_ongkir: 0,
        app_profit: 0,
        courier_net: 0,
        buyer_pays: 0,
        merchant_receives: 0,
      };

    const r = selectedRate;
    const extraStops = simStops > 1 ? simStops - 1 : 0;

    // 1. Hitung Ongkir Dasar
    let distCost = 0;
    if (simDist <= r.base_distance_km) {
      distCost = Number(r.base_fare);
    } else {
      const extraKm = simDist - r.base_distance_km;
      distCost = Number(r.base_fare) + extraKm * Number(r.price_per_km);
    }

    // 2. Multi-Toko (Ambil dari State)
    const totalExtraFeeKurir = extraStops * Number(r.multi_stop_fee || 0);
    const totalExtraAppShare = extraStops * Number(r.multi_stop_app_share || 0);
    const surgeCost = simSurge ? Number(r.surge_fee || 0) : 0;

    const totalOngkirKeUser = distCost + totalExtraFeeKurir;

    // 3. Bagi Hasil
    const appCutFromBase = distCost * (Number(r.app_fee_percent) / 100);
    const courierNet = distCost - appCutFromBase + totalExtraFeeKurir;

    // Profit App = Potongan Ongkir + Layanan Dasar + Jatah App Extra + Surge
    const totalAppProfit =
      appCutFromBase +
      Number(r.buyer_service_fee) +
      totalExtraAppShare +
      surgeCost;

    return {
      total_ongkir: totalOngkirKeUser,
      courier_net: courierNet,
      app_profit: totalAppProfit,
      buyer_pays:
        totalOngkirKeUser +
        (Number(r.buyer_service_fee) + totalExtraAppShare + surgeCost) +
        100000,
    };
  };

  const sim = calculateSimulation();

  if (loading)
    return (
      <div className="flex justify-center py-40">
        <Loader2 className="animate-spin text-teal-500" size={48} />
      </div>
    );

  return (
    <div className="max-w-7xl mx-auto pb-20 px-4 text-left animate-in fade-in duration-500 font-black uppercase tracking-tighter">
      <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-black italic flex items-center gap-3">
            <Truck className="text-teal-500" size={32} /> Logistics Engine
          </h1>
          <p className="text-[10px] tracking-[0.2em] mt-2 text-slate-400">
            KONTROL TARIF & BAGI HASIL DINAMIS
          </p>
        </div>
        <button
          onClick={fetchLogisticsData}
          className="p-3 bg-white border border-slate-100 rounded-2xl shadow-sm hover:rotate-180 transition-all"
        >
          <RefreshCw size={20} className="text-slate-400" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-6">
          {rates.map((rate) => (
            <div
              key={rate.district_name}
              onClick={() => setSelectedRate(rate)}
              className={`p-6 rounded-[2.5rem] border transition-all cursor-pointer relative group ${
                selectedRate?.district_name === rate.district_name
                  ? "border-teal-500 bg-teal-50/50 shadow-2xl"
                  : "bg-white border-slate-100 shadow-sm"
              }`}
            >
              <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-slate-100 rounded-2xl text-slate-400">
                    <MapPin size={20} />
                  </div>
                  <h3 className="text-lg font-black">{rate.district_name}</h3>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    saveToDb(rate);
                  }}
                  className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl text-[10px] font-black hover:bg-teal-600 transition-all"
                >
                  {saving === rate.district_name ? (
                    <Loader2 className="animate-spin" size={14} />
                  ) : (
                    <Save size={14} />
                  )}
                  SIMPAN WILAYAH
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <InputGroup
                  label="Layanan Dasar"
                  value={rate.buyer_service_fee}
                  onChange={(v: any) =>
                    handleUpdate(rate.district_name, "buyer_service_fee", v)
                  }
                  icon="Rp"
                  isService
                />
                <InputGroup
                  label="Ongkir Dasar"
                  value={rate.base_fare}
                  onChange={(v: any) =>
                    handleUpdate(rate.district_name, "base_fare", v)
                  }
                  icon="Rp"
                />
                <InputGroup
                  label="Admin Toko %"
                  value={rate.seller_admin_fee_percent}
                  onChange={(v: any) =>
                    handleUpdate(
                      rate.district_name,
                      "seller_admin_fee_percent",
                      v,
                    )
                  }
                  unit="%"
                  isAdmin
                />

                <div className="col-span-2 md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-5 rounded-[2rem] border border-slate-100 mt-2">
                  <InputGroup
                    label="Extra Toko (Hak Kurir)"
                    value={rate.multi_stop_fee}
                    onChange={(v: any) =>
                      handleUpdate(rate.district_name, "multi_stop_fee", v)
                    }
                    icon="Rp"
                  />
                  <InputGroup
                    label="Extra Toko (Hak App)"
                    value={rate.multi_stop_app_share}
                    onChange={(v: any) =>
                      handleUpdate(
                        rate.district_name,
                        "multi_stop_app_share",
                        v,
                      )
                    }
                    icon="Rp"
                  />
                  <InputGroup
                    label="Surge Fee (Hak App)"
                    value={rate.surge_fee}
                    onChange={(v: any) =>
                      handleUpdate(rate.district_name, "surge_fee", v)
                    }
                    icon="Rp"
                    isSurge
                  />
                </div>

                <div className="col-span-2 md:col-span-3 grid grid-cols-2 md:grid-cols-3 gap-4 mt-2 opacity-60">
                  <InputGroup
                    label="Jarak Dasar"
                    value={rate.base_distance_km}
                    onChange={(v: any) =>
                      handleUpdate(rate.district_name, "base_distance_km", v)
                    }
                    unit="Km"
                  />
                  <InputGroup
                    label="Harga / Km"
                    value={rate.price_per_km}
                    onChange={(v: any) =>
                      handleUpdate(rate.district_name, "price_per_km", v)
                    }
                    icon="Rp"
                  />
                  <InputGroup
                    label="Potong Ongkir %"
                    value={rate.app_fee_percent}
                    onChange={(v: any) =>
                      handleUpdate(rate.district_name, "app_fee_percent", v)
                    }
                    unit="%"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* SIMULATOR */}
        <div className="lg:col-span-1">
          <div className="sticky top-10 p-8 rounded-[3rem] bg-slate-900 text-white shadow-2xl border-b-[12px] border-teal-500">
            <div className="flex items-center gap-3 mb-8 border-b border-white/10 pb-6">
              <Calculator className="text-teal-400" size={28} />
              <h3 className="text-lg font-black italic">BILLING SIMULATOR</h3>
            </div>

            {selectedRate ? (
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] text-teal-500 mb-3 block uppercase">
                    Jumlah Toko: {simStops}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={simStops}
                    onChange={(e) => setSimStops(Number(e.target.value))}
                    className="w-full accent-teal-500 h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <div className="space-y-3 pt-4 border-t border-white/10">
                  <div className="flex justify-between items-center bg-teal-500/10 p-4 rounded-2xl border border-teal-500/20">
                    <div>
                      <p className="text-[8px] text-teal-400 uppercase">
                        Bagian Kurir
                      </p>
                      <p className="text-lg font-black italic">
                        Rp {sim.courier_net.toLocaleString()}
                      </p>
                    </div>
                    <Truck className="text-teal-500 opacity-30" size={24} />
                  </div>

                  <div className="bg-white p-5 rounded-2xl mt-4 text-slate-900 shadow-xl">
                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">
                      Total Profit PasarQu
                    </p>
                    <h2 className="text-3xl font-black italic leading-none mt-1 tracking-tighter">
                      Rp {sim.app_profit.toLocaleString()}
                    </h2>
                    <div className="flex items-center gap-2 mt-2 text-[8px] text-teal-600 font-bold italic">
                      <CheckCircle2 size={10} /> Akumulasi Layanan + Toko
                      Tambahan
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-20 text-center text-white/20 text-[10px]">
                PILIH WILAYAH...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const InputGroup = ({
  label,
  value,
  onChange,
  icon,
  unit,
  isSurge,
  isService,
  isAdmin,
}: any) => (
  <div className="text-left">
    <label
      className={`text-[8px] font-black mb-1.5 block tracking-widest ${isSurge ? "text-red-500" : isService ? "text-teal-600" : isAdmin ? "text-orange-500" : "text-slate-400"}`}
    >
      {label}
    </label>
    <div className="relative group">
      {icon && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400">
          {icon}
        </span>
      )}
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full py-2.5 ${icon ? "pl-8" : "pl-3"} pr-8 rounded-xl border-2 outline-none font-black text-xs transition-all bg-slate-50 focus:bg-white border-slate-100 focus:border-teal-500`}
      />
      {unit && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400">
          {unit}
        </span>
      )}
    </div>
  </div>
);
