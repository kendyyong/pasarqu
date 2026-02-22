import React, { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { GoogleLoginButton } from "../../components/ui/GoogleLoginButton";
import { supabase } from "../../lib/supabaseClient";
import { useToast } from "../../contexts/ToastContext";
import {
  Phone,
  ChevronRight,
  MessageCircle,
  Facebook,
  ArrowLeft,
  ShieldCheck,
  Zap,
  ShoppingBag,
  AlertCircle,
  Loader2,
  CheckCircle2,
  XCircle,
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

  // 🚀 LOGIKA VALIDASI NOMOR (08 atau 8)
  const validatePhone = (number: string) => {
    const regex = /^(08|8)[1-9][0-9]{7,11}$/;
    return regex.test(number);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, ""); // Hanya angka
    setPhone(val);

    if (val.length > 0) {
      const valid = validatePhone(val);
      setIsValid(valid);
      setIsInvalid(!valid); // Border merah jika tidak valid
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

    if (pendingAction === "PHONE") {
      setIsLoading(true);

      let cleanPhone = phone;
      if (cleanPhone.startsWith("0")) {
        cleanPhone = cleanPhone.substring(1);
      }

      try {
        const { error } = await supabase.functions.invoke("send-otp", {
          body: { phone: "62" + cleanPhone },
        });

        if (error) {
          const errBody = await error.context.json();
          if (errBody.error === "LIMIT_REACHED") {
            showToast(errBody.message, "error");
          } else {
            showToast("GAGAL MENGIRIM OTP", "error");
          }
          return;
        }

        showToast("KODE OTP TERKIRIM KE WHATSAPP", "success");
        navigate("/verify-otp", {
          state: { phone: cleanPhone, redirect: redirectTarget },
        });
      } catch (err: any) {
        showToast("GANGGUAN KONEKSI SISTEM", "error");
      } finally {
        setIsLoading(false);
      }
    } else {
      navigate(
        redirectTarget === "checkout" ? "/checkout" : "/customer-dashboard",
      );
    }
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] md:bg-[#008080] flex flex-col items-center justify-center p-0 md:p-6 font-black uppercase tracking-tighter text-left relative">
      {/* --- MODAL KETENTUAN --- */}
      {showModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div
            className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          ></div>
          <div className="relative w-full max-w-md bg-white border-4 border-[#008080] rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden">
            <div className="p-6">
              <div className="flex items-center gap-3 text-[#FF6600] mb-6">
                <AlertCircle size={28} strokeWidth={3} />
                <h3 className="text-[16px] font-[1000] leading-none uppercase tracking-widest">
                  SIMAK KETENTUAN AKUN PASARQU
                </h3>
              </div>
              <div className="bg-slate-50 p-5 rounded-lg border-2 border-slate-100 mb-8 text-[12px] text-slate-700 leading-relaxed normal-case font-bold">
                Dengan mendaftar & menggunakan Pasarqu, saya mengakui telah
                membaca dan menyetujui{" "}
                <Link
                  to="/terms"
                  className="text-[#008080] font-black underline decoration-2"
                >
                  Syarat & Ketentuan
                </Link>{" "}
                &{" "}
                <Link
                  to="/privacy"
                  className="text-[#008080] font-black underline decoration-2"
                >
                  Kebijakan Privasi
                </Link>
                .
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-4 bg-slate-100 text-slate-400 rounded-lg text-[12px] font-[1000] uppercase"
                >
                  BATAL
                </button>
                <button
                  onClick={handleAgree}
                  className="flex-[2] py-4 bg-[#008080] text-white rounded-lg text-[12px] font-[1000] shadow-lg active:scale-95 transition-all uppercase"
                >
                  SETUJU & KIRIM OTP
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MAIN CONTAINER --- */}
      <div className="w-full max-w-[1000px] flex flex-col md:flex-row bg-white md:rounded-[2.5rem] md:shadow-2xl overflow-hidden min-h-screen md:min-h-[600px]">
        {/* BRANDING */}
        <div className="hidden md:flex md:w-1/2 bg-[#008080] p-12 flex-col justify-center text-white relative text-left">
          <div className="absolute -right-20 -bottom-20 opacity-10">
            <ShoppingBag size={400} />
          </div>
          <div className="relative z-10">
            <h1 className="text-5xl font-[1000] leading-none mb-6">
              PASAR<span className="text-orange-400">QU</span> <br /> 2026
            </h1>
            <div className="space-y-6 mt-12 text-sm font-black tracking-widest uppercase">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/10 rounded-xl border border-white/20">
                  <Zap size={20} />
                </div>
                <span>PENDAFTARAN INSTAN</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/10 rounded-xl border border-white/20">
                  <ShieldCheck size={20} />
                </div>
                <span>DATA TERENKRIPSI</span>
              </div>
            </div>
          </div>
        </div>

        {/* FORM */}
        <div className="w-full md:w-1/2 p-6 md:p-12 flex flex-col justify-center bg-white">
          <div className="space-y-6">
            <div className="border-l-4 border-[#008080] pl-4">
              <h3 className="text-2xl font-[1000] text-slate-900 leading-none uppercase">
                BUAT AKUN
              </h3>
              <p className="text-[10px] text-slate-400 mt-2 tracking-widest uppercase font-bold">
                MASUKKAN NOMOR AKTIF ANDA
              </p>
            </div>

            <form
              onSubmit={(e) => triggerConsent("PHONE", e)}
              className="space-y-4"
            >
              <div className="relative">
                <div
                  className={`absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 border-r-2 pr-3 transition-colors ${isInvalid ? "border-red-200" : "border-slate-200"}`}
                >
                  <Phone
                    size={16}
                    className={isInvalid ? "text-red-500" : "text-[#008080]"}
                  />
                  <span
                    className={`text-[12px] font-[1000] ${isInvalid ? "text-red-600" : "text-slate-800"}`}
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
                  className={`w-full pl-24 pr-12 py-4 bg-slate-50 border-2 rounded-2xl text-[14px] font-black outline-none transition-all ${
                    isInvalid
                      ? "border-red-400 focus:border-red-600 bg-red-50/30"
                      : isValid
                        ? "border-teal-400 focus:border-teal-600 bg-teal-50/30"
                        : "border-slate-100 focus:border-[#FF6600]"
                  }`}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  {isValid && (
                    <CheckCircle2
                      size={18}
                      className="text-teal-500 animate-in zoom-in"
                    />
                  )}
                  {isInvalid && <XCircle size={18} className="text-red-500" />}
                </div>
              </div>

              {/* TAMPILKAN HANYA JIKA VALID */}
              {isValid && (
                <p className="text-[9px] text-teal-600 font-[1000] tracking-widest uppercase ml-1 animate-in fade-in slide-in-from-left-2">
                  NOMOR VALID & SIAP DIVERIFIKASI
                </p>
              )}

              <button
                type="submit"
                disabled={isLoading || isInvalid || !phone}
                className="w-full bg-slate-900 text-white py-4 rounded-2xl text-[12px] font-[1000] shadow-xl hover:bg-[#008080] active:scale-95 transition-all flex items-center justify-center gap-2 uppercase tracking-[0.2em] disabled:opacity-30"
              >
                {isLoading ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  "LANJUTKAN PENDAFTARAN"
                )}{" "}
                <ChevronRight size={18} />
              </button>
            </form>

            <div className="relative py-2 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t-2 border-slate-50"></div>
              </div>
              <span className="relative bg-white px-4 text-[9px] text-slate-300 font-black uppercase tracking-widest">
                ATAU GUNAKAN
              </span>
            </div>

            <div className="space-y-2">
              <div onClick={() => triggerConsent("GOOGLE")}>
                <GoogleLoginButton />
              </div>
              <button
                onClick={() => triggerConsent("WHATSAPP")}
                className="w-full flex items-center justify-between px-5 py-4 bg-[#25D366]/5 border-2 border-[#25D366]/10 rounded-2xl hover:opacity-80 transition-all uppercase"
              >
                <div className="flex items-center gap-3">
                  <MessageCircle size={20} className="text-[#25D366]" />
                  <span className="text-[11px] font-black text-[#25D366]">
                    DAFTAR VIA WHATSAPP
                  </span>
                </div>
                <ChevronRight size={14} className="text-slate-300" />
              </button>
            </div>

            <p className="text-[9px] text-slate-400 text-center font-bold px-8 leading-relaxed uppercase tracking-wider">
              DATA ANDA DILINDUNGI OLEH SISTEM KEAMANAN TERPADU PASARQU.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
