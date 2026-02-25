import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { useToast } from "../../contexts/ToastContext";
import { Lock, Loader2, Eye, EyeOff, ShieldCheck } from "lucide-react";

export const UpdatePasswordPage = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6)
      return showToast("Password minimal 6 karakter", "error");

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      showToast("Kata sandi berhasil diperbarui!", "success");
      // Logout otomatis agar user login ulang pakai password baru
      await supabase.auth.signOut();
      navigate("/login");
    } catch (error: any) {
      showToast(error.message || "Gagal memperbarui kata sandi", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] w-screen flex flex-col font-sans bg-slate-50 items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-[2rem] shadow-2xl border border-slate-100 p-8 animate-in zoom-in-95 duration-500">
        <div className="text-center mb-6">
          <div className="inline-flex p-3 bg-[#FF6600]/10 text-[#FF6600] rounded-2xl mb-4">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-2xl font-[1000] text-slate-800 uppercase tracking-tighter">
            Buat Sandi Baru
          </h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2">
            Amankan kembali akun PasarQu Anda.
          </p>
        </div>

        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300">
              <Lock size={18} />
            </div>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="KATA SANDI BARU"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#FF6600] outline-none text-[12px] font-bold uppercase tracking-widest shadow-inner"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 p-1"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <button
            disabled={loading}
            className="w-full py-4 bg-[#FF6600] text-white rounded-xl font-[1000] uppercase tracking-[0.2em] text-[12px] shadow-lg active:scale-95 transition-all flex justify-center items-center"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              "SIMPAN SANDI BARU"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UpdatePasswordPage;
