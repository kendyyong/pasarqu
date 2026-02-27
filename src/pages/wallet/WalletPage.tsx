import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import {
  ArrowLeft,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  XCircle,
  Building2,
  CreditCard,
  Loader2,
  Landmark,
  History,
  FileText,
} from "lucide-react";
import { MobileLayout } from "../../components/layout/MobileLayout";

export const WalletPage = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [balance, setBalance] = useState(0);
  const [logs, setLogs] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"history" | "withdrawals">(
    "history",
  );

  // State Form Tarik Tunai
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [amount, setAmount] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchWalletData = useCallback(async () => {
    if (!user?.id) return;
    try {
      // 1. Ambil Saldo Utama
      const { data: profile } = await supabase
        .from("profiles")
        .select("balance")
        .eq("id", user.id)
        .single();
      if (profile) setBalance(profile.balance || 0);

      // 2. Ambil Riwayat Transaksi (Uang Masuk/Keluar)
      const { data: logData } = await supabase
        .from("wallet_logs")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);
      if (logData) setLogs(logData);

      // 3. Ambil Riwayat Penarikan
      const { data: wdData } = await supabase
        .from("withdrawals")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (wdData) setWithdrawals(wdData);
    } catch (err: any) {
      console.error("Wallet Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchWalletData();
  }, [fetchWalletData]);

  const handleWithdrawRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    const wdAmount = Number(amount.replace(/\D/g, ""));

    if (wdAmount < 50000)
      return showToast("Minimal penarikan Rp 50.000", "error");
    if (wdAmount > balance)
      return showToast("Saldo Anda tidak mencukupi!", "error");
    if (!bankName || !accountNumber || !accountName)
      return showToast("Lengkapi data rekening bank", "error");

    setIsSubmitting(true);
    try {
      // 1. Buat Request Penarikan (Status PENDING)
      const { error: wdError } = await supabase.from("withdrawals").insert({
        user_id: user?.id,
        amount: wdAmount,
        bank_name: bankName,
        account_number: accountNumber,
        account_name: accountName,
        status: "PENDING",
      });
      if (wdError) throw wdError;

      // 2. Potong Saldo (Kita anggap saldo dipotong saat request dibuat)
      const newBalance = balance - wdAmount;
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ balance: newBalance })
        .eq("id", user?.id);
      if (updateError) throw updateError;

      // 3. Catat di Log
      await supabase.from("wallet_logs").insert({
        user_id: user?.id,
        type: "WITHDRAW",
        amount: wdAmount,
        balance_after: newBalance,
        description: `Penarikan Dana ke ${bankName} (${accountNumber})`,
      });

      showToast("Permintaan penarikan dana berhasil dikirim!", "success");
      setShowWithdrawModal(false);
      setAmount("");
      setBankName("");
      setAccountNumber("");
      setAccountName("");
      fetchWalletData(); // Refresh data
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "text-green-600 bg-green-100";
      case "REJECTED":
        return "text-red-600 bg-red-100";
      default:
        return "text-orange-600 bg-orange-100";
    }
  };

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-[#008080]" size={40} />
      </div>
    );

  return (
    <MobileLayout
      activeTab="account"
      onTabChange={() => {}}
      onSearch={() => {}}
      onCartClick={() => {}}
      cartCount={0}
    >
      <div className="min-h-screen bg-[#F8FAFC] pb-24 font-black uppercase text-left tracking-tighter">
        {/* HEADER */}
        <header className="sticky top-0 z-50 h-16 flex items-center px-4 bg-[#008080] text-white shadow-md">
          <button
            onClick={() => navigate(-1)}
            className="p-2 mr-3 hover:bg-white/10 rounded-md transition-all"
          >
            <ArrowLeft size={24} strokeWidth={3} />
          </button>
          <div>
            <span className="text-[14px] font-[1000] block leading-none">
              DOMPET PENDAPATAN
            </span>
          </div>
        </header>

        <main className="p-4 max-w-lg mx-auto space-y-6 mt-4">
          {/* KARTU SALDO GAHAR */}
          <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-2xl"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 text-slate-300 mb-2">
                <Wallet size={18} />
                <span className="text-[11px] tracking-widest">SALDO AKTIF</span>
              </div>
              <h1 className="text-4xl font-sans font-[1000] tracking-tighter text-[#FF6600]">
                RP {balance.toLocaleString("id-ID")}
              </h1>

              <button
                onClick={() => setShowWithdrawModal(true)}
                className="mt-6 w-full py-4 bg-[#FF6600] hover:bg-orange-600 rounded-xl flex items-center justify-center gap-2 text-[12px] shadow-lg active:scale-95 transition-all"
              >
                <Landmark size={18} /> TARIK TUNAI SEKARANG
              </button>
            </div>
          </div>

          {/* TABS NAVIGATION */}
          <div className="flex bg-slate-200 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab("history")}
              className={`flex-1 py-3 text-[11px] rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === "history" ? "bg-white text-[#008080] shadow-sm" : "text-slate-500"}`}
            >
              <History size={16} /> RIWAYAT SALDO
            </button>
            <button
              onClick={() => setActiveTab("withdrawals")}
              className={`flex-1 py-3 text-[11px] rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === "withdrawals" ? "bg-white text-[#008080] shadow-sm" : "text-slate-500"}`}
            >
              <FileText size={16} /> STATUS PENARIKAN
            </button>
          </div>

          {/* KONTEN TABS */}
          <div className="space-y-3">
            {activeTab === "history" &&
              (logs.length === 0 ? (
                <div className="text-center py-10 text-slate-400 bg-white rounded-xl border border-slate-200">
                  <History size={32} className="mx-auto mb-2 opacity-50" />{" "}
                  BELUM ADA TRANSAKSI
                </div>
              ) : (
                logs.map((log) => {
                  const isIncome = [
                    "IN",
                    "EARNING",
                    "CASHBACK",
                    "COMMISSION",
                    "TOPUP",
                  ].includes(log.type);
                  return (
                    <div
                      key={log.id}
                      className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4"
                    >
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isIncome ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}
                      >
                        {isIncome ? (
                          <ArrowDownRight size={20} />
                        ) : (
                          <ArrowUpRight size={20} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] text-slate-800 truncate mb-0.5">
                          {log.description || log.type}
                        </p>
                        <p className="text-[9px] text-slate-400 font-sans">
                          {new Date(log.created_at).toLocaleString("id-ID")}
                        </p>
                      </div>
                      <div
                        className={`text-[14px] font-sans font-[1000] ${isIncome ? "text-green-600" : "text-red-600"}`}
                      >
                        {isIncome ? "+" : "-"}RP {log.amount?.toLocaleString()}
                      </div>
                    </div>
                  );
                })
              ))}

            {activeTab === "withdrawals" &&
              (withdrawals.length === 0 ? (
                <div className="text-center py-10 text-slate-400 bg-white rounded-xl border border-slate-200">
                  <Landmark size={32} className="mx-auto mb-2 opacity-50" />{" "}
                  BELUM ADA PENARIKAN
                </div>
              ) : (
                withdrawals.map((wd) => (
                  <div
                    key={wd.id}
                    className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm"
                  >
                    <div className="flex justify-between items-start mb-3 border-b border-slate-100 pb-3">
                      <div>
                        <p className="text-[12px] text-slate-900 mb-0.5">
                          {wd.bank_name}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          {wd.account_number} a/n {wd.account_name}
                        </p>
                      </div>
                      <div
                        className={`px-2 py-1 rounded-md text-[9px] font-black ${getStatusColor(wd.status)}`}
                      >
                        {wd.status}
                      </div>
                    </div>
                    <div className="flex justify-between items-end">
                      <span className="text-[9px] text-slate-400 flex items-center gap-1">
                        <Clock size={10} />{" "}
                        {new Date(wd.created_at).toLocaleDateString("id-ID")}
                      </span>
                      <span className="text-[16px] font-sans font-[1000] text-slate-900">
                        RP {wd.amount?.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))
              ))}
          </div>
        </main>

        {/* MODAL TARIK TUNAI */}
        {showWithdrawModal && (
          <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-sm flex items-end sm:items-center justify-center animate-in fade-in">
            <div className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-3xl p-6 pb-safe animate-in slide-in-from-bottom-10">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-[16px] font-black text-slate-900 flex items-center gap-2">
                  <Landmark className="text-[#008080]" /> FORM PENARIKAN
                </h3>
                <button
                  onClick={() => setShowWithdrawModal(false)}
                  className="text-slate-400 hover:text-red-500"
                >
                  <XCircle size={24} />
                </button>
              </div>

              <form onSubmit={handleWithdrawRequest} className="space-y-4">
                <div>
                  <label className="text-[10px] text-slate-500 mb-1 block">
                    NOMINAL PENARIKAN (MIN. 50.000)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-sans font-bold">
                      RP
                    </span>
                    <input
                      type="text"
                      required
                      value={amount}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "");
                        setAmount(
                          val ? parseInt(val).toLocaleString("id-ID") : "",
                        );
                      }}
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-200 rounded-xl text-[18px] font-sans font-[1000] text-slate-900 focus:border-[#FF6600] outline-none transition-all"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 mb-1 block">
                    NAMA BANK / E-WALLET
                  </label>
                  <div className="relative">
                    <Building2
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                      size={18}
                    />
                    <input
                      type="text"
                      required
                      value={bankName}
                      onChange={(e) =>
                        setBankName(e.target.value.toUpperCase())
                      }
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-[12px] outline-none focus:border-[#008080]"
                      placeholder="BCA / MANDIRI / DANA / GOPAY"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 mb-1 block">
                    NOMOR REKENING / NO HP
                  </label>
                  <div className="relative">
                    <CreditCard
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                      size={18}
                    />
                    <input
                      type="text"
                      required
                      value={accountNumber}
                      onChange={(e) =>
                        setAccountNumber(e.target.value.replace(/\D/g, ""))
                      }
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-[14px] font-sans outline-none focus:border-[#008080]"
                      placeholder="081234567890"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 mb-1 block">
                    NAMA PEMILIK REKENING
                  </label>
                  <input
                    type="text"
                    required
                    value={accountName}
                    onChange={(e) =>
                      setAccountName(e.target.value.toUpperCase())
                    }
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-[12px] outline-none focus:border-[#008080]"
                    placeholder="SESUAI NAMA DI BUKU TABUNGAN"
                  />
                </div>

                <button
                  disabled={isSubmitting}
                  type="submit"
                  className="w-full py-4 mt-2 bg-[#008080] text-white rounded-xl font-black text-[14px] flex justify-center items-center gap-2 shadow-lg active:scale-95 transition-all"
                >
                  {isSubmitting ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    "KIRIM PERMINTAAN CAIR"
                  )}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </MobileLayout>
  );
};

export default WalletPage;
