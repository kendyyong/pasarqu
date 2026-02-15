import React, { useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useToast } from "../../contexts/ToastContext";
import {
  X,
  Building,
  CreditCard,
  Loader2,
  AlertCircle,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  profile: any; // Data profile kurir/merchant
  role: "COURIER" | "MERCHANT";
  onSuccess: () => void;
}

export const WithdrawalModal: React.FC<Props> = ({
  isOpen,
  onClose,
  profile,
  role,
  onSuccess,
}) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    bank: "BCA",
    accNo: "",
    accName: "",
  });

  // Tentukan Limit Berdasarkan Role
  const MIN_LIMIT = role === "MERCHANT" ? 50000 : 20000;
  const currentBalance = profile?.wallet_balance || 0;
  const isEligible = currentBalance >= MIN_LIMIT;

  const handleWithdraw = async () => {
    if (!form.accNo || !form.accName) {
      showToast("Lengkapi data rekening bank Anda!", "error");
      return;
    }

    setLoading(true);
    try {
      // 1. Kirim Permintaan Payout (Antrian untuk Admin)
      const { error: payoutErr } = await supabase
        .from("payout_requests")
        .insert({
          [role === "MERCHANT" ? "merchant_id" : "courier_id"]:
            role === "MERCHANT" ? profile.merchant_id : profile.id,
          amount: currentBalance,
          bank_name: form.bank,
          account_number: form.accNo,
          account_name: form.accName,
          status: "REQUESTED",
        });

      if (payoutErr) throw payoutErr;

      // 2. Potong Saldo (Escrow ke Sistem)
      const { error: balanceErr } = await supabase.rpc("decrement_wallet", {
        user_id: profile.id,
        amount: currentBalance,
      });

      if (balanceErr) throw balanceErr;

      // 3. Catat Jurnal Jelas (Uang Keluar dari Dompet)
      await supabase.from("transactions").insert({
        type: "WITHDRAWAL",
        credit: currentBalance,
        debit: 0,
        account_code: role === "MERCHANT" ? "2002-WAL" : "2001-WAL",
        description: `Penarikan saldo ${role} ke ${form.bank} (${form.accNo})`,
        [role === "MERCHANT" ? "merchant_id" : "user_id"]:
          role === "MERCHANT" ? profile.merchant_id : profile.id,
      });

      showToast(
        "Permintaan terkirim! Dana akan masuk dalam 1x24 jam.",
        "success",
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-[3rem] p-10 shadow-2xl relative border border-slate-100 overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-8 right-8 text-slate-400 hover:text-red-500 transition-all"
        >
          <X size={24} />
        </button>

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-teal-600 shadow-inner">
            <Building size={32} />
          </div>
          <h2 className="text-xl font-black uppercase italic text-slate-800 tracking-tighter">
            Penarikan Dana
          </h2>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2 italic">
            Transfer saldo ke rekening bank personal
          </p>
        </div>

        {!isEligible ? (
          <div className="bg-orange-50 border-2 border-orange-100 p-6 rounded-[2rem] text-center space-y-3">
            <AlertCircle className="mx-auto text-orange-500" size={32} />
            <p className="text-xs font-black text-orange-800 uppercase tracking-tight">
              Saldo Belum Mencukupi
            </p>
            <p className="text-[10px] font-bold text-orange-600 uppercase leading-relaxed">
              Minimal penarikan untuk {role} adalah{" "}
              <span className="text-orange-800">
                Rp {MIN_LIMIT.toLocaleString()}
              </span>
              . Saldo Anda saat ini:{" "}
              <span className="text-orange-800">
                Rp {currentBalance.toLocaleString()}
              </span>
              .
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 text-center relative overflow-hidden">
              <p className="text-[10px] font-black text-slate-400 uppercase relative z-10">
                Total Pencairan (Bersih)
              </p>
              <h3 className="text-3xl font-black text-teal-600 mt-1 italic relative z-10 leading-none tracking-tighter">
                Rp {currentBalance.toLocaleString()}
              </h3>
              <ShieldCheck
                className="absolute -bottom-4 -right-4 text-teal-500/10"
                size={80}
              />
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[9px] font-black uppercase text-slate-400 ml-2">
                  Pilih Bank
                </label>
                <select
                  className="w-full p-4 mt-2 bg-slate-50 border border-slate-100 rounded-2xl font-black text-xs outline-none focus:ring-2 ring-teal-500"
                  value={form.bank}
                  onChange={(e) => setForm({ ...form, bank: e.target.value })}
                >
                  <option>BCA</option>
                  <option>MANDIRI</option>
                  <option>BNI</option>
                  <option>BRI</option>
                  <option>SEA BANK</option>
                  <option>DANA / OVO</option>
                </select>
              </div>
              <input
                type="text"
                placeholder="Nomor Rekening / HP"
                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-xs outline-none focus:ring-2 ring-teal-500"
                value={form.accNo}
                onChange={(e) => setForm({ ...form, accNo: e.target.value })}
              />
              <input
                type="text"
                placeholder="Nama Pemilik Rekening"
                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-xs outline-none focus:ring-2 ring-teal-500"
                value={form.accName}
                onChange={(e) => setForm({ ...form, accName: e.target.value })}
              />
            </div>

            <button
              disabled={loading}
              onClick={handleWithdraw}
              className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black uppercase text-xs tracking-[0.2em] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3 border-b-4 border-teal-600"
            >
              {loading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <CreditCard size={20} />
              )}
              KONFIRMASI PENARIKAN
            </button>
          </div>
        )}

        <p className="text-center text-[8px] font-black text-slate-300 uppercase tracking-widest mt-6">
          Proses verifikasi bank memakan waktu maksimal 24 jam kerja.
        </p>
      </div>
    </div>
  );
};
