import React from "react";
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

// --- IMPORT CUSTOM HOOK & UI ---
import { useRegionalFinance } from "../../../hooks/useRegionalFinance"; // Sesuaikan path jika berbeda
import { CurrencyInput } from "../../../components/ui/CurrencyInput";
import { supabase } from "../../../lib/supabaseClient";
import { useToast } from "../../../contexts/ToastContext";

const RegionalFinance: React.FC = () => {
  const { showToast } = useToast();

  // Memakai Hook yang sudah Juragan buat
  // Note: Karena ini halaman admin, kita kirim undefined agar hook mengambil list (opsional)
  // atau Juragan bisa modifikasi hooknya sedikit untuk handle fetching all.
  const { regionalSettings, loading } = useRegionalFinance(undefined);

  // --- LOCAL STATE UNTUK TABLE LIST (Karena hook Juragan hanya fetch single) ---
  // Idealnya logika fetch ALL ini juga masuk ke Hook, tapi kita taruh sini agar script ini FULL & JALAN.
  const [data, setData] = React.useState<any[]>([]);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const fetchAllSettings = async () => {
    setIsRefreshing(true);
    const { data: res } = await supabase
      .from("kecamatan_finance_settings")
      .select("*")
      .order("kecamatan_name", { ascending: true });
    if (res) setData(res);
    setIsRefreshing(false);
  };

  React.useEffect(() => {
    fetchAllSettings();
  }, []);

  const handleUpdate = async (id: string, field: string, value: any) => {
    const { error } = await supabase
      .from("kecamatan_finance_settings")
      .update({ [field]: value })
      .eq("id", id);

    if (error) {
      showToast("Gagal update: " + error.message, "error");
    } else {
      showToast("Data tersimpan", "success");
      setData(
        data.map((item) =>
          item.id === id ? { ...item, [field]: value } : item,
        ),
      );
    }
  };

  const handleAddKecamatan = async () => {
    const name = prompt("Masukkan Nama Kecamatan Baru:");
    if (!name) return;

    const { error } = await supabase.from("kecamatan_finance_settings").insert([
      {
        kecamatan_name: name,
        buyer_service_fee: 2000,
        courier_app_fee: 1000,
        is_active: true,
      },
    ]);

    if (!error) {
      fetchAllSettings();
      showToast("Kecamatan berhasil ditambah", "success");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus pengaturan wilayah ini?")) return;
    const { error } = await supabase
      .from("kecamatan_finance_settings")
      .delete()
      .eq("id", id);
    if (!error) {
      setData(data.filter((item) => item.id !== id));
      showToast("Terhapus", "success");
    }
  };

  return (
    <div className="space-y-6 text-left animate-in fade-in duration-500 pb-20">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">
            Regional <span className="text-teal-600">Finance</span>
          </h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">
            Manajemen Biaya Layanan & Komisi Wilayah
          </p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button
            onClick={fetchAllSettings}
            className="p-3 bg-white border border-slate-200 text-slate-400 hover:text-teal-600 rounded-xl transition-all"
          >
            <RefreshCw
              size={18}
              className={isRefreshing ? "animate-spin" : ""}
            />
          </button>
          <button
            onClick={handleAddKecamatan}
            className="flex-1 md:flex-none bg-slate-900 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-teal-600 transition-all shadow-lg"
          >
            <Plus size={16} /> Tambah Wilayah
          </button>
        </div>
      </div>

      {/* TABLE SECTION */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                <th className="px-8 py-5 text-left">Wilayah / Kecamatan</th>
                <th className="px-4 py-5 text-center">Biaya Layanan (Buyer)</th>
                <th className="px-4 py-5 text-center">Potongan App (Kurir)</th>
                <th className="px-6 py-5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isRefreshing && data.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-20 text-center">
                    <Loader2
                      className="animate-spin mx-auto text-teal-600"
                      size={32}
                    />
                  </td>
                </tr>
              ) : (
                data.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    <td className="px-8 py-5 font-black text-slate-700 uppercase text-xs">
                      <div className="flex items-center gap-3">
                        <MapPin size={14} className="text-teal-500" />
                        {item.kecamatan_name}
                      </div>
                    </td>
                    <td className="px-4 py-5">
                      <CurrencyInput
                        value={item.buyer_service_fee}
                        onChange={(val) =>
                          handleUpdate(item.id, "buyer_service_fee", val)
                        }
                      />
                    </td>
                    <td className="px-4 py-5">
                      <CurrencyInput
                        value={item.courier_app_fee}
                        onChange={(val) =>
                          handleUpdate(item.id, "courier_app_fee", val)
                        }
                        color="text-orange-600"
                      />
                    </td>
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
    </div>
  );
};

export default RegionalFinance;
