import React, { useState, useEffect } from "react";
// --- PERBAIKAN IMPORT: Menambahkan ArrowRight dan Loader2 ---
import {
  ShieldCheck,
  Store,
  Bike,
  RefreshCw,
  CheckCircle,
  Zap,
  AlertTriangle,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { supabase } from "../../../lib/supabaseClient";
import { useAdminApproval } from "../../../hooks/useAdminApproval";
import { ApprovalTableRow } from "../components/ApprovalTableRow";

export const AdminApprovalPage: React.FC = () => {
  const [filterRole, setFilterRole] = useState<string>("ALL");
  const { loading, requests, processingId, fetchRequests, handleAction } =
    useAdminApproval(filterRole);

  // 🚨 STATE ALARM
  const [showAlarm, setShowAlarm] = useState(false);
  const [latestRegistrant, setLatestRegistrant] = useState<any>(null);

  // 🔊 REALTIME MONITORING
  useEffect(() => {
    const channel = supabase
      .channel("pendaftaran-baru")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "profiles",
        },
        (payload) => {
          if (
            payload.new.role === "COURIER" ||
            payload.new.role === "MERCHANT"
          ) {
            setLatestRegistrant(payload.new);
            setShowAlarm(true);
            const audio = new Audio("/sounds/alarm-system.mp3");
            audio.play().catch(() => console.log("Sound blocked by browser"));
            fetchRequests();
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchRequests]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-left uppercase font-black tracking-tighter">
      {/* 🚨 POP-UP ALARM MONITOR */}
      {showAlarm && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/90 backdrop-blur-md p-4">
          <div className="bg-white border-[6px] border-[#FF6600] w-full max-w-lg p-10 shadow-[20px_20px_0px_0px_rgba(255,102,0,1)] relative">
            <div className="absolute top-0 left-0 w-full h-2 bg-[#FF6600] animate-pulse"></div>
            <AlertTriangle
              size={64}
              className="text-[#FF6600] mb-6 animate-bounce mx-auto"
            />
            <h2 className="text-4xl text-slate-900 text-center leading-none mb-4 font-black">
              ADA PENDAFTAR BARU!
            </h2>
            <div className="bg-slate-100 p-6 rounded-xl border-2 border-slate-200 mb-8">
              <p className="text-[10px] text-slate-400 mb-1 tracking-widest uppercase">
                IDENTITAS MITRA:
              </p>
              <p className="text-xl text-slate-900">{latestRegistrant?.name}</p>
              <p className="text-[10px] text-[#008080] mt-2 tracking-widest uppercase">
                POSISI: {latestRegistrant?.role}
              </p>
            </div>
            <button
              onClick={() => setShowAlarm(false)}
              className="w-full py-5 bg-slate-900 text-white text-lg hover:bg-[#FF6600] transition-all flex items-center justify-center gap-3 active:scale-95 font-black"
            >
              MASUKKAN KE ANTREAN <ArrowRight size={24} />
            </button>
          </div>
        </div>
      )}

      {/* --- HEADER --- */}
      <div className="bg-white border-b-4 border-slate-900 sticky top-0 z-30 shadow-md">
        <div className="max-w-[1200px] mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-slate-900 rounded-lg flex items-center justify-center text-white border-b-4 border-[#008080]">
              <ShieldCheck size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tighter leading-none uppercase">
                VERIFIKASI MITRA
              </h1>
              <p className="text-[10px] text-slate-400 font-bold tracking-[0.2em] mt-1 uppercase">
                OPS CENTER MUARA JAWA
              </p>
            </div>
          </div>

          <button
            onClick={fetchRequests}
            className="p-3 bg-slate-100 rounded-lg hover:bg-slate-900 hover:text-white transition-all border-2 border-slate-200"
          >
            <RefreshCw size={24} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      <main className="max-w-[1200px] mx-auto p-6">
        {/* --- TAB FILTERS --- */}
        <div className="flex flex-wrap gap-3 mb-10">
          <FilterButton
            active={filterRole === "ALL"}
            label="SEMUA ANTREAN"
            onClick={() => setFilterRole("ALL")}
          />
          <FilterButton
            active={filterRole === "COURIER"}
            label="CALON KURIR"
            icon={<Bike size={18} />}
            onClick={() => setFilterRole("COURIER")}
          />
          <FilterButton
            active={filterRole === "MERCHANT"}
            label="CALON TOKO"
            icon={<Store size={18} />}
            onClick={() => setFilterRole("MERCHANT")}
          />
        </div>

        {/* --- MAIN DATA CONTAINER --- */}
        <div className="bg-white rounded-xl border-4 border-slate-900 shadow-[12px_12px_0px_0px_rgba(0,0,0,0.1)] overflow-hidden">
          {loading ? (
            <div className="p-24 text-center">
              <Loader2
                className="animate-spin text-[#008080] mx-auto mb-4"
                size={48}
              />
              <p className="text-[10px] text-slate-400 tracking-[0.3em] font-black uppercase">
                SINKRONISASI DATABASE...
              </p>
            </div>
          ) : requests.length === 0 ? (
            <div className="p-24 text-center">
              <CheckCircle size={60} className="text-slate-200 mx-auto mb-4" />
              <h3 className="text-2xl text-slate-800 font-black italic uppercase">
                ANTREAN BERSIH!
              </h3>
              <p className="text-[10px] text-slate-400 mt-2 font-black uppercase tracking-widest">
                TIDAK ADA DATA UNTUK VERIFIKASI
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-900 text-white border-b-4 border-[#008080]">
                    <th className="px-8 py-5 text-[11px] tracking-widest uppercase font-black">
                      MITRA / DATA BERKAS
                    </th>
                    <th className="px-8 py-5 text-[11px] tracking-widest uppercase font-black">
                      ROLE
                    </th>
                    <th className="px-8 py-5 text-[11px] tracking-widest text-center uppercase font-black">
                      TINDAKAN
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-slate-100">
                  {requests.map((req) => (
                    <ApprovalTableRow
                      key={req.id}
                      request={req}
                      processingId={processingId}
                      onAction={handleAction}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

const FilterButton = ({ active, label, onClick, icon }: any) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-8 py-4 rounded-xl text-[11px] font-black tracking-widest transition-all active:scale-95 border-2 uppercase ${
      active
        ? "bg-slate-900 text-white border-slate-900 shadow-lg"
        : "bg-white text-slate-500 border-slate-200 hover:border-[#008080]"
    }`}
  >
    {icon} {label}
  </button>
);
