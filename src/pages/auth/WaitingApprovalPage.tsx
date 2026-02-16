import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../contexts/AuthContext";
import {
  Clock,
  ShieldCheck,
  ArrowLeft,
  Smartphone,
  CheckCircle2,
  Search,
  Loader2,
  RefreshCcw,
} from "lucide-react";

export const WaitingApprovalPage = () => {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth(); // Pastikan ada refreshProfile di AuthContext
  const [isChecking, setIsChecking] = useState(false);

  // ✅ 1. FUNGSI CEK STATUS DENGAN PAKSA REFRESH
  const checkStatusManual = async () => {
    if (!user?.id) return;
    setIsChecking(true);

    try {
      // Ambil data langsung dari Supabase (Bukan dari memori/context)
      const { data, error } = await supabase
        .from("profiles")
        .select("is_verified, role")
        .eq("id", user.id)
        .single();

      if (error) throw error;

      if (data?.is_verified === true) {
        // Jika di DB sudah TRUE, panggil refreshProfile agar AuthContext terupdate
        if (refreshProfile) await refreshProfile();

        // Langsung arahkan
        const targetUrl =
          data.role === "MERCHANT"
            ? "/merchant-dashboard"
            : data.role === "COURIER"
              ? "/courier-dashboard"
              : "/";

        window.location.replace(targetUrl);
      } else {
        // Jika masih FALSE
        alert(
          "Status: Masih Menunggu. Admin wilayah belum menekan tombol Verifikasi.",
        );
      }
    } catch (err: any) {
      console.error("Error:", err.message);
      alert("Gagal mengecek status. Periksa koneksi internet Anda.");
    } finally {
      setTimeout(() => setIsChecking(false), 800);
    }
  };

  // ✅ 2. LOGIKA SENSOR OTOMATIS (REALTIME)
  useEffect(() => {
    if (!user?.id) return;

    const profileSubscription = supabase
      .channel("check_approval_realtime")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${user.id}`,
        },
        async (payload) => {
          if (payload.new.is_verified === true) {
            if (refreshProfile) await refreshProfile();

            const targetUrl =
              payload.new.role === "MERCHANT"
                ? "/merchant-dashboard"
                : payload.new.role === "COURIER"
                  ? "/courier-dashboard"
                  : "/";

            setTimeout(() => {
              window.location.replace(targetUrl);
            }, 1000);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(profileSubscription);
    };
  }, [user, navigate, refreshProfile]);

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-[420px] text-center animate-in fade-in zoom-in-95 duration-500">
        <div className="relative mb-8 flex justify-center">
          <div className="w-24 h-24 bg-teal-50 rounded-[2rem] flex items-center justify-center">
            {isChecking ? (
              <Loader2 size={40} className="text-teal-600 animate-spin" />
            ) : (
              <Search size={40} className="text-teal-600 animate-pulse" />
            )}
          </div>
          <div className="absolute top-0 right-[35%] w-8 h-8 bg-orange-500 rounded-xl flex items-center justify-center text-white shadow-lg border-2 border-white animate-bounce">
            <Clock size={16} />
          </div>
        </div>

        <h1 className="text-xl font-black text-slate-800 mb-2 uppercase tracking-tight">
          Pendaftaran Ditinjau
        </h1>
        <p className="text-[11px] text-slate-500 leading-relaxed mb-8 px-6 font-bold uppercase tracking-wide">
          Data Anda telah kami terima. Tim Admin sedang melakukan verifikasi
          berkas untuk memastikan keamanan ekosistem Pasarqu.
        </p>

        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm text-left mb-8 space-y-5">
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
            icon={<Loader2 size={14} className="animate-spin" />}
            label="Verifikasi Admin"
            status="Sedang Validasi"
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

        <div className="space-y-3">
          <button
            onClick={checkStatusManual}
            disabled={isChecking}
            className="w-full py-4 bg-teal-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-teal-700 transition-all shadow-xl shadow-teal-600/20 active:scale-95"
          >
            {isChecking ? (
              "MENYAMBUNGKAN..."
            ) : (
              <>
                <RefreshCcw size={16} /> Cek Status Sekarang
              </>
            )}
          </button>

          <button
            onClick={() => window.open("https://wa.me/628123456789", "_blank")}
            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-slate-800 transition-all shadow-lg active:scale-95"
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

        <p className="mt-10 text-[8px] font-black text-slate-300 uppercase tracking-[0.3em]">
          Pasarqu Safety System • 2026
        </p>
      </div>
    </div>
  );
};

const Step = ({ active, icon, label, status, color, bgColor }: any) => (
  <div className="flex items-center gap-4">
    <div
      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${active ? bgColor + " " + color : "bg-slate-50 text-slate-200"}`}
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
        className={`text-[8px] font-black uppercase tracking-widest ${active ? color : "text-slate-300"}`}
      >
        {status}
      </p>
    </div>
  </div>
);

export default WaitingApprovalPage;
