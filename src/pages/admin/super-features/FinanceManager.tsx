import React, { useState, useEffect } from "react";
import { DollarSign, FileText, Store, Percent } from "lucide-react";
import { supabase } from "../../../lib/supabaseClient";
import { useToast } from "../../../contexts/ToastContext";
import { StatCard } from "../../../components/super-admin/SharedUI";

export const FinanceManager = ({ finance, theme }: any) => {
  const { showToast } = useToast();
  const [adminFee, setAdminFee] = useState<string>("20");
  const [isSavingFee, setIsSavingFee] = useState(false);

  useEffect(() => {
    const fetchFee = async () => {
      const { data } = await supabase
        .from("global_settings")
        .select("value")
        .eq("key", "admin_fee_percentage")
        .single();
      if (data) setAdminFee(data.value);
    };
    fetchFee();
  }, []);

  const handleSaveFee = async () => {
    setIsSavingFee(true);
    try {
      await supabase
        .from("global_settings")
        .upsert(
          { key: "admin_fee_percentage", value: adminFee },
          { onConflict: "key" },
        );
      showToast("Persentase potongan berhasil disimpan!", "success");
    } catch (e: any) {
      showToast(e.message, "error");
    } finally {
      setIsSavingFee(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          label="Total Pendapatan (GMV)"
          value={`Rp ${finance.revenue.toLocaleString()}`}
          icon={<DollarSign size={32} className="text-green-500" />}
          theme={theme}
        />
        <StatCard
          label="Total Transaksi"
          value={finance.orders}
          icon={<FileText size={32} className="text-blue-500" />}
          theme={theme}
        />
        <StatCard
          label="Pasar Aktif"
          value={finance.active_markets}
          icon={<Store size={32} className="text-orange-500" />}
          theme={theme}
        />
      </div>

      <div className={`p-10 rounded-[2.5rem] border shadow-sm ${theme.card}`}>
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 bg-indigo-500/10 text-indigo-500 rounded-2xl flex items-center justify-center">
            <Percent size={28} />
          </div>
          <div>
            <h3 className="text-2xl font-black uppercase">Skema Bagi Hasil</h3>
            <p className={`text-xs ${theme.subText}`}>
              Atur potongan platform untuk kurir
            </p>
          </div>
        </div>
        <div className="flex flex-col md:flex-row gap-8 items-end">
          <div className="flex-1 w-full">
            <label
              className={`text-[10px] font-black uppercase ml-4 mb-3 block ${theme.subText}`}
            >
              Potongan Admin (%)
            </label>
            <div className="relative">
              <input
                type="number"
                value={adminFee}
                onChange={(e) => setAdminFee(e.target.value)}
                className={`w-full p-6 border rounded-[1.5rem] font-black text-2xl outline-none focus:border-indigo-500 transition-all pl-16 ${theme.input}`}
              />
              <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-slate-400 text-xl">
                %
              </span>
            </div>
            <p className="mt-4 text-xs text-slate-500 ml-2 font-bold opacity-60">
              *Kurir menerima <b>{100 - Number(adminFee)}%</b> dari ongkir.
            </p>
          </div>
          <button
            onClick={handleSaveFee}
            disabled={isSavingFee}
            className="w-full md:w-auto px-12 py-6 bg-indigo-600 text-white rounded-[1.5rem] font-black uppercase text-xs tracking-widest hover:scale-105 transition-all shadow-xl shadow-indigo-500/30 active:scale-95"
          >
            {isSavingFee ? "Menyimpan..." : "Simpan Pengaturan"}
          </button>
        </div>
      </div>
    </div>
  );
};
