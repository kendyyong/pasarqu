import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

// --- PERBAIKAN IMPORT: Menambah ../ agar keluar dari folder components ---
import { supabase } from "../../../lib/supabaseClient";
import { useAuth } from "../../../contexts/AuthContext";
import { MobileLayout } from "../../../components/layout/MobileLayout";

import {
  ArrowLeft,
  Wallet,
  History,
  TrendingUp,
  Gift,
  Info,
  ShieldCheck,
} from "lucide-react";

export const PasarQuPay = () => {
  const { user, profile } = useAuth() as any;
  const navigate = useNavigate();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchTransactionHistory();
  }, [user]);

  const fetchTransactionHistory = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("orders")
        .select("id, created_at, cashback_amount, total_price")
        .eq("customer_id", user?.id)
        .gt("cashback_amount", 0)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setHistory(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <MobileLayout
      activeTab="account"
      // PERBAIKAN: Menambahkan tipe data 'string' pada parameter tab
      onTabChange={(tab: string) => {
        if (tab === "home") navigate("/");
        if (tab === "account") navigate("/customer-dashboard");
      }}
      onSearch={() => {}}
      onCartClick={() => {}}
      cartCount={0}
    >
      <div className="min-h-screen bg-[#F1F5F9] text-slate-800 tracking-tighter pb-24 text-left not-italic font-black">
        {/* TOP BAR */}
        <div className="sticky top-0 z-[100] bg-[#008080] shadow-md w-full">
          <div className="max-w-[1200px] mx-auto px-4 py-4 flex items-center">
            <button
              onClick={() => navigate(-1)}
              className="p-1 -ml-1 text-white active:scale-95 mr-3"
            >
              <ArrowLeft size={22} strokeWidth={2.5} />
            </button>
            <h1 className="text-[12px] font-[1000] uppercase tracking-[0.2em] text-white flex-1 text-center md:text-left">
              PasarQu Pay
            </h1>
          </div>
        </div>

        <div className="max-w-[1200px] mx-auto px-4 pt-4 flex flex-col gap-3">
          {/* SALDO CARD */}
          <div className="bg-[#008080] p-6 rounded-md shadow-lg text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 rotate-12">
              <Wallet size={100} fill="white" />
            </div>
            <p className="text-[10px] font-black opacity-70 uppercase tracking-widest mb-1 relative z-10">
              Total Saldo Aktif
            </p>
            <h2 className="text-[32px] font-[1000] leading-none mb-4 relative z-10">
              RP {(profile?.balance || 0).toLocaleString()}
            </h2>

            <div className="flex gap-2 relative z-10">
              <button
                onClick={() => navigate("/terms-cashback")}
                className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-3 py-2 rounded-md transition-all active:scale-95"
              >
                <Info size={14} />
                <span className="text-[9px] font-black uppercase">
                  Cara Dapat Saldo
                </span>
              </button>
            </div>
          </div>

          {/* RIWAYAT TRANSAKSI */}
          <div className="mt-2">
            <div className="flex items-center gap-2 mb-3 px-1">
              <History size={16} className="text-[#008080]" />
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Riwayat Bonus Ambil Sendiri
              </h3>
            </div>

            {loading ? (
              <div className="p-10 text-center text-slate-400 text-[10px] uppercase font-black">
                Mensinkronisasi Saldo...
              </div>
            ) : history.length > 0 ? (
              <div className="flex flex-col gap-2">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white p-4 rounded-md border border-slate-200 shadow-sm flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-50 text-[#FF6600] rounded-md">
                        <Gift size={20} />
                      </div>
                      <div>
                        <h4 className="text-[12px] font-[1000] uppercase text-slate-800 leading-none">
                          Kejutan Ambil Sendiri
                        </h4>
                        <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">
                          {new Date(item.created_at).toLocaleDateString(
                            "id-ID",
                            { day: "numeric", month: "short" },
                          )}{" "}
                          • ID: {item.id.slice(0, 8)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[12px] font-[1000] text-[#008080] leading-none">
                        + RP {item.cashback_amount.toLocaleString()}
                      </p>
                      <p className="text-[8px] text-slate-300 font-black uppercase mt-1">
                        Berhasil
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white p-10 rounded-md border border-dashed border-slate-300 flex flex-col items-center text-center">
                <Gift size={32} className="text-slate-200 mb-2" />
                <p className="text-[10px] text-slate-400 font-black uppercase leading-tight">
                  Belum Ada Saldo Cashback.
                  <br />
                  Mulai Belanja Ambil Sendiri Untuk Dapat Kejutan!
                </p>
              </div>
            )}
          </div>

          <div className="mt-10 flex flex-col items-center opacity-30 gap-2 pb-10">
            <TrendingUp size={32} className="text-slate-400" />
            <p className="text-[8px] font-black tracking-[0.3em] uppercase">
              PasarQu Financial System 2026
            </p>
          </div>
        </div>
      </div>
    </MobileLayout>
  );
};
