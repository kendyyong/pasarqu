import React, { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { useAuth } from "../../../contexts/AuthContext";
import { useToast } from "../../../contexts/ToastContext";
import {
  AlertCircle,
  MessageSquare,
  Clock,
  CheckCircle2,
  ShieldAlert,
  Search,
  ExternalLink,
  ChevronRight,
  BrainCircuit,
  Loader2,
  X,
  Scale,
  RefreshCw,
  XCircle,
} from "lucide-react";

export const LocalResolutionTab = () => {
  const { profile } = useAuth();
  const { showToast } = useToast();
  const [filter, setFilter] = useState("PENDING");
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCase, setSelectedCase] = useState<any>(null);

  // AI States
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiRecommendation, setAiRecommendation] = useState<string | null>(null);

  const fetchComplaints = async () => {
    if (!profile?.managed_market_id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("complaints")
        .select(
          `
          *,
          orders(*),
          profiles:customer_id(full_name, phone_number),
          merchants:merchant_id(shop_name)
        `,
        )
        .eq("market_id", profile.managed_market_id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setComplaints(data || []);
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [profile]);

  // --- LOGIKA AI DISPUTE ANALYZER ---
  const analyzeWithAI = async (item: any) => {
    setAiAnalyzing(true);
    setAiRecommendation(null);
    try {
      // Simulasi Berpikir AI (Bisa dihubungkan ke OpenAI/Gemini API via Edge Function)
      await new Promise((res) => setTimeout(res, 2000));

      const issue = item.reason.toLowerCase();
      let advice = "";

      if (issue.includes("busuk") || issue.includes("basi")) {
        advice =
          "Saran AI: SETUJUI REFUND. Barang kategori 'Segar' yang rusak saat tiba merupakan tanggung jawab Mitra/Kurir. Disarankan untuk memotong saldo Merchant guna mengembalikan dana pembeli.";
      } else if (issue.includes("kurang") || issue.includes("tidak ada")) {
        advice =
          "Saran AI: PARTIAL REFUND. Mohon verifikasi berat timbangan kurir dan nota toko. Jika valid, kembalikan selisih dana ke saldo pembeli.";
      } else if (issue.includes("lama") || issue.includes("telat")) {
        advice =
          "Saran AI: KOMPENSASI ONGKIR. Pesanan sudah diterima tapi terlambat. Berikan voucher atau kompensasi ongkos kirim kepada pembeli untuk menjaga retensi.";
      } else {
        advice =
          "Saran AI: INVESTIGASI. Bukti belum cukup kuat. Gunakan fitur Chat untuk meminta foto barang dari Pembeli.";
      }

      setAiRecommendation(advice);
    } catch (err) {
      showToast("AI sedang sibuk, coba lagi nanti.", "error");
    } finally {
      setAiAnalyzing(false);
    }
  };

  const handleResolve = async (
    id: string,
    resolution: "REFUNDED" | "REJECTED",
  ) => {
    try {
      const { error } = await supabase
        .from("complaints")
        .update({ status: "RESOLVED", resolution_type: resolution })
        .eq("id", id);

      if (error) throw error;
      showToast(`Kasus ditutup sebagai: ${resolution}`, "success");
      setSelectedCase(null);
      fetchComplaints();
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  if (loading)
    return (
      <div className="py-20 text-center flex flex-col items-center gap-4">
        <Loader2 className="animate-spin text-teal-500" size={40} />
        <p className="text-[10px] font-black uppercase text-slate-400">
          Menghubungkan ke Pusat Resolusi...
        </p>
      </div>
    );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 text-left">
      {/* HEADER & FILTER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">
            Pusat Resolusi Wilayah
          </h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
            Gunakan bantuan AI untuk menengahi sengketa mitra dan pelanggan
          </p>
        </div>
        <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">
          {["PENDING", "RESOLVED"].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${filter === s ? "bg-teal-600 text-white shadow-lg" : "text-slate-400 hover:text-slate-600"}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* COMPLAINT LIST (KIRI) */}
        <div
          className={`space-y-4 ${selectedCase ? "lg:col-span-5" : "lg:col-span-12"}`}
        >
          {complaints.filter((c) => c.status === filter).length === 0 ? (
            <div className="bg-white p-20 rounded-[3rem] border border-dashed border-slate-200 text-center">
              <CheckCircle2 className="text-slate-300 mx-auto mb-4" size={32} />
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                Antrian Bersih!
              </p>
            </div>
          ) : (
            complaints
              .filter((c) => c.status === filter)
              .map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    setSelectedCase(item);
                    setAiRecommendation(null);
                  }}
                  className={`bg-white p-6 rounded-[2.5rem] border transition-all group cursor-pointer ${selectedCase?.id === item.id ? "border-teal-500 ring-2 ring-teal-500/10 shadow-xl" : "border-slate-100 shadow-sm hover:border-teal-200"}`}
                >
                  <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3">
                        <span className="px-3 py-1 bg-orange-100 text-orange-600 text-[9px] font-black rounded-lg uppercase">
                          #{item.id.slice(0, 8)}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">
                          {new Date(item.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <h4 className="text-lg font-black text-slate-800 leading-tight uppercase group-hover:text-teal-600 transition-colors">
                        {item.reason}
                      </h4>
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                        <span className="text-slate-900">
                          {item.profiles?.full_name}
                        </span>
                        <ChevronRight size={14} className="text-slate-300" />
                        <span className="text-teal-600">
                          {item.merchants?.shop_name}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="bg-slate-50 px-4 py-2 rounded-xl text-center">
                        <p className="text-[8px] font-black text-slate-400 uppercase mb-1">
                          Nilai Order
                        </p>
                        <p className="text-xs font-black text-slate-800">
                          Rp {item.orders?.total_price?.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))
          )}
        </div>

        {/* AI PANEL (KANAN - Muncul jika item dipilih) */}
        {selectedCase && (
          <div className="lg:col-span-7 animate-in slide-in-from-right-10 duration-500 sticky top-24">
            <div className="bg-slate-900 rounded-[3rem] p-1 shadow-2xl overflow-hidden">
              <div className="bg-white rounded-[2.8rem] p-8 space-y-8">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-lg">
                      <Scale size={24} />
                    </div>
                    <div>
                      <h3 className="font-black text-slate-800 uppercase italic leading-none">
                        Keputusan Admin
                      </h3>
                      <p className="text-[9px] font-bold text-slate-400 uppercase mt-1 tracking-widest">
                        No. Kasus: #{selectedCase.id.slice(0, 8)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedCase(null)}
                    className="p-2 hover:bg-red-50 text-slate-300 hover:text-red-500 transition-all"
                  >
                    <X size={24} />
                  </button>
                </div>

                {/* AREA ANALISIS AI */}
                <div className="bg-indigo-50 rounded-[2rem] border border-indigo-100 p-6 relative overflow-hidden">
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2 text-indigo-600">
                        <BrainCircuit
                          size={20}
                          className={aiAnalyzing ? "animate-pulse" : ""}
                        />
                        <span className="text-[10px] font-black uppercase tracking-widest">
                          AI Dispute Intelligence
                        </span>
                      </div>
                      {!aiRecommendation && (
                        <button
                          onClick={() => analyzeWithAI(selectedCase)}
                          disabled={aiAnalyzing}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[9px] font-black uppercase shadow-lg shadow-indigo-200 active:scale-95 transition-all flex items-center gap-2"
                        >
                          {aiAnalyzing ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <RefreshCw size={12} />
                          )}
                          Mulai Analisis
                        </button>
                      )}
                    </div>

                    {aiAnalyzing ? (
                      <div className="space-y-3 py-4">
                        <div className="h-2 w-3/4 bg-indigo-200 rounded animate-pulse"></div>
                        <div className="h-2 w-full bg-indigo-200 rounded animate-pulse"></div>
                        <div className="h-2 w-1/2 bg-indigo-200 rounded animate-pulse"></div>
                      </div>
                    ) : aiRecommendation ? (
                      <div className="animate-in zoom-in-95">
                        <p className="text-xs font-bold text-indigo-900 leading-relaxed bg-white/60 p-4 rounded-2xl border border-indigo-200 shadow-inner italic">
                          "{aiRecommendation}"
                        </p>
                        <button
                          onClick={() => setAiRecommendation(null)}
                          className="mt-3 text-[8px] font-black text-indigo-400 uppercase underline"
                        >
                          Analisis Ulang
                        </button>
                      </div>
                    ) : (
                      <p className="text-[10px] font-bold text-indigo-400 uppercase italic">
                        Klik tombol untuk mendapatkan rekomendasi solusi
                        berbasis data.
                      </p>
                    )}
                  </div>
                  <BrainCircuit
                    className="absolute -right-6 -bottom-6 text-indigo-500/10"
                    size={140}
                  />
                </div>

                {/* INPUT TINDAKAN */}
                <div className="space-y-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">
                    Pilih Resolusi Akhir:
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => handleResolve(selectedCase.id, "REFUNDED")}
                      className="py-5 bg-teal-500 text-white rounded-[1.8rem] font-black uppercase text-[10px] tracking-widest shadow-xl shadow-teal-500/20 flex flex-col items-center gap-2 hover:bg-teal-600 transition-all border-b-4 border-teal-700"
                    >
                      <CheckCircle2 size={20} />
                      Setujui Refund
                    </button>
                    <button
                      onClick={() => handleResolve(selectedCase.id, "REJECTED")}
                      className="py-5 bg-slate-900 text-white rounded-[1.8rem] font-black uppercase text-[10px] tracking-widest shadow-xl flex flex-col items-center gap-2 hover:bg-red-600 transition-all border-b-4 border-slate-700 hover:border-red-800"
                    >
                      <XCircle size={20} />
                      Tolak Komplain
                    </button>
                  </div>
                </div>

                {/* KONTAK PIHAK TERKAIT */}
                <div className="pt-6 border-t border-slate-100 flex justify-between items-center">
                  <button className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 hover:text-slate-800 transition-all">
                    <MessageSquare size={14} /> Chat Pembeli
                  </button>
                  <button className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 hover:text-slate-800 transition-all">
                    <MessageSquare size={14} /> Chat Toko
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* FOOTER POLICY */}
      {!selectedCase && (
        <div className="bg-slate-900 p-8 rounded-[3rem] text-white flex items-center gap-6 shadow-2xl">
          <div className="w-16 h-16 bg-white/10 rounded-[1.5rem] flex items-center justify-center shrink-0">
            <ShieldAlert className="text-orange-400" size={32} />
          </div>
          <div>
            <h4 className="text-sm font-black uppercase tracking-widest mb-1 italic">
              Otoritas Hakim Wilayah
            </h4>
            <p className="text-[10px] text-slate-400 font-bold leading-relaxed uppercase">
              Keputusan penolakan atau pengembalian dana bersifat mutlak.
              Gunakan analisis AI sebagai bahan pertimbangan data teknis sebelum
              memberikan vonis.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
