import React, { useState } from "react";
import { Search, Eye, Trash2 } from "lucide-react";
import { supabase } from "../../../../lib/supabaseClient";
import { useToast } from "../../../../contexts/ToastContext";

interface Props {
  type: "merchants" | "couriers" | "customers";
  data: any[];
  onViewDetail: (user: any) => void;
  onRefresh?: () => void;
}

export const LocalUsersTab: React.FC<Props> = ({
  type,
  data,
  onViewDetail,
  onRefresh,
}) => {
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");

  const handleDelete = async (item: any) => {
    if (
      window.confirm(
        `Hapus permanen akun ${item.shop_name || item.full_name || item.name}? Tindakan ini tidak bisa dibatalkan.`,
      )
    ) {
      try {
        const { error } = await supabase
          .from("profiles")
          .delete()
          .eq("id", item.id);
        if (error) throw error;

        showToast("Data berhasil dihapus selamanya", "success");
        if (onRefresh) onRefresh();
      } catch (err: any) {
        showToast(err.message, "error");
      }
    }
  };

  const filteredData = data.filter((item) =>
    (item.shop_name || item.full_name || item.name || "")
      .toLowerCase()
      .includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden animate-in fade-in">
      {/* HEADER TABEL */}
      <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
        <h3 className="font-black text-sm uppercase tracking-widest text-slate-700">
          Database {type}
        </h3>
        <div className="relative hidden md:block">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={16}
          />
          <input
            type="text"
            placeholder="Cari data..."
            className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-teal-500 transition-all w-64"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[10px] font-black uppercase text-slate-400 border-b border-slate-50">
              <th className="p-6 md:p-8">Identitas</th>
              <th className="p-6 md:p-8">Kontak & Alamat</th>
              {type !== "customers" && (
                <th className="p-6 md:p-8 text-center">Status</th>
              )}
              <th className="p-6 md:p-8 text-right tracking-widest">
                Kontrol Aksi
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((item) => (
              <tr
                key={item.id}
                className={`border-b last:border-0 border-slate-50 transition-all ${
                  item.status === "SUSPENDED"
                    ? "bg-red-50/40" // Tetap beri tanda warna jika sedang beku
                    : "hover:bg-slate-50/50"
                }`}
              >
                <td className="p-6 md:p-8">
                  <h4 className="font-black text-slate-800 text-sm uppercase">
                    {item.shop_name || item.full_name || item.name}
                  </h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">
                    {item.vehicle_type
                      ? `${item.vehicle_type} - ${item.plat_number}`
                      : item.role || "Mitra"}
                  </p>
                </td>
                <td className="p-6 md:p-8">
                  <p className="text-xs font-bold text-slate-600">
                    {item.phone_number || item.phone || "-"}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate max-w-[200px]">
                    {item.address || "Alamat tidak ada"}
                  </p>
                </td>

                {/* STATUS COLUMN */}
                {type !== "customers" && (
                  <td className="p-6 md:p-8 text-center">
                    {item.status === "SUSPENDED" ? (
                      <span className="px-3 py-1 bg-red-100 text-red-600 text-[9px] font-black rounded-full uppercase tracking-tighter shadow-sm">
                        Akun Beku
                      </span>
                    ) : item.is_verified ? (
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-600 text-[9px] font-black rounded-full uppercase tracking-tighter shadow-sm">
                        Aktif
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-orange-100 text-orange-600 text-[9px] font-black rounded-full uppercase tracking-tighter shadow-sm">
                        Pending
                      </span>
                    )}
                  </td>
                )}

                {/* ACTION BUTTONS */}
                <td className="p-6 md:p-8">
                  <div className="flex items-center justify-end gap-3">
                    {/* DETAIL & EDIT (Pintu Masuk Utama) */}
                    <button
                      onClick={() => onViewDetail(item)}
                      className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-teal-500 hover:text-white transition-all flex items-center gap-2 shadow-sm active:scale-95"
                    >
                      <Eye size={14} /> Detail / Edit
                    </button>

                    {/* DELETE */}
                    <button
                      onClick={() => handleDelete(item)}
                      className="p-2.5 bg-slate-100 text-slate-400 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm active:scale-95"
                      title="Hapus Akun Permanen"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredData.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="p-20 text-center text-slate-300 font-black uppercase text-xs tracking-widest"
                >
                  Data Tidak Ditemukan
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
