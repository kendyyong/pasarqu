import React, { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabaseClient";
import {
  Star,
  ShieldCheck,
  ShieldAlert,
  FileText,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  UserCheck,
  Search,
  BrainCircuit,
  Loader2,
  RefreshCw,
  MoreVertical,
  Ban,
} from "lucide-react";
import { useToast } from "../../../contexts/ToastContext";

interface Props {
  merchants: any[];
  couriers: any[];
}

export const LocalRatingsTab: React.FC<Props> = ({ merchants, couriers }) => {
  const { showToast } = useToast();
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  // AI States
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [aiAuditResult, setAiAuditResult] = useState<any>(null);

  // --- FITUR AI: AUDIT PERFORMA WILAYAH ---
  const runAiAudit = async () => {
    setIsAiAnalyzing(true);
    setAiAuditResult(null);
    try {
      await new Promise((res) => setTimeout(res, 2500));

      const mockAiVerdict = {
        score: 8.5,
        summary:
          "Performa Wilayah Unggul. Mayoritas kurir dipuji karena 'Ramah' dan 'Cepat'. Namun, ada tren keluhan pada Toko Sayur terkait 'Packing Plastik Mudah Pecah'.",
        redFlags: [
          "Kurir Ahmad (ID: 022) sering mendapat bintang 1 di jam malam.",
          "Ayam Pak Kumis ulasan menurun 20% minggu ini.",
        ],
        action: "Saran AI: Kirim edukasi standar packing ke semua Merchant.",
      };

      setAiAuditResult(mockAiVerdict);
      showToast("AI Audit Selesai!", "success");
    } catch (err) {
      showToast("Gagal melakukan AI Audit", "error");
    } finally {
      setIsAiAnalyzing(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 text-left pb-20">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter italic">
            Quality <span className="text-teal-600">Control</span>
          </h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
            Pantau ulasan warga & legalitas mitra secara real-time
          </p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              size={16}
            />
            <input
              type="text"
              placeholder="CARI MITRA..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-12 pr-6 py-3.5 bg-white border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest focus:ring-2 focus:ring-teal-500 outline-none w-full md:w-64 shadow-sm"
            />
          </div>
          <button
            onClick={runAiAudit}
            disabled={isAiAnalyzing}
            className="p-3.5 bg-slate-900 text-teal-400 rounded-2xl shadow-lg hover:bg-slate-800 transition-all active:scale-95"
          >
            {isAiAnalyzing ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <BrainCircuit size={20} />
            )}
          </button>
        </div>
      </div>

      {/* AI AUDIT RESULT */}
      {aiAuditResult && (
        <div className="bg-indigo-600 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl animate-in zoom-in-95">
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-8">
            <div className="md:col-span-8 space-y-4">
              <div className="flex items-center gap-2">
                <SparkleIcon className="text-indigo-300 animate-pulse" />
                <h4 className="text-sm font-black uppercase tracking-[0.2em]">
                  AI Performance Audit
                </h4>
              </div>
              <p className="text-lg font-bold leading-relaxed">
                "{aiAuditResult.summary}"
              </p>
              <div className="space-y-2 pt-2">
                {aiAuditResult.redFlags.map((flag: string, i: number) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 text-[10px] font-black text-indigo-200 uppercase"
                  >
                    <ShieldAlert size={12} className="text-orange-400" /> {flag}
                  </div>
                ))}
              </div>
            </div>
            <div className="md:col-span-4 flex flex-col items-center justify-center border-l border-white/10">
              <p className="text-[10px] font-black uppercase opacity-60 mb-2">
                Wilayah Health Score
              </p>
              <h2 className="text-6xl font-black italic">
                {aiAuditResult.score}
                <span className="text-xl opacity-40">/10</span>
              </h2>
              <button
                onClick={() => setAiAuditResult(null)}
                className="mt-6 text-[9px] font-black uppercase tracking-widest bg-white/10 px-4 py-2 rounded-full hover:bg-white/20 transition-all"
              >
                Tutup Audit
              </button>
            </div>
          </div>
          <BrainCircuit
            className="absolute -right-10 -bottom-10 text-white/5"
            size={250}
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col">
          <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-8 flex items-center gap-2">
            <ShieldCheck size={18} className="text-teal-600" /> Dokumen
            Legalitas Mitra
          </h4>
          <div className="space-y-4 flex-1">
            {merchants.slice(0, 5).map((m, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-5 bg-slate-50/50 rounded-3xl border border-slate-100 hover:bg-white hover:shadow-xl hover:border-teal-200 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:bg-teal-50">
                    <FileText
                      size={22}
                      className="text-slate-400 group-hover:text-teal-600"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-800 uppercase tracking-tight leading-none">
                      {m.shop_name || m.full_name}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[8px] font-black bg-teal-100 text-teal-600 px-2 py-0.5 rounded uppercase">
                        KTP Verified
                      </span>
                      <span className="text-[8px] font-black bg-blue-100 text-blue-600 px-2 py-0.5 rounded uppercase">
                        NIB
                      </span>
                    </div>
                  </div>
                </div>
                <button className="p-2.5 bg-white text-slate-400 rounded-xl hover:bg-slate-900 hover:text-white transition-all">
                  <MoreVertical size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-8 flex items-center gap-2">
            <Star size={18} className="text-orange-500" /> Testimoni Warga
          </h4>
          <div className="space-y-6">
            {couriers.slice(0, 3).map((c, i) => (
              // ✅ FIX: properti 'delay' diganti menjadi 'animationDelay'
              <div
                key={i}
                className="animate-in slide-in-from-right-4 duration-500"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-xs shadow-lg uppercase">
                      {c.full_name?.charAt(0)}
                    </div>
                    <div>
                      <span className="text-[11px] font-black text-slate-700 uppercase block">
                        {c.full_name}
                      </span>
                      <p className="text-[8px] font-bold text-slate-400 uppercase italic">
                        Kurir Wilayah
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        size={10}
                        className={`${s <= 4 ? "fill-orange-400 text-orange-400" : "text-slate-200"}`}
                      />
                    ))}
                  </div>
                </div>
                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 relative group">
                  <p className="text-xs text-slate-600 leading-relaxed font-medium italic">
                    "Kurirnya ramah banget, sayurannya masih segar pas nyampe.
                    Sangat membantu kalau lagi sibuk kerja di kantor."
                  </p>
                  <div className="flex justify-between items-center mt-4">
                    <p className="text-[8px] font-black text-teal-600 uppercase tracking-widest">
                      — Member Premium @{i + 1}23
                    </p>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                      <button className="p-1.5 bg-white rounded-lg text-slate-400 hover:text-blue-500 shadow-sm">
                        <ThumbsUp size={12} />
                      </button>
                      <button className="p-1.5 bg-white rounded-lg text-slate-400 hover:text-red-500 shadow-sm">
                        <ThumbsDown size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-slate-900 p-10 rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex items-center gap-6 text-left relative z-10">
          <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-[2rem] flex items-center justify-center shadow-inner border border-red-500/20">
            <ShieldAlert size={40} className="animate-pulse" />
          </div>
          <div>
            <h4 className="text-lg font-black text-white uppercase tracking-widest mb-1 italic">
              Peringatan Integritas Area
            </h4>
            <p className="text-[11px] text-slate-400 font-medium leading-relaxed max-w-md">
              Sistem mendeteksi 2 Mitra dengan rating{" "}
              <span className="text-red-500 font-black">di bawah 3.5</span>{" "}
              secara berturut-turut. Segera lakukan pembinaan atau penangguhan
              akun.
            </p>
          </div>
        </div>
        <div className="flex gap-3 relative z-10 w-full md:w-auto">
          <button className="flex-1 md:flex-none bg-white text-slate-900 px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all">
            Download Report
          </button>
          <button className="flex-1 md:flex-none bg-red-600 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-red-600/20 hover:bg-red-700 transition-all flex items-center gap-2">
            <Ban size={14} /> Eksekusi Suspend
          </button>
        </div>
        <Star
          className="absolute -left-10 -bottom-10 text-white/[0.03]"
          size={200}
        />
      </div>
    </div>
  );
};

const SparkleIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
  </svg>
);
