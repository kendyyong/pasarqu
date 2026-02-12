import React, { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import {
  ShieldCheck,
  Eye,
  Search,
  Filter,
  Clock,
  User,
  Activity, // Sudah diperbaiki dari 'activity' menjadi 'Activity'
  HardDrive,
  Loader2,
} from "lucide-react";

export const ActivityLogs = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
    if (act.includes("DELETE")) return "bg-red-100 text-red-600";
    if (act.includes("UPDATE") || act.includes("APPROVE"))
      return "bg-blue-100 text-blue-600";
    if (
      act.includes("INSERT") ||
      act.includes("CREATE") ||
      act.includes("SEND")
    )
      return "bg-green-100 text-green-600";
    return "bg-slate-100 text-slate-600";
  };

  return (
    <div className="space-y-6 animate-in fade-in pb-20 text-left">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter flex items-center gap-2">
            <ShieldCheck className="text-teal-600" size={24} />
            System Audit Logs
          </h2>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
            Rekam Jejak Aktivitas Administrator
          </p>
        </div>
        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 text-slate-400">
          <Activity size={24} />
        </div>
      </div>

      {/* TABLE CARD */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="relative w-full md:w-96">
            <Search
              size={16}
              className="absolute left-3 top-3 text-slate-400"
            />
            <input
              type="text"
              placeholder="Cari aksi atau nama admin..."
              className="pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-xs font-bold w-full outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2.5 bg-slate-50 text-slate-600 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-slate-100 transition-all">
              <Filter size={16} /> Filter Kategori
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center py-20">
            <Loader2 className="animate-spin text-teal-600 mb-4" />
            <p className="text-xs font-bold text-slate-400">
              Mensinkronisasi CCTV Digital...
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                  <th className="px-8 py-4">Waktu</th>
                  <th className="px-8 py-4">Administrator</th>
                  <th className="px-8 py-4">Aksi</th>
                  <th className="px-8 py-4">Modul</th>
                  <th className="px-8 py-4">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-20 text-center">
                      <div className="flex flex-col items-center opacity-20">
                        <HardDrive size={48} />
                        <p className="mt-2 text-xs font-black uppercase tracking-[0.2em]">
                          Belum ada aktivitas tercatat
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr
                      key={log.id}
                      className="text-xs hover:bg-slate-50/50 transition-all group"
                    >
                      <td className="px-8 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-slate-500 font-medium">
                          <Clock size={14} className="text-slate-300" />
                          {new Date(log.created_at).toLocaleString("id-ID", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </td>
                      <td className="px-8 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-teal-50 text-teal-700 rounded-xl flex items-center justify-center text-[10px] font-black border border-teal-100">
                            {log.admin_name?.substring(0, 2).toUpperCase() ||
                              "SY"}
                          </div>
                          <span className="font-bold text-slate-700">
                            {log.admin_name || "System"}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-4">
                        <span
                          className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase ${getActionColor(log.action)}`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="px-8 py-4">
                        <span className="font-bold text-slate-400 uppercase tracking-tighter text-[10px] bg-slate-100 px-2 py-0.5 rounded">
                          {log.target_resource || "GLOBAL"}
                        </span>
                      </td>
                      <td className="px-8 py-4 text-slate-600 font-medium max-w-xs">
                        <p
                          className="truncate group-hover:whitespace-normal transition-all"
                          title={log.details}
                        >
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

      {/* FOOTER INFO */}
      <div className="flex items-center gap-2 bg-blue-50 p-4 rounded-2xl border border-blue-100 text-blue-700">
        <Eye size={16} />
        <p className="text-[10px] font-bold uppercase tracking-wider">
          Hanya menampilkan 100 aktivitas terbaru untuk menjaga performa sistem.
        </p>
      </div>
    </div>
  );
};
