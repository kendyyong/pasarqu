import React from "react";
import { Search, Eye } from "lucide-react";

interface Props {
  type: "merchants" | "couriers" | "customers";
  data: any[];
  onViewDetail: (user: any) => void;
}

export const LocalUsersTab: React.FC<Props> = ({
  type,
  data,
  onViewDetail,
}) => {
  return (
    <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden animate-in fade-in">
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
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[10px] font-black uppercase text-slate-400 border-b border-slate-50">
              <th className="p-6 md:p-8">Identitas</th>
              <th className="p-6 md:p-8">Kontak & Alamat</th>
              {type !== "customers" && <th className="p-6 md:p-8">Status</th>}
              <th className="p-6 md:p-8 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr
                key={item.id}
                className="border-b last:border-0 border-slate-50 hover:bg-slate-50/50 transition-all"
              >
                <td className="p-6 md:p-8">
                  <h4 className="font-black text-slate-800 text-sm uppercase">
                    {item.shop_name || item.name}
                  </h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">
                    {item.vehicle_type
                      ? `${item.vehicle_type} - ${item.plat_number}`
                      : item.role}
                  </p>
                </td>
                <td className="p-6 md:p-8">
                  <p className="text-xs font-bold text-slate-600">
                    {item.phone_number}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate max-w-[200px]">
                    {item.address || "Alamat tidak ada"}
                  </p>
                </td>
                {type !== "customers" && (
                  <td className="p-6 md:p-8">
                    {item.is_verified ? (
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-600 text-[9px] font-black rounded-full">
                        AKTIF
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-orange-100 text-orange-600 text-[9px] font-black rounded-full">
                        PENDING
                      </span>
                    )}
                  </td>
                )}
                <td className="p-6 md:p-8 text-right">
                  <button
                    onClick={() => onViewDetail(item)}
                    className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-teal-500 hover:text-white transition-all flex items-center gap-2 ml-auto"
                  >
                    <Eye size={14} /> Detail
                  </button>
                </td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="p-8 text-center text-slate-400 font-bold text-xs"
                >
                  Tidak ada data ditemukan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
