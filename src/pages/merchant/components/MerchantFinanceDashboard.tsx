import React, { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { useAuth } from "../../../contexts/AuthContext";
import { useToast } from "../../../contexts/ToastContext";
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  History,
  TrendingUp,
  Store,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Banknote,
  BadgePercent,
  Info,
  X,
  Building,
  CreditCard,
  ChevronRight,
  ArrowRight,
} from "lucide-react";

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
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  // STATE MODAL WITHDRAWAL
  const [showWDModal, setShowWDModal] = useState(false);
  const [wdAmount, setWdAmount] = useState<number>(0);
  const [wdLoading, setWdLoading] = useState(false);
  const [wdForm, setWdForm] = useState({
    bank: "BCA",
    accNo: "",
    accName: "",
  });

  const MIN_WITHDRAWAL = 50000;

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) throw profileError;

      if (!profile) {
        setLoading(false);
        return;
      }

      setMerchantData(profile);
      setWdAmount(profile.wallet_balance || 0);

      if (!profile.merchant_id) {
        setStats({
          total_gross_sales: 0,
          total_admin_fees: 0,
          total_net_sales: 0,
          pending_orders: 0,
        });
        setRecentOrders([]);
        setLoading(false);
        return;
      }

      // Ambil transaksi orders
      const { data: orders, error: ordersError } = await supabase
        .from("order_items")
        .select(
          `quantity, price_at_purchase, orders!inner(status, shipping_status, seller_admin_fee_percent)`,
        )
        .eq("merchant_id", profile.merchant_id);

      if (ordersError) throw ordersError;

      if (orders && orders.length > 0) {
        let gross = 0;
        let fees = 0;
        let pending = 0;

        orders.forEach((item: any) => {
          const itemTotal = item.quantity * item.price_at_purchase;
          const adminPercent = item.orders?.seller_admin_fee_percent || 0;
          const itemFee = (itemTotal * adminPercent) / 100;
          gross += itemTotal;
          fees += itemFee;
          if (
            item.orders?.status === "PAID" &&
            item.orders?.shipping_status !== "COMPLETED"
          ) {
            pending++;
          }
        });

        setStats({
          total_gross_sales: gross,
          total_admin_fees: fees,
          total_net_sales: gross - fees,
          pending_orders: pending,
        });
      }

      // Ambil History
      const { data: history } = await supabase
        .from("order_items")
        .select(
          `id, quantity, price_at_purchase, products(name), orders!inner(id, created_at, shipping_status, seller_admin_fee_percent)`,
        )
        .eq("merchant_id", profile.merchant_id)
        .order("id", { ascending: false })
        .limit(10);

      setRecentOrders(history || []);
    } catch (err) {
      console.error("Merchant Finance Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleRequestWD = async () => {
    if (!wdForm.accNo || !wdForm.accName) {
      showToast("LENGKAPI DATA REKENING!", "error");
      return;
    }
    setWdLoading(true);
    try {
      const { error: wdErr } = await supabase.from("payout_requests").insert({
        merchant_id: merchantData.merchant_id,
        amount: wdAmount,
        bank_name: wdForm.bank,
        account_number: wdForm.accNo,
        account_name: wdForm.accName,
        status: "REQUESTED",
      });
      if (wdErr) throw wdErr;

      const { error: balanceErr } = await supabase.rpc("decrement_wallet", {
        user_id: user?.id,
        amount: wdAmount,
      });
      if (balanceErr) throw balanceErr;

      showToast("PENCAIRAN DANA SEDANG DIPROSES!", "success");
      setShowWDModal(false);
      fetchData();
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setWdLoading(false);
    }
  };

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 font-sans uppercase">
        <Loader2 className="animate-spin text-[#008080]" size={40} />
        <p className="text-[10px] font-bold tracking-widest text-slate-400">
          Memuat Data Keuangan...
        </p>
      </div>
    );

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-500 pb-20 text-left font-sans">
      {/* 1. HEADER & SALDO UTAMA */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* CARD SALDO ELEGAN */}
        <div className="flex-1 bg-[#008080] p-8 rounded-[2rem] text-white relative overflow-hidden shadow-xl shadow-teal-900/10">
          <div className="absolute -right-10 -top-10 opacity-10 rotate-12">
            <Wallet size={200} />
          </div>
          <div className="relative z-10">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-teal-200/80">
              Saldo Dompet Anda
            </p>
            <h2 className="text-3xl md:text-4xl font-black mt-2 tracking-tighter leading-none">
              RP{" "}
              {Number(merchantData?.wallet_balance || 0).toLocaleString(
                "id-ID",
              )}
            </h2>
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                onClick={() => {
                  if ((merchantData?.wallet_balance || 0) < MIN_WITHDRAWAL) {
                    showToast(
                      `MINIMAL PENARIKAN RP ${MIN_WITHDRAWAL.toLocaleString()}`,
                      "info",
                    );
                    return;
                  }
                  setShowWDModal(true);
                }}
                className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white text-[11px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg active:scale-95 flex items-center gap-2"
              >
                <ArrowUpRight size={16} /> Tarik Dana
              </button>
              <button
                onClick={fetchData}
                className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-xl border border-white/10 transition-all"
              >
                <RefreshCw size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* INFO RINGKASAN REKENING */}
        <div className="md:w-80 bg-white border border-slate-200 p-6 rounded-[2rem] shadow-sm flex flex-col justify-center">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
            Tujuan Pencairan
          </p>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center">
              <Building size={24} />
            </div>
            <div>
              <h4 className="text-[14px] font-bold text-slate-800 uppercase leading-none">
                Data Rekening
              </h4>
              <p className="text-[11px] font-medium text-slate-400 mt-2 uppercase">
                Belum Diatur
              </p>
            </div>
          </div>
          <button className="mt-6 text-[10px] font-bold text-[#008080] uppercase tracking-widest flex items-center gap-2 hover:gap-3 transition-all">
            Lengkapi Data <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* 2. STATS GRID (MINIMALIST) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatItem
          label="Omzet Kotor"
          value={stats.total_gross_sales}
          icon={<TrendingUp size={20} />}
          color="text-slate-700"
          bg="bg-white"
        />
        <StatItem
          label="Biaya Admin"
          value={stats.total_admin_fees}
          icon={<BadgePercent size={20} />}
          color="text-orange-600"
          bg="bg-white"
          isMinus
        />
        <StatItem
          label="Pendapatan Bersih"
          value={stats.total_net_sales}
          icon={<CheckCircle2 size={20} />}
          color="text-white"
          bg="bg-[#008080]"
        />
      </div>

      {/* 3. LOG TRANSAKSI ELEGAN */}
      <div className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="text-[12px] font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2">
            <History size={16} className="text-orange-500" /> Riwayat Transaksi
            Terakhir
          </h3>
          <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
            Update Otomatis
          </span>
        </div>
        <div className="divide-y divide-slate-50">
          {recentOrders.length > 0 ? (
            recentOrders.map((item: any) => {
              const itemTotal = item.quantity * item.price_at_purchase;
              const adminPercent = item.orders?.seller_admin_fee_percent || 0;
              const netAmount = itemTotal - (itemTotal * adminPercent) / 100;
              return (
                <div
                  key={item.id}
                  className="p-5 flex items-center justify-between hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                      <Banknote size={18} />
                    </div>
                    <div>
                      <p className="text-[13px] font-bold text-slate-800 uppercase truncate max-w-[150px] md:max-w-xs">
                        {item.products?.name || "Produk Umum"}
                      </p>
                      <p className="text-[10px] font-medium text-slate-400 mt-1 uppercase tracking-tighter">
                        {item.quantity} Unit •{" "}
                        {new Date(item.orders?.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[13px] font-black text-[#008080] tracking-tighter leading-none">
                      + Rp {netAmount.toLocaleString()}
                    </p>
                    <div
                      className={`mt-2 inline-block px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                        item.orders?.shipping_status === "COMPLETED"
                          ? "bg-teal-50 text-teal-600"
                          : "bg-orange-50 text-orange-600"
                      }`}
                    >
                      {item.orders?.shipping_status === "COMPLETED"
                        ? "Selesai"
                        : "Proses"}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-20 text-center flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                <History size={32} />
              </div>
              <p className="text-slate-400 text-[12px] font-bold uppercase tracking-widest">
                Belum Ada Transaksi Masuk
              </p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL WD (ELEGAN CLEAN) */}
      {showWDModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 relative shadow-2xl animate-in zoom-in-95 duration-300 border border-slate-100">
            <button
              onClick={() => setShowWDModal(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-900 transition-colors"
            >
              <X size={24} />
            </button>

            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-teal-50 text-[#008080] rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CreditCard size={32} />
              </div>
              <h2 className="text-xl font-bold text-slate-800 uppercase tracking-tight">
                Pencairan Dana
              </h2>
              <div className="mt-2 inline-block px-4 py-1 bg-teal-50 rounded-full">
                <p className="text-[12px] font-bold text-[#008080] tracking-widest">
                  DOMPET: RP {wdAmount.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                  Pilih Bank / E-Wallet
                </label>
                <select
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-[#008080] text-[13px] font-bold transition-all cursor-pointer"
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
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                  Nomor Rekening / HP
                </label>
                <input
                  type="text"
                  placeholder="Masukkan Nomor..."
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-[#008080] text-[13px] font-bold transition-all"
                  value={wdForm.accNo}
                  onChange={(e) =>
                    setWdForm({ ...wdForm, accNo: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                  Nama Pemilik
                </label>
                <input
                  type="text"
                  placeholder="Sesuai Buku Tabungan..."
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-[#008080] text-[13px] font-bold transition-all"
                  value={wdForm.accName}
                  onChange={(e) =>
                    setWdForm({ ...wdForm, accName: e.target.value })
                  }
                />
              </div>

              <button
                disabled={wdLoading}
                onClick={handleRequestWD}
                className="w-full py-5 mt-4 bg-[#008080] text-white text-[13px] font-bold uppercase tracking-widest rounded-2xl hover:bg-slate-900 transition-all shadow-xl shadow-teal-900/10 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
              >
                {wdLoading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <ArrowUpRight size={20} />
                )}
                Konfirmasi Penarikan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// SUB-KOMPONEN STATS ITEM
const StatItem = ({ label, value, icon, color, bg, isMinus }: any) => (
  <div
    className={`${bg} border border-slate-200 p-6 rounded-[1.5rem] shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow group`}
  >
    <div className="flex items-center justify-between mb-4">
      <p
        className={`text-[10px] font-bold tracking-widest uppercase ${color.includes("white") ? "text-teal-100" : "text-slate-400"}`}
      >
        {label}
      </p>
      <div
        className={`${color.includes("white") ? "text-white" : "text-slate-300 group-hover:text-[#008080]"} transition-colors`}
      >
        {icon}
      </div>
    </div>
    <p className={`text-xl font-bold tracking-tighter ${color}`}>
      {isMinus ? "- " : ""}RP {value.toLocaleString()}
    </p>
  </div>
);
