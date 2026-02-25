import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { useToast } from "../../contexts/ToastContext";
import { ArrowLeft, Mail, Loader2, KeyRound, ArrowRight } from "lucide-react";

export const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return showToast("Masukkan alamat email Anda", "error");

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        // Arahkan ke halaman ganti password baru setelah link di klik
        redirectTo: `${window.location.origin}/update-password`,
      });

      if (error) throw error;

      setIsSent(true);
      showToast("Link pemulihan berhasil dikirim!", "success");
    } catch (error: any) {
      showToast(error.message || "Gagal mengirim link reset", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] w-screen flex flex-col font-sans relative overflow-x-hidden bg-slate-50 text-left">
      <nav className="absolute top-0 left-0 w-full p-4 z-50 flex justify-between items-center">
        <button
          onClick={() => navigate(-1)}
          className="p-2 text-slate-500 hover:text-slate-800 rounded-full bg-white shadow-sm border border-slate-200 transition-all active:scale-90"
        >
          <ArrowLeft size={20} />
        </button>
      </nav>

      <div className="flex-1 flex flex-col items-center justify-end md:justify-center relative z-10 w-full max-w-[480px] mx-auto pt-20 pb-0 md:pb-12">
        <div className="w-full px-6 mb-6 text-center md:text-left">
          <div className="inline-flex p-3 bg-teal-50 text-[#008080] rounded-2xl mb-4 border border-teal-100 shadow-sm">
            <KeyRound size={28} />
          </div>
          <h1 className="text-3xl font-[1000] text-slate-800 uppercase tracking-tighter leading-none mb-2">
            Lupa <span className="text-[#008080]">Sandi?</span>
          </h1>
          <p className="text-[12px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed">
            {isSent
              ? "Periksa kotak masuk (atau spam) email Anda untuk link pemulihan."
              : "Masukkan email yang terdaftar. Kami akan mengirimkan link untuk membuat kata sandi baru."}
          </p>
        </div>

        <div className="w-full bg-white rounded-t-[2.5rem] md:rounded-[2rem] shadow-2xl border-t md:border border-slate-100 p-6 md:p-10 animate-in slide-in-from-bottom-8 duration-700">
          {!isSent ? (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="relative group flex-1">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#008080] transition-colors">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  placeholder="ALAMAT EMAIL ANDA"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#008080] focus:ring-2 focus:ring-[#008080]/20 focus:bg-white outline-none text-[12px] font-bold uppercase tracking-widest transition-all shadow-inner text-slate-800"
                  required
                />
              </div>

              <button
                disabled={loading}
                className="w-full py-4 bg-[#008080] hover:bg-teal-700 text-white rounded-2xl font-[1000] uppercase tracking-[0.2em] text-[12px] shadow-lg shadow-teal-900/20 active:scale-95 transition-all flex justify-center items-center gap-2"
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  "KIRIM LINK PEMULIHAN"
                )}
              </button>
            </form>
          ) : (
            <div className="text-center space-y-6">
              <button
                onClick={() => navigate("/login")}
                className="w-full py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-[1000] uppercase tracking-[0.2em] text-[12px] transition-all"
              >
                KEMBALI KE HALAMAN LOGIN
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
