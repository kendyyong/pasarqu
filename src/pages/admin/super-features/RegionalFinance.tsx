import React, { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import {
  MapPin,
  User,
  Bike,
  Save,
  Plus,
  Trash2,
  Loader2,
  Search,
} from "lucide-react";
import { useToast } from "../../../contexts/ToastContext";
import { createAuditLog } from "../../../lib/auditHelper";

export const RegionalFinance = () => {
  const { showToast } = useToast();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = async () => {
    setLoading(true);
    const { data: res } = await supabase
      .from("kecamatan_finance_settings")
      .select("*")
      .order("kecamatan_name");
    if (res) setData(res);
    setLoading(false);
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleUpdate = async (id: string, field: string, value: any) => {
    const { error } = await supabase
      .from("kecamatan_finance_settings")
      .update({ [field]: value })
      .eq("id", id);
    if (!error) {
      showToast("Berhasil diperbarui", "success");
      // Catat Log
      createAuditLog(
        "UPDATE_REGIONAL_FINANCE",
        "FINANCE",
        `Mengubah ${field} di salah satu kecamatan`,
      );
    }
  };

  const handleAddKecamatan = async () => {
    const name = prompt("Masukkan Nama Kecamatan:");
    if (!name) return;
    const { error } = await supabase
      .from("kecamatan_finance_settings")
      .insert([{ kecamatan_name: name }]);
    if (!error) fetchSettings();
  };

  return (
    <div className="space-y-6 text-left animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter">
            Regional Finance
          </h2>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
            Atur Biaya Berbeda per Kecamatan
          </p>
        </div>
        <button
          onClick={handleAddKecamatan}
          className="bg-slate-900 text-white px-5 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2"
        >
          <Plus size={16} /> Tambah Kecamatan
        </button>
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
              <th className="px-8 py-5">Nama Kecamatan</th>
              <th className="px-8 py-5 flex items-center gap-2">
                <User size={14} className="text-teal-600" /> Biaya Layanan
                (Pembeli)
              </th>
              <th className="px-8 py-5">
                <div className="flex items-center gap-2">
                  <Bike size={14} className="text-orange-500" /> Biaya Aplikasi
                  (Kurir)
                </div>
              </th>
              <th className="px-8 py-5 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr>
                <td colSpan={4} className="text-center py-20">
                  <Loader2 className="animate-spin mx-auto text-teal-600" />
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-slate-50/50 transition-all"
                >
                  <td className="px-8 py-4 font-black text-slate-700 uppercase text-xs">
                    {item.kecamatan_name}
                  </td>
                  <td className="px-8 py-4">
                    <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-lg w-40 border border-transparent focus-within:border-teal-500 transition-all">
                      <span className="text-[10px] font-bold text-slate-400">
                        Rp
                      </span>
                      <input
                        type="number"
                        defaultValue={item.buyer_service_fee}
                        onBlur={(e) =>
                          handleUpdate(
                            item.id,
                            "buyer_service_fee",
                            parseInt(e.target.value),
                          )
                        }
                        className="bg-transparent border-none outline-none text-xs font-black w-full"
                      />
                    </div>
                  </td>
                  <td className="px-8 py-4">
                    <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-lg w-40 border border-transparent focus-within:border-orange-500 transition-all">
                      <span className="text-[10px] font-bold text-slate-400">
                        Rp
                      </span>
                      <input
                        type="number"
                        defaultValue={item.courier_app_fee}
                        onBlur={(e) =>
                          handleUpdate(
                            item.id,
                            "courier_app_fee",
                            parseInt(e.target.value),
                          )
                        }
                        className="bg-transparent border-none outline-none text-xs font-black w-full"
                      />
                    </div>
                  </td>
                  <td className="px-8 py-4 text-right">
                    <button className="text-slate-300 hover:text-red-500 transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100 flex gap-4">
        <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center shrink-0">
          !
        </div>
        <p className="text-[11px] text-blue-700 font-bold leading-relaxed">
          INFO: Nilai di atas akan otomatis memotong pendapatan Kurir saat
          pesanan selesai dan menambah biaya pada nota Pembeli berdasarkan
          lokasi Toko/Pasar berada.
        </p>
      </div>
    </div>
  );
};
