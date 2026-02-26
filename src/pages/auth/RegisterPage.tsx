import React, { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { GoogleLoginButton } from "../../components/ui/GoogleLoginButton";
import { supabase } from "../../lib/supabaseClient";
import { useToast } from "../../contexts/ToastContext";
import {
  Phone,
  ChevronRight,
  ShieldCheck,
  Loader2,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  User,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";

export const RegisterPage = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();

  const redirectTarget = searchParams.get("redirect");

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  const [isValid, setIsValid] = useState(false);
  const [isInvalid, setIsInvalid] = useState(false);

  const validatePhone = (number: string) => {
    const regex = /^(08|8)[1-9][0-9]{7,11}$/;
    return regex.test(number);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "");
    setPhone(val);
    if (val.length > 0) {
      const valid = validatePhone(val);
      setIsValid(valid);
      setIsInvalid(!valid);
    } else {
      setIsValid(false);
      setIsInvalid(false);
    }
  };

  const formatPhoneToEmail = (phoneNumber: string) => {
    let cleanPhone = phoneNumber.replace(/\D/g, "");
    if (cleanPhone.startsWith("0")) {
      cleanPhone = cleanPhone.substring(1);
    }
    return `62${cleanPhone}@pasarqu.com`;
  };

  const triggerConsent = (method: string, e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (method === "PHONE") {
      if (!fullName) {
        showToast("NAMA LENGKAP WAJIB DIISI", "error");
        return;
      }
      if (!phone) {
        showToast("NOMOR TELEPON WAJIB DIISI", "error");
        return;
      }
      if (!validatePhone(phone)) {
        showToast("NOMOR TIDAK VALID", "error");
        return;
      }
      if (!password || password.length < 6) {
        showToast("PASSWORD MINIMAL 6 KARAKTER", "error");
        return;
      }
    }
    setPendingAction(method);
    setShowModal(true);
  };

  const handleAgree = async () => {
    setShowModal(false);

    if (pendingAction === "PHONE") {
      setIsLoading(true);
      const dummyEmail = formatPhoneToEmail(phone);
      let cleanPhoneForDb = phone;
      if (cleanPhoneForDb.startsWith("0"))
        cleanPhoneForDb = cleanPhoneForDb.substring(1);
      cleanPhoneForDb = "62" + cleanPhoneForDb;

      try {
        const { data, error } = await supabase.auth.signUp({
          email: dummyEmail,
          password: password,
          options: {
            data: {
              full_name: fullName,
              phone_number: cleanPhoneForDb,
            },
          },
        });

        if (error) throw error;

        if (data.user) {
          setTimeout(async () => {
            await supabase
              .from("profiles")
              .update({
                full_name: fullName,
                phone_number: cleanPhoneForDb,
                role: "USER",
                status: "APPROVED",
              })
              .eq("id", data.user?.id);
          }, 1000);
        }

        showToast("PENDAFTARAN BERHASIL! SELAMAT DATANG.", "success");
        navigate(redirectTarget || "/");
      } catch (err: any) {
        if (err.message.includes("already registered")) {
          showToast("NOMOR INI SUDAH TERDAFTAR. SILAKAN LOGIN.", "error");
        } else {
          showToast("GAGAL MENDAFTAR: " + err.message, "error");
        }
      } finally {
        setIsLoading(false);
      }
    } else if (pendingAction === "GOOGLE") {
      navigate(redirectTarget || "/");
    }
  };

  return (
    <div className="min-h-[100dvh] w-screen flex flex-col items-center justify-center p-0 md:p-6 font-sans bg-slate-50 text-left relative overflow-x-hidden">
      {/* DEKORASI BACKGROUND */}
      <div className="absolute top-[-10%] left-[-10%] w-[400px] h-[400px] bg-[#008080]/5 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-[#FF6600]/5 rounded-full blur-[100px] pointer-events-none"></div>

      {/* HEADER: KEMBALI */}
      <nav className="absolute top-0 left-0 w-full p-4 z-50 flex justify-between items-center">
        <button
          onClick={() => navigate(-1)}
          className="p-2 text-slate-500 hover:text-slate-800 rounded-full bg-white shadow-sm border border-slate-200 transition-all active:scale-90"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="pr-2">
          <img
            src="/logo-text.png"
            alt="PasarQu"
            className="h-5 object-contain grayscale opacity-50"
          />
        </div>
      </nav>

      {/* --- MODAL KETENTUAN --- */}
      {showModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          ></div>
          <div className="relative w-full max-w-md bg-white border border-slate-100 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 md:p-8">
              <div className="flex items-center gap-3 text-[#008080] mb-5">
                <div className="p-2 bg-teal-50 rounded-full">
                  <ShieldCheck size={24} strokeWidth={2.5} />
                </div>
                <h3 className="text-[14px] font-[1000] uppercase tracking-tight">
                  Keamanan Akun
                </h3>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-6 text-[12px] text-slate-600 leading-relaxed font-bold">
                Dengan melanjutkan pendaftaran, Anda menyetujui{" "}
                <Link to="/terms" className="text-[#008080] underline">
                  Syarat & Ketentuan
                </Link>{" "}
                serta{" "}
                <Link to="/privacy" className="text-[#008080] underline">
                  Kebijakan Privasi
                </Link>{" "}
                PasarQu.
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-xl font-black uppercase text-[12px] tracking-widest transition-colors"
                >
                  BATAL
                </button>
                <button
                  onClick={handleAgree}
                  disabled={isLoading}
                  className="flex-[2] py-3 bg-[#008080] hover:bg-teal-700 text-white rounded-xl font-[1000] shadow-md shadow-teal-900/10 uppercase flex justify-center items-center text-[12px] tracking-widest transition-colors disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    "SETUJU & BUAT AKUN"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MAIN CONTAINER --- */}
      <div className="flex-1 flex flex-col items-center justify-end md:justify-center relative z-10 w-full max-w-[420px] mx-auto pt-20 pb-0 md:pb-12">
        {/* TEKS SAMBUTAN RATA TENGAH */}
        <div className="w-full px-6 mb-6 text-center">
          <h1 className="text-3xl font-[1000] text-slate-800 uppercase tracking-tighter leading-tight mb-3">
            Buat Akun <br />
            <span className="text-[#008080]">Member Baru.</span>
          </h1>
          <p className="text-[12px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed">
            Lengkapi data diri Anda untuk <br />
            mulai berbelanja di PasarQu.
          </p>
        </div>

        {/* FORM BOX */}
        <div className="w-full bg-white/95 backdrop-blur-xl rounded-t-[2rem] md:rounded-[1.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.04)] md:shadow-xl border-t md:border border-white/50 p-6 md:p-8 animate-in slide-in-from-bottom-8 duration-700">
          <form
            onSubmit={(e) => triggerConsent("PHONE", e)}
            className="space-y-3.5"
          >
            {/* FIELD NAMA LENGKAP */}
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 border-r pr-2.5 border-slate-200 group-focus-within:border-[#008080] transition-colors">
                <User
                  size={16}
                  className="text-slate-400 group-focus-within:text-[#008080]"
                />
              </div>
              <input
                required
                type="text"
                placeholder="NAMA LENGKAP"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={isLoading}
                className="w-full pl-[3.25rem] pr-4 py-3.5 bg-slate-50 border rounded-xl text-[12px] font-black outline-none transition-all shadow-inner tracking-widest border-slate-200 focus:border-[#008080] text-slate-800 placeholder-slate-400"
              />
            </div>

            {/* FIELD NOMOR HP */}
            <div className="relative group">
              <div
                className={`absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 border-r pr-2.5 transition-colors ${isInvalid ? "border-red-200" : "border-slate-200 group-focus-within:border-[#008080]"}`}
              >
                <Phone
                  size={16}
                  className={
                    isInvalid
                      ? "text-red-500"
                      : "text-slate-400 group-focus-within:text-[#008080]"
                  }
                />
                <span
                  className={`text-[12px] font-[1000] ${isInvalid ? "text-red-600" : "text-slate-600"}`}
                >
                  +62
                </span>
              </div>
              <input
                required
                type="tel"
                placeholder="812 3456 7890"
                value={phone}
                onChange={handlePhoneChange}
                disabled={isLoading}
                className={`w-full pl-[4.75rem] pr-10 py-3.5 bg-slate-50 border rounded-xl text-[12px] font-black outline-none transition-all shadow-inner tracking-widest placeholder-slate-400 ${isInvalid ? "border-red-400 focus:border-red-600 bg-red-50/50 text-red-900" : isValid ? "border-teal-400 focus:border-teal-600 bg-teal-50/50 text-teal-900" : "border-slate-200 focus:border-[#008080] text-slate-800"}`}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {isValid && (
                  <CheckCircle2
                    size={16}
                    className="text-teal-500 animate-in zoom-in"
                  />
                )}
                {isInvalid && <XCircle size={16} className="text-red-500" />}
              </div>
            </div>

            {/* FIELD PASSWORD BARU */}
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 border-r pr-2.5 border-slate-200 group-focus-within:border-[#008080] transition-colors">
                <Lock
                  size={16}
                  className="text-slate-400 group-focus-within:text-[#008080]"
                />
              </div>
              <input
                required
                type={showPassword ? "text" : "password"}
                placeholder="PASSWORD (MIN. 6 KARAKTER)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="w-full pl-[3.25rem] pr-10 py-3.5 bg-slate-50 border rounded-xl text-[12px] font-black outline-none transition-all shadow-inner tracking-widest border-slate-200 focus:border-[#008080] text-slate-800 placeholder-slate-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#008080] transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <button
              type="submit"
              disabled={
                isLoading ||
                isInvalid ||
                !phone ||
                !fullName ||
                password.length < 6
              }
              className="w-full mt-2 bg-[#008080] text-white py-3.5 rounded-xl text-[12px] font-[1000] shadow-md shadow-teal-900/10 hover:bg-teal-700 active:scale-95 transition-all flex items-center justify-center gap-2 uppercase tracking-widest disabled:opacity-50 disabled:active:scale-100"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                "LANJUTKAN PENDAFTARAN"
              )}{" "}
              <ChevronRight size={16} />
            </button>
          </form>

          <div className="relative py-5 text-center flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100"></div>
            </div>
            <span className="relative bg-white px-3 text-[10px] text-slate-400 font-black uppercase tracking-widest">
              ATAU DAFTAR VIA
            </span>
          </div>

          <div className="space-y-3">
            <div
              onClick={() => triggerConsent("GOOGLE")}
              className="hover:opacity-90 active:scale-95 transition-all cursor-pointer"
            >
              <GoogleLoginButton />
            </div>
          </div>

          <div className="mt-8 text-center flex flex-col items-center gap-1.5">
            <p className="text-[12px] font-black uppercase tracking-widest text-slate-400">
              SUDAH PUNYA AKUN?
            </p>
            <button
              onClick={() => navigate("/login")}
              className="text-[#FF6600] font-[1000] uppercase tracking-widest text-[12px] hover:underline decoration-2 underline-offset-4 decoration-[#FF6600]/30"
            >
              MASUK DI SINI
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
