import React, { useEffect, useState } from "react";
// Pastikan path ini benar (naik 3 level ke root src)
import { supabase } from "../../../lib/supabaseClient";
import {
  MapPin,
  User,
  Bike,
  Plus,
  Trash2,
  Loader2,
  Store,
  Wallet,
  RefreshCw,
} from "lucide-react";
import { useToast } from "../../../contexts/ToastContext";

const RegionalFinance = () => {
  const { showToast } = useToast();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const TABLE_NAME = "regional_finance_settings";

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data: res, error } = await supabase
        .from(TABLE_NAME)
        .select("*")
        .order("kecamatan", { ascending: true });

      if (error) throw error;
      if (res) setData(res);
    } catch (err: any) {
      console.error("Error fetching finance:", err);
      // Silent error jika tabel kosong saat inisialisasi
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleUpdate = async (id: string, field: string, value: any) => {
    const cleanValue = isNaN(value) ? 0 : value;

    // Optimistic Update (Update UI dulu supaya cepat)
    const oldData = [...data];
    const newData = data.map((item) =>
      item.id === id ? { ...item, [field]: cleanValue } : item,
    );
    setData(newData);

    const { error } = await supabase
      .from(TABLE_NAME)
      .update({ [field]: cleanValue })
      .eq("id", id);

    if (error) {
      showToast("Gagal update database: " + error.message, "error");
      setData(oldData); // Kembalikan data jika gagal
    } else {
      showToast("Data tersimpan", "success");
    }
  };

  const handleAddKecamatan = async () => {
    const name = prompt("Masukkan Nama Kecamatan Baru:");
    if (!name) return;

    const { error } = await supabase.from(TABLE_NAME).insert([
      {
        kecamatan: name,
        buyer_service_fee: 2000,
        courier_app_fee: 1000,
        max_merchants_per_order: 3,
        extra_fee_per_merchant: 3000,
        driver_extra_share: 2000,
        app_extra_share: 1000,
      },
    ]);

    if (!error) {
      fetchSettings();
      showToast("Kecamatan berhasil ditambah", "success");
    } else {
      showToast(error.message, "error");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin hapus pengaturan wilayah ini?")) return;
    const { error } = await supabase.from(TABLE_NAME).delete().eq("id", id);
    if (!error) {
      setData(data.filter((item) => item.id !== id));
      showToast("Terhapus", "success");
    } else {
      showToast(error.message, "error");
    }
  };

  return (
    <div className="space-y-6 text-left animate-in fade-in duration-500 pb-20">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">
            Regional <span className="text-teal-600">Finance</span>
          </h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">
            Pusat Kontrol Harga & Komisi Per Kecamatan
          </p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button
            onClick={fetchSettings}
            className="p-3 bg-white border border-slate-200 text-slate-400 hover:text-teal-600 rounded-xl transition-all"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
          <button
            onClick={handleAddKecamatan}
            className="flex-1 md:flex-none bg-slate-900 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-teal-600 transition-all shadow-lg shadow-slate-200"
          >
            <Plus size={16} /> Tambah Wilayah
          </button>
        </div>
      </div>

      {/* TABLE CONTAINER */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                <th className="px-8 py-5 text-left sticky left-0 z-10 bg-slate-50 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                  Wilayah / Kecamatan
                </th>

                {/* GRUP 1: SINGLE ORDER */}
                <th className="px-4 py-5 bg-blue-50/30 text-blue-500 border-l border-slate-100 text-center">
                  <div className="flex items-center gap-2 justify-center">
                    <User size={14} /> Biaya Layanan
                  </div>
                </th>
                <th className="px-4 py-5 bg-blue-50/30 text-blue-500 text-center">
                  <div className="flex items-center gap-2 justify-center">
                    <Bike size={14} /> Potongan Kurir
                  </div>
                </th>

                {/* GRUP 2: MULTI TOKO */}
                <th className="px-4 py-5 bg-orange-50/30 text-orange-500 border-l border-slate-100 text-center">
                  <div className="flex items-center gap-2 justify-center">
                    <Store size={14} /> Batas Toko
                  </div>
                </th>
                <th className="px-4 py-5 bg-orange-50/30 text-orange-500 text-center">
                  <div className="flex items-center gap-2 justify-center">
                    <Plus size={14} /> Charge User
                  </div>
                </th>
                <th className="px-4 py-5 bg-orange-50/30 text-orange-500 text-center">
                  <div className="flex items-center gap-2 justify-center">
                    <Wallet size={14} /> Jatah Kurir
                  </div>
                </th>

                <th className="px-6 py-5 text-right w-[80px]">Hapus</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading && data.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-20">
                    <Loader2
                      className="animate-spin mx-auto text-teal-600"
                      size={32}
                    />
                    <p className="mt-4 text-[10px] font-black text-slate-300 uppercase tracking-widest">
                      Memuat Data Keuangan...
                    </p>
                  </td>
                </tr>
              ) : (
                data.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    {/* NAMA KECAMATAN */}
                    <td className="px-8 py-5 font-black text-slate-700 uppercase text-xs sticky left-0 bg-white group-hover:bg-slate-50 transition-colors shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-teal-50 rounded-lg flex items-center justify-center text-teal-600">
                          <MapPin size={14} />
                        </div>
                        {item.kecamatan || item.kecamatan_name}
                      </div>
                    </td>

                    {/* INPUT 1: BIAYA LAYANAN */}
                    <td className="px-4 py-5 bg-blue-50/5 border-l border-slate-50">
                      <CurrencyInput
                        value={item.buyer_service_fee}
                        onChange={(val) =>
                          handleUpdate(item.id, "buyer_service_fee", val)
                        }
                      />
                    </td>
                    {/* INPUT 2: POTONGAN KURIR */}
                    <td className="px-4 py-5 bg-blue-50/5">
                      <CurrencyInput
                        value={item.courier_app_fee}
                        onChange={(val) =>
                          handleUpdate(item.id, "courier_app_fee", val)
                        }
                      />
                    </td>

                    {/* INPUT 3: MAX TOKO */}
                    <td className="px-4 py-5 bg-orange-50/5 border-l border-slate-50 text-center">
                      <input
                        type="number"
                        defaultValue={item.max_merchants_per_order}
                        onBlur={(e) =>
                          handleUpdate(
                            item.id,
                            "max_merchants_per_order",
                            parseInt(e.target.value) || 0,
                          )
                        }
                        className="bg-slate-100 w-14 text-center py-2 rounded-xl font-black text-xs text-orange-600 focus:bg-white focus:ring-4 ring-orange-100 outline-none transition-all border border-transparent focus:border-orange-200"
                      />
                    </td>

                    {/* INPUT 4: EXTRA CHARGE */}
                    <td className="px-4 py-5 bg-orange-50/5">
                      <CurrencyInput
                        value={item.extra_fee_per_merchant}
                        onChange={(val) =>
                          handleUpdate(item.id, "extra_fee_per_merchant", val)
                        }
                        color="text-orange-600"
                      />
                    </td>

                    {/* INPUT 5: JATAH KURIR */}
                    <td className="px-4 py-5 bg-orange-50/5">
                      <CurrencyInput
                        value={item.driver_extra_share}
                        onChange={(val) =>
                          handleUpdate(item.id, "driver_extra_share", val)
                        }
                        color="text-emerald-600"
                      />
                    </td>

                    {/* AKSI */}
                    <td className="px-8 py-5 text-right">
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FOOTER INFO */}
      <div className="grid md:grid-cols-2 gap-6 mt-4">
        <div className="p-6 bg-blue-50/50 rounded-[2rem] border border-blue-100/50 flex gap-4 items-start">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 shrink-0">
            <User size={20} />
          </div>
          <div>
            <h4 className="text-xs font-black text-blue-700 uppercase tracking-widest">
              Single Order Setting
            </h4>
            <p className="text-[10px] text-blue-600/70 mt-2 leading-relaxed font-medium">
              Pengaturan biaya standar saat pembeli hanya belanja di 1 toko.
              <b> Biaya layanan</b> dibebankan ke pembeli, <b>Potongan Kurir</b>{" "}
              diambil dari saldo dompet kurir per transaksi.
            </p>
          </div>
        </div>
        <div className="p-6 bg-orange-50/50 rounded-[2rem] border border-orange-100/50 flex gap-4 items-start">
          <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600 shrink-0">
            <Store size={20} />
          </div>
          <div>
            <h4 className="text-xs font-black text-orange-700 uppercase tracking-widest">
              Multi-Merchant Logic
            </h4>
            <p className="text-[10px] text-orange-600/70 mt-2 leading-relaxed font-medium">
              Jika pembeli belanja di beberapa toko sekaligus, mereka dikenakan{" "}
              <b>Extra Charge</b> per toko tambahan. Anda bisa mengatur
              pembagian jatah antara <b>Kurir</b> vs Aplikasi di sini.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Sub-Component untuk Input Rupiah
const CurrencyInput = ({
  value,
  onChange,
  color = "text-slate-700",
}: {
  value: any;
  onChange: (val: number) => void;
  color?: string;
}) => {
  return (
    <div className="flex items-center gap-1.5 bg-slate-50/50 border border-slate-100 px-3 py-2 rounded-xl focus-within:bg-white focus-within:border-teal-400 focus-within:ring-4 ring-teal-50 transition-all">
      <span className="text-[9px] font-black text-slate-400 uppercase">Rp</span>
      <input
        type="number"
        defaultValue={value}
        onBlur={(e) => {
          const val = parseInt(e.target.value);
          onChange(isNaN(val) ? 0 : val);
        }}
        className={`bg-transparent border-none outline-none text-xs font-black w-full ${color}`}
      />
    </div>
  );
};

export default RegionalFinance;
