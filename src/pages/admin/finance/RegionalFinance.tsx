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
        .order("kecamatan", { ascending: true }); // Pastikan kolom sorting benar

      if (error) throw error;
      if (res) setData(res);
    } catch (err: any) {
      console.error("Error fetching finance:", err);
      // Jangan showToast error di awal agar tidak spam jika tabel kosong
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleUpdate = async (id: string, field: string, value: any) => {
    // Safety check: Jika value NaN/Kosong, ubah jadi 0
    const cleanValue = isNaN(value) ? 0 : value;

    // Optimistic Update
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
      setData(oldData); // Revert jika gagal
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
            Regional Finance
          </h2>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">
            Pusat Kontrol Harga & Komisi Per Kecamatan
          </p>
        </div>
        <button
          onClick={handleAddKecamatan}
          className="bg-slate-900 text-white px-5 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-teal-600 transition-colors shadow-lg"
        >
          <Plus size={16} /> Tambah Wilayah
        </button>
      </div>

      {/* TABLE CONTAINER */}
      <div className="bg-white rounded-[1.5rem] shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px]">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200">
                <th className="px-6 py-5 text-left bg-slate-50 sticky left-0 z-10 w-[180px] shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                  Wilayah / Kecamatan
                </th>

                {/* GRUP 1: SINGLE ORDER */}
                <th className="px-4 py-5 bg-blue-50/50 text-blue-400 border-l border-slate-100 text-center">
                  <div className="flex items-center gap-1 justify-center">
                    <User size={14} /> Biaya Layanan
                  </div>
                </th>
                <th className="px-4 py-5 bg-blue-50/50 text-blue-400 text-center">
                  <div className="flex items-center gap-1 justify-center">
                    <Bike size={14} /> Potongan Kurir
                  </div>
                </th>

                {/* GRUP 2: MULTI TOKO */}
                <th className="px-4 py-5 bg-orange-50/50 text-orange-400 border-l border-slate-100 text-center">
                  <div className="flex items-center gap-1 justify-center">
                    <Store size={14} /> Batas Toko
                  </div>
                </th>
                <th className="px-4 py-5 bg-orange-50/50 text-orange-400 text-center">
                  <div className="flex items-center gap-1 justify-center">
                    <Plus size={14} /> Charge User
                  </div>
                </th>
                <th className="px-4 py-5 bg-orange-50/50 text-orange-400 text-center">
                  <div className="flex items-center gap-1 justify-center">
                    <Wallet size={14} /> Jatah Kurir
                  </div>
                </th>

                <th className="px-6 py-5 text-right w-[80px]">Hapus</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-20">
                    <Loader2 className="animate-spin mx-auto text-teal-600" />
                  </td>
                </tr>
              ) : (
                data.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50 transition-colors group"
                  >
                    {/* NAMA KECAMATAN */}
                    <td className="px-6 py-4 font-black text-slate-700 uppercase text-xs sticky left-0 bg-white group-hover:bg-slate-50 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                      <div className="flex items-center gap-2">
                        <MapPin size={14} className="text-teal-500" />
                        {item.kecamatan || item.kecamatan_name}
                      </div>
                    </td>

                    {/* INPUT 1: BIAYA LAYANAN */}
                    <td className="px-4 py-4 bg-blue-50/10 border-l border-slate-50">
                      <CurrencyInput
                        value={item.buyer_service_fee}
                        onChange={(val) =>
                          handleUpdate(item.id, "buyer_service_fee", val)
                        }
                      />
                    </td>
                    {/* INPUT 2: POTONGAN KURIR */}
                    <td className="px-4 py-4 bg-blue-50/10">
                      <CurrencyInput
                        value={item.courier_app_fee}
                        onChange={(val) =>
                          handleUpdate(item.id, "courier_app_fee", val)
                        }
                      />
                    </td>

                    {/* INPUT 3: MAX TOKO */}
                    <td className="px-4 py-4 bg-orange-50/10 border-l border-slate-50 text-center">
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
                        className="bg-slate-100 w-12 text-center py-1.5 rounded font-black text-xs text-orange-600 focus:bg-white focus:ring-2 ring-orange-200 outline-none transition-all"
                      />
                    </td>

                    {/* INPUT 4: EXTRA CHARGE */}
                    <td className="px-4 py-4 bg-orange-50/10">
                      <CurrencyInput
                        value={item.extra_fee_per_merchant}
                        onChange={(val) =>
                          handleUpdate(item.id, "extra_fee_per_merchant", val)
                        }
                        color="text-orange-600"
                      />
                    </td>

                    {/* INPUT 5: JATAH KURIR */}
                    <td className="px-4 py-4 bg-orange-50/10">
                      <CurrencyInput
                        value={item.driver_extra_share}
                        onChange={(val) =>
                          handleUpdate(item.id, "driver_extra_share", val)
                        }
                        color="text-green-600"
                      />
                    </td>

                    {/* AKSI */}
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
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
      <div className="grid md:grid-cols-2 gap-4">
        <div className="p-5 bg-blue-50 rounded-2xl border border-blue-100 flex gap-3 items-start">
          <User size={20} className="text-blue-600 mt-1" />
          <div>
            <h4 className="text-xs font-black text-blue-700 uppercase">
              Single Order
            </h4>
            <p className="text-[10px] text-blue-600/80 mt-1 leading-relaxed">
              Pengaturan biaya standar saat pembeli hanya belanja di 1 toko.
              Biaya layanan dibebankan ke pembeli, Potongan Kurir diambil dari
              saldo dompet kurir.
            </p>
          </div>
        </div>
        <div className="p-5 bg-orange-50 rounded-2xl border border-orange-100 flex gap-3 items-start">
          <Store size={20} className="text-orange-600 mt-1" />
          <div>
            <h4 className="text-xs font-black text-orange-700 uppercase">
              Multi-Merchant (Baru)
            </h4>
            <p className="text-[10px] text-orange-600/80 mt-1 leading-relaxed">
              Jika pembeli belanja di 3 toko sekaligus, mereka dikenakan{" "}
              <b>Extra Charge</b> per toko tambahan. Admin bisa mengatur berapa
              % jatah yang masuk ke <b>Kurir</b> vs Aplikasi.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Sub-Component untuk Input Rupiah yang Rapi
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
    <div className="flex items-center gap-1 bg-white border border-slate-200 px-3 py-1.5 rounded-lg focus-within:border-teal-500 focus-within:ring-2 ring-teal-100 transition-all shadow-sm">
      <span className="text-[10px] font-bold text-slate-400">Rp</span>
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

// --- FIX UTAMA: EXPORT DEFAULT ---
export default RegionalFinance;
