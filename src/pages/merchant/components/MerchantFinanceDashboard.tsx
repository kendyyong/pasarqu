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
      const { data: profile } = await supabase
        .from("profiles")
        .select("*, merchants!merchant_id(*)")
        .eq("id", user.id)
        .single();

      setMerchantData(profile);
      setWdAmount(profile?.wallet_balance || 0);

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

  const handleRequestWD = async () => {
    if (!wdForm.accNo || !wdForm.accName) {
      showToast("Lengkapi data rekening!", "error");
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

      showToast("Pencairan dana sedang diproses!", "success");
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
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="animate-spin text-slate-900" size={32} />
        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
          Loading Keuangan...
        </p>
      </div>
    );

  return (
    <div className="w-full space-y-4 animate-in fade-in duration-500 pb-10 text-left">
      {/* 1. SALDO UTAMA (SHARP BOX) */}
      <div className="bg-slate-900 border-b-4 border-orange-600 p-6 md:p-8 text-white flex flex-col md:flex-row justify-between items-center gap-6 rounded-none">
        <div className="text-center md:text-left">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-orange-500 mb-2">
            Saldo Dompet Juragan
          </p>
          <h2 className="text-3xl md:text-5xl font-black tracking-tighter italic">
            Rp{" "}
            {Number(merchantData?.wallet_balance || 0).toLocaleString("id-ID")}
          </h2>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button
            onClick={() => {
              if (merchantData?.wallet_balance < MIN_WITHDRAWAL) {
                showToast(
                  `Minimal penarikan Rp ${MIN_WITHDRAWAL.toLocaleString()}`,
                  "info",
                );
                return;
              }
              setShowWDModal(true);
            }}
            className="flex-1 md:px-8 py-4 bg-orange-600 hover:bg-orange-700 text-white font-black text-[10px] uppercase tracking-widest transition-all rounded-none flex items-center justify-center gap-2"
          >
            <ArrowUpRight size={16} /> Cairkan Dana
          </button>
          <button
            onClick={fetchData}
            className="p-4 bg-white/10 hover:bg-white/20 text-white border border-white/10 rounded-none"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {/* 2. STATS GRID (COMPACT) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <div className="bg-white border border-slate-200 p-4 rounded-none flex items-center justify-between">
          <div>
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">
              Omzet Kotor
            </p>
            <p className="text-sm font-black text-slate-900">
              Rp {stats.total_gross_sales.toLocaleString()}
            </p>
          </div>
          <TrendingUp size={20} className="text-blue-500" />
        </div>
        <div className="bg-white border border-slate-200 p-4 rounded-none flex items-center justify-between">
          <div>
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">
              Biaya Admin
            </p>
            <p className="text-sm font-black text-red-600">
              - Rp {stats.total_admin_fees.toLocaleString()}
            </p>
          </div>
          <BadgePercent size={20} className="text-red-500" />
        </div>
        <div className="bg-white border border-slate-200 p-4 rounded-none flex items-center justify-between border-b-2 border-b-teal-500">
          <div>
            <p className="text-[8px] font-black text-teal-600 uppercase tracking-widest mb-1">
              Gaji Bersih
            </p>
            <p className="text-sm font-black text-teal-600">
              Rp {stats.total_net_sales.toLocaleString()}
            </p>
          </div>
          <CheckCircle2 size={20} className="text-teal-500" />
        </div>
      </div>

      {/* 3. LOG TRANSAKSI (TABLE STYLE) */}
      <div className="bg-white border border-slate-200 rounded-none">
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-2">
            <History size={14} className="text-orange-500" /> Log Transaksi
            Terakhir
          </h3>
        </div>
        <div className="divide-y divide-slate-100">
          {recentOrders.length > 0 ? (
            recentOrders.map((item: any) => {
              const itemTotal = item.quantity * item.price_at_purchase;
              const adminPercent = item.orders.seller_admin_fee_percent || 0;
              const netAmount = itemTotal - (itemTotal * adminPercent) / 100;

              return (
                <div
                  key={item.id}
                  className="p-4 flex items-center justify-between hover:bg-slate-50 transition-all"
                >
                  <div className="flex flex-col text-left">
                    <p className="text-[10px] font-black text-slate-800 uppercase tracking-tight">
                      {item.products?.name}
                    </p>
                    <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">
                      QTY: {item.quantity} •{" "}
                      {new Date(item.orders.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right flex items-center gap-4">
                    <div>
                      <p className="text-[11px] font-black text-teal-600 tracking-tighter leading-none italic">
                        Rp {netAmount.toLocaleString()}
                      </p>
                      <p className="text-[7px] font-black text-slate-300 uppercase mt-1">
                        Net Income
                      </p>
                    </div>
                    <div
                      className={`px-2 py-1 text-[7px] font-black uppercase ${item.orders.shipping_status === "COMPLETED" ? "bg-teal-100 text-teal-700" : "bg-orange-100 text-orange-600"}`}
                    >
                      {item.orders.shipping_status === "COMPLETED"
                        ? "Selesai"
                        : "Proses"}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-10 text-center text-slate-300 text-[9px] font-black uppercase tracking-widest">
              Belum ada aktivitas
            </div>
          )}
        </div>
      </div>

      {/* MODAL WD (SHARP DESIGN) */}
      {showWDModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-none border-2 border-slate-900 p-8 relative animate-in zoom-in-95">
            <button
              onClick={() => setShowWDModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-red-500"
            >
              <X size={20} />
            </button>
            <div className="text-center mb-6">
              <h2 className="text-lg font-black uppercase italic text-slate-900 tracking-tighter">
                Pencairan Dana
              </h2>
              <p className="text-[8px] font-black text-orange-600 uppercase mt-1">
                Saldo: Rp {wdAmount.toLocaleString()}
              </p>
            </div>
            <div className="space-y-3">
              <select
                className="w-full p-3 bg-slate-100 border-none font-black text-[10px] outline-none rounded-none uppercase"
                value={wdForm.bank}
                onChange={(e) => setWdForm({ ...wdForm, bank: e.target.value })}
              >
                <option>BCA</option>
                <option>MANDIRI</option>
                <option>BNI</option>
                <option>BRI</option>
                <option>DANA</option>
              </select>
              <input
                type="text"
                placeholder="NO. REKENING"
                className="w-full p-3 bg-slate-100 border-none font-black text-[10px] outline-none rounded-none uppercase"
                value={wdForm.accNo}
                onChange={(e) =>
                  setWdForm({ ...wdForm, accNo: e.target.value })
                }
              />
              <input
                type="text"
                placeholder="NAMA PENERIMA"
                className="w-full p-3 bg-slate-100 border-none font-black text-[10px] outline-none rounded-none uppercase"
                value={wdForm.accName}
                onChange={(e) =>
                  setWdForm({ ...wdForm, accName: e.target.value })
                }
              />
              <button
                disabled={wdLoading}
                onClick={handleRequestWD}
                className="w-full py-4 bg-orange-600 text-white font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-900 transition-all rounded-none flex items-center justify-center gap-2"
              >
                {wdLoading ? (
                  <Loader2 className="animate-spin" size={14} />
                ) : (
                  <CreditCard size={14} />
                )}{" "}
                Proses Sekarang
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
