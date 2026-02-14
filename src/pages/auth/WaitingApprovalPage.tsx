import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient"; // Pastikan path ini benar
import { useAuth } from "../../contexts/AuthContext"; // Pastikan path ini benar
import {
  Clock,
  ShieldCheck,
  ArrowLeft,
  Smartphone,
  CheckCircle2,
  Search,
} from "lucide-react";

export const WaitingApprovalPage = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();

  // --- LOGIKA SENSOR OTOMATIS (REALTIME CHECK) ---
  useEffect(() => {
    if (!profile?.id) return;

    // 1. Buat koneksi sensor ke tabel profiles
    const profileSubscription = supabase
      .channel("check_approval")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${profile.id}`,
        },
        (payload) => {
          // 2. Jika status berubah jadi APPROVED, langsung arahkan ke dashboard
          if (payload.new.status === "APPROVED") {
            const targetUrl =
              profile.role === "MERCHANT"
                ? "/merchant-dashboard"
                : profile.role === "COURIER"
                  ? "/courier-dashboard"
                  : "/";

            // Beri delay sedikit agar user sempat melihat animasi transisi
            setTimeout(() => {
              window.location.replace(targetUrl);
            }, 1500);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(profileSubscription);
    };
  }, [profile, navigate]);

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-[420px] text-center">
        {/* ILUSTRASI ANIMASI RAMPING */}
        <div className="relative mb-8 flex justify-center">
          <div className="w-24 h-24 bg-teal-50 rounded-[2rem] flex items-center justify-center animate-pulse">
            <Search size={40} className="text-teal-600" />
          </div>
          <div className="absolute top-0 right-[35%] w-8 h-8 bg-orange-500 rounded-xl flex items-center justify-center text-white shadow-lg border-2 border-white animate-bounce">
            <Clock size={16} />
          </div>
        </div>

        {/* TEKS INFO UTAMA */}
        <h1 className="text-xl font-black text-slate-800 mb-2 uppercase tracking-tight">
          Pendaftaran Ditinjau
        </h1>
        <p className="text-[11px] text-slate-500 leading-relaxed mb-8 px-6 font-medium uppercase tracking-wide">
          Data Anda telah kami terima. Tim Admin sedang melakukan verifikasi
          berkas untuk memastikan keamanan ekosistem Pasarqu.
        </p>

        {/* TIMELINE PROSES (Pipih & Padat) */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm text-left mb-8 space-y-4">
          <Step
            active
            icon={<CheckCircle2 size={14} />}
            label="Data Terkirim"
            status="Selesai"
            color="text-teal-600"
            bgColor="bg-teal-50"
          />
          <Step
            active
            icon={<Search size={14} />}
            label="Verifikasi Admin"
            status="Sedang Diproses"
            color="text-orange-500"
            bgColor="bg-orange-50"
          />
          <Step
            active={false}
            icon={<ShieldCheck size={14} />}
            label="Akses Dashboard"
            status="Menunggu"
            color="text-slate-300"
            bgColor="bg-slate-50"
          />
        </div>

        {/* AKSI (Ramping) */}
        <div className="space-y-3">
          <button
            onClick={() => window.open("https://wa.me/628123456789", "_blank")} // Juragan ganti nomor WA disini
            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-teal-600 transition-all shadow-lg active:scale-95"
          >
            <Smartphone size={16} /> Hubungi Admin Wilayah
          </button>
          <button
            onClick={() => navigate("/")}
            className="w-full py-2 text-slate-400 font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 hover:text-teal-600 transition-colors"
          >
            <ArrowLeft size={14} /> Kembali ke Beranda
          </button>
        </div>

        {/* FOOTER KECIL */}
        <p className="mt-10 text-[8px] font-bold text-slate-300 uppercase tracking-[0.3em]">
          Pasarqu Safety System • v2.0
        </p>
      </div>
    </div>
  );
};

// --- SUB KOMPONEN STEP ---
const Step = ({ active, icon, label, status, color, bgColor }: any) => (
  <div className="flex items-center gap-4">
    <div
      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${active ? bgColor + " " + color : "bg-slate-50 text-slate-200"}`}
    >
      {icon}
    </div>
    <div className="flex-1 text-left">
      <p
        className={`text-[10px] font-black uppercase tracking-tight ${active ? "text-slate-800" : "text-slate-300"}`}
      >
        {label}
      </p>
      <p
        className={`text-[8px] font-bold uppercase tracking-widest ${active ? color : "text-slate-300"}`}
      >
        {status}
      </p>
    </div>
  </div>
);

export default WaitingApprovalPage;
