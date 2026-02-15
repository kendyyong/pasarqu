import React, { useState, useEffect } from "react";
// ✅ FIX 2307: Jalur mundur 3 kali karena sekarang file di merchant/components/
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
  Clock,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Banknote,
  BadgePercent,
  Info,
  X,
  Building,
  CreditCard,
  AlertCircle,
} from "lucide-react";

export const MerchantFinanceDashboard: React.FC<any> = ({ theme }) => {
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

  const MIN_WITHDRAWAL = 50000; // Batas Minimal Penarikan

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // 1. Ambil Profil & Saldo Merchant
      const { data: profile } = await supabase
        .from("profiles")
        .select("*, merchants!merchant_id(*)")
        .eq("id", user.id)
        .single();

      setMerchantData(profile);
      setWdAmount(profile?.wallet_balance || 0);

      // 2. Ambil Statistik Penjualan
      const { data: orders } = await supabase
        .from("order_items")
        .select(
          `
          quantity,
          price_at_purchase,
          orders!inner(status, shipping_status, seller_admin_fee_percent)
        `,
        )
        .eq("merchant_id", profile.merchant_id);

      if (orders) {
        let gross = 0;
        let fees = 0;
        let pending = 0;

        // ✅ FIX 7006: Menambahkan tipe data :any pada parameter item
        orders.forEach((item: any) => {
          const itemTotal = item.quantity * item.price_at_purchase;
          const adminPercent = item.orders.seller_admin_fee_percent || 0;
          const itemFee = (itemTotal * adminPercent) / 100;

          gross += itemTotal;
          fees += itemFee;

          if (
            item.orders.status === "PAID" &&
            item.orders.shipping_status !== "COMPLETED"
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

      // 3. Ambil Riwayat Transaksi
      const { data: history } = await supabase
        .from("order_items")
        .select(
          `
          id,
          quantity,
          price_at_purchase,
          products(name),
          orders!inner(id, created_at, shipping_status, seller_admin_fee_percent)
        `,
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

  // --- FUNGSI EKSEKUSI PENARIKAN ---
  const handleRequestWD = async () => {
    if (!wdForm.accNo || !wdForm.accName) {
      showToast("Lengkapi data rekening Anda!", "error");
      return;
    }

    if (wdAmount < MIN_WITHDRAWAL) {
      showToast(
        `Minimal penarikan Rp ${MIN_WITHDRAWAL.toLocaleString()}`,
        "error",
      );
      return;
    }

    setWdLoading(true);
    try {
      // 1. Catat Permintaan Penarikan
      const { error: wdErr } = await supabase.from("payout_requests").insert({
        merchant_id: merchantData.merchant_id,
        amount: wdAmount,
        bank_name: wdForm.bank,
        account_number: wdForm.accNo,
        account_name: wdForm.accName,
        status: "REQUESTED",
      });

      if (wdErr) throw wdErr;

      // 2. Potong Saldo Merchant via RPC (Aman dari Race Condition)
      const { error: balanceErr } = await supabase.rpc("decrement_wallet", {
        user_id: user?.id,
        amount: wdAmount,
      });

      if (balanceErr) throw balanceErr;

      // 3. Catat di Jurnal Transaksi
      await supabase.from("transactions").insert({
        type: "WITHDRAWAL",
        credit: wdAmount,
        debit: 0,
        account_code: "2002-WAL",
        merchant_id: merchantData.merchant_id,
        description: `Penarikan ke ${wdForm.bank} (${wdForm.accNo})`,
      });

      showToast("Permintaan terkirim. Dana segera diproses!", "success");
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
      <div className="flex flex-col items-center justify-center py-40 gap-4">
        <Loader2 className="animate-spin text-orange-500" size={48} />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
          Sinkronisasi Laporan...
        </p>
      </div>
    );

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 animate-in fade-in duration-700 pb-20 px-4 text-left relative">
      {/* MODAL WITHDRAWAL */}
      {showWDModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-[3rem] p-10 shadow-2xl relative border border-slate-100 overflow-hidden">
            <button
              onClick={() => setShowWDModal(false)}
              className="absolute top-8 right-8 text-slate-400 hover:text-red-500 transition-all"
            >
              <X size={24} />
            </button>
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-orange-600 shadow-inner">
                <Building size={32} />
              </div>
              <h2 className="text-xl font-black uppercase italic text-slate-800 tracking-tighter">
                Cairkan Saldo
              </h2>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2">
                Dana akan dikirim ke rekening bank
              </p>
            </div>

            <div className="space-y-6">
              <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase">
                  Jumlah yang dicairkan
                </p>
                <h3 className="text-3xl font-black text-orange-600 mt-1 italic leading-none tracking-tighter">
                  Rp {wdAmount.toLocaleString()}
                </h3>
              </div>

              <div className="space-y-4">
                <select
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-xs outline-none"
                  value={wdForm.bank}
                  onChange={(e) =>
                    setWdForm({ ...wdForm, bank: e.target.value })
                  }
                >
                  <option>BCA</option>
                  <option>MANDIRI</option>
                  <option>BNI</option>
                  <option>BRI</option>
                  <option>DANA / OVO</option>
                </select>
                <input
                  type="text"
                  placeholder="Nomor Rekening"
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-xs outline-none focus:ring-2 ring-orange-500"
                  value={wdForm.accNo}
                  onChange={(e) =>
                    setWdForm({ ...wdForm, accNo: e.target.value })
                  }
                />
                <input
                  type="text"
                  placeholder="Nama Pemilik Rekening"
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-xs outline-none focus:ring-2 ring-orange-500"
                  value={wdForm.accName}
                  onChange={(e) =>
                    setWdForm({ ...wdForm, accName: e.target.value })
                  }
                />
              </div>

              <button
                disabled={wdLoading}
                onClick={handleRequestWD}
                className="w-full py-5 bg-orange-600 text-white rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-xl shadow-orange-600/20 active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                {wdLoading ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <CreditCard size={20} />
                )}
                Kirim Dana Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tighter text-slate-800 flex items-center gap-2 italic">
            <Store className="text-orange-500" />{" "}
            {merchantData?.merchants?.shop_name || "Merchant Dashboard"}
          </h1>
          <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest mt-1 italic">
            Financial Ledger & Statement
          </p>
        </div>
        <button
          onClick={fetchData}
          className="p-3 bg-white border border-slate-100 rounded-2xl shadow-sm hover:rotate-180 transition-all duration-500"
        >
          <RefreshCw size={18} className="text-slate-400" />
        </button>
      </header>

      {/* SALDO UTAMA */}
      <div className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2 opacity-50">
            <Wallet size={16} className="text-orange-400" />
            <span className="text-[10px] font-black uppercase tracking-widest">
              Saldo Siap Cair (Net Profit)
            </span>
          </div>
          <h2 className="text-5xl font-black tracking-tighter italic leading-none">
            Rp{" "}
            {Number(merchantData?.wallet_balance || 0).toLocaleString("id-ID")}
          </h2>

          <div className="flex gap-3 mt-10">
            <button
              onClick={() => {
                if (merchantData?.wallet_balance < MIN_WITHDRAWAL) {
                  showToast(
                    `Saldo minimal penarikan Rp ${MIN_WITHDRAWAL.toLocaleString()}`,
                    "info",
                  );
                  return;
                }
                setShowWDModal(true);
              }}
              className={`flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg transition-all flex items-center justify-center gap-2 ${
                merchantData?.wallet_balance >= MIN_WITHDRAWAL
                  ? "bg-orange-500 hover:bg-orange-400 text-white"
                  : "bg-slate-800 text-slate-500 cursor-not-allowed"
              }`}
            >
              <ArrowDownLeft size={16} /> Cairkan Dana
            </button>
            <button className="flex-1 py-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all">
              Bantuan
            </button>
          </div>
        </div>
        <Banknote className="absolute -bottom-10 -right-10 text-white/5 w-64 h-64 rotate-12" />
      </div>

      {/* THREE BUCKETS STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[2.5rem] border-2 border-slate-50 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
              <TrendingUp size={20} />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Omzet Kotor
            </p>
          </div>
          <h4 className="text-xl font-black text-slate-800 tracking-tighter">
            Rp {stats.total_gross_sales.toLocaleString()}
          </h4>
        </div>

        <div className="bg-white p-6 rounded-[2.5rem] border-2 border-slate-50 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center">
              <BadgePercent size={20} />
            </div>
            <p className="text-[10px] font-black text-red-400 uppercase tracking-widest">
              Biaya Admin
            </p>
          </div>
          <h4 className="text-xl font-black text-red-600 tracking-tighter">
            - Rp {stats.total_admin_fees.toLocaleString()}
          </h4>
        </div>

        <div className="bg-white p-6 rounded-[2.5rem] border-2 border-slate-50 shadow-sm bg-gradient-to-br from-white to-teal-50/30">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center">
              <CheckCircle2 size={20} />
            </div>
            <p className="text-[10px] font-black text-teal-600 uppercase tracking-widest">
              Gaji Bersih
            </p>
          </div>
          <h4 className="text-xl font-black text-teal-700 tracking-tighter">
            Rp {stats.total_net_sales.toLocaleString()}
          </h4>
        </div>
      </div>

      {/* RIWAYAT PENJUALAN */}
      <div className="bg-white rounded-[3rem] border-2 border-slate-50 shadow-xl overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
          <h3 className="font-black uppercase text-xs tracking-widest text-slate-800 flex items-center gap-2">
            <History size={16} className="text-orange-500" /> Log Transaksi
            Terakhir
          </h3>
        </div>

        <div className="divide-y divide-slate-50">
          {recentOrders.length > 0 ? (
            recentOrders.map((item: any) => {
              const itemTotal = item.quantity * item.price_at_purchase;
              const adminPercent = item.orders.seller_admin_fee_percent || 0;
              const itemFee = (itemTotal * adminPercent) / 100;
              const netAmount = itemTotal - itemFee;

              return (
                <div
                  key={item.id}
                  className="p-8 flex flex-col md:flex-row md:items-center justify-between hover:bg-slate-50 transition-all gap-6"
                >
                  <div className="flex items-center gap-5 text-left">
                    <div className="w-14 h-14 bg-slate-900 text-white rounded-[1.2rem] flex flex-col items-center justify-center shadow-lg">
                      <span className="text-[8px] font-black leading-none mb-1">
                        UNIT
                      </span>
                      <span className="text-lg font-black leading-none">
                        {item.quantity}
                      </span>
                    </div>
                    <div>
                      <p className="font-black text-slate-800 text-sm uppercase tracking-tight leading-none italic">
                        {item.products?.name}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-[9px] font-bold text-slate-400 uppercase">
                          Gross: Rp {itemTotal.toLocaleString()}
                        </span>
                        <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                        <span className="text-[9px] font-black text-red-400 uppercase italic">
                          Admin Fee: {adminPercent}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-8 justify-between md:justify-end border-t md:border-t-0 pt-4 md:pt-0 border-dashed border-slate-200">
                    <div className="text-right">
                      <p className="text-[9px] font-black text-slate-400 uppercase mb-1">
                        Terima Bersih
                      </p>
                      <h4 className="font-black text-teal-600 text-lg leading-none italic tracking-tighter">
                        Rp {netAmount.toLocaleString()}
                      </h4>
                    </div>
                    <div
                      className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest ${item.orders.shipping_status === "COMPLETED" ? "bg-teal-100 text-teal-700" : "bg-orange-100 text-orange-700 animate-pulse"}`}
                    >
                      {item.orders.shipping_status === "COMPLETED"
                        ? "Selesai"
                        : "Pengantaran"}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-24 text-center">
              <Info className="mx-auto text-slate-200 mb-4" size={48} />
              <p className="text-slate-300 font-black uppercase text-xs tracking-widest">
                Belum ada aktivitas perdagangan
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
