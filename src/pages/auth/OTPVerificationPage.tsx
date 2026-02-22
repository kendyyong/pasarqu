import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import {
  ArrowLeft,
  ShieldCheck,
  RefreshCw,
  MessageCircle,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { useToast } from "../../contexts/ToastContext";

export const OTPVerificationPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();

  const phoneNumber = location.state?.phone || "";
  const redirectTarget = location.state?.redirect || "/customer-dashboard";

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(60);
  const [isVerifying, setIsVerifying] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!phoneNumber) {
      navigate("/register");
    }
  }, [phoneNumber, navigate]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleOtpChange = (index: number, value: string) => {
    if (isNaN(Number(value))) return;
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // 🚀 LOGIKA BARU: MEMANGGIL RPC SQL (LEBIH AMAN)
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullOtp = otp.join("");

    if (fullOtp.length < 6) {
      showToast("MASUKKAN 6 DIGIT KODE LENGKAP", "error");
      return;
    }

    setIsVerifying(true);

    try {
      // Panggil fungsi SQL verify_otp_secure yang kita buat tadi
      const { data, error } = await supabase.rpc("verify_otp_secure", {
        p_phone: "62" + phoneNumber,
        p_code: fullOtp,
      });

      if (error) throw error;

      if (data.success) {
        showToast("AKSES DIIZINKAN. SELAMAT DATANG!", "success");
        navigate(redirectTarget);
      } else {
        throw new Error(data.message);
      }
    } catch (err: any) {
      showToast(err.message.toUpperCase(), "error");
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0) return;
    try {
      const { error } = await supabase.functions.invoke("send-otp", {
        body: { phone: "62" + phoneNumber },
      });
      if (error) throw error;
      setTimer(60);
      showToast("KODE BARU TELAH DIKIRIM", "success");
    } catch (err) {
      showToast("GAGAL MENGIRIM ULANG", "error");
    }
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] md:bg-[#008080] flex flex-col items-center justify-center p-0 md:p-6 font-black uppercase tracking-tighter text-left">
      <div className="w-full max-w-md bg-white md:rounded-[2.5rem] md:shadow-2xl overflow-hidden min-h-screen md:min-h-0 flex flex-col">
        {/* HEADER */}
        <div className="p-6 border-b-4 border-slate-100 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 bg-slate-50 rounded-xl text-slate-400 hover:text-[#008080]"
          >
            <ArrowLeft size={22} />
          </button>
          <div>
            <h1 className="text-[16px] leading-none font-[1000] text-slate-900 uppercase">
              VERIFIKASI OTP
            </h1>
            <p className="text-[9px] text-slate-400 mt-1 tracking-widest font-bold uppercase">
              SECURITY GATE PASARQU
            </p>
          </div>
        </div>

        <div className="p-8 flex-1 flex flex-col justify-center">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-teal-50 text-[#008080] rounded-2xl flex items-center justify-center mx-auto mb-4 border-2 border-teal-100 shadow-sm">
              <ShieldCheck size={32} />
            </div>
            <h2 className="text-[14px] text-slate-900 leading-tight normal-case font-bold">
              KAMI TELAH MENGIRIMKAN KODE 6-DIGIT KE NOMOR:
            </h2>
            <div className="mt-2 flex items-center justify-center gap-2 text-[#008080] text-[16px]">
              <MessageCircle
                size={18}
                fill="currentColor"
                className="opacity-20"
              />
              <span>+62 {phoneNumber}</span>
            </div>
          </div>

          <form onSubmit={handleVerify} className="space-y-8">
            <div className="flex justify-between gap-2">
              {otp.map((data, index) => (
                <input
                  key={index}
                  type="text"
                  maxLength={1}
                  ref={(el) => (inputRefs.current[index] = el)}
                  value={data}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  disabled={isVerifying}
                  className="w-full h-14 bg-slate-50 border-2 border-slate-100 rounded-xl text-center text-[20px] font-black text-[#008080] outline-none focus:border-[#FF6600] focus:bg-white transition-all shadow-inner disabled:opacity-50"
                />
              ))}
            </div>

            <div className="space-y-3">
              <button
                type="submit"
                disabled={isVerifying}
                className="w-full bg-slate-900 text-white py-4 rounded-2xl text-[12px] font-[1000] shadow-xl hover:bg-[#008080] active:scale-95 transition-all flex items-center justify-center gap-2 uppercase tracking-[0.2em] disabled:opacity-50"
              >
                {isVerifying ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  "VERIFIKASI SEKARANG"
                )}{" "}
                <ChevronRight size={18} />
              </button>

              <button
                type="button"
                onClick={handleResend}
                disabled={timer > 0 || isVerifying}
                className={`w-full py-2 text-[10px] font-black tracking-widest uppercase flex items-center justify-center gap-2 transition-all ${
                  timer > 0
                    ? "text-slate-300"
                    : "text-[#FF6600] hover:underline"
                }`}
              >
                <RefreshCw
                  size={12}
                  className={timer > 0 ? "" : "animate-spin-slow"}
                />
                {timer > 0
                  ? `KIRIM ULANG DALAM ${timer} DETIK`
                  : "KIRIM ULANG KODE VIA WHATSAPP"}
              </button>
            </div>
          </form>
        </div>

        <div className="p-6 bg-slate-50 border-t-2 border-slate-100">
          <p className="text-[9px] text-slate-400 text-center leading-relaxed font-bold uppercase">
            SISTEM INI DILINDUNGI ENKRIPSI END-TO-END PASARQU DIGITAL INDONESIA.
          </p>
        </div>
      </div>
    </div>
  );
};

export default OTPVerificationPage;
