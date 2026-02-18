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

  const isDark = theme?.bg?.includes("#0b0f19");

  // 1. FETCH DATA (MARKETS + RATES)
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
              buyer_service_fee: 2000, // Default Baru
              seller_admin_fee_percent: 5, // Default Baru
              multi_stop_fee: 3000,
              surge_fee: 2000,
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

  // 2. SIMPAN KE DATABASE (UPSERT)
  const saveToDb = async (rate: any) => {
    setSaving(rate.district_name);
    try {
      const { id, is_new, ...payload } = rate;

      const { data: existing } = await supabase
        .from("shipping_rates")
        .select("id")
        .eq("district_name", rate.district_name)
        .maybeSingle();

      let error;
      const dataToSave = {
        district_name: rate.district_name,
        base_fare: Number(rate.base_fare),
        base_distance_km: Number(rate.base_distance_km),
        price_per_km: Number(rate.price_per_km),
        app_fee_percent: Number(rate.app_fee_percent),
        buyer_service_fee: Number(rate.buyer_service_fee), // ✅ SAVE KOLOM BARU
        seller_admin_fee_percent: Number(rate.seller_admin_fee_percent), // ✅ SAVE KOLOM BARU
        multi_stop_fee: Number(rate.multi_stop_fee),
        surge_fee: Number(rate.surge_fee),
      };

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
      alert(
        `✅ Tarif & Biaya Wilayah ${rate.district_name} berhasil disimpan!`,
      );
      fetchLogisticsData();
    } catch (err: any) {
      alert("Gagal menyimpan: " + err.message);
    } finally {
      setSaving(null);
    }
  };

  // 3. KALKULATOR SIMULASI (UPDATED)
  const calculateSimulation = () => {
    if (!selectedRate)
      return { total_ongkir: 0, app_profit: 0, courier_net: 0, buyer_pays: 0 };
    const r = selectedRate;

    let distCost = 0;
    if (simDist <= r.base_distance_km) {
      distCost = Number(r.base_fare);
    } else {
      const extraKm = simDist - r.base_distance_km;
      distCost = Number(r.base_fare) + extraKm * Number(r.price_per_km);
    }

    const stopCost =
      simStops > 1 ? Number(r.multi_stop_fee) * (simStops - 1) : 0;
    const surgeCost = simSurge ? Number(r.surge_fee) : 0;

    const totalOngkir = distCost + stopCost + surgeCost;
    const appCutFromOngkir = totalOngkir * (Number(r.app_fee_percent) / 100);
    const courierNet = totalOngkir - appCutFromOngkir;

    // Total Akhir yang dibayar User (Ongkir + Service Fee)
    const buyerPays = totalOngkir + Number(r.buyer_service_fee);
    // Total Keuntungan Aplikasi (Potongan Ongkir + Service Fee)
    const totalAppProfit = appCutFromOngkir + Number(r.buyer_service_fee);

    return {
      total_ongkir: totalOngkir,
      courier_net: courierNet,
      app_profit: totalAppProfit,
      buyer_pays: buyerPays,
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
    <div className="max-w-7xl mx-auto pb-20 px-4 text-left animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-4">
        <div>
          <h1
            className={`text-3xl font-black uppercase italic tracking-tighter flex items-center gap-3 ${theme?.text}`}
          >
            <Truck className="text-teal-500" size={32} /> Logistics{" "}
            <span className="text-teal-500">Engine</span>
          </h1>
          <p
            className={`text-[10px] font-black uppercase tracking-[0.2em] mt-2 ${theme?.subText}`}
          >
            Otoritas Biaya Layanan & Manajemen Tarif Platform
          </p>
        </div>
        <button
          onClick={fetchLogisticsData}
          className="p-3 bg-white border border-slate-100 rounded-2xl shadow-sm hover:rotate-180 transition-all duration-500"
        >
          <RefreshCw size={20} className="text-slate-400" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* KOLOM KIRI: DAFTAR KECAMATAN */}
        <div className="lg:col-span-2 space-y-8">
          {rates.map((rate) => (
            <div
              key={rate.district_name}
              onClick={() => setSelectedRate(rate)}
              className={`p-8 rounded-[3rem] border transition-all cursor-pointer relative group ${
                selectedRate?.district_name === rate.district_name
                  ? "border-teal-500 bg-teal-500/5 shadow-2xl ring-1 ring-teal-500/20"
                  : `${theme?.border} ${theme?.card} hover:border-slate-300`
              }`}
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div className="flex items-center gap-4">
                  <div
                    className={`p-4 rounded-2xl ${selectedRate?.district_name === rate.district_name ? "bg-teal-500 text-white shadow-lg shadow-teal-500/40" : "bg-slate-100 text-slate-500"}`}
                  >
                    <MapPin size={24} />
                  </div>
                  <div>
                    <h3
                      className={`text-xl font-black uppercase ${theme?.text}`}
                    >
                      {rate.district_name}
                    </h3>
                    {rate.is_new ? (
                      <span className="text-[9px] font-black bg-red-500 text-white px-3 py-1 rounded-full flex items-center gap-1 mt-2 animate-pulse w-fit uppercase">
                        <AlertTriangle size={10} /> Belum Diatur
                      </span>
                    ) : (
                      <span className="text-[9px] font-black text-teal-500 bg-teal-500/10 px-3 py-1 rounded-full flex items-center gap-1 mt-2 w-fit uppercase border border-teal-500/20">
                        <CheckCircle2 size={10} /> Konfigurasi Aktif
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    saveToDb(rate);
                  }}
                  disabled={saving === rate.district_name}
                  className={`flex items-center gap-3 px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-xl active:scale-95 ${
                    saving === rate.district_name
                      ? "bg-slate-500"
                      : "bg-slate-900 text-white hover:bg-teal-600"
                  }`}
                >
                  {saving === rate.district_name ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <Save size={16} />
                  )}
                  Simpan Wilayah
                </button>
              </div>

              {/* GRID PENGATURAN */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <InputGroup
                  label="Tarif Dasar"
                  value={rate.base_fare}
                  onChange={(v: any) =>
                    handleUpdate(rate.district_name, "base_fare", v)
                  }
                  theme={theme}
                  icon="Rp"
                />
                <InputGroup
                  label="Jarak Dasar"
                  value={rate.base_distance_km}
                  onChange={(v: any) =>
                    handleUpdate(rate.district_name, "base_distance_km", v)
                  }
                  theme={theme}
                  unit="Km"
                />
                <InputGroup
                  label="Harga / Km"
                  value={rate.price_per_km}
                  onChange={(v: any) =>
                    handleUpdate(rate.district_name, "price_per_km", v)
                  }
                  theme={theme}
                  icon="Rp"
                />
                <InputGroup
                  label="App Fee Ongkir"
                  value={rate.app_fee_percent}
                  onChange={(v: any) =>
                    handleUpdate(rate.district_name, "app_fee_percent", v)
                  }
                  theme={theme}
                  unit="%"
                />

                {/* KOLOM BARU YANG DIMINTA JURAGAN */}
                <InputGroup
                  label="Layanan Pembeli"
                  value={rate.buyer_service_fee}
                  onChange={(v: any) =>
                    handleUpdate(rate.district_name, "buyer_service_fee", v)
                  }
                  theme={theme}
                  icon="Rp"
                  isService
                />
                <InputGroup
                  label="Admin Penjual"
                  value={rate.seller_admin_fee_percent}
                  onChange={(v: any) =>
                    handleUpdate(
                      rate.district_name,
                      "seller_admin_fee_percent",
                      v,
                    )
                  }
                  theme={theme}
                  unit="%"
                  isAdmin
                />

                <InputGroup
                  label="Extra Toko"
                  value={rate.multi_stop_fee}
                  onChange={(v: any) =>
                    handleUpdate(rate.district_name, "multi_stop_fee", v)
                  }
                  theme={theme}
                  icon="Rp"
                />
                <InputGroup
                  label="Surge Fee"
                  value={rate.surge_fee}
                  onChange={(v: any) =>
                    handleUpdate(rate.district_name, "surge_fee", v)
                  }
                  theme={theme}
                  icon="Rp"
                  isSurge
                />
              </div>
            </div>
          ))}
        </div>

        {/* KOLOM KANAN: SIMULATOR */}
        <div className="lg:col-span-1">
          <div className="sticky top-10 p-10 rounded-[3rem] bg-slate-900 text-white shadow-2xl border-b-[12px] border-teal-500">
            <div className="flex items-center gap-3 mb-10 border-b border-white/10 pb-6">
              <Calculator className="text-teal-400" size={32} />
              <div>
                <h3 className="text-xl font-black uppercase italic italic">
                  Billing Sim
                </h3>
                <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">
                  Real-time Cost Analysis
                </p>
              </div>
            </div>

            {selectedRate ? (
              <div className="space-y-8">
                <div className="text-[10px] font-black text-center bg-teal-500/10 text-teal-400 py-3 rounded-xl border border-teal-500/20 uppercase tracking-widest">
                  Target: {selectedRate.district_name}
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-teal-500 mb-4 block">
                    Jarak Tempuh:{" "}
                    <span className="text-white text-lg ml-2">
                      {simDist} Km
                    </span>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="25"
                    value={simDist}
                    onChange={(e) => setSimDist(Number(e.target.value))}
                    className="w-full accent-teal-500 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setSimStops(simStops === 1 ? 2 : 1)}
                    className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${simStops > 1 ? "border-teal-500 bg-teal-500/10 text-white" : "border-white/5 text-white/30"}`}
                  >
                    <BadgePercent size={20} />
                    <span className="text-[8px] font-black uppercase">
                      Multi Toko
                    </span>
                  </button>
                  <button
                    onClick={() => setSimSurge(!simSurge)}
                    className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${simSurge ? "border-red-500 bg-red-500/10 text-white" : "border-white/5 text-white/30"}`}
                  >
                    <Umbrella size={20} />
                    <span className="text-[8px] font-black uppercase">
                      Cuaca Buruk
                    </span>
                  </button>
                </div>

                <div className="space-y-4 pt-6 border-t border-white/10">
                  <div className="flex justify-between items-center opacity-60">
                    <span className="text-[10px] uppercase font-black">
                      Ongkos Kirim
                    </span>
                    <span className="text-sm font-bold">
                      Rp {sim.total_ongkir.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-teal-400">
                    <span className="text-[10px] uppercase font-black flex items-center gap-2">
                      <Coins size={12} /> Biaya Layanan
                    </span>
                    <span className="text-sm font-black">
                      + Rp{" "}
                      {Number(selectedRate.buyer_service_fee).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-red-400 border-b border-white/5 pb-4">
                    <span className="text-[10px] uppercase font-black flex items-center gap-2">
                      <Zap size={12} /> Jatah Platform
                    </span>
                    <span className="text-sm font-black">
                      - Rp {sim.app_profit.toLocaleString()}
                    </span>
                  </div>

                  <div className="pt-4 flex flex-col gap-2">
                    <div className="flex justify-between items-end">
                      <span className="text-[9px] font-black uppercase text-white/30">
                        Total Bayar User
                      </span>
                      <span className="text-2xl font-black text-white italic">
                        Rp {sim.buyer_pays.toLocaleString()}
                      </span>
                    </div>
                    <div className="bg-teal-500 p-4 rounded-2xl mt-2 shadow-lg shadow-teal-500/20">
                      <p className="text-[9px] font-black uppercase text-teal-900 mb-1">
                        Gaji Bersih Kurir
                      </p>
                      <h2 className="text-3xl font-black text-teal-950 tracking-tighter leading-none italic">
                        Rp {sim.courier_net.toLocaleString()}
                      </h2>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-20 text-center text-white/20 font-black uppercase text-xs">
                Pilih wilayah untuk mulai simulasi
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
  theme,
  icon,
  unit,
  isSurge,
  isService,
  isAdmin,
}: any) => {
  const isDark = theme?.bg?.includes("#0b0f19");
  return (
    <div className="text-left">
      <label
        className={`text-[8px] font-black uppercase mb-2 block tracking-widest ${isSurge ? "text-red-500" : isService ? "text-teal-500" : isAdmin ? "text-orange-500" : theme?.subText || "text-slate-400"}`}
      >
        {label}
      </label>
      <div className="relative group">
        {icon && (
          <span
            className={`absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black ${isService ? "text-teal-400" : "text-slate-400"}`}
          >
            {icon}
          </span>
        )}
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full py-3 ${icon ? "pl-8" : "pl-4"} pr-8 rounded-xl border-2 outline-none font-bold text-sm transition-all ${
            isDark
              ? "bg-white/5 focus:bg-white/10"
              : "bg-slate-50 focus:bg-white"
          } ${isSurge ? "border-red-500/20 focus:border-red-500" : isService ? "border-teal-500/20 focus:border-teal-500" : isAdmin ? "border-orange-500/20 focus:border-orange-500" : "border-slate-100 focus:border-slate-400"}`}
        />
        {unit && (
          <span
            className={`absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black ${isAdmin ? "text-orange-400" : "text-slate-400"}`}
          >
            {unit}
          </span>
        )}
      </div>
    </div>
  );
};
