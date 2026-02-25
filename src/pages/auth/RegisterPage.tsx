import React, { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { GoogleLoginButton } from "../../components/ui/GoogleLoginButton";
import { supabase } from "../../lib/supabaseClient";
import { useToast } from "../../contexts/ToastContext";
import {
  Phone,
  ChevronRight,
  MessageCircle,
  ShieldCheck,
  AlertCircle,
  Loader2,
  CheckCircle2,
  XCircle,
  ArrowLeft,
} from "lucide-react";

export const RegisterPage = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();

  const redirectTarget = searchParams.get("redirect");

  const [phone, setPhone] = useState("");
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

  const triggerConsent = (method: string, e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (method === "PHONE") {
      if (!phone) {
        showToast("NOMOR TELEPON WAJIB DIISI", "error");
        return;
      }
      if (!validatePhone(phone)) {
        showToast("NOMOR TIDAK VALID", "error");
        return;
      }
    }
    setPendingAction(method);
    setShowModal(true);
  };

  const handleAgree = async () => {
    setShowModal(false);

    if (pendingAction === "PHONE" || pendingAction === "WHATSAPP") {
      setIsLoading(true);
      let cleanPhone = phone;
      if (cleanPhone.startsWith("0")) {
        cleanPhone = cleanPhone.substring(1);
      }

      try {
        const fullPhone = "62" + cleanPhone;

        const { data: otpData, error: otpError } = await supabase.rpc(
          "generate_otp_secure",
          { p_phone: fullPhone },
        );

        if (otpError) throw new Error("GAGAL MEMBUAT KODE OTP");

        const { error: waError } = await supabase.functions.invoke(
          "send-wa-otp",
          {
            body: { phone: fullPhone, otp: otpData.otp_code },
          },
        );

        if (waError) throw new Error("WHATSAPP SEDANG SIBUK");

        showToast("KODE OTP BERHASIL DIKIRIM!", "success");

        navigate("/verify-otp", {
          state: { phone: cleanPhone, redirect: redirectTarget },
        });
      } catch (err: any) {
        showToast(err.message || "GANGGUAN KONEKSI", "error");
      } finally {
        setIsLoading(false);
      }
    } else if (pendingAction === "GOOGLE") {
      navigate(redirectTarget || "/customer-dashboard");
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
          <ArrowLeft size={20} />
        </button>
        <div className="pr-2">
          <img
            src="/logo-text.png"
            alt="PasarQu"
            className="h-6 object-contain grayscale opacity-50"
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
          <div className="relative w-full max-w-md bg-white border border-slate-100 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 md:p-8">
              <div className="flex items-center gap-3 text-[#008080] mb-6">
                <div className="p-2 bg-teal-50 rounded-full">
                  <ShieldCheck size={28} strokeWidth={2.5} />
                </div>
                <h3 className="text-[16px] font-[1000] uppercase tracking-tight">
                  Keamanan Akun
                </h3>
              </div>
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 mb-8 text-[12px] text-slate-600 leading-relaxed font-bold">
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
                  className="flex-1 py-4 bg-white border-2 border-slate-200 hover:bg-slate-50 text-slate-500 rounded-xl font-black uppercase text-[11px] tracking-widest transition-colors"
                >
                  BATAL
                </button>
                <button
                  onClick={handleAgree}
                  disabled={isLoading}
                  className="flex-[2] py-4 bg-[#008080] hover:bg-teal-700 text-white rounded-xl font-[1000] shadow-lg shadow-teal-900/20 uppercase flex justify-center items-center text-[11px] tracking-widest transition-colors"
                >
                  {isLoading ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    "SETUJU & KIRIM OTP"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MAIN CONTAINER --- */}
      <div className="flex-1 flex flex-col items-center justify-end md:justify-center relative z-10 w-full max-w-[480px] mx-auto pt-20 pb-0 md:pb-12">
        {/* TEKS SAMBUTAN */}
        <div className="w-full px-6 mb-6 text-center md:text-left">
          <h1 className="text-3xl md:text-4xl font-[1000] text-slate-800 uppercase tracking-tighter leading-none mb-2">
            Buat Akun <br className="md:hidden" />
            {/* 🚀 UPDATE KATA: Member Baru */}
            <span className="text-[#008080]">Member Baru.</span>
          </h1>
          <p className="text-[12px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed">
            Daftar dengan cepat menggunakan <br className="hidden md:block" />{" "}
            WhatsApp atau akun Google Anda.
          </p>
        </div>

        {/* FORM BOX */}
        <div className="w-full bg-white/95 backdrop-blur-xl rounded-t-[2.5rem] md:rounded-[2rem] shadow-[0_-10px_40px_rgba(0,0,0,0.04)] md:shadow-2xl border-t md:border border-white/50 p-6 md:p-10 animate-in slide-in-from-bottom-8 duration-700">
          <form
            onSubmit={(e) => triggerConsent("PHONE", e)}
            className="space-y-4"
          >
            <div className="relative group">
              <div
                className={`absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 border-r pr-3 transition-colors ${isInvalid ? "border-red-200" : "border-slate-200 group-focus-within:border-[#008080]"}`}
              >
                <Phone
                  size={18}
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
                placeholder="0812 3456 7890"
                value={phone}
                onChange={handlePhoneChange}
                disabled={isLoading}
                className={`w-full pl-24 pr-12 py-4 bg-slate-50 border-2 rounded-2xl text-[14px] font-black outline-none transition-all shadow-inner tracking-widest ${isInvalid ? "border-red-400 focus:border-red-600 bg-red-50/50 text-red-900" : isValid ? "border-teal-400 focus:border-teal-600 bg-teal-50/50 text-teal-900" : "border-slate-100 focus:border-[#008080] text-slate-800"}`}
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                {isValid && (
                  <CheckCircle2
                    size={20}
                    className="text-teal-500 animate-in zoom-in"
                  />
                )}
                {isInvalid && <XCircle size={20} className="text-red-500" />}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || isInvalid || !phone}
              className="w-full bg-[#008080] text-white py-4 rounded-2xl text-[12px] font-[1000] shadow-lg shadow-teal-900/20 hover:bg-teal-700 active:scale-95 transition-all flex items-center justify-center gap-2 uppercase tracking-[0.2em] disabled:opacity-50 disabled:active:scale-100"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                "LANJUTKAN PENDAFTARAN"
              )}{" "}
              <ChevronRight size={18} />
            </button>
          </form>

          <div className="relative py-6 text-center flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <span className="relative bg-white px-4 text-[9px] text-slate-400 font-black uppercase tracking-[0.2em]">
              ATAU DAFTAR VIA
            </span>
          </div>

          <div className="space-y-3">
            <div
              onClick={() => triggerConsent("GOOGLE")}
              className="hover:opacity-90 active:scale-95 transition-all"
            >
              <GoogleLoginButton />
            </div>

            <button
              onClick={() => triggerConsent("WHATSAPP")}
              className="w-full flex items-center justify-center gap-3 px-5 py-3.5 bg-white border-2 border-[#25D366]/30 rounded-2xl hover:bg-[#25D366]/5 active:scale-95 transition-all shadow-sm"
            >
              <MessageCircle
                size={20}
                className="text-[#25D366]"
                fill="#25D366"
                stroke="#fff"
              />
              <span className="text-[11px] font-black uppercase tracking-widest text-slate-700">
                WHATSAPP LANGSUNG
              </span>
            </button>
          </div>

          <div className="mt-8 text-center flex flex-col items-center">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">
              SUDAH PUNYA AKUN?
            </p>
            <button
              onClick={() => navigate("/login")}
              className="text-[#FF6600] font-black uppercase tracking-widest text-[11px] hover:underline"
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
