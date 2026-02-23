import React, { useState, useEffect } from "react";
import {
  Landmark,
  PiggyBank,
  HeartHandshake,
  Wrench,
  AlertTriangle,
  Calendar,
  Save,
  Info,
  TrendingUp,
  ShieldAlert,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import { supabase } from "../../../../lib/supabaseClient";
import { useToast } from "../../../../contexts/ToastContext";

// 🚀 IMPORT KOMPONEN ANAK YANG BARU SAJA KITA BUAT
import { ExpenseManager } from "./ExpenseManager";

export const TaxAndCSRConfig: React.FC = () => {
  const { showToast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // --- DATA KEUANGAN ---
  const [totalProfit, setTotalProfit] = useState(0);
  const [taxThreshold, setTaxThreshold] = useState(500000000);
  const [taxRate, setTaxRate] = useState(0.11);
  const [csrPercent, setCsrPercent] = useState(5);
  const [maintenancePercent, setMaintenancePercent] = useState(15);
  const [emergencyPercent, setEmergencyPercent] = useState(10);

  // State Riwayat Pengeluaran (Diteruskan ke komponen anak)
  const [adminExpenses, setAdminExpenses] = useState<any[]>([]);

  // --- FETCH DATA DARI SUPABASE ---
  const fetchFinanceData = async () => {
    setIsLoading(true);
    try {
      const { data: settingsData } = await supabase
        .from("finance_settings")
        .select("*")
        .eq("id", 1)
        .single();

      if (settingsData) {
        setCsrPercent(settingsData.csr_percent || 5);
        setMaintenancePercent(settingsData.maintenance_percent || 15);
        setEmergencyPercent(settingsData.emergency_percent || 10);
        setTaxThreshold(settingsData.tax_threshold || 500000000);
        setTaxRate(settingsData.tax_rate || 0.11);
      }

      const { data: ledgerData } = await supabase
        .from("finance_ledger")
        .select("amount")
        .in("type", [
          "BUYER_SERVICE_FEE",
          "COURIER_APP_FEE",
          "MERCHANT_FEE",
          "TOPUP_FEE",
          "MERCHANT_UPGRADE_FEE",
          "ADS_FEE",
        ])
        .eq("status", "COMPLETED");

      if (ledgerData) {
        const calculatedProfit = ledgerData.reduce(
          (sum, row) => sum + (row.amount || 0),
          0,
        );
        setTotalProfit(calculatedProfit);
      }

      const { data: expenseData, error: expenseError } = await supabase
        .from("admin_withdrawals")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);

      if (expenseData && !expenseError) {
        setAdminExpenses(expenseData);
      }
    } catch (error) {
      console.error("Gagal mengambil data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFinanceData();
  }, []);

  // --- PERHITUNGAN OTOMATIS ---
  const isTaxActive = totalProfit >= taxThreshold;
  const taxAmount = isTaxActive ? totalProfit * taxRate : 0;
  const netProfitAfterTax = totalProfit - taxAmount;

  const csrAmount = netProfitAfterTax * (csrPercent / 100);
  const maintenanceAmount = netProfitAfterTax * (maintenancePercent / 100);
  const emergencyAmount = netProfitAfterTax * (emergencyPercent / 100);

  const finalCompanyProfit =
    netProfitAfterTax - (csrAmount + maintenanceAmount + emergencyAmount);

  const today = new Date();
  const currentYear = today.getFullYear();
  const endOfYear = new Date(currentYear, 11, 31);
  const daysLeft = Math.ceil(
    (endOfYear.getTime() - today.getTime()) / (1000 * 3600 * 24),
  );

  // --- SIMPAN PENGATURAN ---
  const handleSave = async () => {
    const totalPercent = csrPercent + maintenancePercent + emergencyPercent;
    if (totalPercent > 100) {
      showToast("Total persentase tidak boleh melebihi 100%", "error");
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase.from("finance_settings").upsert({
        id: 1,
        csr_percent: csrPercent,
        maintenance_percent: maintenancePercent,
        emergency_percent: emergencyPercent,
        tax_threshold: taxThreshold,
        tax_rate: taxRate,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;
      showToast("Konfigurasi Alokasi Dana Berhasil Disimpan!", "success");
    } catch (error) {
      console.error("Gagal menyimpan:", error);
      showToast("Gagal menyimpan konfigurasi ke server.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const formatRp = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Loader2 className="animate-spin text-[#008080]" size={40} />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
          MENGAMBIL DATA KEUANGAN PASARQU...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500 text-slate-800 pb-10">
      {/* 1. HEADER SECTION */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-lg font-black uppercase tracking-tighter text-[#008080] flex items-center gap-2">
            <Landmark size={24} /> Pengaturan Pajak & Alokasi Dana
          </h2>
          <p className="text-[12px] font-bold text-slate-500 mt-1 uppercase">
            Sistem otomatis pembagian profit PasarQu (CSR, Perawatan, Darurat)
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className={`${isSaving ? "bg-slate-400" : "bg-[#008080] hover:bg-teal-700"} text-white px-6 py-3 rounded-xl font-black text-[12px] uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg active:scale-95`}
        >
          {isSaving ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Save size={16} />
          )}
          {isSaving ? "MENYIMPAN..." : "SIMPAN KONFIGURASI"}
        </button>
      </div>

      {/* 2. PAJAK SECTION */}
      <div className="bg-slate-900 rounded-2xl p-6 text-white relative overflow-hidden shadow-xl">
        <div className="absolute -right-10 -top-10 opacity-10">
          <Landmark size={200} />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-[14px] font-black uppercase text-orange-400">
              Status Wajib Pajak Perusahaan (Tahun {currentYear})
            </h3>
            <div className="group relative cursor-pointer">
              <Info size={16} className="text-slate-400 hover:text-white" />
              <div className="absolute hidden group-hover:block w-64 p-3 bg-slate-800 text-[10px] text-slate-300 rounded-lg -top-2 left-6 shadow-2xl z-20">
                Berdasarkan UU Perpajakan RI, kewajiban pajak aktif otomatis
                jika total akumulasi profit menyentuh batas PTKP / Omzet UMKM.
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
              <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">
                Total Profit Berjalan
              </p>
              <p className="text-xl font-black text-white">
                {formatRp(totalProfit)}
              </p>
            </div>
            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
              <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">
                Status Pajak ({taxRate * 100}%)
              </p>
              {isTaxActive ? (
                <div className="flex items-center gap-2 text-red-400 font-black">
                  <ShieldAlert size={18} /> AKTIF
                </div>
              ) : (
                <div className="flex items-center gap-2 text-teal-400 font-black">
                  <ShieldCheck size={18} /> BELUM WAJIB
                </div>
              )}
            </div>
            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
              <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">
                Reset Pajak Berikutnya
              </p>
              <div className="flex items-center gap-2 text-orange-400 font-black">
                <Calendar size={18} /> {daysLeft} HARI LAGI
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase">
              <span>Rp 0</span>
              <span>Batas Kena Pajak: {formatRp(taxThreshold)}</span>
            </div>
            <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-1000 ${isTaxActive ? "bg-red-500" : "bg-teal-500"}`}
                style={{
                  width: `${Math.min((totalProfit / taxThreshold) * 100, 100)}%`,
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. ALOKASI DANA SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* KIRI: SLIDER */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <h3 className="text-[14px] font-black uppercase text-[#008080] border-b pb-3">
            Atur Persentase Alokasi
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-[12px] font-black flex items-center gap-2 uppercase">
                <HeartHandshake size={16} className="text-pink-500" /> CSR
                (Bantuan Sosial)
              </label>
              <span className="text-[14px] font-black text-pink-500">
                {csrPercent}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              value={csrPercent}
              onChange={(e) => setCsrPercent(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-pink-500"
            />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-[12px] font-black flex items-center gap-2 uppercase">
                <Wrench size={16} className="text-blue-500" /> Perawatan Sistem
              </label>
              <span className="text-[14px] font-black text-blue-500">
                {maintenancePercent}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              value={maintenancePercent}
              onChange={(e) => setMaintenancePercent(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-[12px] font-black flex items-center gap-2 uppercase">
                <AlertTriangle size={16} className="text-orange-500" /> Dana
                Darurat
              </label>
              <span className="text-[14px] font-black text-orange-500">
                {emergencyPercent}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              value={emergencyPercent}
              onChange={(e) => setEmergencyPercent(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
            />
          </div>
        </div>

        {/* KANAN: PREVIEW */}
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <h3 className="text-[14px] font-black uppercase text-[#008080] border-b pb-3 mb-4">
            Preview Pembagian Profit
          </h3>
          <div className="flex-1 space-y-4">
            <div className="flex justify-between items-center p-3 bg-white rounded-xl border border-slate-100">
              <span className="text-[12px] font-bold text-slate-500">
                PROFIT KOTOR
              </span>
              <span className="text-[14px] font-black">
                {formatRp(totalProfit)}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-red-50 rounded-xl border border-red-100">
              <span className="text-[12px] font-bold text-red-600 flex items-center gap-2">
                POTONGAN PAJAK {isTaxActive ? `(${taxRate * 100}%)` : ""}
              </span>
              <span className="text-[14px] font-black text-red-600">
                - {formatRp(taxAmount)}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-pink-50 rounded-xl border border-pink-100">
              <span className="text-[12px] font-bold text-pink-600">
                DANA CSR ({csrPercent}%)
              </span>
              <span className="text-[14px] font-black text-pink-600">
                {formatRp(csrAmount)}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-xl border border-blue-100">
              <span className="text-[12px] font-bold text-blue-600">
                PERAWATAN ({maintenancePercent}%)
              </span>
              <span className="text-[14px] font-black text-blue-600">
                {formatRp(maintenanceAmount)}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-orange-50 rounded-xl border border-orange-100">
              <span className="text-[12px] font-bold text-orange-600">
                DANA DARURAT ({emergencyPercent}%)
              </span>
              <span className="text-[14px] font-black text-orange-600">
                {formatRp(emergencyAmount)}
              </span>
            </div>
          </div>
          <div className="mt-6 p-4 bg-[#008080] text-white rounded-xl shadow-lg flex justify-between items-center">
            <div>
              <p className="text-[10px] font-black uppercase opacity-80 mb-1 flex items-center gap-1">
                <TrendingUp size={12} /> Sisa Profit Perusahaan
              </p>
              <p className="text-2xl font-black">
                {formatRp(finalCompanyProfit)}
              </p>
            </div>
            <PiggyBank size={40} className="opacity-50" />
          </div>
        </div>
      </div>

      {/* 🚀 4. KOMPONEN PENGELUARAN YANG SUDAH DIPISAH */}
      <ExpenseManager
        adminExpenses={adminExpenses}
        setAdminExpenses={setAdminExpenses}
      />
    </div>
  );
};

export default TaxAndCSRConfig;
