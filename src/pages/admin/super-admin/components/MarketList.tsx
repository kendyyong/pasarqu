import React from "react";
import {
  Store,
  SearchCode,
  Edit3,
  Trash2,
  MapPin,
  Search,
  Plus,
  RefreshCw,
} from "lucide-react";

interface Props {
  markets: any[];
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  onAdd: () => void;
  onEdit: (market: any) => void;
  onDelete: (id: string, name: string) => void;
  onAudit: (market: any) => void;
  onRefresh: () => void;
}

export const MarketList: React.FC<Props> = ({
  markets,
  searchTerm,
  setSearchTerm,
  onAdd,
  onEdit,
  onDelete,
  onAudit,
  onRefresh,
}) => {
  const filtered = markets.filter(
    (m) =>
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.district?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-3 animate-in fade-in duration-500 font-black uppercase tracking-tighter">
      {/* HEADER TOOLBAR */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-white p-3 rounded-xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-teal-50 text-[#008080] rounded-lg flex items-center justify-center">
            <Store size={20} />
          </div>
          <div>
            <h2 className="text-[14px] font-black text-slate-900 leading-none">
              KELOLA PASAR
            </h2>
            <p className="text-[10px] text-slate-400 mt-1 tracking-widest">
              DATABASE ENGINE ACTIVE
            </p>
          </div>
        </div>

        <div className="flex w-full md:w-auto gap-2">
          <div className="relative flex-1 md:w-64">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={14}
            />
            <input
              type="text"
              placeholder="CARI PASAR..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 py-2.5 pl-9 pr-4 rounded-xl text-[12px] outline-none focus:ring-1 focus:ring-[#008080] font-black"
            />
          </div>
          <button
            onClick={onAdd}
            className="bg-[#FF6600] text-white px-4 py-2.5 rounded-xl flex items-center gap-2 text-[12px] shadow-sm hover:bg-slate-900 transition-all shrink-0"
          >
            <Plus size={16} /> TAMBAH
          </button>
          <button
            onClick={onRefresh}
            className="p-2.5 bg-slate-100 rounded-xl text-slate-600 hover:text-[#008080] transition-colors"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {/* GRID LIST */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-left">
        {filtered.map((m) => (
          <div
            key={m.id}
            className="bg-white rounded-xl shadow-sm overflow-hidden flex flex-col border border-slate-50 hover:shadow-md transition-all group"
          >
            <div className="p-4 border-b border-slate-50 flex justify-between items-start">
              <div className="min-w-0">
                <h4 className="text-[14px] font-black text-slate-900 leading-tight truncate group-hover:text-[#008080] transition-colors uppercase">
                  {m.name}
                </h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-teal-600 font-black bg-teal-50 px-2 py-0.5 rounded uppercase">
                    {m.district || "WILAYAH"}
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">
                    {m.city || "KOTA"}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => onAudit(m)}
                  className="p-3 bg-teal-50 text-[#008080] rounded-xl hover:bg-[#008080] hover:text-white transition-all shadow-sm"
                  title="Detail/Audit"
                >
                  <SearchCode size={18} />
                </button>
                <button
                  onClick={() => onEdit(m)}
                  className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-orange-50 hover:text-[#FF6600] transition-all shadow-sm"
                  title="Edit"
                >
                  <Edit3 size={18} />
                </button>
                <button
                  onClick={() => onDelete(m.id, m.name)}
                  className="p-3 bg-red-50 text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm"
                  title="Hapus"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            {/* AREA ALAMAT - SEKARANG BISA DIKLIK */}
            <div className="p-4 bg-slate-50/50">
              <button
                onClick={() =>
                  window.open(
                    `https://www.google.com/maps?q=${m.lat},${m.lng}`,
                    "_blank",
                  )
                }
                className="group/loc flex items-start gap-2 text-left w-full transition-all"
                title="Buka Lokasi di Google Maps"
              >
                <MapPin
                  size={16}
                  className="shrink-0 text-[#FF6600] mt-0.5 group-hover/loc:scale-125 transition-transform"
                />
                <span className="text-[11px] text-slate-500 font-bold tracking-tight leading-snug group-hover/loc:text-[#008080] transition-colors">
                  {m.address}
                </span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
