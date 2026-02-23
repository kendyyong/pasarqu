import React, { useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { Wallet, ArrowRight, Loader2, AlertCircle } from "lucide-react";

interface KurirTopUpProps {
  courierId: string;
}

export const KurirTopUp: React.FC<KurirTopUpProps> = ({ courierId }) => {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRequestTopUp = async () => {
    if (!amount || Number(amount) < 10000) {
      return alert("Minimal Top Up adalah Rp 10.000");
    }

    try {
      setLoading(true);

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

      if ((window as any).snap) {
        (window as any).snap.pay(data.token, {
          onSuccess: (result: any) => {
            console.log("Success:", result);
            alert("Pembayaran Berhasil! Saldo akan segera diperbarui.");
            window.location.reload();
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
    <div className="bg-white p-6 rounded-md shadow-2xl border-t-4 border-[#008080] w-full text-left font-black uppercase tracking-tighter not-italic">
      {/* HEADER TOP UP */}
      <div className="flex items-center gap-4 mb-6 border-b border-slate-100 pb-4">
        <div className="w-12 h-12 bg-teal-50 rounded-md flex items-center justify-center text-[#008080] border border-teal-100 shrink-0">
          <Wallet size={24} />
        </div>
        <div>
          <h3 className="text-[16px] text-slate-800 leading-none">
            TOP UP SALDO
          </h3>
          <p className="text-[9px] text-slate-400 tracking-widest mt-1">
            INSTANT DEPOSIT PROTOCOL
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* INPUT NOMINAL */}
        <div>
          <label className="text-[10px] text-slate-500 mb-2 block tracking-widest">
            NOMINAL DEPOSIT (IDR)
          </label>
          <div className="relative group">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-sans font-[1000] text-slate-400 group-focus-within:text-[#008080] transition-colors text-[16px]">
              RP
            </span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="w-full pl-12 pr-4 py-4 rounded-md border-2 border-slate-200 bg-slate-50 font-sans font-[1000] text-[20px] text-slate-800 outline-none focus:border-[#008080] focus:bg-white transition-all shadow-inner"
            />
          </div>
        </div>

        {/* TOMBOL CEPAT NOMINAL */}
        <div className="grid grid-cols-3 gap-3">
          {[20000, 50000, 100000].map((val) => (
            <button
              key={val}
              onClick={() => setAmount(val.toString())}
              className="py-3 bg-white border border-slate-200 hover:border-[#008080] hover:text-[#008080] rounded-md text-[11px] font-[1000] transition-all active:scale-95 shadow-sm text-slate-600"
            >
              {val / 1000}K
            </button>
          ))}
        </div>

        {/* INFO INFO */}
        <div className="p-3 rounded-md bg-slate-50 border border-slate-200 flex items-start gap-3">
          <AlertCircle className="text-[#008080] shrink-0 mt-0.5" size={16} />
          <p className="text-[9px] font-bold text-slate-500 leading-relaxed tracking-widest">
            PILIH METODE PEMBAYARAN (QRIS ATAU E-WALLET) DI JENDELA SELANJUTNYA
            SETELAH KLIK BAYAR.
          </p>
        </div>

        {/* TOMBOL SUBMIT */}
        <button
          onClick={handleRequestTopUp}
          disabled={loading || Number(amount) < 10000}
          className="w-full bg-[#FF6600] text-white py-4 rounded-md font-[1000] text-[12px] tracking-widest flex items-center justify-center gap-2 hover:bg-[#e65c00] transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:bg-slate-300"
        >
          {loading ? (
            <Loader2 className="animate-spin" size={18} />
          ) : (
            <ArrowRight size={18} strokeWidth={3} />
          )}
          LANJUTKAN PEMBAYARAN
        </button>
      </div>
    </div>
  );
};
