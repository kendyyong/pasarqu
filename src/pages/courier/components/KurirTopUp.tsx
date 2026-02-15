import React, { useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { Wallet, ArrowRight, Loader2, AlertCircle } from "lucide-react";

interface KurirTopUpProps {
  courierId: string;
  theme?: any;
}

export const KurirTopUp: React.FC<KurirTopUpProps> = ({ courierId, theme }) => {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const isDark = theme?.bg?.includes("#0b0f19");

  const handleRequestTopUp = async () => {
    // 1. Validasi awal
    if (!amount || Number(amount) < 10000) {
      return alert("Minimal Top Up adalah Rp 10.000");
    }

    try {
      setLoading(true);

      // 2. Buat record di database Supabase (Status PENDING)
      const { data: topup, error: dbError } = await supabase
        .from("topup_requests")
        .insert([
          {
            courier_id: courierId,
            amount: Number(amount),
            status: "PENDING",
            payment_method: "MIDTRANS_AUTO",
          },
        ])
        .select()
        .single();

      if (dbError) throw dbError;

      // 3. Panggil Edge Function untuk mendapatkan Snap Token
      const { data, error: funcError } = await supabase.functions.invoke(
        "create-midtrans-token",
        {
          body: {
            orderId: topup.id,
            amount: Number(amount),
            customerName: "Kurir PasarQu",
          },
        },
      );

      if (funcError) throw funcError;

      // 4. MUNCULKAN JENDELA SNAP MIDTRANS
      // (window as any).snap berasal dari script yang kita pasang di index.html
      if ((window as any).snap) {
        (window as any).snap.pay(data.token, {
          onSuccess: (result: any) => {
            console.log("Success:", result);
            alert("Pembayaran Berhasil! Saldo akan segera diperbarui.");
            window.location.reload(); // Refresh untuk update saldo di UI
          },
          onPending: (result: any) => {
            console.log("Pending:", result);
            alert("Silakan selesaikan pembayaran Anda.");
          },
          onError: (result: any) => {
            console.error("Error:", result);
            alert("Pembayaran gagal, silakan coba lagi.");
          },
          onClose: () => {
            alert("Anda menutup jendela pembayaran sebelum selesai.");
          },
        });
      } else {
        alert(
          "Script Midtrans belum termuat. Pastikan koneksi internet stabil.",
        );
      }
    } catch (err: any) {
      console.error("TopUp Error:", err);
      alert(
        "Gagal memproses pembayaran: " + (err.message || "Terjadi kesalahan"),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`p-8 rounded-[3rem] border ${theme?.border} ${theme?.card} shadow-2xl max-w-md mx-auto text-left relative overflow-hidden`}
    >
      <div className="flex items-center gap-5 mb-10 relative z-10">
        <div className="w-14 h-14 bg-teal-500 rounded-[1.5rem] flex items-center justify-center text-white shadow-xl shadow-teal-500/40 rotate-3">
          <Wallet size={28} />
        </div>
        <div>
          <h3
            className={`text-xl font-black uppercase tracking-tighter italic ${theme?.text}`}
          >
            Top Up Saldo
          </h3>
          <p
            className={`text-[9px] font-black uppercase tracking-[0.2em] ${theme?.subText}`}
          >
            Instant Deposit Protocol
          </p>
        </div>
      </div>

      <div className="space-y-8 relative z-10">
        <div>
          <label
            className={`text-[10px] font-black uppercase ${theme?.subText} mb-3 block ml-1`}
          >
            Nominal Deposit (IDR)
          </label>
          <div className="relative group">
            <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-slate-400 group-focus-within:text-teal-500 transition-colors text-lg">
              Rp
            </span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className={`w-full pl-16 pr-8 py-6 rounded-[2rem] border-2 ${theme?.border} ${isDark ? "bg-white/5" : "bg-slate-50"} font-black text-2xl outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all ${theme?.text}`}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[20000, 50000, 100000].map((val) => (
            <button
              key={val}
              onClick={() => setAmount(val.toString())}
              className={`py-4 rounded-2xl border ${theme?.border} ${isDark ? "hover:bg-white/10" : "hover:bg-slate-100"} text-[11px] font-black transition-all active:scale-95 ${theme?.text}`}
            >
              {val / 1000}K
            </button>
          ))}
        </div>

        <div className="p-4 rounded-2xl bg-orange-500/5 border border-orange-500/10 flex items-start gap-3">
          <AlertCircle className="text-orange-500 shrink-0" size={16} />
          <p className="text-[9px] font-bold text-orange-600 uppercase leading-relaxed">
            Pilih metode pembayaran (QRIS, Bank, atau E-Wallet) di jendela
            selanjutnya.
          </p>
        </div>

        <button
          onClick={handleRequestTopUp}
          disabled={loading}
          className="w-full bg-slate-900 text-white p-6 rounded-[2rem] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-teal-600 transition-all shadow-2xl shadow-black/20 active:scale-[0.98] disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="animate-spin" size={20} />
          ) : (
            <ArrowRight size={20} />
          )}
          Bayar Sekarang
        </button>
      </div>

      <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-teal-500/5 rounded-full blur-3xl"></div>
    </div>
  );
};
