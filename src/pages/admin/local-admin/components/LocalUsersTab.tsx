import React, { useState } from "react";
// 🚀 IMPORT DIPERBAIKI: Package dan Info sudah ditambahkan
import {
  Search,
  Eye,
  Trash2,
  Store,
  User,
  RefreshCw,
  MapPin,
  Phone,
  Package,
  Info,
} from "lucide-react";
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
        `HAPUS PERMANEN AKUN ${item.shop_name || item.full_name || item.name}? TINDAKAN INI TIDAK BISA DIBATALKAN.`,
      )
    ) {
      try {
        const { error } = await supabase
          .from("profiles")
          .delete()
          .eq("id", item.id);
        if (error) throw error;

        showToast("DATA BERHASIL DIHAPUS SELAMANYA", "success");
        if (onRefresh) onRefresh();
      } catch (err: any) {
        showToast("GAGAL: " + err.message, "error");
      }
    }
  };

  const filteredData = data.filter((item) =>
    (item.shop_name || item.full_name || item.name || "")
      .toLowerCase()
      .includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="space-y-4 animate-in fade-in duration-500 font-black uppercase tracking-tighter text-left pb-20">
      {/* 🛠️ HEADER TOOLBAR INDUSTRIAL */}
      <div className="bg-slate-900 p-4 rounded-xl flex flex-col md:flex-row justify-between items-center gap-4 border-b-4 border-[#008080] shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#008080] rounded-lg flex items-center justify-center text-white shadow-lg">
            {type === "merchants" ? <Store size={20} /> : <User size={20} />}
          </div>
          <div>
            <h2 className="text-white text-[12px] leading-none">
              DATABASE{" "}
              {type === "merchants"
                ? "MITRA TOKO"
                : type === "couriers"
                  ? "UNIT KURIR"
                  : "PELANGGAN"}
            </h2>
            <p className="text-[#008080] text-[10px] mt-1 tracking-widest uppercase">
              KONTROL AKSES WILAYAH: {data.length} ENTITAS
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
              size={14}
            />
            <input
              type="text"
              placeholder="CARI NAMA / IDENTITAS..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800 border-none text-white text-[12px] py-3 pl-10 pr-4 rounded-lg outline-none focus:ring-2 focus:ring-[#FF6600]"
            />
          </div>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-3 bg-slate-800 text-[#008080] rounded-lg hover:bg-slate-700 transition-colors border border-slate-700"
            >
              <RefreshCw size={18} />
            </button>
          )}
        </div>
      </div>

      {/* 📊 TABEL DATA */}
      <div className="bg-white border-2 border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-black uppercase text-slate-500 border-b-2 border-slate-200">
                <th className="p-5">IDENTITAS ENTITAS</th>
                <th className="p-5">KONTAK & LOKASI</th>
                {type !== "customers" && (
                  <th className="p-5 text-center">STATUS AUDIT</th>
                )}
                <th className="p-5 text-right">AKSI KONTROL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.map((item) => (
                <tr
                  key={item.id}
                  className={`transition-all ${
                    item.status === "SUSPENDED"
                      ? "bg-red-50/50"
                      : "hover:bg-slate-50/80"
                  }`}
                >
                  <td className="p-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 border border-slate-200">
                        {type === "merchants" ? (
                          <Store size={18} />
                        ) : (
                          <User size={18} />
                        )}
                      </div>
                      <div>
                        <h4 className="font-black text-slate-900 text-[12px] uppercase leading-none mb-1">
                          {item.shop_name || item.full_name || item.name}
                        </h4>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-tighter">
                          {item.vehicle_type
                            ? `${item.vehicle_type} - ${item.plat_number}`
                            : item.role || "MEMBER"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="p-5">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Phone size={12} className="text-[#FF6600]" />
                        <span className="text-[12px] font-black">
                          {item.phone_number || "-"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-400">
                        <MapPin size={12} className="text-[#008080]" />
                        <span className="text-[10px] font-black truncate max-w-[250px] uppercase">
                          {item.address || "ALAMAT TIDAK TERTERA"}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* STATUS AUDIT */}
                  {type !== "customers" && (
                    <td className="p-5 text-center">
                      {item.status === "SUSPENDED" ? (
                        <span className="px-3 py-1 bg-red-600 text-white text-[9px] font-black rounded-md uppercase">
                          DIBEKUKAN
                        </span>
                      ) : item.is_verified ? (
                        <span className="px-3 py-1 bg-[#008080] text-white text-[9px] font-black rounded-md uppercase">
                          AKTIF
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-[#FF6600] text-white text-[9px] font-black rounded-md uppercase">
                          PENDING
                        </span>
                      )}
                    </td>
                  )}

                  {/* AKSI KONTROL */}
                  <td className="p-5">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onViewDetail(item)}
                        className="px-4 py-2.5 bg-slate-100 text-slate-900 border-b-4 border-slate-300 rounded-lg font-black text-[10px] uppercase hover:bg-[#008080] hover:text-white hover:border-[#006666] transition-all flex items-center gap-2 active:scale-95"
                      >
                        <Eye size={14} /> LIHAT DETAIL
                      </button>

                      <button
                        onClick={() => handleDelete(item)}
                        className="p-2.5 bg-white text-red-500 border-2 border-red-50 rounded-lg hover:bg-red-600 hover:text-white hover:border-red-700 transition-all shadow-sm active:scale-95"
                        title="HAPUS PERMANEN"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredData.length === 0 && (
          <div className="p-20 text-center flex flex-col items-center justify-center">
            <Package size={40} className="text-slate-200 mb-4" />
            <h3 className="text-slate-400 font-black uppercase text-[12px] tracking-widest">
              DATA TIDAK DITEMUKAN DALAM DATABASE
            </h3>
          </div>
        )}
      </div>

      {/* ⚙️ INFO FOOTER */}
      <div className="p-4 bg-orange-50 border-2 border-orange-100 rounded-xl flex items-center gap-4">
        <Info size={24} className="text-[#FF6600]" />
        <p className="text-[12px] leading-tight text-orange-900 font-black uppercase">
          KEBIJAKAN PRIVASI: HAPUS DATA HANYA JIKA MITRA TERBUKTI MELANGGAR
          ATURAN ATAU ATAS PERMINTAAN PENGGUNA TERKAIT.
        </p>
      </div>
    </div>
  );
};
