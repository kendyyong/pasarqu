import React, { useState, useEffect } from "react";
import { supabase } from "../../../../lib/supabaseClient";
import {
  MapPin,
  Truck,
  Zap,
  Save,
  Calculator,
  Loader2,
  CheckCircle2,
  RefreshCw,
  ShoppingBag,
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
  const [simBelanja, setSimBelanja] = useState(600000);

  // 🚀 BARU: State untuk memilih Tipe Toko di Simulator (Reguler / Sembako)
  const [simTipeToko, setSimTipeToko] = useState<"REGULER" | "SEMBAKO">(
    "REGULER",
  );

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
              sembako_admin_fee_percent: 2,
              qris_threshold: 500000,
              qris_fee_percent: 0.7,
              multi_stop_fee: 2000,
              multi_stop_app_share: 1000,
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
        sembako_admin_fee_percent: Number(rate.sembako_admin_fee_percent || 0),
        qris_threshold: Number(rate.qris_threshold || 500000),
        qris_fee_percent: Number(rate.qris_fee_percent || 0.7),
        multi_stop_fee: Number(rate.multi_stop_fee),
        multi_stop_courier_share: Number(rate.multi_stop_courier_share || 0),
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
      alert(
        `✅ KONFIGURASI ${rate.district_name.toUpperCase()} BERHASIL DISIMPAN!`,
      );
      fetchLogisticsData();
    } catch (err: any) {
      alert("GAGAL MENYIMPAN: " + err.message);
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
        qris_fee: 0,
        admin_toko_net: 0,
        total_potongan_toko: 0,
        persen_toko_aktif: 0,
      };

    const r = selectedRate;
    const extraStops = simStops > 1 ? simStops - 1 : 0;

    // --- 1. ONGKIR & KURIR (SAMA SEKALI TIDAK TERPENGARUH QRIS) ---
    let distCost = 0;
    if (simDist <= r.base_distance_km) {
      distCost = Number(r.base_fare);
    } else {
      const extraKm = simDist - r.base_distance_km;
      distCost = Number(r.base_fare) + extraKm * Number(r.price_per_km);
    }

    const totalExtraFeeKurir = extraStops * Number(r.multi_stop_fee || 0);
    const totalExtraAppShare = extraStops * Number(r.multi_stop_app_share || 0);
    const surgeCost = simSurge ? Number(r.surge_fee || 0) : 0;

    const totalOngkirKeUser = distCost + totalExtraFeeKurir;
    const appCutFromBase = distCost * (Number(r.app_fee_percent) / 100);

    // Kurir tetap dapat full haknya, tidak ada sangkut paut dengan QRIS
    const courierNet = distCost - appCutFromBase + totalExtraFeeKurir;

    // --- 2. LOGIKA ADMIN TOKO VS QRIS ---
    const belanja = Number(simBelanja);
    const qrisThreshold = Number(r.qris_threshold || 500000);
    const qrisPercent = Number(r.qris_fee_percent || 0.7);

    // Ambil persen admin berdasarkan Tipe Toko yang dipilih di Simulator
    const adminPercent =
      simTipeToko === "REGULER"
        ? Number(r.seller_admin_fee_percent || 5)
        : Number(r.sembako_admin_fee_percent || 2);

    // Hitung total potongan toko normal
    const totalPotonganToko = belanja * (adminPercent / 100);

    let qrisFee = 0;
    let pasarquAdminTokoNet = totalPotonganToko;

    // Jika melewati batas belanja, QRIS "memakan" sedikit margin PasarQu dari potongan toko
    if (belanja >= qrisThreshold) {
      qrisFee = belanja * (qrisPercent / 100);
      pasarquAdminTokoNet = totalPotonganToko - qrisFee;
    }

    // --- TOTAL PROFIT APP KESELURUHAN ---
    const totalAppProfit =
      appCutFromBase + // Dari potongan ongkir
      Number(r.buyer_service_fee) + // Dari biaya layanan user
      totalExtraAppShare + // Dari ekstra titik (hak app)
      surgeCost + // Dari surge fee
      pasarquAdminTokoNet; // Dari potongan toko (SETELAH dikurangi QRIS)

    return {
      total_ongkir: totalOngkirKeUser,
      courier_net: courierNet,
      app_profit: totalAppProfit,
      total_potongan_toko: totalPotonganToko,
      qris_fee: qrisFee,
      admin_toko_net: pasarquAdminTokoNet,
      persen_toko_aktif: adminPercent,
    };
  };

  const sim = calculateSimulation();

  if (loading)
    return (
      <div className="flex justify-center py-40">
        <Loader2 className="animate-spin text-[#008080]" size={48} />
      </div>
    );

  return (
    <div className="max-w-7xl mx-auto pb-20 px-4 text-left animate-in fade-in duration-500 font-black uppercase tracking-tighter not-italic text-[12px]">
      {/* HEADER SUPER ADMIN */}
      <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-4 border-b-4 border-slate-200 pb-6">
        <div>
          <h1 className="text-[28px] font-[1000] flex items-center gap-3 text-slate-800 tracking-wider">
            <Truck className="text-[#008080]" size={36} /> LOGISTICS ENGINE
          </h1>
          <p className="text-[12px] tracking-[0.2em] mt-2 text-slate-500">
            KONTROL TARIF DISTRIK & BAGI HASIL APLIKASI
          </p>
        </div>
        <button
          onClick={fetchLogisticsData}
          className="p-3 bg-white border border-slate-200 rounded-md shadow-sm hover:bg-slate-50 active:scale-95 transition-all"
        >
          <RefreshCw size={24} className="text-[#008080]" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LIST DISTRIK & PENGATURAN */}
        <div className="lg:col-span-2 space-y-6">
          {rates.map((rate) => (
            <div
              key={rate.district_name}
              onClick={() => setSelectedRate(rate)}
              className={`p-6 rounded-md border-2 transition-all cursor-pointer relative group ${
                selectedRate?.district_name === rate.district_name
                  ? "border-[#008080] bg-teal-50 shadow-md"
                  : "bg-white border-slate-200 hover:border-[#008080] shadow-sm"
              }`}
            >
              <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 border-b border-slate-200 pb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-3 rounded-md ${selectedRate?.district_name === rate.district_name ? "bg-[#008080] text-white" : "bg-slate-100 text-slate-500"}`}
                  >
                    <MapPin size={24} />
                  </div>
                  <h3 className="text-[16px] font-[1000] tracking-widest">
                    {rate.district_name}
                  </h3>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    saveToDb(rate);
                  }}
                  className="flex items-center gap-2 bg-slate-900 text-white px-6 py-4 rounded-md text-[12px] font-black active:scale-95 transition-all shadow-md hover:bg-[#008080]"
                >
                  {saving === rate.district_name ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <Save size={16} />
                  )}
                  SIMPAN ATURAN
                </button>
              </div>

              {/* INPUT PENGATURAN UMUM */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <InputGroup
                  label="LAYANAN PEMBELI"
                  value={rate.buyer_service_fee}
                  onChange={(v: any) =>
                    handleUpdate(rate.district_name, "buyer_service_fee", v)
                  }
                  icon="RP"
                  isService
                />
                <InputGroup
                  label="ONGKIR DASAR"
                  value={rate.base_fare}
                  onChange={(v: any) =>
                    handleUpdate(rate.district_name, "base_fare", v)
                  }
                  icon="RP"
                />
                <InputGroup
                  label="ADMIN TOKO (%)"
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
                <InputGroup
                  label="ADMIN SEMBAKO (%)"
                  value={rate.sembako_admin_fee_percent}
                  onChange={(v: any) =>
                    handleUpdate(
                      rate.district_name,
                      "sembako_admin_fee_percent",
                      v,
                    )
                  }
                  unit="%"
                  isSurge
                />

                {/* 🚀 INPUT PENGATURAN QRIS */}
                <div className="col-span-2 md:col-span-4 grid grid-cols-1 md:grid-cols-2 gap-5 bg-orange-50 p-5 rounded-md border border-orange-200 mt-2 shadow-inner">
                  <InputGroup
                    label="BATAS TRANSAKSI QRIS"
                    value={rate.qris_threshold}
                    onChange={(v: any) =>
                      handleUpdate(rate.district_name, "qris_threshold", v)
                    }
                    icon="RP"
                    isAdmin
                  />
                  <InputGroup
                    label="BIAYA QRIS DITANGGUNG APP (%)"
                    value={rate.qris_fee_percent}
                    onChange={(v: any) =>
                      handleUpdate(rate.district_name, "qris_fee_percent", v)
                    }
                    unit="%"
                    isAdmin
                  />
                </div>

                <div className="col-span-2 md:col-span-4 grid grid-cols-1 md:grid-cols-3 gap-5 bg-white p-5 rounded-md border border-slate-200 mt-2 shadow-inner">
                  <InputGroup
                    label="EXTRA TOKO (HAK KURIR)"
                    value={rate.multi_stop_fee}
                    onChange={(v: any) =>
                      handleUpdate(rate.district_name, "multi_stop_fee", v)
                    }
                    icon="RP"
                  />
                  <InputGroup
                    label="EXTRA TOKO (HAK APP)"
                    value={rate.multi_stop_app_share}
                    onChange={(v: any) =>
                      handleUpdate(
                        rate.district_name,
                        "multi_stop_app_share",
                        v,
                      )
                    }
                    icon="RP"
                  />
                  <InputGroup
                    label="SURGE FEE (HAK APP)"
                    value={rate.surge_fee}
                    onChange={(v: any) =>
                      handleUpdate(rate.district_name, "surge_fee", v)
                    }
                    icon="RP"
                    isSurge
                  />
                </div>

                <div className="col-span-2 md:col-span-4 grid grid-cols-2 md:grid-cols-3 gap-5 mt-2 bg-slate-100 p-5 rounded-md border border-slate-200">
                  <InputGroup
                    label="JARAK DASAR"
                    value={rate.base_distance_km}
                    onChange={(v: any) =>
                      handleUpdate(rate.district_name, "base_distance_km", v)
                    }
                    unit="KM"
                  />
                  <InputGroup
                    label="HARGA / KM"
                    value={rate.price_per_km}
                    onChange={(v: any) =>
                      handleUpdate(rate.district_name, "price_per_km", v)
                    }
                    icon="RP"
                  />
                  <InputGroup
                    label="POTONG ONGKIR (%)"
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
          <div className="sticky top-10 p-6 rounded-md bg-slate-900 text-white shadow-2xl border-t-[12px] border-[#008080]">
            <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
              <Calculator className="text-teal-400" size={24} />
              <h3 className="text-[14px] font-[1000] tracking-widest">
                BILLING SIMULATOR
              </h3>
            </div>

            {selectedRate ? (
              <div className="space-y-6">
                {/* 🚀 SIMULATOR TOTAL BELANJA & TIPE TOKO */}
                <div className="bg-white/5 p-4 rounded-md border border-white/10">
                  <div className="flex justify-between items-center mb-4">
                    <label className="text-[11px] text-orange-400 tracking-widest flex items-center gap-2">
                      <ShoppingBag size={14} /> BELANJA: RP{" "}
                      {simBelanja.toLocaleString()}
                    </label>
                  </div>
                  <input
                    type="range"
                    min="10000"
                    max="1000000"
                    step="10000"
                    value={simBelanja}
                    onChange={(e) => setSimBelanja(Number(e.target.value))}
                    className="w-full accent-[#FF6600] h-2 bg-slate-700 rounded-md appearance-none cursor-pointer mb-5"
                  />

                  {/* TOGGLE TIPE TOKO */}
                  <div className="flex bg-slate-800 p-1 rounded-md mb-4 border border-slate-700">
                    <button
                      onClick={() => setSimTipeToko("REGULER")}
                      className={`flex-1 py-1.5 text-[9px] font-black tracking-widest rounded transition-all ${simTipeToko === "REGULER" ? "bg-[#008080] text-white shadow" : "text-slate-400 hover:text-white"}`}
                    >
                      REGULER ({selectedRate.seller_admin_fee_percent}%)
                    </button>
                    <button
                      onClick={() => setSimTipeToko("SEMBAKO")}
                      className={`flex-1 py-1.5 text-[9px] font-black tracking-widest rounded transition-all ${simTipeToko === "SEMBAKO" ? "bg-[#FF6600] text-white shadow" : "text-slate-400 hover:text-white"}`}
                    >
                      SEMBAKO ({selectedRate.sembako_admin_fee_percent}%)
                    </button>
                  </div>

                  {/* DETAIL SPLIT QRIS */}
                  <div className="mt-4 text-[10px] space-y-2 font-bold tracking-widest">
                    <div className="flex justify-between text-slate-400">
                      <span>
                        POTONGAN {simTipeToko} ({sim.persen_toko_aktif}%)
                      </span>
                      <span className="text-white">
                        RP {sim.total_potongan_toko.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-red-400">
                      <span>
                        BIAYA QRIS{" "}
                        {simBelanja >= selectedRate.qris_threshold
                          ? `(${selectedRate.qris_fee_percent}%)`
                          : "(0%)"}
                      </span>
                      <span>- RP {sim.qris_fee.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-teal-400 border-t border-white/10 pt-2">
                      <span>NET PASARQU (DARI TOKO)</span>
                      <span>RP {sim.admin_toko_net.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-teal-400 mb-3 block tracking-widest flex items-center gap-2">
                    <MapPin size={14} /> JUMLAH TITIK TOKO: {simStops}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={simStops}
                    onChange={(e) => setSimStops(Number(e.target.value))}
                    className="w-full accent-[#008080] h-2 bg-slate-700 rounded-md appearance-none cursor-pointer"
                  />
                </div>

                <div className="space-y-4 pt-4 border-t border-white/10">
                  {/* PENDAPATAN KURIR */}
                  <div className="flex justify-between items-center bg-[#008080]/20 p-4 rounded-md border border-[#008080]/50">
                    <div>
                      <p className="text-[10px] text-teal-200 tracking-widest mb-1">
                        PENDAPATAN KURIR{" "}
                        <span className="text-white/40 text-[8px]">
                          (TDK DIPOTONG)
                        </span>
                      </p>
                      <p className="text-[18px] font-[1000] font-sans">
                        RP {sim.courier_net.toLocaleString()}
                      </p>
                    </div>
                    <Truck className="text-[#008080]" size={32} />
                  </div>

                  <div className="bg-white p-5 rounded-md mt-4 text-slate-900 shadow-xl border-b-4 border-[#FF6600]">
                    <p className="text-[10px] text-slate-500 font-black tracking-widest mb-1">
                      TOTAL PENDAPATAN PASARQU
                    </p>
                    <h2 className="text-[32px] font-[1000] text-[#FF6600] leading-none font-sans tracking-tighter">
                      RP {sim.app_profit.toLocaleString()}
                    </h2>
                    <div className="flex items-center gap-2 mt-3 text-[9px] text-slate-400 font-bold bg-slate-50 p-2 rounded-md border border-slate-100">
                      <CheckCircle2 size={12} className="text-[#008080]" />{" "}
                      AKUMULASI LAYANAN + POTONGAN + EXTRA
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-20 text-center text-slate-500 text-[10px] tracking-widest">
                PILIH DISTRIK PASAR DI SAMPING...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- KOMPONEN INPUT KECIL ---
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
      className={`text-[10px] font-black mb-2 block tracking-widest ${isSurge ? "text-red-500" : isService ? "text-[#008080]" : isAdmin ? "text-[#FF6600]" : "text-slate-500"}`}
    >
      {label}
    </label>
    <div className="relative group">
      {icon && (
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[12px] font-black text-slate-400">
          {icon}
        </span>
      )}
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full py-4 ${icon ? "pl-10" : "pl-4"} pr-10 rounded-md border-2 outline-none font-[1000] text-[14px] font-sans transition-all bg-white focus:border-[#008080] border-slate-200 shadow-sm`}
      />
      {unit && (
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[12px] font-black text-slate-400">
          {unit}
        </span>
      )}
    </div>
  </div>
);
