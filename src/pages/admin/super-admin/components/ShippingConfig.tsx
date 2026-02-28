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
  AlertTriangle,
  ShieldAlert,
  Landmark,
  TicketPercent,
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
              handling_fee: 1000,
              seller_admin_fee_percent: 5,
              sembako_admin_fee_percent: 2,
              qris_threshold: 500000,
              qris_fee_percent: 0.7,
              multi_stop_fee: 2000,
              multi_stop_app_share: 1000,
              surge_fee: 0,
              free_shipping_min_order: 150000,
              max_free_shipping_subsidy: 10000, // Default Baru
              tax_percent: 0,
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
        handling_fee: Number(rate.handling_fee || 0),
        seller_admin_fee_percent: Number(rate.seller_admin_fee_percent),
        sembako_admin_fee_percent: Number(rate.sembako_admin_fee_percent || 0),
        qris_threshold: Number(rate.qris_threshold || 500000),
        qris_fee_percent: Number(rate.qris_fee_percent || 0.7),
        multi_stop_fee: Number(rate.multi_stop_fee),
        multi_stop_app_share: Number(rate.multi_stop_app_share),
        surge_fee: Number(rate.surge_fee),
        free_shipping_min_order: Number(rate.free_shipping_min_order || 0),
        max_free_shipping_subsidy: Number(rate.max_free_shipping_subsidy || 0), // Simpan kolom baru
        tax_percent: Number(rate.tax_percent || 0),
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
        user_pay_shipping: 0,
        app_subsidy: 0,
        tax_amount: 0,
      };

    const r = selectedRate;
    const extraStops = simStops > 1 ? simStops - 1 : 0;
    const belanja = Number(simBelanja);

    // --- 1. ONGKIR ASLI & KURIR ---
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

    const realShippingCost = distCost + totalExtraFeeKurir + surgeCost;
    const appCutFromBase = distCost * (Number(r.app_fee_percent) / 100);

    const courierNet = distCost - appCutFromBase + totalExtraFeeKurir;

    // --- 2. LOGIKA SUBSIDI GRATIS ONGKIR (DENGAN CAPPING) ---
    let userPayShipping = realShippingCost;
    let appSubsidy = 0;
    const maxSubsidyFromDb = Number(r.max_free_shipping_subsidy || 0);

    if (
      Number(r.free_shipping_min_order) > 0 &&
      belanja >= Number(r.free_shipping_min_order)
    ) {
      // Jika subsidi diset (lebih dari 0), gunakan capping
      if (maxSubsidyFromDb > 0) {
        if (realShippingCost <= maxSubsidyFromDb) {
          userPayShipping = 0;
          appSubsidy = realShippingCost;
        } else {
          userPayShipping = realShippingCost - maxSubsidyFromDb;
          appSubsidy = maxSubsidyFromDb;
        }
      } else {
        // Jika max_subsidy adalah 0, anggap gratis total (logika lama)
        userPayShipping = 0;
        appSubsidy = realShippingCost;
      }
    }

    // --- 3. LOGIKA ADMIN TOKO VS QRIS ---
    const qrisThreshold = Number(r.qris_threshold || 500000);
    const qrisPercent = Number(r.qris_fee_percent || 0.7);

    const adminPercent =
      simTipeToko === "REGULER"
        ? Number(r.seller_admin_fee_percent || 5)
        : Number(r.sembako_admin_fee_percent || 2);

    const totalPotonganToko = belanja * (adminPercent / 100);

    let qrisFee = 0;
    let pasarquAdminTokoNet = totalPotonganToko;

    if (belanja >= qrisThreshold) {
      qrisFee = belanja * (qrisPercent / 100);
      pasarquAdminTokoNet = totalPotonganToko - qrisFee;
    }

    // --- 4. REVENUE & PAJAK ENGINE ---
    const handlingFee = Number(r.handling_fee || 0);
    const serviceFee = Number(r.buyer_service_fee || 0);

    const grossAppRevenue =
      appCutFromBase +
      serviceFee +
      handlingFee +
      totalExtraAppShare +
      surgeCost +
      pasarquAdminTokoNet;

    const taxAmount = grossAppRevenue * (Number(r.tax_percent || 0) / 100);

    const totalAppProfit = grossAppRevenue - taxAmount - appSubsidy;

    return {
      total_ongkir: realShippingCost,
      user_pay_shipping: userPayShipping,
      app_subsidy: appSubsidy,
      courier_net: courierNet,
      app_profit: totalAppProfit,
      total_potongan_toko: totalPotonganToko,
      qris_fee: qrisFee,
      admin_toko_net: pasarquAdminTokoNet,
      persen_toko_aktif: adminPercent,
      tax_amount: taxAmount,
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
            <Truck className="text-[#008080]" size={36} /> LOGISTICS ENGINE PRO
          </h1>
          <p className="text-[12px] tracking-[0.2em] mt-2 text-slate-500">
            KONTROL TARIF, SUBSIDI ONGKIR, & PAJAK PPN
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

              {/* FORM PENGATURAN UMUM */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* 🚀 LAYER 1: PENDAPATAN DARI PEMBELI */}
                <div className="col-span-2 md:col-span-4 bg-teal-50 p-4 rounded-md border border-teal-200 grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    label="HANDLING FEE (BIAYA PENANGANAN)"
                    value={rate.handling_fee}
                    onChange={(v: any) =>
                      handleUpdate(rate.district_name, "handling_fee", v)
                    }
                    icon="RP"
                    isService
                  />
                </div>

                {/* LAYER 2: ONGKIR */}
                <InputGroup
                  label="ONGKIR DASAR"
                  value={rate.base_fare}
                  onChange={(v: any) =>
                    handleUpdate(rate.district_name, "base_fare", v)
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

                {/* 🚀 LAYER 3: ADMIN TOKO DENGAN WARNING */}
                <div className="col-span-2 md:col-span-4 bg-orange-50 p-4 rounded-md border border-orange-200 grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  <InputGroup
                    label="ADMIN TOKO REGULER (%)"
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
                    warningCondition={rate.seller_admin_fee_percent > 10}
                    warningText="Persentase tinggi! Seller berpotensi komplain."
                  />
                  <InputGroup
                    label="ADMIN TOKO SEMBAKO (%)"
                    value={rate.sembako_admin_fee_percent}
                    onChange={(v: any) =>
                      handleUpdate(
                        rate.district_name,
                        "sembako_admin_fee_percent",
                        v,
                      )
                    }
                    unit="%"
                    isAdmin
                  />
                </div>

                {/* 🚀 LAYER 4: PAJAK DAN GRATIS ONGKIR */}
                <div className="col-span-2 md:col-span-4 bg-slate-900 p-4 rounded-md border border-slate-700 grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                  <div className="bg-slate-800 p-3 rounded-md">
                    <InputGroup
                      label="MIN. BELANJA GRATIS ONGKIR"
                      value={rate.free_shipping_min_order}
                      onChange={(v: any) =>
                        handleUpdate(
                          rate.district_name,
                          "free_shipping_min_order",
                          v,
                        )
                      }
                      icon="RP"
                      theme="dark"
                    />
                    <p className="text-[9px] text-teal-400 mt-2 tracking-widest">
                      <TicketPercent size={10} className="inline mr-1" /> Isi 0
                      untuk mematikan fitur.
                    </p>
                  </div>

                  {/* INPUT BARU: MAX SUBSIDY */}
                  <div className="bg-slate-800 p-3 rounded-md">
                    <InputGroup
                      label="MAKSIMAL SUBSIDI (CAPPING)"
                      value={rate.max_free_shipping_subsidy}
                      onChange={(v: any) =>
                        handleUpdate(
                          rate.district_name,
                          "max_free_shipping_subsidy",
                          v,
                        )
                      }
                      icon="RP"
                      theme="dark"
                    />
                    <p className="text-[9px] text-orange-400 mt-2 tracking-widest">
                      <Zap size={10} className="inline mr-1" /> Batas subsidi
                      per transaksi.
                    </p>
                  </div>

                  <div className="bg-slate-800 p-3 rounded-md">
                    <InputGroup
                      label="PAJAK PPN JASA APP (%)"
                      value={rate.tax_percent}
                      onChange={(v: any) =>
                        handleUpdate(rate.district_name, "tax_percent", v)
                      }
                      unit="%"
                      theme="dark"
                      warningCondition={rate.tax_percent > 12}
                      warningText="Melebihi aturan PPN Nasional!"
                    />
                    <p className="text-[9px] text-red-400 mt-2 tracking-widest">
                      <Landmark size={10} className="inline mr-1" /> Isi 11%
                      jika omset gede.
                    </p>
                  </div>
                </div>

                {/* INPUT PENGATURAN QRIS */}
                <div className="col-span-2 md:col-span-4 grid grid-cols-1 md:grid-cols-2 gap-5 bg-slate-100 p-5 rounded-md border border-slate-200 mt-2">
                  <InputGroup
                    label="BATAS TRANSAKSI QRIS"
                    value={rate.qris_threshold}
                    onChange={(v: any) =>
                      handleUpdate(rate.district_name, "qris_threshold", v)
                    }
                    icon="RP"
                  />
                  <InputGroup
                    label="BIAYA QRIS DITANGGUNG APP (%)"
                    value={rate.qris_fee_percent}
                    onChange={(v: any) =>
                      handleUpdate(rate.district_name, "qris_fee_percent", v)
                    }
                    unit="%"
                  />
                </div>

                {/* EXTRA & SURGE FEE */}
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
                    label="SURGE FEE / LONJAKAN"
                    value={rate.surge_fee}
                    onChange={(v: any) =>
                      handleUpdate(rate.district_name, "surge_fee", v)
                    }
                    icon="RP"
                    isSurge
                    warningCondition={rate.surge_fee >= 10000}
                    warningText="Biaya lonjakan sangat tinggi!"
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

                  <div className="mt-4 text-[10px] space-y-2 font-bold tracking-widest">
                    <div className="flex justify-between text-slate-400">
                      <span>POTONGAN {simTipeToko}</span>
                      <span className="text-white">
                        RP {sim.total_potongan_toko.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-teal-400 border-t border-white/10 pt-2">
                      <span>NET PASARQU (DARI TOKO)</span>
                      <span>RP {sim.admin_toko_net.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="text-[10px] text-teal-400 mb-2 block tracking-widest flex items-center gap-2">
                      <MapPin size={12} /> JARAK: {simDist} KM
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="20"
                      value={simDist}
                      onChange={(e) => setSimDist(Number(e.target.value))}
                      className="w-full accent-[#008080] h-2 bg-slate-700 rounded-md appearance-none cursor-pointer"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] text-teal-400 mb-2 block tracking-widest flex items-center gap-2">
                      <Store size={12} /> TITIK: {simStops} TOKO
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
                </div>

                <button
                  onClick={() => setSimSurge(!simSurge)}
                  className={`w-full py-2 rounded-md text-[10px] font-black tracking-widest border transition-all ${simSurge ? "bg-red-500/20 border-red-500 text-red-400" : "bg-slate-800 border-slate-700 text-slate-500"}`}
                >
                  {simSurge ? "🔥 MODE SIBUK AKTIF" : "AKTIFKAN MODE SIBUK"}
                </button>

                <div className="space-y-3 pt-4 border-t border-white/10">
                  <div className="bg-slate-800 p-3 rounded-md border border-slate-700">
                    <p className="text-[9px] text-slate-400 tracking-widest mb-1 flex justify-between">
                      <span>TOTAL ONGKIR (ASLI)</span>
                      <span>Rp {sim.total_ongkir.toLocaleString()}</span>
                    </p>
                    {sim.app_subsidy > 0 && (
                      <p className="text-[9px] text-teal-400 tracking-widest mb-1 flex justify-between font-black">
                        <span>
                          SUBSIDI (MAX RP{" "}
                          {Number(
                            selectedRate.max_free_shipping_subsidy,
                          ).toLocaleString()}
                          )
                        </span>
                        <span>- Rp {sim.app_subsidy.toLocaleString()}</span>
                      </p>
                    )}
                    <p className="text-[12px] text-white tracking-widest mt-2 border-t border-slate-700 pt-2 flex justify-between font-[1000]">
                      <span>ONGKIR DIBAYAR USER</span>
                      <span
                        className={
                          sim.user_pay_shipping > 0 && sim.app_subsidy > 0
                            ? "text-orange-400"
                            : sim.app_subsidy > 0
                              ? "text-teal-400"
                              : "text-white"
                        }
                      >
                        Rp {sim.user_pay_shipping.toLocaleString()}
                      </span>
                    </p>
                  </div>

                  <div className="flex justify-between items-center bg-[#008080]/20 p-3 rounded-md border border-[#008080]/50">
                    <div>
                      <p className="text-[9px] text-teal-200 tracking-widest mb-1">
                        HAK KURIR
                      </p>
                      <p className="text-[16px] font-[1000] font-sans text-white">
                        RP {sim.courier_net.toLocaleString()}
                      </p>
                    </div>
                    <Truck className="text-[#008080]" size={24} />
                  </div>

                  <div
                    className={`bg-white p-4 rounded-md mt-4 shadow-xl border-b-4 ${sim.app_profit < 0 ? "border-red-500" : "border-[#FF6600]"}`}
                  >
                    <p className="text-[10px] text-slate-500 font-black tracking-widest mb-1 flex justify-between">
                      <span>NET PROFIT PASARQU</span>
                      {sim.app_profit < 0 && (
                        <span className="text-red-500 animate-pulse flex items-center gap-1">
                          <AlertTriangle size={12} /> RUGI
                        </span>
                      )}
                    </p>
                    <h2
                      className={`text-[28px] font-[1000] leading-none font-sans tracking-tighter ${sim.app_profit < 0 ? "text-red-600" : "text-[#FF6600]"}`}
                    >
                      RP {sim.app_profit.toLocaleString()}
                    </h2>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-20 text-center text-slate-500 text-[10px] tracking-widest">
                PILIH DISTRIK PASAR...
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
  theme,
  warningCondition,
  warningText,
}: any) => {
  const isDark = theme === "dark";
  return (
    <div className="text-left">
      <label
        className={`text-[10px] font-black mb-1.5 flex items-center gap-1 tracking-widest ${isDark ? "text-white" : isSurge ? "text-red-500" : isService ? "text-[#008080]" : isAdmin ? "text-[#FF6600]" : "text-slate-500"}`}
      >
        {warningCondition && (
          <AlertTriangle size={12} className="text-red-500 animate-pulse" />
        )}
        {label}
      </label>
      <div className="relative group">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[12px] font-black text-slate-400">
            {icon}
          </span>
        )}
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full py-3 ${icon ? "pl-9" : "pl-3"} pr-8 rounded-md border-2 outline-none font-[1000] text-[14px] font-sans transition-all ${isDark ? "bg-slate-900 border-slate-700 text-white focus:border-teal-500" : "bg-white focus:border-[#008080] border-slate-200 text-slate-900 shadow-sm"} ${warningCondition ? "border-red-400 focus:border-red-500 bg-red-50 text-red-700" : ""}`}
        />
        {unit && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] font-black text-slate-400">
            {unit}
          </span>
        )}
      </div>
      {warningCondition && (
        <p className="text-red-500 text-[9px] font-bold mt-1 tracking-widest flex items-start gap-1">
          <ShieldAlert size={10} className="shrink-0 mt-0.5" /> {warningText}
        </p>
      )}
    </div>
  );
};
