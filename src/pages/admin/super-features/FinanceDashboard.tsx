import React, { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabaseClient";
import {
  ShieldCheck,
  Heart,
  Settings,
  BadgePercent,
  Coins,
  Loader2,
  Activity,
  LogOut,
  FileText,
  Download,
  Sliders,
  Save,
  ArrowUpRight,
  ArrowDownLeft,
  TrendingUp,
  RefreshCw,
  X,
  Building,
  CreditCard,
} from "lucide-react";

export const FinanceDashboard: React.FC<any> = ({ theme }) => {
  const [allocations, setAllocations] = useState<any>(null);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [weeklyStats, setWeeklyStats] = useState<any[]>([]);
  const [taxLog, setTaxLog] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showTaxReport, setShowTaxReport] = useState(false);
  const [lastTaxReset, setLastTaxReset] = useState<string | null>(null);

  // STATE UNTUK MODAL TRANSFER BANK
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawTarget, setWithdrawTarget] = useState({
    category: "",
    amount: 0,
  });
  const [withdrawForm, setWithdrawForm] = useState({
    bank: "BCA",
    accNo: "",
    note: "",
  });

  const [showConfig, setShowConfig] = useState(false);
  const [config, setConfig] = useState({
    p_csr: 10,
    p_sys: 20,
    p_mkt: 15,
    p_emg: 5,
  });

  const isDark = theme?.bg?.includes("#0b0f19");

  const fetchData = async () => {
    try {
      setLoading(true);

      // 1. Ambil Config Persentase Alokasi
      const { data: confData } = await supabase
        .from("platform_config")
        .select("*");
      if (confData && confData.length > 0) {
        const c: any = {};
        confData.forEach((item) => (c[item.key] = item.value_percent * 100));
        setConfig((prev) => ({ ...prev, ...c }));
      }

      // 2. Ambil Waktu Reset Pajak Terakhir
      const { data: lastReset } = await supabase
        .from("platform_withdrawals")
        .select("created_at")
        .eq("category", "tax")
        .order("created_at", { ascending: false })
        .limit(1);

      const resetDate = lastReset?.[0]?.created_at || "2000-01-01T00:00:00Z";
      setLastTaxReset(resetDate);

      // 3. Ambil Data Transaksi Terbaru (Limit 100)
      const { data: trxData } = await supabase
        .from("transactions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      const allTransactions = trxData || [];
      setTransactions(allTransactions);

      // 4. Logika Grafik Mingguan (Debit Only)
      const days = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
      const stats = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dayName = days[d.getDay()];
        const dateStr = d.toISOString().split("T")[0];
        const dayTotal = allTransactions
          .filter((t) => t.created_at.startsWith(dateStr) && t.debit > 0)
          .reduce((acc, curr) => acc + Number(curr.debit), 0);
        return { label: dayName, value: dayTotal };
      }).reverse();
      setWeeklyStats(stats);

      // 5. Kalkulasi Bucket Alokasi Berdasarkan Pendapatan Layanan (INCOME_SERVICE_FEE)
      const serviceFees = allTransactions.filter(
        (t) => t.type === "INCOME_SERVICE_FEE",
      );
      const grossIncome = serviceFees.reduce(
        (acc, curr) => acc + Number(curr.debit),
        0,
      );

      const summary = {
        gross: grossIncome,
        dpp: grossIncome / 1.11,
        tax: (grossIncome / 1.11) * 0.005,
        csr: grossIncome * (config.p_csr / 100),
        maintenance: grossIncome * (config.p_sys / 100),
        promo: grossIncome * (config.p_mkt / 100),
        emergency: grossIncome * (config.p_emg / 100),
        net:
          grossIncome *
          ((100 - (config.p_csr + config.p_sys + config.p_mkt + config.p_emg)) /
            100),
      };
      setAllocations(summary);

      // 6. Ambil Antrian Payout (Kurir/Merchant)
      const { data: payoutData } = await supabase
        .from("payout_requests")
        .select(`*, wallets(owner_id, owner_type)`)
        .order("created_at", { ascending: false });
      setPayouts(payoutData || []);

      // 7. Ambil Data Pajak
      const { data: taxData } = await supabase
        .from("platform_tax_reports")
        .select("*")
        .limit(20);
      setTaxLog(taxData || []);
    } catch (err) {
      console.error("Finance fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprovePayout = async (payout: any) => {
    if (
      !window.confirm(
        `Proses transfer otomatis Rp ${payout.amount.toLocaleString()}?`,
      )
    )
      return;
    try {
      setActionLoading(true);
      const { error } = await supabase.functions.invoke(
        "midtrans-disbursement",
        {
          body: {
            payoutId: payout.id,
            amount: payout.amount,
            bankCode: "bca",
            accountNumber: payout.account_number,
          },
        },
      );
      if (error) throw error;

      await supabase
        .from("payout_requests")
        .update({ status: "APPROVED" })
        .eq("id", payout.id);
      alert("✅ PEMBAYARAN BERHASIL!");
      fetchData();
    } catch (err: any) {
      alert("❌ GAGAL: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // --- FUNGSI BARU: EXECUTE WITHDRAWAL KE BANK ---
  const handleExecuteWithdrawal = async () => {
    if (!withdrawForm.accNo) return alert("Masukkan Nomor Rekening!");

    setActionLoading(true);
    try {
      // 1. Catat ke platform_withdrawals
      const { error: wErr } = await supabase
        .from("platform_withdrawals")
        .insert({
          category:
            withdrawTarget.category === "csr"
              ? "tithe"
              : withdrawTarget.category,
          amount: withdrawTarget.amount,
          note: `TRF ${withdrawForm.bank} | NO: ${withdrawForm.accNo} | KET: ${withdrawForm.note}`,
        });
      if (wErr) throw wErr;

      // 2. Jurnal Transaksi (Credit/Uang Keluar)
      await supabase.from("transactions").insert({
        type: "WITHDRAWAL",
        credit: withdrawTarget.amount,
        debit: 0,
        account_code: "1001-KAS",
        description: `Tarik ${withdrawTarget.category.toUpperCase()} ke ${withdrawForm.bank} (${withdrawForm.accNo})`,
      });

      alert("✅ PENARIKAN BERHASIL DIPROSES");
      setShowWithdrawModal(false);
      fetchData();
    } catch (err: any) {
      alert("❌ GAGAL: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const openWithdrawModal = (category: string, amount: number) => {
    if (amount <= 0) return alert("Bucket saldo ini kosong.");
    setWithdrawTarget({ category, amount });
    setShowWithdrawModal(true);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const platformLiquidity = transactions.reduce(
    (acc, curr) => acc + (Number(curr.debit) - Number(curr.credit)),
    0,
  );
  const maxWeekly = Math.max(...weeklyStats.map((s) => s.value), 1);

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4">
        <Loader2 className="animate-spin text-teal-500" size={48} />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
          Menghitung Asset Platform...
        </p>
      </div>
    );

  return (
    <div className="w-full max-w-full mx-auto space-y-10 animate-in fade-in duration-700 pb-20 px-2 text-left relative">
      {/* MODAL WITHDRAWAL KE BANK */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-sm">
          <div
            className={`w-full max-w-md ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"} rounded-[3rem] p-10 shadow-2xl relative border`}
          >
            <button
              onClick={() => setShowWithdrawModal(false)}
              className="absolute top-8 right-8 text-slate-400 hover:text-red-500 transition-colors"
            >
              <X size={24} />
            </button>
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-teal-600 shadow-inner">
                <Building size={32} />
              </div>
              <h2
                className={`text-xl font-black uppercase italic ${theme?.text}`}
              >
                Bank Transfer
              </h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">
                Bucket: {withdrawTarget.category.toUpperCase()}
              </p>
            </div>
            <div className="space-y-6">
              <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase">
                  Jumlah Penarikan
                </p>
                <h3 className="text-3xl font-black text-teal-600 mt-1 italic">
                  Rp {withdrawTarget.amount.toLocaleString()}
                </h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-[9px] font-black uppercase text-slate-400 ml-2">
                    Bank Tujuan
                  </label>
                  <select
                    value={withdrawForm.bank}
                    onChange={(e) =>
                      setWithdrawForm({ ...withdrawForm, bank: e.target.value })
                    }
                    className="w-full p-4 mt-2 bg-slate-50 border border-slate-200 rounded-2xl font-black text-xs outline-none"
                  >
                    <option>BCA</option>
                    <option>MANDIRI</option>
                    <option>BNI</option>
                    <option>BRI</option>
                    <option>DANA / OVO</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase text-slate-400 ml-2">
                    Nomor Rekening
                  </label>
                  <input
                    type="number"
                    placeholder="Contoh: 812345678"
                    value={withdrawForm.accNo}
                    onChange={(e) =>
                      setWithdrawForm({
                        ...withdrawForm,
                        accNo: e.target.value,
                      })
                    }
                    className="w-full p-4 mt-2 bg-slate-50 border border-slate-200 rounded-2xl font-black text-xs outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase text-slate-400 ml-2">
                    Catatan (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="Tujuan penarikan..."
                    value={withdrawForm.note}
                    onChange={(e) =>
                      setWithdrawForm({ ...withdrawForm, note: e.target.value })
                    }
                    className="w-full p-4 mt-2 bg-slate-50 border border-slate-200 rounded-2xl font-black text-xs outline-none"
                  />
                </div>
              </div>
              <button
                disabled={actionLoading}
                onClick={handleExecuteWithdrawal}
                className="w-full py-5 bg-teal-600 text-white rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-xl shadow-teal-500/20 active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                {actionLoading ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <CreditCard size={20} />
                )}
                Proses Transfer Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER UTAMA */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 px-2">
        <div className="text-left">
          <h1
            className={`text-3xl font-black uppercase tracking-tighter italic flex items-center gap-3 ${theme?.text || "text-slate-900"}`}
          >
            <Activity className="text-teal-500" size={28} /> Finance{" "}
            <span className="text-teal-500">Master</span>
          </h1>
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setShowTaxReport(!showTaxReport)}
              className={`flex items-center gap-2 text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-xl border ${theme?.border} hover:bg-teal-500 hover:text-white transition-all shadow-sm`}
            >
              {showTaxReport ? <Activity size={14} /> : <FileText size={14} />}{" "}
              {showTaxReport ? "Overview" : "Tax Report"}
            </button>
            <button
              onClick={() => setShowConfig(!showConfig)}
              className={`flex items-center gap-2 text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-xl border ${theme?.border} hover:bg-orange-500 hover:text-white transition-all shadow-sm`}
            >
              <Sliders size={14} /> Protocol
            </button>
            <button
              onClick={fetchData}
              className={`p-2 rounded-xl border ${theme?.border} hover:bg-slate-50 transition-all`}
            >
              <RefreshCw size={14} className="text-slate-400" />
            </button>
          </div>
        </div>
        <div className="p-6 px-10 rounded-[2.5rem] bg-slate-900 border-b-8 border-teal-500 text-right shadow-2xl relative overflow-hidden group">
          <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1 relative z-10">
            Total Service Fee Revenue
          </p>
          <h2 className="text-4xl font-black text-white italic tracking-tighter relative z-10">
            Rp {allocations?.gross?.toLocaleString("id-ID")}
          </h2>
          <TrendingUp
            className="absolute right-2 bottom-2 text-white/5"
            size={80}
          />
        </div>
      </div>

      {/* SMART SPLITTER CONFIG */}
      {showConfig && (
        <div
          className={`p-8 rounded-[2.5rem] border-2 border-orange-500/30 ${theme?.card} animate-in zoom-in-95 shadow-2xl mb-10 mx-2`}
        >
          <h3 className={`text-sm font-black uppercase mb-6 ${theme?.text}`}>
            Smart Splitter Protocol
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {Object.entries(config).map(([key, val]) => (
              <div key={key}>
                <label
                  className={`text-[10px] font-black uppercase ${theme?.subText} mb-2 block`}
                >
                  {key.replace("p_", "").toUpperCase()} (%)
                </label>
                <input
                  type="number"
                  value={val}
                  onChange={(e) =>
                    setConfig({ ...config, [key]: Number(e.target.value) })
                  }
                  className={`w-full p-4 rounded-xl border ${theme?.border} ${theme?.card} font-black text-teal-500 outline-none focus:ring-2 focus:ring-orange-500`}
                />
              </div>
            ))}
          </div>
          <button className="mt-8 w-full bg-orange-500 text-white p-5 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all">
            <Save size={18} /> Update Allocation Protocol
          </button>
        </div>
      )}

      {!showTaxReport ? (
        <>
          {/* WEEKLY REVENUE CHART */}
          <div
            className={`mx-2 p-8 rounded-[3rem] border ${theme?.border} ${theme?.card} shadow-xl relative overflow-hidden`}
          >
            <div className="flex justify-between items-center mb-10 relative z-10 text-left">
              <div>
                <h3
                  className={`text-sm font-black uppercase tracking-widest flex items-center gap-2 ${theme?.text}`}
                >
                  <TrendingUp className="text-teal-500" size={18} /> Revenue
                  Trends
                </h3>
                <p
                  className={`text-[9px] font-bold uppercase ${theme?.subText} mt-1`}
                >
                  Top Up & Order Fee (7 Days)
                </p>
              </div>
            </div>
            <div className="flex items-end justify-between h-40 gap-2 relative z-10">
              {weeklyStats.map((stat, idx) => (
                <div
                  key={idx}
                  className="flex-1 flex flex-col items-center group"
                >
                  <div className="mb-2 opacity-0 group-hover:opacity-100 transition-all">
                    <span className="text-[8px] font-black bg-slate-900 text-white px-2 py-1 rounded">
                      Rp{stat.value.toLocaleString()}
                    </span>
                  </div>
                  <div
                    className="w-full max-w-[40px] bg-teal-500/20 hover:bg-teal-500 transition-all duration-700 rounded-t-xl relative group"
                    style={{
                      height: `${(stat.value / maxWeekly) * 100}%`,
                      minHeight: "4px",
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-teal-600/50 to-transparent opacity-0 group-hover:opacity-100 transition-all rounded-t-xl"></div>
                  </div>
                  <p
                    className={`text-[9px] font-black uppercase mt-4 ${theme?.subText}`}
                  >
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* BUCKETS GRID */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 px-2">
            <div
              className={`${theme?.card} p-7 rounded-[2.5rem] border ${theme?.border} flex flex-col justify-between h-56 relative shadow-md group text-left transition-all hover:border-blue-500/50`}
            >
              <div className="flex justify-between items-start">
                <ShieldCheck className="text-blue-500" size={24} />
                <span
                  className={`text-[7px] font-black px-2 py-1 rounded-lg ${allocations?.gross >= 500000000 ? "bg-red-500" : "bg-blue-500"} text-white uppercase`}
                >
                  Tax Active
                </span>
              </div>
              <div className="mt-2">
                <p
                  className={`text-[9px] font-black uppercase ${theme?.subText} mb-0.5`}
                >
                  PPh (0.5%)
                </p>
                <h3 className={`text-lg font-black ${theme?.text}`}>
                  Rp {allocations?.tax?.toLocaleString()}
                </h3>
                <button className="mt-2 w-full py-1.5 bg-blue-600 text-white text-[8px] font-black uppercase rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                  Report & Pay
                </button>
              </div>
            </div>
            <MiniBucket
              title="CSR"
              category="csr"
              percent={config.p_csr}
              amount={allocations?.csr}
              icon={<Heart size={20} />}
              color="text-pink-400"
              theme={theme}
              onWithdraw={openWithdrawModal}
            />
            <MiniBucket
              title="System"
              category="maintenance"
              percent={config.p_sys}
              amount={allocations?.maintenance}
              icon={<Settings size={20} />}
              color="text-slate-400"
              theme={theme}
              onWithdraw={openWithdrawModal}
            />
            <MiniBucket
              title="Promo"
              category="promo"
              percent={config.p_mkt}
              amount={allocations?.promo}
              icon={<BadgePercent size={20} />}
              color="text-orange-400"
              theme={theme}
              onWithdraw={openWithdrawModal}
            />
            <MiniBucket
              title="Emergency"
              category="emergency"
              percent={config.p_emg}
              amount={allocations?.emergency}
              icon={<ArrowUpRight size={20} />}
              color="text-red-400"
              theme={theme}
              onWithdraw={openWithdrawModal}
            />
            <MiniBucket
              title="NET PROFIT"
              category="net"
              percent={
                100 -
                (config.p_csr + config.p_sys + config.p_mkt + config.p_emg)
              }
              amount={allocations?.net}
              icon={<Coins size={20} />}
              color="text-white"
              highlight
              theme={theme}
              onWithdraw={openWithdrawModal}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 px-2">
            {/* SETTLEMENT QUEUE */}
            <div className="lg:col-span-7">
              <div
                className={`${theme?.card} rounded-[3rem] p-8 border ${theme?.border} shadow-xl text-left`}
              >
                <h3
                  className={`text-sm font-black uppercase tracking-widest mb-10 flex items-center gap-3 ${theme?.text}`}
                >
                  <ArrowDownLeft className="text-red-500" size={16} /> Payout
                  Requests
                </h3>
                <div className="overflow-x-auto no-scrollbar">
                  <table className="w-full text-left">
                    <thead>
                      <tr
                        className={`text-[10px] font-black uppercase border-b ${theme?.border} ${theme?.subText}`}
                      >
                        <th className="pb-5 px-4">Entity ID</th>
                        <th className="pb-5 px-4 text-right">Amount</th>
                        <th className="pb-5 px-4 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className={`text-xs font-bold ${theme?.text}`}>
                      {payouts.map((p) => (
                        <tr
                          key={p.id}
                          className="border-b border-slate-500/5 hover:bg-slate-500/5 transition-all"
                        >
                          <td className="py-6 px-4 uppercase font-black text-left">
                            ID:{p.wallets?.owner_id?.slice(0, 8)}
                            <br />
                            <span className="text-[8px] text-teal-500 tracking-widest font-mono uppercase">
                              {p.bank_name || "BCA"} • {p.account_number}
                            </span>
                          </td>
                          <td className="py-6 px-4 text-right font-black tracking-tighter italic">
                            Rp {p.amount?.toLocaleString()}
                          </td>
                          <td className="py-6 px-4 text-center">
                            {p.status === "REQUESTED" ? (
                              <button
                                disabled={actionLoading}
                                onClick={() => handleApprovePayout(p)}
                                className="bg-teal-500 text-slate-900 px-6 py-2 rounded-2xl text-[9px] font-black uppercase transition-all flex items-center gap-2 mx-auto active:scale-90"
                              >
                                {actionLoading ? (
                                  <Loader2 className="animate-spin" size={12} />
                                ) : (
                                  <ArrowUpRight size={14} />
                                )}{" "}
                                Pay
                              </button>
                            ) : (
                              <span className="text-teal-500 text-[10px] font-black italic">
                                SETTLED
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* LEDGER PREVIEW */}
            <div className="lg:col-span-5">
              <div className="bg-slate-900 rounded-[3rem] p-8 text-white h-full shadow-2xl relative overflow-hidden flex flex-col text-left">
                <div className="flex justify-between items-center mb-8 relative z-10">
                  <div>
                    <h3 className="text-[11px] font-black uppercase text-teal-400 tracking-[0.2em] italic">
                      General Ledger Pro
                    </h3>
                    <p className="text-[7px] text-white/30 font-bold uppercase mt-1 tracking-widest">
                      Platform Cash Flow Monitor
                    </p>
                  </div>
                  <span className="text-[8px] bg-teal-500/10 text-teal-500 px-2 py-1 rounded border border-teal-500/20 font-black uppercase">
                    LIVE SYNC
                  </span>
                </div>
                <div className="flex-1 overflow-y-auto no-scrollbar relative z-10 max-h-[400px]">
                  <table className="w-full text-[10px]">
                    <thead className="border-b border-white/10 text-white/30 uppercase font-black">
                      <tr>
                        <th className="pb-4 text-left">Entry</th>
                        <th className="pb-4 text-right">Debit</th>
                        <th className="pb-4 text-right">Credit</th>
                      </tr>
                    </thead>
                    <tbody className="font-bold divide-y divide-white/5">
                      {transactions.map((t) => (
                        <tr
                          key={t.id}
                          className="hover:bg-white/5 transition-all"
                        >
                          <td className="py-4">
                            <p className="text-white/90 uppercase tracking-tighter text-[9px]">
                              {t.type?.replace(/_/g, " ")}
                            </p>
                            <p className="text-[7px] text-teal-500 font-black uppercase tracking-widest truncate max-w-[150px] italic">
                              {t.description}
                            </p>
                          </td>
                          <td className="py-4 text-right text-teal-400 font-black italic">
                            {t.debit > 0 ? `+${t.debit.toLocaleString()}` : "-"}
                          </td>
                          <td className="py-4 text-right text-red-400 font-black italic">
                            {t.credit > 0
                              ? `-${t.credit.toLocaleString()}`
                              : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-8 pt-6 border-t border-white/10 relative z-10">
                  <div className="flex justify-between items-end">
                    <div>
                      <span className="text-[9px] font-black uppercase text-white/40 tracking-[0.2em]">
                        Total Liquidity
                      </span>
                      <p className="text-[7px] text-teal-500 font-bold uppercase mt-1">
                        Ready for Disbursement
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-black text-teal-400 italic tracking-tighter leading-none">
                        Rp {platformLiquidity.toLocaleString("id-ID")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* TAX REPORT VIEW */
        <div className="animate-in slide-in-from-right-10 duration-500 px-2 text-left">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <TaxSummaryCard
              title="DPP (Dasar Pengenaan Pajak)"
              amount={allocations?.dpp}
              color="text-teal-500"
              theme={theme}
            />
            <TaxSummaryCard
              title="Omzet Thn Ini"
              amount={allocations?.gross}
              color="text-blue-500"
              theme={theme}
            />
            <TaxSummaryCard
              title="Total Pajak Terhutang"
              amount={allocations?.tax}
              color="text-orange-500"
              theme={theme}
            />
            <div
              className={`${theme?.card} p-8 rounded-[2.5rem] border ${theme?.border} flex flex-col justify-center items-center text-center shadow-xl`}
            >
              <ShieldCheck className="text-teal-500 mb-2" size={32} />
              <p className="text-[10px] font-black uppercase text-teal-500 tracking-widest">
                Compliance OK
              </p>
              <p
                className={`text-[8px] ${theme?.subText} mt-1 font-bold italic`}
              >
                Reset: {new Date(lastTaxReset!).toLocaleDateString("id-ID")}
              </p>
            </div>
          </div>
          <div
            className={`${theme?.card} rounded-[3rem] p-10 border ${theme?.border} shadow-2xl`}
          >
            <div className="flex justify-between items-center mb-10">
              <h3
                className={`text-sm font-black uppercase tracking-widest ${theme?.text}`}
              >
                Tax Ledger History
              </h3>
              <button className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-teal-500 transition-all shadow-lg">
                <Download size={14} /> Export e-Faktur
              </button>
            </div>
            <table className="w-full text-left">
              <thead
                className={`text-[10px] font-black uppercase border-b ${theme?.border} ${theme?.subText}`}
              >
                <tr>
                  <th className="pb-5 px-4">Date</th>
                  <th className="pb-5 px-4 text-right">DPP</th>
                  <th className="pb-5 px-4 text-right text-teal-500">
                    PPN (11%)
                  </th>
                  <th className="pb-5 px-4 text-right text-orange-500">
                    PPh (0.5%)
                  </th>
                </tr>
              </thead>
              <tbody className={`text-xs font-bold ${theme?.text}`}>
                {taxLog.map((log: any) => (
                  <tr
                    key={log.id}
                    className={`border-b ${isDark ? "border-white/5" : "border-slate-50"} hover:bg-slate-500/5`}
                  >
                    <td className="py-6 px-4">
                      {new Date(log.transaction_date).toLocaleDateString(
                        "id-ID",
                      )}
                    </td>
                    <td className="py-6 px-4 text-right">
                      Rp {log.dpp_amount?.toLocaleString()}
                    </td>
                    <td className="py-6 px-4 text-right">
                      Rp {log.ppn_collected?.toLocaleString()}
                    </td>
                    <td className="py-6 px-4 text-right text-orange-500">
                      Rp {log.pph_provision?.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

const MiniBucket = ({
  title,
  category,
  percent,
  amount,
  icon,
  color,
  highlight,
  theme,
  onWithdraw,
}: any) => {
  const isDark = theme?.bg?.includes("#0b0f19");
  return (
    <div
      className={`${highlight ? "bg-teal-600 text-white shadow-teal-500/40 shadow-xl" : theme?.card || "bg-white"} p-7 rounded-[2.5rem] border ${theme?.border || "border-slate-100"} shadow-md flex flex-col justify-between h-56 transition-all hover:scale-[1.02] group relative overflow-hidden text-left`}
    >
      <div className="flex justify-between items-start relative z-10">
        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center ${highlight ? "bg-white/20" : isDark ? "bg-white/5" : "bg-slate-50"} ${color} shadow-inner`}
        >
          {icon}
        </div>
        <div
          className={`text-[8px] font-black px-2 py-1 rounded-md border ${highlight ? "bg-white/20 border-white/30 text-white" : "bg-slate-500/5 border-slate-500/10 text-slate-500"} uppercase`}
        >
          {percent}%
        </div>
      </div>
      <div className="mt-4 relative z-10">
        <p
          className={`text-[10px] font-black uppercase tracking-widest mb-1 ${highlight ? "text-white/60" : theme?.subText || "text-slate-400"}`}
        >
          {title}
        </p>
        <div className="flex justify-between items-end">
          <h3
            className={`text-xl font-black ${highlight ? "text-white" : theme?.text || "text-slate-900"}`}
          >
            Rp {amount?.toLocaleString() || 0}
          </h3>
          <button
            onClick={() => onWithdraw(category, amount)}
            className={`opacity-0 group-hover:opacity-100 transition-all p-3 rounded-xl ${highlight ? "bg-white text-teal-600" : "bg-red-500 text-white"} shadow-lg active:scale-90`}
          >
            <LogOut size={16} className="rotate-90" />
          </button>
        </div>
      </div>
      {highlight && (
        <Coins
          className="absolute -bottom-4 -right-4 text-white/10"
          size={100}
        />
      )}
    </div>
  );
};

const TaxSummaryCard = ({ title, amount, color, theme }: any) => (
  <div
    className={`${theme.card} p-10 rounded-[2.5rem] border ${theme.border} shadow-xl text-left transition-all hover:border-teal-500/50`}
  >
    <p
      className={`text-[9px] font-black ${theme.subText} uppercase tracking-widest mb-3`}
    >
      {title}
    </p>
    <h3 className={`text-2xl font-black ${color}`}>
      Rp {amount?.toLocaleString("id-ID", { maximumFractionDigits: 0 })}
    </h3>
  </div>
);
