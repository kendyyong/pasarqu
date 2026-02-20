import React, { useEffect, useState } from "react";
import { supabase } from "../../../../lib/supabaseClient";
import {
  ShieldCheck,
  Search,
  Filter,
  Clock,
  Activity,
  HardDrive,
  Loader2,
  RefreshCw,
  Database,
  ArrowRight,
} from "lucide-react";

export const ActivityLogs = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      setLogs(data || []);
    } catch (err) {
      console.error("Gagal mengambil logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const getActionColor = (action: string) => {
    const act = action.toUpperCase();
    if (act.includes("DELETE") || act.includes("REJECT"))
      return "bg-red-50 text-red-600 border-red-100";
    if (
      act.includes("UPDATE") ||
      act.includes("APPROVE") ||
      act.includes("RESOLVE")
    )
      return "bg-blue-50 text-blue-600 border-blue-100";
    if (
      act.includes("INSERT") ||
      act.includes("CREATE") ||
      act.includes("SEND")
    )
      return "bg-teal-50 text-teal-600 border-teal-100";
    return "bg-slate-50 text-slate-600 border-slate-200";
  };

  return (
    <div className="space-y-6 animate-in fade-in text-left font-black uppercase tracking-tighter">
      {/* HEADER AREA - SUDUT TEGAS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-4 border-slate-900 pb-4">
        <div>
          <h2 className="text-[18px] font-black text-slate-900 flex items-center gap-2">
            <ShieldCheck className="text-[#008080]" size={24} /> SYSTEM AUDIT
            LOGS
          </h2>
          <p className="text-[10px] text-slate-400 mt-1 tracking-widest font-black uppercase">
            REKAM JEJAK DIGITAL DAN CCTV SISTEM OPERASIONAL.
          </p>
        </div>
        <button
          onClick={fetchLogs}
          className="bg-white border-2 border-slate-200 text-slate-600 px-4 py-2 rounded-md text-[10px] font-black flex items-center gap-2 hover:bg-slate-900 hover:text-white transition-all active:scale-95 shadow-sm"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />{" "}
          REFRESH DATABASE
        </button>
      </div>

      {/* FILTER & SEARCH BAR - COMPACT */}
      <div className="bg-white p-4 rounded-md border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="CARI AKSI, ADMIN, ATAU DETAIL..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-md text-[11px] font-black outline-none focus:border-[#008080] transition-all uppercase"
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button className="flex-1 md:flex-none px-4 py-2 bg-slate-900 text-white rounded-md text-[9px] font-black tracking-widest flex items-center justify-center gap-2 hover:bg-[#008080] transition-all">
            <Filter size={14} /> FILTER MODUL
          </button>
        </div>
      </div>

      {/* DATA TABLE AREA */}
      <div className="bg-white rounded-md shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center py-32 gap-3">
            <Loader2 className="animate-spin text-[#008080]" size={32} />
            <p className="text-[10px] font-black text-slate-400 tracking-widest">
              MENYINKRONKAN CCTV DIGITAL...
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest border-b border-slate-800">
                  <th className="px-6 py-4 text-left w-44">TIMESTAMP</th>
                  <th className="px-6 py-4 text-left w-48">ADMINISTRATOR</th>
                  <th className="px-6 py-4 text-left w-40">AKSI</th>
                  <th className="px-6 py-4 text-left w-40">MODUL</th>
                  <th className="px-6 py-4 text-left">DETAIL AKTIVITAS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-20 text-center">
                      <div className="flex flex-col items-center opacity-20">
                        <HardDrive size={40} />
                        <p className="mt-3 text-[10px] font-black uppercase tracking-widest">
                          Belum ada aktivitas tercatat
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  logs
                    .filter(
                      (log) =>
                        searchTerm === "" ||
                        log.admin_name
                          ?.toLowerCase()
                          .includes(searchTerm.toLowerCase()) ||
                        log.action
                          ?.toLowerCase()
                          .includes(searchTerm.toLowerCase()) ||
                        log.details
                          ?.toLowerCase()
                          .includes(searchTerm.toLowerCase()),
                    )
                    .map((log) => (
                      <tr
                        key={log.id}
                        className="hover:bg-slate-50 transition-all group"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-slate-500 font-black text-[10px]">
                            <Clock size={12} className="text-[#FF6600]" />
                            {new Date(log.created_at).toLocaleString("id-ID", {
                              day: "2-digit",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 bg-slate-100 rounded-md flex items-center justify-center text-[9px] font-black border border-slate-200">
                              {log.admin_name?.substring(0, 2).toUpperCase() ||
                                "SY"}
                            </div>
                            <span className="font-black text-slate-800 text-[11px] truncate max-w-[120px]">
                              {log.admin_name || "SYSTEM"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2 py-1 rounded text-[9px] font-black uppercase border ${getActionColor(log.action)}`}
                          >
                            {log.action}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-black text-slate-400 uppercase text-[9px] bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {log.target_resource || "GLOBAL"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-[11px] font-black text-slate-700 normal-case leading-relaxed group-hover:text-slate-900 transition-colors">
                            {log.details}
                          </p>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* FOOTER - INDUSTRIAL LOOK */}
      <div className="bg-slate-900 p-4 rounded-md flex items-center justify-between border-b-4 border-[#008080]">
        <div className="flex items-center gap-3">
          <Database className="text-[#008080]" size={18} />
          <p className="text-[10px] text-white/70 font-black tracking-widest uppercase">
            MENAMPILKAN 100 AKTIVITAS TERAKHIR • AUDIT LOG BERSIFAT PERMANEN.
          </p>
        </div>
        <div className="text-[10px] text-white font-black">
          ENTRY: {logs.length}
        </div>
      </div>
    </div>
  );
};
