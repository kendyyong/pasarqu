import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { useAuth } from "../../../contexts/AuthContext";
import { useToast } from "../../../contexts/ToastContext";
import {
  Wallet,
  ArrowUpRight,
  History,
  TrendingUp,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Banknote,
  BadgePercent,
  X,
  CreditCard,
  ArrowRight,
  Lock,
  Clock,
} from "lucide-react";

// SUB-KOMPONEN STATS ITEM (Gahar & Solid)
const StatItem = ({
  label,
  value,
  icon,
  color,
  bg,
  isMinus,
  subLabel,
}: any) => (
  <div
    className={`${bg} border-2 border-slate-100 p-6 rounded-xl shadow-sm flex flex-col justify-between hover:border-[#008080] transition-colors group relative overflow-hidden`}
  >
    <div className="flex items-center justify-between mb-4 relative z-10">
      <p
        className={`text-[10px] font-black tracking-widest uppercase ${color.includes("white") ? "text-teal-100" : "text-slate-500"}`}
      >
        {label}
      </p>
      <div
        className={`p-2 rounded-md ${color.includes("white") ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500 group-hover:bg-teal-50 group-hover:text-[#008080]"} transition-colors`}
      >
        {icon}
      </div>
    </div>
    <div className="relative z-10">
      <p
        className={`text-2xl font-black tracking-tighter leading-none ${color}`}
      >
        {isMinus ? "- " : ""}RP {value.toLocaleString()}
      </p>
      {subLabel && (
        <p
          className={`text-[9px] font-bold mt-2 uppercase tracking-widest ${color.includes("white") ? "text-teal-200" : "text-slate-400"}`}
        >
          {subLabel}
        </p>
      )}
    </div>
    <div className="absolute -right-6 -bottom-6 opacity-5 pointer-events-none">
      {icon}
    </div>
  </div>
);

export const MerchantFinanceDashboard: React.FC<any> = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [merchantData, setMerchantData] = useState<any>(null);

  const [stats, setStats] = useState({
    total_gross_sales: 0,
    total_admin_fees: 0,
    total_net_sales: 0,
    pending_orders: 0,
    pending_balance: 0,
    admin_rate: 0,
  });

  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("ALL");

  const [showWDModal, setShowWDModal] = useState(false);
  const [wdAmount, setWdAmount] = useState<number | "">("");
  const [wdLoading, setWdLoading] = useState(false);
  const [wdForm, setWdForm] = useState({ bank: "BCA", accNo: "", accName: "" });

  const MIN_WITHDRAWAL = 50000;

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) throw profileError;
      if (!profile) return setLoading(false);
      setMerchantData(profile);

      if (!profile.merchant_id) return setLoading(false);

      // Ambil transaksi orders
      const { data: orders, error: ordersError } = await supabase
        .from("order_items")
        .select(
          `
          quantity, 
          price_at_purchase, 
          orders (status, shipping_status, seller_admin_fee_percent)
        `,
        )
        .eq("merchant_id", profile.merchant_id);

      if (ordersError) throw ordersError;

      if (orders && orders.length > 0) {
        let gross = 0;
        let fees = 0;
        let pendingCount = 0;
        let pendingBal = 0;

        // FIX: Ambil admin rate dari item pertama secara aman
        const firstOrderData: any = orders[0]?.orders;
        let currentAdminRate = firstOrderData?.seller_admin_fee_percent || 0;

        orders.forEach((item: any) => {
          const orderInfo = item.orders;
          if (!orderInfo) return;

          const itemTotal = item.quantity * item.price_at_purchase;
          const adminPercent = orderInfo.seller_admin_fee_percent || 0;
          const itemFee = (itemTotal * adminPercent) / 100;
          const netItem = itemTotal - itemFee;

          gross += itemTotal;
          fees += itemFee;

          if (
            orderInfo.status === "PAID" &&
            orderInfo.shipping_status !== "COMPLETED"
          ) {
            pendingCount++;
            pendingBal += netItem;
          }
        });

        setStats({
          total_gross_sales: gross,
          total_admin_fees: fees,
          total_net_sales: gross - fees,
          pending_orders: pendingCount,
          pending_balance: pendingBal,
          admin_rate: currentAdminRate,
        });
      }

      const { data: history } = await supabase
        .from("order_items")
        .select(
          `
          id, quantity, price_at_purchase, 
          products(name), 
          orders(id, created_at, shipping_status, seller_admin_fee_percent)
        `,
        )
        .eq("merchant_id", profile.merchant_id)
        .order("id", { ascending: false })
        .limit(30);

      setRecentOrders(history || []);
    } catch (err) {
      console.error("Merchant Finance Error:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRequestWD = async () => {
    const amountToWithdraw = Number(wdAmount);
    if (amountToWithdraw < MIN_WITHDRAWAL)
      return showToast(
        `MIN. TARIK RP ${MIN_WITHDRAWAL.toLocaleString()}`,
        "error",
      );
    if (amountToWithdraw > (merchantData?.wallet_balance || 0))
      return showToast("SALDO TIDAK MENCUKUPI!", "error");
    if (!wdForm.accNo || !wdForm.accName)
      return showToast("LENGKAPI DATA REKENING!", "error");

    setWdLoading(true);
    try {
      const { error: wdErr } = await supabase.from("payout_requests").insert({
        merchant_id: merchantData.merchant_id,
        amount: amountToWithdraw,
        bank_name: wdForm.bank,
        account_number: wdForm.accNo,
        account_name: wdForm.accName.toUpperCase(),
        status: "REQUESTED",
      });
      if (wdErr) throw wdErr;

      const { error: balanceErr } = await supabase.rpc("decrement_wallet", {
        user_id: user?.id,
        amount: amountToWithdraw,
      });
      if (balanceErr) throw balanceErr;

      showToast("PENCAIRAN DANA SEDANG DIPROSES!", "success");
      setShowWDModal(false);
      setWdAmount("");
      fetchData();
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setWdLoading(false);
    }
  };

  const filteredOrders = recentOrders.filter((item) => {
    const orderInfo = item.orders;
    if (!orderInfo) return false;
    if (activeTab === "ALL") return true;
    if (activeTab === "IN") return orderInfo.shipping_status === "COMPLETED";
    if (activeTab === "PENDING")
      return orderInfo.shipping_status !== "COMPLETED";
    return true;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 font-sans uppercase">
        <Loader2 className="animate-spin text-[#008080]" size={40} />
        <p className="text-[10px] font-black tracking-widest text-slate-400">
          MEMBUKA BRANKAS...
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-500 pb-20 text-left font-sans font-black uppercase tracking-tighter">
      {/* 1. HEADER & VAULT */}
      <div className="flex flex-col xl:flex-row gap-6">
        <div className="flex-1 bg-slate-900 rounded-xl text-white relative overflow-hidden shadow-xl flex flex-col md:flex-row border-b-8 border-[#FF6600]">
          <div className="p-6 md:p-8 flex-1 relative z-10 border-b md:border-b-0 md:border-r border-slate-700/50">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] tracking-[0.2em] text-slate-400 flex items-center gap-2">
                <CheckCircle2 size={12} className="text-[#008080]" /> SALDO
                AKTIF (BISA DITARIK)
              </p>
              <button
                onClick={fetchData}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-md transition-all active:scale-90"
              >
                <RefreshCw size={14} />
              </button>
            </div>
            <h2 className="text-4xl md:text-5xl text-[#008080] leading-none mb-6">
              RP{" "}
              {Number(merchantData?.wallet_balance || 0).toLocaleString(
                "id-ID",
              )}
            </h2>
            <button
              onClick={() => setShowWDModal(true)}
              className="w-full md:w-auto px-8 py-3.5 bg-[#FF6600] hover:bg-orange-600 text-white text-[11px] tracking-widest rounded-md transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
            >
              <ArrowUpRight size={16} /> TARIK SALDO KE REKENING
            </button>
          </div>

          <div className="p-6 md:p-8 md:w-[35%] relative z-10 bg-white/5 flex flex-col justify-center">
            <p className="text-[10px] tracking-[0.2em] text-slate-400 flex items-center gap-2 mb-2">
              <Clock size={12} className="text-orange-500" /> DANA DALAM PROSES
            </p>
            <h3 className="text-2xl text-slate-200 leading-none mb-1">
              RP {stats.pending_balance.toLocaleString("id-ID")}
            </h3>
            <p className="text-[9px] text-slate-500 tracking-widest normal-case font-bold">
              Dari {stats.pending_orders} pesanan tertunda.
            </p>
          </div>
          <Wallet
            size={200}
            className="absolute -left-10 -bottom-10 text-white opacity-5 pointer-events-none"
          />
        </div>

        <div className="xl:w-[350px] bg-slate-800 p-6 rounded-xl shadow-xl relative overflow-hidden border border-slate-700 flex flex-col justify-between">
          <div className="relative z-10 flex justify-between items-start mb-6">
            <div className="w-12 h-8 bg-amber-400/80 rounded-md opacity-80 shadow-inner"></div>
            <p className="text-[10px] text-slate-400 tracking-widest flex items-center gap-1">
              <Lock size={10} /> REKENING PENCAIRAN
            </p>
          </div>
          <div className="relative z-10 space-y-1">
            <h4 className="text-[18px] text-white tracking-[0.2em] font-mono">
              **** **** 1234
            </h4>
            <p className="text-[11px] text-slate-300">
              BANK BCA • A.N JURAGAN PASAR
            </p>
          </div>
          <button className="relative z-10 mt-6 text-[9px] bg-white/10 hover:bg-white/20 text-white py-2 px-4 rounded-md tracking-widest flex items-center justify-center gap-2 transition-all border border-white/5">
            UBAH DATA REKENING <ArrowRight size={12} />
          </button>
          <CreditCard
            size={150}
            className="absolute -right-10 -bottom-10 text-white opacity-5 pointer-events-none rotate-12"
          />
        </div>
      </div>

      {/* 2. STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatItem
          label="OMZET KOTOR (GROSS)"
          value={stats.total_gross_sales}
          icon={<TrendingUp size={20} />}
          color="text-slate-800"
          bg="bg-white"
          subLabel="Total nilai barang terjual"
        />
        <StatItem
          label={`BIAYA APLIKASI (${stats.admin_rate}%)`}
          value={stats.total_admin_fees}
          icon={<BadgePercent size={20} />}
          color="text-red-500"
          bg="bg-red-50/50"
          isMinus={true}
          subLabel="Potongan sistem otomatis"
        />
        <StatItem
          label="PENDAPATAN BERSIH (NET)"
          value={stats.total_net_sales}
          icon={<CheckCircle2 size={20} />}
          color="text-white"
          bg="bg-[#008080]"
          subLabel="Uang murni milik toko"
        />
      </div>

      {/* 3. LOG TRANSAKSI */}
      <div className="bg-white border-2 border-slate-100 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 md:p-6 border-b-2 border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="text-[14px] text-slate-800 flex items-center gap-2">
            <History size={18} className="text-[#008080]" /> MUTASI REKENING
            (AUTO)
          </h3>
          <div className="flex bg-slate-50 border border-slate-200 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab("ALL")}
              className={`px-4 py-2 text-[9px] rounded-md transition-all ${activeTab === "ALL" ? "bg-slate-800 text-white shadow-sm" : "text-slate-500"}`}
            >
              SEMUA
            </button>
            <button
              onClick={() => setActiveTab("IN")}
              className={`px-4 py-2 text-[9px] rounded-md transition-all ${activeTab === "IN" ? "bg-[#008080] text-white shadow-sm" : "text-slate-500"}`}
            >
              UANG MASUK
            </button>
            <button
              onClick={() => setActiveTab("PENDING")}
              className={`px-4 py-2 text-[9px] rounded-md transition-all ${activeTab === "PENDING" ? "bg-orange-500 text-white shadow-sm" : "text-slate-500"}`}
            >
              TERTAHAN
            </button>
          </div>
        </div>

        <div className="divide-y-2 divide-slate-50 max-h-[400px] overflow-y-auto no-scrollbar">
          {filteredOrders.length > 0 ? (
            filteredOrders.map((item: any) => {
              const orderInfo = item.orders;
              if (!orderInfo) return null;

              const itemTotal = item.quantity * item.price_at_purchase;
              const adminPercent = orderInfo.seller_admin_fee_percent || 0;
              const netAmount = itemTotal - (itemTotal * adminPercent) / 100;
              const isDone = orderInfo.shipping_status === "COMPLETED";

              return (
                <div
                  key={item.id}
                  className="p-4 md:p-6 flex items-center justify-between hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-10 h-10 rounded-md flex items-center justify-center shrink-0 border ${isDone ? "bg-teal-50 border-teal-200 text-[#008080]" : "bg-orange-50 border-orange-200 text-orange-500"}`}
                    >
                      {isDone ? <Banknote size={18} /> : <Clock size={18} />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[12px] text-slate-800 leading-none truncate max-w-[150px] md:max-w-xs mb-1">
                        {item.products?.name || "Produk Umum"}
                      </p>
                      <p className="text-[9px] text-slate-400 tracking-widest flex items-center gap-2">
                        {item.quantity} UNIT{" "}
                        <span className="text-slate-200">•</span>{" "}
                        {new Date(orderInfo.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p
                      className={`text-[14px] leading-none ${isDone ? "text-[#008080]" : "text-orange-500"}`}
                    >
                      + RP {netAmount.toLocaleString()}
                    </p>
                    <div
                      className={`mt-1.5 inline-block px-2 py-0.5 rounded-sm border text-[8px] tracking-widest ${isDone ? "bg-teal-50 border-teal-200 text-teal-600" : "bg-orange-50 border-orange-200 text-orange-600"}`}
                    >
                      {isDone ? "MASUK SALDO" : "DITAHAN"}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-20 text-center flex flex-col items-center gap-3">
              <History size={32} className="text-slate-200" />
              <p className="text-slate-400 text-[10px] tracking-widest">
                TIDAK ADA DATA TRANSAKSI
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 4. MODAL WD */}
      {showWDModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-xl p-8 relative shadow-2xl border-t-8 border-[#FF6600]">
            <button
              onClick={() => setShowWDModal(false)}
              className="absolute top-4 right-4 p-2 bg-slate-100 text-slate-500 hover:bg-red-500 hover:text-white rounded-md transition-colors"
            >
              <X size={16} />
            </button>
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-orange-50 text-[#FF6600] rounded-md flex items-center justify-center mx-auto mb-3 border border-orange-200 shadow-sm">
                <ArrowUpRight size={24} />
              </div>
              <h2 className="text-xl text-slate-900 leading-none">
                PENCAIRAN DANA
              </h2>
              <p className="text-[10px] text-slate-400 mt-2 tracking-widest">
                SALDO AKTIF:{" "}
                <span className="text-[#008080]">
                  RP {(merchantData?.wallet_balance || 0).toLocaleString()}
                </span>
              </p>
            </div>
            <div className="space-y-4">
              <div className="space-y-1">
                <div className="flex justify-between items-end">
                  <label className="text-[9px] text-slate-400 tracking-widest">
                    NOMINAL PENARIKAN
                  </label>
                  <button
                    onClick={() =>
                      setWdAmount(merchantData?.wallet_balance || 0)
                    }
                    className="text-[9px] text-[#008080] hover:underline"
                  >
                    TARIK SEMUA
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    RP
                  </span>
                  <input
                    type="number"
                    placeholder="0"
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-md outline-none focus:border-[#008080] text-[14px] transition-all font-black"
                    value={wdAmount}
                    onChange={(e) => setWdAmount(Number(e.target.value))}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] text-slate-400 tracking-widest">
                  BANK / E-WALLET
                </label>
                <select
                  className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-md outline-none focus:border-[#008080] text-[12px] cursor-pointer font-bold"
                  value={wdForm.bank}
                  onChange={(e) =>
                    setWdForm({ ...wdForm, bank: e.target.value })
                  }
                >
                  <option>BCA</option>
                  <option>MANDIRI</option>
                  <option>BNI</option>
                  <option>BRI</option>
                  <option>DANA</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] text-slate-400 tracking-widest">
                  NOMOR REKENING / HP
                </label>
                <input
                  type="text"
                  placeholder="1234567890"
                  className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-md outline-none focus:border-[#008080] text-[12px] font-bold"
                  value={wdForm.accNo}
                  onChange={(e) =>
                    setWdForm({ ...wdForm, accNo: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] text-slate-400 tracking-widest">
                  NAMA PEMILIK
                </label>
                <input
                  type="text"
                  placeholder="JONATHAN DOE"
                  className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-md outline-none focus:border-[#008080] text-[12px] font-bold uppercase"
                  value={wdForm.accName}
                  onChange={(e) =>
                    setWdForm({
                      ...wdForm,
                      accName: e.target.value.toUpperCase(),
                    })
                  }
                />
              </div>
              <button
                disabled={
                  wdLoading || !wdAmount || Number(wdAmount) < MIN_WITHDRAWAL
                }
                onClick={handleRequestWD}
                className="w-full py-4 mt-2 bg-[#FF6600] text-white text-[11px] tracking-widest rounded-md hover:bg-orange-700 shadow-md flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:bg-slate-300"
              >
                {wdLoading ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <CheckCircle2 size={16} />
                )}
                KONFIRMASI PENARIKAN
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
