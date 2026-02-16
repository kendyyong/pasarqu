import React, { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import {
  Wallet,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Loader2,
  TrendingUp,
  ArrowUpRight,
  Banknote,
  Settings,
  Percent,
  ShieldAlert,
  Save,
  DollarSign,
} from "lucide-react";
import { useToast } from "../../../contexts/ToastContext";
import { useConfig } from "../../../contexts/ConfigContext";

const formatRupiah = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};

// Data Mock Statistik
const chartData = [
  { day: "Sen", value: 45 },
  { day: "Sel", value: 52 },
  { day: "Rab", value: 38 },
  { day: "Kam", value: 65 },
  { day: "Jum", value: 48 },
  { day: "Sab", value: 80 },
  { day: "Min", value: 70 },
];

export const FinanceManager = ({ finance }: any) => {
  const { showToast } = useToast();
  const { refreshConfig } = useConfig();

  // State Navigasi Internal
  const [currentTab, setCurrentTab] = useState<
    "overview" | "payouts" | "settings"
  >("overview");

  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [processing, setProcessing] = useState(false);

  // State Form Ekonomi (Pindahan dari Global Config)
  const [savingEco, setSavingEco] = useState(false);
  const [ecoForm, setEcoForm] = useState({
    platform_fee: 0,
    tax_percent: 0,
    min_withdraw: 0,
    min_wallet_limit: 0,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Ambil Data Penarikan
      const { data: payoutData } = await supabase
        .from("payout_requests")
        .select(`*, wallets (owner_id, owner_type)`)
        .order("created_at", { ascending: false });

      // 2. Ambil Data Pengaturan Ekonomi
      const { data: settingsData } = await supabase
        .from("app_settings")
        .select("platform_fee, tax_percent, min_withdraw, min_wallet_limit")
        .eq("id", 1)
        .single();

      if (payoutData) setPayouts(payoutData);
      if (settingsData) {
        setEcoForm({
          platform_fee: settingsData.platform_fee || 0,
          tax_percent: settingsData.tax_percent || 0,
          min_withdraw: settingsData.min_withdraw || 0,
          min_wallet_limit: settingsData.min_wallet_limit || 0,
        });
      }
    } catch (err: any) {
      showToast("Gagal memuat data keuangan", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleProcessPayout = async (status: "APPROVED" | "REJECTED") => {
    if (!selectedItem) return;
    setProcessing(true);
    try {
      const { error } = await supabase
        .from("payout_requests")
        .update({
          status,
          processed_at: new Date(),
          admin_note:
            status === "APPROVED"
              ? "Dana telah ditransfer"
              : "Ditolak oleh admin",
        })
        .eq("id", selectedItem.id);

      if (error) throw error;
      showToast(
        `Penarikan ${status === "APPROVED" ? "disetujui" : "ditolak"}`,
        "success",
      );
      setSelectedItem(null);
      fetchData();
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setProcessing(false);
    }
  };

  const handleSaveEconomy = async () => {
    setSavingEco(true);
    try {
      const { error } = await supabase
        .from("app_settings")
        .update(ecoForm)
        .eq("id", 1);

      if (error) throw error;
      await refreshConfig();
      showToast("Kebijakan ekonomi berhasil diperbarui", "success");
    } catch (err: any) {
      showToast("Gagal menyimpan: " + err.message, "error");
    } finally {
      setSavingEco(false);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-teal-600" size={32} />
      </div>
    );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20 text-left">
      {/* MENU NAVIGASI TAB */}
      <div className="flex bg-slate-100 p-1.5 rounded-[1.5rem] w-fit mb-8 shadow-inner">
        {[
          { id: "overview", label: "Statistik", icon: TrendingUp },
          { id: "payouts", label: "Penarikan", icon: Banknote },
          { id: "settings", label: "Kebijakan", icon: Settings },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setCurrentTab(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              currentTab === tab.id
                ? "bg-white text-teal-600 shadow-sm"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* --- KONTEN OVERVIEW --- */}
      {currentTab === "overview" && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-5">
              <div className="w-14 h-14 bg-teal-50 text-teal-600 rounded-[1.2rem] flex items-center justify-center shadow-inner">
                <Wallet size={28} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">
                  Total Revenue
                </p>
                <h3 className="text-2xl font-black text-slate-800 tracking-tighter">
                  {formatRupiah(finance?.revenue || 0)}
                </h3>
              </div>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-5">
              <div className="w-14 h-14 bg-orange-50 text-orange-500 rounded-[1.2rem] flex items-center justify-center shadow-inner">
                <Clock size={28} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">
                  Menunggu Cair
                </p>
                <h3 className="text-2xl font-black text-slate-800 tracking-tighter">
                  {formatRupiah(
                    payouts.reduce(
                      (s, i) => (i.status === "REQUESTED" ? s + i.amount : s),
                      0,
                    ),
                  )}
                </h3>
              </div>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-5">
              <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-[1.2rem] flex items-center justify-center shadow-inner">
                <TrendingUp size={28} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">
                  Growth
                </p>
                <h3 className="text-2xl font-black text-blue-600 tracking-tighter">
                  +12.5%
                </h3>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-12">
              <h3 className="font-black text-slate-800 uppercase tracking-tighter text-xl">
                Tren Pendapatan
              </h3>
              <div className="px-5 py-2.5 bg-teal-50 text-teal-600 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-teal-100 flex items-center gap-2">
                <ArrowUpRight size={14} /> Performa Stabil
              </div>
            </div>
            <div className="flex items-end justify-between h-72 gap-3 md:gap-6 px-4">
              {chartData.map((data, i) => (
                <div
                  key={i}
                  className="flex-1 flex flex-col items-center gap-4 group cursor-pointer"
                >
                  <div className="relative w-full flex items-end justify-center h-full">
                    <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-all bg-slate-900 text-white text-[10px] font-black px-3 py-1.5 rounded-xl pointer-events-none mb-2 shadow-xl">
                      {data.value}%
                    </div>
                    <div
                      className="w-full max-w-[45px] bg-slate-100 group-hover:bg-teal-500 rounded-t-[1rem] transition-all duration-500 ease-out shadow-inner"
                      style={{ height: `${data.value}%` }}
                    ></div>
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {data.day}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- KONTEN PAYOUTS --- */}
      {currentTab === "payouts" && (
        <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-10 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
            <h3 className="font-black text-slate-800 uppercase tracking-tighter text-lg">
              Daftar Penarikan Dana
            </h3>
            <div className="bg-white border border-slate-200 rounded-2xl px-5 py-3 flex items-center gap-3">
              <Search size={16} className="text-slate-400" />
              <input
                type="text"
                placeholder="Cari Mitra..."
                className="bg-transparent outline-none text-xs font-bold w-40"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-100">
                  <th className="px-10 py-6">Mitra / Dompet</th>
                  <th className="px-10 py-6">Rekening Tujuan</th>
                  <th className="px-10 py-6">Nominal</th>
                  <th className="px-10 py-6">Status</th>
                  <th className="px-10 py-6 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="text-xs font-bold text-slate-700 divide-y divide-slate-50">
                {payouts.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-10 py-6">
                      <p className="text-slate-900 font-black uppercase tracking-tight">
                        ID: {item.wallets?.owner_id?.slice(0, 8)}
                      </p>
                      <span className="text-[9px] bg-teal-50 text-teal-600 px-2 py-0.5 rounded-md uppercase font-black">
                        {item.wallets?.owner_type}
                      </span>
                    </td>
                    <td className="px-10 py-6">
                      <p className="text-slate-800">{item.bank_name}</p>
                      <p className="text-[10px] text-slate-400">
                        {item.account_number}
                      </p>
                    </td>
                    <td className="px-10 py-6 font-black text-slate-900">
                      {formatRupiah(item.amount)}
                    </td>
                    <td className="px-10 py-6">
                      <span
                        className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${item.status === "REQUESTED" ? "bg-orange-50 text-orange-600" : "bg-green-50 text-green-600"}`}
                      >
                        {item.status === "REQUESTED" ? "PENDING" : item.status}
                      </span>
                    </td>
                    <td className="px-10 py-6 text-right">
                      {item.status === "REQUESTED" && (
                        <button
                          onClick={() => setSelectedItem(item)}
                          className="bg-slate-900 text-white px-6 py-2.5 rounded-2xl text-[9px] font-black uppercase hover:bg-teal-600 transition-all shadow-lg"
                        >
                          Proses
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- KONTEN SETTINGS (DARI GLOBAL CONFIG) --- */}
      {currentTab === "settings" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-bottom-4 duration-500">
          <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-pink-50 text-pink-500 rounded-2xl flex items-center justify-center">
                <Percent size={24} />
              </div>
              <h3 className="font-black text-slate-800 uppercase tracking-tighter">
                Biaya & Pajak
              </h3>
            </div>
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                  Platform Fee (Rp)
                </label>
                <input
                  type="number"
                  value={ecoForm.platform_fee}
                  onChange={(e) =>
                    setEcoForm({
                      ...ecoForm,
                      platform_fee: Number(e.target.value),
                    })
                  }
                  className="w-full bg-slate-50 rounded-2xl px-5 py-4 font-bold text-slate-700 focus:ring-2 focus:ring-pink-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                  Pajak / Tax (%)
                </label>
                <input
                  type="number"
                  value={ecoForm.tax_percent}
                  onChange={(e) =>
                    setEcoForm({
                      ...ecoForm,
                      tax_percent: Number(e.target.value),
                    })
                  }
                  className="w-full bg-slate-50 rounded-2xl px-5 py-4 font-bold text-slate-700 focus:ring-2 focus:ring-pink-500 outline-none transition-all"
                />
              </div>
            </div>
          </div>

          <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center">
                <ShieldAlert size={24} />
              </div>
              <h3 className="font-black text-slate-800 uppercase tracking-tighter">
                Limit & Keamanan
              </h3>
            </div>
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                  Min. Withdraw (Rp)
                </label>
                <input
                  type="number"
                  value={ecoForm.min_withdraw}
                  onChange={(e) =>
                    setEcoForm({
                      ...ecoForm,
                      min_withdraw: Number(e.target.value),
                    })
                  }
                  className="w-full bg-slate-50 rounded-2xl px-5 py-4 font-bold text-slate-700 focus:ring-2 focus:ring-red-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-red-500 uppercase tracking-widest block mb-2">
                  Auto-Freeze Kurir (Rp)
                </label>
                <input
                  type="number"
                  value={ecoForm.min_wallet_limit}
                  onChange={(e) =>
                    setEcoForm({
                      ...ecoForm,
                      min_wallet_limit: Number(e.target.value),
                    })
                  }
                  className="w-full bg-red-50 rounded-2xl px-5 py-4 font-black text-red-700 focus:ring-2 focus:ring-red-500 outline-none transition-all"
                />
              </div>
            </div>
          </div>

          <div className="md:col-span-2 flex justify-end">
            <button
              onClick={handleSaveEconomy}
              disabled={savingEco}
              className="bg-teal-600 text-white px-10 py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest flex items-center gap-3 hover:bg-teal-700 shadow-xl shadow-teal-600/20 active:scale-95 transition-all"
            >
              {savingEco ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <Save size={18} />
              )}
              Terapkan Kebijakan Baru
            </button>
          </div>
        </div>
      )}

      {/* --- MODAL PROSES --- */}
      {selectedItem && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-6 text-center">
          <div className="bg-white rounded-[3.5rem] w-full max-w-md p-12 shadow-2xl animate-in zoom-in-95 duration-300">
            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-8 italic">
              Konfirmasi <span className="text-teal-600">Pencairan</span>
            </h3>
            <div className="bg-slate-50 p-8 rounded-[2.5rem] mb-10 space-y-4 border border-slate-100 shadow-inner">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                  Tujuan Transfer
                </p>
                <p className="text-sm font-black text-slate-800 uppercase">
                  {selectedItem.bank_name}
                </p>
                <p className="text-lg font-black text-slate-900 tracking-widest mt-1">
                  {selectedItem.account_number}
                </p>
              </div>
              <div className="pt-4 border-t border-slate-200">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                  Nominal Bersih
                </p>
                <p className="text-3xl font-black text-teal-600 tracking-tighter">
                  {formatRupiah(selectedItem.amount)}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleProcessPayout("REJECTED")}
                className="py-5 font-black text-[10px] uppercase tracking-widest text-red-500 hover:bg-red-50 rounded-[1.8rem] transition-all"
              >
                Tolak
              </button>
              <button
                onClick={() => handleProcessPayout("APPROVED")}
                className="py-5 bg-teal-600 text-white font-black text-[10px] uppercase tracking-widest rounded-[1.8rem] shadow-xl active:scale-95 transition-all"
              >
                {processing ? (
                  <Loader2 className="animate-spin mx-auto" />
                ) : (
                  "Setujui & Cairkan"
                )}
              </button>
            </div>
            <button
              onClick={() => setSelectedItem(null)}
              className="w-full mt-8 text-[9px] font-black text-slate-300 uppercase tracking-[0.3em] hover:text-slate-900"
            >
              Batal
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
